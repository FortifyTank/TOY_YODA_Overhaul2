require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');

// INITIALIZE EXPRESS
const app = express();
const PORT = process.env.PORT || 3000;

// DATABASE CONNECTION
const dbURI = process.env.MONGODB_URI;
mongoose.connect(dbURI, { dbName: "toy_yoda" })
    .then(() => console.log(`> DATABASE: MONGODB SECURED AND CONNECTED`))
    .catch((err) => console.log(`> DATABASE ERROR: CONNECTION FAILED`, err));

// MIDDLEWARE
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET, 
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } 
}));

// ==========================================
// IMPORT MVC ROUTERS
// ==========================================
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const communityRoutes = require('./routes/communityRoutes');
const userRoutes = require('./routes/userRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');

// ==========================================
// API TRAFFIC COPS
// ==========================================
app.use('/api', authRoutes); // Handles /api/login, /api/register
app.use('/api/auth/status', require('./controllers/authController').checkStatus); // Explicit path map for the frontend
app.use('/api/products', productRoutes);
app.use('/api/messages', communityRoutes);
app.use('/api/profile', userRoutes);
app.use('/api/orders', orderRoutes);
app.post('/checkout', require('./controllers/orderController').processCheckout);
app.use('/api/admin', adminRoutes);

// ==========================================
// HTML VIEW ROUTES (The Frontend)
// ==========================================
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'home.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'views', 'index.html')));
app.get('/home', (req, res) => res.sendFile(path.join(__dirname, 'views', 'home.html')));
app.get('/catalog', (req, res) => res.sendFile(path.join(__dirname, 'views', 'catalog.html')));
app.get('/profile', (req, res) => res.sendFile(path.join(__dirname, 'views', 'profile.html')));
app.get('/checkout', (req, res) => res.sendFile(path.join(__dirname, 'views', 'checkout.html')));
app.get('/product', (req, res) => res.sendFile(path.join(__dirname, 'views', 'product.html')));
app.get('/community', (req, res) => res.sendFile(path.join(__dirname, 'views', 'community.html')));
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, 'views', 'about.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'views', 'admin.html')));

// 404 CATCH-ALL ROUTE
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});

// SERVER STATUS
app.listen(PORT, () => {
    console.log(`\n> =======================================`);
    console.log(`> SYSTEM ONLINE: TOY_YODA SERVER ACTIVE`);
    console.log(`> ARCHITECTURE: M.V.C. UPGRADED`);
    console.log(`> ACCESS POINT: http://localhost:${PORT}`);
    console.log(`> =======================================\n`);
});