const WANYE_STORAGE_KEY = 'rinno_wanye_records_v1';
let wanyeRecords = [];
let wanyeEventsBound = false;

function createWanyeDefaultRecords() {
    return [
        {
            id: 'wanye-seed-1',
            date: '2026-04-23',
            partner: '恋人',
            mood: '温柔',
            consent: true,
            protection: true,
            aftercare: true,
            note: '边界确认清楚，事后一起喝水聊天。'
        }
    ];
}

function parseWanyeRecordsContent(content) {
    if (!content || typeof content !== 'string') return createWanyeDefaultRecords();
    try {
        const parsed = JSON.parse(content);
        return Array.isArray(parsed) && parsed.length ? parsed : createWanyeDefaultRecords();
    } catch (error) {
        return createWanyeDefaultRecords();
    }
}

function readLegacyWanyeRecords() {
    try {
        return parseWanyeRecordsContent(localStorage.getItem(WANYE_STORAGE_KEY) || '[]');
    } catch (error) {
        return createWanyeDefaultRecords();
    }
}

async function readWanyeRecords() {
    try {
        if (typeof db !== 'undefined' && db?.edits?.get) {
            const saved = await db.edits.get(WANYE_STORAGE_KEY);
            if (saved?.content) return parseWanyeRecordsContent(saved.content);
        }
    } catch (error) {
        console.warn('Wanye Dexie read failed:', error);
    }
    const legacy = readLegacyWanyeRecords();
    if (legacy.length) void persistWanyeRecords(legacy);
    return legacy;
}

function writeWanyeRecords() {
    try {
        void persistWanyeRecords(wanyeRecords);
    } catch (error) {
        console.warn('晚契记录保存失败:', error);
    }
}

async function hydrateWanyeRecords() {
    wanyeRecords = await readWanyeRecords();
    renderWanyeRecords();
    return wanyeRecords;
}

async function persistWanyeRecords(snapshot) {
    try {
        if (typeof db !== 'undefined' && db?.edits?.put) {
            await db.edits.put({
                id: WANYE_STORAGE_KEY,
                content: JSON.stringify(Array.isArray(snapshot) ? snapshot : []),
                type: 'wanye-records'
            });
        }
    } catch (error) {
        console.warn('Wanye Dexie save failed:', error);
    }
    try {
        localStorage.removeItem(WANYE_STORAGE_KEY);
    } catch (error) {
        // Ignore legacy cleanup failures.
    }
}

function writeWanyeRecords() {
    void persistWanyeRecords(wanyeRecords);
}

function formatWanyeDate(value) {
    if (!value) return '--';
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return `${date.getMonth() + 1}.${String(date.getDate()).padStart(2, '0')}`;
}

function escapeWanyeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function renderWanyeRecords() {
    const sorted = wanyeRecords.slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    const list = document.getElementById('wanye-record-list');
    const safeCount = wanyeRecords.filter(item => item.consent && item.protection).length;
    const latest = sorted[0]?.date || '';
    const total = document.getElementById('wanye-total-count');
    const latestEl = document.getElementById('wanye-latest-date');
    const safe = document.getElementById('wanye-safe-count');
    if (total) total.textContent = String(wanyeRecords.length);
    if (latestEl) latestEl.textContent = formatWanyeDate(latest);
    if (safe) safe.textContent = String(safeCount);
    if (!list) return;

    if (!sorted.length) {
        list.innerHTML = '<article class="wanye-card"><div><h3 class="wanye-card-title">还没有记录</h3><div class="wanye-card-meta">按右上角 + 新增一条晚契。</div></div></article>';
        return;
    }

    list.innerHTML = sorted.map(item => {
        const flags = [
            item.consent ? '双方同意' : '待确认同意',
            item.protection ? '保护措施' : '未记录保护',
            item.aftercare ? '事后照护' : '照护待补'
        ];
        return `
            <article class="wanye-card" data-wanye-id="${escapeWanyeHtml(item.id)}">
                <div>
                    <h3 class="wanye-card-title">${escapeWanyeHtml(item.partner || '未命名关系')}</h3>
                    <div class="wanye-card-meta">${escapeWanyeHtml(formatWanyeDate(item.date))} / ${escapeWanyeHtml(item.mood || '未标记')}</div>
                </div>
                <button class="wanye-delete interactive" type="button" data-wanye-delete="${escapeWanyeHtml(item.id)}" aria-label="删除记录">×</button>
                <div class="wanye-card-flags">${flags.map(flag => `<span>${escapeWanyeHtml(flag)}</span>`).join('')}</div>
                <p class="wanye-card-note">${escapeWanyeHtml(item.note || '没有备注。')}</p>
            </article>
        `;
    }).join('');
}

