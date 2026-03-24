const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    username: { 
        type: String, 
        required: true 
    },
    text: { 
        type: String, 
        required: true,
        trim: true,
        maxlength: 300 // Keeps the chat moving quickly without huge paragraphs
    },
    timestamp: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Message', messageSchema);