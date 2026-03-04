document.addEventListener("DOMContentLoaded", () => {
    
    // UI Elements
    const uiWrapper = document.querySelector(".ui-wrapper");
    const startPrompt = document.getElementById("startPrompt");
    const authBox = document.getElementById("authBox");
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    
    // Buttons
    const showRegisterBtn = document.getElementById("showRegister");
    const showLoginBtn = document.getElementById("showLogin");
    
    // Background Elements
    const cameraRig = document.getElementById("cameraRig");
    const parallaxLayers = document.querySelectorAll(".parallax-layer");

    // --- 1. PARALLAX MOUSE TRACKING ---
    document.addEventListener("mousemove", (e) => {
        const x = (window.innerWidth / 2 - e.pageX) / 120;
        const y = (window.innerHeight / 2 - e.pageY) / 120;

        parallaxLayers.forEach(layer => {
            const speed = layer.getAttribute("data-speed");
            layer.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
        });
    });

    // --- 2. START PROMPT (Press Enter) ---
    let hasStarted = false; 

    const initLogin = () => {
        if (hasStarted) return; 
        hasStarted = true;

        startPrompt.style.transition = "opacity 0.3s ease";
        startPrompt.style.opacity = "0";
        
        setTimeout(() => {
            startPrompt.style.display = "none";
            
            authBox.style.position = "relative"; 
            authBox.classList.remove("hidden");  
            authBox.classList.add("deploying"); 

            // FIX: Remove the deploying class after the animation finishes (600ms)
            // This prevents it from replaying after an error shake!
            setTimeout(() => {
                authBox.classList.remove("deploying");
            }, 600);

        }, 300);
    };

    // Listen for Enter Key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            initLogin();
        }
    });
    // Fallback: Click the prompt
    startPrompt.addEventListener("click", initLogin);

    // --- 3. CAMERA PAN (Login <-> Register) ---
    showRegisterBtn.addEventListener("click", () => {
        cameraRig.classList.add("pan-to-ship");
        
        loginForm.classList.remove("active-form");
        loginForm.classList.add("hidden-form");
        registerForm.classList.remove("hidden-form");
        registerForm.classList.add("active-form");
    });

    showLoginBtn.addEventListener("click", () => {
        cameraRig.classList.remove("pan-to-ship");
        
        registerForm.classList.remove("active-form");
        registerForm.classList.add("hidden-form");
        loginForm.classList.remove("hidden-form");
        loginForm.classList.add("active-form");
    });

    // --- 4. ERROR HANDLING (AUTOMATON THEME) ---
    
    let errorTimer; // ADDED: Variable to keep track of the countdown

    // Helper function to trigger the red theme and shake
    const triggerError = (errorId, msg) => {
        // 1. Cancel the old 3-second countdown if the user spams the button
        clearTimeout(errorTimer);

        // 2. Reset the animation by removing the class
        authBox.classList.remove("error-state");
        
        // 3. Force the browser to register the reset (A classic CSS trick!)
        void authBox.offsetWidth; 

        // 4. Add the error state back to trigger the red theme and shake
        authBox.classList.add("error-state");
        
        const errorEl = document.getElementById(errorId);
        errorEl.innerText = msg;
        errorEl.classList.remove("hidden");

        // 5. Start a fresh, un-interrupted 3-second countdown
        errorTimer = setTimeout(() => {
            authBox.classList.remove("error-state");
            errorEl.classList.add("hidden");
        }, 3000); 
    };
    // Form Submit Intercepts (Fake Validation)
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault(); // Stops the page from reloading
        const pass = document.getElementById("loginPass").value;

        // FAKE LOGIC: If password isn't exactly "demo", trigger error!
        if(pass !== "demo") {
            triggerError("loginError", "> ERROR: INVALID CREDENTIALS");
        } else {
            // If they type "demo", pretend they logged in and go to dashboard
            window.location.href = "home.html"; 
        }
    });

    registerForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("regName").value;

        // FAKE LOGIC: If they try to register as CT-5555, say it exists
        if(name.toUpperCase() === "CT-5555") {
            triggerError("registerError", "> ERROR: DOSSIER ALREADY EXISTS");
        } else {
            triggerError("registerError", "> ERROR: SECTOR REGISTRY OFFLINE");
        }
    });
});