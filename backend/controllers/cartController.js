const prisma = require('../config/prisma');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Helper: get or create cart for user
 */
const getOrCreateCart = async (userId) => {
  let cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId } });
  }
  return cart;
};

/**
 * @route GET /cart
 * @desc Get user's cart with items
 * @access Private
 */
const getCart = async (req, res) => {
  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
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

/**
 * @route POST /cart/add
 * @desc Add item to cart (or increment quantity)
 * @access Private
 */
const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = req.user.id;

    // Validate product exists and has stock
    const product = await prisma.product.findUnique({ where: { id: parseInt(productId) } });
    if (!product) return sendError(res, 'Product not found', 404);
    if (product.stock < quantity) {
      return sendError(res, `Insufficient stock. Available: ${product.stock}`, 400);
    }

    const cart = await getOrCreateCart(userId);

    // Check if item already in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId: parseInt(productId) } },
    });

    let cartItem;
    if (existingItem) {
      const newQuantity = existingItem.quantity + parseInt(quantity);
      if (product.stock < newQuantity) {
        return sendError(res, `Insufficient stock. Available: ${product.stock}`, 400);
      }
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
        include: { product: true },
      });
    } else {
      cartItem = await prisma.cartItem.create({
        data: { cartId: cart.id, productId: parseInt(productId), quantity: parseInt(quantity) },
        include: { product: true },
      });
    }

    return sendSuccess(res, cartItem, 'Item added to cart');
  } catch (error) {
    console.error('Add to cart error:', error);
    return sendError(res, 'Failed to add item to cart');
  }
};

/**
 * @route PUT /cart/update
 * @desc Update cart item quantity
 * @access Private
 */
const updateCartItem = async (req, res) => {
  try {
    const { cartItemId, quantity } = req.body;
    const userId = req.user.id;

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: parseInt(cartItemId) },
      include: { cart: true, product: true },
    });

    if (!cartItem || cartItem.cart.userId !== userId) {
      return sendError(res, 'Cart item not found', 404);
    }

    if (parseInt(quantity) <= 0) {
      await prisma.cartItem.delete({ where: { id: cartItem.id } });
      return sendSuccess(res, null, 'Item removed from cart');
    }

    if (cartItem.product.stock < parseInt(quantity)) {
      return sendError(res, `Insufficient stock. Available: ${cartItem.product.stock}`, 400);
    }

    const updated = await prisma.cartItem.update({
      where: { id: cartItem.id },
      data: { quantity: parseInt(quantity) },
      include: { product: true },
    });

    return sendSuccess(res, updated, 'Cart updated');
  } catch (error) {
    console.error('Update cart error:', error);
    return sendError(res, 'Failed to update cart');
  }
};

/**
 * @route DELETE /cart/remove/:id
 * @desc Remove item from cart
 * @access Private
 */
const removeFromCart = async (req, res) => {
  try {
    const cartItemId = parseInt(req.params.id);
    const userId = req.user.id;

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true },
    });

    if (!cartItem || cartItem.cart.userId !== userId) {
      return sendError(res, 'Cart item not found', 404);
    }

    await prisma.cartItem.delete({ where: { id: cartItemId } });
    return sendSuccess(res, null, 'Item removed from cart');
  } catch (error) {
    console.error('Remove from cart error:', error);
    return sendError(res, 'Failed to remove item');
  }
};

/**
 * @route DELETE /cart/clear
 * @desc Clear entire cart
 * @access Private
 */
const clearCart = async (req, res) => {
  try {
    const cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
    return sendSuccess(res, null, 'Cart cleared');
  } catch (error) {
    return sendError(res, 'Failed to clear cart');
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
