// --- 独立设置应用页逻辑 ---
function normalizePasscodeInput(value) {
    return String(value || '').replace(/\D/g, '').slice(0, PASSCODE_LENGTH);
}

function coerceSecuritySettings(value) {
    const stored = parseStoredJson(value);
    const passcode = normalizePasscodeInput(stored.passcode);
    return {
        lockEnabled: Boolean(stored.lockEnabled && passcode.length === PASSCODE_LENGTH),
        passcode
    };
}

function applyLockScreenSecurity() {
    const lock = document.getElementById('lock-screen');
    if (!lock) return;
    lock.classList.toggle('unlocked', !securityState.lockEnabled);
}

async function loadSecuritySettings() {
    try {
        if (typeof db !== 'undefined' && db?.edits?.get) {
            const saved = await db.edits.get(SECURITY_SETTINGS_ID);
            if (saved) securityState = coerceSecuritySettings(saved.content);
        }
    } catch (error) {
        console.error('Security settings load failed:', error);
    }
    applyLockScreenSecurity();
    renderSecuritySettings();
}

async function saveSecuritySettings() {
    try {
        if (typeof db !== 'undefined' && db?.edits?.put) {
            await db.edits.put({
                id: SECURITY_SETTINGS_ID,
                content: JSON.stringify(securityState),
                type: 'security-settings'
            });
        }
    } catch (error) {
        console.error('Security settings save failed:', error);
    }
}

async function setLockEnabled(enabled, message = '') {
    securityState.lockEnabled = Boolean(enabled && securityState.passcode.length === PASSCODE_LENGTH);
    applyLockScreenSecurity();
    await saveSecuritySettings();
    resetSecurityPasscodeForm();
    renderSecuritySettings();
    if (message) showSecurityMessage(message, securityState.lockEnabled ? 'success' : '');
}

function formatSettingsAccountText(content) {
    const raw = content.replace(/\s+/g, ' ').trim();
    if (!raw) return '@ 账号';
    if (raw.startsWith('@')) {
        const name = raw.slice(1).trim();
        return name ? `@ ${name}` : '@ 账号';
    }
    return `@ ${raw}`;
}

function normalizeSettingsAccount(shouldSave = false) {
    const account = document.getElementById('settings-account');
    if (!account) return;
    const formatted = formatSettingsAccountText(account.textContent);
    if (account.textContent !== formatted) {
        account.textContent = formatted;
        if (shouldSave) saveEdit('settings_account', formatted, 'text');
    }
}

function syncSettingsIdentity() {
    const coverSource = document.querySelector('.info-header-bg');
    const settingsCover = document.getElementById('settings-cover');

    const hasSettingsCover = settingsCover && settingsCover.style.backgroundImage && settingsCover.style.backgroundImage !== 'none';
    if (!hasSettingsCover && coverSource && settingsCover && coverSource.style.backgroundImage) {
        settingsCover.style.backgroundImage = coverSource.style.backgroundImage;
        settingsCover.style.backgroundSize = 'cover';
        settingsCover.style.backgroundPosition = 'center center';
        settingsCover.style.backgroundRepeat = 'no-repeat';
    }
}

function safelyCloseSettingsSiblingApp(closeFn) {
    if (typeof closeFn !== 'function') return;
    try {
        closeFn(true);
    } catch (error) {
        // Sibling app cleanup must not block opening Settings.
    }
}

function resetSettingsViews() {
    const settingsApp = document.getElementById('settings-app');
    const mainView = document.getElementById('settings-main-view');
    settingsApp?.classList.remove('security-view-active', 'api-view-active', 'debug-view-active', 'storage-view-active');
    mainView?.setAttribute('aria-hidden', 'false');
    ['settings-security-view', 'settings-api-view', 'settings-debug-view', 'settings-storage-view'].forEach(id => {
        const view = document.getElementById(id);
        if (!view) return;
        view.classList.remove('active');
        view.hidden = true;
        view.setAttribute('aria-hidden', 'true');
    });
}

function openSettingsApp() {
    const settingsApp = document.getElementById('settings-app');
    if (!settingsApp) return;
    document.body.classList.remove('edit-mode');
    safelyCloseSettingsSiblingApp(typeof closeLetterApp === 'function' ? closeLetterApp : null);
    safelyCloseSettingsSiblingApp(typeof closePrivateApp === 'function' ? closePrivateApp : null);
    safelyCloseSettingsSiblingApp(typeof closePrologueApp === 'function' ? closePrologueApp : null);
    safelyCloseSettingsSiblingApp(typeof closeStyleApp === 'function' ? closeStyleApp : null);
    document.body.classList.add('settings-open');
    settingsApp.classList.add('active');
    resetSettingsViews();
    syncSettingsIdentity();
    normalizeSettingsAccount();
    renderSecuritySettings();
    renderApiSettings();
    renderStorageManager();
}

function closeSettingsApp(instant = false) {
    const settingsApp = document.getElementById('settings-app');
    resetSettingsViews();
    if (settingsApp) {
        if (instant) {
            const previousTransition = settingsApp.style.transition;
            settingsApp.style.transition = 'none';
            settingsApp.classList.remove('active');
            settingsApp.offsetHeight;
            requestAnimationFrame(() => {
                settingsApp.style.transition = previousTransition;
            });
        } else {
            settingsApp.classList.remove('active');
        }
    }
    document.body.classList.remove('settings-open');
}

function renderSecuritySettings() {
    const enabled = securityState.lockEnabled;
    const statusTitle = document.getElementById('security-status-title');
    const statusBadge = document.getElementById('security-status-badge');
    const statusText = document.getElementById('security-status-text');
    const lockSwitch = document.getElementById('security-lock-switch');
    const toggleDesc = document.getElementById('security-toggle-desc');
    const preview = document.getElementById('security-passcode-preview');
    const previewDesc = document.getElementById('security-passcode-desc');
    const actions = document.querySelector('.security-actions');
    const changeButton = document.getElementById('security-change-passcode');
    const disableButton = document.getElementById('security-disable-passcode');
    const currentField = document.getElementById('security-current-field');

    if (statusTitle) statusTitle.textContent = enabled ? '锁屏密码已开启' : '锁屏密码已关闭';
    if (statusBadge) statusBadge.textContent = enabled ? 'ACTIVE' : 'OFF';
    if (statusText) statusText.textContent = enabled ? '进入设备前需要输入 6 位锁屏密码。' : '进入设备时会直接抵达主屏。';
    if (toggleDesc) toggleDesc.textContent = enabled ? '开启后，锁屏会在进入主屏前停留。' : '关闭后，重启页面也会跳过锁屏。';
    if (preview) preview.textContent = enabled ? '••••••' : 'OFF';
    if (previewDesc) previewDesc.textContent = enabled ? '以 6 位数字保存，只在本机浏览器内生效。' : '密码仍可重新开启或改成新的 6 位数字。';
    if (lockSwitch) {
        lockSwitch.classList.toggle('active', enabled);
        lockSwitch.setAttribute('aria-pressed', String(enabled));
    }
    if (actions) actions.classList.toggle('single', !enabled);
    if (changeButton) changeButton.textContent = enabled ? '修改锁屏密码' : '设置新密码';
    if (disableButton) disableButton.hidden = !enabled;
    if (currentField) currentField.hidden = !enabled;
}

function showSecurityMessage(text, type = '') {
    const message = document.getElementById('security-passcode-message');
    if (!message) return;
    message.textContent = text;
    message.classList.remove('error', 'success');
    if (type) message.classList.add(type);
}

function resetSecurityPasscodeForm() {
    const form = document.getElementById('security-passcode-form');
    if (!form) return;
    form.reset();
    form.classList.remove('active');
    showSecurityMessage('');
    renderSecuritySettings();
}

function startSecurityPasscodeEdit() {
    const form = document.getElementById('security-passcode-form');
    if (!form) return;
    form.classList.add('active');
    showSecurityMessage(securityState.lockEnabled ? '先确认当前密码，再写下新的 6 位数字。' : '设置新的 6 位数字后，锁屏密码会重新开启。');
    renderSecuritySettings();

    const focusTarget = securityState.lockEnabled
        ? document.getElementById('security-current-passcode')
        : document.getElementById('security-new-passcode');
    setTimeout(() => focusTarget?.focus(), 80);
}

