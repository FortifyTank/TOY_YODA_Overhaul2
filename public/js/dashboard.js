document.addEventListener("DOMContentLoaded", () => {
    
    // --- GLOBAL SYSTEM BOOT FADE-IN ---
    const bootOverlay = document.getElementById("bootOverlay");
    const urlParams = new URLSearchParams(window.location.search);
    
    if (bootOverlay) {
        if (urlParams.get("warp") === "true") {
            bootOverlay.classList.add("fade-out");
            window.history.replaceState({}, document.title, window.location.pathname);
        } else {
            bootOverlay.classList.add("hidden");
        }
    }

    // --- GLOBAL AUTHENTICATION CHECK ---
    async function checkAuthStatus() {
        try {
            const response = await fetch('/api/auth/status');
            const data = await response.json();

            // Find every "LOG IN" button on the page
            const accountButtons = document.querySelectorAll('.clearance');

            if (data.loggedIn) {
                accountButtons.forEach(btn => {
                    btn.innerText = `[ ${data.username} ]`;
                    btn.classList.add('logged-in');
                    btn.href = '/profile'; 
                    btn.classList.add('ready'); // Reveal the button!
                });
            } else {
                accountButtons.forEach(btn => {
                    // It's already green by default, just reveal it!
                    btn.classList.add('ready'); 
                });
            }
        } catch (error) {
            console.error("Failed to verify auth status:", error);
        }
    }

    // Run the check instantly on page load
    checkAuthStatus();
});