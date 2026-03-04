
const express = require('express');
const app = express();
const path = require('path');

// imports db connection and controller
require('./model/db'); 
const mainController = require('./controller/mainController');

// serves files from public folder (css, js, images)
app.use(express.static(path.join(__dirname, 'public')));

// reads form data (e.g. login credentials)
app.use(express.urlencoded({ extended: true }));

app.get('/', mainController.getIndex);
app.get('/home', mainController.getHome);
app.post('/login', mainController.postLogin);

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`[ ALL SYSTEMS ONLINE ] Toy Yoda Terminal active at http://localhost:${PORT}`);
});