const GUIDE_STORAGE_KEY = 'rinno_guide_progress_v1';
let guideProgress = {};
let guideEventsBound = false;
let guideHydratePromise = null;

function parseGuideProgressContent(content) {
    if (!content || typeof content !== 'string') return {};
    try {
        const parsed = JSON.parse(content);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
        return {};
    }
}

function readLegacyGuideProgress() {
    try {
        return parseGuideProgressContent(localStorage.getItem(GUIDE_STORAGE_KEY) || '{}');
    } catch (error) {
        return {};
    }
}

async function readGuideProgress() {
    try {
        if (typeof db !== 'undefined' && db?.edits?.get) {
            const saved = await db.edits.get(GUIDE_STORAGE_KEY);
            if (saved?.content) return parseGuideProgressContent(saved.content);
        }
    } catch (error) {
        console.warn('Guide progress Dexie read failed:', error);
    }
    const legacy = readLegacyGuideProgress();
    if (Object.keys(legacy).length) void persistGuideProgress(legacy);
    return legacy;
}

function writeGuideProgress() {
    try {
        void persistGuideProgress(guideProgress && typeof guideProgress === 'object' ? { ...guideProgress } : {});
    } catch (error) {
        console.warn('指南进度保存失败:', error);
    }
}

async function hydrateGuideProgress() {
    guideHydratePromise = readGuideProgress().then(result => {
        guideProgress = result;
        renderGuideProgress();
        return result;
    });
    return guideHydratePromise;
}

async function persistGuideProgress(snapshot) {
    try {
        if (typeof db !== 'undefined' && db?.edits?.put) {
            await db.edits.put({
                id: GUIDE_STORAGE_KEY,
                content: JSON.stringify(snapshot && typeof snapshot === 'object' ? snapshot : {}),
                type: 'guide-progress'
            });
        }
    } catch (error) {
        console.warn('Guide progress Dexie save failed:', error);
    }
    try {
        localStorage.removeItem(GUIDE_STORAGE_KEY);
    } catch (error) {
        // Ignore legacy cleanup failures.
    }
}

function writeGuideProgress() {
    const snapshot = guideProgress && typeof guideProgress === 'object' ? { ...guideProgress } : {};
    void persistGuideProgress(snapshot);
}

function renderGuideProgress() {
    document.querySelectorAll('[data-guide-item]').forEach(card => {
        const key = card.getAttribute('data-guide-item') || '';
        const done = Boolean(guideProgress[key]);
        card.classList.toggle('done', done);
        card.querySelector('.guide-check')?.setAttribute('aria-pressed', done ? 'true' : 'false');
    });
}

function switchGuideTab(key) {
    document.querySelectorAll('[data-guide-tab]').forEach(tab => {
        const active = tab.getAttribute('data-guide-tab') === key;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    document.querySelectorAll('[data-guide-panel]').forEach(panel => {
        const active = panel.getAttribute('data-guide-panel') === key;
        panel.classList.toggle('active', active);
        panel.hidden = !active;
    });
}

function getGuideApp() {
    return document.getElementById('guide-app');
}

async function openGuideApp() {
    const app = getGuideApp();
    if (!app) return;
    document.body.classList.remove('edit-mode');
    if (typeof closeSettingsApp === 'function') closeSettingsApp(true);
    if (typeof closeLetterApp === 'function') closeLetterApp(true);
    if (typeof closePrivateApp === 'function') closePrivateApp(true);
    if (typeof closePrologueApp === 'function') closePrologueApp(true);
    if (typeof closeStyleApp === 'function') closeStyleApp(true);
    if (typeof closeCommunityApp === 'function') closeCommunityApp(true);
    if (typeof closeEncounterApp === 'function') closeEncounterApp(true);
    if (typeof closeDossierApp === 'function') closeDossierApp(true);
    if (typeof closeWanyeApp === 'function') closeWanyeApp(true);
    if (typeof closeLingguangApp === 'function') closeLingguangApp(true);
    if (typeof closePhoneApp === 'function') closePhoneApp(true);
    await hydrateGuideProgress();
    document.body.classList.add('guide-open');
    app.classList.add('active');
}

function closeGuideApp(instant = false) {
    const app = getGuideApp();
    if (!app) return;
    if (instant) {
        const previousTransition = app.style.transition;
        app.style.transition = 'none';
        app.classList.remove('active');
        app.offsetHeight;
        requestAnimationFrame(() => {
            app.style.transition = previousTransition;
        });
    } else {
        app.classList.remove('active');
    }
    document.body.classList.remove('guide-open');
}

function bindGuideEvents() {
    const app = getGuideApp();
    if (!app || guideEventsBound) return;
    guideEventsBound = true;
    void hydrateGuideProgress();
    document.getElementById('guide-close-title')?.addEventListener('click', event => {
        event.preventDefault();
        closeGuideApp();
    });
    document.getElementById('guide-reset-progress')?.addEventListener('click', event => {
        event.preventDefault();
        guideProgress = {};
        writeGuideProgress();
        renderGuideProgress();
    });
    app.addEventListener('click', event => {
        const target = event.target instanceof Element ? event.target : event.target?.parentElement;
        const tab = target?.closest('[data-guide-tab]');
        if (tab) {
            event.preventDefault();
            switchGuideTab(tab.getAttribute('data-guide-tab') || 'desktop');
            return;
        }
        const card = target?.closest('[data-guide-item]');
        if (card && target?.closest('.guide-check')) {
            event.preventDefault();
            const key = card.getAttribute('data-guide-item') || '';
            guideProgress[key] = !guideProgress[key];
            writeGuideProgress();
            renderGuideProgress();
        }
    });
    app.addEventListener('touchstart', event => event.stopPropagation(), { passive: true });
    app.addEventListener('mousedown', event => event.stopPropagation());
}

bindGuideEvents();

document.querySelector('.home-indicator')?.addEventListener('click', () => {
    if (getGuideApp()?.classList.contains('active')) closeGuideApp(true);
});

document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && getGuideApp()?.classList.contains('active')) closeGuideApp();
});

window.openGuideApp = openGuideApp;
window.closeGuideApp = closeGuideApp;
