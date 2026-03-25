document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================
    // 1. STATE & DOM ELEMENTS
    // ==========================================
    const urlParams = new URLSearchParams(window.location.search);
    const bootOverlay = document.getElementById("bootOverlay");
    
    // Grabs all login buttons across the entire site instantly
    const accountButtons = document.querySelectorAll('.clearance');

    // ==========================================
    // 2. CORE LOGIC
    // ==========================================
    
    // --- Global System Boot Fade-In ---
    function handleBootAnimation() {
        if (!bootOverlay) return;
        
        if (urlParams.get("warp") === "true") {
            // Trigger cinematic fade
            bootOverlay.classList.add("fade-out");
            
            // Instantly clean the URL so refreshing the page doesn't replay the fade
            window.history.replaceState({}, document.title, window.location.pathname);
        } else {
            // Instantly hide the black screen
            bootOverlay.classList.add("hidden");
        }
    }

    // --- Global Authentication Check ---
    async function checkAuthStatus() {
        try {
            const response = await fetch('/api/auth/status');
            const data = await response.json();

            if (data.loggedIn) {
                accountButtons.forEach(btn => {
                    // ALWAYS act as the Profile Button, no matter what page we are on!
                    btn.innerText = `[ ${data.username} ]`;
                    btn.classList.add('logged-in');
                    btn.href = '/profile'; 
                    btn.classList.add('ready'); 
                });

                // DYNAMIC ADMIN BUTTON SPAWNER
                if (data.role === 'admin') {
                    const headerLeft = document.querySelector('.header-left');
                    if (headerLeft && !document.getElementById('adminNavBtn')) {
                        const adminBtn = document.createElement('a');
                        adminBtn.href = '/admin';
                        adminBtn.id = 'adminNavBtn';
                        adminBtn.className = 'header-btn btn-orange-invert ready';
                        adminBtn.innerText = '[ ADMIN OVERRIDE ]';
                        adminBtn.style.marginLeft = '15px'; 
                        headerLeft.appendChild(adminBtn);
                    }
                }

            } else {
                accountButtons.forEach(btn => {
                    btn.classList.add('ready'); 
                });
            }
        } catch (error) {
            console.error("Failed to verify auth status:", error);
            accountButtons.forEach(btn => btn.classList.add('ready'));
        }
    }

    // --- Latest Imports Fetcher ---
    async function loadLatestImports() {
        const latestContainer = document.getElementById('latestImportsContainer');
        if (!latestContainer) return; // If we aren't on the home page, abort!

        try {
            const response = await fetch('/api/products');
            let products = await response.json();

            // Reverse to get newest first, then grab the first 4
            const latestFour = products.reverse().slice(0, 4);

            latestContainer.innerHTML = ''; // Clear the "scanning" message

            latestFour.forEach(product => {
                const currentPriceFormatted = `₱${product.price.toLocaleString()}`;
                const starText = product.reviewCount > 0 ? `[ ★ ${product.averageRating} ]` : `[ ☆ 0.0 ]`;
                const starBadgeHTML = `<div class="text-amber font-bold text-sm mt-5 mb-5">${starText} <span class="text-muted">(${product.reviewCount || 0})</span></div>`;

                const productHtml = `
                    <article class="product-card cyber-panel panel-interactive panel-hover-bg-yellow">
                        <a href="/product?sku=${product.sku}" class="product-link">
                            <div class="product-image-wrapper">
                                <img src="${product.imageString}" class="product-image" alt="${product.name}">
                                <div class="view-details-banner"><span>[ VIEW DETAILS ]</span></div>
                            </div>
                            <div class="product-info">
                                <span class="product-category">> ${product.category}</span>
                                <h3 class="product-name">${product.name}</h3>
                                ${starBadgeHTML}
                                <div class="price-container">
                                    <span class="product-price">${currentPriceFormatted}</span>
                                </div>
                            </div>
                        </a>
                    </article>
                `;
                latestContainer.innerHTML += productHtml;
            });
        } catch (error) {
            console.error("Failed to fetch latest imports:", error);
            latestContainer.innerHTML = `<div class="col-span-full text-red p-20">> SYSTEM ERROR: UNABLE TO LOAD LATEST IMPORTS</div>`;
        }
    }

    // Ignite the fetcher
    loadLatestImports();

    // ==========================================
    // 3. INITIALIZATION
    // ==========================================
    handleBootAnimation();
    checkAuthStatus();
});