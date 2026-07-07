const prisma = require('../config/prisma');
const { sendSuccess, sendError } = require('../utils/response');
const { getCacheStats } = require('../services/cacheService');

/**
 * @route GET /admin/stats
 * @desc Get dashboard statistics
 * @access Admin
 */
const getStats = async (req, res) => {
  try {
    const [
      totalProducts,
      totalOrders,
      totalUsers,
      revenueResult,
      lowStockProducts,
      recentOrders,
      ordersByStatus,
      successfulPayments,
      failedPayments,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.order.count({ where: { status: 'COMPLETED' } }),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.order.aggregate({
        _sum: { totalPrice: true },
        where: { status: 'COMPLETED' },
      }),
      prisma.product.findMany({
        where: { availableStock: { lte: 10 } },
        orderBy: { availableStock: 'asc' },
        take: 10,
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      }),
      prisma.order.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.payment.count({ where: { status: 'SUCCESS' } }),
      prisma.payment.count({ where: { status: 'FAILED' } }),
    ]);

    const totalRevenue = parseFloat(revenueResult._sum.totalPrice || 0);

    return sendSuccess(res, {
      totalProducts,
      totalOrders,
      totalUsers,
      totalRevenue,
      lowStockProducts,
      recentOrders,
      ordersByStatus,
      successfulPayments,
      failedPayments,
      cacheStats: getCacheStats(),
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return sendError(res, 'Failed to fetch admin stats');
  }
};

/**
 * @route GET /admin/orders
 * @desc Get all orders (admin view)
 * @access Admin
 */
const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: {
            include: { product: { select: { id: true, name: true, price: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.order.count({ where }),
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
    console.error('Admin orders error:', error);
    return sendError(res, 'Failed to fetch orders');
  }
};

/**
 * @route GET /admin/products/low-stock
 * @desc Get products with stock <= threshold
 * @access Admin
 */
const getLowStock = async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 10;
    const products = await prisma.product.findMany({
      where: { availableStock: { lte: threshold } },
      orderBy: { availableStock: 'asc' },
    });
    return sendSuccess(res, products);
  } catch (error) {
    return sendError(res, 'Failed to fetch low stock products');
  }
};

module.exports = { getStats, getAllOrders, getLowStock };