async function saveSecurityPasscodeFromForm(event) {
    event.preventDefault();
    const currentInput = document.getElementById('security-current-passcode');
    const newInput = document.getElementById('security-new-passcode');
    const confirmInput = document.getElementById('security-confirm-passcode');
    const currentValue = normalizePasscodeInput(currentInput?.value);
    const nextValue = normalizePasscodeInput(newInput?.value);
    const confirmValue = normalizePasscodeInput(confirmInput?.value);

    if (securityState.lockEnabled && currentValue !== securityState.passcode) {
        showSecurityMessage('当前密码不正确。', 'error');
        currentInput?.focus();
        return;
    }

    if (nextValue.length !== PASSCODE_LENGTH) {
        showSecurityMessage('新密码需要是 6 位数字。', 'error');
        newInput?.focus();
        return;
    }

    if (confirmValue !== nextValue) {
        showSecurityMessage('两次输入的新密码不一致。', 'error');
        confirmInput?.focus();
        return;
    }

    if (securityState.lockEnabled && nextValue === securityState.passcode) {
        showSecurityMessage('新密码和当前密码一样。', 'error');
        newInput?.focus();
        return;
    }

    securityState.passcode = nextValue;
    securityState.lockEnabled = true;
    applyLockScreenSecurity();
    await saveSecuritySettings();
    resetSecurityPasscodeForm();
    showSecurityMessage('锁屏密码已更新。', 'success');
}

function openSecuritySubpage() {
    const settingsApp = document.getElementById('settings-app');
    const mainView = document.getElementById('settings-main-view');
    const securityView = document.getElementById('settings-security-view');
    if (!settingsApp || !securityView) return;
    closeApiSubpage();
    closeDebugSubpage();
    closeStorageSubpage();
    settingsApp.classList.add('security-view-active');
    securityView.hidden = false;
    securityView.classList.add('active');
    mainView?.setAttribute('aria-hidden', 'true');
    securityView.setAttribute('aria-hidden', 'false');
    settingsApp.scrollTop = 0;
    resetSecurityPasscodeForm();
    renderSecuritySettings();
}

function closeSecuritySubpage() {
    const settingsApp = document.getElementById('settings-app');
    const mainView = document.getElementById('settings-main-view');
    const securityView = document.getElementById('settings-security-view');
    if (!securityView) return;
    settingsApp?.classList.remove('security-view-active');
    securityView.classList.remove('active');
    securityView.hidden = true;
    mainView?.setAttribute('aria-hidden', 'false');
    securityView.setAttribute('aria-hidden', 'true');
    resetSecurityPasscodeForm();
}

function createDefaultApiSettings() {
    return {
        chat: {
            endpoint: '',
            apiKey: '',
            model: '',
            temperature: 0.7,
            contextRounds: 20,
            models: [],
            presets: []
        },
        voice: {
            version: 'official',
            apiKey: '',
            groupId: '',
            voiceId: '',
            language: 'zh',
            speed: 1,
            presets: []
        }
    };
}

function parseStoredJson(content) {
    if (typeof content !== 'string') return content || {};
    try {
        return JSON.parse(content);
    } catch (e) {
        return {};
    }
}


function normalizeApiNumber(value, fallback, min, max) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    let next = number;
    if (typeof min === 'number') next = Math.max(min, next);
    if (typeof max === 'number') next = Math.min(max, next);
    return next;
}

function normalizeApiInteger(value, fallback, min) {
    const number = Number.parseInt(value, 10);
    if (!Number.isFinite(number)) return fallback;
    return Math.max(min, number);
}

function normalizeApiPresets(value) {
    if (!Array.isArray(value)) return [];
    return value
        .filter(item => item && typeof item === 'object')
        .map(item => ({
            id: String(item.id || `preset_${Date.now()}_${Math.random().toString(16).slice(2)}`),
            name: String(item.name || '未命名预设').slice(0, 32),
            createdAt: item.createdAt || new Date().toISOString(),
            data: item.data && typeof item.data === 'object' ? item.data : {}
        }));
}

function coerceApiSettings(content) {
    const stored = parseStoredJson(content);
    const defaults = createDefaultApiSettings();
    const chat = stored.chat && typeof stored.chat === 'object' ? stored.chat : {};
    const voice = stored.voice && typeof stored.voice === 'object' ? stored.voice : {};

    return {
        chat: {
            endpoint: String(chat.endpoint || ''),
            apiKey: String(chat.apiKey || ''),
            model: String(chat.model || ''),
            temperature: normalizeApiNumber(chat.temperature, defaults.chat.temperature, 0, 2),
            contextRounds: normalizeApiInteger(chat.contextRounds, defaults.chat.contextRounds, 0),
            models: Array.isArray(chat.models) ? chat.models.map(String).filter(Boolean) : [],
            presets: normalizeApiPresets(chat.presets)
        },
        voice: {
            version: voice.version === 'overseas' ? 'overseas' : 'official',
            apiKey: String(voice.apiKey || ''),
            groupId: String(voice.groupId || ''),
            voiceId: String(voice.voiceId || ''),
            language: String(voice.language || defaults.voice.language),
            speed: normalizeApiNumber(voice.speed, defaults.voice.speed, 0.5, 2),
            presets: normalizeApiPresets(voice.presets)
        }
    };
}

async function loadApiSettings() {
    try {
        const saved = await db.edits.get(API_SETTINGS_ID);
        if (saved) apiState = coerceApiSettings(saved.content);
    } catch (e) {
        console.error('接口参数加载失败:', e);
    }
    renderApiSettings();
}

async function saveApiSettings() {
    try {
        await db.edits.put({
            id: API_SETTINGS_ID,
            content: JSON.stringify(apiState),
            type: 'api-settings'
        });
    } catch (e) {
        console.error('接口参数保存失败:', e);
    }
}

function scheduleApiSettingsSave() {
    window.clearTimeout(apiSaveTimer);
    apiSaveTimer = window.setTimeout(saveApiSettings, 180);
}

function setApiInputValue(id, value) {
    const input = document.getElementById(id);
    if (input && input.value !== String(value)) input.value = String(value);
}

function getApiLanguageLabel(value) {
    return API_VOICE_LANGUAGES.find(language => language.value === value)?.label || '中文';
}

function closeApiPickerPanels(exceptPicker = null) {
    document.querySelectorAll('.api-picker.open').forEach(picker => {
        if (picker === exceptPicker) return;
        const panel = picker.querySelector('.api-popover');
        picker.classList.remove('open');
        if (panel) panel.hidden = true;
        picker.querySelectorAll('[aria-expanded]').forEach(control => control.setAttribute('aria-expanded', 'false'));
    });
}

function setApiPickerOpen(pickerId, open) {
    const picker = document.getElementById(pickerId);
    if (!picker) return;
    const panel = picker.querySelector('.api-popover');
    if (open) closeApiPickerPanels(picker);
    picker.classList.toggle('open', open);
    if (panel) panel.hidden = !open;
    picker.querySelectorAll('[aria-expanded]').forEach(control => control.setAttribute('aria-expanded', String(open)));
}

function toggleApiPicker(pickerId) {
    const picker = document.getElementById(pickerId);
    if (!picker) return;
    setApiPickerOpen(pickerId, !picker.classList.contains('open'));
}

function renderChatModelPanel() {
    const panel = document.getElementById('api-chat-model-panel');
    if (!panel) return;
    const models = apiState.chat.models || [];

    panel.innerHTML = '';
    if (!models.length) {
        const empty = document.createElement('div');
        empty.className = 'api-picker-empty';
        empty.textContent = '拉取模型后会出现在这里';
        panel.appendChild(empty);
        return;
    }

    models.forEach(model => {
        const option = document.createElement('button');
        option.className = 'api-picker-option interactive';
        option.type = 'button';
        option.setAttribute('data-model-option', model);
        option.classList.toggle('active', model === apiState.chat.model);
        const name = document.createElement('span');
        name.textContent = model;
        option.appendChild(name);
        if (model === apiState.chat.model) {
            const mark = document.createElement('span');
            mark.className = 'api-picker-option-mark';
            mark.textContent = 'ON';
            option.appendChild(mark);
        }
        option.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            apiState.chat.model = model;
            setApiInputValue('api-chat-model', model);
            renderApiSettings();
            scheduleApiSettingsSave();
            setApiPickerOpen('api-chat-model-picker', false);
        });
        panel.appendChild(option);
    });
}

