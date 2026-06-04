const prisma = require('../config/prisma');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * @route POST /scan
 * @desc Simulate barcode scan — fetch product + add to cart
 * @access Private
 */
const scanBarcode = async (req, res) => {
  try {
    const { barcode } = req.body;
    const userId = req.user.id;

    if (!barcode || !barcode.trim()) {
      return sendError(res, 'Barcode is required', 400);
    }

    // Find product by barcode
    const product = await prisma.product.findUnique({
      where: { barcode: barcode.trim() },
    });

    if (!product) {
      return sendError(res, `No product found with barcode: ${barcode}`, 404);
    }

    if (product.stock <= 0) {
      return sendError(res, 'Product is out of stock', 400);
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }

    // Check if already in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId: product.id } },
    });

    let cartItem;
    if (existingItem) {
      const newQty = existingItem.quantity + 1;
      if (product.stock < newQty) {
        return sendError(res, `Only ${product.stock} unit(s) available in stock`, 400);
      }
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQty },
        include: { product: true },
      });
    } else {
      cartItem = await prisma.cartItem.create({
        data: { cartId: cart.id, productId: product.id, quantity: 1 },
        include: { product: true },
      });
    }

    return sendSuccess(res, { product, cartItem }, `"${product.name}" scanned and added to cart`);
  } catch (error) {
    console.error('Scan error:', error);
    return sendError(res, 'Scan failed');
  }
};

module.exports = { scanBarcode };
