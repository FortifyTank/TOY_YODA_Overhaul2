// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/', userController.getUserProfile);
router.post('/update', userController.updateUserProfile);
router.post('/password', userController.updateUserPassword);

module.exports = router;