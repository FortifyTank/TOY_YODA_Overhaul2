const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');           // NEW: Password scrambler
const session = require('express-session'); // NEW: Digital wristband for logged-in users
const multer = require('multer');           // NEW: File uploading engine
const fs = require('fs');                   // Node's built-in file system module

// --- MULTER STORAGE ENGINE ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = './public/images/products';
        // Automatically create the folder if it doesn't exist
        if (!fs.existsSync(dir)){ fs.mkdirSync(dir, { recursive: true }); }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        // Renames the file to "SKU-Timestamp.extension" to prevent overwriting
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, req.body.sku + '-' + uniqueSuffix + ext); 
    }
});
const upload = multer({ storage: storage });

// Import your Database Models
const Product = require('./models/Product');
const User = require('./models/User');
const Order = require('./models/Order');

// Initialize the Express application
const app = express();
const PORT = 3000;

// --- DATABASE CONNECTION ---
const dbURI = "mongodb://playofgamer10_db_user:CHbeLY5tbk1CPx6q@ac-ir6m09r-shard-00-00.5npf8nj.mongodb.net:27017,ac-ir6m09r-shard-00-01.5npf8nj.mongodb.net:27017,ac-ir6m09r-shard-00-02.5npf8nj.mongodb.net:27017/?ssl=true&authSource=admin&retryWrites=true&w=majority";

mongoose.connect(dbURI, { dbName: "toy_yoda" })
    .then(() => console.log(`> DATABASE: MONGODB SECURED AND CONNECTED`))
    .catch((err) => console.log(`> DATABASE ERROR: CONNECTION FAILED`, err));
// ---------------------------

// --- MIDDLEWARE ---
app.use(express.static(path.join(__dirname, 'public')));

// NEW: Tells Express how to read data sent from your frontend forms
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// NEW: Configures the Session (The "Logged In" state)
app.use(session({
    secret: 'tactical_toy_yoda_key_99', // A secret key to encrypt cookies
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to false for localhost, true if using HTTPS
}));

// --- ROUTES (The Controller Logic will go here eventually) ---

// 1. Root Route: Now serves the Dashboard (home.html) as the landing page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'home.html'));
});

// 2. Login Route: Dedicated path for the Checkpoint (index.html)
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// 3. Keep the /home alias so your existing navigation links don't break
app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'home.html'));
});

// Route for the Catalog (products.html)
app.get('/products', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'products.html'));
});

// Route for the Profile
app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'profile.html'));
});

// Route for the Checkout Page
app.get('/checkout', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'checkout.html'));
});

// Fetch the User's Order History
app.get('/api/orders', async (req, res) => {
    try {
        if (!req.session.userId) return res.status(401).json({ error: "> UNAUTHORIZED" });

        // Fetch all orders belonging to this user, sorted by newest first
        const orders = await Order.find({ user: req.session.userId })
            .sort({ createdAt: -1 })
            .populate('items.product', 'imageString'); // Grabs the image from the Product database!

        res.json(orders);
    } catch (err) {
        console.error("Error fetching orders:", err);
        res.status(500).json({ error: "> FAILURE TO RETRIEVE LOGS" });
    }
});

// --- DATA API ROUTES ---

// Get all active products from the database (Hides Archived)
app.get('/api/products', async (req, res) => {
    try {
        // ONLY fetch toys where isArchived is false or doesn't exist
        const products = await Product.find({ isArchived: { $ne: true } }); 
        res.json(products); 
    } catch (err) {
        res.status(500).json({ error: "Failed to load database" });
    }
});

// --- AUTHENTICATION ROUTES ---

// 1. REGISTRATION ROUTE
app.post('/api/register', async (req, res) => {
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

        // FIX: Removed the auto-login session assignment here.
        // Tell the frontend it was successful so it can show the popup.
        res.status(201).json({ message: "> REGISTRATION SUCCESSFUL. PLEASE LOG IN." });

    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ error: "> ERROR: SECTOR REGISTRY OFFLINE" });
    }
});

