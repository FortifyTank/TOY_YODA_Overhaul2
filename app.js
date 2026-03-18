const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const multer = require('multer');
const mainController = require('./controllers/mainController');

// multer setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, './public/images/products'),
    filename: (req, file, cb) => cb(null, req.body.sku + '-' + Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

const app = express();
const dbURI = "mongodb://playofgamer10_db_user:CHbeLY5tbk1CPx6q@ac-ir6m09r-shard-00-00.5npf8nj.mongodb.net:27017,ac-ir6m09r-shard-00-01.5npf8nj.mongodb.net:27017,ac-ir6m09r-shard-00-02.5npf8nj.mongodb.net:27017/?ssl=true&authSource=admin&retryWrites=true&w=majority";

mongoose.connect(dbURI, { dbName: "toy_yoda" }).then(() => console.log(`> DATABASE CONNECTED`));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'tactical_toy_yoda_key_99', resave: false, saveUninitialized: false }));

// middleware for admin
const isAdmin = (req, res, next) => (req.session.role === 'admin') ? next() : res.status(403).send("Unauthorized");

// middleware for users (logging in)
const isCitizen = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next(); 
    }
    // send user to login if not yet
    res.redirect('/login?error=auth_required');
};

// the routes
app.get('/', mainController.getHome);
app.get('/login', mainController.getIndex);
app.get('/home', mainController.getHome);
app.get('/products', mainController.getProductsPage);
app.get('/profile', mainController.getProfilePage);
app.get('/checkout', mainController.getCheckoutPage);
app.get('/about', mainController.getAboutPage);

// for API
app.post('/api/register', mainController.postRegister);
app.post('/api/login', mainController.postLogin);
app.get('/api/auth/status', mainController.getAuthStatus);
app.post('/api/logout', mainController.postLogout);
app.get('/api/products', mainController.getProducts);
app.post('/checkout', mainController.postCheckout);

// profile and orders
app.get('/api/profile', mainController.getProfile);
app.post('/api/profile/update', mainController.updateProfile);
app.get('/api/orders', mainController.getUserOrders);

// admin API
app.get('/api/admin/orders', isAdmin, mainController.adminGetOrders);
app.post('/api/admin/orders/:id/status', isAdmin, mainController.adminUpdateStatus);
app.post('/api/admin/products', isAdmin, upload.single('imageFile'), mainController.adminAddProduct);

app.listen(3000, () => console.log(`> SYSTEM ONLINE: http://localhost:3000`));