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
                    
                    if (window.location.pathname.includes('/profile')) {
                        // INJECTS THE SVG DIRECTLY NEXT TO THE TEXT (Cleaned up!)
                        btn.innerHTML = `
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M9 14L4 9l5-5"/>
                                <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/>
                            </svg>
                            RETURN TO CATALOG
                        `;
                        btn.classList.add('logged-in');
                        btn.href = '/products'; 
                    } else {
                        btn.innerText = `[ ${data.username.toUpperCase()} ]`;
                        btn.classList.add('logged-in');
                        btn.href = '/profile'; 
                    }
                    
                    btn.classList.add('ready'); 
                });

                if (data.role === 'admin') {
                    const headerLeft = document.querySelector('.header-left');
                    // Check if it already exists so we don't spawn duplicates
                    if (headerLeft && !document.getElementById('adminNavBtn')) {
                        const adminBtn = document.createElement('a');
                        adminBtn.href = '/admin';
                        adminBtn.id = 'adminNavBtn';
                        // Uses your existing CSS to make it perfectly orange and hoverable!
                        adminBtn.className = 'header-btn btn-orange-invert ready';
                        adminBtn.innerText = '[ ADMIN OVERRIDE ]';
                        adminBtn.style.marginLeft = '15px'; // Gives it space from the profile button
                        headerLeft.appendChild(adminBtn);
                    }
                }
            } else {
                accountButtons.forEach(btn => {
                    btn.classList.add('ready'); // Drops the default green button
                });
            }
        } catch (error) {
            console.error("Failed to verify auth status:", error);
            // Fallback: Drop the default green buttons even if the server lags
            accountButtons.forEach(btn => btn.classList.add('ready'));
        }
    }

    // ==========================================
    // 3. INITIALIZATION
    // ==========================================
    handleBootAnimation();
    checkAuthStatus();
});