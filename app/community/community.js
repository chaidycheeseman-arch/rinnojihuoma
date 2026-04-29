// Integrated community page logic.
let communityHeaderMotionTimer = null;

function getCommunityApp() {
    return document.getElementById('community-app');
}

function getCommunityActivePage(app = getCommunityApp()) {
    return app?.querySelector('.page-container.active') || null;
}

function switchCommunityPage(item) {
    const app = getCommunityApp();
    if (!app || !item) return;
    const navItems = app.querySelectorAll('.nav-item');
    const pages = app.querySelectorAll('.page-container');
    const pageTitle = app.querySelector('#community-page-title');
    const headerKicker = app.querySelector('#community-header-kicker');
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

function resetCommunityPage() {
    const app = getCommunityApp();
    const first = app?.querySelector('.nav-item[data-target="community-view-discover"]');
    switchCommunityPage(first);
}

function openCommunityApp() {
    const communityApp = getCommunityApp();
    if (!communityApp) return;
    document.body.classList.remove('edit-mode');
    if (typeof closeSettingsApp === 'function') closeSettingsApp(true);
    if (typeof closeLetterApp === 'function') closeLetterApp(true);
    if (typeof closePrivateApp === 'function') closePrivateApp(true);
    if (typeof closePrologueApp === 'function') closePrologueApp(true);
    if (typeof closeStyleApp === 'function') closeStyleApp(true);
    if (typeof closeDossierApp === 'function') closeDossierApp(true);
    if (typeof closeEncounterApp === 'function') closeEncounterApp(true);
    document.body.classList.add('community-open');
    communityApp.classList.add('active');
}

function closeCommunityApp(instant = false) {
    const communityApp = getCommunityApp();
    if (!communityApp) return;
    if (instant) {
        const previousTransition = communityApp.style.transition;
        communityApp.style.transition = 'none';
        communityApp.classList.remove('active');
        communityApp.offsetHeight;
        requestAnimationFrame(() => {
            communityApp.style.transition = previousTransition;
        });
    } else {
        communityApp.classList.remove('active');
    }
    document.body.classList.remove('community-open');
}

function bindCommunityAppEvents() {
    const app = getCommunityApp();
    if (!app || app.dataset.communityBound === 'true') return;
    app.dataset.communityBound = 'true';

    app.querySelectorAll('.nav-item').forEach(item => {
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        item.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            switchCommunityPage(item);
        });
        item.addEventListener('keydown', event => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            switchCommunityPage(item);
        });
    });

    const headerAction = app.querySelector('#community-header-action');
    headerAction?.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        getCommunityActivePage(app)?.scrollTo({ top: 0, behavior: 'smooth' });
        if (navigator.vibrate) navigator.vibrate(20);
        window.clearTimeout(communityHeaderMotionTimer);
        headerAction.style.transform = 'scale(0.95)';
        headerAction.style.transition = 'transform 0.1s';
        communityHeaderMotionTimer = window.setTimeout(() => {
            headerAction.style.transform = 'scale(1)';
        }, 100);
    });

    app.addEventListener('touchstart', event => event.stopPropagation(), { passive: true });
    app.addEventListener('mousedown', event => event.stopPropagation());
}

bindCommunityAppEvents();

document.querySelector('.home-indicator')?.addEventListener('click', () => {
    if (getCommunityApp()?.classList.contains('active')) closeCommunityApp(true);
});

document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && getCommunityApp()?.classList.contains('active')) {
        closeCommunityApp();
    }
});

window.openCommunityApp = openCommunityApp;
window.closeCommunityApp = closeCommunityApp;