// 2. LOGIN ROUTE (NEW)
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find the user by email, ENSURING they are not archived/deleted
        const user = await User.findOne({ email: email, isArchived: { $ne: true } });
        if (!user) {
            return res.status(400).json({ error: "> ERROR: ACCOUNT NOT FOUND OR DEACTIVATED" });
        }

        // Compare the typed password with the hashed password in the database
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "> ERROR: INVALID CREDENTIALS" });
        }

        // Give the user their session "wristband"
        req.session.userId = user._id;
        req.session.username = user.username;
        req.session.role = user.role;

        // Send the warp signal to the frontend!
        res.json({ message: "Login successful", redirect: "/home?warp=true" });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ error: "> ERROR: SYSTEM FAILURE" });
    }
});

// 3. AUTHENTICATION STATUS ROUTE (NEW)
app.get('/api/auth/status', (req, res) => {
    // If they have a digital wristband (session)...
    if (req.session && req.session.userId) {
        res.json({ 
            loggedIn: true, 
            username: req.session.username, 
            role: req.session.role 
        });
    } else {
        // If they don't...
        res.json({ loggedIn: false });
    }
});

// 4. LOGOUT ROUTE (NEW)
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: "Failed to logout" });
        }
        res.clearCookie('connect.sid'); // Wipes the cookie from the browser
        res.json({ message: "Logout successful" });
    });
});

// --- PROFILE DATA ROUTES ---

// Fetch the user's full dossier
app.get('/api/profile', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: "> UNAUTHORIZED ACCESS" });
        }
        
        // Find the user by ID, and explicitly exclude their password from the payload
        const user = await User.findById(req.session.userId).select('-password'); 
        
        if (!user) return res.status(404).json({ error: "> CITIZEN NOT FOUND" });

        res.json(user);
    } catch (err) {
        console.error("Profile Fetch Error:", err);
        res.status(500).json({ error: "> SERVER CONNECTION FAILED" });
    }
});

// 2. Update User Data (Phone, Addresses, Equipping, Deleting, Editing)
app.post('/api/profile/update', async (req, res) => {
    try {
        if (!req.session.userId) return res.status(401).json({ error: "> UNAUTHORIZED ACCESS" });

        const { phone, newAddress, equipAddressId, deleteAddressId, editAddressId, editAddressData } = req.body;
        
        const user = await User.findById(req.session.userId);
        if (!user) return res.status(404).json({ error: "> CITIZEN NOT FOUND" });

        // A. Update Phone
        if (phone) user.phone = phone;

        // B. Add New Address
        if (newAddress) {
            newAddress.isEquipped = user.addresses.length === 0; // Auto-equip if it's the first one
            user.addresses.push(newAddress);
        }

        // C. Equip an Address
        if (equipAddressId) {
            user.addresses.forEach(addr => {
                addr.isEquipped = (addr._id.toString() === equipAddressId);
            });
        }

        // D. Delete an Address
        if (deleteAddressId) {
            user.addresses = user.addresses.filter(addr => addr._id.toString() !== deleteAddressId);
            // Auto-equip the top one if they deleted their equipped address
            if (user.addresses.length > 0 && !user.addresses.find(a => a.isEquipped)) {
                user.addresses[0].isEquipped = true;
            }
        }

        // E. Edit an Existing Address
        if (editAddressId && editAddressData) {
            const addrToEdit = user.addresses.id(editAddressId); // Mongoose helper to find by ID inside an array
            if (addrToEdit) {
                addrToEdit.label = editAddressData.label;
                addrToEdit.addressLine = editAddressData.addressLine;
                addrToEdit.barangay = editAddressData.barangay;
                addrToEdit.city = editAddressData.city;
                addrToEdit.province = editAddressData.province;
                addrToEdit.zipCode = editAddressData.zipCode;
            }
        }

        await user.save();
        
        const safeUser = user.toObject();
        delete safeUser.password;

        res.json({ message: "> DOSSIER UPDATED", user: safeUser });

    } catch (err) {
        console.error("Profile Update Error:", err);
        res.status(500).json({ error: "> FAILED TO UPDATE DATABASE" });
    }
});

