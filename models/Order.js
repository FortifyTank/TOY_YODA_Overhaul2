const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    // e.g., "OR-030426-X7A9"
    orderNumber: { type: String, required: true, unique: true },

    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        name: String,
        quantity: { type: Number, required: true, min: 1 },
        priceAtPurchase: { type: Number, required: true }
    }],

    subtotal: { type: Number, required: true },
    shippingFee: { type: Number, required: true }, 
    totalAmount: { type: Number, required: true },

    shippingAddress: {
        label: String,
        addressLine: String,
        barangay: String,
        city: String,
        province: String,
        zipCode: String
    },

    status: {
        type: String,
        enum: ['PENDING', 'PREPARING', 'ON DELIVERY', 'DELIVERED', 'CANCELLED'],
        default: 'PENDING'
    },
    
    paymentStatus: {
        type: String,
        enum: ['UNPAID', 'PAID', 'REFUNDED'],
        default: 'UNPAID'
    },

    paymongoReference: { type: String },

    // ADDED: The Granular Tactical Timeline
    timeline: {
        placedAt: { type: Date, default: Date.now },
        preparingAt: { type: Date },
        shippedAt: { type: Date },
        deliveredAt: { type: Date },
        cancelledAt: { type: Date }
    }

}, { timestamps: true }); 

module.exports = mongoose.model('Order', orderSchema);