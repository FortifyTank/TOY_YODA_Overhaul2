const User = require('../models/User');
const bcrypt = require('bcrypt');

// get user profile data
exports.getUserProfile = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: "> UNAUTHORIZED ACCESS" });
        }
        
        const user = await User.findById(req.session.userId).select('-password'); 
        if (!user) return res.status(404).json({ error: "> CITIZEN NOT FOUND" });

        res.json(user);
    } catch (err) {
        console.error("Profile Fetch Error:", err);
        res.status(500).json({ error: "> SERVER CONNECTION FAILED" });
    }
};

// update profile
exports.updateUserProfile = async (req, res) => {
    try {
        if (!req.session.userId) return res.status(401).json({ error: "> UNAUTHORIZED ACCESS" });

        const { phone, newAddress, equipAddressId, deleteAddressId, editAddressId, editAddressData } = req.body;
        
        const user = await User.findById(req.session.userId);
        if (!user) return res.status(404).json({ error: "> CITIZEN NOT FOUND" });

        if (phone) user.phone = phone;

        if (newAddress) {
            newAddress.isEquipped = user.addresses.length === 0; 
            user.addresses.push(newAddress);
        }

        if (equipAddressId) {
            user.addresses.forEach(addr => {
                addr.isEquipped = (addr._id.toString() === equipAddressId);
            });
        }

        if (deleteAddressId) {
            user.addresses = user.addresses.filter(addr => addr._id.toString() !== deleteAddressId);
            if (user.addresses.length > 0 && !user.addresses.find(a => a.isEquipped)) {
                user.addresses[0].isEquipped = true;
            }
        }

        if (editAddressId && editAddressData) {
            const addrToEdit = user.addresses.id(editAddressId); 
            if (addrToEdit) {
                addrToEdit.label = editAddressData.label;
                addrToEdit.addressLine = editAddressData.addressLine;
                addrToEdit.barangay = editAddressData.barangay;
                addrToEdit.city = editAddressData.city;
                addrToEdit.province = editAddressData.province;
                addrToEdit.zipCode = editAddressData.zipCode;
            }
        }

        await user.save();
        
        const safeUser = user.toObject();
        delete safeUser.password;

        res.json({ message: "> DOSSIER UPDATED", user: safeUser });
    } catch (err) {
        console.error("Profile Update Error:", err);
        res.status(500).json({ error: "> FAILED TO UPDATE DATABASE" });
    }
};

// change password
exports.updateUserPassword = async (req, res) => {
    try {
        if (!req.session.userId) return res.status(401).json({ error: "> UNAUTHORIZED" });

        const { oldPassword, newPassword } = req.body;
        const user = await User.findById(req.session.userId);

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) return res.status(400).json({ error: "> INVALID CURRENT PASSWORD" });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ message: "> PASSWORD UPDATED SUCCESSFULLY" });
    } catch (err) {
        console.error("Password Update Error:", err);
        res.status(500).json({ error: "> SYSTEM FAILURE" });
    }
};