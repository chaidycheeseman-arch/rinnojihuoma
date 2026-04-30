(() => {
    const DEFAULT_REMOTE_LICENSE_API_BASE = 'https://rinno520.netlify.app';

    function normalizeLicenseApiBase(value) {
        const source = String(value || '').trim();
        if (!source) return '';
        try {
            const url = new URL(source, window.location.href);
            return `${url.origin}${url.pathname}`.replace(/\/+$/, '');
        } catch (error) {
            return '';
        }
    }

    function isFrontendHostNeedingRemoteApi(hostname) {
        const host = String(hostname || '').trim().toLowerCase();
        return host === 'rinno.netlify.app';
    }

    function resolveIssuerApiBase() {
        const params = new URLSearchParams(window.location.search);
        const configuredBase = normalizeLicenseApiBase(
            params.get('licenseApiBase')
            || window.__RINNO_LICENSE_API_BASE__
            || window.RINNO_LICENSE_API_BASE
        );
        if (configuredBase) return configuredBase;
        return isFrontendHostNeedingRemoteApi(window.location.hostname)
            ? DEFAULT_REMOTE_LICENSE_API_BASE
            : '';
    }

    function resolveIssuerApiUrl(pathname) {
        const normalizedPath = String(pathname || '').trim();
        if (!normalizedPath) return resolveIssuerApiBase();
        if (/^https?:\/\//i.test(normalizedPath)) return normalizedPath;
        const path = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
        const base = resolveIssuerApiBase();
        return base ? `${base}${path}` : path;
    }

    const SESSION_ENDPOINT = resolveIssuerApiUrl('/.netlify/functions/admin-session');
    const ISSUE_ENDPOINT = resolveIssuerApiUrl('/.netlify/functions/generate-code');
    const LICENSES_ENDPOINT = resolveIssuerApiUrl('/.netlify/functions/admin-licenses');
    const AUDIT_ENDPOINT = resolveIssuerApiUrl('/.netlify/functions/admin-audit');
    const USERS_ENDPOINT = resolveIssuerApiUrl('/.netlify/functions/admin-users');
    const PASSWORD_ENDPOINT = resolveIssuerApiUrl('/.netlify/functions/admin-password');
    const AUDIT_LIMIT = 100;
    const DEVICE_CODE_LENGTH = 16;
    const DEVICE_CODE_GROUP_LENGTH = 4;
    const DEVICE_CODE_PLACEHOLDER = 'XXXX-XXXX-XXXX-XXXX';
    const state = {
        authenticated: false,
        account: null,
        sessionBusy: false,
        issueBusy: false,
        adminBusy: false,
        passwordBusy: false,
        auditBusy: false,
        licenseBusy: false,
        lastIssuedCode: '',
        lastRenderedCode: '',
        lastLicenseEntries: [],
        lastLicenseLookupMode: '',
        lastLicenseLookupDeviceCode: '',
        lastLicenseLookupActivationCode: '',
        activeModalCode: ''
    };

    let dom = null;
    let resultCodeLookupTimer = 0;

    function normalizeDeviceCode(value) {
        return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, DEVICE_CODE_LENGTH);
    }

    function isSupportedDeviceCode(value) {
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

    function normalizeActivationCode(value) {
        return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 64);
    }

    function normalizeEmail(value) {
        return String(value || '').trim().toLowerCase().slice(0, 160);
    }

    function getDom() {
        if (dom) return dom;
        dom = {
            sessionChip: document.getElementById('issuer-session-chip'),
            loginPanel: document.getElementById('issuer-login-panel'),
            sessionPanel: document.getElementById('issuer-session-panel'),
            currentEmail: document.getElementById('issuer-current-email'),
            currentRole: document.getElementById('issuer-current-role'),
            loginEmail: document.getElementById('issuer-admin-email'),
            loginPassword: document.getElementById('issuer-admin-password'),
            loginButton: document.getElementById('issuer-login'),
            logoutButton: document.getElementById('issuer-logout'),
            sessionFeedback: document.getElementById('issuer-session-feedback'),
            issuePanel: document.getElementById('issuer-issue-panel'),
            issuePanelNote: document.getElementById('issuer-issue-panel-note'),
            deviceCode: document.getElementById('issuer-device-code'),
            note: document.getElementById('issuer-note'),
            submit: document.getElementById('issuer-submit'),
            issueFeedback: document.getElementById('issuer-issue-feedback'),
            licenseFeedback: document.getElementById('issuer-license-feedback'),
            resultCode: document.getElementById('issuer-result-code'),
            resultMeta: document.getElementById('issuer-result-meta'),
            copy: document.getElementById('issuer-copy'),
            resultCheckDuplicatesButton: document.getElementById('issuer-result-check-duplicates'),
            resultFixDuplicatesButton: document.getElementById('issuer-result-fix-duplicates'),
            resultRevokeButton: document.getElementById('issuer-result-revoke'),
            checkDuplicatesButton: document.getElementById('issuer-check-duplicates'),
            fixDuplicatesButton: document.getElementById('issuer-fix-duplicates'),
            revokeButton: document.getElementById('issuer-revoke'),
            licenseList: document.getElementById('issuer-license-list'),
            adminCreatePanel: document.getElementById('issuer-admin-create-panel'),
            adminPanelNote: document.getElementById('issuer-admin-panel-note'),
            adminEmail: document.getElementById('issuer-new-admin-email'),
            adminName: document.getElementById('issuer-new-admin-name'),
            adminPassword: document.getElementById('issuer-new-admin-password'),
            createAdminButton: document.getElementById('issuer-create-admin'),
            adminFeedback: document.getElementById('issuer-admin-feedback'),
            adminEmpty: document.getElementById('issuer-admin-empty'),
            adminList: document.getElementById('issuer-admin-list'),
            passwordPanel: document.getElementById('issuer-password-panel'),
            currentPassword: document.getElementById('issuer-current-password'),
            nextPassword: document.getElementById('issuer-next-password'),
            confirmPassword: document.getElementById('issuer-confirm-password'),
            changePasswordButton: document.getElementById('issuer-change-password'),
            passwordFeedback: document.getElementById('issuer-password-feedback'),
            refreshAuditButton: document.getElementById('issuer-refresh-audit'),
            historyCheckDuplicatesButton: document.getElementById('issuer-history-check-duplicates'),
            historyFixDuplicatesButton: document.getElementById('issuer-history-fix-duplicates'),
            exportJsonButton: document.getElementById('issuer-export-json'),
            exportCsvButton: document.getElementById('issuer-export-csv'),
            auditFeedback: document.getElementById('issuer-audit-feedback'),
            auditEmpty: document.getElementById('issuer-audit-empty'),
            auditList: document.getElementById('issuer-audit-list'),
            licenseModal: document.getElementById('issuer-license-modal'),
            licenseModalCode: document.getElementById('issuer-license-modal-code'),
            licenseModalDevice: document.getElementById('issuer-license-modal-device'),
            licenseModalStatus: document.getElementById('issuer-license-modal-status'),
            licenseModalIssuedAt: document.getElementById('issuer-license-modal-issued-at'),
            licenseModalFeedback: document.getElementById('issuer-license-modal-feedback'),
            licenseModalCloseButton: document.getElementById('issuer-license-modal-close'),
            licenseModalRevokeButton: document.getElementById('issuer-license-modal-revoke')
        };
        return dom;
    }

    function clearResultCodeLookupTimer() {
        if (!resultCodeLookupTimer) return;
        window.clearTimeout(resultCodeLookupTimer);
        resultCodeLookupTimer = 0;
    }

    function rememberLicenseLookup(mode, { deviceCode = '', activationCode = '' } = {}) {
        state.lastLicenseLookupMode = String(mode || '');
        state.lastLicenseLookupDeviceCode = normalizeDeviceCode(deviceCode);
        state.lastLicenseLookupActivationCode = normalizeActivationCode(activationCode);
    }

    function syncLicenseControls() {
        const refs = getDom();
        const disabled = !state.authenticated || state.issueBusy || state.licenseBusy;
        const activeEntry = state.activeModalCode ? getLicenseEntryByCode(state.activeModalCode) : null;
        if (refs.resultCode) refs.resultCode.disabled = disabled;
        if (refs.resultCheckDuplicatesButton) refs.resultCheckDuplicatesButton.disabled = disabled;
        if (refs.resultFixDuplicatesButton) refs.resultFixDuplicatesButton.disabled = disabled;
        if (refs.resultRevokeButton) refs.resultRevokeButton.disabled = disabled;
        if (refs.checkDuplicatesButton) refs.checkDuplicatesButton.disabled = disabled;
        if (refs.fixDuplicatesButton) refs.fixDuplicatesButton.disabled = disabled;
        if (refs.revokeButton) refs.revokeButton.disabled = disabled;
        if (refs.historyCheckDuplicatesButton) refs.historyCheckDuplicatesButton.disabled = disabled;
        if (refs.historyFixDuplicatesButton) refs.historyFixDuplicatesButton.disabled = disabled;
        if (refs.licenseModalRevokeButton) refs.licenseModalRevokeButton.disabled = disabled || !state.activeModalCode || Boolean(activeEntry && activeEntry.status === 'revoked');
    }

    function canManageAdmins() {
        return Boolean(state.account) && state.account.role === 'founder';
    }

    function setFeedback(target, text, tone = '') {
        const refs = getDom();
        const node = ({
            session: refs.sessionFeedback,
            issue: refs.issueFeedback,
            admin: refs.adminFeedback,
            password: refs.passwordFeedback,
            audit: refs.auditFeedback,
            license: refs.licenseFeedback
        })[target];
        if (!node) return;
        node.textContent = String(text || '');
        if (tone) node.dataset.tone = tone;
        else delete node.dataset.tone;
    }

    function setSessionBusy(busy) {
        state.sessionBusy = Boolean(busy);
        const refs = getDom();
        if (refs.loginButton) {
            refs.loginButton.disabled = state.sessionBusy;
            refs.loginButton.textContent = state.sessionBusy ? '登录中...' : '登录后台';
        }
        if (refs.logoutButton) refs.logoutButton.disabled = state.sessionBusy;
        if (refs.loginEmail) refs.loginEmail.disabled = state.sessionBusy;
        if (refs.loginPassword) refs.loginPassword.disabled = state.sessionBusy;
    }

    function setIssueBusy(busy) {
        state.issueBusy = Boolean(busy);
        const refs = getDom();
        if (refs.submit) {
            refs.submit.disabled = state.issueBusy || !state.authenticated;
            refs.submit.textContent = state.issueBusy ? '签发中...' : '签发激活码';
        }
        if (refs.deviceCode) refs.deviceCode.disabled = state.issueBusy || !state.authenticated;
        if (refs.note) refs.note.disabled = state.issueBusy || !state.authenticated;
        if (refs.copy) refs.copy.disabled = state.issueBusy;
        if (refs.resultCheckDuplicatesButton) refs.resultCheckDuplicatesButton.disabled = state.issueBusy || !state.authenticated;
        if (refs.resultFixDuplicatesButton) refs.resultFixDuplicatesButton.disabled = state.issueBusy || !state.authenticated;
        if (refs.resultRevokeButton) refs.resultRevokeButton.disabled = state.issueBusy || !state.authenticated;
        syncLicenseControls();
    }

    function setAdminBusy(busy) {
        state.adminBusy = Boolean(busy);
        const refs = getDom();
        if (refs.createAdminButton) {
            refs.createAdminButton.disabled = state.adminBusy || !canManageAdmins();
            refs.createAdminButton.textContent = state.adminBusy ? '创建中...' : '新增管理员';
        }
        if (refs.adminEmail) refs.adminEmail.disabled = state.adminBusy || !canManageAdmins();
        if (refs.adminName) refs.adminName.disabled = state.adminBusy || !canManageAdmins();
        if (refs.adminPassword) refs.adminPassword.disabled = state.adminBusy || !canManageAdmins();
    }

    function setPasswordBusy(busy) {
        state.passwordBusy = Boolean(busy);
        const refs = getDom();
        if (refs.changePasswordButton) {
            refs.changePasswordButton.disabled = state.passwordBusy || !state.authenticated;
            refs.changePasswordButton.textContent = state.passwordBusy ? '更新中...' : '修改密码';
        }
        if (refs.currentPassword) refs.currentPassword.disabled = state.passwordBusy || !state.authenticated;
        if (refs.nextPassword) refs.nextPassword.disabled = state.passwordBusy || !state.authenticated;
        if (refs.confirmPassword) refs.confirmPassword.disabled = state.passwordBusy || !state.authenticated;
    }

    function setAuditBusy(busy) {
        state.auditBusy = Boolean(busy);
        const refs = getDom();
        if (refs.refreshAuditButton) refs.refreshAuditButton.disabled = state.auditBusy || !state.authenticated;
        if (refs.exportJsonButton) refs.exportJsonButton.disabled = state.auditBusy || !state.authenticated;
        if (refs.exportCsvButton) refs.exportCsvButton.disabled = state.auditBusy || !state.authenticated;
    }

    function setLicenseBusy(busy) {
        state.licenseBusy = Boolean(busy);
        const refs = getDom();
        if (refs.checkDuplicatesButton) refs.checkDuplicatesButton.disabled = state.licenseBusy || !state.authenticated;
        if (refs.fixDuplicatesButton) refs.fixDuplicatesButton.disabled = state.licenseBusy || !state.authenticated;
        if (refs.revokeButton) refs.revokeButton.disabled = state.licenseBusy || !state.authenticated;
        syncLicenseControls();
    }

    function clearSensitiveForms() {
        const refs = getDom();
        if (refs.loginPassword) refs.loginPassword.value = '';
        if (refs.currentPassword) refs.currentPassword.value = '';
        if (refs.nextPassword) refs.nextPassword.value = '';
        if (refs.confirmPassword) refs.confirmPassword.value = '';
        if (refs.adminPassword) refs.adminPassword.value = '';
    }

    function applySessionState(account) {
        const refs = getDom();
        state.account = account || null;
        state.authenticated = Boolean(state.account);

        if (refs.sessionChip) refs.sessionChip.textContent = state.authenticated ? '已登录' : '未登录';
        if (refs.loginPanel) refs.loginPanel.hidden = state.authenticated;
        if (refs.sessionPanel) refs.sessionPanel.hidden = !state.authenticated;
        if (refs.issuePanel) refs.issuePanel.hidden = false;
        if (refs.passwordPanel) refs.passwordPanel.hidden = !state.authenticated;
        if (refs.adminCreatePanel) refs.adminCreatePanel.hidden = !canManageAdmins();
        if (refs.issuePanelNote) {
            refs.issuePanelNote.textContent = state.authenticated
                ? '已经登录，可直接签发、查重、修正或注销。'
                : '先登录后台，然后就能使用一键查重复、一键修正和一键注销。';
        }
        if (refs.adminPanelNote) refs.adminPanelNote.textContent = canManageAdmins()
            ? '创始人账号可以创建新的管理员账号。'
            : '只有创始人账号可以新增管理员。';

        if (refs.currentEmail) refs.currentEmail.textContent = state.account ? state.account.email : '-';
        if (refs.currentRole) refs.currentRole.textContent = state.account ? `角色：${state.account.role}` : '-';

        if (!state.authenticated) {
            clearResultCodeLookupTimer();
            state.lastIssuedCode = '';
            state.lastRenderedCode = '';
            state.lastLicenseEntries = [];
            rememberLicenseLookup('');
            if (refs.resultCode) refs.resultCode.value = '';
            if (refs.resultMeta) refs.resultMeta.innerHTML = '';
            if (refs.licenseList) refs.licenseList.innerHTML = '';
            if (refs.adminList) refs.adminList.innerHTML = '';
            if (refs.auditList) refs.auditList.innerHTML = '';
            if (refs.adminEmpty) refs.adminEmpty.hidden = false;
            if (refs.auditEmpty) refs.auditEmpty.hidden = false;
            closeLicenseModal();
        }

        clearSensitiveForms();
        setIssueBusy(state.issueBusy);
        setAdminBusy(state.adminBusy);
        setPasswordBusy(state.passwordBusy);
        setAuditBusy(state.auditBusy);
        setLicenseBusy(state.licenseBusy);
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

    async function requestJson(url, options = {}) {
        const response = await fetch(url, {
            credentials: 'same-origin',
            cache: 'no-store',
            ...options
        });

        let payload = {};
        try {
            payload = await response.json();
        } catch (error) {
            payload = {};
        }

        return { response, payload };
    }

    async function requestText(url, options = {}) {
        const response = await fetch(url, {
            credentials: 'same-origin',
            cache: 'no-store',
            ...options
        });
        return {
            response,
            text: await response.text()
        };
    }

    function downloadFile(name, content, type) {
        const blob = new Blob([content], { type });
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = name;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(objectUrl);
    }

    function formatDateTime(value) {
        if (!value) return '-';
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return String(value);
        return parsed.toLocaleString();
    }

    function renderResult(payload) {
        const refs = getDom();
        state.lastIssuedCode = normalizeActivationCode(payload.activationCode);
        state.lastRenderedCode = state.lastIssuedCode;
        if (refs.resultCode) refs.resultCode.value = state.lastIssuedCode;
        if (refs.resultMeta) {
            refs.resultMeta.innerHTML = [
                payload.initialDeviceCode ? `<span class="issuer-chip">device ${getFormattedDeviceCode(payload.initialDeviceCode)}</span>` : '',
                payload.status ? `<span class="issuer-chip">status ${payload.status}</span>` : '',
                payload.issuedAt ? `<span class="issuer-chip">${formatDateTime(payload.issuedAt)}</span>` : ''
            ].filter(Boolean).join('');
        }
    }

    function readActiveDeviceCode() {
        const refs = getDom();
        return normalizeDeviceCode(refs.deviceCode && refs.deviceCode.value);
    }

    function readActiveActivationCode() {
        const refs = getDom();
        return normalizeActivationCode(String(
            (refs.resultCode && refs.resultCode.value)
            || state.lastIssuedCode
            || ''
        ));
    }

    function renderLicenseEntries(entries) {
        const refs = getDom();
        if (!refs.licenseList) return;
        const list = Array.isArray(entries)
            ? entries
                .filter(Boolean)
                .map(entry => ({
                    ...entry,
                    activationCode: normalizeActivationCode(entry.activationCode)
                }))
                .filter(entry => entry.activationCode)
            : [];
        state.lastLicenseEntries = list;
        refs.licenseList.innerHTML = '';
        list.forEach(entry => {
            const duplicateMeta = entry.duplicateCount > 1
                ? `<span class="issuer-item-meta">duplicate history ${entry.duplicateCount} - active ${entry.duplicateActiveCount || 0}</span>`
                : '';
            const item = document.createElement('li');
            item.className = 'issuer-item';
            item.dataset.licenseItem = 'true';
            item.dataset.licenseCode = entry.activationCode || '';
            item.tabIndex = 0;
            item.setAttribute('role', 'button');
            item.innerHTML = `
                <strong class="issuer-item-code">${entry.activationCode || ''}</strong>
                <span class="issuer-item-meta">Device ${getFormattedDeviceCode(entry.initialDeviceCode)} | Status ${entry.status || 'issued'}</span>
                <span class="issuer-item-meta">${formatDateTime(entry.issuedAt)}</span>
                ${duplicateMeta}
                <div class="issuer-item-actions">
                    <button class="issuer-button subtle" type="button" data-license-copy="${entry.activationCode || ''}">Copy</button>
                    <button class="issuer-button subtle" type="button" data-license-fill="${entry.activationCode || ''}">Use This</button>
                    <button class="issuer-button subtle" type="button" data-license-repair="${entry.activationCode || ''}">Fix</button>
                    <button class="issuer-button subtle" type="button" data-license-revoke="${entry.activationCode || ''}">Revoke</button>
                </div>
            `;
            refs.licenseList.appendChild(item);
        });
        refreshLicenseModal();
    }

    function getLicenseEntryByCode(activationCode) {
        const targetCode = normalizeActivationCode(activationCode);
        if (!targetCode) return null;
        return state.lastLicenseEntries.find(entry => normalizeActivationCode(entry.activationCode) === targetCode) || null;
    }

    function setLicenseModalFeedback(text, tone = '') {
        const refs = getDom();
        if (!refs.licenseModalFeedback) return;
        refs.licenseModalFeedback.textContent = String(text || '');
        if (tone) refs.licenseModalFeedback.dataset.tone = tone;
        else delete refs.licenseModalFeedback.dataset.tone;
    }

    function updateLicenseModal(entry) {
        const refs = getDom();
        const record = entry || getLicenseEntryByCode(state.activeModalCode);
        if (!refs.licenseModal || !record) {
            closeLicenseModal();
            return;
        }

        state.activeModalCode = normalizeActivationCode(record.activationCode);
        if (refs.licenseModalCode) refs.licenseModalCode.textContent = record.activationCode || '-';
        if (refs.licenseModalDevice) refs.licenseModalDevice.textContent = getFormattedDeviceCode(record.initialDeviceCode);
        if (refs.licenseModalStatus) refs.licenseModalStatus.textContent = record.status || 'issued';
        if (refs.licenseModalIssuedAt) refs.licenseModalIssuedAt.textContent = formatDateTime(record.issuedAt);
        if (refs.licenseModalRevokeButton) refs.licenseModalRevokeButton.textContent = record.status === 'revoked' ? 'Already Revoked' : 'Revoke Record';
        setLicenseModalFeedback(record.status === 'revoked' ? 'This activation record has already been revoked.' : '', record.status === 'revoked' ? 'muted' : '');
        syncLicenseControls();
    }

    function openLicenseModal(entryOrCode) {
        const refs = getDom();
        if (!refs.licenseModal) return;
        const record = typeof entryOrCode === 'string' ? getLicenseEntryByCode(entryOrCode) : entryOrCode;
        if (!record) return;
        refs.licenseModal.hidden = false;
        document.body.style.overflow = 'hidden';
        updateLicenseModal(record);
    }

    function closeLicenseModal() {
        const refs = getDom();
        state.activeModalCode = '';
        if (refs.licenseModal) refs.licenseModal.hidden = true;
        if (refs.licenseModalCode) refs.licenseModalCode.textContent = '-';
        if (refs.licenseModalDevice) refs.licenseModalDevice.textContent = '-';
        if (refs.licenseModalStatus) refs.licenseModalStatus.textContent = '-';
        if (refs.licenseModalIssuedAt) refs.licenseModalIssuedAt.textContent = '-';
        if (refs.licenseModalRevokeButton) refs.licenseModalRevokeButton.textContent = 'Revoke Record';
        document.body.style.overflow = '';
        setLicenseModalFeedback('', '');
        syncLicenseControls();
    }

    function refreshLicenseModal() {
        if (!state.activeModalCode) return;
        const record = getLicenseEntryByCode(state.activeModalCode);
        if (!record) {
            closeLicenseModal();
            return;
        }
        updateLicenseModal(record);
    }

    function renderAccounts(accounts) {
        const refs = getDom();
        const list = Array.isArray(accounts) ? accounts : [];
        if (!refs.adminList || !refs.adminEmpty) return;
        refs.adminList.innerHTML = '';
        refs.adminEmpty.hidden = list.length > 0;
        if (!list.length) return;

        list.forEach(account => {
            const item = document.createElement('li');
            item.className = 'issuer-item';
            item.innerHTML = `
                <strong class="issuer-item-code">${account.email || ''}</strong>
                <span class="issuer-item-meta">角色 ${account.role || 'admin'}${account.displayName ? ` · ${account.displayName}` : ''}</span>
                <span class="issuer-item-meta">创建于 ${account.createdAt ? new Date(account.createdAt).toLocaleString() : '-'}</span>
            `;
            refs.adminList.appendChild(item);
        });
    }

    function renderAudit(entries) {
        const refs = getDom();
        const list = Array.isArray(entries) ? entries : [];
        if (!refs.auditList || !refs.auditEmpty) return;
        refs.auditList.innerHTML = '';
        refs.auditEmpty.hidden = list.length > 0;
        if (!list.length) return;

        list.forEach(entry => {
            const item = document.createElement('li');
            item.className = 'issuer-item';
            item.innerHTML = `
                <strong class="issuer-item-code">${entry.activationCode || entry.type || 'audit'}</strong>
                <span class="issuer-item-meta">${entry.type || 'audit'} · ${entry.outcome || 'unknown'}${entry.actorEmail ? ` · ${entry.actorEmail}` : ''}</span>
                <span class="issuer-item-meta">设备码 ${entry.initialDeviceCode || '------------'}${entry.targetEmail ? ` · 目标 ${entry.targetEmail}` : ''}${entry.note ? ` · ${entry.note}` : ''}</span>
                <span class="issuer-item-meta">${entry.at ? new Date(entry.at).toLocaleString() : ''}</span>
            `;
            refs.auditList.appendChild(item);
        });
    }

    async function loadAccounts() {
        if (!state.authenticated) return;
        const result = await requestJson(USERS_ENDPOINT, {
            method: 'GET',
            headers: {
                Accept: 'application/json'
            }
        });

        if (!result.response.ok) {
            if (result.response.status === 403) {
                applySessionState(null);
                setFeedback('session', '管理员会话已失效，请重新登录。', 'error');
            }
            return;
        }

        renderAccounts(result.payload.accounts);
    }

    async function loadAudit() {
        if (!state.authenticated || state.auditBusy) return;
        setAuditBusy(true);
        setFeedback('audit', '正在加载审计日志...', 'muted');

        try {
            const result = await requestJson(`${AUDIT_ENDPOINT}?limit=${AUDIT_LIMIT}`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json'
                }
            });

            if (!result.response.ok) {
                if (result.response.status === 403) {
                    applySessionState(null);
                    setFeedback('session', '管理员会话已过期，请重新登录。', 'error');
                }
                setFeedback('audit', result.payload && result.payload.message ? result.payload.message : '审计日志加载失败。', 'error');
                return;
            }

            renderAudit(result.payload.entries);
            setFeedback('audit', '审计日志已刷新。', 'success');
        } catch (error) {
            setFeedback('audit', '审计日志暂时不可用。', 'error');
        } finally {
            setAuditBusy(false);
        }
    }

    async function refreshSession() {
        setFeedback('session', '正在检查管理员会话...', 'muted');

        try {
            const result = await requestJson(SESSION_ENDPOINT, {
                method: 'GET',
                headers: {
                    Accept: 'application/json'
                }
            });

            applySessionState(result.payload && result.payload.authenticated ? result.payload.account : null);
            setFeedback('session', state.authenticated ? '管理员会话有效。' : '请先登录后台。', state.authenticated ? 'success' : 'muted');
            if (state.authenticated) {
                await Promise.all([loadAccounts(), loadAudit()]);
            }
        } catch (error) {
            applySessionState(null);
            setFeedback('session', '无法连接管理员后台。', 'error');
        }
    }

    async function loginAdmin() {
        if (state.sessionBusy) return;
        const refs = getDom();
        const email = normalizeEmail(refs.loginEmail && refs.loginEmail.value);
        const password = String(refs.loginPassword && refs.loginPassword.value || '').trim();

        if (!email || !password) {
            setFeedback('session', '请输入管理员邮箱和密码。', 'error');
            return;
        }

        setSessionBusy(true);
        setFeedback('session', '正在建立管理员会话...', 'muted');

        try {
            const result = await requestJson(SESSION_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (!result.response.ok) {
                applySessionState(null);
                setFeedback('session', result.payload && result.payload.message ? result.payload.message : '管理员登录失败。', 'error');
                return;
            }

            applySessionState(result.payload.account || null);
            setFeedback('session', '管理员已登录。', 'success');
            await Promise.all([loadAccounts(), loadAudit()]);
        } catch (error) {
            applySessionState(null);
            setFeedback('session', '管理员后台暂时不可用。', 'error');
        } finally {
            setSessionBusy(false);
        }
    }

    async function logoutAdmin() {
        if (state.sessionBusy) return;
        setSessionBusy(true);
        setFeedback('session', '正在退出管理员会话...', 'muted');

        try {
            await requestJson(SESSION_ENDPOINT, {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json'
                }
            });
        } catch (error) {
            // Ignore network issues and clear the local state anyway.
        } finally {
            applySessionState(null);
            setSessionBusy(false);
            setFeedback('session', '管理员已退出。', 'muted');
        }
    }

    async function issueActivationCode() {
        if (!state.authenticated || state.issueBusy) return;
        const refs = getDom();
        const deviceCode = normalizeDeviceCode(refs.deviceCode && refs.deviceCode.value);
        const note = String(refs.note && refs.note.value || '').trim().slice(0, 120);

        if (!isSupportedDeviceCode(deviceCode)) {
            setFeedback('issue', 'Enter a valid device code. New format: XXXX-XXXX-XXXX-XXXX.', 'error');
            refs.deviceCode && refs.deviceCode.focus();
            return;
        }

        if (refs.deviceCode) refs.deviceCode.value = formatDeviceCode(deviceCode);
        setIssueBusy(true);
        setFeedback('issue', '正在签发激活码...', 'muted');

        try {
            const result = await requestJson(ISSUE_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                body: JSON.stringify({
                    deviceCode,
                    note
                })
            });

            if (!result.response.ok) {
                if (result.response.status === 403) {
                    applySessionState(null);
                    setFeedback('session', '管理员会话已失效，请重新登录。', 'error');
                }
                if (result.response.status === 409 && result.payload && result.payload.activationCode) {
                    renderResult(result.payload);
                    renderLicenseEntries([result.payload]);
                    setFeedback('license', `查到 ${result.payload.duplicateCount || 1} 条重复记录。`, 'error');
                }
                setFeedback('issue', result.payload && result.payload.message ? result.payload.message : '签发失败，请稍后重试。', 'error');
                return;
            }

            renderResult(result.payload);
            renderLicenseEntries([result.payload]);
            setFeedback('issue', '激活码已签发，可以复制给用户了。', 'success');
            setFeedback('license', '', '');
            await loadAudit();
        } catch (error) {
            setFeedback('issue', '后台暂时不可用，请稍后重试。', 'error');
        } finally {
            setIssueBusy(false);
        }
    }

    async function lookupDuplicates() {
        if (!state.authenticated || state.licenseBusy) return;
        const refs = getDom();
        const deviceCode = readActiveDeviceCode();
        const activationCode = readActiveActivationCode();
        const useActivationLookup = activationCode && !isSupportedDeviceCode(deviceCode);
        const useHistoryLookup = !useActivationLookup && deviceCode.length === 0;
        if (!useHistoryLookup && !useActivationLookup && !isSupportedDeviceCode(deviceCode)) {
            setFeedback('license', '请先输入设备码，或先在结果框里保留已生成的激活码。', 'error');
            return;
        }

        setLicenseBusy(true);
        setFeedback('license', '正在查询重复记录...', 'muted');

        try {
            const query = useHistoryLookup
                ? 'duplicates=true&includeRevoked=true&maxGroups=50&maxEntries=500'
                : useActivationLookup
                    ? `activationCode=${encodeURIComponent(activationCode)}&expandDevice=true&includeRevoked=true&limit=20`
                    : `deviceCode=${encodeURIComponent(deviceCode)}&includeRevoked=true&limit=20`;
            const result = await requestJson(`${LICENSES_ENDPOINT}?${query}`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json'
                }
            });

            if (!result.response.ok) {
                if (result.response.status === 403) {
                    applySessionState(null);
                    setFeedback('session', '管理员会话已失效，请重新登录。', 'error');
                }
                setFeedback('license', result.payload && result.payload.message ? result.payload.message : '查询失败。', 'error');
                return;
            }

            renderLicenseEntries(result.payload.entries);
            if (result.payload.deviceCode && refs.deviceCode) refs.deviceCode.value = formatDeviceCode(result.payload.deviceCode);
            if (useHistoryLookup) {
                const totalGroups = Number(result.payload.totalGroups) || 0;
                const totalEntries = Number(result.payload.totalEntries) || 0;
                setFeedback('license', `History scan found ${totalGroups} duplicate group(s) and ${totalEntries} related record(s).`, totalGroups > 0 ? 'error' : 'success');
                return;
            }
            setFeedback('license', `查到 ${result.payload.duplicateCount || 0} 条相关记录。`, result.payload.duplicateCount > 1 ? 'error' : 'success');
        } catch (error) {
            setFeedback('license', '重复查询暂时不可用。', 'error');
        } finally {
            setLicenseBusy(false);
        }
    }

    async function revokeActivationCode(activationCode) {
        if (!state.authenticated || state.licenseBusy) return;
        const targetCode = String(activationCode || readActiveActivationCode()).trim().toUpperCase();
        if (!targetCode) {
            setFeedback('license', '请先生成、查询或填入一个激活码。', 'error');
            return;
        }

        setLicenseBusy(true);
        setFeedback('license', '正在注销激活码...', 'muted');

        try {
            const result = await requestJson(LICENSES_ENDPOINT, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                body: JSON.stringify({
                    activationCode: targetCode
                })
            });

            if (!result.response.ok) {
                if (result.response.status === 403) {
                    applySessionState(null);
                    setFeedback('session', '管理员会话已失效，请重新登录。', 'error');
                }
                setFeedback('license', result.payload && result.payload.message ? result.payload.message : '注销失败。', 'error');
                return;
            }

            renderResult(result.payload.entry || { activationCode: targetCode });
            renderLicenseEntries(result.payload.entry ? [result.payload.entry] : []);
            setFeedback('license', '激活码已注销，后续不允许再使用。', 'success');
            await loadAudit();
        } catch (error) {
            setFeedback('license', '注销暂时不可用。', 'error');
        } finally {
            setLicenseBusy(false);
        }
    }

    async function repairDuplicateLicenses(activationCodeOverride = '') {
        if (!state.authenticated || state.licenseBusy) return;
        const refs = getDom();
        const deviceCode = readActiveDeviceCode();
        const activationCode = normalizeActivationCode(activationCodeOverride || readActiveActivationCode());
        if (!isSupportedDeviceCode(deviceCode) && !activationCode) {
            setFeedback('license', '请先输入设备码，或先在结果框里保留已生成的激活码。', 'error');
            return;
        }

        setLicenseBusy(true);
        setFeedback('license', '正在修正重复记录并重新生成激活码...', 'muted');

        try {
            const result = await requestJson(LICENSES_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                body: JSON.stringify({
                    action: 'repair',
                    deviceCode,
                    activationCode
                })
            });

            if (!result.response.ok) {
                if (result.response.status === 403) {
                    applySessionState(null);
                    setFeedback('session', '管理员会话已失效，请重新登录。', 'error');
                }
                setFeedback('license', result.payload && result.payload.message ? result.payload.message : '修正失败。', 'error');
                return;
            }

            renderResult(result.payload.entry || {});
            renderLicenseEntries(result.payload.entry ? [result.payload.entry] : []);
            if (result.payload.deviceCode && refs.deviceCode) refs.deviceCode.value = formatDeviceCode(result.payload.deviceCode);
            setFeedback('issue', '重复记录已修正，已重新生成新的激活码。', 'success');
            setFeedback('license', `已注销 ${result.payload.revokedCount || 0} 条旧记录，并重新生成 1 条新激活码。`, 'success');
            await loadAudit();
        } catch (error) {
            setFeedback('license', '修正暂时不可用。', 'error');
        } finally {
            setLicenseBusy(false);
        }
    }

    async function createAdmin() {
        if (!canManageAdmins() || state.adminBusy) return;
        const refs = getDom();
        const email = normalizeEmail(refs.adminEmail && refs.adminEmail.value);
        const displayName = String(refs.adminName && refs.adminName.value || '').trim().slice(0, 80);
        const password = String(refs.adminPassword && refs.adminPassword.value || '').trim();

        if (!email || !password) {
            setFeedback('admin', '请输入新管理员邮箱和初始密码。', 'error');
            return;
        }

        setAdminBusy(true);
        setFeedback('admin', '正在创建管理员账号...', 'muted');

        try {
            const result = await requestJson(USERS_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                body: JSON.stringify({
                    email,
                    displayName,
                    password,
                    role: 'admin'
                })
            });

            if (!result.response.ok) {
                if (result.response.status === 403) {
                    applySessionState(null);
                    setFeedback('session', '管理员会话已失效，请重新登录。', 'error');
                }
                setFeedback('admin', result.payload && result.payload.message ? result.payload.message : '新增管理员失败。', 'error');
                return;
            }

            if (refs.adminEmail) refs.adminEmail.value = '';
            if (refs.adminName) refs.adminName.value = '';
            if (refs.adminPassword) refs.adminPassword.value = '';
            renderAccounts(result.payload.accounts);
            setFeedback('admin', '管理员账号已创建。', 'success');
            await loadAudit();
        } catch (error) {
            setFeedback('admin', '管理员账号暂时无法创建。', 'error');
        } finally {
            setAdminBusy(false);
        }
    }

    async function changePassword() {
        if (!state.authenticated || state.passwordBusy) return;
        const refs = getDom();
        const currentPassword = String(refs.currentPassword && refs.currentPassword.value || '').trim();
        const nextPassword = String(refs.nextPassword && refs.nextPassword.value || '').trim();
        const confirmPassword = String(refs.confirmPassword && refs.confirmPassword.value || '').trim();

        if (!currentPassword || !nextPassword || !confirmPassword) {
            setFeedback('password', '请完整输入当前密码和新密码。', 'error');
            return;
        }

        setPasswordBusy(true);
        setFeedback('password', '正在更新密码...', 'muted');

        try {
            const result = await requestJson(PASSWORD_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                body: JSON.stringify({
                    currentPassword,
                    nextPassword,
                    confirmPassword
                })
            });

            if (!result.response.ok) {
                if (result.response.status === 403) {
                    applySessionState(null);
                    setFeedback('session', '管理员会话已失效，请重新登录。', 'error');
                }
                setFeedback('password', result.payload && result.payload.message ? result.payload.message : '密码更新失败。', 'error');
                return;
            }

            if (refs.currentPassword) refs.currentPassword.value = '';
            if (refs.nextPassword) refs.nextPassword.value = '';
            if (refs.confirmPassword) refs.confirmPassword.value = '';
            setFeedback('password', '密码已更新。', 'success');
            await loadAudit();
        } catch (error) {
            setFeedback('password', '密码更新暂时不可用。', 'error');
        } finally {
            setPasswordBusy(false);
        }
    }

    async function exportAudit(format) {
        if (!state.authenticated || state.auditBusy) return;
        const normalized = format === 'csv' ? 'csv' : 'json';
        setAuditBusy(true);
        setFeedback('audit', `正在导出 ${normalized.toUpperCase()}...`, 'muted');

        try {
            if (normalized === 'csv') {
                const result = await requestText(`${AUDIT_ENDPOINT}?limit=500&format=csv`, {
                    method: 'GET',
                    headers: {
                        Accept: 'text/csv'
                    }
                });
                if (!result.response.ok) {
                    setFeedback('audit', 'CSV 导出失败。', 'error');
                    return;
                }
                downloadFile(`rinno-issuer-audit-${new Date().toISOString().slice(0, 10)}.csv`, result.text, 'text/csv;charset=utf-8');
            } else {
                const result = await requestJson(`${AUDIT_ENDPOINT}?limit=500`, {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json'
                    }
                });
                if (!result.response.ok) {
                    setFeedback('audit', 'JSON 导出失败。', 'error');
                    return;
                }
                downloadFile(`rinno-issuer-audit-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(result.payload.entries || [], null, 2), 'application/json;charset=utf-8');
            }

            setFeedback('audit', `${normalized.toUpperCase()} 导出已开始。`, 'success');
        } catch (error) {
            setFeedback('audit', '导出暂时不可用。', 'error');
        } finally {
            setAuditBusy(false);
        }
    }

    function hydrateFromQuery() {
        const refs = getDom();
        const params = new URLSearchParams(window.location.search);
        const deviceCode = normalizeDeviceCode(params.get('deviceCode'));
        const note = String(params.get('note') || '').trim().slice(0, 120);
        if (deviceCode && refs.deviceCode && !refs.deviceCode.value) refs.deviceCode.value = formatDeviceCode(deviceCode);
        if (note && refs.note && !refs.note.value) refs.note.value = note;
    }

    async function runLicenseLookup(options = {}) {
        if (!state.authenticated || state.licenseBusy) return false;
        const refs = getDom();
        const deviceCode = normalizeDeviceCode(options.deviceCode);
        const activationCode = normalizeActivationCode(options.activationCode);
        const useHistoryLookup = options.history === true;
        const useActivationLookup = !useHistoryLookup && Boolean(activationCode);
        const useDeviceLookup = !useHistoryLookup && !useActivationLookup && isSupportedDeviceCode(deviceCode);

        if (!useHistoryLookup && !useActivationLookup && !useDeviceLookup) {
            setFeedback('license', 'Enter a device code or activation code first.', 'error');
            return false;
        }

        if (useActivationLookup) {
            state.lastIssuedCode = activationCode;
            if (refs.resultCode) refs.resultCode.value = activationCode;
            if (activationCode !== state.lastRenderedCode && refs.resultMeta) refs.resultMeta.innerHTML = '';
        }

        rememberLicenseLookup(useHistoryLookup ? 'history' : useActivationLookup ? 'activation' : 'device', {
            deviceCode,
            activationCode
        });

        setLicenseBusy(true);
        if (!options.silentFeedback) {
            setFeedback('license', useHistoryLookup ? 'Scanning duplicate history...' : 'Checking duplicate records...', 'muted');
        }

        try {
            const query = useHistoryLookup
                ? 'duplicates=true&includeRevoked=true&maxGroups=200&maxEntries=5000'
                : useActivationLookup
                    ? `activationCode=${encodeURIComponent(activationCode)}&expandDevice=true&includeRevoked=true&limit=20`
                    : `deviceCode=${encodeURIComponent(deviceCode)}&includeRevoked=true&limit=20`;
            const result = await requestJson(`${LICENSES_ENDPOINT}?${query}`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json'
                }
            });

            if (!result.response.ok) {
                if (result.response.status === 403) {
                    applySessionState(null);
                    setFeedback('session', 'Administrator session expired. Please sign in again.', 'error');
                }
                if (useActivationLookup && result.response.status === 404) {
                    renderLicenseEntries([]);
                    state.lastRenderedCode = '';
                    if (refs.resultMeta) refs.resultMeta.innerHTML = '';
                    setFeedback('license', 'Activation code not found.', 'error');
                    return false;
                }
                setFeedback('license', result.payload && result.payload.message ? result.payload.message : 'Duplicate lookup failed.', 'error');
                return false;
            }

            const entries = Array.isArray(result.payload.entries) ? result.payload.entries : [];
            renderLicenseEntries(entries);
            if (result.payload.deviceCode && refs.deviceCode) refs.deviceCode.value = formatDeviceCode(result.payload.deviceCode);

            if (useActivationLookup) {
                const selectedEntry = entries.find(entry => normalizeActivationCode(entry && entry.activationCode) === activationCode) || entries[0];
                if (selectedEntry) {
                    renderResult(selectedEntry);
                } else {
                    state.lastRenderedCode = '';
                    if (refs.resultMeta) refs.resultMeta.innerHTML = '';
                }
            }

            if (useHistoryLookup) {
                if (!options.silentFeedback) {
                    const totalGroups = Number(result.payload.totalGroups) || 0;
                    const totalEntries = Number(result.payload.totalEntries) || 0;
                    setFeedback(
                        'license',
                        totalGroups > 0
                            ? `History scan found ${totalGroups} duplicate group(s) and ${totalEntries} related record(s).`
                            : 'No duplicate history found.',
                        totalGroups > 0 ? 'error' : 'success'
                    );
                }
                return true;
            }

            if (!options.silentFeedback) {
                const duplicateCount = Number.isFinite(Number(result.payload.duplicateCount))
                    ? Number(result.payload.duplicateCount)
                    : entries.length;
                setFeedback('license', `Found ${duplicateCount} related record(s).`, duplicateCount > 1 ? 'error' : 'success');
            }
            return true;
        } catch (error) {
            setFeedback('license', useHistoryLookup ? 'History scan is unavailable right now.' : 'Duplicate lookup is unavailable right now.', 'error');
            return false;
        } finally {
            setLicenseBusy(false);
        }
    }

    async function rerunLastLicenseLookup(fallback = {}) {
        if (state.lastLicenseLookupMode === 'history') {
            return runLicenseLookup({ history: true, silentFeedback: true });
        }
        if (state.lastLicenseLookupMode === 'device' && state.lastLicenseLookupDeviceCode) {
            return runLicenseLookup({
                deviceCode: state.lastLicenseLookupDeviceCode,
                silentFeedback: true
            });
        }

        const activationCode = normalizeActivationCode(fallback.activationCode) || state.lastLicenseLookupActivationCode;
        if (activationCode) {
            return runLicenseLookup({
                activationCode,
                silentFeedback: true
            });
        }
        return false;
    }

    async function revokeLicenseCode(activationCode) {
        if (!state.authenticated || state.licenseBusy) return false;
        const targetCode = normalizeActivationCode(activationCode || readActiveActivationCode());
        if (!targetCode) {
            setFeedback('license', 'Enter an activation code first.', 'error');
            return false;
        }

        let succeeded = false;
        let shouldRefresh = false;
        setLicenseBusy(true);
        setFeedback('license', 'Revoking activation code...', 'muted');

        try {
            const result = await requestJson(LICENSES_ENDPOINT, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                body: JSON.stringify({
                    activationCode: targetCode
                })
            });

            if (!result.response.ok) {
                if (result.response.status === 403) {
                    applySessionState(null);
                    setFeedback('session', 'Administrator session expired. Please sign in again.', 'error');
                }
                setFeedback('license', result.payload && result.payload.message ? result.payload.message : 'Unable to revoke activation code.', 'error');
                return false;
            }

            renderResult(result.payload.entry || { activationCode: targetCode, status: 'revoked' });
            renderLicenseEntries(result.payload.entry ? [result.payload.entry] : []);
            setFeedback('license', 'Activation code revoked.', 'success');
            shouldRefresh = Boolean(state.lastLicenseLookupMode);
            succeeded = true;
            await loadAudit();
        } catch (error) {
            setFeedback('license', 'Activation revoke is unavailable right now.', 'error');
            return false;
        } finally {
            setLicenseBusy(false);
        }

        if (succeeded && shouldRefresh) {
            await rerunLastLicenseLookup({ activationCode: targetCode });
        }
        return succeeded;
    }

    async function repairLicenseSelection(options = {}) {
        if (!state.authenticated || state.licenseBusy) return false;
        const refs = getDom();
        let deviceCode = normalizeDeviceCode(options.deviceCode);
        let activationCode = normalizeActivationCode(options.activationCode);

        if (!deviceCode && !activationCode) {
            activationCode = readActiveActivationCode();
            if (!activationCode) deviceCode = readActiveDeviceCode();
        }

        if (!isSupportedDeviceCode(deviceCode) && !activationCode) {
            setFeedback('license', 'Enter a device code or activation code first.', 'error');
            return false;
        }

        let succeeded = false;
        let shouldRefresh = false;
        let nextActivationCode = '';
        setLicenseBusy(true);
        setFeedback('license', 'Repairing duplicate records...', 'muted');

        try {
            const result = await requestJson(LICENSES_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                body: JSON.stringify({
                    action: 'repair',
                    deviceCode,
                    activationCode
                })
            });

            if (!result.response.ok) {
                if (result.response.status === 403) {
                    applySessionState(null);
                    setFeedback('session', 'Administrator session expired. Please sign in again.', 'error');
                }
                setFeedback('license', result.payload && result.payload.message ? result.payload.message : 'Unable to repair duplicate records.', 'error');
                return false;
            }

            nextActivationCode = normalizeActivationCode(result.payload && result.payload.entry && result.payload.entry.activationCode);
            renderResult(result.payload.entry || {});
            renderLicenseEntries(result.payload.entry ? [result.payload.entry] : []);
            if (result.payload.deviceCode && refs.deviceCode) refs.deviceCode.value = formatDeviceCode(result.payload.deviceCode);
            setFeedback('issue', 'Duplicate records repaired and a fresh activation code was issued.', 'success');
            setFeedback('license', `Revoked ${result.payload.revokedCount || 0} old record(s) and issued 1 new activation code.`, 'success');
            shouldRefresh = Boolean(state.lastLicenseLookupMode);
            succeeded = true;
            await loadAudit();
        } catch (error) {
            setFeedback('license', 'Duplicate repair is unavailable right now.', 'error');
            return false;
        } finally {
            setLicenseBusy(false);
        }

        if (succeeded && shouldRefresh) {
            await rerunLastLicenseLookup({ activationCode: nextActivationCode || activationCode });
        }
        return succeeded;
    }

    async function repairHistoricalDuplicates() {
        if (!state.authenticated || state.licenseBusy) return false;
        rememberLicenseLookup('history');

        let succeeded = false;
        setLicenseBusy(true);
        setFeedback('license', 'Repairing historical duplicate groups...', 'muted');

        try {
            const result = await requestJson(LICENSES_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                body: JSON.stringify({
                    action: 'repair-history',
                    maxGroups: 200,
                    maxEntries: 5000
                })
            });

            if (!result.response.ok) {
                if (result.response.status === 403) {
                    applySessionState(null);
                    setFeedback('session', 'Administrator session expired. Please sign in again.', 'error');
                }
                setFeedback('license', result.payload && result.payload.message ? result.payload.message : 'Unable to repair history duplicates.', 'error');
                return false;
            }

            const repairedGroups = Number(result.payload.repairedGroups) || 0;
            const revokedCount = Number(result.payload.revokedCount) || 0;
            const skippedGroups = Number(result.payload.skippedGroups) || 0;
            const failedGroups = Number(result.payload.failedGroups) || 0;
            const summary = failedGroups > 0
                ? `Repaired ${repairedGroups} group(s), skipped ${skippedGroups}, failed ${failedGroups}, revoked ${revokedCount} record(s).`
                : repairedGroups > 0
                    ? `Repaired ${repairedGroups} group(s) and revoked ${revokedCount} record(s).`
                    : 'No repairable history duplicates were found.';
            setFeedback('license', summary, failedGroups > 0 ? (repairedGroups > 0 ? 'success' : 'error') : repairedGroups > 0 ? 'success' : 'muted');
            succeeded = true;
            await loadAudit();
        } catch (error) {
            setFeedback('license', 'Historical duplicate repair is unavailable right now.', 'error');
            return false;
        } finally {
            setLicenseBusy(false);
        }

        if (succeeded) {
            await runLicenseLookup({ history: true, silentFeedback: true });
        }
        return succeeded;
    }

    function bindEvents() {
        const refs = getDom();
        if (!refs.loginButton || refs.loginButton.dataset.bound === 'true') return;
        refs.loginButton.dataset.bound = 'true';

        refs.loginButton.addEventListener('click', event => {
            event.preventDefault();
            void loginAdmin();
        });

        refs.logoutButton && refs.logoutButton.addEventListener('click', event => {
            event.preventDefault();
            void logoutAdmin();
        });

        refs.submit && refs.submit.addEventListener('click', event => {
            event.preventDefault();
            void issueActivationCode();
        });

        refs.copy && refs.copy.addEventListener('click', async event => {
            event.preventDefault();
            event.currentTarget.blur();
            const copied = await copyText(state.lastIssuedCode || (refs.resultCode && refs.resultCode.value));
            setFeedback('issue', copied ? '激活码已复制。' : '复制失败，请手动复制。', copied ? 'success' : 'error');
        });

        refs.resultCheckDuplicatesButton && refs.resultCheckDuplicatesButton.addEventListener('click', event => {
            event.preventDefault();
            event.currentTarget.blur();
            void runLicenseLookup({
                activationCode: readActiveActivationCode()
            });
        });

        refs.resultFixDuplicatesButton && refs.resultFixDuplicatesButton.addEventListener('click', event => {
            event.preventDefault();
            event.currentTarget.blur();
            void repairLicenseSelection({
                activationCode: readActiveActivationCode()
            });
        });

        refs.resultRevokeButton && refs.resultRevokeButton.addEventListener('click', event => {
            event.preventDefault();
            event.currentTarget.blur();
            void revokeLicenseCode();
        });

        refs.checkDuplicatesButton && refs.checkDuplicatesButton.addEventListener('click', event => {
            event.preventDefault();
            event.currentTarget.blur();
            void runLicenseLookup({
                deviceCode: readActiveDeviceCode()
            });
        });

        refs.fixDuplicatesButton && refs.fixDuplicatesButton.addEventListener('click', event => {
            event.preventDefault();
            event.currentTarget.blur();
            void repairLicenseSelection({
                deviceCode: readActiveDeviceCode()
            });
        });

        refs.revokeButton && refs.revokeButton.addEventListener('click', event => {
            event.preventDefault();
            event.currentTarget.blur();
            void revokeLicenseCode();
        });

        refs.createAdminButton && refs.createAdminButton.addEventListener('click', event => {
            event.preventDefault();
            void createAdmin();
        });

        refs.changePasswordButton && refs.changePasswordButton.addEventListener('click', event => {
            event.preventDefault();
            void changePassword();
        });

        refs.refreshAuditButton && refs.refreshAuditButton.addEventListener('click', event => {
            event.preventDefault();
            void loadAudit();
        });

        refs.historyCheckDuplicatesButton && refs.historyCheckDuplicatesButton.addEventListener('click', event => {
            event.preventDefault();
            event.currentTarget.blur();
            void runLicenseLookup({ history: true });
        });

        refs.historyFixDuplicatesButton && refs.historyFixDuplicatesButton.addEventListener('click', event => {
            event.preventDefault();
            event.currentTarget.blur();
            void repairHistoricalDuplicates();
        });

        refs.exportJsonButton && refs.exportJsonButton.addEventListener('click', event => {
            event.preventDefault();
            void exportAudit('json');
        });

        refs.exportCsvButton && refs.exportCsvButton.addEventListener('click', event => {
            event.preventDefault();
            void exportAudit('csv');
        });

        refs.loginPassword && refs.loginPassword.addEventListener('keydown', event => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            void loginAdmin();
        });

        refs.deviceCode && refs.deviceCode.addEventListener('input', event => {
            const nextValue = formatDeviceCode(event.target.value);
            if (event.target.value !== nextValue) event.target.value = nextValue;
        });

        refs.resultCode && refs.resultCode.addEventListener('input', event => {
            const nextValue = normalizeActivationCode(event.target.value);
            if (event.target.value !== nextValue) event.target.value = nextValue;
            state.lastIssuedCode = nextValue;
            if (nextValue !== state.lastRenderedCode) {
                const refsNow = getDom();
                if (refsNow.resultMeta) refsNow.resultMeta.innerHTML = '';
            }

            clearResultCodeLookupTimer();
            if (!nextValue) {
                state.lastRenderedCode = '';
                rememberLicenseLookup('');
                renderLicenseEntries([]);
                closeLicenseModal();
                setFeedback('license', '', '');
                return;
            }
            if (!state.authenticated) return;

            resultCodeLookupTimer = window.setTimeout(() => {
                resultCodeLookupTimer = 0;
                void runLicenseLookup({
                    activationCode: nextValue
                });
            }, 420);
        });

        refs.resultCode && refs.resultCode.addEventListener('blur', () => {
            if (!state.authenticated) return;
            clearResultCodeLookupTimer();
            const activationCode = readActiveActivationCode();
            if (!activationCode) return;
            void runLicenseLookup({
                activationCode
            });
        });

        refs.resultCode && refs.resultCode.addEventListener('keydown', event => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            clearResultCodeLookupTimer();
            const activationCode = normalizeActivationCode(event.currentTarget.value);
            if (!activationCode) return;
            void runLicenseLookup({
                activationCode
            });
        });

        document.querySelectorAll('.issuer-input, .issuer-output, .issuer-button').forEach(node => {
            ['click', 'mousedown', 'touchstart', 'focus'].forEach(type => {
                node.addEventListener(type, event => {
                    event.stopPropagation();
                });
            });
        });

        refs.licenseModal && refs.licenseModal.addEventListener('click', event => {
            if (event.target !== event.currentTarget) return;
            closeLicenseModal();
        });

        refs.licenseModalCloseButton && refs.licenseModalCloseButton.addEventListener('click', event => {
            event.preventDefault();
            closeLicenseModal();
        });

        refs.licenseModalRevokeButton && refs.licenseModalRevokeButton.addEventListener('click', event => {
            event.preventDefault();
            event.currentTarget.blur();
            if (!state.activeModalCode) return;
            void revokeLicenseCode(state.activeModalCode);
        });

        document.addEventListener('keydown', event => {
            if (event.key !== 'Escape' || !state.activeModalCode) return;
            closeLicenseModal();
        });

        if (false) {
            const button = event.target.closest('button');
            if (button) {
                event.preventDefault();
                button.blur();
                const copyCode = button.getAttribute('data-license-copy');
                const fillCode = button.getAttribute('data-license-fill');
                const repairCode = button.getAttribute('data-license-repair');
                const revokeCode = button.getAttribute('data-license-revoke');
            }

            if (copyCode) {
                void copyText(copyCode).then(copied => {
                    setFeedback('license', copied ? '激活码已复制。' : '复制失败，请手动复制。', copied ? 'success' : 'error');
                });
                return;
            }

            if (fillCode) {
                const refsNow = getDom();
                state.lastIssuedCode = fillCode;
                if (refsNow.resultCode) refsNow.resultCode.value = fillCode;
                setFeedback('license', '已填入结果框。', 'success');
                return;
            }

            if (repairCode) {
                void repairDuplicateLicenses(repairCode);
                return;
            }

            if (revokeCode) {
                void revokeActivationCode(revokeCode);
            }
        }
        refs.licenseList && refs.licenseList.addEventListener('click', event => {
            const button = event.target.closest('button');
            if (button) {
                event.preventDefault();
                button.blur();
                const copyCode = button.getAttribute('data-license-copy');
                const fillCode = button.getAttribute('data-license-fill');
                const repairCode = button.getAttribute('data-license-repair');
                const revokeCode = button.getAttribute('data-license-revoke');

                if (copyCode) {
                    void copyText(copyCode).then(copied => {
                        setFeedback('license', copied ? 'Activation code copied.' : 'Copy failed. Please copy it manually.', copied ? 'success' : 'error');
                    });
                    return;
                }

                if (fillCode) {
                    const refsNow = getDom();
                    const record = getLicenseEntryByCode(fillCode);
                    state.lastIssuedCode = normalizeActivationCode(fillCode);
                    if (refsNow.resultCode) refsNow.resultCode.value = state.lastIssuedCode;
                    if (record) renderResult(record);
                    else if (refsNow.resultMeta) refsNow.resultMeta.innerHTML = '';
                    setFeedback('license', 'Activation code filled into the result box.', 'success');
                    return;
                }

                if (repairCode) {
                    void repairLicenseSelection({
                        activationCode: repairCode
                    });
                    return;
                }

                if (revokeCode) {
                    void revokeLicenseCode(revokeCode);
                }
                return;
            }

            const item = event.target.closest('[data-license-item="true"]');
            if (!item) return;
            event.preventDefault();
            openLicenseModal(item.getAttribute('data-license-code'));
        });

        refs.licenseList && refs.licenseList.addEventListener('keydown', event => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            const item = event.target.closest('[data-license-item="true"]');
            if (!item) return;
            event.preventDefault();
            openLicenseModal(item.getAttribute('data-license-code'));
        });
    }

    async function initIssuerConsole() {
        hydrateFromQuery();
        bindEvents();
        applySessionState(null);
        setIssueBusy(false);
        setAdminBusy(false);
        setPasswordBusy(false);
        setAuditBusy(false);
        setLicenseBusy(false);
        await refreshSession();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            void initIssuerConsole();
        }, { once: true });
    } else {
        void initIssuerConsole();
    }
})();
