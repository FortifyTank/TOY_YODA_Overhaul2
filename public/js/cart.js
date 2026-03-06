document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. STATE & DOM ELEMENTS
    // ==========================================
    let cart = JSON.parse(localStorage.getItem('toy_yoda_cart')) || [];
    let alertTimer;
    
    const cartStatusElements = document.querySelectorAll('.cart-status');
    const cartOverlay = document.getElementById('cartOverlay');
    const cartDrawer = document.getElementById('cartDrawer');
    const closeCartBtn = document.getElementById('closeCartBtn');
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const cartTotalDisplay = document.getElementById('cartTotalDisplay');
    const clearCartBtn = document.getElementById('clearCartBtn');
    const proceedCheckoutBtn = document.getElementById('proceedCheckoutBtn');

    const systemAlert = document.getElementById('systemAlert');
    const systemAlertMessage = document.getElementById('systemAlertMessage');
    const systemAlertOkBtn = document.getElementById('systemAlertOkBtn');

    // ==========================================
    // 2. UI & ALERT UTILITIES
    // ==========================================
    
    // Displays user-friendly popup warnings
    function showSystemAlert(message) {
        if (!systemAlert) return;
        systemAlertMessage.innerText = message;
        systemAlert.classList.add('active'); 

        clearTimeout(alertTimer);
        alertTimer = setTimeout(() => {
            systemAlert.classList.remove('active');
        }, 7000); 
    }

    // Flashes the cart button and triggers a drawer redraw
    function updateCartUI(animate = false) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        
        cartStatusElements.forEach(el => {
            el.innerText = `[ CART: ${totalItems} ]`;
            
            if (animate) {
                el.style.backgroundColor = 'var(--amber-accent)';
                el.style.color = 'var(--bg-deep)';
                setTimeout(() => {
                    el.style.backgroundColor = '';
                    el.style.color = '';
                }, 200);
            } else {
                setTimeout(() => el.classList.add('ready'), 50); 
            }
        });

        renderCartDrawer();
    }

    // Draws the HTML items inside the slide-out panel
    function renderCartDrawer() {
        if (!cartItemsContainer) return;

        cartItemsContainer.innerHTML = '';
        let totalPrice = 0;

        // OPTIMIZATION: Removed inline styles, added .text-muted, .text-center, .mt-20
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="text-muted text-center mt-20">> YOUR CART IS EMPTY.</p>';
            cartTotalDisplay.innerText = '₱0';
            return;
        }

        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            totalPrice += itemTotal;

            // OPTIMIZATION: Zero inline styles. All handled by utility classes now!
            const itemHTML = `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                    <div class="cart-item-details">
                        
                        <div class="flex-between align-start">
                            <div class="cart-item-title pr-10">${item.name}</div>
                            <button class="remove-item-btn" onclick="removeFromCart('${item.sku}')">[ REMOVE ]</button>
                        </div>
                        
                        <div class="flex-between mt-10">
                            <div class="qty-controls">
                                <button class="qty-btn" onclick="updateQuantity('${item.sku}', -1)">-</button>
                                <span class="qty-number">${item.quantity}</span>
                                <button class="qty-btn" onclick="updateQuantity('${item.sku}', 1)">+</button>
                            </div>
                            <span class="cart-item-price">₱${itemTotal.toLocaleString()}</span>
                        </div>

                    </div>
                </div>
            `;
            cartItemsContainer.innerHTML += itemHTML;
        });

        cartTotalDisplay.innerText = `₱${totalPrice.toLocaleString()}`;
    }

    // ==========================================
    // 3. CART DATA OPERATIONS (Global Window Functions)
    // ==========================================
    
    window.addToCart = function(product) {
        const existingItem = cart.find(item => item.sku === product.sku);
        
        if (existingItem) {
            if (existingItem.quantity < product.avail_inventory) {
                existingItem.quantity += 1;
            } else {
                // UX UPDATE: Clearer, friendlier terminology
                showSystemAlert(`> NOT ENOUGH STOCK: ONLY ${product.avail_inventory} AVAILABLE.`);
                return; 
            }
        } else {
            cart.push({
                _id: product._id, // <-- THE FIX: Now saving the Database ID!
                sku: product.sku,
                name: product.name,
                price: product.price,
                image: product.imageString,
                quantity: 1,
                maxStock: product.avail_inventory
            });
        }
        
        localStorage.setItem('toy_yoda_cart', JSON.stringify(cart));
        updateCartUI(true);
    };

    window.updateQuantity = function(sku, change) {
        const item = cart.find(i => i.sku === sku);
        if (item) {
            const newQuantity = item.quantity + change;

            if (newQuantity > item.maxStock) {
                // UX UPDATE: Clearer, friendlier terminology
                showSystemAlert(`> NOT ENOUGH STOCK: ONLY ${item.maxStock} AVAILABLE.`);
                return;
            }

            item.quantity = newQuantity;
            
            if (item.quantity <= 0) {
                cart = cart.filter(i => i.sku !== sku);
            }
            
            localStorage.setItem('toy_yoda_cart', JSON.stringify(cart));
            updateCartUI(true);
        }
    };

    window.removeFromCart = function(sku) {
        cart = cart.filter(i => i.sku !== sku);
        localStorage.setItem('toy_yoda_cart', JSON.stringify(cart));
        updateCartUI(true);
    };

    function clearCart() {
        cart = [];
        localStorage.setItem('toy_yoda_cart', JSON.stringify(cart));
        updateCartUI(true);
    }

    // ==========================================
    // 4. DRAWER CONTROLS & EVENT LISTENERS
    // ==========================================
    
    function openCart() {
        if(cartDrawer && cartOverlay) {
            cartDrawer.classList.add('active');
            cartOverlay.classList.add('active');
        }
    }

    function closeCart() {
        if(cartDrawer && cartOverlay) {
            cartDrawer.classList.remove('active');
            cartOverlay.classList.remove('active');
        }
    }

    // Initialization
    cartStatusElements.forEach(btn => btn.addEventListener('click', openCart));
    
    if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
    if (cartOverlay) cartOverlay.addEventListener('click', closeCart);
    if (clearCartBtn) clearCartBtn.addEventListener('click', clearCart);

    if (systemAlertOkBtn) {
        systemAlertOkBtn.addEventListener('click', () => {
            systemAlert.classList.remove('active'); 
            clearTimeout(alertTimer); 
        });
    }

    if (proceedCheckoutBtn) {
        proceedCheckoutBtn.addEventListener('click', () => window.location.href = '/checkout');
    }

    // Boot UI on load
    updateCartUI();
});