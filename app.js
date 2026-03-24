const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const multer = require('multer');
const fs = require('fs');

// multer storage engine 
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = './public/images/products';
        // creates folder if it doesnt exist 
        if (!fs.existsSync(dir)){ fs.mkdirSync(dir, { recursive: true }); }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        // renames file to "SKU-Timestamp.extension" so it doesnt overwrite
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, req.body.sku + '-' + uniqueSuffix + ext); 
    }
});
const upload = multer({ storage: storage });

// import DB models
const Product = require('./models/Product');
const User = require('./models/User');
const Order = require('./models/Order');
const Review = require('./models/Review');
const Message = require('./models/Message');

// initializes express 
const app = express();
const PORT = 3000;

// database connection
const dbURI = "mongodb://playofgamer10_db_user:CHbeLY5tbk1CPx6q@ac-ir6m09r-shard-00-00.5npf8nj.mongodb.net:27017,ac-ir6m09r-shard-00-01.5npf8nj.mongodb.net:27017,ac-ir6m09r-shard-00-02.5npf8nj.mongodb.net:27017/?ssl=true&authSource=admin&retryWrites=true&w=majority";

mongoose.connect(dbURI, { dbName: "toy_yoda" })
    .then(() => console.log(`> DATABASE: MONGODB SECURED AND CONNECTED`))
    .catch((err) => console.log(`> DATABASE ERROR: CONNECTION FAILED`, err));

// middleware
app.use(express.static(path.join(__dirname, 'public')));

// tells express how to read data sent from frontend forms
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// configures session (logged in state)
app.use(session({
    secret: 'tactical_toy_yoda_key_99', // secret key to encrypt cookies
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // set to false for localhost, true if using HTTPS
}));

// == IMPORTANT routes ==

// route for dashboard 
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'home.html'));
});

// route for logging in
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// route for home when the user has logged in
app.get('/home', (req, res) => { 
    res.sendFile(path.join(__dirname, 'views', 'home.html'));
});

// route for product catalogue
app.get('/products', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'products.html'));
});

// route for user profile
app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'profile.html'));
});

//route for checkout page
app.get('/checkout', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'checkout.html'));
});

// route for dedicated product page
app.get('/product', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'product.html'));
});

// route for community chat page
app.get('/community', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'community.html'));
});

// route for the about page
app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'about.html'));
});

// Get User's Orders
app.get('/api/orders', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) return res.status(401).json({ error: "Please log in." });

        // THE FIX: Added .populate('items.product') right after the find() command!
        const orders = await Order.find({ user: userId })
            .populate('items.product') 
            .sort({ createdAt: -1 });

        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: "Failed to load orders." });
    }
});

// == data API ==

// gets all products that are not archived for catalog page
app.get('/api/products', async (req, res) => {
    try {
        // .lean() makes the data easier to modify before sending it to the frontend
        const products = await Product.find({ isArchived: { $ne: true } }).lean(); 
        const reviews = await Review.find(); // Fetch all reviews

        // Loop through each product and attach its average rating
        products.forEach(p => {
            const pReviews = reviews.filter(r => r.product.toString() === p._id.toString());
            p.reviewCount = pReviews.length;
            
            if (p.reviewCount > 0) {
                const sum = pReviews.reduce((acc, rev) => acc + rev.rating, 0);
                p.averageRating = (sum / p.reviewCount).toFixed(1);
            } else {
                p.averageRating = '0.0';
            }

            // THE FAILSAFE FIX: Force the server to mathematically check the inventory
            // just in case the 'inStock' tag is missing from older database entries!
            p.inStock = p.avail_inventory > 0; 
        });

        res.json(products); 
    } catch (err) {
        res.status(500).json({ error: "Failed to load database" });
    }
});

// fetches a single product by its SKU for the View Details page
app.get('/api/products/sku/:sku', async (req, res) => {
    try {
        // finds one toy that matches the SKU and is NOT archived
        const product = await Product.findOne({ sku: req.params.sku, isArchived: { $ne: true } });
        if (!product) return res.status(404).json({ error: "> CLASSIFIED: PRODUCT NOT FOUND." });
        
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: "> SYSTEM FAILURE" });
    }
});

// ==========================================
// REVIEWS ENGINE
// ==========================================

// 1. Fetch reviews and calculate average for a specific product
app.get('/api/products/:id/reviews', async (req, res) => {
    try {
        const reviews = await Review.find({ product: req.params.id }).sort({ createdAt: -1 });
        
        // Calculate the average star rating on the fly!
        let average = 0;
        if (reviews.length > 0) {
            const sum = reviews.reduce((acc, rev) => acc + rev.rating, 0);
            average = (sum / reviews.length).toFixed(1); // e.g., 4.2
        }

        res.json({ reviews, average, total: reviews.length });
    } catch (err) {
        res.status(500).json({ error: "> ERROR FETCHING REVIEWS" });
    }
});

