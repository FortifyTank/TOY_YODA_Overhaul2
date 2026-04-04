// controllers/adminController.js
const Order = require('../models/Order');
const Product = require('../models/Product');

// 1. Fetch All Orders (Logistics)
exports.getAllOrders = async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== 'admin') {
            return res.status(403).json({ error: "> CLASSIFIED: ADMIN CLEARANCE REQUIRED." });
        }
        const allOrders = await Order.find({})
            .sort({ createdAt: -1 })
            .populate('user', 'username email') 
            .populate('items.product', 'imageString sku category'); 

        res.json(allOrders);
    } catch (err) {
        res.status(500).json({ error: "> SYSTEM FAILURE RETRIEVING LOGS." });
    }
};

// 2. Update Order Status
exports.updateOrderStatus = async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });
        
        const { status } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: "Order not found" });

        order.status = status;
        const now = new Date();
        if (!order.timeline) order.timeline = {}; 
        
        if (status === 'PENDING') {
            order.timeline.preparingAt = null;
            order.timeline.shippedAt = null;
            order.timeline.deliveredAt = null;
        } else if (status === 'PREPARING') {
            if (!order.timeline.preparingAt) order.timeline.preparingAt = now;
            order.timeline.shippedAt = null; 
            order.timeline.deliveredAt = null;
        } else if (status === 'ON DELIVERY') {
            if (!order.timeline.shippedAt) order.timeline.shippedAt = now;
            order.timeline.deliveredAt = null; 
        } else if (status === 'DELIVERED') {
            if (!order.timeline.deliveredAt) order.timeline.deliveredAt = now;
        }

        order.timeline.updatedAt = now; 
        await order.save();
        res.json({ message: "> STATUS UPDATED TO: " + status });
    } catch (err) {
        res.status(500).json({ error: "System Error" });
    }
};

// 3. Cancel Order & Restore Inventory
exports.cancelOrder = async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: "Order not found" });
        if (order.status === 'CANCELLED') return res.status(400).json({ error: "Already cancelled." });

        for (let item of order.items) {
            const product = await Product.findById(item.product);
            if (product) {
                product.avail_inventory += item.quantity; 
                product.inStock = true; 
                product.inventoryStatus = product.avail_inventory <= 5 ? 'LOW STOCK' : 'IN STOCK';
                await product.save();
            }
        }

        order.status = 'CANCELLED';
        if (!order.timeline) order.timeline = {};
        order.timeline.cancelledAt = new Date(); 
        await order.save();

        res.json({ message: "> ORDER CANCELLED. INVENTORY RESTORED." });
    } catch (err) {
        res.status(500).json({ error: "System Error" });
    }
};

// 4. Fetch All Products (Armory)
exports.getAllProducts = async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });
        const products = await Product.find({}).sort({ name: 1 });
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: "Armory Fetch Error" });
    }
};

// 5. Toggle Product Archive
exports.toggleArchiveProduct = async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });

        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: "Product not found" });

        product.isArchived = !product.isArchived; 
        product.last_modified = new Date(); 
        await product.save();

        res.json({ message: `> PRODUCT ${product.isArchived ? 'ARCHIVED' : 'RESTORED'}` });
    } catch (err) {
        res.status(500).json({ error: "Archive Toggle Error" });
    }
};

// 6. Quick Stock Adjustment
exports.updateStock = async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });

        const { adjustment } = req.body; 
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: "Product not found" });

        product.avail_inventory = Math.max(0, product.avail_inventory + adjustment);
        product.inStock = product.avail_inventory > 0;
        product.inventoryStatus = product.avail_inventory === 0 ? 'SOLD OUT' : (product.avail_inventory <= 5 ? 'LOW STOCK' : 'IN STOCK');
        product.last_modified = new Date(); 
        
        await product.save();
        res.json({ message: "> STOCK UPDATED", stock: product.avail_inventory });
    } catch (err) {
        res.status(500).json({ error: "Stock Adjustment Error" });
    }
};

// 7. Add New Product
exports.addProduct = async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });

        const { sku, name, category, price, old_price, description, tags, existingImage } = req.body;
        const tagsArray = tags ? tags.split(',').map(tag => tag.trim()) : [];
        const imagePath = req.file ? `/images/products/${req.file.filename}` : (existingImage || '/images/default-placeholder.png');

        const newProduct = new Product({
            sku, name, category, price, old_price, description, 
            imageString: imagePath, 
            avail_inventory: req.body.avail_inventory || 0,
            tags: tagsArray
        });

        await newProduct.save();
        res.json({ message: "> PRODUCT CREATED SUCCESSFULLY", image: imagePath });
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ error: "SKU already exists!" });
        res.status(500).json({ error: "System Error Forging Manifest" });
    }
};

// 8. Edit Product
exports.editProduct = async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });

        const { sku, name, category, price, old_price, description, tags, existingImage } = req.body;
        const tagsArray = tags ? tags.split(',').map(tag => tag.trim()) : [];

        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: "Product not found" });

        if (req.file) {
            product.imageString = `/images/products/${req.file.filename}`;
        } else if (existingImage) {
            product.imageString = existingImage; 
        }

        product.sku = sku;
        product.name = name;
        product.category = category;
        product.price = price;
        product.old_price = old_price;
        product.description = description;
        product.tags = tagsArray;
        product.last_modified = new Date(); 

        product.inStock = product.avail_inventory > 0;
        product.inventoryStatus = product.avail_inventory === 0 ? 'SOLD OUT' : (product.avail_inventory <= 5 ? 'LOW STOCK' : 'IN STOCK');

        await product.save();
        res.json({ message: "> PRODUCT SPECS UPDATED", image: product.imageString });
    } catch (err) {
        res.status(500).json({ error: "System Error Updating Specs" });
    }
};

// 9. Spawn Test Orders (Developer Tool)
exports.spawnTestOrders = async (req, res) => {
    try {
        if (req.session.role !== 'admin') return res.status(403).send("Unauthorized");
        const product = await Product.findOne({});
        if (!product) return res.status(400).send("No products exist to create orders.");

        const statuses = ['PENDING', 'PENDING', 'PENDING', 'PENDING', 'PENDING'];
        for (let stat of statuses) {
            const dateStr = new Date().toLocaleDateString('en-GB', {day:'2-digit', month:'2-digit', year:'2-digit'}).replace(/\//g, '');
            const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase(); 
            
            await new Order({
                orderNumber: `TEST-${dateStr}-${randomCode}`,
                user: req.session.userId, 
                items: [{ product: product._id, name: product.name, quantity: 1, priceAtPurchase: product.price }],
                subtotal: product.price,
                shippingFee: 0,
                totalAmount: product.price,
                shippingAddress: { label: "TEST HQ", addressLine: "123 Sim St", barangay: "Buhay Na Tubig", city: "Imus", province: "Cavite", zipCode: "4103" },
                status: stat,
                paymentStatus: 'UNPAID',
                timeline: { placedAt: new Date(Date.now() - Math.random() * 100000) }
            }).save();
        }
        res.json({ message: "> 5 TEST ORDERS SPAWNED." });
    } catch (err) {
        res.status(500).json({ error: "Error spawning tests." });
    }
};