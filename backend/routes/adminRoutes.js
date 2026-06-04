const express = require('express');
const router = express.Router();
const { getStats, getAllOrders, getLowStock } = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('ADMIN'));

router.get('/stats', getStats);
router.get('/orders', getAllOrders);
router.get('/low-stock', getLowStock);

module.exports = router;
