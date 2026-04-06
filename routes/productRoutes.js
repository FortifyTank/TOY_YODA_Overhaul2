
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/', productController.getAllProducts);
router.get('/sku/:sku', productController.getProductBySku);
router.get('/:id/reviews', productController.getProductReviews);
router.post('/:id/reviews', productController.submitReview);

module.exports = router;