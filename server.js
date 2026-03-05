const express = require('express');
const path = require('path');

// Initialize the Express application
const app = express();
const PORT = 3000;

// Tell the server to serve all static files (HTML, CSS, JS, Images) from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Boot up the server and listen on Port 3000
app.listen(PORT, () => {
    console.log(`\n> =======================================`);
    console.log(`> SYSTEM ONLINE: TOY_YODA SERVER ACTIVE`);
    console.log(`> ACCESS POINT: http://localhost:${PORT}`);
    console.log(`> =======================================\n`);
});