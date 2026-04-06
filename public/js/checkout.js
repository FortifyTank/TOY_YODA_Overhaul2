document.addEventListener('DOMContentLoaded', () => {
    
    let equippedAddress = null;
    const cart = JSON.parse(localStorage.getItem('toy_yoda_cart')) || [];

    const addressContainer = document.getElementById('checkoutAddressContainer');
    const itemsContainer = document.getElementById('checkoutItemsContainer');
    const subtotalDisplay = document.getElementById('summarySubtotal');
    const shippingDisplay = document.getElementById('summaryShipping');
    const totalDisplay = document.getElementById('summaryTotal');
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    
    // security check: if cart is empty, kick them back to the store immediately
    if (cart.length === 0) {
        window.location.href = '/catalog';
        return;
    }

    async function loadUserAddress() {
        try {
            const response = await fetch('/api/profile');
            if (response.ok) {
                const data = await response.json();
                
                document.getElementById('checkoutUsernameDisplay').innerText = data.username.toUpperCase();
                
                const activeAddress = data.addresses.find(addr => addr.isEquipped);
                
                if (activeAddress) {
                    equippedAddress = activeAddress;
                    addressContainer.innerHTML = `
                        <div class="checkout-address-box">
                            <p class="text-green text-lg" style="font-weight: bold;">${activeAddress.label}</p>
                            <p class="text-regular mt-10">${activeAddress.addressLine}</p>
                            <p class="text-regular">Brgy. ${activeAddress.barangay}, ${activeAddress.city}</p>
                            <p class="text-regular">${activeAddress.province}, ${activeAddress.zipCode}</p>
                        </div>
                    `;
                } else {
                    addressContainer.innerHTML = `
                        <p class="text-red">> NO ADDRESS SELECTED.</p>
                        <p class="text-muted mt-10">Please update your profile to continue.</p>
                    `;
                    placeOrderBtn.disabled = true; // Stop them from buying without an address
                }
            } else {
                // If not logged in, kick to login
                window.location.href = '/login';
            }
        } catch (error) {
            addressContainer.innerHTML = `<p class="text-red">> ERROR LOADING ADDRESS.</p>`;
            placeOrderBtn.disabled = true;
        }
    }

    function renderOrderSummary() {
        let subtotal = 0;
        itemsContainer.innerHTML = '';

        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;

            itemsContainer.innerHTML += `
                <div class="checkout-item-row">
                    <img src="${item.image || '/images/default-placeholder.png'}" alt="${item.name}" class="checkout-item-img">
                    
                    <div>
                        <p class="text-regular">${item.name}</p>
                        <p class="text-muted text-sm">QTY: ${item.quantity}</p>
                    </div>
                    
                    <span class="text-amber font-bold checkout-item-price">₱${itemTotal.toLocaleString()}</span>
                </div>
            `;
        });

        let shippingFee = 0;
        if (subtotal <= 10000) {
            shippingFee = subtotal * 0.10; // 10% fee for orders 10k or below
        } 
        // If subtotal > 10000,free shipping

        const totalAmount = subtotal + shippingFee;

        subtotalDisplay.innerText = `₱${subtotal.toLocaleString()}`;
        shippingDisplay.innerText = shippingFee === 0 ? "FREE" : `₱${shippingFee.toLocaleString()}`;
        totalDisplay.innerText = `₱${totalAmount.toLocaleString()}`;
    }

    // checkout event listeners
    placeOrderBtn.addEventListener('click', async () => {
        if (!equippedAddress) {
            showSystemAlert("> ERROR: NO DEPLOYMENT DESTINATION LOCKED.");
            return;
        }

        placeOrderBtn.innerText = '[ TRANSMITTING ORDER... ]';
        placeOrderBtn.disabled = true;

        try {
            const response = await fetch('/api/orders/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cart: cart.map(item => ({ 
                        productId: item._id || item.id || item.productId, 
                        quantity: item.quantity 
                    })),
                    address: equippedAddress
                })
            });

            const result = await response.json();

            if (response.ok) {
                showSystemAlert(`> SYSTEM: PAYMENT SECURED.\n> ORDER NUMBER: ${result.orderNumber}`, 'success');
                
                localStorage.removeItem('toy_yoda_cart');
                
                setTimeout(() => {
                    window.location.href = '/catalog'; 
                }, 3500);

            } else {
                showSystemAlert(`> ERROR: ${result.error}`);
                placeOrderBtn.innerText = '[ PROCEED TO PAYMENT ]';
                placeOrderBtn.disabled = false;
            }
        } catch (error) {
            console.error("Transmission Error:", error);
            showSystemAlert("> FATAL ERROR: CONNECTION TO SERVER LOST.");
            placeOrderBtn.innerText = '[ PROCEED TO PAYMENT ]';
            placeOrderBtn.disabled = false;
        }
    });

    loadUserAddress();
    renderOrderSummary();
});