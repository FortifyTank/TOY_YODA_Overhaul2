// public/js/profile.js

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Fetch user data to populate the page
    try {
        const response = await fetch('/api/auth/status');
        const data = await response.json();

        if (data.loggedIn) {
            document.getElementById('profileUsername').innerText = `[ CITIZEN: ${data.username} ]`;
            document.getElementById('profileRole').innerText = data.role.toUpperCase();
        } else {
            // Kick them out if they aren't logged in!
            window.location.href = '/login';
        }
    } catch (err) {
        console.error("Profile load error:", err);
    }

    // 2. The Logout Button Logic
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await fetch('/api/logout', { method: 'POST' });
                window.location.href = '/login'; // Send them back to the checkpoint
            } catch (err) {
                console.error("Logout failed:", err);
            }
        });
    }

    // --- SLIDING HUD LOGIC ---
    const stage = document.querySelector('.profile-stage');
    const openLogisticsBtn = document.getElementById('openLogisticsBtn');
    const openHistoryBtn = document.getElementById('openHistoryBtn');
    const closeBtns = document.querySelectorAll('.close-panel-btn');

    // Slide Card Right, Open Logistics
    if (openLogisticsBtn) {
        openLogisticsBtn.addEventListener('click', () => {
            stage.classList.remove('stage-shift-left'); // Close history if open
            stage.classList.add('stage-shift-right');
        });
    }

    // Slide Card Left, Open History
    if (openHistoryBtn) {
        openHistoryBtn.addEventListener('click', () => {
            stage.classList.remove('stage-shift-right'); // Close logistics if open
            stage.classList.add('stage-shift-left');
        });
    }

    // Close any open panels and center the card
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            stage.classList.remove('stage-shift-right');
            stage.classList.remove('stage-shift-left');
        });
    });

    
    // --- INLINE FORM TOGGLES ---
    const togglePhoneBtn = document.getElementById('togglePhoneBtn');
    const phoneForm = document.getElementById('phoneForm');
    
    if (togglePhoneBtn && phoneForm) {
        togglePhoneBtn.addEventListener('click', () => {
            phoneForm.classList.toggle('active');
            // Change button text based on state
            togglePhoneBtn.innerText = phoneForm.classList.contains('active') ? '[ CANCEL ]' : '[ CHANGE ]';
            
            // Auto-close the other form to keep things clean
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
            
            // Auto-close the phone form
            document.getElementById('phoneForm').classList.remove('active');
            document.getElementById('togglePhoneBtn').innerText = '[ CHANGE ]';
        });
    }

    // --- PASSWORD REVEAL LOGIC FOR PROFILE ---
    const iconHidden = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
    const iconVisible = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;

    function setupProfilePasswordToggle(btnId, inputId) {
        const btn = document.getElementById(btnId);
        const input = document.getElementById(inputId);
        
        if (btn && input) {
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