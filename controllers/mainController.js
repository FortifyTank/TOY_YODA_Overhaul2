const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const bcrypt = require('bcrypt');
const path = require('path');

const mainController = {
    // for the vieeeewsssss
    getIndex: (req, res) => res.sendFile(path.join(__dirname, '../views/index.html')),
    getHome: (req, res) => res.sendFile(path.join(__dirname, '../views/home.html')),
    getProductsPage: (req, res) => res.sendFile(path.join(__dirname, '../views/products.html')),
    getProfilePage: (req, res) => res.sendFile(path.join(__dirname, '../views/profile.html')),
    getCheckoutPage: (req, res) => res.sendFile(path.join(__dirname, '../views/checkout.html')),
    getProductDetailPage: (req, res) => res.sendFile(path.join(__dirname, '../views/product.html')),
    getAdminPage: (req, res) => res.sendFile(path.join(__dirname, '../views/admin.html')),
    getAboutPage: (req, res) => res.sendFile(path.join(__dirname, '../views/about.html')),

    // authetnication
    postRegister: async (req, res) => {
        try {
            const { username, email, password } = req.body;
            const existingUser = await User.findOne({ $or: [{ email }, { username }] });
            if (existingUser) return res.status(400).json({ error: "> ERROR: DOSSIER ALREADY EXISTS" });
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            const newUser = new User({ username, email, password: hashedPassword });
            await newUser.save();
            res.status(201).json({ message: "> REGISTRATION SUCCESSFUL. PLEASE LOG IN." });
        } catch (error) {
            res.status(500).json({ error: "> ERROR: SECTOR REGISTRY OFFLINE" });
        }
    },

    postLogin: async (req, res) => {
        try {
            const { email, password } = req.body;
            const user = await User.findOne({ email, isArchived: { $ne: true } });
            if (!user) return res.status(400).json({ error: "> ERROR: ACCOUNT NOT FOUND" });
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(400).json({ error: "> ERROR: INVALID CREDENTIALS" });
            req.session.userId = user._id;
            req.session.username = user.username;
            req.session.role = user.role;
            res.json({ message: "Login successful", redirect: "/home?warp=true" });
        } catch (err) {
            res.status(500).json({ error: "> ERROR: SYSTEM FAILURE" });
        }
    },

    getAuthStatus: (req, res) => {
        if (req.session && req.session.userId) {
            res.json({ loggedIn: true, username: req.session.username, role: req.session.role });
        } else {
            res.json({ loggedIn: false });
        }
    },

    postLogout: (req, res) => {
        req.session.destroy((err) => {
            if (err) return res.status(500).json({ error: "Logout failed" });
            res.clearCookie('connect.sid');
            res.json({ message: "Logout successful" });
        });
    },

    // user profile + orders
    getProfile: async (req, res) => {
        try {
            if (!req.session.userId) return res.status(401).json({ error: "> UNAUTHORIZED" });
            const user = await User.findById(req.session.userId).select('-password');
            res.json(user);
        } catch (err) {
            res.status(500).json({ error: "> SERVER CONNECTION FAILED" });
        }
    },

    updateProfile: async (req, res) => {
        try {
            const { phone, newAddress, equipAddressId, deleteAddressId, editAddressId, editAddressData } = req.body;
            const user = await User.findById(req.session.userId);
            if (phone) user.phone = phone;
            if (newAddress) {
                newAddress.isEquipped = user.addresses.length === 0;
                user.addresses.push(newAddress);
            }
            if (equipAddressId) user.addresses.forEach(addr => addr.isEquipped = (addr._id.toString() === equipAddressId));
            if (deleteAddressId) {
                user.addresses = user.addresses.filter(addr => addr._id.toString() !== deleteAddressId);
                if (user.addresses.length > 0 && !user.addresses.find(a => a.isEquipped)) user.addresses[0].isEquipped = true;
            }
            if (editAddressId && editAddressData) {
                const addrToEdit = user.addresses.id(editAddressId);
                if (addrToEdit) Object.assign(addrToEdit, editAddressData);
            }
            await user.save();
            res.json({ message: "> DOSSIER UPDATED" });
        } catch (err) {
            res.status(500).json({ error: "> FAILED TO UPDATE DATABASE" });
        }
    },

    getUserOrders: async (req, res) => {
        try {
            const orders = await Order.find({ user: req.session.userId }).sort({ createdAt: -1 }).populate('items.product', 'imageString');
            res.json(orders);
        } catch (err) {
            res.status(500).json({ error: "> FAILURE TO RETRIEVE LOGS" });
        }
    },

    // products + checkout
    getProducts: async (req, res) => {
        try {
            const products = await Product.find({ isArchived: { $ne: true } });
            res.json(products);
        } catch (err) {
            res.status(500).json({ error: "Database failure" });
        }
    },

    postCheckout: async (req, res) => {
        try {
            const { cart, address } = req.body;
            let subtotal = 0;
            let validatedItems = [];
            for (let item of cart) {
                const realProduct = await Product.findById(item.productId);
                if (!realProduct || realProduct.avail_inventory < item.quantity) return res.status(400).json({ error: "Stock error" });
                subtotal += realProduct.price * item.quantity;
                validatedItems.push({ product: realProduct._id, name: realProduct.name, quantity: item.quantity, priceAtPurchase: realProduct.price });
                realProduct.avail_inventory -= item.quantity;
                await realProduct.save();
            }
            const shippingFee = subtotal <= 10000 ? subtotal * 0.1 : 0;
            const orderNumber = `OR-${Date.now()}`;
            const newOrder = new Order({ orderNumber, user: req.session.userId, items: validatedItems, subtotal, shippingFee, totalAmount: subtotal + shippingFee, shippingAddress: address });
            await newOrder.save();
            res.status(200).json({ message: "Success", orderNumber });
        } catch (error) {
            res.status(500).json({ error: "Checkout failure" });
        }
    },

    // admin tools
    adminGetOrders: async (req, res) => {
        try {
            const allOrders = await Order.find({}).sort({ createdAt: -1 }).populate('user', 'username email').populate('items.product', 'imageString sku category');
            res.json(allOrders);
        } catch (err) {
            res.status(500).json({ error: "Admin Order Fetch Error" });
        }
    },

    adminUpdateStatus: async (req, res) => {
        try {
            const { status } = req.body;
            const order = await Order.findById(req.params.id);
            order.status = status;
            const now = new Date();
            if (status === 'PREPARING') order.timeline.preparingAt = now;
            if (status === 'ON DELIVERY') order.timeline.shippedAt = now;
            if (status === 'DELIVERED') order.timeline.deliveredAt = now;
            await order.save();
            res.json({ message: "> STATUS UPDATED" });
        } catch (err) {
            res.status(500).json({ error: "Update Error" });
        }
    },

    adminAddProduct: async (req, res) => {
        try {
            const { sku, name, category, price, old_price, description, tags, existingImage } = req.body;
            const imagePath = req.file ? `/images/products/${req.file.filename}` : (existingImage || '/images/default-placeholder.png');
            const newProduct = new Product({ sku, name, category, price, old_price, description, imageString: imagePath, avail_inventory: req.body.avail_inventory || 0, tags: tags ? tags.split(',') : [] });
            await newProduct.save();
            res.json({ message: "> PRODUCT CREATED", image: imagePath });
        } catch (err) {
            res.status(500).json({ error: "Forge Failed" });
        }
    },
    
};

module.exports = mainController;