// controllers/communityController.js
const Message = require('../models/Message');

exports.getMessages = async (req, res) => {
    try {
        const messages = await Message.find().sort({ timestamp: -1 }).limit(50);
        res.json(messages.reverse());
    } catch (err) {
        res.status(500).json({ error: "Failed to load messages." });
    }
};

exports.postMessage = async (req, res) => {
    try {
        const userId = req.session.userId;
        const username = req.session.username;
        const { text } = req.body;

        if (!userId) return res.status(401).json({ error: "Please log in to chat." });
        if (!text || text.trim().length === 0) return res.status(400).json({ error: "Message cannot be empty." });

        const newMessage = new Message({
            user: userId,
            username: username,
            text: text.trim()
        });

        await newMessage.save();
        res.status(201).json(newMessage);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to send message." });
    }
};