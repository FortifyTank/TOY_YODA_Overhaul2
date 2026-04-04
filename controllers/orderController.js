// controllers/orderController.js
const Order = require('../models/Order');
const Product = require('../models/Product');

// 1. Get a specific user's past orders
exports.getUserOrders = async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) return res.status(401).json({ error: "Please log in." });

        const orders = await Order.find({ user: userId })
            .populate('items.product') 
            .sort({ createdAt: -1 });

        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: "Failed to load orders." });
    }
};

// 2. The Checkout Engine
exports.processCheckout = async (req, res) => {
    try {
        const { cart, address } = req.body;
        const userId = req.session.userId; 
        
        if (!userId) return res.status(401).json({ error: "Unauthorized: Please log in." });
        if (!cart || cart.length === 0) return res.status(400).json({ error: "Cart is empty." });

        let subtotal = 0;
        let validatedItems = [];

        for (let item of cart) {
            const realProduct = await Product.findById(item.productId);
            if (!realProduct) continue; 

            if (realProduct.avail_inventory < item.quantity) {
                return res.status(400).json({ error: `Insufficient stock for ${realProduct.name}.` });
            }

            const itemTotal = realProduct.price * item.quantity;
            subtotal += itemTotal;

            validatedItems.push({
                product: realProduct._id,
                name: realProduct.name,
                quantity: item.quantity,
                priceAtPurchase: realProduct.price
            });
           
            realProduct.avail_inventory -= item.quantity;

            if (realProduct.avail_inventory <= 0) {
                realProduct.inStock = false;
                realProduct.inventoryStatus = 'SOLD OUT';
            } else if (realProduct.avail_inventory <= 5) {
                realProduct.inventoryStatus = 'LOW STOCK'; 
            } else {
                realProduct.inventoryStatus = 'IN STOCK';
            }

            await realProduct.save();
        }

        let shippingFee = subtotal <= 10000 ? subtotal * 0.10 : 0;
        let totalAmount = subtotal + shippingFee;
       
        const dateStr = new Date().toLocaleDateString('en-GB', {day:'2-digit', month:'2-digit', year:'2-digit'}).replace(/\//g, '');
        const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase(); 
        const orderNumber = `OR-${dateStr}-${randomCode}`;

        const newOrder = new Order({
            orderNumber,
            user: userId,
            items: validatedItems,
            subtotal,
            shippingFee,
            totalAmount,
            shippingAddress: address,
            status: 'PENDING',
            paymentStatus: 'UNPAID',
            timeline: { placedAt: new Date() }
        });

        await newOrder.save();

        res.status(200).json({ 
            message: "Order successfully logged.", 
            orderId: newOrder._id,
            orderNumber: newOrder.orderNumber 
        });

    } catch (error) {
        console.error("Checkout Error:", error);
        res.status(500).json({ error: "Server malfunction during checkout process." });
    }
};