const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, 
    role: { type: String, default: 'customer' }, 
    
    // Logistics
    phone: { type: String, default: 'UNREGISTERED' }, 
    
    // CHANGED: Now an Array of objects so users can have multiple addresses!
    addresses: [{
        label: { type: String, default: 'HOME' }, 
        addressLine: { type: String, default: '' },
        barangay: { type: String, default: '' },
        city: { type: String, default: '' },
        province: { type: String, default: '' },
        zipCode: { type: String, default: '' },
        country: { type: String, default: 'Philippines' },
        isEquipped: { type: Boolean, default: false } // Tracks the active loadout
    }],
    
    dateRegistered: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);