document.addEventListener('DOMContentLoaded', () => {

    let editingAddressId = null;
    let userOrdersCache = [];

    const iconEdit = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06-.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`;
    const iconTrash = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;
    const iconAdd = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
    const iconHidden = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
    const iconVisible = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;

    const stage = document.querySelector('.profile-stage');
    
    // Forms & Views
    const logisticsForm = document.getElementById('logisticsForm');
    const addressListView = document.getElementById('addressListView');
    const phoneFormSubmit = document.getElementById('phoneForm');
    const passwordForm = document.getElementById('passwordForm');

    // Action Buttons
    const cancelAddressFormBtn = document.getElementById('cancelAddressFormBtn');
    const togglePhoneBtn = document.getElementById('togglePhoneBtn');
    const togglePassBtn = document.getElementById('togglePassBtn');
    const savePhoneBtn = document.getElementById('savePhoneBtn');
    const savePassBtn = document.getElementById('savePassBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    // History Panel Elements
    const tabOngoing = document.getElementById('tabOngoing');
    const tabArchived = document.getElementById('tabArchived');
    const ongoingContainer = document.getElementById('ongoingOrdersContainer');
    const archivedContainer = document.getElementById('archivedOrdersContainer');

    // Receipt Modal Logic
    const modalOverlay = document.getElementById('orderModalOverlay');
    const modalContent = document.getElementById('modalContent');


    async function loadProfileData() {
        try {
            const response = await fetch('/api/profile');
            
            if (response.ok) {
                const data = await response.json();
                
                document.getElementById('profileUsername').innerText = `[ USER: ${data.username} ]`;
                document.getElementById('profileRole').innerText = data.role.toUpperCase();
                document.getElementById('profileEmail').innerText = data.email;
                
                const safePhone = data.phone || 'UNREGISTERED';
                document.getElementById('profilePhone').innerText = safePhone.toUpperCase();

                const addresses = data.addresses || [];
                window.userAddressesCache = addresses; 
                renderAddressCards(addresses);
            } else {
                window.location.href = '/login';
            }
        } catch (err) {
            console.error("Profile load error:", err);
        }
    }

    // order history
    async function loadOrderHistory() {
        if (!ongoingContainer || !archivedContainer) return;

        try {
            const response = await fetch('/api/orders');
            if (!response.ok) throw new Error('Failed to fetch orders');
            userOrdersCache = await response.json();

            const ongoing = userOrdersCache.filter(o => ['PENDING', 'PREPARING', 'ON DELIVERY'].includes(o.status));
            const archived = userOrdersCache.filter(o => ['DELIVERED', 'CANCELLED'].includes(o.status));

            const buildCard = (order) => {
                const date = new Date(order.createdAt).toLocaleDateString('en-GB');
                let itemsPreview = `${order.items[0].quantity}x ${order.items[0].name}`;
                if (order.items.length > 1) itemsPreview += ` <span class="text-muted">(+${order.items.length - 1} MORE)</span>`;

                return `
                    <div class="history-card">
                        <div class="history-header">
                            <div>
                                <div class="text-cyan font-bold">${order.orderNumber}</div>
                                <div class="text-muted text-sm mt-5">PLACED: ${date}</div>
                            </div>
                            <div class="status-badge status-${order.status}">[ ${order.status} ]</div>
                        </div>
                        <div class="history-items">${itemsPreview}</div>
                        <div class="history-footer">
                            <span class="text-amber font-bold">₱${order.totalAmount.toLocaleString()}</span>
                            <button class="text-btn text-sm view-details-btn" data-id="${order._id}">[ VIEW DETAILS ]</button>
                        </div>
                    </div>
                `;
            };

            ongoingContainer.innerHTML = ongoing.length ? ongoing.map(buildCard).join('') : '<p class="text-muted">> NO ACTIVE DEPLOYMENTS.</p>';
            archivedContainer.innerHTML = archived.length ? archived.map(buildCard).join('') : '<p class="text-muted">> ARCHIVES EMPTY.</p>';

        } catch (err) {
            ongoingContainer.innerHTML = '<p class="text-red">> ERROR: LOG CONNECTION FAILED.</p>';
            archivedContainer.innerHTML = '<p class="text-red">> ERROR: LOG CONNECTION FAILED.</p>';
        }
    }

    
    function renderAddressCards(addresses) {
        const listContainer = document.getElementById('addressListContainer');
        const currentAddressDisplay = document.getElementById('currentAddressDisplay');
        
        listContainer.innerHTML = '';
        const equippedAddress = addresses.find(addr => addr.isEquipped === true);
        
        if (equippedAddress) {
            currentAddressDisplay.innerText = `${equippedAddress.label} - ${equippedAddress.city}`.toUpperCase();
            currentAddressDisplay.classList.replace('text-amber', 'text-green');
        } else {
            currentAddressDisplay.innerText = 'NONE';
            currentAddressDisplay.classList.replace('text-green', 'text-amber');
        }

        addresses.forEach(addr => {
            const isEquipped = addr.isEquipped ? 'equipped' : 'unequipped';
            const statusTag = addr.isEquipped ? '[ EQUIPPED ] ' : '';
            
            const cardHTML = `
                <div class="address-card ${isEquipped}" data-id="${addr._id}">
                    <div class="address-info">
                        <span class="address-title">${statusTag}${addr.label.toUpperCase()}</span>
                        <span class="address-detail">${addr.addressLine}, BRGY. ${addr.barangay}, ${addr.city}, ${addr.province}</span>
                    </div>
                    <div class="card-actions">
                        <button class="icon-btn edit-btn" data-id="${addr._id}" title="Edit Address">${iconEdit}</button>
                        <button class="icon-btn delete-btn" data-id="${addr._id}" title="Delete Address">${iconTrash}</button>
                    </div>
                </div>
            `;
            listContainer.innerHTML += cardHTML;
        });

        listContainer.innerHTML += `
            <div class="add-address-box" id="openAddressFormBtn">
                <div class="add-icon-circle">${iconAdd}</div>
            </div>
        `;

        attachAddressEventListeners(addresses);
    }

    function setupProfilePasswordToggle(btnId, inputId) {
        const btn = document.getElementById(btnId);
        const input = document.getElementById(inputId);
        
        if (btn && input) {
            btn.innerHTML = iconHidden; 
            btn.addEventListener("click", () => {
                const isPassword = input.getAttribute("type") === "password";
                input.setAttribute("type", isPassword ? "text" : "password");
                btn.innerHTML = isPassword ? iconVisible : iconHidden;
                btn.classList.toggle("active"); 
            });
        }
    }

    function toggleAddressForm() {
        const isListHidden = addressListView.style.display === 'none';
        addressListView.style.display = isListHidden ? 'block' : 'none';
        isListHidden ? logisticsForm.classList.remove('active') : logisticsForm.classList.add('active');
    }

    function openReceiptModal(order) {
        document.getElementById('modalOrderTitle').innerText = `// TACTICAL RECEIPT: ${order.orderNumber}`;

        let itemsHTML = '';
        order.items.forEach(item => {
            const sku = item.product?.sku || 'UNKNOWN-SKU';
            const isDelivered = order.status === 'DELIVERED';

            itemsHTML += `
                <div class="item-row">
                    <img src="${item.product?.imageString || '/images/default-placeholder.png'}" class="modal-img">
                    <div class="flex-1">
                        <div class="text-cyan text-sm">> SKU: ${sku}</div>
                        <div class="text-regular font-bold">${item.name}</div>
                        <div class="text-muted text-sm mt-5">QTY: ${item.quantity} | ₱${item.priceAtPurchase.toLocaleString()}</div>
                    </div>
                    
                    <div class="d-flex" style="flex-direction: column; gap: 10px; align-items: flex-end; justify-content: center;">
                        <a href="/product?sku=${sku}" class="tac-btn tac-btn--ghost text-sm" style="text-decoration: none;">[ VIEW PRODUCT ]</a>
                        
                        ${isDelivered ? `<a href="/product?sku=${sku}&action=review" class="tac-btn btn-orange-invert text-sm" style="text-decoration: none;">[ RATE THIS ITEM ]</a>` : ''}
                    </div>
                </div>
            `;
        });

        const t = order.timeline;
        const formatTime = (dateObj) => dateObj ? new Date(dateObj).toLocaleString('en-GB') : '---';
        
        let timelineHTML = `<div class="text-muted mt-10 text-sm">> PLACED: <span class="text-regular">${formatTime(t.placedAt)}</span></div>`;
        if (t.preparingAt) timelineHTML += `<div class="text-muted text-sm">> PACKED: <span class="text-amber">${formatTime(t.preparingAt)}</span></div>`;
        if (t.shippedAt) timelineHTML += `<div class="text-muted text-sm">> SHIPPED: <span class="text-cyan">${formatTime(t.shippedAt)}</span></div>`;
        if (t.deliveredAt) timelineHTML += `<div class="text-muted text-sm">> DELIVERED: <span class="text-green">${formatTime(t.deliveredAt)}</span></div>`;
        if (t.cancelledAt) timelineHTML += `<div class="text-muted text-sm">> CANCELLED: <span class="text-red">${formatTime(t.cancelledAt)}</span></div>`;

        modalContent.innerHTML = `
            <div class="receipt-grid">
                <div class="receipt-box">
                    <div class="receipt-box-title">> ORDER STATUS</div>
                    <div class="status-badge status-${order.status} text-lg">[ ${order.status} ]</div>
                    
                    <div class="mt-15 border-dashed-dim pb-10">
                        ${timelineHTML}
                    </div>
                </div>
                
                <div class="receipt-box">
                    <div class="receipt-box-title">> DESTINATION</div>
                    <div class="text-green font-bold text-lg">${order.shippingAddress.label}</div>
                    <div class="text-regular">${order.shippingAddress.addressLine}, BRGY. ${order.shippingAddress.barangay}</div>
                    <div class="text-regular">${order.shippingAddress.city}, ${order.shippingAddress.province} ${order.shippingAddress.zipCode}</div>
                </div>
            </div>

            <div class="receipt-box mt-15">
                <div class="receipt-box-title">> ITEMS SECURED</div>
                ${itemsHTML}
            </div>

            <div class="receipt-box mt-15">
                <div class="flex-between mb-5"><span class="text-muted">SUBTOTAL:</span> <span>₱${order.subtotal.toLocaleString()}</span></div>
                <div class="flex-between mb-12 border-dashed-dim pb-10"><span class="text-muted">SHIPPING:</span> <span>${order.shippingFee === 0 ? 'FREE' : '₱' + order.shippingFee.toLocaleString()}</span></div>
                <div class="flex-between text-lg text-amber font-bold"><span>TOTAL:</span> <span>₱${order.totalAmount.toLocaleString()}</span></div>
            </div>
        `;
        
        modalOverlay.classList.add('active');
    }

    if (window.location.hash === '#logistics') {
        stage.classList.add('stage-shift-right');
    }

    if (tabOngoing && tabArchived) {
        tabOngoing.addEventListener('click', () => {
            tabOngoing.classList.add('active'); tabArchived.classList.remove('active');
            ongoingContainer.classList.remove('hidden-content'); archivedContainer.classList.add('hidden-content');
        });
        tabArchived.addEventListener('click', () => {
            tabArchived.classList.add('active'); tabOngoing.classList.remove('active');
            archivedContainer.classList.remove('hidden-content'); ongoingContainer.classList.add('hidden-content');
        });
    }

    document.getElementById('openLogisticsBtn')?.addEventListener('click', () => {
        stage.classList.replace('stage-shift-left', 'stage-shift-right') || stage.classList.add('stage-shift-right');
    });
    
    document.getElementById('openHistoryBtn')?.addEventListener('click', () => {
        stage.classList.replace('stage-shift-right', 'stage-shift-left') || stage.classList.add('stage-shift-left');
    });
    
    document.querySelectorAll('.close-panel-btn').forEach(btn => {
        btn.addEventListener('click', () => { stage.classList.remove('stage-shift-right', 'stage-shift-left'); });
    });

    if (togglePhoneBtn && phoneFormSubmit) {
        togglePhoneBtn.addEventListener('click', () => {
            phoneFormSubmit.classList.toggle('active');
            togglePhoneBtn.innerText = phoneFormSubmit.classList.contains('active') ? '[ CANCEL ]' : '[ CHANGE ]';
            passwordForm.classList.remove('active');
            togglePassBtn.innerText = '[ CHANGE ]';
        });
    }

    if (togglePassBtn && passwordForm) {
        togglePassBtn.addEventListener('click', () => {
            passwordForm.classList.toggle('active');
            togglePassBtn.innerText = passwordForm.classList.contains('active') ? '[ CANCEL ]' : '[ CHANGE ]';
            phoneFormSubmit.classList.remove('active');
            togglePhoneBtn.innerText = '[ CHANGE ]';
        });
    }

    function attachAddressEventListeners(addresses) {
        // Add Address
        document.querySelectorAll('.address-card').forEach(card => {
            card.addEventListener('click', async (e) => {
                if (e.target.closest('.icon-btn')) return; 
                
                const addrId = card.getAttribute('data-id');
                const response = await fetch('/api/profile/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ equipAddressId: addrId })
                });
                const data = await response.json();
                if (response.ok) renderAddressCards(data.user.addresses);
            });
        });

        // Delete Address
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const addrId = btn.getAttribute('data-id');
                btn.innerHTML = '[...]'; 
                const response = await fetch('/api/profile/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ deleteAddressId: addrId })
                });
                const data = await response.json();
                if (response.ok) renderAddressCards(data.user.addresses);
            });
        });

        // Edit Address
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const addrId = btn.getAttribute('data-id');
                const targetAddr = addresses.find(a => a._id === addrId);
                
                if (targetAddr) {
                    editingAddressId = addrId; 
                    document.getElementById('shipLabel').value = targetAddr.label;
                    document.getElementById('shipAddressLine').value = targetAddr.addressLine;
                    document.getElementById('shipBarangay').value = targetAddr.barangay;
                    document.getElementById('shipCity').value = targetAddr.city;
                    document.getElementById('shipProvince').value = targetAddr.province;
                    document.getElementById('shipZip').value = targetAddr.zipCode;
                    
                    document.getElementById('saveLogisticsBtn').innerText = '[ UPDATE LOGISTICS ]';
                    toggleAddressForm(); 
                }
            });
        });

        // Open Add Address Form
        document.getElementById('openAddressFormBtn').addEventListener('click', () => {
            editingAddressId = null; 
            document.getElementById('logisticsForm').reset();
            document.getElementById('saveLogisticsBtn').innerText = '[ SAVE LOGISTICS ]';
            toggleAddressForm();
        });
    }

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('view-details-btn')) {
            const orderId = e.target.getAttribute('data-id');
            const targetOrder = userOrdersCache.find(o => o._id === orderId);
            
            if (targetOrder) openReceiptModal(targetOrder);
        }
    });

    document.getElementById('closeModalBtn')?.addEventListener('click', () => modalOverlay.classList.remove('active'));

    if (logisticsForm) {
        logisticsForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const newLabel = (document.getElementById('shipLabel').value || 'HOME').trim().toUpperCase();

            // STEP 3: THE UNIQUENESS CHECK
            if (!editingAddressId && window.userAddressesCache) {
                const isDuplicate = window.userAddressesCache.some(addr => addr.label.toUpperCase() === newLabel);
                if (isDuplicate) {
                    showSystemAlert("> ERROR: DEPLOYMENT LABEL ALREADY EXISTS. CHOOSE A UNIQUE NAME.");
                    return; // Kills the function so it doesn't save!
                }
            }

            const addressData = {
                label: newLabel,
                addressLine: document.getElementById('shipAddressLine').value.trim(),
                barangay: document.getElementById('shipBarangay').value.trim(),
                city: document.getElementById('shipCity').value.trim(),
                province: document.getElementById('shipProvince').value.trim(),
                zipCode: document.getElementById('shipZip').value.trim()
            };

            if (!addressData.label || !addressData.addressLine || !addressData.barangay || !addressData.city || !addressData.province || !addressData.zipCode) {
                showSystemAlert("> ERROR: ALL LOCATION PARAMETERS MUST BE COMPLETED.");
                return;
            }

            const payload = editingAddressId 
                ? { editAddressId: editingAddressId, editAddressData: addressData } 
                : { newAddress: addressData };

            const saveBtn = document.getElementById('saveLogisticsBtn');
            saveBtn.innerText = '[ TRANSMITTING... ]';

            try {
                const response = await fetch('/api/profile/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await response.json();

                if (response.ok) {
                    showSystemAlert("> SHIPPING ADDRESS SECURED.", "success");
                    window.userAddressesCache = data.user.addresses; 
                    renderAddressCards(data.user.addresses);
    
                    saveBtn.innerText = '[ SAVE ADDRESS ]';
                    logisticsForm.reset(); 
                    toggleAddressForm(); 
                } else {
                    showSystemAlert("> ERROR: COULD NOT SECURE ADDRESS DATA.");
                    saveBtn.innerText = '[ SAVE ADDRESS ]';
                }
            } catch (err) {
                showSystemAlert("> FATAL ERROR: CONNECTION LOST.");
                saveBtn.innerText = '[ SAVE ADDRESS ]';
            }
        });
    }

    if (phoneFormSubmit && savePhoneBtn) {
        phoneFormSubmit.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newPhoneInput = document.getElementById('newPhoneInput');
            const newPhone = newPhoneInput.value.trim(); 
            
            if (!newPhone) return;

            savePhoneBtn.innerText = '[ SAVING... ]';
            
            try {
                const response = await fetch('/api/profile/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone: newPhone })
                });

                if (response.ok) {
                    showSystemAlert("> PHONE NUMBER SECURED.", "success");
                    document.getElementById('profilePhone').innerText = newPhone.toUpperCase();
    
                    savePhoneBtn.innerText = '[ SAVE NUMBER ]';
                    newPhoneInput.value = ''; 
                    document.getElementById('togglePhoneBtn').click(); 
                }
            } catch (err) {
                savePhoneBtn.innerText = '[ ERROR ]';
            }
        });
    }

    // Password Update
    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevents page reload
            
            const oldPassInput = document.getElementById('oldPassInput');
            const newPassInput = document.getElementById('newPassInput');
            
            if (!oldPassInput.value || !newPassInput.value) return;

            savePassBtn.innerText = '[ ENCRYPTING... ]';

            try {
                const response = await fetch('/api/profile/password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ oldPassword: oldPassInput.value, newPassword: newPassInput.value })
                });

                if (response.ok) {
                    showSystemAlert("> SECURITY: PASSWORD UPDATED SUCCESSFULLY.", "success");
                    oldPassInput.value = '';
                    newPassInput.value = '';
                    document.getElementById('togglePassBtn').click();
                } else {
                    showSystemAlert("> ERROR: AUTHENTICATION FAILED. INCORRECT CURRENT PASSWORD.");
                }
            } catch (err) {
                showSystemAlert("> FATAL ERROR: CONNECTION LOST.");
            } finally {
                savePassBtn.innerText = '[ UPDATE PASSWORD ]';
            }
        });
    }

    // logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault(); 
            
            const fade = document.createElement('div');
            fade.className = 'warp-fade';
            document.body.appendChild(fade);
            
            setTimeout(() => fade.classList.add('active'), 50);

            setTimeout(async () => {
                await fetch('/api/logout', { method: 'POST' });
                window.location.href = '/login';
            }, 500);
        });
    }

    if (cancelAddressFormBtn) cancelAddressFormBtn.addEventListener('click', toggleAddressForm);
    setupProfilePasswordToggle('toggleOldPass', 'oldPassInput');
    setupProfilePasswordToggle('toggleNewPass', 'newPassInput');
    
    loadProfileData();
    loadOrderHistory();
});