const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const Product = require('./models/Product');

// Initialize the Express application
const app = express();
const PORT = 3000;

// --- DATABASE CONNECTION ---
// The "Unbreakable" Classic String (Bypasses SRV Blockers)
const dbURI = "mongodb://playofgamer10_db_user:CHbeLY5tbk1CPx6q@ac-ir6m09r-shard-00-00.5npf8nj.mongodb.net:27017,ac-ir6m09r-shard-00-01.5npf8nj.mongodb.net:27017,ac-ir6m09r-shard-00-02.5npf8nj.mongodb.net:27017/?ssl=true&authSource=admin&retryWrites=true&w=majority";

mongoose.connect(dbURI, { dbName: "toy_yoda" })
    .then(() => {
        console.log(`> DATABASE: MONGODB SECURED AND CONNECTED`);
    })
    .catch((err) => {
        console.log(`> DATABASE ERROR: CONNECTION FAILED`);
        console.log(err);
    });
// ---------------------------

// Tell the server to serve all static files (HTML, CSS, JS, Images) from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Boot up the server and listen on Port 3000
app.listen(PORT, () => {
    console.log(`\n> =======================================`);
    console.log(`> SYSTEM ONLINE: TOY_YODA SERVER ACTIVE`);
    console.log(`> ACCESS POINT: http://localhost:${PORT}`);
    console.log(`> =======================================\n`);
});