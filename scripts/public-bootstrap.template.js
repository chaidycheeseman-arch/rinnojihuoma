(() => {
    const AUTH_ENDPOINT = '/.netlify/functions/auth';
    const LOCAL_ISSUE_ENDPOINT = '/.netlify/functions/local-issue';
    const LOCAL_LICENSE_ADMIN_ENDPOINT = '/.netlify/functions/local-license-admin';
    const ACTIVATION_CODE_STORAGE_KEY = 'rinno_activation_code_v1';
    const DEVICE_CODE_STORAGE_KEY = 'rinno_device_code_v1';
    const HEARTBEAT_INTERVAL_MS = 45000;
    const REQUEST_TIMEOUT_MS = 12000;
    const state = {
        deviceCode: '',
        lastKnownCode: '',
        heartbeatTimer: 0,
        busy: false
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
        return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
    }

    function hashFingerprint(input, seed) {
        let hash = seed >>> 0;
        for (let index = 0; index < input.length; index += 1) {
            hash ^= input.charCodeAt(index);
            hash = Math.imul(hash, 16777619);
        }
        return (hash >>> 0).toString(36).toUpperCase().padStart(8, '0');
    }

    function buildDeviceFingerprint() {
        const screenInfo = window.screen || {};
        const timezone = (Intl.DateTimeFormat && Intl.DateTimeFormat().resolvedOptions().timeZone) || '';
        return [
            navigator.userAgent || '',
            navigator.language || '',
            navigator.platform || '',
            navigator.vendor || '',
            String(navigator.hardwareConcurrency || 0),
            String(navigator.deviceMemory || 0),
            String(navigator.maxTouchPoints || 0),
            `${screenInfo.width || 0}x${screenInfo.height || 0}`,
            `${screenInfo.availWidth || 0}x${screenInfo.availHeight || 0}`,
            String(screenInfo.colorDepth || 0),
            String(window.devicePixelRatio || 1),
            timezone
        ].join('|');
    }

    function generateDeviceCode() {
        const cached = normalizeDeviceCode(safeStorageGet(DEVICE_CODE_STORAGE_KEY));
        if (cached.length === 12) return cached;

        const fingerprint = buildDeviceFingerprint();
        const firstHalf = hashFingerprint(fingerprint, 2166136261).slice(0, 6);
        const secondHalf = hashFingerprint(fingerprint.split('').reverse().join(''), 1315423911).slice(0, 6);
        const deviceCode = normalizeDeviceCode(`${firstHalf}${secondHalf}`).padEnd(12, '0').slice(0, 12);
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

    function isLocalDevelopmentHost() {
        const host = String(window.location.hostname || '').trim().toLowerCase();
        return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]';
    }

    function ensureLocalDevelopmentPanel() {
        // Issuer / duplicate-repair tools now live on the backend issuer page only.
    }

    function getDom() {
        if (dom) return dom;
        dom = {
            gate: document.getElementById('activation-gate'),
            title: document.getElementById('activation-title'),
            copy: document.getElementById('activation-copy'),
            deviceCode: document.getElementById('activation-device-code'),
            copyButton: document.getElementById('activation-copy-device'),
            input: document.getElementById('activation-code-input'),
            feedback: document.getElementById('activation-feedback'),
            submit: document.getElementById('activation-submit'),
            stateTag: document.getElementById('activation-state-tag'),
            verifyButton: document.getElementById('activation-verify-device'),
            supportNumber: document.getElementById('activation-support-number'),
            copySupportButton: document.getElementById('activation-copy-support'),
            localIssueInput: document.getElementById('activation-local-device-input'),
            localIssueButton: document.getElementById('activation-local-issue-button'),
            localActivateButton: document.getElementById('activation-local-activate-button'),
            localIssuedCode: document.getElementById('activation-local-issued-code'),
            localCopyCodeButton: document.getElementById('activation-local-copy-code'),
            localFeedback: document.getElementById('activation-local-feedback'),
            localCheckDuplicatesButton: document.getElementById('activation-local-check-duplicates'),
            localFixDuplicatesButton: document.getElementById('activation-local-fix-duplicates'),
            localRevokeButton: document.getElementById('activation-local-revoke'),
            localLicenseList: document.getElementById('activation-local-license-list')
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

    function setLocalIssueFeedback(text, tone = '') {
        const refs = getDom();
        if (!refs.localFeedback) return;
        refs.localFeedback.textContent = String(text || '');
        if (tone) refs.localFeedback.dataset.tone = tone;
        else delete refs.localFeedback.dataset.tone;
    }

    function getSubmitButtonLabel() {
        return document.body.dataset.activationMode === 'kicked' ? 'Reclaim access' : 'Verify and enter';
    }

    function setBusy(busy, buttonText = '') {
        state.busy = Boolean(busy);
        const refs = getDom();
        if (refs.submit) {
            refs.submit.disabled = state.busy;
            if (buttonText) refs.submit.textContent = buttonText;
        }
        if (refs.verifyButton) refs.verifyButton.disabled = state.busy;
        if (refs.input) refs.input.disabled = state.busy;
        if (refs.localIssueInput) refs.localIssueInput.disabled = state.busy;
        if (refs.localIssueButton) refs.localIssueButton.disabled = state.busy;
        if (refs.localActivateButton) refs.localActivateButton.disabled = state.busy;
        if (refs.localCopyCodeButton) refs.localCopyCodeButton.disabled = state.busy;
        if (refs.localCheckDuplicatesButton) refs.localCheckDuplicatesButton.disabled = state.busy;
        if (refs.localFixDuplicatesButton) refs.localFixDuplicatesButton.disabled = state.busy;
        if (refs.localRevokeButton) refs.localRevokeButton.disabled = state.busy;
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
    }

    function renderGate(mode, message = '') {
        const refs = getDom();
        if (!refs.gate) return;
        applyActivationMode(mode === 'active' ? 'active' : mode);

        if (refs.deviceCode) refs.deviceCode.textContent = state.deviceCode || '------------';

        if (mode === 'booting') {
            if (refs.title) refs.title.textContent = 'Verifying device access';
            if (refs.copy) refs.copy.textContent = 'Checking whether this browser still owns a valid activation key.';
            if (refs.stateTag) refs.stateTag.textContent = 'Checking';
            if (refs.submit) refs.submit.textContent = 'Checking...';
            setFeedback(message || 'Connecting to the activation service...', 'muted');
            return;
        }

        if (mode === 'kicked') {
            if (refs.title) refs.title.textContent = 'This device is no longer active';
            if (refs.copy) refs.copy.textContent = 'The activation key was taken over by another device. Re-enter the key here to reclaim access.';
            if (refs.stateTag) refs.stateTag.textContent = 'Kicked';
            if (refs.submit) refs.submit.textContent = 'Reclaim access';
            setFeedback(message || 'This device lost ownership of the activation key.', 'error');
            if (refs.input) refs.input.value = '';
            return;
        }

        if (refs.title) refs.title.textContent = 'Enter activation key';
        if (refs.copy) refs.copy.textContent = 'First use: copy the device code, issue an activation key from the backend issuer page, then enter it below.';
        if (refs.stateTag) refs.stateTag.textContent = 'Pending';
        if (refs.submit) refs.submit.textContent = 'Verify and enter';
        setFeedback(message || 'Copy the device code first, then enter a valid activation key.', 'muted');
    }

    function hideGate() {
        applyActivationMode('active');
        setFeedback('', '');
        const refs = getDom();
        if (refs.input) refs.input.blur();
    }

    function focusActivationInput() {
        const refs = getDom();
        window.setTimeout(() => refs.input && refs.input.focus(), 30);
    }

    async function requestAuth(mode, activationCode, reason) {
        const controller = typeof AbortController === 'function' ? new AbortController() : null;
        const timeoutId = controller
            ? window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
            : 0;

        try {
            const response = await fetch(AUTH_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                cache: 'no-store',
                credentials: 'same-origin',
                signal: controller ? controller.signal : undefined,
                body: JSON.stringify({
                    mode,
                    activationCode,
                    deviceCode: state.deviceCode,
                    reason: reason || '',
                    deviceProfile: collectDeviceProfile()
                })
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

    async function requestLocalIssue(deviceCode) {
        const controller = typeof AbortController === 'function' ? new AbortController() : null;
        const timeoutId = controller
            ? window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
            : 0;

        try {
            const response = await fetch(LOCAL_ISSUE_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                cache: 'no-store',
                credentials: 'same-origin',
                signal: controller ? controller.signal : undefined,
                body: JSON.stringify({
                    deviceCode,
                    note: 'localhost-dev-issue'
                })
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

    async function requestLocalLicenseLookup({ deviceCode = '', activationCode = '', expandDevice = false } = {}) {
        const query = new URLSearchParams();
        if (deviceCode) query.set('deviceCode', deviceCode);
        if (activationCode) query.set('activationCode', activationCode);
        if (expandDevice) query.set('expandDevice', 'true');
        query.set('includeRevoked', 'true');
        query.set('limit', '20');

        const response = await fetch(`${LOCAL_LICENSE_ADMIN_ENDPOINT}?${query.toString()}`, {
            method: 'GET',
            headers: {
                Accept: 'application/json'
            },
            cache: 'no-store',
            credentials: 'same-origin'
        });

        let payload = {};
        try {
            payload = await response.json();
        } catch (error) {
            payload = {};
        }

        return { response, payload };
    }

    async function requestLocalLicenseRepair({ deviceCode = '', activationCode = '' } = {}) {
        const response = await fetch(LOCAL_LICENSE_ADMIN_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            cache: 'no-store',
            credentials: 'same-origin',
            body: JSON.stringify({
                action: 'repair',
                deviceCode,
                activationCode
            })
        });

        let payload = {};
        try {
            payload = await response.json();
        } catch (error) {
            payload = {};
        }

        return { response, payload };
    }

    async function requestLocalLicenseRevoke(activationCode) {
        const response = await fetch(LOCAL_LICENSE_ADMIN_ENDPOINT, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            cache: 'no-store',
            credentials: 'same-origin',
            body: JSON.stringify({ activationCode })
        });

        let payload = {};
        try {
            payload = await response.json();
        } catch (error) {
            payload = {};
        }

        return { response, payload };
    }

    function readStoredActivationCode() {
        const stored = normalizeActivationCode(safeStorageGet(ACTIVATION_CODE_STORAGE_KEY));
        state.lastKnownCode = stored;
        return stored;
    }

    function saveActivationCode(code) {
        const normalized = normalizeActivationCode(code);
        state.lastKnownCode = normalized;
        safeStorageSet(ACTIVATION_CODE_STORAGE_KEY, normalized);
    }

    function clearActivationCode() {
        state.lastKnownCode = '';
        safeStorageRemove(ACTIVATION_CODE_STORAGE_KEY);
    }

    function readLocalIssuedActivationCode() {
        const refs = getDom();
        return normalizeActivationCode(refs.localIssuedCode && refs.localIssuedCode.value);
    }

    function renderLocalLicenseEntries(entries) {
        const refs = getDom();
        if (!refs.localLicenseList) return;
        const list = Array.isArray(entries) ? entries : [];
        refs.localLicenseList.innerHTML = '';
        list.forEach(entry => {
            const item = document.createElement('li');
            item.className = 'activation-local-license-item';
            item.innerHTML = `
                <strong class="activation-local-license-code">${entry.activationCode || ''}</strong>
                <span class="activation-local-license-meta">Device ${entry.initialDeviceCode || '------------'} · Status ${entry.status || 'issued'}</span>
                <span class="activation-local-license-meta">${entry.issuedAt ? new Date(entry.issuedAt).toLocaleString() : '-'}</span>
                <div class="activation-local-license-actions">
                    <button type="button" data-local-license-copy="${entry.activationCode || ''}">Copy</button>
                    <button type="button" data-local-license-fill="${entry.activationCode || ''}">Use this key</button>
                    <button type="button" data-local-license-repair="${entry.activationCode || ''}">Fix</button>
                    <button type="button" data-local-license-revoke="${entry.activationCode || ''}">Revoke</button>
                </div>
            `;
            refs.localLicenseList.appendChild(item);
        });
    }

    function scheduleHeartbeat() {
        if (state.heartbeatTimer) window.clearInterval(state.heartbeatTimer);
        state.heartbeatTimer = window.setInterval(() => {
            if (!document.body.classList.contains('activation-ready')) return;
            const storedCode = readStoredActivationCode();
            if (!storedCode) return;
            void verifyCurrentDevice('heartbeat', true);
        }, HEARTBEAT_INTERVAL_MS);
    }

    function handleDeniedAccess(payload) {
        clearActivationCode();
        if (payload && payload.status === 'kicked') {
            renderGate('kicked', payload.message || '');
        } else {
            renderGate('required', payload && payload.message
                ? payload.message
                : 'This activation key cannot be used right now. Please try another key.');
        }
        focusActivationInput();
    }

    async function issueLocalActivationCode(autoActivate = false) {
        if (!isLocalDevelopmentHost() || state.busy) return;
        const refs = getDom();
        const issueDeviceCode = normalizeDeviceCode(refs.localIssueInput && refs.localIssueInput.value);

        if (issueDeviceCode.length !== 12) {
            setLocalIssueFeedback('Enter a valid 12-character device code first.', 'error');
            refs.localIssueInput && refs.localIssueInput.focus();
            return;
        }

        if (refs.localIssueInput) refs.localIssueInput.value = issueDeviceCode;
        if (autoActivate && issueDeviceCode !== state.deviceCode) {
            setLocalIssueFeedback('"Generate and enter" only works for this browser device.', 'error');
            refs.localIssueInput && refs.localIssueInput.focus();
            return;
        }

        let handOffToActivation = false;
        setBusy(true, getSubmitButtonLabel());
        setLocalIssueFeedback(
            autoActivate
                ? 'Issuing an activation key for this browser device...'
                : 'Issuing an activation key from the device code...',
            'muted'
        );

        try {
            const result = await requestLocalIssue(issueDeviceCode);
            if (!result.response.ok) {
                if (result.response.status === 409 && result.payload && result.payload.activationCode) {
                    if (refs.localIssuedCode) refs.localIssuedCode.value = normalizeActivationCode(result.payload.activationCode);
                    if (refs.input) refs.input.value = normalizeActivationCode(result.payload.activationCode);
                    renderLocalLicenseEntries([result.payload]);
                }
                setLocalIssueFeedback(
                    result.payload && result.payload.message
                        ? result.payload.message
                        : 'Local key issuance failed.',
                    'error'
                );
                return;
            }

            const activationCode = normalizeActivationCode(result.payload && result.payload.activationCode);
            if (!activationCode) {
                setLocalIssueFeedback('The local issuer did not return a valid activation key.', 'error');
                return;
            }

            if (refs.localIssuedCode) refs.localIssuedCode.value = activationCode;
            if (refs.input) refs.input.value = activationCode;
            renderLocalLicenseEntries([result.payload]);

            if (autoActivate) {
                setLocalIssueFeedback('Activation key generated. Entering now...', 'success');
                handOffToActivation = true;
                setBusy(false, getSubmitButtonLabel());
                await activateCurrentDevice();
                return;
            }

            setLocalIssueFeedback('Activation key generated and filled into the main input.', 'success');
        } catch (error) {
            setLocalIssueFeedback('Local key issuance is temporarily unavailable.', 'error');
        } finally {
            if (!handOffToActivation) setBusy(false, getSubmitButtonLabel());
        }
    }

    async function lookupLocalDuplicates() {
        if (!isLocalDevelopmentHost() || state.busy) return;
        const refs = getDom();
        const deviceCode = normalizeDeviceCode(refs.localIssueInput && refs.localIssueInput.value);
        const activationCode = readLocalIssuedActivationCode();
        const useActivationLookup = activationCode && deviceCode.length !== 12;

        if (!useActivationLookup && deviceCode.length !== 12) {
            setLocalIssueFeedback('Enter a device code or keep a generated key in the result box first.', 'error');
            refs.localIssueInput && refs.localIssueInput.focus();
            return;
        }

        setBusy(true, getSubmitButtonLabel());
        setLocalIssueFeedback('Checking duplicate activation records...', 'muted');

        try {
            const result = await requestLocalLicenseLookup({
                deviceCode,
                activationCode,
                expandDevice: useActivationLookup
            });

            if (!result.response.ok) {
                setLocalIssueFeedback(result.payload && result.payload.message ? result.payload.message : 'Duplicate lookup failed.', 'error');
                return;
            }

            if (result.payload.deviceCode && refs.localIssueInput) refs.localIssueInput.value = result.payload.deviceCode;
            renderLocalLicenseEntries(result.payload.entries);
            setLocalIssueFeedback(`Found ${result.payload.duplicateCount || 0} related record(s).`, (result.payload.duplicateCount || 0) > 1 ? 'error' : 'success');
        } catch (error) {
            setLocalIssueFeedback('Duplicate lookup is temporarily unavailable.', 'error');
        } finally {
            setBusy(false, getSubmitButtonLabel());
        }
    }

    async function repairLocalDuplicates(activationCodeOverride = '') {
        if (!isLocalDevelopmentHost() || state.busy) return;
        const refs = getDom();
        const deviceCode = normalizeDeviceCode(refs.localIssueInput && refs.localIssueInput.value);
        const activationCode = normalizeActivationCode(activationCodeOverride || readLocalIssuedActivationCode());

        if (deviceCode.length !== 12 && !activationCode) {
            setLocalIssueFeedback('Enter a device code or keep a generated key in the result box first.', 'error');
            refs.localIssueInput && refs.localIssueInput.focus();
            return;
        }

        setBusy(true, getSubmitButtonLabel());
        setLocalIssueFeedback('Repairing duplicate records and issuing a new key...', 'muted');

        try {
            const result = await requestLocalLicenseRepair({ deviceCode, activationCode });
            if (!result.response.ok) {
                setLocalIssueFeedback(result.payload && result.payload.message ? result.payload.message : 'Duplicate repair failed.', 'error');
                return;
            }

            const nextCode = normalizeActivationCode(result.payload && result.payload.entry && result.payload.entry.activationCode);
            if (result.payload.deviceCode && refs.localIssueInput) refs.localIssueInput.value = result.payload.deviceCode;
            if (nextCode) {
                if (refs.localIssuedCode) refs.localIssuedCode.value = nextCode;
                if (refs.input) refs.input.value = nextCode;
            }
            renderLocalLicenseEntries(result.payload.entry ? [result.payload.entry] : []);
            setLocalIssueFeedback(`Revoked ${result.payload.revokedCount || 0} old record(s) and issued 1 new key.`, 'success');
        } catch (error) {
            setLocalIssueFeedback('Duplicate repair is temporarily unavailable.', 'error');
        } finally {
            setBusy(false, getSubmitButtonLabel());
        }
    }

    async function revokeLocalActivationCode(activationCodeOverride = '') {
        if (!isLocalDevelopmentHost() || state.busy) return;
        const refs = getDom();
        const activationCode = normalizeActivationCode(activationCodeOverride || readLocalIssuedActivationCode());

        if (!activationCode) {
            setLocalIssueFeedback('Keep a generated activation key in the result box first.', 'error');
            return;
        }

        setBusy(true, getSubmitButtonLabel());
        setLocalIssueFeedback('Revoking activation key...', 'muted');

        try {
            const result = await requestLocalLicenseRevoke(activationCode);
            if (!result.response.ok) {
                setLocalIssueFeedback(result.payload && result.payload.message ? result.payload.message : 'Revoke failed.', 'error');
                return;
            }

            renderLocalLicenseEntries(result.payload.entry ? [result.payload.entry] : []);
            setLocalIssueFeedback('Activation key revoked. It can no longer be used.', 'success');
        } catch (error) {
            setLocalIssueFeedback('Revoke is temporarily unavailable.', 'error');
        } finally {
            setBusy(false, getSubmitButtonLabel());
        }
    }

    async function activateCurrentDevice() {
        if (state.busy) return;
        const refs = getDom();
        const activationCode = normalizeActivationCode(refs.input && refs.input.value);

        if (!activationCode) {
            setFeedback('Enter a valid activation key first.', 'error');
            focusActivationInput();
            return;
        }

        if (refs.input) refs.input.value = activationCode;
        setBusy(true, 'Processing...');
        setFeedback('Submitting device access request...', 'muted');

        try {
            const result = await requestAuth('activate', activationCode, 'manual-activate');
            if (result.response.ok) {
                saveActivationCode(activationCode);
                hideGate();
                scheduleHeartbeat();
                return;
            }

            if (result.response.status === 403) {
                handleDeniedAccess(result.payload);
                return;
            }

            renderGate('required', result.payload && result.payload.message
                ? result.payload.message
                : 'Activation failed. Check the activation key and try again.');
            focusActivationInput();
        } catch (error) {
            renderGate('required', 'The activation service is temporarily unavailable.');
            focusActivationInput();
        } finally {
            setBusy(false, getSubmitButtonLabel());
        }
    }

    async function verifyCurrentDevice(reason = 'manual-verify', silent = false) {
        if (state.busy && !silent) return false;
        const storedCode = readStoredActivationCode();

        if (!storedCode) {
            renderGate('required', 'No stored activation key was found in this browser.');
            focusActivationInput();
            return false;
        }

        if (!silent) {
            renderGate('booting', 'Checking whether this device still owns the activation key...');
            setBusy(true, 'Checking...');
        }

        try {
            const result = await requestAuth('verify', storedCode, reason);
            if (result.response.ok) {
                hideGate();
                scheduleHeartbeat();
                return true;
            }

            if (result.response.status === 403) {
                if (!silent) handleDeniedAccess(result.payload);
                else clearActivationCode();
                return false;
            }

            if (!silent) {
                renderGate('required', result.payload && result.payload.message
                    ? result.payload.message
                    : 'Device verification failed. Re-enter the activation key.');
                focusActivationInput();
            }
            return false;
        } catch (error) {
            if (!silent) {
                renderGate('required', 'The verification service is temporarily unavailable.');
                focusActivationInput();
            }
            return false;
        } finally {
            if (!silent) setBusy(false, getSubmitButtonLabel());
        }
    }

    function bindActivationEvents() {
        const refs = getDom();
        if (!refs.gate || refs.gate.dataset.bound === 'true') return;
        refs.gate.dataset.bound = 'true';

        refs.copyButton && refs.copyButton.addEventListener('click', async event => {
            event.preventDefault();
            const copied = await copyText(state.deviceCode);
            setFeedback(copied ? 'Device code copied.' : 'Copy failed. Please copy the device code manually.', copied ? 'success' : 'error');
        });

        refs.copySupportButton && refs.copySupportButton.addEventListener('click', async event => {
            event.preventDefault();
            const copied = await copyText(refs.supportNumber && refs.supportNumber.textContent);
            setFeedback(copied ? 'Support group number copied.' : 'Copy failed. Please copy the support number manually.', copied ? 'success' : 'error');
        });

        refs.localIssueButton && refs.localIssueButton.addEventListener('click', event => {
            event.preventDefault();
            void issueLocalActivationCode(false);
        });

        refs.localActivateButton && refs.localActivateButton.addEventListener('click', event => {
            event.preventDefault();
            void issueLocalActivationCode(true);
        });

        refs.localCopyCodeButton && refs.localCopyCodeButton.addEventListener('click', async event => {
            event.preventDefault();
            const copied = await copyText(refs.localIssuedCode && refs.localIssuedCode.value);
            setLocalIssueFeedback(copied ? 'Activation key copied.' : 'Copy failed. Please copy the activation key manually.', copied ? 'success' : 'error');
        });

        refs.localCheckDuplicatesButton && refs.localCheckDuplicatesButton.addEventListener('click', event => {
            event.preventDefault();
            void lookupLocalDuplicates();
        });

        refs.localFixDuplicatesButton && refs.localFixDuplicatesButton.addEventListener('click', event => {
            event.preventDefault();
            void repairLocalDuplicates();
        });

        refs.localRevokeButton && refs.localRevokeButton.addEventListener('click', event => {
            event.preventDefault();
            void revokeLocalActivationCode();
        });

        refs.submit && refs.submit.addEventListener('click', event => {
            event.preventDefault();
            void activateCurrentDevice();
        });

        refs.verifyButton && refs.verifyButton.addEventListener('click', event => {
            event.preventDefault();
            void verifyCurrentDevice('manual-verify');
        });

        refs.input && refs.input.addEventListener('input', event => {
            const nextValue = normalizeActivationCode(event.target.value);
            if (event.target.value !== nextValue) event.target.value = nextValue;
        });

        refs.input && refs.input.addEventListener('keydown', event => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            void activateCurrentDevice();
        });

        refs.localIssueInput && refs.localIssueInput.addEventListener('input', event => {
            const nextValue = normalizeDeviceCode(event.target.value);
            if (event.target.value !== nextValue) event.target.value = nextValue;
        });

        refs.localIssueInput && refs.localIssueInput.addEventListener('keydown', event => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            void issueLocalActivationCode(false);
        });

        refs.localLicenseList && refs.localLicenseList.addEventListener('click', event => {
            const button = event.target.closest('button');
            if (!button) return;
            event.preventDefault();
            const refsNow = getDom();
            const copyCode = button.getAttribute('data-local-license-copy');
            const fillCode = button.getAttribute('data-local-license-fill');
            const repairCode = button.getAttribute('data-local-license-repair');
            const revokeCode = button.getAttribute('data-local-license-revoke');

            if (copyCode) {
                void copyText(copyCode).then(copied => {
                    setLocalIssueFeedback(copied ? 'Activation key copied.' : 'Copy failed. Please copy the activation key manually.', copied ? 'success' : 'error');
                });
                return;
            }

            if (fillCode) {
                if (refsNow.localIssuedCode) refsNow.localIssuedCode.value = fillCode;
                if (refsNow.input) refsNow.input.value = fillCode;
                setLocalIssueFeedback('Activation key filled into both inputs.', 'success');
                return;
            }

            if (repairCode) {
                void repairLocalDuplicates(repairCode);
                return;
            }

            if (revokeCode) {
                void revokeLocalActivationCode(revokeCode);
            }
        });

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) return;
            if (!document.body.classList.contains('activation-ready')) return;
            void verifyCurrentDevice('visibility', true);
        });

        window.addEventListener('focus', () => {
            if (!document.body.classList.contains('activation-ready')) return;
            void verifyCurrentDevice('focus', true);
        });

        window.addEventListener('online', () => {
            if (!document.body.classList.contains('activation-ready')) return;
            void verifyCurrentDevice('online', true);
        });
    }

    function initActivationGate() {
        ensureLocalDevelopmentPanel();
        const refs = getDom();
        if (!refs.gate) return;

        state.deviceCode = generateDeviceCode();
        if (refs.deviceCode) refs.deviceCode.textContent = state.deviceCode;
        if (refs.localIssueInput && !normalizeDeviceCode(refs.localIssueInput.value)) {
            refs.localIssueInput.value = state.deviceCode;
        }
        bindActivationEvents();
        scheduleHeartbeat();

        if (readStoredActivationCode()) {
            renderGate('booting', 'Checking stored activation key...');
            void verifyCurrentDevice('boot');
            return;
        }

        renderGate('required', 'Copy the device code, issue a key, then activate this device.');
        focusActivationInput();
    }

    window.rinnoActivation = {
        getDeviceCode: () => state.deviceCode,
        verifyNow: () => verifyCurrentDevice('external-verify'),
        issueLocalKey: () => issueLocalActivationCode(false),
        kickCurrentDevice: message => {
            clearActivationCode();
            renderGate('kicked', message || 'This device no longer owns the activation key.');
            focusActivationInput();
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initActivationGate, { once: true });
    } else {
        initActivationGate();
    }
})();
