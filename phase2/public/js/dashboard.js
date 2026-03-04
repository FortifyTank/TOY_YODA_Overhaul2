document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. SYSTEM BOOT FADE-IN ---
    const bootOverlay = document.getElementById("bootOverlay");
    const urlParams = new URLSearchParams(window.location.search);
    
    if (bootOverlay) {
        // If we came out of hyperspace...
        if (urlParams.get("warp") === "true") {
            // Play the cinematic fade-out animation
            bootOverlay.classList.add("fade-out");
            
            // Wipe the "?warp=true" from the URL bar immediately!
            window.history.replaceState({}, document.title, window.location.pathname);
            
        } else {
            // If it's just a normal page load, instantly hide the black screen
            bootOverlay.classList.add("hidden");
        }
    }

    // --- 2. FUTURE INVENTORY & PAYMENTS (Node.js + MongoDB + Paymongo) ---
    
    // 🟢 MONGODB FETCHING:
    // Later, you will write a function here that automatically contacts Node.js 
    // to pull the latest "Bounties" (products) from MongoDB and inject them 
    // into the .bounty-grid dynamically.
    
    // 🟢 PAYMONGO CHECKOUT:
    // When a user clicks "[ ACQUIRE ]" on an item, you will trigger a function 
    // here that tells Node.js to create a Paymongo Checkout Session and redirect 
    // the user to the secure payment page!
    
});