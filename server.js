const express = require('express');
const path = require('path');
const mongoose = require('mongoose'); // <--- 1. Import Mongoose

// Initialize the Express application
const app = express();
const PORT = 3000;

// --- DATABASE CONNECTION ---
// Your exact connection string (with 'toy_yoda' added as the database name)
const dbURI = "mongodb+srv://playofgamer10_db_user:CHbeLY5tbk1CPx6q@mattcluster.5npf8nj.mongodb.net/toy_yoda?appName=MattCluster";

mongoose.connect(dbURI)
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