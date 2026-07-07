const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getProducts,
  getProductById,
  getProductByBarcode,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
} = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// All product routes require authentication
router.use(authenticate);

router.get('/categories', getCategories);
router.get('/barcode/:barcode', getProductByBarcode);
router.get('/', getProducts);
router.get('/:id', getProductById);

// Admin-only routes
router.post(
  '/',
  authorize('ADMIN'),
  [
    body('name').trim().notEmpty().withMessage('Product name required'),
    body('price').isFloat({ min: 0 }).withMessage('Valid price required'),
    body('stock').isInt({ min: 0 }).withMessage('Valid stock required'),
    body('barcode').trim().notEmpty().withMessage('Barcode required'),
    body('category').trim().notEmpty().withMessage('Category required'),
    body('imageUrl').optional({ checkFalsy: true }).isURL().withMessage('Valid image URL required'),
  ],
  validate,
  createProduct
);

router.put('/:id', authorize('ADMIN'), updateProduct);
router.delete('/:id', authorize('ADMIN'), deleteProduct);

module.exports = router;
