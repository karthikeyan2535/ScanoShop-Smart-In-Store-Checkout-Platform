const prisma = require('../config/prisma');
const { sendSuccess, sendError, sendCreated } = require('../utils/response');

/**
 * @route GET /products
 * @desc Get all products with optional search + pagination
 * @access Private
 */
const getProducts = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 12 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { barcode: { contains: search } },
        { category: { contains: search } },
      ];
    }
    if (category) where.category = category;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return sendSuccess(res, {
      products,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    return sendError(res, 'Failed to fetch products');
  }
};

/**
 * @route GET /products/:id
 * @desc Get single product
 * @access Private
 */
const getProductById = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!product) return sendError(res, 'Product not found', 404);
    return sendSuccess(res, product);
  } catch (error) {
    return sendError(res, 'Failed to fetch product');
  }
};

/**
 * @route POST /products
 * @desc Create a new product
 * @access Admin
 */
const createProduct = async (req, res) => {
  try {
    const { name, price, stock, barcode, category } = req.body;

    const existing = await prisma.product.findUnique({ where: { barcode } });
    if (existing) return sendError(res, 'Barcode already exists', 409);

    const product = await prisma.product.create({
      data: { name, price: parseFloat(price), stock: parseInt(stock), barcode, category },
    });

    return sendCreated(res, product, 'Product created successfully');
  } catch (error) {
    console.error('Create product error:', error);
    return sendError(res, 'Failed to create product');
  }
};

/**
 * @route PUT /products/:id
 * @desc Update product
 * @access Admin
 */
const updateProduct = async (req, res) => {
  try {
    const { name, price, stock, barcode, category } = req.body;
    const id = parseInt(req.params.id);

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return sendError(res, 'Product not found', 404);

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(stock !== undefined && { stock: parseInt(stock) }),
        ...(barcode && { barcode }),
        ...(category && { category }),
      },
    });

    return sendSuccess(res, updated, 'Product updated successfully');
  } catch (error) {
    console.error('Update product error:', error);
    return sendError(res, 'Failed to update product');
  }
};

/**
 * @route DELETE /products/:id
 * @desc Delete product
 * @access Admin
 */
const deleteProduct = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return sendError(res, 'Product not found', 404);

    await prisma.product.delete({ where: { id } });
    return sendSuccess(res, null, 'Product deleted successfully');
  } catch (error) {
    console.error('Delete product error:', error);
    return sendError(res, 'Failed to delete product');
  }
};

/**
 * @route GET /products/categories
 * @desc Get all unique categories
 * @access Private
 */
const getCategories = async (req, res) => {
  try {
    const categories = await prisma.product.findMany({
      select: { category: true },
      distinct: ['category'],
    });
    return sendSuccess(res, categories.map((c) => c.category));
  } catch (error) {
    return sendError(res, 'Failed to fetch categories');
  }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct, getCategories };
