const mongoose = require('mongoose');

// --- THE RAW DATA (Immutable Facts) ---
const productSchema = new mongoose.Schema({
    sku: { 
        type: String, 
        required: true, 
        unique: true // No two items can have the same ID
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
        default: 0 // If 0, it means it has never been discounted
    },
    category: { 
        type: String, 
        required: true 
    },
    tags: [{ 
        type: String // Array of search keywords
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
    date_published: { 
        type: Date, 
        default: Date.now // Automatically stamps today's date if left blank
    }
}, {
    // CRITICAL: This forces Mongoose to include our computed virtuals when sending data to the frontend
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// --- THE AUTOMATED BRAIN (Virtuals) ---

// 1. Simple Restock Boolean (For the frontend "In Stock" checkbox)
productSchema.virtual('inStock').get(function() {
    return this.avail_inventory > 0;
});

// 2. Advanced Inventory Status
productSchema.virtual('inventoryStatus').get(function() {
    if (this.avail_inventory === 0) return "SOLD OUT";
    if (this.avail_inventory <= 5) return "LOW STOCK";
    return "IN STOCK";
});

// 3. New Release Label (True if published within the last 7 days)
productSchema.virtual('isNew').get(function() {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return this.date_published > oneWeekAgo;
});

// 4. Sale Boolean
productSchema.virtual('onSale').get(function() {
    return this.old_price > this.price;
});

// 5. Discount Percentage Calculator
productSchema.virtual('discountPercent').get(function() {
    if (this.old_price > this.price) {
        return Math.round(((this.old_price - this.price) / this.old_price) * 100);
    }
    return 0;
});

module.exports = mongoose.model('Product', productSchema);