// 2. Submit a new review (Must be a Verified Buyer)
app.post('/api/products/:id/reviews', async (req, res) => {
    try {
        const userId = req.session.userId;
        const productId = req.params.id;
        const { rating, comment } = req.body;

        if (!userId) return res.status(401).json({ error: "> UNAUTHORIZED: PLEASE LOG IN" });
        if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: "> INVALID RATING" });
        if (!comment) return res.status(400).json({ error: "> COMMENT REQUIRED" });

        // THE SECURITY LOCK: Did this user actually buy and receive this exact product?
        const verifiedPurchase = await Order.findOne({
            user: userId,
            status: 'DELIVERED',
            'items.product': productId
        });

        if (!verifiedPurchase) {
            return res.status(403).json({ error: "> RESTRICTED: ONLY VERIFIED BUYERS CAN REVIEW THIS ITEM." });
        }

        // Create and save the review
        const newReview = new Review({
            user: userId,
            username: req.session.username,
            product: productId,
            rating: Number(rating),
            comment: comment.trim()
        });

        await newReview.save();
        res.status(201).json({ message: "> REVIEW SECURED AND PUBLISHED", review: newReview });

    } catch (err) {
        // Catch the MongoDB duplicate index error (User trying to review twice)
        if (err.code === 11000) {
            return res.status(400).json({ error: "> ERROR: YOU HAVE ALREADY REVIEWED THIS ITEM." });
        }
        console.error("Review Submit Error:", err);
        res.status(500).json({ error: "> SYSTEM FAILURE" });
    }
});

// ==========================================
// COMMUNITY CHAT ENGINE
// ==========================================

// 1. Fetch the 50 most recent messages
app.get('/api/messages', async (req, res) => {
    try {
        // .sort({ timestamp: -1 }) gets the newest first. 
        // .limit(50) stops the database from crashing if there are 10,000 messages.
        // .reverse() flips them back so the newest is at the bottom of the screen!
        const messages = await Message.find().sort({ timestamp: -1 }).limit(50);
        res.json(messages.reverse());
    } catch (err) {
        res.status(500).json({ error: "Failed to load messages." });
    }
});

// 2. Post a new message
app.post('/api/messages', async (req, res) => {
    try {
        const userId = req.session.userId;
        const username = req.session.username;
        const { text } = req.body;

        if (!userId) return res.status(401).json({ error: "Please log in to chat." });
        if (!text || text.trim().length === 0) return res.status(400).json({ error: "Message cannot be empty." });

        const newMessage = new Message({
            user: userId,
            username: username,
            text: text.trim()
        });

        await newMessage.save();
        res.status(201).json(newMessage);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to send message." });
    }
});

// -== authentication == 

// registration
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

        res.status(201).json({ message: "> REGISTRATION SUCCESSFUL. PLEASE LOG IN." });

    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ error: "> ERROR: SECTOR REGISTRY OFFLINE" });
    }
});

// logging in
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // finds user by email address ensurinbg they are not archived/deleted
        const user = await User.findOne({ email: email, isArchived: { $ne: true } });
        if (!user) {
            return res.status(400).json({ error: "> ERROR: ACCOUNT NOT FOUND OR DEACTIVATED" });
        }

        // compares typed password with the hashed password in the database
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "> ERROR: INVALID CREDENTIALS" });
        }

        // gives session wristband to user
        req.session.userId = user._id;
        req.session.username = user.username;
        req.session.role = user.role;

        // sends warp signal to frontend
        res.json({ message: "Login successful", redirect: "/home?warp=true" });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ error: "> ERROR: SYSTEM FAILURE" });
    }
});

// authetication status 
app.get('/api/auth/status', (req, res) => {
    // checks if user has digital wristband
    if (req.session && req.session.userId) {
        res.json({ 
            loggedIn: true, 
            username: req.session.username, 
            role: req.session.role 
        });
    } else {
        res.json({ loggedIn: false });
    }
});

// logging out
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: "Failed to logout" });
        }
        res.clearCookie('connect.sid'); // wipes cookie from browser
        res.json({ message: "Logout successful" });
    });
});

//  == profile data ==

// fetches user's dossier data to populate profile page (except password ofc)
app.get('/api/profile', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: "> UNAUTHORIZED ACCESS" });
        }
        
        // finds user by ID and explicitly excludes their password from the payload
        const user = await User.findById(req.session.userId).select('-password'); 
        
        if (!user) return res.status(404).json({ error: "> CITIZEN NOT FOUND" });

        res.json(user);
    } catch (err) {
        console.error("Profile Fetch Error:", err);
        res.status(500).json({ error: "> SERVER CONNECTION FAILED" });
    }
});

