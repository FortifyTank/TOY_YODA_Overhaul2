const mongoose = require('mongoose');
const Product = require('./models/Product');

const dbURI = "mongodb://playofgamer10_db_user:CHbeLY5tbk1CPx6q@ac-ir6m09r-shard-00-00.5npf8nj.mongodb.net:27017,ac-ir6m09r-shard-00-01.5npf8nj.mongodb.net:27017,ac-ir6m09r-shard-00-02.5npf8nj.mongodb.net:27017/?ssl=true&authSource=admin&retryWrites=true&w=majority";

const seedProducts = [
    // --- test item ---
    { sku: "TEST-000", name: "DEFECTIVE PROTOTYPE", description: "Recalled due to laser malfunction.", price: 9999, old_price: 0, avail_inventory: 0, category: "CLASSIFIED", tags: ["recalled"], imageString: "/images/default-placeholder.png", isArchived: true },
    
    // --- STAR WARS ---
    { sku: "SW-001", name: "Black Series Darth Vader", description: "1/12 scale highly articulated figure.", price: 1500, old_price: 0, avail_inventory: 12, category: "STAR WARS", tags: ["sith", "empire", "action figure"], imageString: "/images/products/SW-001.png" },
    { sku: "SW-002", name: "UCS Millennium Falcon", description: "7,500+ piece building set.", price: 45000, old_price: 0, avail_inventory: 2, category: "STAR WARS", tags: ["lego", "ship", "rebel", "han solo"], imageString: "/images/products/SW-002.jpg" },
    { sku: "SW-003", name: "The Mandalorian Helmet", description: "1:1 Scale wearable prop replica.", price: 6500, old_price: 8000, avail_inventory: 5, category: "STAR WARS", tags: ["prop", "helmet", "bounty hunter", "beskar"], imageString: "/images/products/SW-003.jpg" },
    { sku: "SW-004", name: "Vintage Collection Luke", description: "3.75 inch retro figure.", price: 800, old_price: 0, avail_inventory: 0, category: "STAR WARS", tags: ["jedi", "retro", "rebel"], imageString: "/images/products/SW-004.jpeg" },
    { sku: "SW-005", name: "Force FX Elite Lightsaber", description: "Advanced LED lightsaber replica.", price: 12000, old_price: 15000, avail_inventory: 3, category: "STAR WARS", tags: ["prop", "weapon", "jedi", "saber"], imageString: "/images/products/SW-005.jpg" },
    { sku: "SW-006", name: "LEGO Venator-Class Attack Cruiser", description: "Highly-detailed mid-scale display model.", price: 6500, old_price: 7000, avail_inventory: 4, category: "STAR WARS", tags: ["lego", "clone wars", "ship", "republic"], imageString:"/images/products/SW-006.jpg" },
    { sku: "SW-007", name: "Black Series Jango Fett", description: "Premium 6-inch action figure featuring authentic detail", price: 3000, old_price: 3200, avail_inventory: 7, category: "STAR WARS", tags: ["action figure", "bounty hunter", "black series"], imageString: "/images/products/SW-007.jpg" },
    { sku: "SW-008", name: "Vintage Collection Yoda", description: "Retro Yoda figure.", price: 800, old_price: 0, avail_inventory: 9, category: "STAR WARS", tags: ["jedi", "retro", "rebel", "force"], imageString: "/images/products/SW-008.jpg" },

    // --- METAL GEAR ---
    { sku: "MG-001", name: "Metal Gear Rex 1/100 Kit", description: "Detailed 1/100 snap-fit kit.", price: 4500, old_price: 0, avail_inventory: 4, category: "METAL GEAR", tags: ["mecha", "model kit", "kojima", "rex"], imageString: "/images/products/MG-001.jpg" },
    { sku: "MG-002", name: "High-Frequency Blade", description: "Full-scale prop replica.", price: 8500, old_price: 10000, avail_inventory: 2, category: "METAL GEAR", tags: ["prop", "sword", "raiden", "cyborg"], imageString: "/images/products/MG-002.jpg" },
    { sku: "MG-003", name: "Solid Snake Nendoroid", description: "Chibi style articulated figure.", price: 2800, old_price: 0, avail_inventory: 15, category: "METAL GEAR", tags: ["chibi", "snake", "stealth", "figure"], imageString: "/images/products/MG-003.jpg" },
    { sku: "MG-004", name: "Metal Gear Ray Kit", description: "Amphibious anti-Metal Gear weapon.", price: 5500, old_price: 6000, avail_inventory: 1, category: "METAL GEAR", tags: ["mecha", "marines", "kojima"], imageString: "/images/products/MG-004.jpg" },
    { sku: "MG-005", name: "Cardboard Box Prop", description: "Authentic sneaking cardboard box.", price: 500, old_price: 1000, avail_inventory: 0, category: "METAL GEAR", tags: ["stealth", "joke", "prop", "box"], imageString: "/images/products/MG-005.jpg" },
    { sku: "MG-006", name: "Revoltech Yamaguchi Raiden", description: "Highly articulated figure of the cyborg ninja Raiden", price: 1500, old_price: 2000, avail_inventory: 3, category: "METAL GEAR", tags: ["cyborg", "ninja", "rising", "MGR"], imageString: "/images/products/MG-006.jpg" },
    { sku: "MG-007", name: "Metal Gear Sahelanthropus", description: "Transforming 1/100 scale model kit of the nuclear-armed bipedal tank", price: 6500, old_price: 7000, avail_inventory: 1, category: "METAL GEAR", tags: ["kit", "transforming", "tank", "MGS"], imageString: "/images/products/MG-007.jpg" },
    { sku: "MG-008", name: "Figma Solid Snake", description: "Highly poseable action figure of the legendary soldier", price: 4500, old_price: 5000, avail_inventory: 2, category: "METAL GEAR", tags: ["figma", "solid snake", "poseable", "MGS2"], imageString: "/images/products/MG-008.jpg" },

    // --- POKEMON ---
    { sku: "PK-001", name: "Charizard VMAX ETB", description: "Sealed ETB containing 10 packs.", price: 2800, old_price: 0, avail_inventory: 0, category: "POKÉMON", tags: ["tcg", "cards", "charizard"], imageString: "/images/products/PK-001.jpg" },
    { sku: "PK-002", name: "151 Booster Box (Japanese)", description: "Sealed booster box.", price: 8500, old_price: 9500, avail_inventory: 8, category: "POKÉMON", tags: ["tcg", "cards", "sealed", "import"], imageString: "/images/products/PK-002.jpg" },
    { sku: "PK-003", name: "Life-size Pikachu Plush", description: "1:1 Scale officially licensed plush.", price: 3500, old_price: 0, avail_inventory: 4, category: "POKÉMON", tags: ["plush", "pikachu", "soft"], imageString: "/images/products/PK-003.jpeg" },
    { sku: "PK-004", name: "PSA 10 Base Set Mewtwo", description: "Graded vintage holographic card.", price: 18000, old_price: 0, avail_inventory: 1, category: "POKÉMON", tags: ["tcg", "graded", "vintage", "mewtwo"], imageString: "/images/products/PK-004.jpg" },
    { sku: "PK-005", name: "Pokeball Replica", description: "Die-cast electronic replica.", price: 5200, old_price: 0, avail_inventory: 10, category: "POKÉMON", tags: ["prop", "die-cast", "pokeball"], imageString: "/images/products/PK-005.jpg" },
    { sku: "PK-006", name: "Scarlet & Violet Elite Trainer Box", description: "Comprehensive starter kit for players and collectors", price: 4000, old_price: 4100, avail_inventory: 5, category: "POKÉMON", tags: ["TCG", "cards", "scarlet & violet"], imageString: "/images/products/PK-006.png" },
    { sku: "PK-007", name: "Jazwares Charizard", description: "Premium highly-articulated 6-inch figure", price: 3000, old_price: 3200, avail_inventory: 2, category: "POKÉMON", tags: ["action figure", "charizard", "jazwares", "select series"], imageString: "/images/products/PK-007.jpg" },
    { sku: "PK-008", name: "Pikachu Building Set", description: "1,092-piece mechanized building set", price: 7000, old_price: 7500, avail_inventory: 4, category: "POKÉMON", tags: ["pikachu", "building", "mechanized"], imageString: "/images/products/PK-008.jpg" },

    // --- TRANSFORMERS ---
    { sku: "TF-001", name: "Masterpiece MP-44 Optimus", description: "Premium transforming figure.", price: 12000, old_price: 14000, avail_inventory: 8, category: "TRANSFORMERS", tags: ["autobot", "prime", "masterpiece"], imageString: "/images/products/TF-001.jpg" },
    { sku: "TF-002", name: "Studio Series Bumblebee", description: "Detailed movie-accurate figure.", price: 1200, old_price: 1500, avail_inventory: 20, category: "TRANSFORMERS", tags: ["autobot", "movie", "bumblebee"], imageString: "/images/products/TF-002.jpeg" },
    { sku: "TF-003", name: "Masterpiece Megatron", description: "Decepticon leader.", price: 11000, old_price: 0, avail_inventory: 2, category: "TRANSFORMERS", tags: ["decepticon", "masterpiece", "megatron"], imageString: "/images/products/TF-003.jpg" },
    { sku: "TF-004", name: "War For Cybertron Unicron", description: "Massive planet-eating figure.", price: 35000, old_price: 0, avail_inventory: 0, category: "TRANSFORMERS", tags: ["haslab", "unicron", "massive", "decepticon"], imageString: "/images/products/TF-004.jpg" },
    { sku: "TF-005", name: "G1 Reissue Starscream", description: "Classic retro boxed figure.", price: 2500, old_price: 3000, avail_inventory: 5, category: "TRANSFORMERS", tags: ["decepticon", "retro", "g1", "starscream"], imageString: "/images/products/TF-005.jpg" },
    { sku: "TF-006", name: "Studio Series 86 Commander Optimus", description: "Highly-detailed, movie-accurate figure", price: 8000, old_price: 8200, avail_inventory: 2, category: "TRANSFORMERS", tags: ["optimus", "prime", "action figure", "autobot"], imageString: "/images/products/TF-006.jpg" },
    { sku: "TF-007", name: "Legacy United Leader-Class Soundwave", description: "G1-inspired Transformable 7-inch figure", price: 4100, old_price: 4500, avail_inventory: 5, category: "TRANSFORMERS", tags: ["soundwave", "decepticon", "action figure", "G1"], imageString: "/images/products/TF-007.jpg" },
    { sku: "TF-008", name: "Missing Link C-01 Convoy", description: "Modern reimagining of the original 1984 toy", price: 7000, old_price: 7200, avail_inventory: 4, category: "TRANSFORMERS", tags: ["die cast", "g1", "retro", "truck"], imageString: "/images/products/TF-008.jpg" },


    // --- MARVEL ---
    { sku: "MV-001", name: "Captain America Shield", description: "Shield", price: 8000, old_price: 10000, avail_inventory: 5, category: "MARVEL", tags: ["hero", "shield", "marvel"], imageString: "/images/products/MV-001.png" },
    { sku: "MV-002", name: "Hot Toys God Loki (Artisan Edition)", description: "Masterpiece sixth-scale figure.", price: 32000, old_price: 35000, avail_inventory: 1, category: "MARVEL", tags: ["hot toys", "loki", "artisan"], imageString: "/images/products/MV-002.jpg" },
    { sku: "MV-003", name: "Hot Toys Wolverine (TVA Jacket Version)", description: "Screen-accurate 1/6th scale figure.", price: 17500, old_price: 18000, avail_inventory: 2, category: "MARVEL", tags: ["hot toys", "wolverine", "action figure"], imageString: "/images/products/MV-003.jpg" },
    { sku: "MV-004", name: "LEGO Marvel Iron Man Mk 3", description: "1,297-piece Collectors' Edition display set.", price: 9000, old_price: 9500, avail_inventory: 4, category: "MARVEL", tags: ["lego", "iron man", "collectors", "display"], imageString: "/images/products/MV-004.jpg" },
    { sku: "MV-005", name: "Marvel Legends Spider-Man Comics: Grizzly", description: "Massive Marvel Legends figure.", price: 3500, old_price: 3800, avail_inventory: 4, category: "MARVEL", tags: ["marvel legends", "spider-man", "action figure"], imageString: "/images/products/MV-005.jpg" },
    { sku: "MV-006", name: "LEGO Marvel Ravager Jumpsuit Groot", description: "604-piece buildable Groot figure.", price: 4500, old_price: 4800, avail_inventory: 3, category: "MARVEL", tags: ["lego", "guardians", "groot", "buildable"], imageString: "/images/products/MV-006.jpg" },
    { sku: "MV-007", name: "Marvel Legends Deadpool", description: "Definitive 6-inch Marvel Legends figure.", price: 2000, old_price: 2200, avail_inventory: 6, category: "MARVEL", tags: ["marvel legends", "deadpool", "action figure"], imageString: "/images/products/MV-007.jpeg" },
    { sku: "MV-008", name: "LEGO Spider-Man vs. Mysterio: Daily Bugle", description: "781-piece play set.", price: 6000, old_price: 6500, avail_inventory: 7, category: "MARVEL", tags: ["lego", "spider-man", "play set", "mysterio"], imageString: "/images/products/MV-008.jpg" }
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