// Integrated encounter page logic.
let encounterHeaderMotionTimer = null;

function getEncounterApp() {
    return document.getElementById('encounter-app');
}

function getEncounterActivePage(app = getEncounterApp()) {
    return app?.querySelector('.page-container.active') || null;
}

function switchEncounterPage(item) {
    const app = getEncounterApp();
    if (!app || !item) return;
    const navItems = app.querySelectorAll('.nav-item');
    const pages = app.querySelectorAll('.page-container');
    const pageTitle = app.querySelector('#encounter-page-title');
    const headerKicker = app.querySelector('#encounter-header-kicker');
    navItems.forEach(nav => nav.classList.toggle('active', nav === item));
    if (pageTitle) pageTitle.textContent = item.getAttribute('data-tab') || '';
    if (headerKicker) headerKicker.textContent = item.getAttribute('data-kicker') || '';
    const targetId = item.getAttribute('data-target');
    pages.forEach(page => {
        const active = page.id === targetId;
        page.classList.toggle('active', active);
        if (active) page.scrollTop = 0;
    });
}

function openEncounterApp() {
    const encounterApp = getEncounterApp();
    if (!encounterApp) return;
    document.body.classList.remove('edit-mode');
    if (typeof closeSettingsApp === 'function') closeSettingsApp(true);
    if (typeof closeLetterApp === 'function') closeLetterApp(true);
    if (typeof closePrivateApp === 'function') closePrivateApp(true);
    if (typeof closePrologueApp === 'function') closePrologueApp(true);
    if (typeof closeStyleApp === 'function') closeStyleApp(true);
    if (typeof closeDossierApp === 'function') closeDossierApp(true);
    if (typeof closeCommunityApp === 'function') closeCommunityApp(true);
    document.body.classList.add('encounter-open');
    encounterApp.classList.add('active');
}

function closeEncounterApp(instant = false) {
    const encounterApp = getEncounterApp();
    if (!encounterApp) return;
    if (instant) {
        const previousTransition = encounterApp.style.transition;
        encounterApp.style.transition = 'none';
        encounterApp.classList.remove('active');
        encounterApp.offsetHeight;
        requestAnimationFrame(() => {
            encounterApp.style.transition = previousTransition;
        });
    } else {
        encounterApp.classList.remove('active');
    }
    document.body.classList.remove('encounter-open');
}

function bindEncounterAppEvents() {
    const app = getEncounterApp();
    if (!app || app.dataset.encounterBound === 'true') return;
    app.dataset.encounterBound = 'true';

    app.querySelectorAll('.nav-item').forEach(item => {
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        item.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            switchEncounterPage(item);
        });
        item.addEventListener('keydown', event => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            switchEncounterPage(item);
        });
    });

    const headerAction = app.querySelector('#encounter-header-action');
    headerAction?.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        getEncounterActivePage(app)?.scrollTo({ top: 0, behavior: 'smooth' });
        if (navigator.vibrate) navigator.vibrate(20);
        window.clearTimeout(encounterHeaderMotionTimer);
        headerAction.style.transform = 'scale(0.95)';
        headerAction.style.transition = 'transform 0.1s';
        encounterHeaderMotionTimer = window.setTimeout(() => {
            headerAction.style.transform = 'scale(1)';
        }, 100);
    });

    app.addEventListener('touchstart', event => event.stopPropagation(), { passive: true });
    app.addEventListener('mousedown', event => event.stopPropagation());
}

bindEncounterAppEvents();

document.querySelector('.home-indicator')?.addEventListener('click', () => {
    if (getEncounterApp()?.classList.contains('active')) closeEncounterApp(true);
});

document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && getEncounterApp()?.classList.contains('active')) {
        closeEncounterApp();
    }
});

window.openEncounterApp = openEncounterApp;
window.closeEncounterApp = closeEncounterApp;
