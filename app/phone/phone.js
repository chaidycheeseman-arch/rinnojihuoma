const PHONE_RECENT_KEY = 'rinno_phone_recent_v1';
let phoneNumber = '';
let phoneRecents = [];
let phoneEventsBound = false;
let activePhonePage = 'recent';

const PHONE_PAGES = {
    recent: {
        note: '近期通话记录。'
    },
    contacts: {
        note: '常用联系人。'
    },
    dial: {
        note: '号码拨盘。'
    },
    voicemail: {
        note: '未接来电留言。'
    }
};

const PHONE_CONTACTS = [
    { name: 'Lies7core', number: '175543', note: '主账号' },
    { name: 'NianGao_', number: '520520', note: '置顶联系人' },
    { name: 'Studio.Rinno', number: '10086', note: '系统服务' }
];

const PHONE_VOICEMAILS = [
    { name: 'Studio.Rinno', number: '10086', time: '09:41', duration: '00:18', note: '系统留言' },
    { name: 'NianGao_', number: '520520', time: '昨天', duration: '00:32', note: '未听留言' }
];

function parsePhoneRecentsContent(content) {
    if (!content || typeof content !== 'string') return [];
    try {
        const parsed = JSON.parse(content);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
}

function readLegacyPhoneRecents() {
    try {
        return parsePhoneRecentsContent(localStorage.getItem(PHONE_RECENT_KEY) || '[]');
    } catch (error) {
        return [];
    }
}

async function readPhoneRecents() {
    try {
        if (typeof db !== 'undefined' && db?.edits?.get) {
            const saved = await db.edits.get(PHONE_RECENT_KEY);
            if (saved?.content) return parsePhoneRecentsContent(saved.content);
        }
    } catch (error) {
        console.warn('Phone recents Dexie read failed:', error);
    }
    const legacy = readLegacyPhoneRecents();
    if (legacy.length) void persistPhoneRecents(legacy);
    return legacy;
}

function writePhoneRecents() {
    try {
        void persistPhoneRecents(phoneRecents);
    } catch (error) {
        console.warn('电话最近通话保存失败:', error);
    }
}

async function hydratePhoneRecents() {
    phoneRecents = await readPhoneRecents();
    renderPhoneNumber();
    renderPhoneLists();
    renderPhoneVoicemail();
    setPhonePage(activePhonePage);
    return phoneRecents;
}

async function persistPhoneRecents(snapshot) {
    try {
        if (typeof db !== 'undefined' && db?.edits?.put) {
            await db.edits.put({
                id: PHONE_RECENT_KEY,
                content: JSON.stringify(Array.isArray(snapshot) ? snapshot : []),
                type: 'phone-recents'
            });
        }
    } catch (error) {
        console.warn('Phone recents Dexie save failed:', error);
    }
    try {
        localStorage.removeItem(PHONE_RECENT_KEY);
    } catch (error) {
        // Ignore legacy cleanup failures.
    }
}

function writePhoneRecents() {
    void persistPhoneRecents(phoneRecents);
}

function escapePhoneHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getPhoneContact(number) {
    return PHONE_CONTACTS.find(contact => contact.number === number) || null;
}

function formatPhoneNumber(value) {
    const text = String(value || '');
    if (!text) return '输入号码';
    return text.replace(/(.{3})/g, '$1 ').trim();
}

function formatPhoneTime(value) {
    const date = new Date(Number(value) || Date.now());
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function renderPhoneNumber() {
    const display = document.getElementById('phone-number');
    if (display) display.textContent = formatPhoneNumber(phoneNumber);
}

function renderPhoneLists() {
    const recentList = document.getElementById('phone-recent-list');
    const contactList = document.getElementById('phone-contact-list');
    if (recentList) {
        recentList.innerHTML = phoneRecents.length
            ? phoneRecents.slice(0, 10).map(item => {
                const contact = getPhoneContact(item.number);
                const label = contact?.name || item.number;
                return `
                    <button class="phone-row interactive" type="button" data-phone-call="${escapePhoneHtml(item.number)}">
                        <span class="phone-face">${escapePhoneHtml(label.slice(0, 1).toUpperCase())}</span>
                        <span><strong>${escapePhoneHtml(label)}</strong><span>${escapePhoneHtml(item.number)}</span></span>
                        <small>${escapePhoneHtml(formatPhoneTime(item.calledAt))}</small>
                    </button>
                `;
            }).join('')
            : '<div class="phone-empty"><span><strong>暂无通话</strong><span>这里还没有记录。</span></span></div>';
    }
    if (contactList) {
        contactList.innerHTML = PHONE_CONTACTS.map(contact => `
            <button class="phone-row interactive" type="button" data-phone-call="${escapePhoneHtml(contact.number)}">
                <span class="phone-face">${escapePhoneHtml(contact.name.slice(0, 1).toUpperCase())}</span>
                <span><strong>${escapePhoneHtml(contact.name)}</strong><span>${escapePhoneHtml(contact.note)}</span></span>
                <small>${escapePhoneHtml(contact.number)}</small>
            </button>
        `).join('');
    }
}

function renderPhoneVoicemail() {
    const voicemailList = document.getElementById('phone-voicemail-list');
    if (!voicemailList) return;
    voicemailList.innerHTML = PHONE_VOICEMAILS.length
        ? PHONE_VOICEMAILS.map(item => `
            <div class="phone-row phone-voice-row">
                <span class="phone-face">${escapePhoneHtml(item.name.slice(0, 1).toUpperCase())}</span>
                <span>
                    <strong>${escapePhoneHtml(item.name)}</strong>
                    <span class="phone-voice-meta">
                        <span>${escapePhoneHtml(item.note)}</span>
                        <span>${escapePhoneHtml(item.time)}</span>
                        <span>${escapePhoneHtml(item.duration)}</span>
                    </span>
                </span>
                <button class="phone-voice-action interactive" type="button" data-phone-call="${escapePhoneHtml(item.number)}" aria-label="回拨 ${escapePhoneHtml(item.name)}">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.62a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.84.29 1.72.5 2.62.62A2 2 0 0 1 22 16.92z"/></svg>
                </button>
            </div>
        `).join('')
        : '<div class="phone-empty"><span><strong>暂无留言</strong><span>这里还没有留言。</span></span></div>';
}

function setPhonePage(page) {
    const nextPage = PHONE_PAGES[page] ? page : 'recent';
    activePhonePage = nextPage;
    document.querySelectorAll('[data-phone-page]').forEach(section => {
        const isActive = section.getAttribute('data-phone-page') === nextPage;
        section.hidden = !isActive;
        section.classList.toggle('active', isActive);
    });
    document.querySelectorAll('[data-phone-tab]').forEach(tab => {
        const isActive = tab.getAttribute('data-phone-tab') === nextPage;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    const note = document.getElementById('phone-note');
    if (note) note.textContent = PHONE_PAGES[nextPage].note;
    const stage = document.getElementById('phone-stage');
    if (stage) stage.scrollTop = 0;
    if (nextPage === 'dial') renderPhoneNumber();
}

function setPhoneNumber(value) {
    phoneNumber = String(value || '').slice(0, 24);
    renderPhoneNumber();
}

function startPhoneCall(number) {
    const clean = String(number || phoneNumber || '').trim();
    if (!clean) return;
    const contact = getPhoneContact(clean);
    const label = contact?.name || clean;
    document.getElementById('phone-call-name').textContent = label;
    document.getElementById('phone-call-number').textContent = clean;
    document.getElementById('phone-call-sheet').hidden = false;
    phoneRecents = [{ number: clean, calledAt: Date.now() }, ...phoneRecents.filter(item => item.number !== clean)].slice(0, 24);
    writePhoneRecents();
    renderPhoneLists();
}

function endPhoneCall() {
    const sheet = document.getElementById('phone-call-sheet');
    if (sheet) sheet.hidden = true;
}

function getPhoneApp() {
    return document.getElementById('phone-app');
}

async function openPhoneApp() {
    const app = getPhoneApp();
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
    if (typeof closeGuideApp === 'function') closeGuideApp(true);
    if (typeof closeZhenxuanApp === 'function') closeZhenxuanApp(true);
    await hydratePhoneRecents();
    document.body.classList.add('phone-open');
    app.classList.add('active');
}

function closePhoneApp(instant = false) {
    const app = getPhoneApp();
    if (!app) return;
    endPhoneCall();
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
    document.body.classList.remove('phone-open');
}

function bindPhoneEvents() {
    const app = getPhoneApp();
    if (!app || phoneEventsBound) return;
    phoneEventsBound = true;
    void hydratePhoneRecents();
    document.getElementById('phone-close-title')?.addEventListener('click', event => {
        event.preventDefault();
        closePhoneApp();
    });
    document.getElementById('phone-clear-number')?.addEventListener('click', event => {
        event.preventDefault();
        setPhonePage('dial');
        setPhoneNumber('');
    });
    document.getElementById('phone-delete-number')?.addEventListener('click', event => {
        event.preventDefault();
        setPhoneNumber(phoneNumber.slice(0, -1));
    });
    document.getElementById('phone-call-button')?.addEventListener('click', event => {
        event.preventDefault();
        startPhoneCall();
    });
    document.getElementById('phone-end-call')?.addEventListener('click', event => {
        event.preventDefault();
        endPhoneCall();
    });
    document.getElementById('phone-call-sheet')?.addEventListener('click', event => {
        if (event.target === event.currentTarget) endPhoneCall();
    });
    app.addEventListener('click', event => {
        const target = event.target instanceof Element ? event.target : event.target?.parentElement;
        const tab = target?.closest('[data-phone-tab]');
        if (tab) {
            event.preventDefault();
            setPhonePage(tab.getAttribute('data-phone-tab') || 'recent');
            return;
        }
        const key = target?.closest('[data-phone-key]');
        if (key) {
            event.preventDefault();
            setPhoneNumber(phoneNumber + (key.getAttribute('data-phone-key') || ''));
            return;
        }
        const call = target?.closest('[data-phone-call]');
        if (call) {
            event.preventDefault();
            const number = call.getAttribute('data-phone-call') || '';
            setPhoneNumber(number);
            startPhoneCall(number);
        }
    });
    app.addEventListener('keydown', event => {
        const target = event.target instanceof Element ? event.target : event.target?.parentElement;
        const tab = target?.closest('[data-phone-tab]');
        if (tab && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            setPhonePage(tab.getAttribute('data-phone-tab') || 'recent');
        }
    });
    app.addEventListener('touchstart', event => event.stopPropagation(), { passive: true });
    app.addEventListener('mousedown', event => event.stopPropagation());
}

bindPhoneEvents();

document.querySelector('.home-indicator')?.addEventListener('click', () => {
    if (getPhoneApp()?.classList.contains('active')) closePhoneApp(true);
});

document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && getPhoneApp()?.classList.contains('active')) closePhoneApp();
});

window.openPhoneApp = openPhoneApp;
window.closePhoneApp = closePhoneApp;
