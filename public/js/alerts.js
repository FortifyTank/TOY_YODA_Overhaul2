let alertTimer;

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
    
    alertTimer = setTimeout(() => sysAlert.classList.remove('active'), 4000);
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('systemAlertOkBtn')?.addEventListener('click', () => {
        document.getElementById('systemAlert').classList.remove('active');
    });
});