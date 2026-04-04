// controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcrypt');

// 1. Register a new user
exports.registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const existingUser = await User.findOne({ $or: [{ email: email }, { username: username }] });
        if (existingUser) {
            return res.status(400).json({ error: "> ERROR: DOSSIER ALREADY EXISTS" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            username: username,
            email: email,
            password: hashedPassword
        });
        await newUser.save();

        res.status(201).json({ message: "> REGISTRATION SUCCESSFUL. PLEASE LOG IN." });
    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ error: "> ERROR: SECTOR REGISTRY OFFLINE" });
    }
};

// 2. Log in a user
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email: email, isArchived: { $ne: true } });
        if (!user) {
            return res.status(400).json({ error: "> ERROR: ACCOUNT NOT FOUND OR DEACTIVATED" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "> ERROR: INVALID CREDENTIALS" });
        }

        req.session.userId = user._id;
        req.session.username = user.username;
        req.session.role = user.role;

        res.json({ message: "Login successful", redirect: "/home?warp=true" });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ error: "> ERROR: SYSTEM FAILURE" });
    }
};

// 3. Check Auth Status (For the UI buttons)
exports.checkStatus = (req, res) => {
    if (req.session && req.session.userId) {
        res.json({ 
            loggedIn: true, 
            username: req.session.username, 
            role: req.session.role 
        });
    } else {
        res.json({ loggedIn: false });
    }
};

// 4. Log out a user
exports.logoutUser = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: "Failed to logout" });
        }
        res.clearCookie('connect.sid'); 
        res.json({ message: "Logout successful" });
    });
};