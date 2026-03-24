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

        // ==========================================
        // REVIEWS ENGINE
        // ==========================================
        const productId = product._id;
        const reviewsList = document.getElementById('reviewsListContainer');
        const avgStarDisplay = document.getElementById('avgStarRating');
        const totalCountDisplay = document.getElementById('totalReviewCount');
        const reviewFormContainer = document.getElementById('reviewFormContainer');
        const submitReviewForm = document.getElementById('submitReviewForm');
        const starWidget = document.getElementById('starInputWidget');
        const scoreInput = document.getElementById('reviewScore');
        const openReviewBtn = document.getElementById('openReviewFormBtn');
        const cancelReviewBtn = document.getElementById('cancelReviewBtn');

        // 1. Load existing reviews from the database
        async function loadReviews() {
            try {
                const res = await fetch(`/api/products/${productId}/reviews`);
                const data = await res.json();

                // Update the bottom summary
                avgStarDisplay.innerText = data.average || '0.0';
                totalCountDisplay.innerText = data.total || '0';

                // Update the TOP summary
                const topStars = document.getElementById('topStars');
                const topReviewCount = document.getElementById('topReviewCount');

                if (data.reviews.length === 0) {
                    reviewsList.innerHTML = '<p class="text-muted">> NO REVIEWS YET. BE THE FIRST.</p>';
                    if (topStars) topStars.innerText = '☆☆☆☆☆';
                    if (topReviewCount) topReviewCount.innerText = '(0 REVIEWS)';
                } else {
                    // Rounds the average to the nearest whole star for the visual display
                    const avg = Math.round(data.average); 
                    if (topStars) topStars.innerText = '★'.repeat(avg) + '☆'.repeat(5 - avg);
                    if (topReviewCount) topReviewCount.innerText = `(${data.total} REVIEWS)`;
                    
                    // Renders the review cards at the bottom
                    reviewsList.innerHTML = data.reviews.map(rev => `
                        <div class="review-card">
                            <div class="review-header">
                                <div>
                                    <span class="text-cyan font-bold">${rev.username}</span>
                                    <span class="review-date ml-10">${new Date(rev.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div class="review-stars">${'★'.repeat(rev.rating)}${'☆'.repeat(5 - rev.rating)}</div>
                            </div>
                            <div class="review-body">${rev.comment}</div>
                        </div>
                    `).join('');
                }
            } catch (err) {
                reviewsList.innerHTML = '<p class="text-red">> ERROR LOADING REVIEWS.</p>';
            }
        }

        // Add the Smooth Scroll Click Event
        document.getElementById('topStarDisplay')?.addEventListener('click', () => {
            document.getElementById('reviewsListContainer').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });

        // 2. Make the 5-Star input clickable
        if (starWidget) {
            const stars = starWidget.querySelectorAll('span');
            stars.forEach(star => {
                star.addEventListener('click', () => {
                    const value = star.getAttribute('data-value');
                    scoreInput.value = value;
                    // Light up the stars up to the one clicked
                    stars.forEach(s => {
                        if (s.getAttribute('data-value') <= value) s.classList.add('active');
                        else s.classList.remove('active');
                    });
                });
            });
        }

        if (openReviewBtn) {
            openReviewBtn.addEventListener('click', () => {
                reviewFormContainer.classList.add('active'); // Slides form down
                openReviewBtn.classList.add('hidden-content'); // Hides the button
            });
        }

        if (cancelReviewBtn) {
            cancelReviewBtn.addEventListener('click', () => {
                reviewFormContainer.classList.remove('active'); // Slides form up
                openReviewBtn.classList.remove('hidden-content'); // Shows button again
            });
        }

        // 3. Handle the Submit Button
        if (submitReviewForm) {
            submitReviewForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const rating = scoreInput.value;
                const comment = document.getElementById('reviewText').value;

                if (!rating) return showSystemAlert("> PLEASE SELECT A STAR RATING.");

                const btn = document.getElementById('submitReviewBtn');
                btn.innerText = '[ SUBMITTING... ]';

                try {
                    const res = await fetch(`/api/products/${productId}/reviews`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ rating, comment })
                    });
                    const result = await res.json();

                    if (res.ok) {
                        showSystemAlert(result.message, 'success');
                        reviewFormContainer.classList.remove('active'); // Hide the form smoothly
                        submitReviewForm.reset(); // Clear the text
                        
                        // We intentionally leave the 'openReviewBtn' hidden here 
                        // so they cannot try to submit a second review!
                        
                        loadReviews(); // Refresh the list
                    } else {
                        showSystemAlert(result.error);
                        btn.innerText = '[ PUBLISH REVIEW ]'; // Only reset button text on error
                    }
                } catch (err) {
                    showSystemAlert("> CONNECTION ERROR.");
                    btn.innerText = '[ PUBLISH REVIEW ]';
                }
            });
        }

        // 4. Security Check: Did they buy it?
        async function checkReviewEligibility() {
            try {
                const res = await fetch('/api/orders'); 
                if (res.ok) {
                    const orders = await res.json();
                    const canReview = orders.some(o => 
                        o.status === 'DELIVERED' && 
                        o.items.some(item => item.product._id === productId)
                    );
                    
                    if (canReview) {
                        // Reveal the BUTTON instead of the form!
                        openReviewBtn.classList.remove('hidden-content');
                    }
                }
            } catch (err) { console.error(err); }
        }

        // Ignite the functions!
        loadReviews();
        checkReviewEligibility();

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