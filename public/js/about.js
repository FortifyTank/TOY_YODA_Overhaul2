document.addEventListener('DOMContentLoaded', () => {
    const track = document.getElementById('aboutScrollTrack');
    if (!track) return;

    // Grab all actors
    const text1 = document.getElementById('text1');
    const text2 = document.getElementById('text2');
    const logo = document.getElementById('animLogo');
    const leftWojak = document.getElementById('animLeft');
    const rightWojak = document.getElementById('animRight');
    
    // The newly separated staggered boxes
    const missionBox = document.getElementById('missionAnimBox');
    const foundersBox = document.getElementById('foundersAnimBox');

    window.addEventListener('scroll', () => {
        let progress = (window.scrollY - track.offsetTop) / (track.offsetHeight - window.innerHeight);
        progress = Math.max(0, Math.min(1, progress));

        // =====================================
        // PHASE 0: SCROLL INDICATOR (0% to 10%)
        // =====================================
        if (progress < 0.10) {
            let p = progress / 0.10; 
            scrollInd.style.opacity = 1 - p; // Fades from 1 down to 0
            scrollInd.style.transform = `translate(-50%, calc(-50% - ${p * 100}px))`; // Floats up 100px
        } else {
            // FORCES IT TO STAY DEAD AND INVISIBLE
            scrollInd.style.opacity = 0; 
            scrollInd.style.transform = `translate(-50%, calc(-50% - 100px))`; 
        }

        // =====================================
        // PHASE 1: "Who are we?" (10% to 20%)
        // =====================================
        // Notice this only STARTS fading in after the scroll text is fully dead (at 10%)
        if (progress >= 0.10 && progress < 0.20) {
            let p = (progress - 0.10) / 0.10;
            text1.style.opacity = p < 0.3 ? p / 0.3 : (p > 0.7 ? 1 - (p - 0.7) / 0.3 : 1);
        } else {
            text1.style.opacity = 0;
        }

        // =====================================
        // PHASE 2: "We are..." (20% to 30%)
        // =====================================
        if (progress >= 0.20 && progress < 0.30) {
            let p = (progress - 0.20) / 0.10;
            text2.style.opacity = p < 0.3 ? p / 0.3 : (p > 0.7 ? 1 - (p - 0.7) / 0.3 : 1);
        } else {
            text2.style.opacity = 0;
        }

        // 1. THE LOGO (Fades in, then Shifts Up & Fades Out)
        if (progress >= 0.30) {
            let logoEnter = Math.min(1, (progress - 0.30) / 0.10); 
            let logoOpacity = logoEnter; // Start with full fade-in opacity

            // At 50%, Logo starts moving UP and FADING OUT simultaneously
            let logoShiftRaw = 0;
            if (progress >= 0.50) {
                logoShiftRaw = Math.min(1, (progress - 0.50) / 0.15); // Takes 15% scroll to vanish
                logoOpacity = 1 - logoShiftRaw; // As it shifts up (0 to 1), opacity goes down (1 to 0)
            }
            
            let smoothLogoShift = 1 - Math.pow(1 - logoShiftRaw, 2); 

            logo.style.opacity = logoOpacity;
            logo.style.transform = `translateY(-${smoothLogoShift * 250}px) scale(${0.5 + (logoEnter * 0.5)})`;
        } else {
            logo.style.opacity = 0;
        }

        // Wojak Logic (Fast exit at 50%)
        if (progress >= 0.30 && progress < 0.55) {
            if (progress < 0.40) {
                let wEnter = (progress - 0.30) / 0.10;
                leftWojak.style.transform = `translateX(${-100 + (wEnter * 100)}%)`;
                rightWojak.style.transform = `translateX(${100 - (wEnter * 100)}%)`;
                leftWojak.style.opacity = wEnter; rightWojak.style.opacity = wEnter;
            } else if (progress < 0.50) {
                leftWojak.style.transform = `translateX(0%)`;
                rightWojak.style.transform = `translateX(0%)`;
                leftWojak.style.opacity = 1; rightWojak.style.opacity = 1;
            } else {
                let wExit = (progress - 0.50) / 0.05;
                leftWojak.style.transform = `translateX(${-(wExit * 100)}%)`;
                rightWojak.style.transform = `translateX(${wExit * 100}%)`;
                leftWojak.style.opacity = 1 - wExit; rightWojak.style.opacity = 1 - wExit;
            }
        } else {
            leftWojak.style.opacity = 0; rightWojak.style.opacity = 0;
        }

        // =====================================
        // PHASE 5: THE CINEMATIC DOSSIER PUSH
        // =====================================
        
        // 1. MISSION ENTRY & EXIT (50% to 85% scroll)
        if (progress >= 0.50 && progress <= 0.85) {
            let mEnter = Math.min(1, (progress - 0.50) / 0.10); // Slides in (50-60%)
            let mExit = 0;
            
            // THE FIX: Don't start the exit until 75% scroll! (Massive breathing room)
            if (progress >= 0.75) {
                mExit = Math.min(1, (progress - 0.75) / 0.10); // Exits (75-85%)
            }
            
            let smoothM = 1 - Math.pow(1 - mEnter, 2);
            let exitM = Math.pow(mExit, 2); 

            missionBox.style.opacity = mEnter;
            let dragUpDistance = window.innerHeight * 1.5; 
            missionBox.style.transform = `translateY(${100 - (smoothM * 100) - (exitM * dragUpDistance)}px)`; 
            
        } else if (progress < 0.50) {
            missionBox.style.opacity = 0;
            missionBox.style.transform = `translateY(100px)`; 
        } else {
            missionBox.style.opacity = 1; 
            missionBox.style.transform = `translateY(-3000px)`; 
        }

        // 2. FOUNDERS PUSH REVEAL (Wait until 75% to start rising)
        if (progress >= 0.75) {
            let fEnter = Math.min(1, (progress - 0.75) / 0.10); // Enters (75-85%)
            let smoothF = 1 - Math.pow(1 - fEnter, 2); 
            
            foundersBox.style.opacity = fEnter;
            foundersBox.style.transform = `translateY(${150 - (smoothF * 150)}px)`; 
        } else {
            foundersBox.style.opacity = 0;
            foundersBox.style.transform = `translateY(150px)`; 
        }
    });

    // IGNITION SWITCH: Force the scroll math to run once immediately on page load!
    window.dispatchEvent(new Event('scroll'));
});