const LINGGUANG_STORAGE_KEY = 'rinno_lingguang_state_v1';
let lingguangItems = [];
let lingguangFilter = 'all';
let lingguangEventsBound = false;

const LINGGUANG_TONES = {
    dawn: '晨金',
    sage: '羽绿',
    lake: '湖蓝',
    rose: '玫瑰'
};

function createLingguangDefaults() {
    return [
        { id: 'ling-1', text: '把桌面封面整理成独立可重置的入口。', tone: 'sage', createdAt: Date.now() - 3600000 },
        { id: 'ling-2', text: '图标像薄玻璃里的一点光，不要太吵。', tone: 'lake', createdAt: Date.now() - 7200000 }
    ];
}

function parseLingguangItemsContent(content) {
    if (!content || typeof content !== 'string') return createLingguangDefaults();
    try {
        const parsed = JSON.parse(content);
        return Array.isArray(parsed) && parsed.length ? parsed : createLingguangDefaults();
    } catch (error) {
        return createLingguangDefaults();
    }
}

function readLegacyLingguangItems() {
    try {
        return parseLingguangItemsContent(localStorage.getItem(LINGGUANG_STORAGE_KEY) || '[]');
    } catch (error) {
        return createLingguangDefaults();
    }
}

async function readLingguangItems() {
    try {
        if (typeof db !== 'undefined' && db?.edits?.get) {
            const saved = await db.edits.get(LINGGUANG_STORAGE_KEY);
            if (saved?.content) return parseLingguangItemsContent(saved.content);
        }
    } catch (error) {
        console.warn('Lingguang Dexie read failed:', error);
    }
    const legacy = readLegacyLingguangItems();
    if (legacy.length) void persistLingguangItems(legacy);
    return legacy;
}

function writeLingguangItems() {
    try {
        void persistLingguangItems(lingguangItems);
    } catch (error) {
        console.warn('翎光保存失败:', error);
    }
}

function escapeLingguangHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatLingguangTime(value) {
    const date = new Date(Number(value) || Date.now());
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function setLingguangOrbTone(tone) {
    const orb = document.getElementById('lingguang-orb');
    if (orb) orb.dataset.tone = tone || 'sage';
}

async function hydrateLingguangItems() {
    lingguangItems = await readLingguangItems();
    renderLingguangItems();
    return lingguangItems;
}

async function persistLingguangItems(snapshot) {
    try {
        if (typeof db !== 'undefined' && db?.edits?.put) {
            await db.edits.put({
                id: LINGGUANG_STORAGE_KEY,
                content: JSON.stringify(Array.isArray(snapshot) ? snapshot : []),
                type: 'lingguang-items'
            });
        }
    } catch (error) {
        console.warn('Lingguang Dexie save failed:', error);
    }
    try {
        localStorage.removeItem(LINGGUANG_STORAGE_KEY);
    } catch (error) {
        // Ignore legacy cleanup failures.
    }
}

function writeLingguangItems() {
    void persistLingguangItems(lingguangItems);
}

function renderLingguangItems() {
    const list = document.getElementById('lingguang-list');
    if (!list) return;
    document.querySelectorAll('[data-lingguang-filter]').forEach(button => {
        const active = button.getAttribute('data-lingguang-filter') === lingguangFilter;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    const visible = lingguangItems
        .filter(item => lingguangFilter === 'all' || item.tone === lingguangFilter)
        .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
    if (!visible.length) {
        list.innerHTML = '<article class="lingguang-card"><span class="lingguang-card-mark"></span><div><h3>这里暂时没有光点</h3><p>换一个光色，或者收纳一句新的。</p></div></article>';
        return;
    }
    list.innerHTML = visible.map(item => `
        <article class="lingguang-card" data-tone="${escapeLingguangHtml(item.tone)}">
            <span class="lingguang-card-mark" aria-hidden="true"></span>
            <div>
                <h3>${escapeLingguangHtml(item.text || '未命名光点')}</h3>
                <p>${escapeLingguangHtml(LINGGUANG_TONES[item.tone] || '光点')} / ${escapeLingguangHtml(formatLingguangTime(item.createdAt))}</p>
            </div>
            <button class="lingguang-delete interactive" type="button" data-lingguang-delete="${escapeLingguangHtml(item.id)}" aria-label="删除光点">×</button>
        </article>
    `).join('');
}

function addLingguangItem(event) {
    event.preventDefault();
    const input = document.getElementById('lingguang-text');
    const tone = document.getElementById('lingguang-tone')?.value || 'sage';
    const text = input?.value.trim() || '';
    if (!text) return;
    lingguangItems = [{ id: `ling-${Date.now().toString(36)}`, text, tone, createdAt: Date.now() }, ...lingguangItems].slice(0, 60);
    if (input) input.value = '';
    lingguangFilter = 'all';
    setLingguangOrbTone(tone);
    writeLingguangItems();
    renderLingguangItems();
}

function addRandomLingguangItem() {
    const ideas = [
        ['把按钮留给真正的命令。', 'dawn'],
        ['每个封面都应该能自己重置。', 'sage'],
        ['圆角是界面呼吸的节拍。', 'lake'],
        ['把私密入口做得安静一点。', 'rose']
    ];
    const [text, tone] = ideas[Math.floor(Math.random() * ideas.length)];
    lingguangItems = [{ id: `ling-${Date.now().toString(36)}`, text, tone, createdAt: Date.now() }, ...lingguangItems].slice(0, 60);
    lingguangFilter = 'all';
    setLingguangOrbTone(tone);
    writeLingguangItems();
    renderLingguangItems();
}

function deleteLingguangItem(id) {
    lingguangItems = lingguangItems.filter(item => item.id !== id);
    writeLingguangItems();
    renderLingguangItems();
}

function getLingguangApp() {
    return document.getElementById('lingguang-app');
}

async function openLingguangApp() {
    const app = getLingguangApp();
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
    if (typeof closeGuideApp === 'function') closeGuideApp(true);
    if (typeof closePhoneApp === 'function') closePhoneApp(true);
    await hydrateLingguangItems();
    document.body.classList.add('lingguang-open');
    app.classList.add('active');
}

function closeLingguangApp(instant = false) {
    const app = getLingguangApp();
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
    document.body.classList.remove('lingguang-open');
}

function bindLingguangEvents() {
    const app = getLingguangApp();
    if (!app || lingguangEventsBound) return;
    lingguangEventsBound = true;
    void hydrateLingguangItems();
    document.getElementById('lingguang-close-title')?.addEventListener('click', event => {
        event.preventDefault();
        closeLingguangApp();
    });
    document.getElementById('lingguang-form')?.addEventListener('submit', addLingguangItem);
    document.getElementById('lingguang-randomize')?.addEventListener('click', event => {
        event.preventDefault();
        addRandomLingguangItem();
    });
    app.addEventListener('click', event => {
        const target = event.target instanceof Element ? event.target : event.target?.parentElement;
        const filter = target?.closest('[data-lingguang-filter]');
        if (filter) {
            event.preventDefault();
            lingguangFilter = filter.getAttribute('data-lingguang-filter') || 'all';
            renderLingguangItems();
            return;
        }
        const deleteButton = target?.closest('[data-lingguang-delete]');
        if (deleteButton) {
            event.preventDefault();
            deleteLingguangItem(deleteButton.getAttribute('data-lingguang-delete') || '');
        }
    });
    app.addEventListener('touchstart', event => event.stopPropagation(), { passive: true });
    app.addEventListener('mousedown', event => event.stopPropagation());
}

bindLingguangEvents();

document.querySelector('.home-indicator')?.addEventListener('click', () => {
    if (getLingguangApp()?.classList.contains('active')) closeLingguangApp(true);
});

document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && getLingguangApp()?.classList.contains('active')) closeLingguangApp();
});

window.openLingguangApp = openLingguangApp;
window.closeLingguangApp = closeLingguangApp;
