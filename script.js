document.addEventListener("DOMContentLoaded", () => {
    
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const showRegisterBtn = document.getElementById("showRegister");
    const showLoginBtn = document.getElementById("showLogin");
    const authBox = document.getElementById("authBox");
    const hyperspaceOverlay = document.getElementById("hyperspace-overlay");

    // --- SWAP BETWEEN LOGIN AND REGISTER ---
    showRegisterBtn.addEventListener("click", () => {
        loginForm.classList.remove("active-form");
        loginForm.classList.add("hidden-form");
        
        registerForm.classList.remove("hidden-form");
        registerForm.classList.add("active-form");
    });

    showLoginBtn.addEventListener("click", () => {
        registerForm.classList.remove("active-form");
        registerForm.classList.add("hidden-form");
        
        loginForm.classList.remove("hidden-form");
        loginForm.classList.add("active-form");
    });

    // --- MOCK LOGIN LOGIC & ANIMATIONS ---
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault(); // Stop page reload

        const email = document.getElementById("loginEmail").value;
        const pass = document.getElementById("loginPass").value;

        // TEST CONDITION: Type "wrong" as the password to see the error animation
        if (pass === "wrong") {
            // Trigger INVALID flash
            authBox.classList.add("error-state");
            
            // Change button text temporarily
            const btn = loginForm.querySelector(".action-btn");
            const originalText = btn.innerText;
            btn.innerText = "[ ACCESS DENIED ]";

            // Remove the error state after 1 second so they can try again
            setTimeout(() => {
                authBox.classList.remove("error-state");
                btn.innerText = originalText;
                document.getElementById("loginPass").value = ""; // Clear password
            }, 1000);

        } else {
            // SUCCESSFUL LOGIN: Trigger Hyperspace
            const btn = loginForm.querySelector(".action-btn");
            btn.innerText = "[ CLEARANCE GRANTED ]";
            btn.style.background = "var(--terminal-green)";
            btn.style.color = "black";

            // Grab the hyperspace video element
            const hyperspaceVid = document.getElementById("hyperspace-video");

            setTimeout(() => {
                // 1. Play the hyperspace video
                hyperspaceVid.play();
                
                // 2. Fade it into view (covers the slow stars)
                hyperspaceVid.classList.add("jump-active");
                
                // 3. Optional: Fade out the terminal UI so they just see the hyperspace jump
                document.querySelector(".terminal-container").style.opacity = "0";
                document.querySelector(".terminal-container").style.transition = "opacity 1s ease";
                
                // Redirect to store page after the jump finishes (adjust timing based on your video length!)
                setTimeout(() => {
                    window.location.href = "home.html"; 
                    alert("Transition to Store Page!"); 
                }, 3000); // 3000ms = 3 seconds of hyperspace before loading the next page

            }, 500); // Small delay after clicking submit
        }
    });
});