// 3. Secure Password Change Route
app.post('/api/profile/password', async (req, res) => {
    try {
        if (!req.session.userId) return res.status(401).json({ error: "> UNAUTHORIZED" });

        const { oldPassword, newPassword } = req.body;
        const user = await User.findById(req.session.userId);

        // Verify old password
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) return res.status(400).json({ error: "> INVALID CURRENT PASSWORD" });

        // Hash and save new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ message: "> PASSWORD UPDATED SUCCESSFULLY" });
    } catch (err) {
        console.error("Password Update Error:", err);
        res.status(500).json({ error: "> SYSTEM FAILURE" });
    }
});

app.post('/checkout', async (req, res) => {
    try {
        // 1. Extract payload from the frontend
        const { cart, address } = req.body;
        
        // Ensure user is actually logged in 
        const userId = req.session.userId; 
        if (!userId) return res.status(401).json({ error: "Unauthorized: Please log in." });
        if (!cart || cart.length === 0) return res.status(400).json({ error: "Cart is empty." });

        // 2. Secure Server-Side Math
        let subtotal = 0;
        let validatedItems = [];

        /// Loop through the frontend cart and cross-reference with the real database
        for (let item of cart) {
            const realProduct = await Product.findById(item.productId);
            if (!realProduct) continue; // Skip if they tried to buy a deleted toy

            // NEW SECURITY CHECK: Prevent buying more than what is in the database
            if (realProduct.avail_inventory < item.quantity) {
                return res.status(400).json({ error: `Insufficient stock for ${realProduct.name}.` });
            }

            const itemTotal = realProduct.price * item.quantity;
            subtotal += itemTotal;

            validatedItems.push({
                product: realProduct._id,
                name: realProduct.name,
                quantity: item.quantity,
                priceAtPurchase: realProduct.price // Locks in the price!
            });

            // ==========================================
            // NEW: INVENTORY DEDUCTION ENGINE
            // ==========================================
            // 1. Subtract the purchased amount from the database
            realProduct.avail_inventory -= item.quantity;

            // 2. Auto-update the UI tags based on the new stock levels
            if (realProduct.avail_inventory <= 0) {
                realProduct.inStock = false;
                realProduct.inventoryStatus = 'SOLD OUT';
            } else if (realProduct.avail_inventory <= 5) {
                realProduct.inventoryStatus = 'LOW STOCK'; // Adds the orange ribbon if stock is getting low
            } else {
                realProduct.inventoryStatus = 'IN STOCK';
            }

            // 3. Save the updated toy back to MongoDB
            await realProduct.save();
        }

        // Calculate the official shipping fee
        let shippingFee = subtotal <= 10000 ? subtotal * 0.10 : 0;
        let totalAmount = subtotal + shippingFee;

        // 3. Generate the Tactical Order Number (e.g., OR-030626-X7A9)
        // Gets today's date as DDMMYY
        const dateStr = new Date().toLocaleDateString('en-GB', {day:'2-digit', month:'2-digit', year:'2-digit'}).replace(/\//g, '');
        // Generates 4 random alphanumeric characters
        const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase(); 
        const orderNumber = `OR-${dateStr}-${randomCode}`;

        // 4. Construct the Final Order Document
        const newOrder = new Order({
            orderNumber,
            user: userId,
            items: validatedItems,
            subtotal,
            shippingFee,
            totalAmount,
            shippingAddress: address,
            status: 'PENDING',
            paymentStatus: 'UNPAID',
            timeline: { placedAt: new Date() }
        });

        // 5. Save to MongoDB
        await newOrder.save();

        // Send the success signal back to the frontend!
        res.status(200).json({ 
            message: "Order successfully logged.", 
            orderId: newOrder._id,
            orderNumber: newOrder.orderNumber 
        });

    } catch (error) {
        console.error("Checkout Error:", error);
        res.status(500).json({ error: "Server malfunction during checkout process." });
    }
});

// --- ADMIN ROUTES ---

// 1. Serve the Admin Dashboard
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// 2. Fetch ALL Orders (Admin Clearance Required)
app.get('/api/admin/orders', async (req, res) => {
    try {
        // SECURITY CHECK: Kick them out if they aren't an admin!
        if (!req.session.userId || req.session.role !== 'admin') {
            return res.status(403).json({ error: "> CLASSIFIED: ADMIN CLEARANCE REQUIRED." });
        }

        // Fetch EVERY order in the database, newest first
        const allOrders = await Order.find({})
            .sort({ createdAt: -1 })
            .populate('user', 'username email') // Grabs the buyer's info
            .populate('items.product', 'imageString sku category'); // UPGRADED: Now grabs exact warehouse data!

        res.json(allOrders);
    } catch (err) {
        console.error("Admin Order Fetch Error:", err);
        res.status(500).json({ error: "> SYSTEM FAILURE RETRIEVING LOGS." });
    }
});

// 3. Update Order Status & Specific Timestamps (With Time Travel Rollback)
app.post('/api/admin/orders/:id/status', async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });
        
        const { status } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: "Order not found" });

        order.status = status;
        const now = new Date();
        if (!order.timeline) order.timeline = {}; 
        
        // TIMELINE ROLLBACK LOGIC
        if (status === 'PENDING') {
            order.timeline.preparingAt = null;
            order.timeline.shippedAt = null;
            order.timeline.deliveredAt = null;
        } 
        else if (status === 'PREPARING') {
            if (!order.timeline.preparingAt) order.timeline.preparingAt = now;
            order.timeline.shippedAt = null; // Erases future data if moved backwards!
            order.timeline.deliveredAt = null;
        } 
        else if (status === 'ON DELIVERY') {
            if (!order.timeline.shippedAt) order.timeline.shippedAt = now;
            order.timeline.deliveredAt = null; // Erases future data
        } 
        else if (status === 'DELIVERED') {
            if (!order.timeline.deliveredAt) order.timeline.deliveredAt = now;
        }

        order.timeline.updatedAt = now; // Always stamp the last time it was touched
        await order.save();
        
        res.json({ message: "> STATUS UPDATED TO: " + status });
    } catch (err) {
        res.status(500).json({ error: "System Error" });
    }
});

