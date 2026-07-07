const prisma = require('../config/prisma');
const { sendSuccess, sendError, sendCreated } = require('../utils/response');
const { getFromCache, setInCache, invalidateCache } = require('../services/cacheService');

/**
 * @route GET /products
 * @desc Get all products with optional search + pagination
 * @access Private
 */
const getProducts = async (req, res) => {
  try {
    const { search = '', category = '', page = 1, limit = 12 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Cache key for products list
    const cacheKey = `products:page:${page}:limit:${limit}:search:${search}:category:${category}`;
    
    const cachedData = await getFromCache(cacheKey);
    if (cachedData) {
      return sendSuccess(res, cachedData, 'Fetched from cache');
    }

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

    const result = {
      products,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };

    // Store in cache with 5 mins TTL
    await setInCache(cacheKey, result, 300);

    return sendSuccess(res, result);
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
    const id = parseInt(req.params.id);
    const cacheKey = `product:${id}`;

    const cachedProduct = await getFromCache(cacheKey);
    if (cachedProduct) {
      return sendSuccess(res, cachedProduct, 'Fetched from cache');
    }

    const product = await prisma.product.findUnique({
      where: { id },
    });
    if (!product) return sendError(res, 'Product not found', 404);

    // 10 mins TTL
    await setInCache(cacheKey, product, 600);

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
    const { name, price, availableStock, barcode, category, imageUrl } = req.body;

    const existing = await prisma.product.findUnique({ where: { barcode } });
    if (existing) return sendError(res, 'Barcode already exists', 409);

    const product = await prisma.product.create({
      data: { 
        name, 
        price: parseFloat(price), 
        availableStock: parseInt(availableStock !== undefined ? availableStock : req.body.stock || 0), 
        barcode, 
        category,
        imageUrl: imageUrl || null
      },
    });

    // Invalidate caches
    await invalidateCache('products:*');
    await invalidateCache('categories');

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
    const { name, price, availableStock, barcode, category, imageUrl } = req.body;
    const id = parseInt(req.params.id);

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return sendError(res, 'Product not found', 404);

    const stockToUpdate = availableStock !== undefined ? parseInt(availableStock) : (req.body.stock !== undefined ? parseInt(req.body.stock) : undefined);

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(stockToUpdate !== undefined && { availableStock: stockToUpdate }),
        ...(barcode && { barcode }),
        ...(category && { category }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
      },
    });

    // Invalidate caches
    await invalidateCache('products:*');
    await invalidateCache(`product:${id}`);
    await invalidateCache('categories');

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

    // Invalidate caches
    await invalidateCache('products:*');
    await invalidateCache(`product:${id}`);
    await invalidateCache('categories');

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
    const cacheKey = 'categories';
    const cachedCategories = await getFromCache(cacheKey);
    if (cachedCategories) {
      return sendSuccess(res, cachedCategories, 'Fetched from cache');
    }

    const categories = await prisma.product.findMany({
      select: { category: true },
      distinct: ['category'],
    });
    
    const result = categories.map((c) => c.category);
    
    // 30 mins TTL
    await setInCache(cacheKey, result, 1800);

    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, 'Failed to fetch categories');
  }
};
/**
 * @route GET /products/barcode/:barcode
 * @desc Get single product by barcode
 * @access Private
 */
const getProductByBarcode = async (req, res) => {
  try {
    const barcode = req.params.barcode;
    const cacheKey = `product:barcode:${barcode}`;

    const cachedProduct = await getFromCache(cacheKey);
    if (cachedProduct) {
      return sendSuccess(res, cachedProduct, 'Fetched from cache');
    }

    const product = await prisma.product.findUnique({
      where: { barcode },
    });
    
    if (!product) return sendError(res, 'Product not found', 404);

    // 10 mins TTL
    await setInCache(cacheKey, product, 600);

    return sendSuccess(res, product);
  } catch (error) {
    return sendError(res, 'Failed to fetch product by barcode');
  }
};

module.exports = { getProducts, getProductById, getProductByBarcode, createProduct, updateProduct, deleteProduct, getCategories };