function renderVoiceLanguagePanel() {
    const panel = document.getElementById('api-voice-language-panel');
    if (!panel) return;
    panel.innerHTML = '';
    API_VOICE_LANGUAGES.forEach(language => {
        const option = document.createElement('button');
        option.className = 'api-picker-option interactive';
        option.type = 'button';
        option.setAttribute('data-language-option', language.value);
        option.classList.toggle('active', language.value === apiState.voice.language);
        const label = document.createElement('span');
        label.textContent = language.label;
        option.appendChild(label);
        if (language.value === apiState.voice.language) {
            const mark = document.createElement('span');
            mark.className = 'api-picker-option-mark';
            mark.textContent = 'ON';
            option.appendChild(mark);
        }
        option.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            apiState.voice.language = language.value;
            setApiInputValue('api-voice-language', language.value);
            renderApiSettings();
            scheduleApiSettingsSave();
            showApiStatus('voice', '语言已更新。', 'success');
            setApiPickerOpen('api-voice-language-picker', false);
        });
        panel.appendChild(option);
    });
}

function showApiSystemToast(text) {
    const toast = document.getElementById('api-system-toast');
    const toastText = document.getElementById('api-system-toast-text');
    if (!toast || !toastText || !text) return;
    toastText.textContent = text;
    toast.hidden = false;
    window.clearTimeout(apiToastTimer);
    requestAnimationFrame(() => toast.classList.add('active'));
    apiToastTimer = window.setTimeout(() => {
        toast.classList.remove('active');
        window.setTimeout(() => {
            if (!toast.classList.contains('active')) toast.hidden = true;
        }, 240);
    }, 3200);
}

function syncApiStateFromInputs(type) {
    if (type === 'chat') {
        apiState.chat.endpoint = document.getElementById('api-chat-endpoint')?.value.trim() || '';
        apiState.chat.apiKey = document.getElementById('api-chat-key')?.value || '';
        apiState.chat.model = document.getElementById('api-chat-model')?.value.trim() || '';
        apiState.chat.temperature = normalizeApiNumber(document.getElementById('api-chat-temperature')?.value, 0.7, 0, 2);
        apiState.chat.contextRounds = normalizeApiInteger(document.getElementById('api-chat-context-rounds')?.value, 20, 0);
        return;
    }

    apiState.voice.apiKey = document.getElementById('api-voice-key')?.value || '';
    apiState.voice.groupId = document.getElementById('api-voice-group-id')?.value.trim() || '';
    apiState.voice.voiceId = document.getElementById('api-voice-id')?.value.trim() || '';
    apiState.voice.language = document.getElementById('api-voice-language')?.value || 'zh';
    apiState.voice.speed = normalizeApiNumber(document.getElementById('api-voice-speed')?.value, 1, 0.5, 2);
}

function getApiPresetPayload(type) {
    syncApiStateFromInputs(type);
    if (type === 'chat') {
        return {
            endpoint: apiState.chat.endpoint,
            apiKey: apiState.chat.apiKey,
            model: apiState.chat.model,
            temperature: apiState.chat.temperature,
            contextRounds: apiState.chat.contextRounds,
            models: apiState.chat.models
        };
    }
    return {
        version: apiState.voice.version,
        apiKey: apiState.voice.apiKey,
        groupId: apiState.voice.groupId,
        voiceId: apiState.voice.voiceId,
        language: apiState.voice.language,
        speed: apiState.voice.speed
    };
}

function applyApiPresetPayload(type, data) {
    if (type === 'chat') {
        apiState.chat = {
            ...apiState.chat,
            endpoint: String(data.endpoint || ''),
            apiKey: String(data.apiKey || ''),
            model: String(data.model || ''),
            temperature: normalizeApiNumber(data.temperature, 0.7, 0, 2),
            contextRounds: normalizeApiInteger(data.contextRounds, 20, 0),
            models: Array.isArray(data.models) ? data.models.map(String).filter(Boolean) : apiState.chat.models
        };
        return;
    }

    apiState.voice = {
        ...apiState.voice,
        version: data.version === 'overseas' ? 'overseas' : 'official',
        apiKey: String(data.apiKey || ''),
        groupId: String(data.groupId || ''),
        voiceId: String(data.voiceId || ''),
        language: String(data.language || 'zh'),
        speed: normalizeApiNumber(data.speed, 1, 0.5, 2)
    };
}

function renderApiSettings() {
    const chat = apiState.chat;
    const voice = apiState.voice;
    setApiInputValue('api-chat-endpoint', chat.endpoint);
    setApiInputValue('api-chat-key', chat.apiKey);
    setApiInputValue('api-chat-model', chat.model);
    setApiInputValue('api-chat-temperature', chat.temperature);
    setApiInputValue('api-chat-context-rounds', chat.contextRounds);
    setApiInputValue('api-voice-key', voice.apiKey);
    setApiInputValue('api-voice-group-id', voice.groupId);
    setApiInputValue('api-voice-id', voice.voiceId);
    setApiInputValue('api-voice-language', voice.language);
    setApiInputValue('api-voice-speed', voice.speed);

    const temperatureValue = document.getElementById('api-chat-temperature-value');
    const speedValue = document.getElementById('api-voice-speed-value');
    const languageLabel = document.getElementById('api-voice-language-label');
    if (temperatureValue) temperatureValue.textContent = Number(chat.temperature).toFixed(2);
    if (speedValue) speedValue.textContent = `${Number(voice.speed).toFixed(2)}x`;
    if (languageLabel) languageLabel.textContent = getApiLanguageLabel(voice.language);
    renderChatModelPanel();
    renderVoiceLanguagePanel();

    document.querySelectorAll('[data-voice-version]').forEach(button => {
        const active = button.getAttribute('data-voice-version') === voice.version;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
    });

    renderApiPresetList('chat');
    renderApiPresetList('voice');
}

function renderApiPresetList(type) {
    const list = document.getElementById(`api-${type}-preset-list`);
    if (!list) return;
    const presets = apiState[type].presets || [];
    list.innerHTML = '';

    if (!presets.length) {
        const empty = document.createElement('div');
        empty.className = 'api-empty-state';
        empty.textContent = '暂无预设';
        list.appendChild(empty);
        return;
    }

    presets.forEach((preset, index) => {
        const row = document.createElement('div');
        row.className = 'api-preset-row';

        const applyButton = document.createElement('button');
        applyButton.className = 'api-preset-apply interactive';
        applyButton.type = 'button';
        applyButton.addEventListener('click', () => applyApiPreset(type, preset.id));

        const name = document.createElement('span');
        name.textContent = preset.name;
        const meta = document.createElement('span');
        meta.className = 'api-preset-meta';
        meta.textContent = String(index + 1).padStart(2, '0');
        applyButton.append(name, meta);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'api-preset-delete interactive';
        deleteButton.type = 'button';
        deleteButton.setAttribute('aria-label', `删除${preset.name}`);
        deleteButton.innerHTML = '<svg viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v5M14 11v5"/></svg>';
        deleteButton.addEventListener('click', event => {
            event.stopPropagation();
            deleteApiPreset(type, preset.id);
        });

        row.append(applyButton, deleteButton);
        list.appendChild(row);
    });
}

function showApiStatus(type, text, statusType = '') {
    const status = document.getElementById(type === 'chat' ? 'api-chat-status' : 'api-voice-status');
    if (!status) return;
    status.classList.remove('success', 'error');
    if (statusType === 'error') {
        status.textContent = '';
        showApiSystemToast(text);
        return;
    }
    status.textContent = text;
    if (statusType) status.classList.add(statusType);
}

