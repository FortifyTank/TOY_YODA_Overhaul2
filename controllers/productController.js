const Product = require('../models/Product');
const Review = require('../models/Review');
const Order = require('../models/Order');

// get all products for the catalog
exports.getAllProducts = async (req, res) => {
    try {
        const productsDoc = await Product.find({ isArchived: { $ne: true } }); 
        const reviews = await Review.find(); 

        const products = productsDoc.map(p => p.toObject());

        products.forEach(p => {
            const pReviews = reviews.filter(r => r.product.toString() === p._id.toString());
            p.reviewCount = pReviews.length;
            
            if (p.reviewCount > 0) {
                const sum = pReviews.reduce((acc, rev) => acc + rev.rating, 0);
                p.averageRating = (sum / p.reviewCount).toFixed(1);
            } else {
                p.averageRating = '0.0';
            }
            p.inStock = p.avail_inventory > 0; 
        });

        res.json(products); 
    } catch (err) {
        res.status(500).json({ error: "Failed to load database" });
    }
};

// get product by SKU
exports.getProductBySku = async (req, res) => {
    try {
        const product = await Product.findOne({ sku: req.params.sku, isArchived: { $ne: true } });
        if (!product) return res.status(404).json({ error: "> CLASSIFIED: PRODUCT NOT FOUND." });
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: "> SYSTEM FAILURE" });
    }
};

// get product's reviews
exports.getProductReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ product: req.params.id }).sort({ createdAt: -1 });
        let average = 0;
        if (reviews.length > 0) {
            const sum = reviews.reduce((acc, rev) => acc + rev.rating, 0);
            average = (sum / reviews.length).toFixed(1);
        }
        res.json({ reviews, average, total: reviews.length });
    } catch (err) {
        res.status(500).json({ error: "> ERROR FETCHING REVIEWS" });
    }
};

// submit new review
exports.submitReview = async (req, res) => {
    try {
        const userId = req.session.userId;
        const productId = req.params.id;
        const { rating, comment } = req.body;

        if (!userId) return res.status(401).json({ error: "> UNAUTHORIZED: PLEASE LOG IN" });
        if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: "> INVALID RATING" });
        if (!comment) return res.status(400).json({ error: "> COMMENT REQUIRED" });

        const verifiedPurchase = await Order.findOne({
            user: userId,
            status: 'DELIVERED',
            'items.product': productId
        });

        if (!verifiedPurchase) {
            return res.status(403).json({ error: "> RESTRICTED: ONLY VERIFIED BUYERS CAN REVIEW THIS ITEM." });
        }

        const newReview = new Review({
            user: userId,
            username: req.session.username,
            product: productId,
            rating: Number(rating),
            comment: comment.trim()
        });

        await newReview.save();
        res.status(201).json({ message: "> REVIEW SECURED AND PUBLISHED", review: newReview });

    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ error: "> ERROR: YOU HAVE ALREADY REVIEWED THIS ITEM." });
        console.error("Review Submit Error:", err);
        res.status(500).json({ error: "> SYSTEM FAILURE" });
    }
};