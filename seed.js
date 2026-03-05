const mongoose = require('mongoose');
const Product = require('./models/Product');

// The Unbreakable Classic String
const dbURI = "mongodb://playofgamer10_db_user:CHbeLY5tbk1CPx6q@ac-ir6m09r-shard-00-00.5npf8nj.mongodb.net:27017,ac-ir6m09r-shard-00-01.5npf8nj.mongodb.net:27017,ac-ir6m09r-shard-00-02.5npf8nj.mongodb.net:27017/?ssl=true&authSource=admin&retryWrites=true&w=majority";

const seedProducts = [
    // --- STAR WARS ---
    { sku: "SW-001", name: "BLACK SERIES DARTH VADER", description: "1/12 scale highly articulated figure.", price: 1500, old_price: 0, avail_inventory: 12, category: "STAR WARS", tags: ["sith", "empire", "action figure"], imageString: "/images/products/SW-001.png" },
    { sku: "SW-002", name: "UCS MILLENNIUM FALCON", description: "7,500+ piece building set.", price: 45000, old_price: 0, avail_inventory: 2, category: "STAR WARS", tags: ["lego", "ship", "rebel", "han solo"], imageString: "/images/products/SW-001.png" },
    { sku: "SW-003", name: "THE MANDALORIAN HELMET", description: "1:1 Scale wearable prop replica.", price: 6500, old_price: 8000, avail_inventory: 5, category: "STAR WARS", tags: ["prop", "helmet", "bounty hunter", "beskar"], imageString: "/images/products/SW-001.png" },
    { sku: "SW-004", name: "VINTAGE COLLECTION LUKE", description: "3.75 inch retro figure.", price: 800, old_price: 0, avail_inventory: 0, category: "STAR WARS", tags: ["jedi", "retro", "rebel"], imageString: "/images/products/SW-001.png" },
    { sku: "SW-005", name: "FORCE FX ELITE LIGHTSABER", description: "Advanced LED lightsaber replica.", price: 12000, old_price: 15000, avail_inventory: 3, category: "STAR WARS", tags: ["prop", "weapon", "jedi", "saber"], imageString: "/images/products/SW-001.png" },

    // --- METAL GEAR ---
    { sku: "MG-001", name: "METAL GEAR REX 1/100 KIT", description: "Detailed 1/100 snap-fit kit.", price: 4500, old_price: 0, avail_inventory: 4, category: "METAL GEAR", tags: ["mecha", "model kit", "kojima", "rex"], imageString: "/images/products/MG-001.jpg" },
    { sku: "MG-002", name: "HIGH-FREQUENCY BLADE", description: "Full-scale prop replica.", price: 8500, old_price: 10000, avail_inventory: 2, category: "METAL GEAR", tags: ["prop", "sword", "raiden", "cyborg"], imageString: "/images/products/MG-002.jpg" },
    { sku: "MG-003", name: "SOLID SNAKE NENDOROID", description: "Chibi style articulated figure.", price: 2800, old_price: 0, avail_inventory: 15, category: "METAL GEAR", tags: ["chibi", "snake", "stealth", "figure"], imageString: "/images/products/MG-001.jpg" },
    { sku: "MG-004", name: "METAL GEAR RAY KIT", description: "Amphibious anti-Metal Gear weapon.", price: 5500, old_price: 6000, avail_inventory: 1, category: "METAL GEAR", tags: ["mecha", "marines", "kojima"], imageString: "/images/products/MG-001.jpg" },
    { sku: "MG-005", name: "CARDBOARD BOX PROP", description: "Authentic sneaking cardboard box.", price: 500, old_price: 1000, avail_inventory: 0, category: "METAL GEAR", tags: ["stealth", "joke", "prop", "box"], imageString: "/images/products/MG-001.jpg" }, // 50% OFF Deep Discount Test

    // --- POKÉMON ---
    { sku: "PK-001", name: "CHARIZARD VMAX ETB", description: "Sealed ETB containing 10 packs.", price: 2800, old_price: 0, avail_inventory: 0, category: "POKÉMON", tags: ["tcg", "cards", "charizard"], imageString: "/images/products/PK-001.jpg" },
    { sku: "PK-002", name: "151 BOOSTER BOX (JAPANESE)", description: "Sealed booster box.", price: 8500, old_price: 9500, avail_inventory: 8, category: "POKÉMON", tags: ["tcg", "cards", "sealed", "import"], imageString: "/images/products/PK-001.jpg" },
    { sku: "PK-003", name: "LIFE-SIZE PIKACHU PLUSH", description: "1:1 Scale officially licensed plush.", price: 3500, old_price: 0, avail_inventory: 4, category: "POKÉMON", tags: ["plush", "pikachu", "soft"], imageString: "/images/products/PK-001.jpg" },
    { sku: "PK-004", name: "PSA 10 BASE SET MEWTWO", description: "Graded vintage holographic card.", price: 18000, old_price: 0, avail_inventory: 1, category: "POKÉMON", tags: ["tcg", "graded", "vintage", "mewtwo"], imageString: "/images/products/PK-001.jpg" },
    { sku: "PK-005", name: "POKÉBALL REPLICA", description: "Die-cast electronic replica.", price: 5200, old_price: 0, avail_inventory: 10, category: "POKÉMON", tags: ["prop", "die-cast", "pokeball"], imageString: "/images/products/PK-001.jpg" },

    // --- TRANSFORMERS ---
    { sku: "TF-001", name: "MASTERPIECE MP-44 OPTIMUS", description: "Premium transforming figure.", price: 12000, old_price: 14000, avail_inventory: 8, category: "TRANSFORMERS", tags: ["autobot", "prime", "masterpiece"], imageString: "/images/products/TF-001.jpg" },
    { sku: "TF-002", name: "STUDIO SERIES BUMBLEBEE", description: "Detailed movie-accurate figure.", price: 1200, old_price: 1500, avail_inventory: 20, category: "TRANSFORMERS", tags: ["autobot", "movie", "bumblebee"], imageString: "/images/products/TF-001.jpg" },
    { sku: "TF-003", name: "MASTERPIECE MEGATRON", description: "Decepticon leader.", price: 11000, old_price: 0, avail_inventory: 2, category: "TRANSFORMERS", tags: ["decepticon", "masterpiece", "megatron"], imageString: "/images/products/TF-001.jpg" },
    { sku: "TF-004", name: "WAR FOR CYBERTRON UNICRON", description: "Massive planet-eating figure.", price: 35000, old_price: 0, avail_inventory: 0, category: "TRANSFORMERS", tags: ["haslab", "unicron", "massive", "decepticon"], imageString: "/images/products/TF-001.jpg" },
    { sku: "TF-005", name: "G1 REISSUE STARSCREAM", description: "Classic retro boxed figure.", price: 2500, old_price: 3000, avail_inventory: 5, category: "TRANSFORMERS", tags: ["decepticon", "retro", "g1", "starscream"], imageString: "/images/products/TF-001.jpg" }
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