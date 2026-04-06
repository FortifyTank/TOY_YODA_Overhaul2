
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.get('/', orderController.getUserOrders);
router.post('/checkout', orderController.processCheckout);

module.exports = router;