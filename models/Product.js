const mongoose = require('mongoose');

// raw data
const productSchema = new mongoose.Schema({
    sku: { 
        type: String, 
        required: true, 
        unique: true // unique ID
    },
    name: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String, 
        default: "Classified contraband details." 
    },
    price: { 
        type: Number, 
        required: true 
    },
    old_price: { 
        type: Number, 
        default: 0 // if 0, it means product has never been discounted
    },
    category: { 
        type: String, 
        required: true 
    },
    tags: [{ 
        type: String // array of search keywords
    }], 
    imageString: { 
        type: String, 
        default: '/images/IMG_NO_SIGNAL.png' 
    },
    avail_inventory: { 
        type: Number, 
        required: true, 
        default: 0 
    },

    isArchived: {
        type: Boolean,
        default: false
    },
    last_modified: {
        type: Date
    },
    date_published: { 
        type: Date, 
        default: Date.now 
    }
}, {
    // forces Mongoose to include computed virtuals when sending data to the frontend
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// virtuals

// restocking  (for the frontend "In Stock" checkbox)
productSchema.virtual('inStock').get(function() {
    return this.avail_inventory > 0;
});

// inventory status
productSchema.virtual('inventoryStatus').get(function() {
    if (this.avail_inventory === 0) return "SOLD OUT";
    if (this.avail_inventory <= 5) return "LOW STOCK";
    return "IN STOCK";
});

// new releases (true if published within last 7 days)
productSchema.virtual('isNew').get(function() {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return this.date_published > oneWeekAgo;
});

// product sale 
productSchema.virtual('onSale').get(function() {
    return this.old_price > this.price;
});

// discount calc
productSchema.virtual('discountPercent').get(function() {
    if (this.old_price > this.price) {
        return Math.round(((this.old_price - this.price) / this.old_price) * 100);
    }
    return 0;
});

module.exports = mongoose.model('Product', productSchema);