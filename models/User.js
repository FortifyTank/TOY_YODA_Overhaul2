const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // We will hash this later!
    role: { type: String, default: 'customer' }, // 'customer' or 'admin'
    
    // Logistics (Optional until they checkout)
    phone: { type: String, default: '' },
    shippingAddress: {
        street: { type: String, default: '' },
        city: { type: String, default: '' },
        zipCode: { type: String, default: '' }
    },
    
    dateRegistered: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);