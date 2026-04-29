function createDefaultPrologueState() {
    return { groups: [] };
}

function createPrologueId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function normalizePrologueEntries(value) {
    const entries = Array.isArray(value) ? value : [];
    return entries
        .filter(item => item && typeof item === 'object')
        .map(item => ({
            id: String(item.id || createPrologueId('entry')),
            scope: item.scope === 'extension' ? 'extension' : 'global',
            activation: item.activation === 'keyword' ? 'keyword' : 'always',
            keywords: String(item.keywords || '').slice(0, 120),
            position: ['before', 'middle', 'after'].includes(item.position) ? item.position : 'before',
            content: String(item.content || ''),
            createdAt: String(item.createdAt || new Date().toISOString()),
            updatedAt: String(item.updatedAt || item.createdAt || new Date().toISOString())
        }))
        .filter(entry => entry.content.trim())
        .slice(0, 120);
}

function normalizePrologueState(content) {
    const stored = parseStoredJson(content);
    const groups = Array.isArray(stored.groups) ? stored.groups : [];
    return {
        groups: groups
            .filter(group => group && typeof group === 'object')
            .map((group, index) => {
                const name = String(group.name || group.title || `词条分组 ${index + 1}`).trim().slice(0, 24);
                return {
                    id: String(group.id || createPrologueId('group')),
                    name: name || `词条分组 ${index + 1}`,
                    entries: normalizePrologueEntries(group.entries),
                    createdAt: String(group.createdAt || new Date().toISOString()),
                    updatedAt: String(group.updatedAt || group.createdAt || new Date().toISOString())
                };
            })
            .slice(0, 60)
    };
}

async function loadPrologueState() {
    try {
        const saved = await db.edits.get(PROLOGUE_STATE_ID);
        if (saved) prologueState = normalizePrologueState(saved.content);
    } catch (e) {
        console.error('序章状态加载失败:', e);
    }
    renderPrologueState();
}

async function savePrologueState() {
    try {
        await db.edits.put({
            id: PROLOGUE_STATE_ID,
            content: JSON.stringify(prologueState),
            type: 'prologue'
        });
    } catch (e) {
        console.error('序章状态保存失败:', e);
    }
}

function escapePrologueHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));
}

function getPrologueGroup(id = currentPrologueGroupId) {
    return prologueState.groups.find(group => group.id === id) || null;
}

function countPrologueEntries() {
    return prologueState.groups.reduce((total, group) => total + normalizePrologueEntries(group.entries).length, 0);
}

function getPrologueScopeLabel(scope) {
    return scope === 'extension' ? '拓展' : '全局';
}

function getPrologueActivationLabel(activation) {
    return activation === 'keyword' ? '关键词生效' : '始终生效';
}

function getProloguePositionLabel(position) {
    if (position === 'middle') return '中';
    if (position === 'after') return '后';
    return '前';
}

function getPrologueEntryTitle(entry) {
    const compact = String(entry.content || '').split(/\n+/).map(line => line.trim()).find(Boolean) || '未命名词条';
    return compact.length > 24 ? `${compact.slice(0, 24)}…` : compact;
}

function getPrologueEntryPreview(entry) {
    const compact = String(entry.content || '').replace(/\s+/g, ' ').trim();
    if (!compact) return '点击编辑此词条';
    return compact.length > 72 ? `${compact.slice(0, 72)}…` : compact;
}

function setPrologueMessage(id, text, type = '') {
    const message = document.getElementById(id);
    if (!message) return;
    message.textContent = text;
    message.classList.remove('error', 'success');
    if (type) message.classList.add(type);
}

function showPrologueToast(text, duration = 2600) {
    const toast = document.getElementById('prologue-system-toast');
    const toastText = document.getElementById('prologue-system-toast-text');
    if (!toast || !toastText || !text) return;
    if (toast.parentElement !== document.body) document.body.appendChild(toast);
    toastText.textContent = text;
    toast.hidden = false;
    window.clearTimeout(prologueToastTimer);
    requestAnimationFrame(() => toast.classList.add('active'));
    prologueToastTimer = window.setTimeout(() => {
        toast.classList.remove('active');
        window.setTimeout(() => {
            if (!toast.classList.contains('active')) toast.hidden = true;
        }, 240);
    }, duration);
}

function hidePrologueToast(instant = false) {
    const toast = document.getElementById('prologue-system-toast');
    if (!toast) return;
    window.clearTimeout(prologueToastTimer);
    toast.classList.remove('active');
    if (instant) {
        toast.hidden = true;
        return;
    }
    window.setTimeout(() => {
        if (!toast.classList.contains('active')) toast.hidden = true;
    }, 240);
}

