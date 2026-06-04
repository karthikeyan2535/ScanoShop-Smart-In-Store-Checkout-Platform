const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart } = require('../controllers/cartController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getCart);
router.post('/add', addToCart);
router.put('/update', updateCartItem);
router.delete('/remove/:id', removeFromCart);
router.delete('/clear', clearCart);

module.exports = router;
