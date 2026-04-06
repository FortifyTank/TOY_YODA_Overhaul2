document.addEventListener('DOMContentLoaded', () => {
    const track = document.getElementById('aboutScrollTrack');
    if (!track) return;

    const text1 = document.getElementById('text1');
    const text2 = document.getElementById('text2');
    const logo = document.getElementById('animLogo');
    const leftWojak = document.getElementById('animLeft');
    const rightWojak = document.getElementById('animRight');
    const scrollInd = document.getElementById('scrollInd');
    
    const missionBox = document.getElementById('missionAnimBox');
    const foundersBox = document.getElementById('foundersAnimBox');
    const techStackBox = document.getElementById('techStackAnimBox');

    let ticking = false;

    function updateAnimations() {
        let progress = (window.scrollY - track.offsetTop) / (track.offsetHeight - window.innerHeight);
        progress = Math.max(0, Math.min(1, progress));

        if (scrollInd) {
            if (progress < 0.10) {
                let p = progress / 0.10; 
                scrollInd.style.opacity = 1 - p; 
                scrollInd.style.transform = `translate(-50%, calc(-50% - ${p * 100}px))`; 
            } else {
                scrollInd.style.opacity = 0; 
                scrollInd.style.transform = `translate(-50%, calc(-50% - 100px))`; 
            }
        }

        if (progress >= 0.10 && progress < 0.20) {
            let p = (progress - 0.10) / 0.10;
            text1.style.opacity = p < 0.3 ? p / 0.3 : (p > 0.7 ? 1 - (p - 0.7) / 0.3 : 1);
        } else { text1.style.opacity = 0; }

        if (progress >= 0.20 && progress < 0.30) {
            let p = (progress - 0.20) / 0.10;
            text2.style.opacity = p < 0.3 ? p / 0.3 : (p > 0.7 ? 1 - (p - 0.7) / 0.3 : 1);
        } else { text2.style.opacity = 0; }

        if (progress >= 0.30) {
            let logoEnter = Math.min(1, (progress - 0.30) / 0.10); 
            let logoOpacity = logoEnter;
            let logoShiftRaw = 0;
            
            if (progress >= 0.50) {
                logoShiftRaw = Math.min(1, (progress - 0.50) / 0.15); 
                logoOpacity = 1 - logoShiftRaw; 
            }
            let smoothLogoShift = 1 - Math.pow(1 - logoShiftRaw, 2); 
            logo.style.opacity = logoOpacity;
            logo.style.transform = `translateY(-${smoothLogoShift * 250}px) scale(${0.5 + (logoEnter * 0.5)})`;
        } else { logo.style.opacity = 0; }

        if (progress >= 0.30 && progress < 0.55) {
            if (progress < 0.40) {
                let wEnter = (progress - 0.30) / 0.10;
                leftWojak.style.transform = `translateX(${-100 + (wEnter * 100)}%)`;
                rightWojak.style.transform = `translateX(${100 - (wEnter * 100)}%)`;
                leftWojak.style.opacity = wEnter; rightWojak.style.opacity = wEnter;
            } else if (progress < 0.50) {
                leftWojak.style.transform = `translateX(0%)`; rightWojak.style.transform = `translateX(0%)`;
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

        // mission
        if (progress >= 0.50 && progress <= 0.70) {
            let mEnter = Math.min(1, (progress - 0.50) / 0.10); 
            let mExit = progress >= 0.65 ? Math.min(1, (progress - 0.65) / 0.05) : 0;
            let smoothM = 1 - Math.pow(1 - mEnter, 2);
            let exitM = Math.pow(mExit, 2); 

            missionBox.style.opacity = mEnter;
            missionBox.style.transform = `translateY(${100 - (smoothM * 100) - (exitM * window.innerHeight * 1.5)}px)`; 
            missionBox.style.pointerEvents = mExit > 0.5 ? 'none' : 'auto';
        } else {
            missionBox.style.opacity = 0;
            missionBox.style.transform = progress < 0.50 ? `translateY(100px)` : `translateY(-3000px)`; 
            missionBox.style.pointerEvents = 'none';
        }

        // founders
        if (progress >= 0.70 && progress <= 0.90) {
            let fEnter = Math.min(1, (progress - 0.70) / 0.10); 
            let fExit = progress >= 0.85 ? Math.min(1, (progress - 0.85) / 0.05) : 0;
            let smoothF = 1 - Math.pow(1 - fEnter, 2); 
            let exitF = Math.pow(fExit, 2);

            foundersBox.style.opacity = fEnter;
            foundersBox.style.transform = `translateY(${150 - (smoothF * 150) - (exitF * window.innerHeight * 1.5)}px)`; 
            foundersBox.style.pointerEvents = fExit > 0.5 ? 'none' : 'auto';
        } else {
            foundersBox.style.opacity = 0;
            foundersBox.style.transform = progress < 0.70 ? `translateY(150px)` : `translateY(-3000px)`; 
            foundersBox.style.pointerEvents = 'none';
        }

        if (techStackBox) {
            if (progress >= 0.90) {
                let tEnter = Math.min(1, (progress - 0.90) / 0.10); 
                let smoothT = 1 - Math.pow(1 - tEnter, 2); 
                
                techStackBox.style.opacity = tEnter;
                techStackBox.style.transform = `translateY(${150 - (smoothT * 150)}px)`; 
                techStackBox.style.pointerEvents = 'auto';
            } else {
                techStackBox.style.opacity = 0;
                techStackBox.style.transform = `translateY(150px)`; 
                techStackBox.style.pointerEvents = 'none';
            }
        }
        
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(updateAnimations);
            ticking = true;
        }
    });

    updateAnimations();
});