document.addEventListener('DOMContentLoaded', () => {

    const tabLogistics = document.getElementById('tabLogistics');
    const tabArmory = document.getElementById('tabArmory');
    const logisticsView = document.getElementById('logisticsView');
    const armoryView = document.getElementById('armoryView');
    
    const subTabRequests = document.getElementById('subTabRequests');
    const subTabPrepared = document.getElementById('subTabPrepared');
    const subTabTransit = document.getElementById('subTabTransit');
    const subTabDelivered = document.getElementById('subTabDelivered');
    const subTabCancelled = document.getElementById('subTabCancelled');
    
    const requestsContainer = document.getElementById('requestsContainer');
    const preparedContainer = document.getElementById('preparedContainer');
    const transitContainer = document.getElementById('transitContainer');
    const deliveredContainer = document.getElementById('deliveredContainer');
    const cancelledContainer = document.getElementById('cancelledContainer');
    
    const refreshBtn = document.getElementById('refreshOrdersBtn');
    const modalOverlay = document.getElementById('orderModalOverlay');
    const modalContent = document.getElementById('modalContent');
    const modalContainer = document.querySelector('.tac-modal');

    const armoryContainer = document.getElementById('armoryContainer');
    const refreshArmoryBtn = document.getElementById('refreshArmoryBtn');
    const toggleArchiveModeBtn = document.getElementById('toggleArchiveModeBtn');
    const armorySearch = document.getElementById('armorySearch');
    const armoryCategoryFilter = document.getElementById('armoryCategoryFilter');
    const armorySort = document.getElementById('armorySort');

    const forgeOverlay = document.getElementById('forgeOverlay');
    const forgeDrawer = document.getElementById('forgeDrawer');
    const closeForgeBtn = document.getElementById('closeForgeBtn');
    const submitForgeBtn = document.getElementById('submitForgeBtn');
    const addNewToyBtn = document.getElementById('addNewToyBtn');

    // tab switchers
    const tabAnalytics = document.getElementById('tabAnalytics');
    const analyticsView = document.getElementById('analyticsView');
    const refreshAnalyticsBtn = document.getElementById('refreshAnalyticsBtn');
    
    const mainTabs = [
        { btn: tabLogistics, view: logisticsView },
        { btn: tabArmory, view: armoryView },
        { btn: tabAnalytics, view: analyticsView }
    ];

    let adminOrdersCache = [];
    let armoryCache = [];
    let isArchiveMode = false; 

    mainTabs.forEach(tab => {
        if (tab.btn) {
            tab.btn.addEventListener('click', () => {
                mainTabs.forEach(t => {
                    t.btn?.classList.remove('active');
                    t.view?.classList.add('hidden-content');
                });
                tab.btn.classList.add('active');
                tab.view.classList.remove('hidden-content');
            });
        }
    });

    const subTabs = [
        { btn: subTabRequests, container: requestsContainer },
        { btn: subTabPrepared, container: preparedContainer },
        { btn: subTabTransit, container: transitContainer },
        { btn: subTabDelivered, container: deliveredContainer },
        { btn: subTabCancelled, container: cancelledContainer }
    ];

    subTabs.forEach(tab => {
        tab.btn?.addEventListener('click', () => {
            subTabs.forEach(t => { t.btn.classList.remove('active'); t.container.classList.add('hidden-content'); });
            tab.btn.classList.add('active'); tab.container.classList.remove('hidden-content');
        });
    });

    // orders engine
    async function loadAdminOrders() {
        requestsContainer.innerHTML = '<p class="text-muted text-center mt-30">> SCANNING SECURE CHANNELS...</p>';
        try {
            const response = await fetch('/api/admin/orders');
            if (!response.ok) throw new Error('Unauthorized');
            adminOrdersCache = await response.json();

            const requests = adminOrdersCache.filter(o => o.status === 'PENDING').sort((a, b) => new Date(a.timeline.placedAt) - new Date(b.timeline.placedAt)); 
            const prepared = adminOrdersCache.filter(o => o.status === 'PREPARING').sort((a, b) => new Date(a.timeline.placedAt) - new Date(b.timeline.placedAt)); 
            const inTransit = adminOrdersCache.filter(o => o.status === 'ON DELIVERY').sort((a, b) => new Date(b.timeline.placedAt) - new Date(a.timeline.placedAt));
            const delivered = adminOrdersCache.filter(o => o.status === 'DELIVERED').sort((a, b) => new Date(b.timeline.placedAt) - new Date(a.timeline.placedAt));
            const cancelled = adminOrdersCache.filter(o => o.status === 'CANCELLED').sort((a, b) => new Date(b.timeline.placedAt) - new Date(a.timeline.placedAt));

            requestsContainer.innerHTML = requests.length ? requests.map(buildOrderCard).join('') : '<p class="text-muted text-center mt-30">> NO NEW REQUESTS.</p>';
            preparedContainer.innerHTML = prepared.length ? prepared.map(buildOrderCard).join('') : '<p class="text-muted text-center mt-30">> NO ITEMS AWAITING COURIER.</p>';
            transitContainer.innerHTML = inTransit.length ? inTransit.map(buildOrderCard).join('') : '<p class="text-muted text-center mt-30">> NO ACTIVE DELIVERIES.</p>';
            deliveredContainer.innerHTML = delivered.length ? delivered.map(buildOrderCard).join('') : '<p class="text-muted text-center mt-30">> NO COMPLETED DELIVERIES.</p>';
            cancelledContainer.innerHTML = cancelled.length ? cancelled.map(buildOrderCard).join('') : '<p class="text-muted text-center mt-30">> NO CANCELLED ORDERS.</p>';

            attachOrderEvents();
            updateAnalyticsPanel();
        } catch (err) { requestsContainer.innerHTML = '<p class="text-pink text-center mt-30">> ERROR: ACCESS DENIED OR SYSTEM FAILURE.</p>'; }
    }

    function buildOrderCard(order) {
        const placedDate = new Date(order.timeline.placedAt).toLocaleString('en-GB');
        const t = order.timeline;
        const validDates = [t.placedAt, t.preparingAt, t.shippedAt, t.deliveredAt, t.cancelledAt].filter(d => d).map(d => new Date(d)); 
        const lastEditedDate = new Date(Math.max(...validDates)).toLocaleString('en-GB');

        return `
            <div class="history-card admin-order-card">
                <div class="admin-card-details">
                    <div>
                        <div class="text-cyan font-bold text-lg">${order.orderNumber}</div>
                        <div class="text-muted text-sm mt-5">USER: ${order.user ? order.user.email : 'DELETED ACCOUNT'}</div>
                    </div>
                    <div class="text-right">
                        <span class="status-badge status-${order.status} text-lg">[ ${order.status} ]</span>
                        <div class="text-muted text-sm mt-5">LOGGED: ${placedDate}</div>
                        <div class="text-sm mt-5" style="color: var(--term-lime);">LAST EDITED: ${lastEditedDate}</div>
                    </div>
                </div>
                <div class="admin-card-action">
                    <button class="tac-btn tac-btn--ghost tac-btn--full view-manifest-btn" data-id="${order._id}">
                        [ VIEW ORDER DETAILS ]
                    </button>
                </div>
            </div>
        `;
    }

    function attachOrderEvents() {
        document.querySelectorAll('.view-manifest-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetOrder = adminOrdersCache.find(o => o._id === btn.getAttribute('data-id'));
                if (targetOrder) openManifestModal(targetOrder);
            });
        });
    }

    function openManifestModal(order) {
        modalContainer.classList.add('admin-modal-wide'); 
        document.getElementById('modalOrderTitle').innerText = `// ORDER DETAILS: ${order.orderNumber}`;

        const isCancelled = order.status === 'CANCELLED';
        const isDelivered = order.status === 'DELIVERED';
        const isInTransit = order.status === 'ON DELIVERY'; 
        const disableActions = isCancelled || isDelivered ? 'disabled' : '';
        const showCancel = !isCancelled && !isDelivered && !isInTransit; 

        let itemsHTML = '';
        order.items.forEach(item => {
            const sku = item.product?.sku || 'UNKNOWN-SKU';
            const category = item.product?.category || 'CLASSIFIED';
            itemsHTML += `
                <div class="admin-item-row">
                    <img src="${item.product?.imageString || '/images/default-placeholder.png'}" class="admin-modal-img">
                    <div class="flex-1">
                        <div class="text-cyan text-sm">> ${category} | SKU: ${sku}</div>
                        <div class="text-regular text-lg font-bold">${item.name}</div>
                    </div>
                    <div class="admin-qty-box">
                        <div class="text-muted text-sm">PACK QTY</div>
                        <div class="text-amber text-lg font-bold">x${item.quantity}</div>
                    </div>
                </div>
            `;
        });

        let actionBtnHTML = '';
        if (order.status === 'PENDING') {
            actionBtnHTML = `<button class="tac-btn tac-btn--xl tac-btn--full mt-20 btn-hazard-orange modal-advance-btn" data-id="${order._id}" data-action="PREPARING">[ CONFIRM ITEMS PACKED ]</button>`;
        } else if (order.status === 'PREPARING') {
            actionBtnHTML = `<button class="tac-btn tac-btn--xl tac-btn--full mt-20 btn-hazard-green modal-advance-btn" data-id="${order._id}" data-action="ON DELIVERY">[ DISPATCH TO COURIER ]</button>`;
        } else if (order.status === 'ON DELIVERY') {
            actionBtnHTML = `<button class="tac-btn tac-btn--xl tac-btn--full mt-20 btn-solid-green modal-advance-btn" data-id="${order._id}" data-action="DELIVERED">[ CONFIRM DELIVERY COMPLETE ]</button>`;
        }

        const t = order.timeline;
        const formatTime = (dateObj) => dateObj ? new Date(dateObj).toLocaleString('en-GB') : '---';
        
        let timelineHTML = `<div class="text-muted mt-10 text-sm">> PLACED: <span class="text-regular">${formatTime(t.placedAt)}</span></div>`;
        if (t.preparingAt) timelineHTML += `<div class="text-muted text-sm">> PACKED: <span class="text-amber">${formatTime(t.preparingAt)}</span></div>`;
        if (t.shippedAt) timelineHTML += `<div class="text-muted text-sm">> SHIPPED: <span class="text-cyan">${formatTime(t.shippedAt)}</span></div>`;
        if (t.deliveredAt) timelineHTML += `<div class="text-muted text-sm">> DELIVERED: <span class="text-green">${formatTime(t.deliveredAt)}</span></div>`;
        if (t.cancelledAt) timelineHTML += `<div class="text-muted text-sm">> CANCELLED: <span class="text-red">${formatTime(t.cancelledAt)}</span></div>`;

        // INJECT THE UPDATED HTML (Zero Inline Styles)
        modalContent.innerHTML = `
            <div class="receipt-grid mb-20">
                <div class="receipt-box">
                    <div class="receipt-box-title">> TIMELINE & OVERRIDE</div>
                    
                    <div class="modal-override-grid">
                        <div class="modal-timeline-col">
                            ${timelineHTML}
                        </div>

                        <div class="modal-action-col">
                            <select class="tactical-dropdown w-full input-sm" id="managerStatusOverride" data-id="${order._id}" ${disableActions}>
                                <option value="PENDING" ${order.status === 'PENDING' ? 'selected' : ''}>PENDING</option>
                                <option value="PREPARING" ${order.status === 'PREPARING' ? 'selected' : ''}>PREPARING</option>
                                <option value="ON DELIVERY" ${order.status === 'ON DELIVERY' ? 'selected' : ''}>ON DELIVERY</option>
                                <option value="DELIVERED" ${order.status === 'DELIVERED' ? 'selected' : ''}>DELIVERED</option>
                                ${isCancelled ? `<option value="CANCELLED" selected>CANCELLED</option>` : ''}
                            </select>
                            
                            ${showCancel ? `<button class="tac-btn tac-btn--danger tac-btn--full input-sm" id="managerCancelBtn" data-id="${order._id}">[ CANCEL & REVERT ]</button>` : ''}
                        </div>
                    </div>
                </div>
                
                <div class="receipt-box">
                    <div class="receipt-box-title">> TARGET COORDINATES</div>
                    <div class="text-cyan font-bold text-lg mt-10">${order.shippingAddress.label}</div>
                    <div class="text-regular">${order.shippingAddress.addressLine}, BRGY. ${order.shippingAddress.barangay}</div>
                    <div class="text-regular">${order.shippingAddress.city}, ${order.shippingAddress.province} ${order.shippingAddress.zipCode}</div>
                </div>
            </div>

            <div class="receipt-box">
                <div class="receipt-box-title mb-15">> PACKING SLIP</div>
                <div class="packing-slip-grid">
                    ${itemsHTML}
                </div>
            </div>
            
            ${actionBtnHTML}
        `;

        const advanceBtn = modalContent.querySelector('.modal-advance-btn');
        if (advanceBtn) {
            advanceBtn.addEventListener('click', async () => {
                const newStatus = advanceBtn.getAttribute('data-action');
                advanceBtn.innerText = '[ TRANSMITTING... ]';
                advanceBtn.disabled = true;
                await fetch(`/api/admin/orders/${order._id}/status`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus })
                });
                showSystemAlert("> ORDER STATUS UPDATED.", "success");
                modalOverlay.classList.remove('active'); loadAdminOrders();
            });
        }

        const overrideDropdown = document.getElementById('managerStatusOverride');
        if (overrideDropdown) {
            overrideDropdown.addEventListener('change', async (e) => {
                await fetch(`/api/admin/orders/${order._id}/status`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: e.target.value })
                });
                modalOverlay.classList.remove('active'); loadAdminOrders();
            });
        }

        const cancelBtn = document.getElementById('managerCancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', async () => {
                if(!confirm("WARNING: This will cancel the order and return the items to inventory. Proceed?")) return;
                cancelBtn.innerText = '[ REVERTING... ]';
                await fetch(`/api/admin/orders/${order._id}/cancel`, { method: 'POST' });
                modalOverlay.classList.remove('active'); loadAdminOrders();
            });
        }
        modalOverlay.classList.add('active');
    }

    document.getElementById('closeModalBtn')?.addEventListener('click', () => {
        modalOverlay.classList.remove('active');
        setTimeout(() => modalContainer.classList.remove('admin-modal-wide'), 300);
    });

    if (refreshBtn) {
        refreshBtn.addEventListener('click', async (e) => {
            if (e.shiftKey) { 
                refreshBtn.innerText = '[ SPAWNING DATA... ]';
                await fetch('/api/admin/spawn-test', { method: 'POST' });
            } else {
                refreshBtn.innerText = '[ REFRESHING... ]';
            }
            await loadAdminOrders();
            refreshBtn.innerText = '[ REFRESH DATA ]'; // Resets exactly when done!
        });
    }
    
    async function fetchArmoryData() {
        if (!armoryContainer) return;
        armoryContainer.innerHTML = '<p class="text-muted text-center mt-30">> ACCESSING DATABASE...</p>';
        try {
            const response = await fetch('/api/admin/products');
            if (!response.ok) throw new Error(`Server Error: ${response.status} (Unauthorized)`);
            armoryCache = await response.json();
            
            const categories = [...new Set(armoryCache.map(p => p.category))];
            armoryCategoryFilter.innerHTML = '<option value="ALL">ALL CATEGORIES</option>' + 
                categories.map(c => `<option value="${c}">${c}</option>`).join('');
            
            renderArmory();
            updateAnalyticsPanel();
        } catch (err) {
            console.error("Database Fetch Failed:", err);
            armoryContainer.innerHTML = `<p class="text-pink text-center mt-30">> SYSTEM HALT: ${err.message}</p>`;
        }
    }

    function renderArmory() {
        let filtered = [...armoryCache];

        const query = armorySearch.value.toLowerCase();
        if (query) filtered = filtered.filter(p => p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query));

        const cat = armoryCategoryFilter.value;
        if (cat !== 'ALL') filtered = filtered.filter(p => p.category === cat);

        const sortVal = armorySort.value;
        if (sortVal === 'newest') filtered.sort((a, b) => new Date(b.date_published) - new Date(a.date_published));
        if (sortVal === 'name_asc') filtered.sort((a, b) => a.name.localeCompare(b.name));
        if (sortVal === 'name_desc') filtered.sort((a, b) => b.name.localeCompare(a.name));
        if (sortVal === 'stock_asc') filtered.sort((a, b) => a.avail_inventory - b.avail_inventory);
        if (sortVal === 'stock_desc') filtered.sort((a, b) => b.avail_inventory - a.avail_inventory);
        if (sortVal === 'mod_desc') {
            filtered.sort((a, b) => {
                const dateA = a.last_modified ? new Date(a.last_modified) : new Date(a.date_published);
                const dateB = b.last_modified ? new Date(b.last_modified) : new Date(b.date_published);
                return dateB - dateA;
            });
        }
        if (sortVal === 'mod_asc') {
            filtered.sort((a, b) => {
                const dateA = a.last_modified ? new Date(a.last_modified) : new Date(a.date_published);
                const dateB = b.last_modified ? new Date(b.last_modified) : new Date(b.date_published);
                return dateA - dateB;
            });
        }

        if (filtered.length === 0) {
            armoryContainer.innerHTML = '<p class="text-muted text-center mt-30">> NO MANIFESTS MATCH QUERY.</p>';
            return;
        }

        armoryContainer.innerHTML = filtered.map(product => {
            const isArchived = product.isArchived;
            let stockLevelClass = 'safe';
            if (product.avail_inventory <= 0) stockLevelClass = 'empty';
            else if (product.avail_inventory <= 5) stockLevelClass = 'warn';

            const stockText = product.avail_inventory <= 0 ? 'SOLD OUT' : product.avail_inventory;
            const pubDate = new Date(product.date_published).toLocaleString('en-GB');
            const rawModDate = product.last_modified ? new Date(product.last_modified) : new Date(product.date_published);
            const modDate = rawModDate.toLocaleString('en-GB');

            return `
                <div class="history-card admin-order-card ${isArchived ? 'archived-card' : ''}">
                    <div class="armory-img-box">
                        <img src="${product.imageString || '/images/default-placeholder.png'}" class="armory-main-img">
                    </div>
                    <div class="armory-data-grid">
                        <div class="armory-info-col">
                            <div class="text-cyan text-sm">> ${product.category} | SKU: ${product.sku || 'N/A'}</div>
                            <div class="text-regular text-lg font-bold ${isArchived ? 'text-muted' : ''}">${product.name}</div>
                            <div class="text-muted text-sm mt-5">PUBLISHED: ${pubDate}</div>
                            <div class="text-sm mt-5 text-lime">LAST MODIFIED: ${modDate}</div>
                            <div class="price-row">
                                <div class="text-amber text-lg">₱${product.price.toLocaleString()}</div>
                                ${product.old_price > product.price ? `<div class="old-price-strike text-muted">₱${product.old_price.toLocaleString()}</div>` : ''}
                            </div>
                        </div>
                        <div class="armory-action-col stock-controls-col">
                            <div class="armory-stock-wrapper" id="stock-wrapper-${product._id}">
                                <div class="stock-controls-normal" id="stock-normal-${product._id}">
                                    <button class="stock-adjust-btn btn-stock-sub init-sub-btn" data-id="${product._id}">-</button>
                                    <div class="admin-qty-box stock-box-${stockLevelClass}">
                                        <div class="text-muted text-sm mb-2">STOCK</div>
                                        <div class="text-lg font-bold stock-val line-height-1">${stockText}</div>
                                    </div>
                                    <button class="stock-adjust-btn btn-stock-add init-add-btn" data-id="${product._id}">+</button>
                                </div>
                                <div class="inline-stock-form" id="stock-form-${product._id}">
                                    <input type="number" min="1" class="inline-stock-input" id="stock-input-${product._id}" placeholder="QTY">
                                    <button class="tac-btn text-sm submit-stock-btn" id="stock-submit-${product._id}" data-id="${product._id}" data-mode="">[ CONFIRM ]</button>
                                    <button class="tac-btn tac-btn--ghost text-sm btn-orange-invert cancel-stock-btn" data-id="${product._id}">[ X ]</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="admin-card-action armory-action-box">
                        <button class="tac-btn tac-btn--full text-sm btn-cyan-invert edit-toy-btn" data-id="${product._id}">
                            [ EDIT PRODUCT ]
                        </button>
                        <div class="archive-toggle-wrapper">
                            <button class="tac-btn tac-btn--ghost tac-btn--full text-sm btn-pink-invert toggle-archive-btn" data-id="${product._id}">
                                ${isArchived ? '[ RESTORE PRODUCT ]' : '[ ARCHIVE PRODUCT ]'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        attachArmoryEvents();
    }

    function attachArmoryEvents() {
        // soft delte toggle
        document.querySelectorAll('.toggle-archive-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const productId = btn.getAttribute('data-id');
                btn.innerText = '[ ... ]';
                try {
                    await fetch(`/api/admin/products/${productId}/archive`, { method: 'POST' });
                    fetchArmoryData(); 
                } catch (err) { showSystemAlert("> ERROR MODIFYING ARCHIVE STATE"); }
            });
        });

        document.querySelectorAll('.init-add-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                document.getElementById(`stock-normal-${id}`).classList.add('hidden');
                document.getElementById(`stock-form-${id}`).classList.add('active');
                
                const submitBtn = document.getElementById(`stock-submit-${id}`);
                submitBtn.innerText = '[ ADD ]';
                submitBtn.className = 'tac-btn text-sm submit-stock-btn btn-stock-add';
                submitBtn.setAttribute('data-mode', 'add');
            });
        });

        document.querySelectorAll('.init-sub-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                document.getElementById(`stock-normal-${id}`).classList.add('hidden');
                document.getElementById(`stock-form-${id}`).classList.add('active');
                
                const submitBtn = document.getElementById(`stock-submit-${id}`);
                submitBtn.innerText = '[ REMOVE ]';
                submitBtn.className = 'tac-btn text-sm submit-stock-btn btn-stock-sub'; 
                submitBtn.setAttribute('data-mode', 'sub');
            });
        });

        document.querySelectorAll('.cancel-stock-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.getAttribute('data-id');
                document.getElementById(`stock-form-${id}`).classList.remove('active');
                document.getElementById(`stock-normal-${id}`).classList.remove('hidden');
                document.getElementById(`stock-input-${id}`).value = ''; 
            });
        });

        document.querySelectorAll('.submit-stock-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                const mode = btn.getAttribute('data-mode'); 
                const inputVal = document.getElementById(`stock-input-${id}`).value;
                const qty = parseInt(inputVal);
                
                if (isNaN(qty) || qty <= 0) return showSystemAlert("> INVALID QUANTITY.");
                
                const adjustment = mode === 'add' ? qty : -Math.abs(qty); 
                btn.innerText = '[ ... ]';
                
                await fetch(`/api/admin/products/${id}/stock`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adjustment })
                });
                fetchArmoryData(); 
            });
        });

        // editing existing product
        document.querySelectorAll('.edit-toy-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                try {
                    const id = btn.getAttribute('data-id');
                    const product = armoryCache.find(p => p._id === id);
                    if (!product) return showSystemAlert("> ERROR: PRODUCT NOT FOUND IN CACHE");

                    document.getElementById('forgeTitle').innerText = '// EDIT PRODUCT';
                    document.getElementById('forgeId').value = product._id;
                    document.getElementById('forgeName').value = product.name;
                    document.getElementById('forgeSku').value = product.sku;
                    document.getElementById('forgeCategory').value = product.category;
                    document.getElementById('forgePrice').value = product.price;
                    document.getElementById('forgeOldPrice').value = product.old_price || 0;
                    
                    document.getElementById('forgeExistingImage').value = product.imageString;
                    document.getElementById('currentImageDisplay').innerText = `CURRENT DATA: ${product.imageString}`;
                    document.getElementById('forgeImageFile').value = ''; // Clears out any old file selection
                    
                    document.getElementById('forgeTags').value = product.tags ? product.tags.join(', ') : '';
                    document.getElementById('forgeDesc').value = product.description;
                    
                    document.getElementById('forgeStockGroup').classList.add('hidden-content');
                    
                    submitForgeBtn.innerText = '[ SAVE CHANGES ]';
                    submitForgeBtn.className = 'tac-btn tac-btn--full tac-btn--xl btn-cyan-invert'; 

                    forgeOverlay.classList.add('active');
                    forgeDrawer.classList.add('active');
                } catch(err) {
                    showSystemAlert("> UI ERROR: " + err.message);
                }
            });
        });
    }

    if (armorySearch) {
        let searchTimeout;
        armorySearch.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            
            searchTimeout = setTimeout(() => {
                renderArmory();
            }, 300); 
        });
    }
    if (armoryCategoryFilter) armoryCategoryFilter.addEventListener('change', renderArmory);
    if (armorySort) armorySort.addEventListener('change', renderArmory);
    if (refreshArmoryBtn) {
        refreshArmoryBtn.addEventListener('click', async () => {
            refreshArmoryBtn.innerText = '[ REFRESHING... ]';
            await fetchArmoryData();
            refreshArmoryBtn.innerText = '[ REFRESH DATA ]';
        });
    }
    
    if (toggleArchiveModeBtn) {
        toggleArchiveModeBtn.addEventListener('click', () => {
            armoryContainer.classList.toggle('show-archive-mode');
            toggleArchiveModeBtn.classList.toggle('active');
        });
    }

    if (addNewToyBtn) {
        addNewToyBtn.addEventListener('click', () => {
            try {
                document.getElementById('forgeTitle').innerText = '// NEW PRODUCT';
                document.getElementById('forgeId').value = '';
                document.getElementById('forgeName').value = '';
                document.getElementById('forgeSku').value = '';
                document.getElementById('forgeCategory').value = '';
                document.getElementById('forgePrice').value = '';
                document.getElementById('forgeOldPrice').value = '';
                
                document.getElementById('forgeExistingImage').value = '';
                document.getElementById('currentImageDisplay').innerText = '> AWAITING FILE UPLOAD...';
                document.getElementById('forgeImageFile').value = ''; 
                
                document.getElementById('forgeTags').value = '';
                document.getElementById('forgeDesc').value = '';
                
                document.getElementById('forgeStockGroup').classList.remove('hidden-content');
                document.getElementById('forgeStock').value = 0;

                submitForgeBtn.innerText = '[ CREATE PRODUCT ]';
                submitForgeBtn.className = 'tac-btn tac-btn--full tac-btn--xl btn-hazard-orange'; 

                forgeOverlay.classList.add('active');
                forgeDrawer.classList.add('active');
            } catch(err) {
                showSystemAlert("> UI ERROR: " + err.message);
            }
        });
    }

    const closeForge = () => {
        forgeOverlay.classList.remove('active');
        forgeDrawer.classList.remove('active');
    };
    closeForgeBtn?.addEventListener('click', closeForge);
    forgeOverlay?.addEventListener('click', closeForge);

    if (submitForgeBtn) {
        submitForgeBtn.addEventListener('click', async () => {
            const id = document.getElementById('forgeId').value;
            const isEditing = id !== '';
            
            // Basic Validation
            const name = document.getElementById('forgeName').value;
            const sku = document.getElementById('forgeSku').value;
            const category = document.getElementById('forgeCategory').value;
            const price = Number(document.getElementById('forgePrice').value);
            const oldPrice = Number(document.getElementById('forgeOldPrice').value);

            if (!name || !sku || !category || !price) {
                return showSystemAlert("> ERROR: MISSING CRITICAL DATA FIELDS.");
            }
            if (oldPrice > 0 && oldPrice <= price) {
                return showSystemAlert("> ERROR: OLD PRICE MUST BE GREATER THAN CURRENT PRICE.");
            }

            submitForgeBtn.innerText = '[ TRANSMITTING... ]';
            submitForgeBtn.disabled = true;

            try {
                const formData = new FormData();
                formData.append('name', name);
                formData.append('sku', sku);
                formData.append('category', category);
                formData.append('price', price);
                formData.append('old_price', oldPrice);
                formData.append('tags', document.getElementById('forgeTags').value);
                formData.append('description', document.getElementById('forgeDesc').value);

                const fileInput = document.getElementById('forgeImageFile');
                if (fileInput.files.length > 0) {
                    formData.append('imageFile', fileInput.files[0]); // Attach the physical image!
                }

                const existingImage = document.getElementById('forgeExistingImage').value;
                if (existingImage) {
                    formData.append('existingImage', existingImage);
                }

                if (!isEditing) {
                    formData.append('avail_inventory', Number(document.getElementById('forgeStock').value) || 0);
                }

                const url = isEditing ? `/api/admin/products/${id}/edit` : '/api/admin/products';
                
                const res = await fetch(url, {
                    method: 'POST', 
                    body: formData
                });
    
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'System Error');

                showSystemAlert(isEditing ? "> PRODUCT UPDATED." : "> NEW PRODUCT FORGED.", "success");
    
                closeForge();
                fetchArmoryData();
            } catch (err) {
                showSystemAlert("> " + err.message.toUpperCase());
            } finally {
                submitForgeBtn.innerText = isEditing ? '[ SAVE CHANGES ]' : '[ CREATE PRODUCT ]';
                submitForgeBtn.disabled = false;
            }
        });
    }

    // analytics
    function updateAnalyticsPanel() {
        if (!document.getElementById('analyticsView')) return;

        const timeFilter = document.getElementById('revenueTimeFilter')?.value || 'LIFETIME';
        const now = new Date();
        let cutoffDate = new Date(0);

        if (timeFilter === 'YEARLY') {
            cutoffDate = new Date(now.getFullYear(), 0, 1);
        } else if (timeFilter === 'QUARTERLY') {
            const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
            cutoffDate = new Date(now.getFullYear(), quarterMonth, 1);
        } else if (timeFilter === 'MONTHLY') {
            cutoffDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        const timeFilteredOrders = adminOrdersCache.filter(o => {
            const placedAt = new Date(o.timeline.placedAt);
            return placedAt >= cutoffDate;
        });

        const delivered = timeFilteredOrders.filter(o => o.status === 'DELIVERED');
        const active = timeFilteredOrders.filter(o => ['PENDING', 'PREPARING', 'ON DELIVERY'].includes(o.status));
        
        const totalRev = delivered.reduce((sum, o) => sum + o.totalAmount, 0);
        const projectedRev = active.reduce((sum, o) => sum + o.totalAmount, 0);
        
        document.getElementById('statRevenue').innerText = `₱${totalRev.toLocaleString()}`;
        document.getElementById('statProjected').innerText = `₱${projectedRev.toLocaleString()}`;

        const allDelivered = adminOrdersCache.filter(o => o.status === 'DELIVERED');
        document.getElementById('statPending').innerText = adminOrdersCache.filter(o => o.status === 'PENDING').length;
        document.getElementById('statPrepared').innerText = adminOrdersCache.filter(o => o.status === 'PREPARING').length;
        document.getElementById('statTransit').innerText = adminOrdersCache.filter(o => o.status === 'ON DELIVERY').length;
        document.getElementById('statDelivered').innerText = allDelivered.length;
        document.getElementById('statCancelled').innerText = adminOrdersCache.filter(o => o.status === 'CANCELLED').length;

        const activeProducts = armoryCache.filter(p => !p.isArchived);
        document.getElementById('statTotalProducts').innerText = activeProducts.length;
        document.getElementById('statHealthy').innerText = activeProducts.filter(p => p.avail_inventory > 5).length;
        document.getElementById('statLow').innerText = activeProducts.filter(p => p.avail_inventory > 0 && p.avail_inventory <= 5).length;
        document.getElementById('statOut').innerText = activeProducts.filter(p => p.avail_inventory === 0).length;
    }

    const revenueTimeFilter = document.getElementById('revenueTimeFilter');
    if (revenueTimeFilter) {
        revenueTimeFilter.addEventListener('change', updateAnalyticsPanel);
    }

    if (refreshAnalyticsBtn) {
        refreshAnalyticsBtn.addEventListener('click', async () => {
            refreshAnalyticsBtn.innerText = '[ REFRESHING... ]';
            await loadAdminOrders();
            await fetchArmoryData();
            refreshAnalyticsBtn.innerText = '[ REFRESH DATA ]';
        });
    }

    async function secureAdminBoot() {
        try {
            const res = await fetch('/api/profile'); 
            const user = await res.json();
            
            if (user.role !== 'admin') {
                window.location.href = '/catalog';
                return;
            }
            
            await loadAdminOrders();
            await fetchArmoryData();
            
            const bootScreen = document.getElementById('bootOverlay');
            bootScreen.classList.add('fade-out'); 
            
            setTimeout(() => bootScreen.classList.add('hidden'), 1200);
        } catch (err) {
            window.location.href = '/login';
        }
    }

    secureAdminBoot();
});