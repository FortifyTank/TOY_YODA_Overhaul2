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
});