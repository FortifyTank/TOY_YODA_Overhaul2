
const mongoose = require('mongoose');

// connection to local MongoDB. if 'toy_yoda_db' doesn't exist, automatically created
const dbURL = 'mongodb://localhost:27017/toy_yoda_db';

mongoose.connect(dbURL)
    .then(() => {
        console.log('[ DATABASE CONNECTION ] Connected to MongoDB');
    })
    .catch((error) => {
        console.error('[ ERROR CONNECTING ] Database connection has failed! ', error);
    });

module.exports = mongoose;