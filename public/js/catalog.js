document.addEventListener('DOMContentLoaded', () => {
    
    // --- STATE MANAGEMENT ---
    let allProducts = []; 
    let currentSort = 'LATEST'; 

    // --- DOM ELEMENTS ---
    const container = document.getElementById('product-container');
    const resultCount = document.getElementById('resultCount');
    const searchInput = document.getElementById('searchInput');
    const priceSlider = document.getElementById("priceSlider");
    const priceDisplay = document.getElementById("priceDisplay");
    
    const themeCheckboxes = document.querySelectorAll('.theme-checkbox');
    const stockCheckboxes = document.querySelectorAll('.stock-checkbox');
    const sortDropdown = document.getElementById('sortDropdown');

    async function initCatalog() {
        try {
            const response = await fetch('/api/products');
            allProducts = await response.json();
            applyFilters(); 
        } catch (error) {
            console.error("Error loading the catalog:", error);
            container.innerHTML = '<p>> ERROR: DATABASE CONNECTION LOST.</p>';
        }
    }

    // --- RELEVANCE SCORING ALGORITHM ---
    function getRelevanceScore(product, searchTerm) {
        if (!searchTerm) return 0;
        
        let score = 0;
        const term = searchTerm.toLowerCase();
        const name = product.name.toLowerCase();
        const category = product.category.toLowerCase();
        
        // Highest priority: Exact phrase is in the product name
        if (name.includes(term)) score += 50;
        
        // Medium priority: Matches the category
        if (category.includes(term)) score += 20;
        
        // Low priority: Matches a hidden tag
        if (product.tags && product.tags.some(tag => tag.toLowerCase().includes(term))) {
            score += 10;
        }
        
        return score;
    }

    function applyFilters() {
        let filtered = allProducts;
        const searchTerm = searchInput.value.toLowerCase();

        // A. Search Bar Filter
        if (searchTerm) {
            filtered = filtered.filter(p => getRelevanceScore(p, searchTerm) > 0);
        }

        // B. Price Slider Filter (The Infinity Fix)
        let maxPrice = Number(priceSlider.value);
        if (maxPrice >= 15500) {
            maxPrice = Infinity; // If it's at the absolute max, let everything pass
        }
        filtered = filtered.filter(p => p.price <= maxPrice);

        // C. Theme Filter
        const activeThemes = Array.from(themeCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
        if (activeThemes.length > 0) {
            filtered = filtered.filter(p => activeThemes.includes(p.category));
        }

        // D. Availability Filter
        const activeStock = Array.from(stockCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
        if (activeStock.length > 0) {
            filtered = filtered.filter(p => {
                if (activeStock.includes('IN STOCK') && activeStock.includes('OUT OF STOCK')) return true;
                if (activeStock.includes('IN STOCK')) return p.inStock === true;
                if (activeStock.includes('OUT OF STOCK')) return p.inStock === false;
                return true;
            });
        }

        // E. Sorting Engine
        if (currentSort === 'RELEVANCE') {
            if (searchTerm) {
                // Sort by highest score first
                filtered.sort((a, b) => getRelevanceScore(b, searchTerm) - getRelevanceScore(a, searchTerm));
            } else {
                // If the search bar is empty, fallback to Latest
                filtered.sort((a, b) => new Date(b.date_published) - new Date(a.date_published));
            }
        } else if (currentSort === 'DEEP DISCOUNTS') {
            // Sort by highest discount percentage first
            filtered.sort((a, b) => {
                const discountA = a.discountPercent || 0;
                const discountB = b.discountPercent || 0;
                return discountB - discountA;
            });
        } else if (currentSort === 'LATEST') {
            filtered.sort((a, b) => new Date(b.date_published) - new Date(a.date_published));
        } else if (currentSort === 'OLDEST') {
            filtered.sort((a, b) => new Date(a.date_published) - new Date(b.date_published));
        } else if (currentSort === 'PRICE: LOW TO HIGH') {
            filtered.sort((a, b) => a.price - b.price);
        } else if (currentSort === 'PRICE: HIGH TO LOW') {
            filtered.sort((a, b) => b.price - a.price);
        } else if (currentSort === 'NAME: A-Z') {
            filtered.sort((a, b) => a.name.localeCompare(b.name));
        } else if (currentSort === 'NAME: Z-A') {
            filtered.sort((a, b) => b.name.localeCompare(a.name));
        }

        renderProducts(filtered);
    }

    function renderProducts(productsToDraw) {
        container.innerHTML = ''; 
        resultCount.innerText = `[ SHOWING: ${productsToDraw.length} / ${allProducts.length} ]`;

        if (productsToDraw.length === 0) {
            container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--term-muted); font-size: 1.5rem; margin-top: 50px;">> NO MANIFESTS MATCH CURRENT PARAMETERS.</p>';
            return;
        }

        productsToDraw.forEach(product => {
            let leftBadgeHTML = '';
            const ribbonStyle = `position: absolute; bottom: 10px; left: 0; padding: 4px 12px 4px 8px; font-weight: bold; font-size: 0.75em; clip-path: polygon(0 0, 90% 0, 100% 50%, 90% 100%, 0 100%); z-index: 10; opacity: 1; height: 20px; display: flex; align-items: center;`;

            if (product.inventoryStatus === 'LOW STOCK') {
                leftBadgeHTML = `<div style="${ribbonStyle} background: #e5a823; color: #000;">LOW STOCK</div>`;
            } else if (product.inventoryStatus === 'SOLD OUT') {
                leftBadgeHTML = `<div style="${ribbonStyle} background: #cc0000; color: #fff;">SOLD OUT</div>`;
            }

            let rightBadgesHTML = `<div style="position: absolute; bottom: 0; right: 0; top: 0; width: 40%; background: linear-gradient(to top left, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 50%); pointer-events: none; z-index: 4;"></div><div style="position: absolute; bottom: 10px; right: 10px; display: flex; flex-direction: column-reverse; gap: 5px; align-items: flex-end; z-index: 5;">`;
            if (product.onSale) rightBadgesHTML += `<div class="tactical-badge" style="position: relative; height: 20px; display: flex; align-items: center; background: #cc0000; color: #fff; opacity: 1;">${product.discountPercent}% OFF</div>`;
            if (product.isNew) rightBadgesHTML += `<div class="tactical-badge" style="position: relative; height: 20px; display: flex; align-items: center; background: #00e5ff; color: #000; opacity: 1;">NEW</div>`;
            rightBadgesHTML += '</div>';

            const currentPriceFormatted = `₱${product.price.toLocaleString()}`;
            const oldPriceFormatted = product.onSale ? `₱${product.old_price.toLocaleString()}` : '';

            const cardHTML = `
                <div class="product-card cyber-panel">
                    <a href="#" class="product-link">
                        <div class="product-image-wrapper" style="background: #000;">
                            ${leftBadgeHTML + rightBadgesHTML}
                            <img src="${product.imageString}" alt="${product.name}" class="product-image" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.8;">
                            <div class="view-details-banner"><span>[ VIEW DETAILS ]</span></div>
                        </div>
                        <div class="product-info">
                            <span class="product-category">> ${product.category}</span>
                            <h3 class="product-name">${product.name}</h3>
                            <div class="price-container" style="display: flex; align-items: flex-end; gap: 8px;">
                                <span class="product-price" style="line-height: 1;">${currentPriceFormatted}</span>
                                ${product.onSale ? `<span style="text-decoration: line-through; color: #e5a823; font-size: 0.7em; line-height: 1.2;">${oldPriceFormatted}</span>` : ''}
                            </div>
                        </div>
                    </a>
                    <div class="product-actions">
                        <button class="tac-btn tac-btn--full" ${!product.inStock ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                            ${product.inStock ? '[ ADD TO CART ]' : '[ OUT OF STOCK ]'}
                        </button>
                    </div>
                </div>
            `;
            container.innerHTML += cardHTML;
        });
    }

    // --- EVENT LISTENERS ---
    if(searchInput) searchInput.addEventListener('input', () => {
        // Auto-switch dropdown to "Relevance" when they start typing
        if (searchInput.value.length > 0 && currentSort !== 'RELEVANCE') {
            sortDropdown.value = 'RELEVANCE'; // Updates the UI dropdown
            currentSort = 'RELEVANCE';        // Updates the system state
        }
        applyFilters();
    });

    if (priceSlider && priceDisplay) {
        priceSlider.addEventListener("input", (e) => {
            const rawValue = Number(e.target.value);
            if (rawValue >= 15500) {
                priceDisplay.innerText = `MAX PRICE: ANY`;
            } else {
                priceDisplay.innerText = `MAX PRICE: ₱${rawValue.toLocaleString()}`;
            }
            applyFilters();
        });
    }

    themeCheckboxes.forEach(cb => cb.addEventListener('change', applyFilters));
    stockCheckboxes.forEach(cb => cb.addEventListener('change', applyFilters));

    // NEW DROPDOWN LISTENER
    if (sortDropdown) {
        sortDropdown.addEventListener('change', (e) => {
            currentSort = e.target.value;
            applyFilters();
            
            // THE FIX: Instantly drop the "focus" so it reverts back to gray!
            e.target.blur(); 
        });
    }

    initCatalog();
});