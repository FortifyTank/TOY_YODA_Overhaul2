document.addEventListener("DOMContentLoaded", () => {
    
    // state and constants
    let hasStarted = false; 
    let errorTimer; 

    // Parallax State
    let isTicking = false;
    let mouseX = 0;
    let mouseY = 0;

    const iconHidden = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
    const iconVisible = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;

    // DOM elements
    const startPrompt = document.getElementById("startPrompt");
    const authBox = document.getElementById("authBox");
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    
    const showRegisterBtn = document.getElementById("showRegister");
    const showLoginBtn = document.getElementById("showLogin");
    
    const cameraRig = document.getElementById("cameraRig");
    const parallaxLayers = document.querySelectorAll(".parallax-layer");


    // UTIL FUNCTIONS

    // Password Reveal Tool
    function setupPasswordToggle(btnId, inputId) {
        const btn = document.getElementById(btnId);
        const input = document.getElementById(inputId);
        
        if (!btn || !input) return;
        
        btn.innerHTML = iconHidden; // Auto-inject SVG
        
        btn.addEventListener("click", () => {
            const isPassword = input.getAttribute("type") === "password";
            input.setAttribute("type", isPassword ? "text" : "password");
            btn.innerHTML = isPassword ? iconVisible : iconHidden;
            btn.classList.toggle("active"); 
        });
    }

    // Automaton Red Error Flash Tool
    const triggerError = (errorId, msg) => {
        clearTimeout(errorTimer); // Stop previous timers
        
        authBox.classList.remove("error-state");
        void authBox.offsetWidth; // Force CSS reset hack
        authBox.classList.add("error-state");
        
        const errorEl = document.getElementById(errorId);
        errorEl.innerText = msg;
        errorEl.classList.remove("hidden");

        errorTimer = setTimeout(() => {
            authBox.classList.remove("error-state");
            errorEl.classList.add("hidden");
        }, 3000); 
    };

    // initialization
    
    // Setup Password Eyes
    setupPasswordToggle("toggleRegPass", "regPassword");
    setupPasswordToggle("toggleLoginPass", "loginPass");

   // Parallax Mouse Tracking
    document.addEventListener("mousemove", (e) => {
        // Store the latest mouse position
        mouseX = e.pageX;
        mouseY = e.pageY;

        // Only request a new frame if one isnt already pending
        if (!isTicking) {
            window.requestAnimationFrame(() => {
                const x = (window.innerWidth / 2 - mouseX) / 120;
                const y = (window.innerHeight / 2 - mouseY) / 120;

                parallaxLayers.forEach(layer => {
                    const speed = layer.getAttribute("data-speed");
                    layer.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
                });
                
                isTicking = false;
            });
            isTicking = true; // Lock it until the frame is drawn
        }
    });

    const initLogin = () => {
        if (hasStarted) return; 
        hasStarted = true;

        startPrompt.style.transition = "opacity 0.3s ease";
        startPrompt.style.opacity = "0";
        
        setTimeout(() => {
            const terminal = document.querySelector(".terminal-container");
            const brandHeader = document.querySelector(".brand-header");
            
            // measure the exact pixel position of the logo
            const beforeY = brandHeader.getBoundingClientRect().top;
            
            // hide prompt and deploy the box
            startPrompt.style.display = "none";
            authBox.style.position = "relative"; 
            authBox.classList.remove("hidden");  
            
            // measure where the browser instantly snapped the logo to
            const afterY = brandHeader.getBoundingClientRect().top;
            const jumpDistance = beforeY - afterY; // Calculates exact pixel difference
            
            // instantly push the whole container down to offset the jump
            terminal.style.transition = "none";
            terminal.style.transform = `translate(-50%, calc(-50% + ${jumpDistance}px))`;
            
            // Force browser to render this invisible offset frame
            void terminal.offsetHeight; 
            
            // turn on the smooth animation and slide it up to true center
            terminal.style.transition = "transform 0.8s cubic-bezier(0.1, 0.9, 0.2, 1)";
            terminal.style.transform = "translate(-50%, -50%)";

            // trigger your laser-unfold animation on the box itself
            authBox.classList.add("deploying"); 
            
            // clean up the animations after they finish
            setTimeout(() => {
                authBox.classList.remove("deploying");
                terminal.style.transition = "";
                terminal.style.transform = "";
            }, 850);

        }, 300);
    };
    document.addEventListener("keydown", (e) => { if (e.key === "Enter") initLogin(); });
    startPrompt.addEventListener("click", initLogin);

    // Camera Panning (Switch Forms)
    showRegisterBtn.addEventListener("click", () => {
        cameraRig.classList.add("pan-to-ship");
        loginForm.classList.replace("active-form", "hidden-form");
        registerForm.classList.replace("hidden-form", "active-form");
    });

    showLoginBtn.addEventListener("click", () => {
        cameraRig.classList.remove("pan-to-ship");
        registerForm.classList.replace("active-form", "hidden-form");
        loginForm.classList.replace("hidden-form", "active-form");
    });

    // form submissions
    
    // Login
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
                const terminal = document.querySelector(".terminal-container");
                const ships = document.querySelectorAll(".intro-ship");

                terminal.classList.add("ui-hyperspace-hide");
                setTimeout(() => ships[0].classList.add("jump-to-lightspeed"), 400);
                setTimeout(() => ships[1].classList.add("jump-to-lightspeed"), 550);

                const fade = document.createElement('div');
                fade.className = 'warp-fade';
                document.body.appendChild(fade);
                setTimeout(() => fade.classList.add('active'), 1200);

                setTimeout(() => window.location.href = data.redirect, 1500);
            } else {
                triggerError("loginError", data.error);
            }
        } catch (err) {
            triggerError("loginError", "> ERROR: CONNECTION TIMEOUT");
        }
    });

    // Register
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const username = document.getElementById("regName").value;
        const email = document.getElementById("regEmail").value;
        const password = document.getElementById("regPassword").value;

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                const errorEl = document.getElementById("registerError");
                errorEl.innerText = data.message;
                errorEl.style.color = "var(--term-green)"; 
                errorEl.style.textShadow = "0 0 8px rgba(0, 255, 102, 0.6)";
                errorEl.classList.remove("hidden");

                setTimeout(() => {
                    errorEl.classList.add("hidden");
                    errorEl.style.color = ""; 
                    errorEl.style.textShadow = "";
                    
                    registerForm.reset(); 
                    document.getElementById("regPassword").setAttribute("type", "password"); 
                    document.getElementById("toggleRegPass").classList.remove("active");
                    
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