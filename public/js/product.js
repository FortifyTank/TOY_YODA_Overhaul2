document.addEventListener('DOMContentLoaded', async () => {
    
    const urlParams = new URLSearchParams(window.location.search);
    const sku = urlParams.get('sku');

    if (!sku) {
        window.location.href = '/products';
        return;
    }

    let currentQuantity = 1;
    let maxStock = 0;

    try {
        // 1. Fetch the main product
        const response = await fetch(`/api/products/sku/${sku}`);
        const product = await response.json();

        if (!response.ok) throw new Error(product.error || "Product not found");

        // 2. Populate the UI
        document.getElementById('prodImage').src = product.imageString || '/images/default-placeholder.png';
        document.getElementById('prodCategory').innerText = `> ${product.category}`;
        document.getElementById('prodName').innerText = product.name.toUpperCase();
        document.getElementById('prodSku').innerText = `SKU: ${product.sku}`;
        document.getElementById('prodDesc').innerText = product.description || "No description provided.";
        document.getElementById('prodPrice').innerText = `₱${product.price.toLocaleString()}`;

        maxStock = product.avail_inventory;
        document.getElementById('prodStock').innerText = maxStock;

        const oldPriceEl = document.getElementById('prodOldPrice');
        if (product.old_price && product.old_price > product.price) {
            oldPriceEl.innerText = `₱${product.old_price.toLocaleString()}`;
            oldPriceEl.classList.remove('hidden-content');
        }

        // 3. Configure Quantity Buttons
        const btnAdd = document.getElementById('btnAddQty');
        const btnSub = document.getElementById('btnSubQty');
        const displayQty = document.getElementById('displayQty');
        const cartBtn = document.getElementById('addToCartBtn');

        if (!product.inStock || maxStock <= 0) {
            cartBtn.innerText = '[ SOLD OUT ]';
            cartBtn.disabled = true;
            cartBtn.classList.replace('tac-btn', 'tac-btn--ghost'); 
            cartBtn.style.pointerEvents = 'none'; // Kills the hover inversion
            btnAdd.disabled = true;
            btnSub.disabled = true;
            displayQty.innerText = "0";
        } else {
            btnAdd.addEventListener('click', () => {
                if (currentQuantity < maxStock) {
                    currentQuantity++;
                    displayQty.innerText = currentQuantity;
                }
            });

            btnSub.addEventListener('click', () => {
                if (currentQuantity > 1) {
                    currentQuantity--;
                    displayQty.innerText = currentQuantity;
                }
            });

            cartBtn.addEventListener('click', () => {
                if (typeof window.addToCart === 'function') {
                    window.addToCart(product, currentQuantity); // Passes the selected amount!
                }
            });
        }

        document.title = `Toy Yoda | ${product.name.toUpperCase()}`;

        // 4. Load Related Products (Reusing Catalog logic)
        const allRes = await fetch('/api/products');
        const allProducts = await allRes.json();
        
        // Find 4 items in the same category, excluding the one we are currently looking at
        const related = allProducts.filter(p => p.category === product.category && p.sku !== product.sku).slice(0, 4);
        const relContainer = document.getElementById('relatedProductsContainer');

        if (related.length === 0) {
            relContainer.innerHTML = '<p class="col-span-full text-muted">> NO RELATED ITEMS FOUND.</p>';
        } else {
            relContainer.innerHTML = '';
            related.forEach(relProduct => {
                let leftBadgeHTML = '';
                if (relProduct.inventoryStatus === 'LOW STOCK') leftBadgeHTML = `<div class="badge-ribbon badge-low-stock">LOW STOCK</div>`;
                else if (relProduct.inventoryStatus === 'SOLD OUT') leftBadgeHTML = `<div class="badge-ribbon badge-sold-out">SOLD OUT</div>`;

                let rightBadgesHTML = `<div class="card-gradient-overlay"></div><div class="right-badges-container">`;
                if (relProduct.onSale) rightBadgesHTML += `<div class="tactical-badge badge-sale">${relProduct.discountPercent}% OFF</div>`;
                if (relProduct.isNew) rightBadgesHTML += `<div class="tactical-badge badge-new">NEW</div>`;
                rightBadgesHTML += '</div>';

                const cardHTML = `
                    <article class="product-card cyber-panel panel-interactive panel-hover-bg-yellow">
                        <a href="/product?sku=${relProduct.sku}" class="product-link">
                            <div class="product-image-wrapper">
                                ${leftBadgeHTML + rightBadgesHTML}
                                <img src="${relProduct.imageString || '/images/default-placeholder.png'}" class="product-image">
                                <div class="view-details-banner"><span>[ VIEW DETAILS ]</span></div>
                            </div>
                            <div class="product-info">
                                <span class="product-category">> ${relProduct.category}</span>
                                <h3 class="product-name">${relProduct.name}</h3>
                                <div class="price-container">
                                    <span class="product-price">₱${relProduct.price.toLocaleString()}</span>
                                    ${relProduct.old_price > relProduct.price ? `<span class="old-price-strike">₱${relProduct.old_price.toLocaleString()}</span>` : ''}
                                </div>
                            </div>
                        </a>
                        <div class="product-actions">
                            <button class="tac-btn tac-btn--full" 
                                ${!relProduct.inStock ? 'disabled' : ''}
                                onclick='addToCart(${JSON.stringify(relProduct)})'>
                                ${relProduct.inStock ? '[ ADD TO CART ]' : '[ OUT OF STOCK ]'}
                            </button>
                        </div>
                    </article> 
                `;
                relContainer.innerHTML += cardHTML;
            });
        }

    } catch (err) {
        alert("> CLASSIFIED: ASSET NOT FOUND.");
        window.location.href = '/products';
    }
});