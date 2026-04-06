document.addEventListener('DOMContentLoaded', async () => {
    
    const urlParams = new URLSearchParams(window.location.search);
    const sku = urlParams.get('sku');

    if (!sku) {
        window.location.href = '/catalog';
        return;
    }

    let currentQuantity = 1;
    let maxStock = 0;

    // Main Product DOM
    const prodImage = document.getElementById('prodImage');
    const prodCategory = document.getElementById('prodCategory');
    const prodName = document.getElementById('prodName');
    const prodSku = document.getElementById('prodSku');
    const prodDesc = document.getElementById('prodDesc');
    const prodPrice = document.getElementById('prodPrice');
    const prodStock = document.getElementById('prodStock');
    const prodOldPrice = document.getElementById('prodOldPrice');
    
    // Reviews DOM
    const reviewsList = document.getElementById('reviewsListContainer');
    const avgStarDisplay = document.getElementById('avgStarRating');
    const totalCountDisplay = document.getElementById('totalReviewCount');
    const topStars = document.getElementById('topStars');
    const topReviewCount = document.getElementById('topReviewCount');
    
    // Review Form DOM
    const reviewFormContainer = document.getElementById('reviewFormContainer');
    const submitReviewForm = document.getElementById('submitReviewForm');
    const starWidget = document.getElementById('starInputWidget');
    const scoreInput = document.getElementById('reviewScore');
    const openReviewBtn = document.getElementById('openReviewFormBtn');
    const cancelReviewBtn = document.getElementById('cancelReviewBtn');
    const submitReviewBtn = document.getElementById('submitReviewBtn');
    const reviewTextInput = document.getElementById('reviewText');

    // Quantity & Cart DOM
    const btnAdd = document.getElementById('btnAddQty');
    const btnSub = document.getElementById('btnSubQty');
    const displayQty = document.getElementById('displayQty');
    const cartBtn = document.getElementById('addToCartBtn');
    
    const relContainer = document.getElementById('relatedProductsContainer');

    function escapeHTML(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
            }[tag] || tag)
        );
    }

    try {
        const response = await fetch(`/api/products/sku/${sku}`);
        const product = await response.json();

        if (!response.ok) throw new Error(product.error || "Product not found");

        prodImage.src = product.imageString || '/images/default-placeholder.png';
        prodCategory.innerText = `> ${product.category}`;
        prodName.innerText = product.name.toUpperCase();
        prodSku.innerText = `SKU: ${product.sku}`;
        prodDesc.innerText = product.description || "No description provided.";
        prodPrice.innerText = `₱${product.price.toLocaleString()}`;

        maxStock = product.avail_inventory;
        prodStock.innerText = maxStock;

        if (product.old_price && product.old_price > product.price) {
            prodOldPrice.innerText = `₱${product.old_price.toLocaleString()}`;
            prodOldPrice.classList.remove('hidden-content');
        }

        document.title = `Toy Yoda | ${product.name.toUpperCase()}`;

        const productId = product._id;

        async function loadReviews() {
            try {
                const res = await fetch(`/api/products/${productId}/reviews`);
                const data = await res.json();

                if(avgStarDisplay) avgStarDisplay.innerText = data.average || '0.0';
                if(totalCountDisplay) totalCountDisplay.innerText = data.total || '0';

                if (data.reviews.length === 0) {
                    if(reviewsList) reviewsList.innerHTML = '<p class="text-muted">> NO REVIEWS YET. BE THE FIRST.</p>';
                    if (topStars) topStars.innerText = '☆☆☆☆☆';
                    if (topReviewCount) topReviewCount.innerText = '(0 REVIEWS)';
                } else {
                    const avg = Math.round(data.average); 
                    if (topStars) topStars.innerText = '★'.repeat(avg) + '☆'.repeat(5 - avg);
                    if (topReviewCount) topReviewCount.innerText = `(${data.total} REVIEWS)`;
                    
                    if(reviewsList) {
                        reviewsList.innerHTML = data.reviews.map(rev => {
                            const safeUsername = escapeHTML(rev.username);
                            const safeComment = escapeHTML(rev.comment);
                            return `
                                <div class="review-card">
                                    <div class="review-header">
                                        <div>
                                            <span class="text-cyan font-bold">${safeUsername}</span>
                                            <span class="review-date ml-10">${new Date(rev.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div class="review-stars">${'★'.repeat(rev.rating)}${'☆'.repeat(5 - rev.rating)}</div>
                                    </div>
                                    <div class="review-body">${safeComment}</div>
                                </div>
                            `;
                        }).join('');
                    }
                }
            } catch (err) {
                if(reviewsList) reviewsList.innerHTML = '<p class="text-red">> ERROR LOADING REVIEWS.</p>';
            }
        }

        // Smooth Scroll Event
        document.getElementById('topStarDisplay')?.addEventListener('click', () => {
            reviewsList?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });

        // 5-Star Input Logic
        if (starWidget) {
            const stars = starWidget.querySelectorAll('span');
            stars.forEach(star => {
                star.addEventListener('click', () => {
                    const value = star.getAttribute('data-value');
                    scoreInput.value = value;
                    stars.forEach(s => {
                        if (s.getAttribute('data-value') <= value) s.classList.add('active');
                        else s.classList.remove('active');
                    });
                });
            });
        }

        // Form Toggles
        if (openReviewBtn) {
            openReviewBtn.addEventListener('click', () => {
                reviewFormContainer.classList.add('active'); 
                openReviewBtn.classList.add('hidden-content'); 
            });
        }

        if (cancelReviewBtn) {
            cancelReviewBtn.addEventListener('click', () => {
                reviewFormContainer.classList.remove('active'); 
                openReviewBtn.classList.remove('hidden-content'); 
            });
        }

        // Submit Review Event
        if (submitReviewForm) {
            submitReviewForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const rating = scoreInput.value;
                const comment = reviewTextInput.value;

                if (!rating) return showSystemAlert("> PLEASE SELECT A STAR RATING.");

                submitReviewBtn.innerText = '[ SUBMITTING... ]';

                try {
                    const res = await fetch(`/api/products/${productId}/reviews`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ rating, comment })
                    });
                    const result = await res.json();

                    if (res.ok) {
                        showSystemAlert(result.message, 'success');
                        reviewFormContainer.classList.remove('active'); 
                        submitReviewForm.reset(); 
                        loadReviews(); 
                    } else {
                        showSystemAlert(result.error);
                        submitReviewBtn.innerText = '[ PUBLISH REVIEW ]'; 
                    }
                } catch (err) {
                    showSystemAlert("> CONNECTION ERROR.");
                    submitReviewBtn.innerText = '[ PUBLISH REVIEW ]';
                }
            });
        }

        // security check to ensure they actually bought the thing first
        async function checkReviewEligibility() {
            try {
                const res = await fetch('/api/orders'); 
                if (res.ok) {
                    const orders = await res.json();
                    const canReview = orders.some(o => 
                        o.status === 'DELIVERED' && 
                        o.items.some(item => item.product._id === productId)
                    );
                    
                    if (canReview && openReviewBtn) {
                        openReviewBtn.classList.remove('hidden-content');

                        if (urlParams.get('action') === 'review') {
                            setTimeout(() => {
                                reviewFormContainer.classList.add('active'); 
                                openReviewBtn.classList.add('hidden-content'); 
                                reviewFormContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                window.history.replaceState({}, document.title, window.location.pathname + "?sku=" + sku);
                            }, 800); 
                        }
                    }
                }
            } catch (err) { console.error("Review auth check failed:", err); }
        }

        loadReviews();
        checkReviewEligibility();

        if (!product.inStock || maxStock <= 0) {
            cartBtn.innerText = '[ SOLD OUT ]';
            cartBtn.disabled = true;
            cartBtn.classList.replace('tac-btn', 'tac-btn--ghost'); 
            cartBtn.style.pointerEvents = 'none'; 
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
                    window.addToCart(product, currentQuantity); 
                }
            });
        }

        const allRes = await fetch('/api/products');
        const allProducts = await allRes.json();
        
        const related = allProducts.filter(p => p.category === product.category && p.sku !== product.sku).slice(0, 4);

        if (related.length === 0) {
            if(relContainer) relContainer.innerHTML = '<p class="col-span-full text-muted">> NO RELATED ITEMS FOUND.</p>';
        } else if (relContainer) {
            relContainer.innerHTML = '';
            related.forEach(relProduct => {
                let leftBadgeHTML = '';
                if (relProduct.inventoryStatus === 'LOW STOCK') leftBadgeHTML = `<div class="badge-ribbon badge-low-stock">LOW STOCK</div>`;
                else if (relProduct.inventoryStatus === 'SOLD OUT') leftBadgeHTML = `<div class="badge-ribbon badge-sold-out">SOLD OUT</div>`;

                let rightBadgesHTML = `<div class="card-gradient-overlay"></div><div class="right-badges-container">`;
                if (relProduct.onSale) rightBadgesHTML += `<div class="tactical-badge badge-sale">${relProduct.discountPercent}% OFF</div>`;
                if (relProduct.isNew) rightBadgesHTML += `<div class="tactical-badge badge-new">NEW</div>`;
                rightBadgesHTML += '</div>';

                // Sync the star logic from catalog.js
                const starText = relProduct.reviewCount > 0 ? `[ ★ ${relProduct.averageRating} ]` : `[ ☆ 0.0 ]`;
                const starBadgeHTML = `<div class="text-amber font-bold text-sm mt-5 mb-5">${starText} <span class="text-muted">(${relProduct.reviewCount || 0})</span></div>`;

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
                                ${starBadgeHTML}
                                <div class="price-container">
                                    <span class="product-price">₱${relProduct.price.toLocaleString()}</span>
                                    ${relProduct.old_price > relProduct.price ? `<span class="old-price-strike">₱${relProduct.old_price.toLocaleString()}</span>` : ''}
                                </div>
                            </div>
                        </a>
                        <div class="product-actions">
                            <button class="tac-btn tac-btn--full" 
                                ${!relProduct.inStock ? 'disabled' : ''}
                                onclick='addToCart(${JSON.stringify(relProduct).replace(/'/g, "&#39;")})'>
                                ${relProduct.inStock ? '[ ADD TO CART ]' : '[ OUT OF STOCK ]'}
                            </button>
                        </div>
                    </article> 
                `;
                relContainer.innerHTML += cardHTML;
            });
        }

    } catch (err) {
        if(window.showSystemAlert) window.showSystemAlert("> CLASSIFIED: ASSET NOT FOUND.");
        window.location.href = '/catalog';
    }
});