// 4. Cancel Order & Timestamp
app.post('/api/admin/orders/:id/cancel', async (req, res) => {
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
        order.timeline.cancelledAt = new Date(); // LOG THE CANCELLATION TIME!
        await order.save();

        res.json({ message: "> ORDER CANCELLED. INVENTORY RESTORED." });
    } catch (err) {
        res.status(500).json({ error: "System Error" });
    }
});

// DEVELOPER TOOL: Spawn 5 Random Test Orders
app.post('/api/admin/spawn-test', async (req, res) => {
    try {
        if (req.session.role !== 'admin') return res.status(403).send("Unauthorized");
        
        const product = await Product.findOne({});
        if (!product) return res.status(400).send("No products exist to create orders.");

        // CHANGED: Now spawns 5 PENDING requests so they all land in Tab 1!
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
                timeline: { placedAt: new Date(Date.now() - Math.random() * 100000) } // Reduced random time jump so they look fresh
            }).save();
        }
        res.json({ message: "> 5 TEST ORDERS SPAWNED." });
    } catch (err) {
        res.status(500).json({ error: "Error spawning tests." });
    }
});

// 4. Cancel Order & REVERT INVENTORY
app.post('/api/admin/orders/:id/cancel', async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: "Order not found" });
        if (order.status === 'CANCELLED') return res.status(400).json({ error: "Already cancelled." });

        // Loop through the receipt and ADD the stock back to the warehouse!
        for (let item of order.items) {
            const product = await Product.findById(item.product);
            if (product) {
                product.avail_inventory += item.quantity; // The Mathematical Revert!
                
                // Fix the tags
                product.inStock = true; 
                product.inventoryStatus = product.avail_inventory <= 5 ? 'LOW STOCK' : 'IN STOCK';
                await product.save();
            }
        }

        order.status = 'CANCELLED';
        await order.save();

        res.json({ message: "> ORDER CANCELLED. INVENTORY RESTORED." });
    } catch (err) {
        res.status(500).json({ error: "System Error" });
    }
});

