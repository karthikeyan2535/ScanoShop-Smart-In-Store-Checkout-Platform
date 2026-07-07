const prisma = require('../config/prisma');
const { sendSuccess, sendError, sendCreated } = require('../utils/response');
const { createRazorpayOrder, verifyRazorpaySignature } = require('../services/paymentService');
const { emitInventoryUpdate, emitOrderCreated, emitAdminUpdate } = require('../services/socketService');

/**
 * @route POST /payments/create-order
 * @desc Create order and Razorpay order
 * @access Private
 */
const createOrder = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: { items: { include: { product: true } } },
      });

      if (!cart || cart.items.length === 0) {
        throw new Error('CART_EMPTY');
      }

      // Validate reservations
      const now = new Date();
      for (const item of cart.items) {
        if (!item.reservedUntil || item.reservedUntil < now) {
          throw new Error(`RESERVATION_EXPIRED:${item.product.name}`);
        }
      }

      const totalPrice = cart.items.reduce(
        (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
        0
      );

      // Create PENDING order
      const order = await tx.order.create({
        data: {
          userId,
          totalPrice: parseFloat(totalPrice.toFixed(2)),
          status: 'PENDING',
        },
      });

      // Create order_items but DO NOT deduct stock yet
      for (const item of cart.items) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
          },
        });
      }

      return { order, totalPrice };
    });

    // Outside transaction, call Razorpay
    const rzpOrder = await createRazorpayOrder(result.order.id, result.totalPrice);

    return sendCreated(res, {
      order: result.order,
      razorpayOrder: rzpOrder,
    }, 'Order created successfully');
    
  } catch (error) {
    if (error.message === 'CART_EMPTY') {
      return sendError(res, 'Your cart is empty', 400);
    }
    if (error.message.startsWith('RESERVATION_EXPIRED:')) {
      const parts = error.message.split(':');
      return sendError(res, `Reservation expired for "${parts[1]}". Please update your cart.`, 400);
    }

    console.error('Create order error:', error);
    return sendError(res, 'Failed to create order');
  }
};

/**
 * @route POST /payments/verify
 * @desc Verify Razorpay payment, finalize order, deduct stock
 * @access Private
 */
const verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
  const userId = req.user.id;

  try {
    // 1. Verify Signature
    await verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

    // 2. Finalize Order & Stock inside transaction
    const finalizedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: parseInt(orderId) },
        include: { items: true },
      });

      if (!order || order.userId !== userId) {
        throw new Error('Invalid order');
      }

      if (order.status === 'COMPLETED') {
        return order; // Already processed
      }

      // Deduct reserved stock
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { reservedStock: { decrement: item.quantity } },
        });
      }

      // Update order to COMPLETED
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: { status: 'COMPLETED' },
      });

      // Clear cart
      const cart = await tx.cart.findUnique({ where: { userId } });
      if (cart) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      }

      // Fetch updated products to emit events
      const updatedProducts = [];
      for (const item of order.items) {
        const prod = await tx.product.findUnique({ where: { id: item.productId } });
        if (prod) updatedProducts.push(prod);
      }

      return { updatedOrder, updatedProducts };
    });

    // Emit socket events
    emitOrderCreated(finalizedOrder.updatedOrder.id, finalizedOrder.updatedOrder.totalPrice);
    emitAdminUpdate();
    for (const p of finalizedOrder.updatedProducts) {
      emitInventoryUpdate(p.id, p.availableStock, p.reservedStock);
    }

    return sendSuccess(res, finalizedOrder.updatedOrder, 'Payment verified and order completed');
  } catch (error) {
    console.error('Payment verification error:', error);
    
    if (error.message === 'Invalid signature') {
      // Mark payment as FAILED
      await prisma.payment.updateMany({
        where: { razorpayOrderId: razorpay_order_id },
        data: { status: 'FAILED' },
      });
      // Order remains PENDING or could be marked FAILED
      await prisma.order.update({
        where: { id: parseInt(orderId) },
        data: { status: 'FAILED' },
      });
      
      return sendError(res, 'Invalid payment signature', 400);
    }
    
    return sendError(res, 'Payment verification failed', 500);
  }
};

module.exports = { createOrder, verifyPayment };
