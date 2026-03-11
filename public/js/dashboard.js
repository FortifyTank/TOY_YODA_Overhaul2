document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================
    // 1. STATE & DOM ELEMENTS
    // ==========================================
    const urlParams = new URLSearchParams(window.location.search);
    const bootOverlay = document.getElementById("bootOverlay");
    
    // Grabs all login buttons across the entire site instantly
    const accountButtons = document.querySelectorAll('.clearance');

    // ==========================================
    // 2. CORE LOGIC
    // ==========================================
    
    // --- Global System Boot Fade-In ---
    function handleBootAnimation() {
        if (!bootOverlay) return;
        
        if (urlParams.get("warp") === "true") {
            // Trigger cinematic fade
            bootOverlay.classList.add("fade-out");
            
            // Instantly clean the URL so refreshing the page doesn't replay the fade
            window.history.replaceState({}, document.title, window.location.pathname);
        } else {
            // Instantly hide the black screen
            bootOverlay.classList.add("hidden");
        }
    }

    // --- Global Authentication Check ---
    async function checkAuthStatus() {
        try {
            const response = await fetch('/api/auth/status');
            const data = await response.json();

            if (data.loggedIn) {
                accountButtons.forEach(btn => {
                    // ALWAYS act as the Profile Button, no matter what page we are on!
                    btn.innerText = `[ ${data.username} ]`;
                    btn.classList.add('logged-in');
                    btn.href = '/profile'; 
                    btn.classList.add('ready'); 
                });

                // DYNAMIC ADMIN BUTTON SPAWNER
                if (data.role === 'admin') {
                    const headerLeft = document.querySelector('.header-left');
                    if (headerLeft && !document.getElementById('adminNavBtn')) {
                        const adminBtn = document.createElement('a');
                        adminBtn.href = '/admin';
                        adminBtn.id = 'adminNavBtn';
                        adminBtn.className = 'header-btn btn-orange-invert ready';
                        adminBtn.innerText = '[ ADMIN OVERRIDE ]';
                        adminBtn.style.marginLeft = '15px'; 
                        headerLeft.appendChild(adminBtn);
                    }
                }

            } else {
                accountButtons.forEach(btn => {
                    btn.classList.add('ready'); 
                });
            }
        } catch (error) {
            console.error("Failed to verify auth status:", error);
            accountButtons.forEach(btn => btn.classList.add('ready'));
        }
    }

    // ==========================================
    // 3. INITIALIZATION
    // ==========================================
    handleBootAnimation();
    checkAuthStatus();
});