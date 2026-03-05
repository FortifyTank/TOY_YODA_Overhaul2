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

// Route for the Login Checkpoint (index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Route for the Dashboard (home.html)
app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'home.html'));
});

// Route for the Catalog (products.html)
app.get('/products', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'products.html'));
});

// --- IGNITE SERVER ---
app.listen(PORT, () => {
    console.log(`\n> =======================================`);
    console.log(`> SYSTEM ONLINE: TOY_YODA SERVER ACTIVE`);
    console.log(`> ACCESS POINT: http://localhost:${PORT}`);
    console.log(`> =======================================\n`);
});