// updating user data (phone, address, etc.)
app.post('/api/profile/update', async (req, res) => {
    try {
        if (!req.session.userId) return res.status(401).json({ error: "> UNAUTHORIZED ACCESS" });

        const { phone, newAddress, equipAddressId, deleteAddressId, editAddressId, editAddressData } = req.body;
        
        const user = await User.findById(req.session.userId);
        if (!user) return res.status(404).json({ error: "> CITIZEN NOT FOUND" });

        // update mobile no. 
        if (phone) user.phone = phone;

        // add new address 
        if (newAddress) {
            newAddress.isEquipped = user.addresses.length === 0; // Auto-equip if it's the first one
            user.addresses.push(newAddress);
        }

        // equip address
        if (equipAddressId) {
            user.addresses.forEach(addr => {
                addr.isEquipped = (addr._id.toString() === equipAddressId);
            });
        }

        // delete existing address
        if (deleteAddressId) {
            user.addresses = user.addresses.filter(addr => addr._id.toString() !== deleteAddressId);
            // auto-equip the top one if they deleted their equipped address
            if (user.addresses.length > 0 && !user.addresses.find(a => a.isEquipped)) {
                user.addresses[0].isEquipped = true;
            }
        }

        // edit exsiting address
        if (editAddressId && editAddressData) {
            const addrToEdit = user.addresses.id(editAddressId); // mongoose helper to find by ID inside array
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

// password change
app.post('/api/profile/password', async (req, res) => {
    try {
        if (!req.session.userId) return res.status(401).json({ error: "> UNAUTHORIZED" });

        const { oldPassword, newPassword } = req.body;
        const user = await User.findById(req.session.userId);

        // verify old password
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) return res.status(400).json({ error: "> INVALID CURRENT PASSWORD" });

        // hash and save new password
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
        // extract payload from the frontend
        const { cart, address } = req.body;
        
        // ensure user is actually logged in 
        const userId = req.session.userId; 
        if (!userId) return res.status(401).json({ error: "Unauthorized: Please log in." });
        if (!cart || cart.length === 0) return res.status(400).json({ error: "Cart is empty." });

        let subtotal = 0;
        let validatedItems = [];

        /// loops through the frontend cart and cross-reference with the real database
        for (let item of cart) {
            const realProduct = await Product.findById(item.productId);
            if (!realProduct) continue; // skips if user tries to buy a deleted toy

            // prevents user buying more than what is in the database
            if (realProduct.avail_inventory < item.quantity) {
                return res.status(400).json({ error: `Insufficient stock for ${realProduct.name}.` });
            }

            const itemTotal = realProduct.price * item.quantity;
            subtotal += itemTotal;

            validatedItems.push({
                product: realProduct._id,
                name: realProduct.name,
                quantity: item.quantity,
                priceAtPurchase: realProduct.price
            });

            // inventory deduction 
           
            // subtracts purchased amount from database
            realProduct.avail_inventory -= item.quantity;

            // auto-updates UI tags based on the new stock levels
            if (realProduct.avail_inventory <= 0) {
                realProduct.inStock = false;
                realProduct.inventoryStatus = 'SOLD OUT';
            } else if (realProduct.avail_inventory <= 5) {
                realProduct.inventoryStatus = 'LOW STOCK'; // adds an orange ribbon warning if stock is getting low
            } else {
                realProduct.inventoryStatus = 'IN STOCK';
            }

            // save updated toy back to MongoDB
            await realProduct.save();
        }

        // calculate the official shipping fee
        let shippingFee = subtotal <= 10000 ? subtotal * 0.10 : 0;
        let totalAmount = subtotal + shippingFee;

       
        const dateStr = new Date().toLocaleDateString('en-GB', {day:'2-digit', month:'2-digit', year:'2-digit'}).replace(/\//g, '');
        // to generate 4 random alphanumeric characters
        const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase(); 
        const orderNumber = `OR-${dateStr}-${randomCode}`;

        // final order document to be saved in db
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

        // saves to MongoDB
        await newOrder.save();

        // send the success message back to the frontend
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

// admin dashboard route
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// feteches ALL orders (needs admin clearannce)
app.get('/api/admin/orders', async (req, res) => {
    try {
        // security check: non-admins will be decapitated
        if (!req.session.userId || req.session.role !== 'admin') {
            return res.status(403).json({ error: "> CLASSIFIED: ADMIN CLEARANCE REQUIRED." });
        }

        // fetches EVERY order in the database sorted by newest first
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

// updates order status + timestamps based on the new status
app.post('/api/admin/orders/:id/status', async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });
        
        const { status } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: "Order not found" });

        order.status = status;
        const now = new Date();
        if (!order.timeline) order.timeline = {}; 
        
        // logic for rollback and forward of timestamps based on changes in status
        if (status === 'PENDING') {
            order.timeline.preparingAt = null;
            order.timeline.shippedAt = null;
            order.timeline.deliveredAt = null;
        } 
        else if (status === 'PREPARING') {
            if (!order.timeline.preparingAt) order.timeline.preparingAt = now;
            order.timeline.shippedAt = null; // erases future data if moved backwards
            order.timeline.deliveredAt = null;
        } 
        else if (status === 'ON DELIVERY') {
            if (!order.timeline.shippedAt) order.timeline.shippedAt = now;
            order.timeline.deliveredAt = null; // erases future data
        } 
        else if (status === 'DELIVERED') {
            if (!order.timeline.deliveredAt) order.timeline.deliveredAt = now;
        }

        order.timeline.updatedAt = now; // always stamp the last time it was touched
        await order.save();
        
        res.json({ message: "> STATUS UPDATED TO: " + status });
    } catch (err) {
        res.status(500).json({ error: "System Error" });
    }
});

// cancel order + timestamp
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
        order.timeline.cancelledAt = new Date(); // LOG CANCELLATION TIME!!
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

        //spawns 5 PENDING requests so they all land in Tab 1
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

// cancel order + restore invetory
app.post('/api/admin/orders/:id/cancel', async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: "Order not found" });
        if (order.status === 'CANCELLED') return res.status(400).json({ error: "Already cancelled." });

        // loop through the receipt and returns the stock back to the warehouse
        for (let item of order.items) {
            const product = await Product.findById(item.product);
            if (product) {
                product.avail_inventory += item.quantity; 
                
                // fixes tags
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

// fetches all products for armoury (includes archived)
app.get('/api/admin/products', async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });
        
        // fetches everything and sorts alphabetically
        const products = await Product.find({}).sort({ name: 1 });
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: "Armory Fetch Error" });
    }
});

