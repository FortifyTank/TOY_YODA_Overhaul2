const express = require('express');
const path = require('path');
const mongoose = require('mongoose');

// Import your Database Models
const Product = require('./models/Product');

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
// Tell Express where to find static assets (CSS, JS, Images)
app.use(express.static(path.join(__dirname, 'public')));


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

// --- IGNITE SERVER ---
app.listen(PORT, () => {
    console.log(`\n> =======================================`);
    console.log(`> SYSTEM ONLINE: TOY_YODA SERVER ACTIVE`);
    console.log(`> ACCESS POINT: http://localhost:${PORT}`);
    console.log(`> =======================================\n`);
});