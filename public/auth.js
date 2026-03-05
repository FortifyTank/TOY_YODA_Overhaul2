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
        e.preventDefault();
        const pass = document.getElementById("loginPass").value;

        // FAKE LOGIC: If password is "demo", trigger the hyperspace sequence!
        if(pass === "demo") {
            const terminal = document.querySelector(".terminal-container");
            const ships = document.querySelectorAll(".intro-ship"); // [0] is right ship, [1] is left ship

            // 1. The UI slides down and disappears
            terminal.classList.add("ui-hyperspace-hide");

            // 2. Right ship goes to hyperspace (0.4s delay)
            setTimeout(() => {
                ships[0].classList.add("jump-to-lightspeed");
            }, 400);

            // 3. Left ship goes to hyperspace right after (0.55s delay)
            setTimeout(() => {
                ships[1].classList.add("jump-to-lightspeed");
            }, 550);

            // 4. Fade to black seamlessly (Delayed to 1200 to let the ships finish jumping!)
            const fade = document.createElement('div');
            fade.className = 'warp-fade';
            document.body.appendChild(fade);
            setTimeout(() => fade.classList.add('active'), 1200);

            // 5. Load the Homepage! (Delayed to 1300ms)
            setTimeout(() => {
                // THE FIX: We pass the flag directly in the URL instead of sessionStorage!
                window.location.href = "home.html?warp=true"; 
            }, 1500);

        } else {
            triggerError("loginError", "> ERROR: INVALID CREDENTIALS");
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