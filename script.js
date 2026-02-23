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

            setTimeout(() => {
                hyperspaceOverlay.classList.add("active");
                
                // Redirect to store page after the white flash covers the screen
                setTimeout(() => {
                    // window.location.href = "store.html"; 
                    alert("Transition to Store Page!"); 
                }, 1500);

            }, 500);
        }
    });
});