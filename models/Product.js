const mongoose = require('mongoose');

// The Blueprint for every piece of Contraband
const productSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    price: { 
        type: Number, 
        required: true 
    },
    category: { 
        type: String, 
        required: true // e.g., "STAR WARS", "METAL GEAR", "POKÉMON"
    },
    imageString: { 
        type: String, 
        default: 'IMG_NO_SIGNAL' // Fallback if no image is provided
    },
    inStock: { 
        type: Boolean, 
        default: true 
    },
    // Tactical Badges
    isNewIntel: { 
        type: Boolean, 
        default: false 
    },
    isClearance: { 
        type: Boolean, 
        default: false 
    }
});

// Export this blueprint so the rest of your server can use it
module.exports = mongoose.model('Product', productSchema);