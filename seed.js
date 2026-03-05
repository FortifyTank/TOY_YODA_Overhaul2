const mongoose = require('mongoose');
const Product = require('./models/Product');

// The Unbreakable Classic String
const dbURI = "mongodb://playofgamer10_db_user:CHbeLY5tbk1CPx6q@ac-ir6m09r-shard-00-00.5npf8nj.mongodb.net:27017,ac-ir6m09r-shard-00-01.5npf8nj.mongodb.net:27017,ac-ir6m09r-shard-00-02.5npf8nj.mongodb.net:27017/?ssl=true&authSource=admin&retryWrites=true&w=majority";

const seedProducts = [
    {
        sku: "SW-001",
        name: "BLACK SERIES DARTH VADER",
        description: "1/12 scale highly articulated figure with lightsaber and fabric cape.",
        price: 1500,
        old_price: 0,
        avail_inventory: 12, // Standard Stock
        category: "STAR WARS",
        tags: ["sith", "empire", "dark side", "action figure", "vader"],
        imageString: "/images/products/SW-001.png"
    },
    {
        sku: "MG-001",
        name: "METAL GEAR REX 1/100 MODEL KIT",
        description: "Detailed 1/100 scale snap-fit model kit of the iconic bipedal tank.",
        price: 4500,
        old_price: 0,
        avail_inventory: 4, // Will automatically trigger "LOW STOCK"
        category: "METAL GEAR",
        tags: ["mecha", "model kit", "kojima", "rex"],
        imageString: "/images/products/MG-001.jpg"
    },
    {
        sku: "PK-001",
        name: "CHARIZARD VMAX ELITE TRAINER BOX",
        description: "Sealed ETB containing 10 booster packs and exclusive promo cards.",
        price: 2800,
        old_price: 0,
        avail_inventory: 0, // Will automatically trigger "SOLD OUT"
        category: "POKÉMON",
        tags: ["tcg", "cards", "charizard", "sealed"],
        imageString: "/images/products/PK-001.jpg"
    },
    {
        sku: "MG-002",
        name: "HIGH-FREQUENCY BLADE REPLICA",
        description: "Full-scale prop replica of Raiden's signature weapon.",
        price: 8500,
        old_price: 10000, // Will automatically trigger "onSale: true" and calculate a 15% discount
        avail_inventory: 2,
        category: "METAL GEAR",
        tags: ["prop", "replica", "sword", "raiden", "cyborg"],
        imageString: "/images/products/MG-002.jpg"
    },
    {
        sku: "TF-001",
        name: "OPTIMUS PRIME MASTERPIECE MP-44",
        description: "Premium transforming figure with trailer and accessories.",
        price: 12000,
        old_price: 14000,
        avail_inventory: 8,
        category: "TRANSFORMERS",
        tags: ["autobot", "prime", "masterpiece", "transforming"],
        imageString: "/images/products/TF-001.jpg"
    }
];

mongoose.connect(dbURI, { dbName: "toy_yoda" })
    .then(async () => {
        console.log("> DATABASE CONNECTED. INITIATING CARGO DROP...");
        
        await Product.deleteMany({}); 
        console.log("> OLD INVENTORY PURGED.");

        await Product.insertMany(seedProducts);
        console.log("> CARGO SECURED: 5 NEW ITEMS ADDED TO MONGODB.");
        
        mongoose.connection.close();
    })
    .catch((err) => {
        console.log("> ERROR INJECTING CARGO:", err);
    });