function setPrologueView(name) {
    const nextView = ['home', 'entries', 'edit'].includes(name) ? name : 'home';
    const views = {
        home: document.getElementById('prologue-home-view'),
        entries: document.getElementById('prologue-group-view'),
        edit: document.getElementById('prologue-entry-edit-view')
    };
    Object.entries(views).forEach(([key, view]) => {
        if (!view) return;
        const active = key === nextView;
        view.hidden = !active;
        view.classList.toggle('active', active);
    });
    currentPrologueView = nextView;
    const app = document.getElementById('prologue-app');
    if (app) {
        app.dataset.prologueView = nextView;
        app.scrollTop = 0;
    }
}

function renderPrologueHome() {
    const groups = prologueState.groups;
    const groupList = document.getElementById('prologue-group-list');
    const groupCount = document.getElementById('prologue-group-count');
    const homeStat = document.getElementById('prologue-home-stat');
    const entryTotal = countPrologueEntries();

    if (groupCount) groupCount.textContent = `${groups.length} groups`;
    if (homeStat) homeStat.textContent = `${groups.length} GROUPS / ${entryTotal} ENTRIES`;
    if (!groupList) return;

    if (!groups.length) {
        groupList.innerHTML = '<div class="prologue-empty">世界观目录还空着。</div>';
        return;
    }

    groupList.innerHTML = groups.map((group, index) => {
        const entryCount = normalizePrologueEntries(group.entries).length;
        return `
            <button class="prologue-group-card interactive" type="button" data-prologue-group="${escapePrologueHtml(group.id)}">
                <span class="prologue-card-index">${String(index + 1).padStart(2, '0')}</span>
                <span>
                    <span class="prologue-group-title">${escapePrologueHtml(group.name)}</span>
                    <span class="prologue-group-sub">${entryCount} 条词条 · 世界观册页</span>
                </span>
                <span class="prologue-group-arrow" aria-hidden="true">›</span>
            </button>
        `;
    }).join('');
}

function renderPrologueEntries() {
    const group = getPrologueGroup();
    const title = document.getElementById('prologue-group-title');
    const note = document.getElementById('prologue-group-note');
    const count = document.getElementById('prologue-entry-count');
    const list = document.getElementById('prologue-entry-list');

    if (!group) {
        if (title) title.textContent = '未命名分组';
        if (note) note.textContent = '0 条词条';
        if (count) count.textContent = '0 entries';
        if (list) list.innerHTML = '<div class="prologue-empty">未选择词条分组。</div>';
        return;
    }

    group.entries = normalizePrologueEntries(group.entries);
    if (title) title.textContent = group.name;
    if (note) note.textContent = `${group.entries.length} 条词条`;
    if (count) count.textContent = `${group.entries.length} entries`;
    if (!list) return;

    if (!group.entries.length) {
        list.innerHTML = '<div class="prologue-empty">这个分组还没有词条。</div>';
        return;
    }

    list.innerHTML = group.entries.map(entry => {
        const keywordBadge = entry.activation === 'keyword' && entry.keywords
            ? `<span class="prologue-badge">关键词：${escapePrologueHtml(entry.keywords)}</span>`
            : '';
        return `
            <button class="prologue-entry-card interactive" type="button" data-prologue-entry="${escapePrologueHtml(entry.id)}">
                <span class="prologue-entry-meta">
                    <span class="prologue-badge">${escapePrologueHtml(getPrologueScopeLabel(entry.scope))}</span>
                    <span class="prologue-badge">${escapePrologueHtml(getPrologueActivationLabel(entry.activation))}</span>
                    <span class="prologue-badge">注入：${escapePrologueHtml(getProloguePositionLabel(entry.position))}</span>
                    ${keywordBadge}
                </span>
                <span>
                    <span class="prologue-entry-title">${escapePrologueHtml(getPrologueEntryTitle(entry))}</span>
                    <span class="prologue-entry-preview">${escapePrologueHtml(getPrologueEntryPreview(entry))}</span>
                </span>
            </button>
        `;
    }).join('');
}

function renderPrologueState() {
    prologueState = normalizePrologueState(prologueState);
    if (currentPrologueGroupId && !getPrologueGroup()) currentPrologueGroupId = '';
    renderPrologueHome();
    renderPrologueEntries();
}

function setPrologueChoice(attr, value) {
    document.querySelectorAll(`[${attr}]`).forEach(button => {
        const active = button.getAttribute(attr) === value;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
    });
}

function getPrologueChoice(attr, fallback) {
    return document.querySelector(`[${attr}].active`)?.getAttribute(attr) || fallback;
}

