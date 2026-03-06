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

    // --- PASSWORD REVEAL LOGIC ---
    const toggleRegPass = document.getElementById("toggleRegPass");
    const regPassword = document.getElementById("regPassword");

    const toggleLoginPass = document.getElementById("toggleLoginPass");
    const loginPass = document.getElementById("loginPass");

    // The two SVG strings
    const iconHidden = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
    const iconVisible = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;

    function setupPasswordToggle(btn, input) {
        if (!btn || !input) return;
        btn.addEventListener("click", () => {
            const isPassword = input.getAttribute("type") === "password";
            
            // Swap the input type
            input.setAttribute("type", isPassword ? "text" : "password");
            
            // Swap the SVG Icon
            btn.innerHTML = isPassword ? iconVisible : iconHidden;
            
            // Toggle the bright white active state
            btn.classList.toggle("active"); 
        });
    }

    setupPasswordToggle(toggleRegPass, regPassword);
    setupPasswordToggle(toggleLoginPass, loginPass);

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
    // --- LOGIN LOGIC (Triggers Hyperspace) ---
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPass").value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // SUCCESS! Trigger the hyperspace sequence
                const terminal = document.querySelector(".terminal-container");
                const ships = document.querySelectorAll(".intro-ship");

                terminal.classList.add("ui-hyperspace-hide");
                setTimeout(() => ships[0].classList.add("jump-to-lightspeed"), 400);
                setTimeout(() => ships[1].classList.add("jump-to-lightspeed"), 550);

                const fade = document.createElement('div');
                fade.className = 'warp-fade';
                document.body.appendChild(fade);
                setTimeout(() => fade.classList.add('active'), 1200);

                setTimeout(() => {
                    window.location.href = data.redirect;
                }, 1500);
            } else {
                triggerError("loginError", data.error);
            }
        } catch (err) {
            triggerError("loginError", "> ERROR: CONNECTION TIMEOUT");
        }
    });

    // --- REGISTER LOGIC (Triggers Green Success & Pans Camera) ---
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const username = document.getElementById("regName").value;
        const email = registerForm.querySelector('input[type="email"]').value;
        
        // THE FIX: Now it will find the password box even if the eye icon changed it to "text"!
        const password = document.getElementById("regPassword").value;

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // 1. Show the success message in Green
                const errorEl = document.getElementById("registerError");
                errorEl.innerText = data.message;
                errorEl.style.color = "var(--term-green)"; // Override red with green
                errorEl.style.textShadow = "0 0 8px rgba(0, 255, 102, 0.6)";
                errorEl.classList.remove("hidden");

                // 2. Wait 2 seconds, clear the message, and slide back to the Login screen
                setTimeout(() => {
                    errorEl.classList.add("hidden");
                    errorEl.style.color = ""; 
                    errorEl.style.textShadow = "";
                    
                    // NEW: Wipe the form completely clean!
                    registerForm.reset(); 
                    regPassword.setAttribute("type", "password"); // Hide the password again
                    toggleRegPass.classList.remove("active");
                    
                    showLoginBtn.click(); 
                }, 2000);

            } else {
                triggerError("registerError", data.error);
            }
        } catch (err) {
            triggerError("registerError", "> ERROR: CONNECTION TIMEOUT");
        }
    });
});