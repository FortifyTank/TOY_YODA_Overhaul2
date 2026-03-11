// public/js/alerts.js
let alertTimer;

// By attaching it to 'window', EVERY other JS file can use this function!
window.showSystemAlert = function(message, type = 'error') {
    const sysAlert = document.getElementById('systemAlert');
    const sysMsg = document.getElementById('systemAlertMessage');
    const sysIcon = document.querySelector('.alert-icon');
    if (!sysAlert) return alert(message); // Fallback

    sysMsg.innerText = message; 
    
    if (type === 'success') {
        sysAlert.classList.add('alert-success');
        sysIcon.innerText = '[✓]';
    } else {
        sysAlert.classList.remove('alert-success');
        sysIcon.innerText = '[!]';
    }

    sysAlert.classList.add('active');
    clearTimeout(alertTimer);
    
    // Stays on screen for 4 seconds, then slides up
    alertTimer = setTimeout(() => sysAlert.classList.remove('active'), 4000);
};

// Global click listener for the Acknowledge button
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('systemAlertOkBtn')?.addEventListener('click', () => {
        document.getElementById('systemAlert').classList.remove('active');
    });
});