// 5. Fetch ALL Products for Armory (Includes Archived)
app.get('/api/admin/products', async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });
        
        // Fetch everything, sort alphabetically by name
        const products = await Product.find({}).sort({ name: 1 });
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: "Armory Fetch Error" });
    }
});

// 6. Toggle Product Archive State (Soft Delete)
app.post('/api/admin/products/:id/archive', async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });

        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: "Product not found" });

        // Flip the boolean! If true, make it false. If false, make it true.
        product.isArchived = !product.isArchived; 
        product.last_modified = new Date(); // STAMP THE TIME!
        await product.save();

        res.json({ message: `> PRODUCT ${product.isArchived ? 'ARCHIVED' : 'RESTORED'}` });
    } catch (err) {
        res.status(500).json({ error: "Archive Toggle Error" });
    }
});

// 7. Quick Stock Adjustment
app.post('/api/admin/products/:id/stock', async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });

        const { adjustment } = req.body; // e.g., +5 or -2
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: "Product not found" });

        // Apply math, prevent negative stock
        product.avail_inventory = Math.max(0, product.avail_inventory + adjustment);
        
        // Auto-fix tags
        product.inStock = product.avail_inventory > 0;
        product.inventoryStatus = product.avail_inventory === 0 ? 'SOLD OUT' : (product.avail_inventory <= 5 ? 'LOW STOCK' : 'IN STOCK');
        
        product.last_modified = new Date(); // STAMP THE TIME!
        
        await product.save();
        res.json({ message: "> STOCK UPDATED", stock: product.avail_inventory });
    } catch (err) {
        res.status(500).json({ error: "Stock Adjustment Error" });
    }
});

// 8. ADD NEW PRODUCT (Now with Multer File Upload)
app.post('/api/admin/products', upload.single('imageFile'), async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });

        const { sku, name, category, price, old_price, description, tags, existingImage } = req.body;
        const tagsArray = tags ? tags.split(',').map(tag => tag.trim()) : [];
        
        // If they uploaded a new file, use that path. Otherwise, use the existing/placeholder path.
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
});

// 9. EDIT PRODUCT (Now with Multer File Upload)
app.post('/api/admin/products/:id/edit', upload.single('imageFile'), async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });

        const { sku, name, category, price, old_price, description, tags, existingImage } = req.body;
        const tagsArray = tags ? tags.split(',').map(tag => tag.trim()) : [];

        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: "Product not found" });

        // If a new file was uploaded, update the path. Otherwise, keep the old one.
        if (req.file) {
            product.imageString = `/images/products/${req.file.filename}`;
        } else if (existingImage) {
            product.imageString = existingImage; // Keeps existing path if no new file is chosen
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
});

// --- IGNITE SERVER ---
app.listen(PORT, () => {
    console.log(`\n> =======================================`);
    console.log(`> SYSTEM ONLINE: TOY_YODA SERVER ACTIVE`);
    console.log(`> ACCESS POINT: http://localhost:${PORT}`);
    console.log(`> =======================================\n`);
});