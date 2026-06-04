const express = require('express');
const router = express.Router();
const { scanBarcode } = require('../controllers/scanController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.post('/', scanBarcode);

module.exports = router;
