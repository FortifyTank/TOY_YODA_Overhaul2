// public/js/profile.js

document.addEventListener('DOMContentLoaded', async () => {
    
    // --- 1. INITIALIZE DOSSIER (Crash-Protected) ---
    async function loadProfileData() {
        try {
            const response = await fetch('/api/profile');
            
            if (response.ok) {
                const data = await response.json();
                
                // Populate Basic Info
                document.getElementById('profileUsername').innerText = `[ CITIZEN: ${data.username} ]`;
                document.getElementById('profileRole').innerText = data.role.toUpperCase();
                document.getElementById('profileEmail').innerText = data.email.toUpperCase();
                
                // CRASH PROTECTION: Fallback to 'UNREGISTERED' if phone doesn't exist on old accounts
                const safePhone = data.phone || 'UNREGISTERED';
                document.getElementById('profilePhone').innerText = safePhone.toUpperCase();

                // CRASH PROTECTION: Ensure addresses is always an array
                const addresses = data.addresses || [];
                renderAddressCards(addresses);

            } else {
                window.location.href = '/login';
            }
        } catch (err) {
            console.error("Profile load error:", err);
        }
    }

    // Run immediately on load
    loadProfileData();

    // --- 2. DYNAMIC ADDRESS RENDERING & INTERACTION ---
    let editingAddressId = null; // Keeps track of which address we are editing

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
            
            // Notice the data-id added to the buttons and card!
            const cardHTML = `
                <div class="address-card ${isEquipped}" data-id="${addr._id}">
                    <div class="address-info">
                        <span class="address-title">${statusTag}${addr.label.toUpperCase()}</span>
                        <span class="address-detail">${addr.addressLine}, BRGY. ${addr.barangay}, ${addr.city}, ${addr.province}</span>
                    </div>
                    <div class="card-actions">
                        <button class="icon-btn edit-btn" data-id="${addr._id}" title="Edit Address">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                        </button>
                        <button class="icon-btn delete-btn" data-id="${addr._id}" title="Delete Address">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                    </div>
                </div>
            `;
            listContainer.innerHTML += cardHTML;
        });

        // Add New Button
        listContainer.innerHTML += `
            <div class="add-address-box" id="openAddressFormBtn">
                <div class="add-icon-circle">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </div>
            </div>
        `;

        attachAddressEventListeners(addresses);
    }

    // --- INTERACTIVE EVENT LISTENERS FOR ADDRESSES ---
    function attachAddressEventListeners(addresses) {
        // 1. Equip Address (Clicking the card)
        document.querySelectorAll('.address-card').forEach(card => {
            card.addEventListener('click', async (e) => {
                if (e.target.closest('.icon-btn')) return; // Ignore if they clicked gear/trash
                
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

        // 2. Delete Address
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const addrId = btn.getAttribute('data-id');
                btn.innerHTML = '[...]'; // Show loading
                const response = await fetch('/api/profile/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ deleteAddressId: addrId })
                });
                const data = await response.json();
                if (response.ok) renderAddressCards(data.user.addresses);
            });
        });

        // 3. Edit Address (Gear Icon)
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const addrId = btn.getAttribute('data-id');
                const targetAddr = addresses.find(a => a._id === addrId);
                
                if (targetAddr) {
                    editingAddressId = addrId; // Set the global tracker
                    
                    // Fill the form with existing data
                    document.getElementById('shipLabel').value = targetAddr.label;
                    document.getElementById('shipAddressLine').value = targetAddr.addressLine;
                    document.getElementById('shipBarangay').value = targetAddr.barangay;
                    document.getElementById('shipCity').value = targetAddr.city;
                    document.getElementById('shipProvince').value = targetAddr.province;
                    document.getElementById('shipZip').value = targetAddr.zipCode;
                    
                    document.getElementById('saveLogisticsBtn').innerText = '[ UPDATE LOGISTICS ]';
                    toggleAddressForm(); // Open the form
                }
            });
        });

        // 4. Open "Add New" Form
        document.getElementById('openAddressFormBtn').addEventListener('click', () => {
            editingAddressId = null; // Clear the tracker
            document.getElementById('logisticsForm').reset();
            document.getElementById('saveLogisticsBtn').innerText = '[ SAVE LOGISTICS ]';
            toggleAddressForm();
        });
    }

    // --- FORM SUBMIT LOGIC (Handles BOTH Add and Edit) ---
    const logisticsForm = document.getElementById('logisticsForm');
    const addressListView = document.getElementById('addressListView');
    const cancelAddressFormBtn = document.getElementById('cancelAddressFormBtn');

    function toggleAddressForm() {
        const isListHidden = addressListView.style.display === 'none';
        addressListView.style.display = isListHidden ? 'block' : 'none';
        isListHidden ? logisticsForm.classList.remove('active') : logisticsForm.classList.add('active');
    }

    if (cancelAddressFormBtn) cancelAddressFormBtn.addEventListener('click', toggleAddressForm);

    if (logisticsForm) {
        logisticsForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const addressData = {
                label: document.getElementById('shipLabel').value || 'HOME',
                addressLine: document.getElementById('shipAddressLine').value,
                barangay: document.getElementById('shipBarangay').value,
                city: document.getElementById('shipCity').value,
                province: document.getElementById('shipProvince').value,
                zipCode: document.getElementById('shipZip').value
            };

            // Decide if we are adding a NEW address or EDITING an old one based on the tracker
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
                    saveBtn.innerText = '[ SAVED SECURELY ]';
                    saveBtn.style.color = 'var(--term-green)';
                    renderAddressCards(data.user.addresses);

                    setTimeout(() => {
                        saveBtn.innerText = '[ SAVE LOGISTICS ]';
                        saveBtn.style.color = '';
                        logisticsForm.reset(); 
                        toggleAddressForm(); 
                    }, 1000);
                }
            } catch (err) {
                saveBtn.innerText = '[ COMM FAILURE ]';
            }
        });
    }

    // --- SAVE COMM NUMBER (PHONE) LOGIC ---
    const phoneFormSubmit = document.getElementById('phoneForm');
    const savePhoneBtn = document.getElementById('savePhoneBtn');
    
    if (phoneFormSubmit && savePhoneBtn) {
        // Listens for 'submit' so the Enter key works perfectly
        phoneFormSubmit.addEventListener('submit', async (e) => {
            e.preventDefault(); // Stops the page from refreshing

            const newPhoneInput = document.getElementById('newPhoneInput');
            const newPhone = newPhoneInput.value.trim(); // .trim() removes accidental spaces
            
            if (!newPhone) return;

            savePhoneBtn.innerText = '[ SAVING... ]';
            
            try {
                const response = await fetch('/api/profile/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone: newPhone })
                });

                if (response.ok) {
                    savePhoneBtn.innerText = '[ SECURED ]';
                    savePhoneBtn.style.color = 'var(--term-green)';
                    document.getElementById('profilePhone').innerText = newPhone.toUpperCase();
                    
                    setTimeout(() => {
                        savePhoneBtn.innerText = '[ SAVE NUMBER ]';
                        savePhoneBtn.style.color = '';
                        newPhoneInput.value = ''; // Clears the box for next time
                        document.getElementById('togglePhoneBtn').click(); // Auto-close form
                    }, 1500);
                }
            } catch (err) {
                savePhoneBtn.innerText = '[ ERROR ]';
                console.error(err);
            }
        });
    }

    // --- 3. SAVE PASSWORD LOGIC ---
    const savePassBtn = document.getElementById('savePassBtn');
    if (savePassBtn) {
        savePassBtn.addEventListener('click', async () => {
            const oldPassword = document.getElementById('oldPassInput').value;
            const newPassword = document.getElementById('newPassInput').value;
            
            if (!oldPassword || !newPassword) return;

            savePassBtn.innerText = '[ ENCRYPTING... ]';

            try {
                const response = await fetch('/api/profile/password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ oldPassword, newPassword })
                });

                const data = await response.json();

                if (response.ok) {
                    savePassBtn.innerText = '[ SECURED ]';
                    savePassBtn.style.color = 'var(--term-green)';
                    setTimeout(() => {
                        savePassBtn.innerText = '[ UPDATE PASSWORD ]';
                        savePassBtn.style.color = '';
                        document.getElementById('oldPassInput').value = '';
                        document.getElementById('newPassInput').value = '';
                        document.getElementById('togglePassBtn').click(); // Close form
                    }, 1500);
                } else {
                    savePassBtn.innerText = '[ ERROR: INVALID ]';
                    savePassBtn.style.color = 'var(--term-red)';
                    setTimeout(() => { savePassBtn.innerText = '[ UPDATE PASSWORD ]'; savePassBtn.style.color = ''; }, 2000);
                }
            } catch (err) {
                savePassBtn.innerText = '[ FAILURE ]';
            }
        });
    }

    // --- 5. SLIDING HUD & LOGOUT LOGIC (Unchanged) ---
    // (Included for completeness)
    const stage = document.querySelector('.profile-stage');
    document.getElementById('openLogisticsBtn')?.addEventListener('click', () => {
        stage.classList.remove('stage-shift-left'); stage.classList.add('stage-shift-right');
    });
    document.getElementById('openHistoryBtn')?.addEventListener('click', () => {
        stage.classList.remove('stage-shift-right'); stage.classList.add('stage-shift-left');
    });
    document.querySelectorAll('.close-panel-btn').forEach(btn => {
        btn.addEventListener('click', () => { stage.classList.remove('stage-shift-right', 'stage-shift-left'); });
    });

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await fetch('/api/logout', { method: 'POST' });
            window.location.href = '/login';
        });
    }

    const togglePhoneBtn = document.getElementById('togglePhoneBtn');
    const phoneForm = document.getElementById('phoneForm');
    if (togglePhoneBtn && phoneForm) {
        togglePhoneBtn.addEventListener('click', () => {
            phoneForm.classList.toggle('active');
            togglePhoneBtn.innerText = phoneForm.classList.contains('active') ? '[ CANCEL ]' : '[ CHANGE ]';
            document.getElementById('passwordForm').classList.remove('active');
            document.getElementById('togglePassBtn').innerText = '[ CHANGE ]';
        });
    }

    const togglePassBtn = document.getElementById('togglePassBtn');
    const passwordForm = document.getElementById('passwordForm');
    if (togglePassBtn && passwordForm) {
        togglePassBtn.addEventListener('click', () => {
            passwordForm.classList.toggle('active');
            togglePassBtn.innerText = passwordForm.classList.contains('active') ? '[ CANCEL ]' : '[ CHANGE ]';
            document.getElementById('phoneForm').classList.remove('active');
            document.getElementById('togglePhoneBtn').innerText = '[ CHANGE ]';
        });
    }

    function setupProfilePasswordToggle(btnId, inputId) {
        const btn = document.getElementById(btnId);
        const input = document.getElementById(inputId);
        const iconHidden = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
        const iconVisible = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
        
        if (btn && input) {
            // ADD THIS ONE LINE: Auto-injects the SVG on page load!
            btn.innerHTML = iconHidden; 
            
            btn.addEventListener("click", () => {
                const isPassword = input.getAttribute("type") === "password";
                input.setAttribute("type", isPassword ? "text" : "password");
                btn.innerHTML = isPassword ? iconVisible : iconHidden;
                btn.classList.toggle("active"); 
            });
        }
    }

    setupProfilePasswordToggle('toggleOldPass', 'oldPassInput');
    setupProfilePasswordToggle('toggleNewPass', 'newPassInput');
});