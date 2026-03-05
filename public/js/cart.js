document.addEventListener('DOMContentLoaded', () => {
    
    let cart = JSON.parse(localStorage.getItem('toy_yoda_cart')) || [];
    
    const cartStatusElements = document.querySelectorAll('.cart-status');
    const cartOverlay = document.getElementById('cartOverlay');
    const cartDrawer = document.getElementById('cartDrawer');
    const closeCartBtn = document.getElementById('closeCartBtn');
    const cartItemsContainer = document.getElementById('cartItemsContainer');
    const cartTotalDisplay = document.getElementById('cartTotalDisplay');
    const clearCartBtn = document.getElementById('clearCartBtn');

    // NEW ALERT ELEMENTS
    const systemAlert = document.getElementById('systemAlert');
    const systemAlertMessage = document.getElementById('systemAlertMessage');
    const systemAlertOkBtn = document.getElementById('systemAlertOkBtn');

    // --- CUSTOM ALERT FUNCTION ---
    let alertTimer; // ADD THIS

    function showSystemAlert(message) {
        if (!systemAlert) return;
        systemAlertMessage.innerText = message;
        systemAlert.classList.add('active'); // Drops it down

        // ADD THIS: Clear any existing timer, then set a new 7-second auto-close
        clearTimeout(alertTimer);
        alertTimer = setTimeout(() => {
            systemAlert.classList.remove('active');
        }, 7000); // 7000 milliseconds = 7 seconds
    }

    if (systemAlertOkBtn) {
        systemAlertOkBtn.addEventListener('click', () => {
            systemAlert.classList.remove('active'); 
            clearTimeout(alertTimer); // Stop the timer if they manually closed it
        });
    }

    function updateCartUI() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        
        cartStatusElements.forEach(el => {
            el.innerText = `[ CART: ${totalItems} ]`;
            el.style.backgroundColor = 'var(--amber-accent)';
            el.style.color = 'var(--bg-deep)';
            setTimeout(() => {
                el.style.backgroundColor = '';
                el.style.color = '';
            }, 200);
        });

        renderCartDrawer();
    }

    function renderCartDrawer() {
        if (!cartItemsContainer) return;

        cartItemsContainer.innerHTML = '';
        let totalPrice = 0;

        if (cart.length === 0) {
            // Cleaned up the empty text
            cartItemsContainer.innerHTML = '<p style="color: var(--term-muted); text-align: center; margin-top: 20px;">> CART IS EMPTY.</p>';
            cartTotalDisplay.innerText = '₱0';
            return;
        }

        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            totalPrice += itemTotal;

            // Updated HTML to include [REMOVE] and [+]/[-] buttons
            const itemHTML = `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                    <div class="cart-item-details">
                        
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div class="cart-item-title" style="padding-right: 10px;">${item.name}</div>
                            <button class="remove-item-btn" onclick="removeFromCart('${item.sku}')">[ REMOVE ]</button>
                        </div>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                            <div class="qty-controls">
                                <button class="qty-btn" onclick="updateQuantity('${item.sku}', -1)">-</button>
                                <span style="color: var(--term-text); font-weight: bold; font-size: 1.1rem;">${item.quantity}</span>
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

    // --- ADDED: Modify Quantity Logic ---
    window.updateQuantity = function(sku, change) {
        const item = cart.find(i => i.sku === sku);
        if (item) {
            const newQuantity = item.quantity + change;

            // CHECK: Prevent clicking '+' past the max stock
            if (newQuantity > item.maxStock) {
                showSystemAlert(`> INVENTORY LIMIT REACHED: ONLY ${item.maxStock} AVAILABLE.`);
                return;
            }

            item.quantity = newQuantity;
            
            if (item.quantity <= 0) {
                cart = cart.filter(i => i.sku !== sku);
            }
            
            localStorage.setItem('toy_yoda_cart', JSON.stringify(cart));
            updateCartUI();
        }
    };

    // --- ADDED: Remove Item Logic ---
    window.removeFromCart = function(sku) {
        cart = cart.filter(i => i.sku !== sku);
        localStorage.setItem('toy_yoda_cart', JSON.stringify(cart));
        updateCartUI();
    };

    window.addToCart = function(product) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

        const existingItem = cart.find(item => item.sku === product.sku);
        
        if (existingItem) {
            // CHECK 2: Individual Stock Limit
            if (existingItem.quantity < product.avail_inventory) {
                existingItem.quantity += 1;
            } else {
                showSystemAlert(`> INVENTORY LIMIT REACHED: ONLY ${product.avail_inventory} AVAILABLE.`);
                return; 
            }
        } else {
            cart.push({
                sku: product.sku,
                name: product.name,
                price: product.price,
                image: product.imageString,
                quantity: 1,
                maxStock: product.avail_inventory
            });
        }
        
        localStorage.setItem('toy_yoda_cart', JSON.stringify(cart));
        updateCartUI();
    };

    function clearCart() {
        cart = [];
        localStorage.setItem('toy_yoda_cart', JSON.stringify(cart));
        updateCartUI();
    }

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

    cartStatusElements.forEach(btn => btn.addEventListener('click', openCart));
    if(closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
    if(cartOverlay) cartOverlay.addEventListener('click', closeCart);
    if(clearCartBtn) clearCartBtn.addEventListener('click', clearCart);

    updateCartUI();
});