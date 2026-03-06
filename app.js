const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');           // NEW: Password scrambler
const session = require('express-session'); // NEW: Digital wristband for logged-in users

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

// --- DATA API ROUTES ---

// Get all products from the database
app.get('/api/products', async (req, res) => {
    try {
        // Product.find({}) tells Mongoose to fetch every single item in the collection
        const products = await Product.find({}); 
        
        // Send the data back to the browser as a JSON object
        res.json(products); 
    } catch (err) {
        console.error("Error fetching products:", err);
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

        // Find the user by email
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(400).json({ error: "> ERROR: INVALID CREDENTIALS" });
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

// --- IGNITE SERVER ---
app.listen(PORT, () => {
    console.log(`\n> =======================================`);
    console.log(`> SYSTEM ONLINE: TOY_YODA SERVER ACTIVE`);
    console.log(`> ACCESS POINT: http://localhost:${PORT}`);
    console.log(`> =======================================\n`);
});