function setPrologueScope(scope) {
    setPrologueChoice('data-prologue-scope', scope === 'extension' ? 'extension' : 'global');
}

function setPrologueActivation(activation) {
    const next = activation === 'keyword' ? 'keyword' : 'always';
    setPrologueChoice('data-prologue-activation', next);
    const keywordField = document.getElementById('prologue-keyword-field');
    const keywordInput = document.getElementById('prologue-entry-keywords');
    if (keywordField) keywordField.hidden = next !== 'keyword';
    if (next !== 'keyword' && keywordInput) keywordInput.value = '';
}

function setProloguePosition(position) {
    setPrologueChoice('data-prologue-position', ['middle', 'after'].includes(position) ? position : 'before');
}

function openPrologueGroupModal() {
    const modal = document.getElementById('prologue-group-modal');
    const input = document.getElementById('prologue-group-name');
    if (!modal || !input) return;
    if (modal.parentElement !== document.getElementById('prologue-app')) {
        document.getElementById('prologue-app')?.appendChild(modal);
    }
    input.value = '';
    setPrologueMessage('prologue-group-message', '');
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('active'));
    window.setTimeout(() => input.focus(), 80);
}

function closePrologueGroupModal() {
    const modal = document.getElementById('prologue-group-modal');
    if (!modal) return;
    modal.classList.remove('active');
    window.setTimeout(() => {
        if (!modal.classList.contains('active')) modal.hidden = true;
    }, 180);
}

function updatePrologueEntryFormMode(isEditing) {
    const title = document.getElementById('prologue-entry-form-title');
    const editorTitle = document.getElementById('prologue-entry-editor-title');
    const editorNote = document.getElementById('prologue-entry-editor-note');
    const deleteButton = document.getElementById('prologue-entry-delete');
    const actions = document.querySelector('#prologue-entry-form .prologue-form-actions');
    if (title) title.textContent = isEditing ? '编辑词条' : '添加词条';
    if (editorTitle) editorTitle.textContent = isEditing ? '编辑词条' : '添加词条';
    if (editorNote) editorNote.textContent = isEditing ? '修改已保存的词条内容' : '写入会注入世界观的词条内容';
    if (deleteButton) deleteButton.hidden = !isEditing;
    actions?.classList.toggle('single', !isEditing);
}

function resetPrologueEntryForm() {
    const idInput = document.getElementById('prologue-entry-id');
    const keywords = document.getElementById('prologue-entry-keywords');
    const content = document.getElementById('prologue-entry-content');
    if (idInput) idInput.value = '';
    if (keywords) keywords.value = '';
    if (content) content.value = '';
    setPrologueScope('global');
    setPrologueActivation('always');
    setProloguePosition('before');
    updatePrologueEntryFormMode(false);
    setPrologueMessage('prologue-entry-message', '');
}

function openPrologueEntryEditor() {
    if (!getPrologueGroup()) {
        showPrologueToast('请先选择词条分组。');
        return;
    }
    resetPrologueEntryForm();
    setPrologueView('edit');
    window.setTimeout(() => document.getElementById('prologue-entry-content')?.focus(), 80);
}

function startPrologueEntryEdit(entryId) {
    const group = getPrologueGroup();
    const entry = group?.entries.find(item => item.id === entryId);
    if (!entry) return;
    document.getElementById('prologue-entry-id').value = entry.id;
    document.getElementById('prologue-entry-keywords').value = entry.keywords || '';
    document.getElementById('prologue-entry-content').value = entry.content || '';
    setPrologueScope(entry.scope);
    setPrologueActivation(entry.activation);
    if (entry.activation === 'keyword') {
        const keywordInput = document.getElementById('prologue-entry-keywords');
        if (keywordInput) keywordInput.value = entry.keywords || '';
    }
    setProloguePosition(entry.position);
    updatePrologueEntryFormMode(true);
    setPrologueMessage('prologue-entry-message', '');
    setPrologueView('edit');
}

