// --- 独立信笺应用页逻辑 ---
function openLetterApp(options = {}) {
    const letterApp = document.getElementById('letter-app');
    if (!letterApp) return;
    document.body.classList.remove('edit-mode');
    closeSettingsApp(true);
    if (!options.preservePrivate) closePrivateApp(true);
    closePrologueApp(true);
    closeStyleApp(true);
    document.body.classList.add('letter-open');
    letterApp.classList.add('active');
    letterApp.scrollTop = 0;
}

function closeLetterApp(instant = false) {
    const letterApp = document.getElementById('letter-app');
    const privateWasVerifying = privateAuthLetterMode;
    if (privateAuthLetterMode) {
        restoreLetterSnapshot();
        privateAuthLetterMode = false;
    }
    if (letterApp) {
        if (instant) {
            const previousTransition = letterApp.style.transition;
            letterApp.style.transition = 'none';
            letterApp.classList.remove('active');
            letterApp.offsetHeight;
            requestAnimationFrame(() => {
                letterApp.style.transition = previousTransition;
            });
        } else {
            letterApp.classList.remove('active');
        }
    }
    document.body.classList.remove('letter-open');
    const privateApp = document.getElementById('private-app');
    if (privateApp?.classList.contains('active') && (privateState.verified || privateWasVerifying)) {
        showPrivateScreen('verify');
    }
}
