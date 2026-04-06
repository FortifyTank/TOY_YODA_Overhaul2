const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = './public/images/products';
        if (!fs.existsSync(dir)){ fs.mkdirSync(dir, { recursive: true }); }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, req.body.sku + '-' + uniqueSuffix + ext); 
    }
});
const upload = multer({ storage: storage });

router.get('/orders', adminController.getAllOrders);
router.post('/orders/:id/status', adminController.updateOrderStatus);
router.post('/orders/:id/cancel', adminController.cancelOrder);
router.post('/spawn-test', adminController.spawnTestOrders);

router.get('/products', adminController.getAllProducts);
router.post('/products/:id/archive', adminController.toggleArchiveProduct);
router.post('/products/:id/stock', adminController.updateStock);

router.post('/products', upload.single('imageFile'), adminController.addProduct);
router.post('/products/:id/edit', upload.single('imageFile'), adminController.editProduct);

module.exports = router;