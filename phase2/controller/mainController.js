
const path = require('path');

const mainController = {
    // serves index.html
    getIndex: (req, res) => {
        res.sendFile(path.join(__dirname, '../views/index.html'));
    },

    // serves home.html
    getHome: (req, res) => {
        res.sendFile(path.join(__dirname, '../views/home.html'));
    },
    // rceives form data when user attempts login
    postLogin: (req, res) => {

        console.log('[ CONTROLLER ] Login transmission received:', req.body);
    
        res.redirect('/home');
    }
};

module.exports = mainController;