function buildModelsEndpoint(rawEndpoint) {
    const raw = rawEndpoint.trim();
    if (!/^https?:\/\//i.test(raw)) {
        throw new Error('接口网址需要以 http:// 或 https:// 开头。');
    }
    const url = new URL(raw);
    url.search = '';
    url.hash = '';
    if (/\/models\/?$/i.test(url.pathname)) return url.toString();
    if (/\/chat\/completions\/?$/i.test(url.pathname)) {
        url.pathname = url.pathname.replace(/\/chat\/completions\/?$/i, '/models');
        return url.toString();
    }
    url.pathname = url.pathname.replace(/\/+$/, '') + '/models';
    return url.toString();
}

function extractModelNames(payload) {
    const source = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(payload?.models)
                ? payload.models
                : [];

    return Array.from(new Set(source.map(item => {
        if (typeof item === 'string') return item;
        if (!item || typeof item !== 'object') return '';
        return item.id || item.model || item.name || '';
    }).filter(Boolean)));
}

async function fetchChatModels() {
    syncApiStateFromInputs('chat');
    const fetchButton = document.getElementById('api-chat-fetch-models');
    if (!apiState.chat.endpoint) {
        showApiStatus('chat', '请先填写接口网址。', 'error');
        return;
    }

    let modelsUrl = '';
    try {
        modelsUrl = buildModelsEndpoint(apiState.chat.endpoint);
    } catch (e) {
        showApiStatus('chat', e.message, 'error');
        return;
    }

    const headers = { Accept: 'application/json' };
    if (apiState.chat.apiKey) headers.Authorization = `Bearer ${apiState.chat.apiKey}`;

    fetchButton?.classList.add('is-loading');
    showApiStatus('chat', '正在拉取模型...');
    try {
        const response = await fetch(modelsUrl, { method: 'GET', headers });
        if (!response.ok) throw new Error(`模型拉取失败：${response.status}`);
        const payload = await response.json();
        const models = extractModelNames(payload);
        if (!models.length) {
            showApiStatus('chat', '没有读取到可用模型。', 'error');
            return;
        }
        apiState.chat.models = models;
        if (!apiState.chat.model) apiState.chat.model = models[0];
        renderApiSettings();
        await saveApiSettings();
        setApiPickerOpen('api-chat-model-picker', true);
        showApiStatus('chat', `已拉取 ${models.length} 个模型。`, 'success');
    } catch (e) {
        showApiStatus('chat', e.message || '模型拉取失败。', 'error');
    } finally {
        fetchButton?.classList.remove('is-loading');
    }
}

function openApiPresetModal(type) {
    syncApiStateFromInputs(type);
    pendingApiPresetType = type;
    const modal = document.getElementById('api-preset-modal');
    const kicker = document.getElementById('api-preset-modal-kicker');
    const title = document.getElementById('api-preset-modal-title');
    const input = document.getElementById('api-preset-name');
    if (!modal || !input) return;

    const label = type === 'chat' ? '聊天预设' : '语音预设';
    if (kicker) kicker.textContent = type === 'chat' ? 'CHAT PRESET' : 'VOICE PRESET';
    if (title) title.textContent = `存为${label}`;
    input.value = `${label} ${new Date().toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}`;
    modal.hidden = false;
    modal.classList.add('active');
    setTimeout(() => {
        input.focus();
    }, 80);
}

function closeApiPresetModal() {
    const modal = document.getElementById('api-preset-modal');
    if (!modal) return;
    modal.classList.remove('active');
    modal.hidden = true;
    pendingApiPresetType = null;
}

async function saveApiPresetFromModal(event) {
    event.preventDefault();
    const type = pendingApiPresetType;
    const input = document.getElementById('api-preset-name');
    if (!type || !input) return;
    const fallback = type === 'chat' ? '聊天预设' : '语音预设';
    const name = input.value.trim() || fallback;
    const preset = {
        id: `${type}_${Date.now()}`,
        name: name.slice(0, 32),
        createdAt: new Date().toISOString(),
        data: getApiPresetPayload(type)
    };
    apiState[type].presets = [preset, ...(apiState[type].presets || [])];
    await saveApiSettings();
    renderApiSettings();
    closeApiPresetModal();
    showApiStatus(type, '预设已保存。', 'success');
}

async function applyApiPreset(type, id) {
    const preset = (apiState[type].presets || []).find(item => item.id === id);
    if (!preset) return;
    applyApiPresetPayload(type, preset.data || {});
    renderApiSettings();
    await saveApiSettings();
    showApiStatus(type, '预设已应用。', 'success');
}

async function deleteApiPreset(type, id) {
    apiState[type].presets = (apiState[type].presets || []).filter(item => item.id !== id);
    renderApiSettings();
    await saveApiSettings();
    showApiStatus(type, '预设已删除。', 'success');
}

function openApiSubpage() {
    const settingsApp = document.getElementById('settings-app');
    const mainView = document.getElementById('settings-main-view');
    const apiView = document.getElementById('settings-api-view');
    if (!settingsApp || !apiView) return;
    closeSecuritySubpage();
    closeDebugSubpage();
    closeStorageSubpage();
    settingsApp.classList.add('api-view-active');
    apiView.hidden = false;
    apiView.classList.add('active');
    mainView?.setAttribute('aria-hidden', 'true');
    apiView.setAttribute('aria-hidden', 'false');
    settingsApp.scrollTop = 0;
    renderApiSettings();
}

function closeApiSubpage() {
    const settingsApp = document.getElementById('settings-app');
    const mainView = document.getElementById('settings-main-view');
    const apiView = document.getElementById('settings-api-view');
    if (!apiView) return;
    closeApiPresetModal();
    closeApiPickerPanels();
    settingsApp?.classList.remove('api-view-active');
    apiView.classList.remove('active');
    apiView.hidden = true;
    mainView?.setAttribute('aria-hidden', 'false');
    apiView.setAttribute('aria-hidden', 'true');
}

const STORAGE_EXPORT_SCOPES = ['layout', 'edits', 'localStorage'];
const STORAGE_BACKUP_FORMAT = 'rinno-backup';
const STORAGE_BACKUP_VERSION = 1;
let storageExportFormat = 'zip';
let pendingStorageImportFile = null;
let storageBusy = false;
let storageDragDepth = 0;

function isRinnoLocalStorageKey(key) {
    return /^rinno(?:_|:)/i.test(String(key || ''));
}

function getRinnoLocalStorageKeys() {
    try {
        return Object.keys(window.localStorage || {}).filter(isRinnoLocalStorageKey);
    } catch (error) {
        console.warn('读取 Rinno localStorage 失败:', error);
        return [];
    }
}

function getRinnoLocalStorageSnapshot() {
    const snapshot = {};
    getRinnoLocalStorageKeys().forEach(key => {
        snapshot[key] = String(window.localStorage.getItem(key) || '');
    });
    return snapshot;
}