async function createPrologueGroup(event) {
    event.preventDefault();
    const input = document.getElementById('prologue-group-name');
    const name = input?.value.trim().replace(/\s+/g, ' ') || '';
    if (!name) {
        setPrologueMessage('prologue-group-message', '请先写下分组名称。', 'error');
        input?.focus();
        return;
    }
    if (prologueState.groups.some(group => group.name === name)) {
        setPrologueMessage('prologue-group-message', '已有同名分组。', 'error');
        input?.focus();
        return;
    }
    const group = {
        id: createPrologueId('group'),
        name: name.slice(0, 24),
        entries: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    prologueState.groups = [group, ...prologueState.groups].slice(0, 60);
    currentPrologueGroupId = '';
    if (input) input.value = '';
    await savePrologueState();
    renderPrologueState();
    resetPrologueEntryForm();
    setPrologueView('home');
    closePrologueGroupModal();
    showPrologueToast('词条分组已新建。');
}

function openPrologueGroup(groupId) {
    const group = getPrologueGroup(groupId);
    if (!group) return;
    currentPrologueGroupId = group.id;
    renderPrologueState();
    resetPrologueEntryForm();
    setPrologueView('entries');
}

async function savePrologueEntry(event) {
    event.preventDefault();
    const group = getPrologueGroup();
    if (!group) {
        setPrologueMessage('prologue-entry-message', '请先选择词条分组。', 'error');
        return;
    }

    const idInput = document.getElementById('prologue-entry-id');
    const contentInput = document.getElementById('prologue-entry-content');
    const keywordsInput = document.getElementById('prologue-entry-keywords');
    const content = contentInput?.value.trim() || '';
    const scope = getPrologueChoice('data-prologue-scope', 'global');
    const activation = getPrologueChoice('data-prologue-activation', 'always');
    const position = getPrologueChoice('data-prologue-position', 'before');
    const keywords = activation === 'keyword' ? (keywordsInput?.value.trim().replace(/\s*[,，]\s*/g, '，') || '') : '';

    if (!content) {
        setPrologueMessage('prologue-entry-message', '词条内容不能为空。', 'error');
        contentInput?.focus();
        return;
    }
    if (activation === 'keyword' && !keywords) {
        setPrologueMessage('prologue-entry-message', '关键词生效需要填写关键词。', 'error');
        keywordsInput?.focus();
        return;
    }

    const now = new Date().toISOString();
    const editingId = idInput?.value || '';
    const nextEntry = {
        id: editingId || createPrologueId('entry'),
        scope,
        activation,
        keywords,
        position,
        content,
        createdAt: now,
        updatedAt: now
    };

    const existingIndex = group.entries.findIndex(entry => entry.id === editingId);
    if (existingIndex >= 0) {
        nextEntry.createdAt = group.entries[existingIndex].createdAt || now;
        group.entries.splice(existingIndex, 1, nextEntry);
    } else {
        group.entries.unshift(nextEntry);
    }
    group.updatedAt = now;

    await savePrologueState();
    renderPrologueState();
    resetPrologueEntryForm();
    setPrologueView('entries');
    showPrologueToast(existingIndex >= 0 ? '词条已更新。' : '词条已保存。');
}

async function deletePrologueEntry() {
    const group = getPrologueGroup();
    const entryId = document.getElementById('prologue-entry-id')?.value || '';
    if (!group || !entryId) return;
    if (!window.confirm('删除这个词条？')) return;
    group.entries = group.entries.filter(entry => entry.id !== entryId);
    group.updatedAt = new Date().toISOString();
    await savePrologueState();
    renderPrologueState();
    resetPrologueEntryForm();
    setPrologueView('entries');
    showPrologueToast('词条已删除。');
}

function handlePrologueBack() {
    setPrologueView('home');
    currentPrologueGroupId = '';
    resetPrologueEntryForm();
    renderPrologueState();
}

function handlePrologueEntryBack() {
    resetPrologueEntryForm();
    setPrologueView('entries');
    renderPrologueState();
}

async function openPrologueApp() {
    const prologueApp = document.getElementById('prologue-app');
    if (!prologueApp) return;
    document.body.classList.remove('edit-mode');
    closeSettingsApp(true);
    closeLetterApp(true);
    closePrivateApp(true);
    closeStyleApp(true);
    document.body.classList.add('prologue-open');
    prologueApp.classList.add('active');
    currentPrologueGroupId = '';
    setPrologueView('home');
    renderPrologueState();
    Promise.resolve(prologueStateReady)
        .then(() => {
            if (!prologueApp.classList.contains('active')) return;
            currentPrologueGroupId = '';
            setPrologueView('home');
            renderPrologueState();
        })
        .catch(error => console.error('序章状态加载失败:', error));
}

function closePrologueApp(instant = false) {
    const prologueApp = document.getElementById('prologue-app');
    hidePrologueToast(true);
    closePrologueGroupModal();
    if (prologueApp) {
        if (instant) {
            const previousTransition = prologueApp.style.transition;
            prologueApp.style.transition = 'none';
            prologueApp.classList.remove('active');
            prologueApp.offsetHeight;
            requestAnimationFrame(() => {
                prologueApp.style.transition = previousTransition;
            });
        } else {
            prologueApp.classList.remove('active');
        }
    }
    document.body.classList.remove('prologue-open');
}
