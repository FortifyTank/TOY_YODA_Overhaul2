document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. STATE MANAGEMENT
    // ==========================================
    let allProducts = []; 
    let currentSort = 'LATEST'; 
    let currentPage = 1;
    const itemsPerPage = 16;

    // ==========================================
    // 2. DOM ELEMENTS
    // ==========================================
    const container = document.getElementById('product-container');
    const resultCount = document.getElementById('resultCount');
    const searchInput = document.getElementById('searchInput');
    const priceSlider = document.getElementById("priceSlider");
    const priceDisplay = document.getElementById("priceDisplay");
    const topPagination = document.getElementById('topPagination');
    const bottomPagination = document.getElementById('bottomPagination');

    const stockCheckboxes = document.querySelectorAll('.stock-checkbox');
    const sortDropdown = document.getElementById('sortDropdown');

    // ==========================================
    // 3. INITIALIZATION
    // ==========================================
    async function initCatalog() {
        try {
            const response = await fetch('/api/products');
            allProducts = await response.json();
            generateThemeFilters(allProducts);

            // --- BULLETPROOF URL JUMP PARAMETER ---
            const urlParams = new URLSearchParams(window.location.search);
            const targetCategory = urlParams.get('category');
            
            if (targetCategory) {
                const checkboxes = document.querySelectorAll('.theme-checkbox');
                // Force lowercase and trim spaces to ensure a flawless match
                const cleanTarget = targetCategory.trim().toLowerCase();
                
                checkboxes.forEach(cb => {
                    const cleanValue = cb.value.trim().toLowerCase();
                    if (cleanValue === cleanTarget) {
                        cb.checked = true;
                    }
                });
            }
            // -----------------------------------------

            applyFilters(); 
        } catch (error) {
            console.error("Error loading the catalog:", error);
            container.innerHTML = '<p class="text-red">> ERROR: DATABASE CONNECTION LOST.</p>';
        }
    }

    // ==========================================
    // 4. CORE LOGIC (Scoring & Filtering)
    // ==========================================
    function getRelevanceScore(product, searchTerm) {
        if (!searchTerm) return 0;
        
        let score = 0;
        const term = searchTerm.toLowerCase();
        const name = product.name.toLowerCase();
        const category = product.category.toLowerCase();
        
        if (name.includes(term)) score += 50;
        if (category.includes(term)) score += 20;
        if (product.tags && product.tags.some(tag => tag.toLowerCase().includes(term))) {
            score += 10;
        }
        
        return score;
    }

    // Automatically generates checkboxes based on what exists in the database!
    function generateThemeFilters(products) {
        const filterContainer = document.getElementById('dynamicThemeFilters');
        if (!filterContainer) return;

        // 1. Extract a list of all categories, then use Set() to remove duplicates, and sort() alphabetically
        const uniqueCategories = [...new Set(products.map(p => p.category))].sort();

        // 2. Build the HTML for each unique category
        let html = '';
        uniqueCategories.forEach(category => {
            html += `
            <label class="tactical-checkbox">
                <input type="checkbox" class="theme-checkbox" value="${category}">
                <span class="check-box"></span> ${category}
            </label>
            `;
        });

        // 3. Inject it into the sidebar
        filterContainer.innerHTML = html;

        // 4. Attach the event listeners to the NEWLY created checkboxes
        document.querySelectorAll('.theme-checkbox').forEach(cb => {
            cb.addEventListener('change', applyFilters);
        });
    }

    function applyFilters() {
        let filtered = allProducts;
        const searchTerm = searchInput.value.toLowerCase();

        // A. Search Bar
        if (searchTerm) {
            filtered = filtered.filter(p => getRelevanceScore(p, searchTerm) > 0);
        }

        // B. Price Slider
        let maxPrice = Number(priceSlider.value);
        if (maxPrice >= 15500) maxPrice = Infinity;
        filtered = filtered.filter(p => p.price <= maxPrice);

        // C. Theme
        const activeThemes = Array.from(document.querySelectorAll('.theme-checkbox')).filter(cb => cb.checked).map(cb => cb.value);
        if (activeThemes.length > 0) {
            filtered = filtered.filter(p => activeThemes.includes(p.category));
        }

        // D. Availability
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
                filtered.sort((a, b) => getRelevanceScore(b, searchTerm) - getRelevanceScore(a, searchTerm));
            } else {
                filtered.sort((a, b) => new Date(b.date_published) - new Date(a.date_published));
            }
        } else if (currentSort === 'DEEP DISCOUNTS') {
            filtered.sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0));
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

        currentPage = 1; 
        renderProducts(filtered);
    }

    // ==========================================
    // 5. UI RENDERING
    // ==========================================
    function renderProducts(filteredList) {
        container.innerHTML = ''; 
        
        const totalItems = filteredList.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageItems = filteredList.slice(startIndex, endIndex);

        // Empty State (OPTIMIZED: Using CSS Utilities)
        if (totalItems === 0) {
            resultCount.innerText = `[ SHOWING: 0 / 0 ]`;
            container.innerHTML = '<p class="col-span-full text-center text-muted text-lg mt-30">> NO MANIFESTS MATCH CURRENT PARAMETERS.</p>';
            renderPagination(0, filteredList);
            return;
        }

        const showingStart = startIndex + 1;
        const showingEnd = Math.min(endIndex, totalItems);
        resultCount.innerText = `[ SHOWING: ${showingStart}-${showingEnd} OF ${totalItems} ]`;

        pageItems.forEach(product => {
            let leftBadgeHTML = '';
            if (product.inventoryStatus === 'LOW STOCK') {
                leftBadgeHTML = `<div class="badge-ribbon badge-low-stock">LOW STOCK</div>`;
            } else if (product.inventoryStatus === 'SOLD OUT') {
                leftBadgeHTML = `<div class="badge-ribbon badge-sold-out">SOLD OUT</div>`;
            }

            let rightBadgesHTML = `
                <div class="card-gradient-overlay"></div>
                <div class="right-badges-container">
            `;
            if (product.onSale) rightBadgesHTML += `<div class="tactical-badge badge-sale">${product.discountPercent}% OFF</div>`;
            if (product.isNew) rightBadgesHTML += `<div class="tactical-badge badge-new">NEW</div>`;
            rightBadgesHTML += '</div>';

            const currentPriceFormatted = `₱${product.price.toLocaleString()}`;
            const oldPriceFormatted = product.onSale ? `₱${product.old_price.toLocaleString()}` : '';

            // 1. Create the Star Badge HTML
            const starText = product.reviewCount > 0 ? `[ ★ ${product.averageRating} ]` : `[ ☆ 0.0 ]`;
            const starBadgeHTML = `<div class="text-amber font-bold text-sm mt-5 mb-5">${starText} <span class="text-muted">(${product.reviewCount || 0})</span></div>`;

            // 2. Inject it under the product-name!
            const cardHTML = `
                <article class="product-card cyber-panel panel-interactive panel-hover-bg-yellow">
                    <a href="/product?sku=${product.sku}" class="product-link">
                        <div class="product-image-wrapper">
                            ${leftBadgeHTML + rightBadgesHTML}
                            <img src="${product.imageString}" alt="${product.name}" class="product-image">
                            <div class="view-details-banner"><span>[ VIEW DETAILS ]</span></div>
                        </div>
                        <div class="product-info">
                            <span class="product-category">> ${product.category}</span>
                            <h3 class="product-name">${product.name}</h3>
                            
                            ${starBadgeHTML}
                            
                            <div class="price-container">
                                <span class="product-price">${currentPriceFormatted}</span>
                                ${product.onSale ? `<span class="old-price-strike">${oldPriceFormatted}</span>` : ''}
                            </div>
                        </div>
                    </a>
                    <div class="product-actions">
                        <button class="tac-btn tac-btn--full" 
                            ${!product.inStock ? 'disabled' : ''}
                            onclick='addToCart(${JSON.stringify(product)})'>
                            ${product.inStock ? '[ ADD TO CART ]' : '[ OUT OF STOCK ]'}
                        </button>
                    </div>
                </article> 
            `;
            container.innerHTML += cardHTML;
        });
        
        renderPagination(totalPages, filteredList);
    }

    function renderPagination(totalPages, filteredList) {
        if (totalPages <= 1) {
            topPagination.innerHTML = '';
            bottomPagination.innerHTML = '';
            return;
        }

        let buttonsHTML = `<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} data-page="prev">[ < ]</button>`;
        
        let pages = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 3) {
                pages = [1, 2, 3, 4, '...', totalPages];
            } else if (currentPage >= totalPages - 2) {
                pages = [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
            } else {
                pages = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
            }
        }

        pages.forEach(p => {
            if (p === '...') {
                // OPTIMIZED: Using the new CSS class
                buttonsHTML += `<span class="pagination-ellipsis">...</span>`;
            } else {
                buttonsHTML += `<button class="page-btn ${currentPage === p ? 'active' : ''}" data-page="${p}">[ ${p} ]</button>`;
            }
        });
        
        buttonsHTML += `<button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="next">[ > ]</button>`;

        topPagination.innerHTML = buttonsHTML;
        bottomPagination.innerHTML = buttonsHTML;

        const attachClickEvents = (navContainer) => {
            const btns = navContainer.querySelectorAll('.page-btn');
            btns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const action = e.target.getAttribute('data-page');
                    if (!action) return; 
                    
                    if (action === 'prev' && currentPage > 1) currentPage--;
                    else if (action === 'next' && currentPage < totalPages) currentPage++;
                    else if (action !== 'prev' && action !== 'next') currentPage = parseInt(action);
                    
                    renderProducts(filteredList);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });
            });
        };

        attachClickEvents(topPagination);
        attachClickEvents(bottomPagination);
    }

    // ==========================================
    // 6. EVENT LISTENERS
    // ==========================================
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            if (searchInput.value.length > 0 && currentSort !== 'RELEVANCE') {
                sortDropdown.value = 'RELEVANCE'; 
                currentSort = 'RELEVANCE';        
            }
            applyFilters();
        });
    }

    if (priceSlider && priceDisplay) {
        priceSlider.addEventListener("input", (e) => {
            const rawValue = Number(e.target.value);
            priceDisplay.innerText = rawValue >= 15500 ? `MAX PRICE: ANY` : `MAX PRICE: ₱${rawValue.toLocaleString()}`;
            applyFilters();
        });
    }

    stockCheckboxes.forEach(cb => cb.addEventListener('change', applyFilters));

    if (sortDropdown) {
        sortDropdown.addEventListener('change', (e) => {
            currentSort = e.target.value;
            applyFilters();
            e.target.blur(); 
        });
    }

    // Ignite
    initCatalog();
});