function openWanyeModal() {
    const modal = document.getElementById('wanye-modal');
    const date = document.getElementById('wanye-date');
    if (date && !date.value) date.value = new Date().toISOString().slice(0, 10);
    if (modal) modal.hidden = false;
}

function closeWanyeModal() {
    const modal = document.getElementById('wanye-modal');
    const form = document.getElementById('wanye-form');
    if (modal) modal.hidden = true;
    form?.reset();
}

function saveWanyeRecord(event) {
    event.preventDefault();
    const date = document.getElementById('wanye-date')?.value || new Date().toISOString().slice(0, 10);
    const record = {
        id: `wanye-${Date.now().toString(36)}`,
        date,
        partner: document.getElementById('wanye-partner')?.value.trim() || '亲密关系',
        mood: document.getElementById('wanye-mood')?.value || '温柔',
        consent: Boolean(document.getElementById('wanye-consent')?.checked),
        protection: Boolean(document.getElementById('wanye-protection')?.checked),
        aftercare: Boolean(document.getElementById('wanye-aftercare')?.checked),
        note: document.getElementById('wanye-note')?.value.trim() || ''
    };
    wanyeRecords = [record, ...wanyeRecords].slice(0, 80);
    writeWanyeRecords();
    renderWanyeRecords();
    closeWanyeModal();
}

function deleteWanyeRecord(id) {
    wanyeRecords = wanyeRecords.filter(item => item.id !== id);
    writeWanyeRecords();
    renderWanyeRecords();
}

function getWanyeApp() {
    return document.getElementById('wanye-app');
}

async function openWanyeApp() {
    const app = getWanyeApp();
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
    if (typeof closeLingguangApp === 'function') closeLingguangApp(true);
    if (typeof closeGuideApp === 'function') closeGuideApp(true);
    if (typeof closePhoneApp === 'function') closePhoneApp(true);
    await hydrateWanyeRecords();
    document.body.classList.add('wanye-open');
    app.classList.add('active');
}

function closeWanyeApp(instant = false) {
    const app = getWanyeApp();
    if (!app) return;
    closeWanyeModal();
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
    document.body.classList.remove('wanye-open');
}

function bindWanyeAppEvents() {
    const app = getWanyeApp();
    if (!app || wanyeEventsBound) return;
    wanyeEventsBound = true;
    void hydrateWanyeRecords();
    document.getElementById('wanye-close-title')?.addEventListener('click', event => {
        event.preventDefault();
        closeWanyeApp();
    });
    document.getElementById('wanye-add-record')?.addEventListener('click', event => {
        event.preventDefault();
        openWanyeModal();
    });
    document.getElementById('wanye-cancel')?.addEventListener('click', event => {
        event.preventDefault();
        closeWanyeModal();
    });
    document.getElementById('wanye-form')?.addEventListener('submit', saveWanyeRecord);
    document.getElementById('wanye-modal')?.addEventListener('click', event => {
        if (event.target === event.currentTarget) closeWanyeModal();
    });
    app.addEventListener('click', event => {
        const button = event.target instanceof Element ? event.target.closest('[data-wanye-delete]') : null;
        if (!button) return;
        event.preventDefault();
        deleteWanyeRecord(button.getAttribute('data-wanye-delete') || '');
    });
    app.addEventListener('touchstart', event => event.stopPropagation(), { passive: true });
    app.addEventListener('mousedown', event => event.stopPropagation());
}

bindWanyeAppEvents();

document.querySelector('.home-indicator')?.addEventListener('click', () => {
    if (getWanyeApp()?.classList.contains('active')) closeWanyeApp(true);
});

document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && getWanyeApp()?.classList.contains('active')) closeWanyeApp();
});

window.openWanyeApp = openWanyeApp;
window.closeWanyeApp = closeWanyeApp;
