const prisma = require('../config/prisma');
const { sendSuccess, sendError, sendCreated } = require('../utils/response');

/**
 * @route POST /order/checkout
 * @desc Convert cart → order with full MySQL transaction
 * @access Private
 */
const checkout = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get user's cart with items
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: {
          items: {
            include: { product: true },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        throw new Error('CART_EMPTY');
      }

      // 2. Validate stock for each item
      for (const item of cart.items) {
        if (item.product.stock < item.quantity) {
          throw new Error(`INSUFFICIENT_STOCK:${item.product.name}:${item.product.stock}`);
        }
      }

      // 3. Calculate total
      const totalPrice = cart.items.reduce(
        (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
        0
      );

      // 4. Create order
      const order = await tx.order.create({
        data: {
          userId,
          totalPrice: parseFloat(totalPrice.toFixed(2)),
          status: 'PENDING',
        },
      });

      // 5. Create order_items and deduct stock atomically
      for (const item of cart.items) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
          },
        });

        // Deduct stock
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // 6. Mark order as COMPLETED
      const completedOrder = await tx.order.update({
        where: { id: order.id },
        data: { status: 'COMPLETED' },
        include: { items: { include: { product: true } } },
      });

      // 7. Clear cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return completedOrder;
    });

    return sendCreated(res, result, 'Order placed successfully');
  } catch (error) {
    // Handle known transaction errors
    if (error.message === 'CART_EMPTY') {
      return sendError(res, 'Your cart is empty', 400);
    }
    if (error.message.startsWith('INSUFFICIENT_STOCK:')) {
      const parts = error.message.split(':');
      return sendError(res, `Insufficient stock for "${parts[1]}". Available: ${parts[2]}`, 400);
    }

    console.error('Checkout error:', error);
    return sendError(res, 'Checkout failed. Please try again.');
  }
};

/**
 * @route GET /order/user
 * @desc Get user's order history
 * @access Private
 */
const getUserOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId: req.user.id },
        include: {
          items: {
            include: { product: { select: { id: true, name: true, category: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.order.count({ where: { userId: req.user.id } }),
    ]);

    return sendSuccess(res, {
      orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return sendError(res, 'Failed to fetch orders');
  }
};

/**
 * @route GET /order/:id
 * @desc Get single order details
 * @access Private
 */
const getOrderById = async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        items: { include: { product: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!order) return sendError(res, 'Order not found', 404);

    // Ensure user can only view their own orders (unless admin)
    if (order.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return sendError(res, 'Forbidden', 403);
    }

    return sendSuccess(res, order);
  } catch (error) {
    return sendError(res, 'Failed to fetch order');
  }
};

module.exports = { checkout, getUserOrders, getOrderById };
