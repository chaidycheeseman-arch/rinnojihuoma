(() => {
    const AUTH_ENDPOINT = window.__rinnoResolveLicenseApiUrl('/.netlify/functions/user-auth');
    const DEVICE_CODE_ENDPOINT = window.__rinnoResolveLicenseApiUrl('/.netlify/functions/device-code');
    const ACTIVATION_CODE_STORAGE_KEY = 'rinno_activation_code_v3';
    const ACCOUNT_ID_STORAGE_KEY = 'rinno_user_account_v1';
    const DEVICE_CODE_STORAGE_KEY = 'rinno_device_code_v2';
    const LEGACY_ACTIVATION_CODE_STORAGE_KEYS = ['rinno_activation_code_v1', 'rinno_activation_code_v2'];
    const LEGACY_DEVICE_CODE_STORAGE_KEYS = ['rinno_device_code_v1'];
    const DEVICE_CODE_LENGTH = 16;
    const DEVICE_CODE_GROUP_LENGTH = 4;
    const DEVICE_CODE_PLACEHOLDER = 'XXXX-XXXX-XXXX-XXXX';
    const ACCOUNT_ID_MAX_LENGTH = 80;
    const PASSWORD_MIN_LENGTH = 6;
    const PASSWORD_MAX_LENGTH = 48;
    const HEARTBEAT_INTERVAL_MS = 45000;
    const REQUEST_TIMEOUT_MS = 12000;
    const state = {
        deviceCode: '',
        heartbeatTimer: 0,
        busy: false,
        currentMode: 'required',
        tab: 'login'
    };
    let dom = null;

    window.__rinnoActivationV2 = true;

    function safeStorageGet(key) {
        try {
            return localStorage.getItem(key) || '';
        } catch (error) {
            return '';
        }
    }

    function safeStorageSet(key, value) {
        try {
            localStorage.setItem(key, String(value || ''));
        } catch (error) {
            console.warn('Activation localStorage write skipped:', error);
        }
    }

    function safeStorageRemove(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.warn('Activation localStorage remove skipped:', error);
        }
    }

    function normalizeActivationCode(value) {
        return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 64);
    }

    function normalizeDeviceCode(value) {
        return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, DEVICE_CODE_LENGTH);
    }

    function normalizeAccountId(value) {
        return String(value || '')
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '')
            .slice(0, ACCOUNT_ID_MAX_LENGTH);
    }

    function isCurrentDeviceCode(value) {
        return normalizeDeviceCode(value).length === DEVICE_CODE_LENGTH;
    }

    function formatDeviceCode(value) {
        const normalized = normalizeDeviceCode(value);
        if (!normalized) return '';
        return (normalized.match(new RegExp(`.{1,${DEVICE_CODE_GROUP_LENGTH}}`, 'g')) || [normalized]).join('-');
    }

    function getFormattedDeviceCode(value) {
        return formatDeviceCode(value) || DEVICE_CODE_PLACEHOLDER;
    }

    function readStoredActivationCode() {
        return normalizeActivationCode(safeStorageGet(ACTIVATION_CODE_STORAGE_KEY));
    }

    function readStoredAccountId() {
        return normalizeAccountId(safeStorageGet(ACCOUNT_ID_STORAGE_KEY));
    }

    function readStoredDeviceCode() {
        const cached = normalizeDeviceCode(safeStorageGet(DEVICE_CODE_STORAGE_KEY));
        return isCurrentDeviceCode(cached) ? cached : '';
    }

    function saveAuthState(payload = {}) {
        const activationCode = normalizeActivationCode(payload.activationCode);
        const accountId = normalizeAccountId(payload.accountId);
        if (activationCode) safeStorageSet(ACTIVATION_CODE_STORAGE_KEY, activationCode);
        if (accountId) safeStorageSet(ACCOUNT_ID_STORAGE_KEY, accountId);
    }

    function clearActivationCode() {
        safeStorageRemove(ACTIVATION_CODE_STORAGE_KEY);
    }

    function clearAuthState(options = {}) {
        clearActivationCode();
        if (!options.keepAccount) safeStorageRemove(ACCOUNT_ID_STORAGE_KEY);
    }

    function clearLegacyActivationStorage() {
        LEGACY_ACTIVATION_CODE_STORAGE_KEYS.forEach(key => safeStorageRemove(key));
        LEGACY_DEVICE_CODE_STORAGE_KEYS.forEach(key => safeStorageRemove(key));
        if (!readStoredAccountId()) clearActivationCode();
    }

    async function requestJson(endpoint, body, method = 'POST') {
        const controller = typeof AbortController === 'function' ? new AbortController() : null;
        const timeoutId = controller ? window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS) : 0;

        try {
            const response = await fetch(endpoint, {
                method,
                headers: {
                    Accept: 'application/json',
                    ...(body ? { 'Content-Type': 'application/json' } : {})
                },
                cache: 'no-store',
                credentials: 'same-origin',
                signal: controller ? controller.signal : undefined,
                body: body ? JSON.stringify(body) : undefined
            });

            let payload = {};
            try {
                payload = await response.json();
            } catch (error) {
                payload = {};
            }

            return { response, payload };
        } finally {
            if (timeoutId) window.clearTimeout(timeoutId);
        }
    }

    async function requestDeviceCode() {
        return requestJson(DEVICE_CODE_ENDPOINT, null, 'GET');
    }

    async function requestUserAuth(payload) {
        return requestJson(AUTH_ENDPOINT, {
            ...payload,
            deviceCode: normalizeDeviceCode(state.deviceCode),
            deviceProfile: collectDeviceProfile()
        });
    }

    async function ensureDeviceCode() {
        const cached = readStoredDeviceCode();
        if (isCurrentDeviceCode(cached)) return cached;

        const result = await requestDeviceCode();
        if (!result.response.ok) {
            throw new Error(result.payload && result.payload.message ? result.payload.message : 'Unable to allocate a unique device code.');
        }

        const deviceCode = normalizeDeviceCode(result.payload && result.payload.deviceCode);
        if (!isCurrentDeviceCode(deviceCode)) {
            throw new Error('Device code service returned an invalid code.');
        }

        safeStorageSet(DEVICE_CODE_STORAGE_KEY, deviceCode);
        return deviceCode;
    }

    function collectDeviceProfile() {
        const screenInfo = window.screen || {};
        return {
            userAgent: navigator.userAgent || '',
            language: navigator.language || '',
            platform: navigator.platform || '',
            vendor: navigator.vendor || '',
            hardwareConcurrency: navigator.hardwareConcurrency || 0,
            deviceMemory: navigator.deviceMemory || 0,
            maxTouchPoints: navigator.maxTouchPoints || 0,
            screen: `${screenInfo.width || 0}x${screenInfo.height || 0}`,
            availableScreen: `${screenInfo.availWidth || 0}x${screenInfo.availHeight || 0}`,
            colorDepth: screenInfo.colorDepth || 0,
            pixelRatio: window.devicePixelRatio || 1,
            timezone: (Intl.DateTimeFormat && Intl.DateTimeFormat().resolvedOptions().timeZone) || ''
        };
    }

    async function copyText(text) {
        const value = String(text || '');
        if (!value) return false;

        try {
            await navigator.clipboard.writeText(value);
            return true;
        } catch (error) {
            try {
                const textarea = document.createElement('textarea');
                textarea.value = value;
                textarea.setAttribute('readonly', '');
                textarea.style.position = 'fixed';
                textarea.style.left = '-9999px';
                document.body.appendChild(textarea);
                textarea.select();
                const copied = document.execCommand('copy');
                textarea.remove();
                return copied;
            } catch (fallbackError) {
                return false;
            }
        }
    }

    function getDom() {
        if (dom) return dom;
        dom = {
            gate: document.getElementById('activation-gate'),
            title: document.getElementById('activation-title'),
            copy: document.getElementById('activation-copy'),
            feedback: document.getElementById('activation-feedback'),
            submit: document.getElementById('activation-submit'),
            stateTag: document.getElementById('activation-state-tag'),
            verifyButton: document.getElementById('activation-verify-device'),
            deviceCode: document.getElementById('activation-device-code'),
            copyDeviceButton: document.getElementById('activation-copy-device'),
            supportNumber: document.getElementById('activation-support-number'),
            copySupportButton: document.getElementById('activation-copy-support'),
            tabLogin: document.getElementById('activation-tab-login'),
            tabRegister: document.getElementById('activation-tab-register'),
            loginForm: document.getElementById('activation-login-form'),
            registerForm: document.getElementById('activation-register-form'),
            loginAccountInput: document.getElementById('activation-account-input'),
            loginPasswordInput: document.getElementById('activation-password-input'),
            registerAccountInput: document.getElementById('activation-register-account-input'),
            registerPasswordInput: document.getElementById('activation-register-password-input'),
            registerActivationInput: document.getElementById('activation-register-code-input')
        };
        return dom;
    }

    function setFeedback(text, tone = '') {
        const refs = getDom();
        if (!refs.feedback) return;
        refs.feedback.textContent = String(text || '');
        if (tone) refs.feedback.dataset.tone = tone;
        else delete refs.feedback.dataset.tone;
    }

    function applyActivationMode(mode) {
        document.body.classList.remove('activation-booting', 'activation-required', 'activation-ready');
        if (mode === 'active') {
            document.body.classList.add('activation-ready');
        } else if (mode === 'booting') {
            document.body.classList.add('activation-booting');
        } else {
            document.body.classList.add('activation-required');
        }
        document.body.dataset.activationMode = mode;
        state.currentMode = mode;
    }

    function getSubmitButtonLabel() {
        if (state.currentMode === 'booting') return '校验中...';
        if (state.currentMode === 'kicked') return '重新登录并接管';
        return state.tab === 'register' ? '注册并进入' : '登录并进入';
    }

    function setBusy(busy, buttonText = '') {
        state.busy = Boolean(busy);
        const refs = getDom();
        const disabled = state.busy;
        const controls = [
            refs.submit,
            refs.verifyButton,
            refs.copyDeviceButton,
            refs.copySupportButton,
            refs.loginAccountInput,
            refs.loginPasswordInput,
            refs.registerAccountInput,
            refs.registerPasswordInput,
            refs.registerActivationInput,
            refs.tabLogin,
            refs.tabRegister
        ];
        controls.forEach(control => {
            if (control) control.disabled = disabled;
        });
        if (refs.submit) refs.submit.textContent = buttonText || getSubmitButtonLabel();
    }

    function syncAccountInputs() {
        const refs = getDom();
        const loginAccount = normalizeAccountId(refs.loginAccountInput && refs.loginAccountInput.value);
        const registerAccount = normalizeAccountId(refs.registerAccountInput && refs.registerAccountInput.value);
        const remembered = readStoredAccountId();
        const sourceValue = loginAccount || registerAccount || remembered;
        if (refs.loginAccountInput && sourceValue && !loginAccount) refs.loginAccountInput.value = sourceValue;
        if (refs.registerAccountInput && sourceValue && !registerAccount) refs.registerAccountInput.value = sourceValue;
    }

    function applyTabUi() {
        const refs = getDom();
        if (refs.tabLogin) {
            refs.tabLogin.classList.toggle('is-active', state.tab === 'login');
            refs.tabLogin.setAttribute('aria-selected', state.tab === 'login' ? 'true' : 'false');
        }
        if (refs.tabRegister) {
            refs.tabRegister.classList.toggle('is-active', state.tab === 'register');
            refs.tabRegister.setAttribute('aria-selected', state.tab === 'register' ? 'true' : 'false');
        }
        if (refs.loginForm) refs.loginForm.hidden = state.tab !== 'login';
        if (refs.registerForm) refs.registerForm.hidden = state.tab !== 'register';
    }

    function updateGateCopy(message = '') {
        const refs = getDom();
        if (!refs.gate) return;

        if (refs.deviceCode) refs.deviceCode.textContent = getFormattedDeviceCode(state.deviceCode);

        if (state.currentMode === 'booting') {
            if (refs.title) refs.title.textContent = '正在校验登录状态';
            if (refs.copy) refs.copy.textContent = '正在确认这个浏览器是否仍然持有当前账号的登录资格。';
            if (refs.stateTag) refs.stateTag.textContent = '校验中';
            setFeedback(message || '正在连接验证服务...', 'muted');
            return;
        }

        if (state.currentMode === 'kicked') {
            state.tab = 'login';
            applyTabUi();
            if (refs.title) refs.title.textContent = '这个浏览器已被顶下线';
            if (refs.copy) refs.copy.textContent = '同一个账号同时只允许一个设备或浏览器在线。重新输入账号密码即可把资格切回当前浏览器。';
            if (refs.stateTag) refs.stateTag.textContent = '已顶号';
            setFeedback(message || '这个账号已在其它设备登录，请重新登录。', 'error');
            return;
        }

        if (state.tab === 'register') {
            if (refs.title) refs.title.textContent = '首次注册';
            if (refs.copy) refs.copy.textContent = '先复制设备码发给管理员签发激活码，再设置你的账号密码。以后再进站只需要账号密码。';
            if (refs.stateTag) refs.stateTag.textContent = '待注册';
            setFeedback(message || '首次注册需要设备码、激活码、账号和密码。', 'muted');
            return;
        }

        if (refs.title) refs.title.textContent = '账号登录';
        if (refs.copy) refs.copy.textContent = '已经注册过的用户，直接输入账号密码登录。新设备登录会自动顶掉旧设备。';
        if (refs.stateTag) refs.stateTag.textContent = '待登录';
        setFeedback(message || '输入账号密码后即可进入。', 'muted');
    }

    function renderGate(mode, message = '') {
        applyActivationMode(mode === 'active' ? 'active' : mode);
        updateGateCopy(message);
        setBusy(false, getSubmitButtonLabel());
    }

    function hideGate() {
        applyActivationMode('active');
        setFeedback('', '');
        setBusy(false, getSubmitButtonLabel());
        const refs = getDom();
        if (refs.loginPasswordInput) refs.loginPasswordInput.blur();
        if (refs.registerPasswordInput) refs.registerPasswordInput.blur();
    }

    function focusCurrentInput() {
        const refs = getDom();
        window.setTimeout(() => {
            if (state.tab === 'register') {
                if (!normalizeAccountId(refs.registerAccountInput && refs.registerAccountInput.value)) {
                    refs.registerAccountInput && refs.registerAccountInput.focus();
                    return;
                }
                if (!(refs.registerPasswordInput && refs.registerPasswordInput.value)) {
                    refs.registerPasswordInput && refs.registerPasswordInput.focus();
                    return;
                }
                refs.registerActivationInput && refs.registerActivationInput.focus();
                return;
            }

            if (!normalizeAccountId(refs.loginAccountInput && refs.loginAccountInput.value)) {
                refs.loginAccountInput && refs.loginAccountInput.focus();
                return;
            }
            refs.loginPasswordInput && refs.loginPasswordInput.focus();
        }, 40);
    }

    function setTab(tab, preserveMessage = false) {
        state.tab = tab === 'register' ? 'register' : 'login';
        const refs = getDom();
        applyTabUi();
        syncAccountInputs();
        if (state.currentMode !== 'active') updateGateCopy(preserveMessage ? refs.feedback && refs.feedback.textContent : '');
        if (refs.submit) refs.submit.textContent = getSubmitButtonLabel();
    }

    function startHeartbeat() {
        stopHeartbeat();
        state.heartbeatTimer = window.setInterval(() => {
            if (!document.body.classList.contains('activation-ready')) return;
            void verifyStoredSession('heartbeat');
        }, HEARTBEAT_INTERVAL_MS);
    }

    function stopHeartbeat() {
        if (!state.heartbeatTimer) return;
        window.clearInterval(state.heartbeatTimer);
        state.heartbeatTimer = 0;
    }

    function translateResponse(result, fallback) {
        const payload = result && result.payload ? result.payload : {};
        const code = String(payload.code || '').trim().toUpperCase();
        if (code === 'INVALID_CODE') return '激活码不存在或格式不正确。';
        if (code === 'INVALID_SIGNATURE') return '激活码签名无效，请重新签发。';
        if (code === 'REVOKED_CODE') return '这个激活码已经失效，请联系管理员重新签发。';
        if (code === 'INITIAL_DEVICE_MISMATCH') return '首次注册必须在原始设备码对应的浏览器完成。';
        if (code === 'ACCOUNT_ALREADY_REGISTERED') return '这个激活码已经注册过账号了，请直接登录。';
        if (code === 'ACCOUNT_ID_TAKEN') return '这个账号已经被别的激活码占用，请换一个账号。';
        if (code === 'ALREADY_ACTIVATED') return '这个激活码已经被领取，请直接登录绑定的账号。';
        if (code === 'ACCOUNT_NOT_FOUND') return '没有找到这个账号，请先切到首次注册。';
        if (code === 'INVALID_CREDENTIALS') return '账号或密码不正确。';
        if (code === 'ACCOUNT_REQUIRED') return '这个激活码还没有完成首次注册。';
        if (code === 'ACCOUNT_MISMATCH') return '当前浏览器保存的账号信息和激活记录不一致，请重新登录。';
        if (code === 'DEVICE_REPLACED') return '这个账号刚在其它设备登录了，请重新登录接管回来。';
        if (code === 'DUPLICATE_DEVICE_CODE') return '设备码存在重复记录，请先在后台修复后再试。';
        if (payload && payload.message) return payload.message;
        return fallback;
    }

    function validateAccountId(accountId) {
        return accountId.length >= 3;
    }

    async function submitRegister() {
        const refs = getDom();
        const accountId = normalizeAccountId(refs.registerAccountInput && refs.registerAccountInput.value);
        const password = String(refs.registerPasswordInput && refs.registerPasswordInput.value || '').trim();
        const activationCode = normalizeActivationCode(refs.registerActivationInput && refs.registerActivationInput.value);

        if (!validateAccountId(accountId)) {
            setFeedback('账号至少要 3 位，建议用邮箱或英文账号。', 'error');
            refs.registerAccountInput && refs.registerAccountInput.focus();
            return;
        }

        if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
            setFeedback(`密码需要 ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} 位。`, 'error');
            refs.registerPasswordInput && refs.registerPasswordInput.focus();
            return;
        }

        if (!activationCode) {
            setFeedback('请先输入管理员签发给这个设备码的激活码。', 'error');
            refs.registerActivationInput && refs.registerActivationInput.focus();
            return;
        }

        setBusy(true, '注册中...');
        setFeedback('正在绑定账号和当前设备...', 'muted');

        try {
            const result = await requestUserAuth({
                mode: 'register',
                accountId,
                password,
                activationCode,
                accountDisplayName: accountId
            });

            if (!result.response.ok || !result.payload || !result.payload.ok) {
                renderGate('required', translateResponse(result, '注册失败，请检查激活码和账号信息。'));
                setTab('register', true);
                focusCurrentInput();
                return;
            }

            if (refs.loginPasswordInput) refs.loginPasswordInput.value = '';
            saveAuthState({
                activationCode: result.payload.activationCode,
                accountId: result.payload.accountId || accountId
            });
            hideGate();
            startHeartbeat();
        } catch (error) {
            renderGate('required', '注册服务暂时不可用，请稍后再试。');
            setTab('register', true);
            focusCurrentInput();
        }
    }

    async function submitLogin() {
        const refs = getDom();
        const accountId = normalizeAccountId(refs.loginAccountInput && refs.loginAccountInput.value);
        const password = String(refs.loginPasswordInput && refs.loginPasswordInput.value || '').trim();

        if (!validateAccountId(accountId)) {
            setFeedback('请输入注册时使用的账号。', 'error');
            refs.loginAccountInput && refs.loginAccountInput.focus();
            return;
        }

        if (!password) {
            setFeedback('请输入账号密码。', 'error');
            refs.loginPasswordInput && refs.loginPasswordInput.focus();
            return;
        }

        setBusy(true, state.currentMode === 'kicked' ? '接管中...' : '登录中...');
        setFeedback(state.currentMode === 'kicked' ? '正在把登录资格切回当前浏览器...' : '正在验证账号密码...', 'muted');

        try {
            const result = await requestUserAuth({
                mode: 'login',
                accountId,
                password
            });

            if (!result.response.ok || !result.payload || !result.payload.ok) {
                renderGate(state.currentMode === 'kicked' ? 'kicked' : 'required', translateResponse(result, '登录失败，请检查账号密码。'));
                setTab('login', true);
                focusCurrentInput();
                return;
            }

            saveAuthState({
                activationCode: result.payload.activationCode,
                accountId: result.payload.accountId || accountId
            });
            if (refs.registerPasswordInput) refs.registerPasswordInput.value = '';
            hideGate();
            startHeartbeat();
        } catch (error) {
            renderGate(state.currentMode === 'kicked' ? 'kicked' : 'required', '登录服务暂时不可用，请稍后再试。');
            setTab('login', true);
            focusCurrentInput();
        }
    }

    async function verifyStoredSession(reason = 'manual-verify') {
        const activationCode = readStoredActivationCode();
        const accountId = readStoredAccountId();

        if (!activationCode || !accountId) {
            stopHeartbeat();
            clearAuthState({ keepAccount: Boolean(accountId) });
            setTab(accountId ? 'login' : 'register', true);
            renderGate('required', accountId ? '请输入账号密码重新登录。' : '首次使用请先完成注册。');
            focusCurrentInput();
            return false;
        }

        renderGate('booting', '正在确认这个浏览器是否仍然持有当前账号...');
        setBusy(true, '校验中...');

        try {
            const result = await requestUserAuth({
                mode: 'verify',
                activationCode,
                accountId,
                reason
            });

            if (result.response.ok && result.payload && result.payload.ok) {
                saveAuthState({
                    activationCode: result.payload.activationCode || activationCode,
                    accountId: result.payload.accountId || accountId
                });
                hideGate();
                startHeartbeat();
                return true;
            }

            stopHeartbeat();
            const message = translateResponse(result, '登录状态校验失败，请重新登录。');
            if (result.response.status === 403 && result.payload && result.payload.code === 'DEVICE_REPLACED') {
                clearAuthState({ keepAccount: true });
                renderGate('kicked', message);
                focusCurrentInput();
                return false;
            }

            clearAuthState({ keepAccount: false });
            setTab('login', true);
            renderGate('required', message);
            focusCurrentInput();
            return false;
        } catch (error) {
            stopHeartbeat();
            renderGate('required', '无法连接验证服务，请稍后再试。');
            setTab(readStoredAccountId() ? 'login' : 'register', true);
            focusCurrentInput();
            return false;
        }
    }

    function bindActivationEvents() {
        const refs = getDom();
        if (!refs.gate) return;

        refs.tabLogin && refs.tabLogin.addEventListener('click', () => {
            if (state.busy) return;
            setTab('login');
            focusCurrentInput();
        });

        refs.tabRegister && refs.tabRegister.addEventListener('click', () => {
            if (state.busy) return;
            setTab('register');
            focusCurrentInput();
        });

        refs.copyDeviceButton && refs.copyDeviceButton.addEventListener('click', async () => {
            const copied = await copyText(getFormattedDeviceCode(state.deviceCode));
            setFeedback(copied ? '设备码已复制。' : '复制失败，请手动复制设备码。', copied ? 'success' : 'error');
        });

        refs.copySupportButton && refs.copySupportButton.addEventListener('click', async () => {
            const copied = await copyText(refs.supportNumber && refs.supportNumber.textContent);
            setFeedback(copied ? '售前群号已复制。' : '复制失败，请手动复制群号。', copied ? 'success' : 'error');
        });

        refs.submit && refs.submit.addEventListener('click', () => {
            if (state.busy) return;
            if (state.tab === 'register') void submitRegister();
            else void submitLogin();
        });

        refs.verifyButton && refs.verifyButton.addEventListener('click', () => {
            if (state.busy) return;
            void verifyStoredSession('manual-verify');
        });

        [refs.loginAccountInput, refs.registerAccountInput].forEach(input => {
            if (!input) return;
            input.addEventListener('input', event => {
                event.target.value = normalizeAccountId(event.target.value);
                syncAccountInputs();
            });
        });

        if (refs.registerActivationInput) {
            refs.registerActivationInput.addEventListener('input', event => {
                event.target.value = normalizeActivationCode(event.target.value);
            });
        }

        [refs.loginPasswordInput, refs.registerPasswordInput].forEach(input => {
            if (!input) return;
            input.addEventListener('keydown', event => {
                if (event.key !== 'Enter') return;
                event.preventDefault();
                if (state.busy) return;
                if (state.tab === 'register') void submitRegister();
                else void submitLogin();
            });
        });

        [refs.loginAccountInput, refs.registerAccountInput, refs.registerActivationInput].forEach(input => {
            if (!input) return;
            input.addEventListener('keydown', event => {
                if (event.key !== 'Enter') return;
                event.preventDefault();
                if (state.busy) return;
                if (state.tab === 'register') void submitRegister();
                else void submitLogin();
            });
        });
    }

    async function bootActivationGate() {
        clearLegacyActivationStorage();
        bindActivationEvents();

        try {
            state.deviceCode = await ensureDeviceCode();
        } catch (error) {
            renderGate('required', '设备码分配失败，请刷新页面重试。');
            return;
        }

        const rememberedAccountId = readStoredAccountId();
        setTab(rememberedAccountId ? 'login' : 'register', true);
        renderGate('required', rememberedAccountId ? '请输入账号密码登录。' : '首次使用请先完成注册。');

        const refs = getDom();
        if (rememberedAccountId) {
            if (refs.loginAccountInput) refs.loginAccountInput.value = rememberedAccountId;
            if (refs.registerAccountInput) refs.registerAccountInput.value = rememberedAccountId;
        }

        if (readStoredActivationCode() && rememberedAccountId) {
            await verifyStoredSession('boot');
            return;
        }

        focusCurrentInput();
    }

    void bootActivationGate();
})();
