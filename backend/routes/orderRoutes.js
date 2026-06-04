const express = require('express');
const router = express.Router();
const { checkout, getUserOrders, getOrderById } = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/checkout', checkout);
router.get('/user', getUserOrders);
router.get('/:id', getOrderById);

module.exports = router;