function formatStorageBytes(bytes) {
    const size = Number(bytes) || 0;
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(size < 10 * 1024 ? 1 : 0)} KB`;
    return `${(size / (1024 * 1024)).toFixed(size < 10 * 1024 * 1024 ? 2 : 1)} MB`;
}

function approximateStorageBytes(value) {
    if (typeof value === 'string') return new Blob([value]).size;
    return new Blob([JSON.stringify(value ?? null)]).size;
}

function getDataUrlBytes(content = '') {
    const raw = String(content || '');
    const match = raw.match(/^data:[^;]+;base64,([\s\S]+)$/i);
    if (!match) return approximateStorageBytes(raw);
    const base64 = match[1].replace(/\s+/g, '');
    const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
    return Math.max(0, Math.floor(base64.length * 3 / 4) - padding);
}

function padStorageNumber(value) {
    return String(value).padStart(2, '0');
}

function getStorageBackupFilename(extension = 'zip') {
    const now = new Date();
    const stamp = [
        now.getFullYear(),
        padStorageNumber(now.getMonth() + 1),
        padStorageNumber(now.getDate()),
        padStorageNumber(now.getHours()),
        padStorageNumber(now.getMinutes())
    ].join('-');
    return `Rinno-${stamp}.${extension}`;
}

function updateStorageFilenamePreview() {
    const preview = document.getElementById('storage-filename-preview');
    if (!preview) return;
    preview.textContent = `文件名示例：${getStorageBackupFilename(storageExportFormat === 'json' ? 'json' : 'zip')}`;
}

function setStorageInlineStatus(text, type = '') {
    const status = document.getElementById('storage-inline-status');
    if (!status) return;
    status.textContent = text || '';
    status.classList.remove('success', 'error');
    if (type) status.classList.add(type);
}

function setStorageBusyState(nextBusy) {
    storageBusy = Boolean(nextBusy);
    document.querySelectorAll('[data-storage-action]').forEach(control => {
        control.disabled = storageBusy;
    });
}

function renderStorageFormatButtons() {
    document.querySelectorAll('[data-storage-format]').forEach(button => {
        const active = button.getAttribute('data-storage-format') === storageExportFormat;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
    });
    updateStorageFilenamePreview();
}

function setStorageExportFormat(format) {
    storageExportFormat = format === 'json' ? 'json' : 'zip';
    renderStorageFormatButtons();
}

function getSelectedStorageScopes() {
    return Array.from(document.querySelectorAll('#storage-scope-grid input[type="checkbox"]:checked'))
        .map(input => input.value)
        .filter(scope => STORAGE_EXPORT_SCOPES.includes(scope));
}

function setPendingStorageImportFile(file) {
    pendingStorageImportFile = file || null;
    if (!pendingStorageImportFile) return;
    setStorageInlineStatus(`已选择导入文件：${pendingStorageImportFile.name}`, '');
}

function clearPendingStorageImportFile() {
    pendingStorageImportFile = null;
    const input = document.getElementById('settings-storage-import-input');
    if (input) input.value = '';
}

async function collectStorageStats() {
    let edits = [];
    let layout = [];
    try {
        edits = await db.edits.toArray();
        layout = await db.layout.toArray();
    } catch (error) {
        console.error('读取存储统计失败:', error);
    }

    const localSnapshot = getRinnoLocalStorageSnapshot();
    const localValues = Object.values(localSnapshot);
    const imageCount = edits.filter(edit => edit?.type === 'image' && /^data:image\//i.test(String(edit.content || ''))).length
        + localValues.filter(value => /^data:image\//i.test(String(value || ''))).length;
    const pageCount = Math.max(
        document.querySelectorAll('#slider > .page').length,
        layout.filter(item => /^page[-_]/.test(String(item?.cid || ''))).length
    );

    return {
        totalBytes: approximateStorageBytes(edits) + approximateStorageBytes(layout) + approximateStorageBytes(localSnapshot),
        imageCount,
        pageCount,
        localKeyCount: Object.keys(localSnapshot).length,
        editCount: edits.length,
        layoutCount: layout.length
    };
}

async function renderStorageManager() {
    renderStorageFormatButtons();
    const totalSize = document.getElementById('storage-total-size');
    const totalMeta = document.getElementById('storage-total-meta');
    const imageCount = document.getElementById('storage-image-count');
    const imageMeta = document.getElementById('storage-image-meta');
    const pageCount = document.getElementById('storage-page-count');
    const pageMeta = document.getElementById('storage-page-meta');
    const localKeyCount = document.getElementById('storage-local-key-count');
    const localMeta = document.getElementById('storage-local-meta');
    if (!totalSize || !imageCount || !pageCount || !localKeyCount) return;

    const stats = await collectStorageStats();
    totalSize.textContent = formatStorageBytes(stats.totalBytes);
    totalMeta.textContent = `${stats.editCount} 条编辑 / ${stats.layoutCount} 条布局`;
    imageCount.textContent = String(stats.imageCount);
    imageMeta.textContent = stats.imageCount ? '可继续压缩的本地图片' : '暂未发现可压缩图片';
    pageCount.textContent = String(stats.pageCount);
    pageMeta.textContent = stats.pageCount ? '桌面页数已同步' : '当前没有可用页面';
    localKeyCount.textContent = String(stats.localKeyCount);
    localMeta.textContent = stats.localKeyCount ? '检测到旧版 Rinno localStorage 键值' : '没有检测到旧版本地键值';
}

function openStorageSubpage() {
    const settingsApp = document.getElementById('settings-app');
    const mainView = document.getElementById('settings-main-view');
    const storageView = document.getElementById('settings-storage-view');
    if (!settingsApp || !storageView) return;
    closeSecuritySubpage();
    closeApiSubpage();
    closeDebugSubpage();
    settingsApp.classList.add('storage-view-active');
    storageView.hidden = false;
    storageView.classList.add('active');
    mainView?.setAttribute('aria-hidden', 'true');
    storageView.setAttribute('aria-hidden', 'false');
    settingsApp.scrollTop = 0;
    renderStorageManager();
}

function closeStorageSubpage() {
    const settingsApp = document.getElementById('settings-app');
    const mainView = document.getElementById('settings-main-view');
    const storageView = document.getElementById('settings-storage-view');
    if (!storageView) return;
    storageDragDepth = 0;
    document.getElementById('storage-import-dropzone')?.classList.remove('is-dragover');
    settingsApp?.classList.remove('storage-view-active');
    storageView.classList.remove('active');
    storageView.hidden = true;
    mainView?.setAttribute('aria-hidden', 'false');
    storageView.setAttribute('aria-hidden', 'true');
}

async function buildStorageBackupPayload(scopes = STORAGE_EXPORT_SCOPES) {
    const selectedScopes = Array.from(new Set((Array.isArray(scopes) ? scopes : []).filter(scope => STORAGE_EXPORT_SCOPES.includes(scope))));
    if (!selectedScopes.length) {
        throw new Error('请至少选择一项导出内容。');
    }

    const payload = {
        format: STORAGE_BACKUP_FORMAT,
        version: STORAGE_BACKUP_VERSION,
        createdAt: new Date().toISOString(),
        app: 'Rinno',
        scopes: selectedScopes,
        data: {}
    };

    if (selectedScopes.includes('edits') || selectedScopes.includes('layout')) {
        payload.data.dexie = {};
        if (selectedScopes.includes('edits')) payload.data.dexie.edits = await db.edits.toArray();
        if (selectedScopes.includes('layout')) payload.data.dexie.layout = await db.layout.toArray();
    }

    if (selectedScopes.includes('localStorage')) {
        payload.data.localStorage = getRinnoLocalStorageSnapshot();
    }

    return payload;
}

async function createStorageZipBlob(payload) {
    if (typeof window.JSZip !== 'function') {
        throw new Error('ZIP 组件尚未加载，请刷新页面后再试。');
    }

    const zip = new window.JSZip();
    zip.file(getStorageBackupFilename('json'), JSON.stringify(payload, null, 2));
    return zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
    });
}

function downloadStorageBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1200);
}

async function exportStorageBackup(scopes, exportAll = false) {
    if (storageBusy) return;
    setStorageBusyState(true);
    try {
        const selectedScopes = exportAll ? STORAGE_EXPORT_SCOPES : scopes;
        const payload = await buildStorageBackupPayload(selectedScopes);
        const extension = storageExportFormat === 'json' ? 'json' : 'zip';
        const blob = storageExportFormat === 'json'
            ? new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
            : await createStorageZipBlob(payload);
        const filename = getStorageBackupFilename(extension);
        downloadStorageBlob(blob, filename);
        setStorageInlineStatus(`导出完成：${filename}`, 'success');
        showApiSystemToast(`导出完成：${filename}`);
    } catch (error) {
        const message = error?.message || '导出失败，请稍后重试。';
        setStorageInlineStatus(message, 'error');
        showApiSystemToast(message);
    } finally {
        setStorageBusyState(false);
        renderStorageManager();
    }
}

function normalizeStorageBackupPayload(payload) {
    if (!payload || typeof payload !== 'object') {
        throw new Error('备份文件格式无法识别。');
    }

    const source = payload.data && typeof payload.data === 'object' ? payload.data : payload;
    const dexieSource = source.dexie && typeof source.dexie === 'object' ? source.dexie : source;
    const edits = Array.isArray(dexieSource.edits) ? dexieSource.edits.filter(item => item && typeof item === 'object') : null;
    const layout = Array.isArray(dexieSource.layout) ? dexieSource.layout.filter(item => item && typeof item === 'object') : null;
    const localStorageData = source.localStorage && typeof source.localStorage === 'object' && !Array.isArray(source.localStorage)
        ? Object.fromEntries(Object.entries(source.localStorage).map(([key, value]) => [String(key), String(value ?? '')]).filter(([key]) => isRinnoLocalStorageKey(key)))
        : null;

    if (!edits && !layout && !localStorageData) {
        throw new Error('备份文件里没有可导入的数据。');
    }

    return { edits, layout, localStorage: localStorageData };
}

function isStorageZipFile(file) {
    const name = String(file?.name || '');
    const type = String(file?.type || '');
    return /\.zip$/i.test(name) || /zip/i.test(type);
}

function readStorageFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = event => resolve(String(event.target?.result || ''));
        reader.onerror = () => reject(new Error('读取文件失败。'));
        reader.readAsText(file);
    });
}

async function readStorageZipPayload(file) {
    if (typeof window.JSZip !== 'function') {
        throw new Error('ZIP 组件尚未加载，请刷新页面后再试。');
    }

    const zip = await window.JSZip.loadAsync(file);
    const entries = Object.values(zip.files).filter(entry => !entry.dir && /\.json$/i.test(entry.name));
    if (!entries.length) {
        throw new Error('ZIP 文件中没有找到可读取的 JSON 备份。');
    }
    const preferred = entries.find(entry => /rinno-.*\.json$/i.test(entry.name) || /backup\.json$/i.test(entry.name)) || entries[0];
    const content = await preferred.async('string');
    return normalizeStorageBackupPayload(JSON.parse(content));
}

async function restoreStorageBackupPayload(payload) {
    if (payload.edits) {
        await db.edits.clear();
        if (payload.edits.length) await db.edits.bulkPut(payload.edits);
    }

    if (payload.layout) {
        await db.layout.clear();
        if (payload.layout.length) await db.layout.bulkPut(payload.layout);
    }

    if (payload.localStorage) {
        const importedEditIds = new Set((payload.edits || []).map(item => String(item?.id || '')));
        const legacyEntries = Object.entries(payload.localStorage)
            .filter(([key]) => isRinnoLocalStorageKey(key))
            .filter(([key]) => !importedEditIds.has(String(key || '')))
            .map(([key, value]) => ({
                id: String(key || ''),
                content: String(value ?? ''),
                type: 'legacy-localstorage-import'
            }))
            .filter(item => item.id);
        getRinnoLocalStorageKeys().forEach(key => window.localStorage.removeItem(key));
        if (legacyEntries.length) await db.edits.bulkPut(legacyEntries);
    }
}

async function importStorageBackup(file = pendingStorageImportFile) {
    if (storageBusy) return;
    if (!file) {
        setStorageInlineStatus('请先选择一个 JSON 或 ZIP 备份文件。', 'error');
        return;
    }

    setStorageBusyState(true);
    try {
        const payload = isStorageZipFile(file)
            ? await readStorageZipPayload(file)
            : normalizeStorageBackupPayload(JSON.parse(await readStorageFileAsText(file)));
        await restoreStorageBackupPayload(payload);
        clearPendingStorageImportFile();
        setStorageInlineStatus(`导入完成：${file.name}，页面正在刷新。`, 'success');
        showApiSystemToast('数据导入完成，正在刷新页面。');
        window.setTimeout(() => window.location.reload(), 420);
    } catch (error) {
        const message = error?.message || '导入失败，请确认文件格式后重试。';
        setStorageInlineStatus(message, 'error');
        showApiSystemToast(message);
    } finally {
        setStorageBusyState(false);
        renderStorageManager();
    }
}

function loadStorageImage(dataUrl) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('图片解析失败。'));
        image.src = dataUrl;
    });
}

function canvasToStorageBlob(canvas, type, quality) {
    return new Promise(resolve => {
        canvas.toBlob(blob => resolve(blob), type, quality);
    });
}

function storageBlobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = event => resolve(String(event.target?.result || ''));
        reader.onerror = () => reject(new Error('图片转换失败。'));
        reader.readAsDataURL(blob);
    });
}

async function compressStorageImageContent(content) {
    if (!/^data:image\//i.test(String(content || ''))) return null;
    const source = String(content || '');
    const originalBytes = getDataUrlBytes(source);
    const image = await loadStorageImage(source);
    const maxSide = 1920;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth || image.width || 1, image.naturalHeight || image.height || 1));
    const width = Math.max(1, Math.round((image.naturalWidth || image.width || 1) * scale));
    const height = Math.max(1, Math.round((image.naturalHeight || image.height || 1) * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return null;
    ctx.drawImage(image, 0, 0, width, height);

    const blob = await canvasToStorageBlob(canvas, 'image/webp', 0.82);
    if (!blob || blob.size >= originalBytes) return null;
    return {
        dataUrl: await storageBlobToDataUrl(blob),
        savedBytes: originalBytes - blob.size
    };
}

async function compressStoredImages() {
    if (storageBusy) return;
    setStorageBusyState(true);
    try {
        let updatedCount = 0;
        let savedBytes = 0;
        const edits = await db.edits.toArray();
        for (const edit of edits) {
            if (edit?.type !== 'image' || !/^data:image\//i.test(String(edit.content || ''))) continue;
            const result = await compressStorageImageContent(edit.content);
            if (!result) continue;
            await db.edits.put({ ...edit, content: result.dataUrl, type: 'image' });
            updatedCount += 1;
            savedBytes += result.savedBytes;
        }

        const localSnapshot = getRinnoLocalStorageSnapshot();
        for (const [key, value] of Object.entries(localSnapshot)) {
            if (!/^data:image\//i.test(String(value || ''))) continue;
            const result = await compressStorageImageContent(value);
            if (!result) continue;
            await db.edits.put({
                id: String(key || ''),
                content: result.dataUrl,
                type: 'legacy-localstorage-image'
            });
            window.localStorage.removeItem(key);
            updatedCount += 1;
            savedBytes += result.savedBytes;
        }

        await window.loadEdits?.();
        await renderStorageManager();
        if (!updatedCount) {
            setStorageInlineStatus('没有找到可进一步压缩的本地图片。', '');
            showApiSystemToast('没有找到可进一步压缩的本地图片。');
            return;
        }

        const message = `已压缩 ${updatedCount} 张图片，释放 ${formatStorageBytes(savedBytes)}。`;
        setStorageInlineStatus(message, 'success');
        showApiSystemToast(message);
    } catch (error) {
        const message = error?.message || '图片压缩失败，请稍后重试。';
        setStorageInlineStatus(message, 'error');
        showApiSystemToast(message);
    } finally {
        setStorageBusyState(false);
        renderStorageManager();
    }
}

async function resetAllRinnoData() {
    if (storageBusy) return;
    const confirmed = window.confirm('确定要重置 Rinno 的全部本地数据吗？此操作会清空布局、编辑内容和子页存档。');
    if (!confirmed) return;

    setStorageBusyState(true);
    try {
        await Promise.all([db.edits.clear(), db.layout.clear()]);
        getRinnoLocalStorageKeys().forEach(key => window.localStorage.removeItem(key));
        clearPendingStorageImportFile();
        setStorageInlineStatus('全部数据已清空，页面正在刷新。', 'success');
        showApiSystemToast('全部数据已清空，正在刷新页面。');
        window.setTimeout(() => window.location.reload(), 420);
    } catch (error) {
        const message = error?.message || '重置失败，请稍后重试。';
        setStorageInlineStatus(message, 'error');
        showApiSystemToast(message);
    } finally {
        setStorageBusyState(false);
        renderStorageManager();
    }
}

// --- 调试与控制：纯代码报错控制台 ---
window.rinnoDebugLogs = window.rinnoDebugLogs || [];

function stringifyDebugValue(value) {
    if (value instanceof Error) return `${value.name}: ${value.message}`;
    if (typeof value === 'string') return value;
    try {
        return JSON.stringify(value);
    } catch (e) {
        return String(value);
    }
}

function pushDebugLog(level, category, detail) {
    const row = {
        level,
        category,
        detail: String(detail || ''),
        time: new Date().toLocaleTimeString('zh-CN', { hour12: false })
    };
    window.rinnoDebugLogs.unshift(row);
    window.rinnoDebugLogs = window.rinnoDebugLogs.slice(0, 80);
    renderDebugConsole();
}

function patchDebugConsoleCapture() {
    if (window.__rinnoDebugConsolePatched) return;
    window.__rinnoDebugConsolePatched = true;

    const originalError = console.error.bind(console);
    const originalWarn = console.warn.bind(console);

    console.error = (...args) => {
        originalError(...args);
        pushDebugLog('error', 'CONSOLE_ERROR', args.map(stringifyDebugValue).join(' '));
    };

    console.warn = (...args) => {
        originalWarn(...args);
        pushDebugLog('warn', 'CONSOLE_WARN', args.map(stringifyDebugValue).join(' '));
    };

    window.addEventListener('error', event => {
        pushDebugLog('error', 'WINDOW_ERROR', `${event.message || 'Unknown error'} @ ${event.filename || 'inline'}:${event.lineno || 0}`);
    });

    window.addEventListener('unhandledrejection', event => {
        pushDebugLog('error', 'PROMISE_ERROR', stringifyDebugValue(event.reason || 'Unhandled rejection'));
    });
}

function escapeDebugHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));
}

function ensureRinnoPluginHost() {
    if (!Array.isArray(window.RinnoPluginRegistry)) {
        window.RinnoPluginRegistry = [];
    }

    let pluginRoot = document.querySelector('[data-plugin-root]');
    if (!pluginRoot) {
        pluginRoot = document.createElement('div');
        pluginRoot.id = 'plugin-root';
        pluginRoot.setAttribute('data-plugin-root', '');
        pluginRoot.hidden = true;
        (document.getElementById('app-root') || document.body).appendChild(pluginRoot);
    }

    if (!window.RinnoPluginHost || typeof window.RinnoPluginHost !== 'object') {
        window.RinnoPluginHost = {};
    }

    window.RinnoPluginHost.registry = window.RinnoPluginRegistry;
    window.RinnoPluginHost.mount = pluginRoot;
    window.RinnoPluginHost.register = plugin => window.registerRinnoPlugin(plugin);

    if (typeof window.registerRinnoPlugin !== 'function') {
        window.registerRinnoPlugin = plugin => {
            const item = plugin && typeof plugin === 'object' ? plugin : { id: String(plugin || '') };
            const id = String(item.id || item.name || `plugin-${Date.now()}`);
            const normalized = { ...item, id };
            const existingIndex = window.RinnoPluginRegistry.findIndex(entry => entry.id === id);
            if (existingIndex >= 0) {
                window.RinnoPluginRegistry[existingIndex] = normalized;
            } else {
                window.RinnoPluginRegistry.push(normalized);
            }
            return normalized;
        };
    }
}

function getDebugApiErrors() {
    const rows = [];
    const state = typeof apiState !== 'undefined' ? apiState : null;
    const chat = state?.chat || {};
    const voice = state?.voice || {};

    if (!state) {
        rows.push(['error', 'API_ERROR', 'apiState is missing. Settings API controller did not initialize.']);
        return rows;
    }

    const chatTouched = Boolean(chat.endpoint || chat.apiKey || chat.model);

    if (chat.endpoint && !/^https?:\/\//i.test(chat.endpoint)) {
        rows.push(['error', 'API_ERROR', 'chat.endpoint must start with http:// or https://.']);
    }
    if (chatTouched && !chat.endpoint) rows.push(['error', 'API_ERROR', 'chat.endpoint is required after chat API is configured.']);
    if (chatTouched && !chat.model) rows.push(['error', 'API_ERROR', 'chat.model is required after chat API is configured.']);
    return rows;
}

function getDebugCodeErrors() {
    ensureRinnoPluginHost();
    const rows = [];
    const requiredNodes = [
        ['#app-root', 'app root'],
        ['#settings-app', 'settings app'],
        ['#settings-debug-view', 'debug view'],
        ['#community-app', 'community app'],
        ['#community-feed', 'community feed']
    ];
    const requiredFunctions = [
        ['openSettingsApp', window.openSettingsApp],
        ['closeSettingsApp', window.closeSettingsApp],
        ['openCommunityApp', window.openCommunityApp],
        ['closeCommunityApp', window.closeCommunityApp],
        ['openPrivateApp', window.openPrivateApp],
        ['openLetterApp', window.openLetterApp]
    ];

    requiredNodes.forEach(([selector, label]) => {
        if (!document.querySelector(selector)) rows.push(['error', 'CODE_ERROR', `Missing DOM node: ${label} (${selector}).`]);
    });

    requiredFunctions.forEach(([name, fn]) => {
        if (typeof fn !== 'function') rows.push(['error', 'CODE_ERROR', `Missing function: ${name}().`]);
    });

    if (typeof window.registerRinnoPlugin !== 'function') {
        rows.push(['error', 'CODE_ERROR', 'Missing code hook: registerRinnoPlugin().']);
    }

    return rows;
}

function getDebugPluginErrors() {
    ensureRinnoPluginHost();
    const rows = [];
    const requiredPlugins = Array.isArray(window.RinnoRequiredPlugins) ? window.RinnoRequiredPlugins : [];
    requiredPlugins.forEach(pluginId => {
        const id = String(pluginId || '').trim();
        if (!id) return;
        const exists = window.RinnoPluginRegistry.some(plugin => plugin?.id === id || plugin?.name === id);
        if (!exists) rows.push(['error', 'PLUGIN_ERROR', `Required plugin is missing: ${id}.`]);
    });
    return rows;
}

function getDebugRows() {
    const rows = [
        ['ok', 'BOOT', `Rinno debug console mounted at ${new Date().toLocaleString('zh-CN', { hour12: false })}.`],
        ...getDebugApiErrors(),
        ...getDebugCodeErrors(),
        ...getDebugPluginErrors()
    ];

    (window.rinnoDebugLogs || []).slice(0, 24).forEach(item => {
        rows.push([item.level === 'warn' ? 'warn' : 'error', item.category || 'RUNTIME', `[${item.time}] ${item.detail}`]);
    });

    return rows;
}

function renderDebugConsole() {
    const output = document.getElementById('debug-output');
    if (!output) return;
    const rows = getDebugRows();
    output.innerHTML = rows.map(([level, category, detail]) => {
        const className = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'ok';
        return `<span class="debug-line ${className}">[${escapeDebugHtml(category)}] ${escapeDebugHtml(detail)}</span>`;
    }).join('');
}

async function copyDebugConsole() {
    const output = document.getElementById('debug-output');
    const text = output?.innerText.trim() || '';
    if (!text) {
        showApiSystemToast('控制台暂无可复制内容。');
        return;
    }

    try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable.');
        await navigator.clipboard.writeText(text);
        showApiSystemToast('报错已复制。');
    } catch (error) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
        showApiSystemToast('报错已复制。');
    }
}

function openDebugSubpage() {
    const settingsApp = document.getElementById('settings-app');
    const mainView = document.getElementById('settings-main-view');
    const debugView = document.getElementById('settings-debug-view');
    if (!settingsApp || !debugView) return;
    closeApiSubpage();
    closeSecuritySubpage();
    closeStorageSubpage();
    settingsApp.classList.add('debug-view-active');
    debugView.hidden = false;
    debugView.classList.add('active');
    mainView?.setAttribute('aria-hidden', 'true');
    debugView.setAttribute('aria-hidden', 'false');
    settingsApp.scrollTop = 0;
    renderDebugConsole();
}

function closeDebugSubpage() {
    const settingsApp = document.getElementById('settings-app');
    const mainView = document.getElementById('settings-main-view');
    const debugView = document.getElementById('settings-debug-view');
    if (!debugView) return;
    settingsApp?.classList.remove('debug-view-active');
    debugView.classList.remove('active');
    debugView.hidden = true;
    mainView?.setAttribute('aria-hidden', 'false');
    debugView.setAttribute('aria-hidden', 'true');
}

ensureRinnoPluginHost();
patchDebugConsoleCapture();

document.getElementById('settings-debug-entry')?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    openDebugSubpage();
});

document.getElementById('settings-debug-entry')?.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openDebugSubpage();
    }
});

document.getElementById('settings-debug-title')?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    closeDebugSubpage();
});

document.getElementById('debug-refresh')?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    renderDebugConsole();
});

document.getElementById('debug-copy')?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    copyDebugConsole();
});

document.getElementById('debug-clear')?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    window.rinnoDebugLogs = [];
    renderDebugConsole();
});

document.getElementById('api-chat-form')?.addEventListener('submit', event => {
    event.preventDefault();
});

document.getElementById('api-voice-form')?.addEventListener('submit', event => {
    event.preventDefault();
});

document.addEventListener('keydown', event => {
    const settingsApp = document.getElementById('settings-app');
    if (event.key !== 'Escape' || !settingsApp?.classList.contains('debug-view-active')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    closeDebugSubpage();
}, true);

document.getElementById('settings-title')?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    if (typeof closeSettingsApp === 'function') closeSettingsApp();
});

document.getElementById('settings-security-entry')?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    openSecuritySubpage();
});

document.getElementById('settings-security-entry')?.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openSecuritySubpage();
    }
});

document.getElementById('settings-security-title')?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    closeSecuritySubpage();
});

document.getElementById('settings-api-entry')?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    openApiSubpage();
});

document.getElementById('settings-api-entry')?.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openApiSubpage();
    }
});

document.getElementById('settings-api-title')?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    closeApiSubpage();
});

document.getElementById('settings-storage-entry')?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    openStorageSubpage();
});

document.getElementById('settings-storage-entry')?.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openStorageSubpage();
    }
});

document.getElementById('settings-storage-title')?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    closeStorageSubpage();
});

document.getElementById('security-lock-switch')?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    const nextState = !securityState.lockEnabled;
    setLockEnabled(nextState, nextState ? '锁屏密码已开启。' : '锁屏密码已关闭。');
});

document.getElementById('security-change-passcode')?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    startSecurityPasscodeEdit();
});

document.getElementById('security-disable-passcode')?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    setLockEnabled(false, '锁屏密码已关闭。');
});

document.getElementById('security-cancel-passcode')?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    resetSecurityPasscodeForm();
});

document.getElementById('security-passcode-form')?.addEventListener('submit', saveSecurityPasscodeFromForm);

document.querySelectorAll('.security-input').forEach(input => {
    input.addEventListener('input', () => {
        input.value = normalizePasscodeInput(input.value);
    });
    input.addEventListener('touchstart', event => event.stopPropagation(), { passive: true });
    input.addEventListener('mousedown', event => event.stopPropagation());
});

loadSecuritySettings();
loadApiSettings();
if (typeof loadPrologueState === 'function') {
    prologueStateReady = loadPrologueState();
}
renderStorageManager();

document.querySelectorAll('[data-api-section] input, [data-api-section] select').forEach(input => {
    const section = input.closest('[data-api-section]')?.getAttribute('data-api-section');
    input.addEventListener('input', () => {
        if (!section) return;
        syncApiStateFromInputs(section);
        renderApiSettings();
        scheduleApiSettingsSave();
    });
    input.addEventListener('change', () => {
        if (!section) return;
        syncApiStateFromInputs(section);
        renderApiSettings();
        scheduleApiSettingsSave();
    });
    input.addEventListener('touchstart', event => event.stopPropagation(), { passive: true });
    input.addEventListener('mousedown', event => event.stopPropagation());
});

document.getElementById('api-chat-model')?.addEventListener('focus', () => {
    renderChatModelPanel();
    setApiPickerOpen('api-chat-model-picker', true);
});

document.getElementById('api-chat-model')?.addEventListener('input', () => {
    renderChatModelPanel();
    setApiPickerOpen('api-chat-model-picker', true);
});

document.getElementById('api-chat-model-toggle')?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    renderChatModelPanel();
    toggleApiPicker('api-chat-model-picker');
});

document.getElementById('api-voice-language-toggle')?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    renderVoiceLanguagePanel();
    toggleApiPicker('api-voice-language-picker');
});

document.addEventListener('click', event => {
    if (!event.target.closest('.api-picker')) closeApiPickerPanels();
});

document.querySelectorAll('[data-voice-version]').forEach(button => {
    button.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        apiState.voice.version = button.getAttribute('data-voice-version') === 'overseas' ? 'overseas' : 'official';
        renderApiSettings();
        scheduleApiSettingsSave();
        showApiStatus('voice', '接口版本已更新。', 'success');
    });
});

document.getElementById('api-chat-fetch-models')?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    fetchChatModels();
});

document.getElementById('api-chat-save-preset')?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    openApiPresetModal('chat');
});

document.getElementById('api-voice-save-preset')?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    openApiPresetModal('voice');
});

document.getElementById('api-preset-form')?.addEventListener('submit', saveApiPresetFromModal);

document.getElementById('api-preset-cancel')?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    closeApiPresetModal();
});

document.getElementById('api-preset-modal')?.addEventListener('click', event => {
    if (event.target === event.currentTarget) closeApiPresetModal();
});

document.getElementById('api-preset-name')?.addEventListener('touchstart', event => event.stopPropagation(), { passive: true });
document.getElementById('api-preset-name')?.addEventListener('mousedown', event => event.stopPropagation());

document.querySelectorAll('[data-storage-format]').forEach(button => {
    button.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        setStorageExportFormat(button.getAttribute('data-storage-format'));
    });
});

document.getElementById('storage-refresh-summary')?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    renderStorageManager();
});

document.getElementById('storage-compress-images')?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    compressStoredImages();
});

document.getElementById('storage-export-selected')?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    exportStorageBackup(getSelectedStorageScopes(), false);
});

document.getElementById('storage-export-all')?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    exportStorageBackup(STORAGE_EXPORT_SCOPES, true);
});

document.getElementById('storage-pick-file')?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    document.getElementById('settings-storage-import-input')?.click();
});

document.getElementById('storage-import-file')?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    if (!pendingStorageImportFile) {
        document.getElementById('settings-storage-import-input')?.click();
        return;
    }
    importStorageBackup();
});

document.getElementById('settings-storage-import-input')?.addEventListener('change', event => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPendingStorageImportFile(file);
});

const storageDropzone = document.getElementById('storage-import-dropzone');
storageDropzone?.addEventListener('click', event => {
    if (event.target.closest('button')) return;
    event.preventDefault();
    document.getElementById('settings-storage-import-input')?.click();
});

storageDropzone?.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    document.getElementById('settings-storage-import-input')?.click();
});

storageDropzone?.addEventListener('dragenter', event => {
    event.preventDefault();
    event.stopPropagation();
    storageDragDepth += 1;
    storageDropzone.classList.add('is-dragover');
});

storageDropzone?.addEventListener('dragover', event => {
    event.preventDefault();
    event.stopPropagation();
    storageDropzone.classList.add('is-dragover');
});

['dragleave', 'dragend'].forEach(type => {
    storageDropzone?.addEventListener(type, event => {
        event.preventDefault();
        event.stopPropagation();
        storageDragDepth = Math.max(0, storageDragDepth - 1);
        if (!storageDragDepth) storageDropzone.classList.remove('is-dragover');
    });
});

storageDropzone?.addEventListener('drop', event => {
    event.preventDefault();
    event.stopPropagation();
    storageDragDepth = 0;
    storageDropzone.classList.remove('is-dragover');
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    setPendingStorageImportFile(file);
    importStorageBackup(file);
});

document.getElementById('storage-reset-all')?.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    resetAllRinnoData();
});

document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const settingsApp = document.getElementById('settings-app');
    if (!settingsApp?.classList.contains('active')) return;

    const presetModal = document.getElementById('api-preset-modal');
    if (document.querySelector('.api-picker.open')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeApiPickerPanels();
        return;
    }
    if (presetModal && !presetModal.hidden) {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeApiPresetModal();
        return;
    }
    if (settingsApp.classList.contains('storage-view-active')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeStorageSubpage();
        return;
    }
    if (settingsApp.classList.contains('api-view-active')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeApiSubpage();
        return;
    }
    if (settingsApp.classList.contains('security-view-active')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeSecuritySubpage();
        return;
    }
    if (typeof closeSettingsApp === 'function') {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeSettingsApp();
    }
}, true);
