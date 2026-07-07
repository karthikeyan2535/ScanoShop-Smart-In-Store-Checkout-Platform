const prisma = require('../config/prisma');
const { sendSuccess, sendError } = require('../utils/response');
const { emitInventoryUpdate, emitAdminUpdate } = require('../services/socketService');

const RESERVATION_MINUTES = 30;

const getReservationTime = () => new Date(Date.now() + RESERVATION_MINUTES * 60000);

const getOrCreateCart = async (userId, tx = prisma) => {
  let cart = await tx.cart.findUnique({ where: { userId } });
  if (!cart) {
    cart = await tx.cart.create({ data: { userId } });
  }
  return cart;
};

const getCart = async (req, res) => {
  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: { items: { include: { product: true } } },
    });

    if (!cart) {
      return sendSuccess(res, { items: [], total: 0 });
    }

    const total = cart.items.reduce(
      (sum, item) => sum + parseFloat(item.product.price) * item.quantity,
      0
    );

    return sendSuccess(res, { ...cart, total: parseFloat(total.toFixed(2)) });
  } catch (error) {
    console.error('Get cart error:', error);
    return sendError(res, 'Failed to fetch cart');
  }
};

const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = req.user.id;
    const qty = parseInt(quantity);

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: parseInt(productId) } });
      if (!product) throw new Error('Product not found');

      // Atomic update to prevent negative stock
      const updateResult = await tx.product.updateMany({
        where: { id: product.id, availableStock: { gte: qty } },
        data: {
          availableStock: { decrement: qty },
          reservedStock: { increment: qty },
        },
      });

      if (updateResult.count === 0) {
        throw new Error(`Insufficient stock.`);
      }

      const cart = await getOrCreateCart(userId, tx);
      const existingItem = await tx.cartItem.findUnique({
        where: { cartId_productId: { cartId: cart.id, productId: parseInt(productId) } },
      });

      let cartItem;
      if (existingItem) {
        cartItem = await tx.cartItem.update({
          where: { id: existingItem.id },
          data: { 
            quantity: existingItem.quantity + qty,
            reservedUntil: getReservationTime() 
          },
          include: { product: true },
        });
      } else {
        cartItem = await tx.cartItem.create({
          data: { 
            cartId: cart.id, 
            productId: parseInt(productId), 
            quantity: qty,
            reservedUntil: getReservationTime()
          },
          include: { product: true },
        });
      }

      const updatedProduct = await tx.product.findUnique({ where: { id: product.id } });

      return { cartItem, updatedProduct };
    });

    emitInventoryUpdate(result.updatedProduct.id, result.updatedProduct.availableStock, result.updatedProduct.reservedStock);
    emitAdminUpdate();

    return sendSuccess(res, result.cartItem, 'Item added to cart');
  } catch (error) {
    console.error('Add to cart error:', error);
    return sendError(res, error.message || 'Failed to add item to cart', 400);
  }
};

const updateCartItem = async (req, res) => {
  try {
    const { cartItemId, quantity } = req.body;
    const userId = req.user.id;
    const newQty = parseInt(quantity);

    const result = await prisma.$transaction(async (tx) => {
      const cartItem = await tx.cartItem.findUnique({
        where: { id: parseInt(cartItemId) },
        include: { cart: true, product: true },
      });

      if (!cartItem || cartItem.cart.userId !== userId) {
        throw new Error('Cart item not found');
      }

      const qtyDifference = newQty - cartItem.quantity;

      if (newQty <= 0) {
        await tx.cartItem.delete({ where: { id: cartItem.id } });
        const p = await tx.product.update({
          where: { id: cartItem.productId },
          data: {
            availableStock: { increment: cartItem.quantity },
            reservedStock: { decrement: cartItem.quantity },
          },
        });
        return { removed: true, updatedProduct: p };
      }

      if (qtyDifference > 0) {
        const updateResult = await tx.product.updateMany({
          where: { id: cartItem.productId, availableStock: { gte: qtyDifference } },
          data: {
            availableStock: { decrement: qtyDifference },
            reservedStock: { increment: qtyDifference },
          },
        });
        if (updateResult.count === 0) {
          throw new Error(`Insufficient stock.`);
        }
      }

      const updated = await tx.cartItem.update({
        where: { id: cartItem.id },
        data: { 
          quantity: newQty,
          reservedUntil: getReservationTime()
        },
        include: { product: true },
      });

      let updatedProduct = null;
      if (qtyDifference !== 0) {
        if (qtyDifference < 0) {
          updatedProduct = await tx.product.update({
            where: { id: cartItem.productId },
            data: {
              availableStock: { decrement: qtyDifference }, // it's negative, so double negative is positive
              reservedStock: { increment: qtyDifference },
            },
          });
        } else {
          updatedProduct = await tx.product.findUnique({ where: { id: cartItem.productId } });
        }
      }

      return { updated, removed: false, updatedProduct };
    });

    if (result.updatedProduct) {
      emitInventoryUpdate(result.updatedProduct.id, result.updatedProduct.availableStock, result.updatedProduct.reservedStock);
      emitAdminUpdate();
    }

    if (result.removed) {
      return sendSuccess(res, null, 'Item removed from cart');
    }
    return sendSuccess(res, result, 'Cart updated');
  } catch (error) {
    console.error('Update cart error:', error);
    return sendError(res, error.message || 'Failed to update cart', 400);
  }
};

const removeFromCart = async (req, res) => {
  try {
    const cartItemId = parseInt(req.params.id);
    const userId = req.user.id;

    const result = await prisma.$transaction(async (tx) => {
      const cartItem = await tx.cartItem.findUnique({
        where: { id: cartItemId },
        include: { cart: true },
      });

      if (!cartItem || cartItem.cart.userId !== userId) {
        throw new Error('Cart item not found');
      }

      await tx.cartItem.delete({ where: { id: cartItemId } });
      const updatedProduct = await tx.product.update({
        where: { id: cartItem.productId },
        data: {
          availableStock: { increment: cartItem.quantity },
          reservedStock: { decrement: cartItem.quantity },
        },
      });
      return updatedProduct;
    });

    emitInventoryUpdate(result.id, result.availableStock, result.reservedStock);
    emitAdminUpdate();

    return sendSuccess(res, null, 'Item removed from cart');
  } catch (error) {
    console.error('Remove from cart error:', error);
    return sendError(res, error.message || 'Failed to remove item', 400);
  }
};

const clearCart = async (req, res) => {
  try {
    const updatedProducts = await prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { userId: req.user.id },
        include: { items: true },
      });

      const prods = [];
      if (cart && cart.items.length > 0) {
        for (const item of cart.items) {
          const p = await tx.product.update({
            where: { id: item.productId },
            data: {
              availableStock: { increment: item.quantity },
              reservedStock: { decrement: item.quantity },
            },
          });
          prods.push(p);
        }
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      }
      return prods;
    });

    for (const p of updatedProducts) {
      emitInventoryUpdate(p.id, p.availableStock, p.reservedStock);
    }
    if (updatedProducts.length > 0) emitAdminUpdate();

    return sendSuccess(res, null, 'Cart cleared');
  } catch (error) {
    console.error('Clear cart error:', error);
    return sendError(res, 'Failed to clear cart');
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