// toggle product archive state (soft deletion)
app.post('/api/admin/products/:id/archive', async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });

        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: "Product not found" });

        // if true, makes it false. if false, makes it true
        product.isArchived = !product.isArchived; 
        product.last_modified = new Date(); // STAMP THE TIME!!!!
        await product.save();

        res.json({ message: `> PRODUCT ${product.isArchived ? 'ARCHIVED' : 'RESTORED'}` });
    } catch (err) {
        res.status(500).json({ error: "Archive Toggle Error" });
    }
});

// stock adjustment
app.post('/api/admin/products/:id/stock', async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });

        const { adjustment } = req.body; // e.g., +5 or -2
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: "Product not found" });

        // prevents negative stock
        product.avail_inventory = Math.max(0, product.avail_inventory + adjustment);
        
        // auto-fixes the tags
        product.inStock = product.avail_inventory > 0;
        product.inventoryStatus = product.avail_inventory === 0 ? 'SOLD OUT' : (product.avail_inventory <= 5 ? 'LOW STOCK' : 'IN STOCK');
        
        product.last_modified = new Date(); // STAMP THE TIME!!!
        
        await product.save();
        res.json({ message: "> STOCK UPDATED", stock: product.avail_inventory });
    } catch (err) {
        res.status(500).json({ error: "Stock Adjustment Error" });
    }
});

// adding new product
app.post('/api/admin/products', upload.single('imageFile'), async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });

        const { sku, name, category, price, old_price, description, tags, existingImage } = req.body;
        const tagsArray = tags ? tags.split(',').map(tag => tag.trim()) : [];
        
        // if they upload a new file, use that path. otherwise, use placeholder path.
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

// product edit
app.post('/api/admin/products/:id/edit', upload.single('imageFile'), async (req, res) => {
    try {
        if (!req.session.userId || req.session.role !== 'admin') return res.status(403).json({ error: "Unauthorized" });

        const { sku, name, category, price, old_price, description, tags, existingImage } = req.body;
        const tagsArray = tags ? tags.split(',').map(tag => tag.trim()) : [];

        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: "Product not found" });

        // if a new file was uploaded, update the path. otherwise, keep the old one
        if (req.file) {
            product.imageString = `/images/products/${req.file.filename}`;
        } else if (existingImage) {
            product.imageString = existingImage; // keeps the existing path if no new file is chosen
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

// --- server status ---
app.listen(PORT, () => {
    console.log(`\n> =======================================`);
    console.log(`> SYSTEM ONLINE: TOY_YODA SERVER ACTIVE`);
    console.log(`> ACCESS POINT: http://localhost:${PORT}`);
    console.log(`> =======================================\n`);
});