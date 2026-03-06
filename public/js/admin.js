document.addEventListener('DOMContentLoaded', () => {

    // 1. DOM Elements
    const tabLogistics = document.getElementById('tabLogistics');
    const tabArmory = document.getElementById('tabArmory');
    const logisticsView = document.getElementById('logisticsView');
    const armoryView = document.getElementById('armoryView');
    const ordersContainer = document.getElementById('adminOrdersContainer');
    const refreshBtn = document.getElementById('refreshOrdersBtn');

    // 2. Tab Switcher
    if (tabLogistics && tabArmory) {
        tabLogistics.addEventListener('click', () => {
            tabLogistics.classList.add('active'); tabArmory.classList.remove('active');
            logisticsView.classList.remove('hidden-content'); armoryView.classList.add('hidden-content');
        });
        tabArmory.addEventListener('click', () => {
            tabArmory.classList.add('active'); tabLogistics.classList.remove('active');
            armoryView.classList.remove('hidden-content'); logisticsView.classList.add('hidden-content');
        });
    }

    // 3. Fetch & Render Orders
    async function loadAdminOrders() {
        ordersContainer.innerHTML = '<p class="text-muted text-center mt-30">> DOWNLOADING SECURE MANIFESTS...</p>';
        
        try {
            const response = await fetch('/api/admin/orders');
            if (!response.ok) throw new Error('Unauthorized');
            const orders = await response.json();

            if (orders.length === 0) {
                ordersContainer.innerHTML = '<p class="text-muted text-center mt-30">> NO ACTIVE DEPLOYMENTS FOUND.</p>';
                return;
            }

            ordersContainer.innerHTML = orders.map(order => {
                const date = new Date(order.timeline.placedAt).toLocaleString('en-GB');
                const isCancelled = order.status === 'CANCELLED';
                const isDelivered = order.status === 'DELIVERED';
                const disableActions = isCancelled || isDelivered ? 'disabled' : '';

                return `
                    <div class="history-card" style="border-color: ${isCancelled ? 'var(--term-red)' : 'var(--border-dim)'}">
                        <div class="history-header">
                            <div>
                                <div class="text-cyan font-bold">${order.orderNumber}</div>
                                <div class="text-muted text-sm mt-5">USER: ${order.user ? order.user.email : 'DELETED ACCOUNT'}</div>
                                <div class="text-muted text-sm">DATE: ${date}</div>
                            </div>
                            
                            <div class="flex-wrap" style="gap: 10px; display: flex; align-items: flex-start;">
                                <select class="tactical-dropdown status-dropdown" data-id="${order._id}" ${disableActions}>
                                    <option value="PENDING" ${order.status === 'PENDING' ? 'selected' : ''}>PENDING</option>
                                    <option value="PREPARING" ${order.status === 'PREPARING' ? 'selected' : ''}>PREPARING</option>
                                    <option value="ON DELIVERY" ${order.status === 'ON DELIVERY' ? 'selected' : ''}>ON DELIVERY</option>
                                    <option value="DELIVERED" ${order.status === 'DELIVERED' ? 'selected' : ''}>DELIVERED</option>
                                    ${isCancelled ? `<option value="CANCELLED" selected>CANCELLED</option>` : ''}
                                </select>
                                
                                ${!isCancelled && !isDelivered ? `
                                    <button class="tac-btn tac-btn--danger text-sm cancel-order-btn" data-id="${order._id}" style="padding: 6px 12px; margin: 0;">
                                        [ CANCEL & REVERT ]
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                        
                        <div class="history-footer border-dashed-dim pb-10 mt-10">
                            <span class="text-regular">${order.items.length} ITEM(S) | ₱${order.totalAmount.toLocaleString()}</span>
                            <span class="status-badge status-${order.status}">[ ${order.status} ]</span>
                        </div>
                    </div>
                `;
            }).join('');

            attachOrderEvents();

        } catch (err) {
            ordersContainer.innerHTML = '<p class="text-red text-center mt-30">> ERROR: ACCESS DENIED OR SYSTEM FAILURE.</p>';
        }
    }

    // 4. Attach Action Events (Status Change & Cancel)
    function attachOrderEvents() {
        // Change Status
        document.querySelectorAll('.status-dropdown').forEach(select => {
            select.addEventListener('change', async (e) => {
                const orderId = e.target.getAttribute('data-id');
                const newStatus = e.target.value;
                
                try {
                    await fetch(`/api/admin/orders/${orderId}/status`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: newStatus })
                    });
                    loadAdminOrders(); // Reload to refresh badges
                } catch (err) { alert("> ERROR UPDATING STATUS"); }
            });
        });

        // Cancel Order
        document.querySelectorAll('.cancel-order-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if(!confirm("WARNING: This will cancel the order and return the items to inventory. Proceed?")) return;
                
                const orderId = e.target.getAttribute('data-id');
                e.target.innerText = '[ REVERTING... ]';
                
                try {
                    await fetch(`/api/admin/orders/${orderId}/cancel`, { method: 'POST' });
                    loadAdminOrders(); // Reload to see the red cancelled state
                } catch (err) { alert("> ERROR CANCELLING ORDER"); }
            });
        });
    }

    // 5. Init
    if (refreshBtn) refreshBtn.addEventListener('click', loadAdminOrders);
    loadAdminOrders();
});