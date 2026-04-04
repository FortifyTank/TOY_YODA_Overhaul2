// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Map the routes to the controller functions
router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.get('/status', authController.checkStatus);
router.post('/logout', authController.logoutUser);

module.exports = router;