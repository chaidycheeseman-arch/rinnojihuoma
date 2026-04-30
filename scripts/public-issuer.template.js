(() => {
    const SESSION_ENDPOINT = '/.netlify/functions/admin-session';
    const ISSUE_ENDPOINT = '/.netlify/functions/generate-code';
    const LICENSES_ENDPOINT = '/.netlify/functions/admin-licenses';
    const AUDIT_ENDPOINT = '/.netlify/functions/admin-audit';
    const USERS_ENDPOINT = '/.netlify/functions/admin-users';
    const PASSWORD_ENDPOINT = '/.netlify/functions/admin-password';
    const AUDIT_LIMIT = 100;
    const state = {
        authenticated: false,
        account: null,
        sessionBusy: false,
        issueBusy: false,
        adminBusy: false,
        passwordBusy: false,
        auditBusy: false,
        licenseBusy: false,
        lastIssuedCode: ''
    };

    let dom = null;

    function normalizeDeviceCode(value) {
        return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
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
            exportJsonButton: document.getElementById('issuer-export-json'),
            exportCsvButton: document.getElementById('issuer-export-csv'),
            auditFeedback: document.getElementById('issuer-audit-feedback'),
            auditEmpty: document.getElementById('issuer-audit-empty'),
            auditList: document.getElementById('issuer-audit-list')
        };
        return dom;
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
            state.lastIssuedCode = '';
            if (refs.resultCode) refs.resultCode.value = '';
            if (refs.resultMeta) refs.resultMeta.innerHTML = '';
            if (refs.licenseList) refs.licenseList.innerHTML = '';
            if (refs.adminList) refs.adminList.innerHTML = '';
            if (refs.auditList) refs.auditList.innerHTML = '';
            if (refs.adminEmpty) refs.adminEmpty.hidden = false;
            if (refs.auditEmpty) refs.auditEmpty.hidden = false;
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

    function renderResult(payload) {
        const refs = getDom();
        state.lastIssuedCode = String(payload.activationCode || '');
        if (refs.resultCode) refs.resultCode.value = state.lastIssuedCode;
        if (refs.resultMeta) {
            refs.resultMeta.innerHTML = [
                payload.initialDeviceCode ? `<span class="issuer-chip">device ${payload.initialDeviceCode}</span>` : '',
                payload.status ? `<span class="issuer-chip">status ${payload.status}</span>` : '',
                payload.issuedAt ? `<span class="issuer-chip">${new Date(payload.issuedAt).toLocaleString()}</span>` : ''
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
            state.lastIssuedCode
            || (refs.resultCode && refs.resultCode.value)
            || ''
        ));
    }

    function renderLicenseEntries(entries) {
        const refs = getDom();
        if (!refs.licenseList) return;
        const list = Array.isArray(entries) ? entries : [];
        refs.licenseList.innerHTML = '';
        list.forEach(entry => {
            const duplicateMeta = entry.duplicateCount > 1
                ? `<span class="issuer-item-meta">duplicate history ${entry.duplicateCount} · active ${entry.duplicateActiveCount || 0}</span>`
                : '';
            const item = document.createElement('li');
            item.className = 'issuer-item';
            item.innerHTML = `
                <strong class="issuer-item-code">${entry.activationCode || ''}</strong>
                <span class="issuer-item-meta">设备码 ${entry.initialDeviceCode || '------------'} · 状态 ${entry.status || 'issued'}</span>
                <span class="issuer-item-meta">${entry.issuedAt ? new Date(entry.issuedAt).toLocaleString() : '-'}</span>
                ${duplicateMeta}
                <div class="issuer-item-actions">
                    <button class="issuer-button subtle" type="button" data-license-copy="${entry.activationCode || ''}">复制</button>
                    <button class="issuer-button subtle" type="button" data-license-fill="${entry.activationCode || ''}">填入结果框</button>
                    <button class="issuer-button subtle" type="button" data-license-repair="${entry.activationCode || ''}">修正</button>
                    <button class="issuer-button subtle" type="button" data-license-revoke="${entry.activationCode || ''}">注销</button>
                </div>
            `;
            refs.licenseList.appendChild(item);
        });
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

        if (deviceCode.length !== 12) {
            setFeedback('issue', '请输入有效的 12 位设备码。', 'error');
            refs.deviceCode && refs.deviceCode.focus();
            return;
        }

        if (refs.deviceCode) refs.deviceCode.value = deviceCode;
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
        const useActivationLookup = activationCode && deviceCode.length !== 12;
        const useHistoryLookup = !useActivationLookup && deviceCode.length === 0;
        if (!useHistoryLookup && !useActivationLookup && deviceCode.length !== 12) {
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
            if (result.payload.deviceCode && refs.deviceCode) refs.deviceCode.value = result.payload.deviceCode;
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
        if (deviceCode.length !== 12 && !activationCode) {
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
            if (result.payload.deviceCode && refs.deviceCode) refs.deviceCode.value = result.payload.deviceCode;
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
        if (deviceCode && refs.deviceCode && !refs.deviceCode.value) refs.deviceCode.value = deviceCode;
        if (note && refs.note && !refs.note.value) refs.note.value = note;
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
            void lookupDuplicates();
        });

        refs.resultFixDuplicatesButton && refs.resultFixDuplicatesButton.addEventListener('click', event => {
            event.preventDefault();
            event.currentTarget.blur();
            void repairDuplicateLicenses();
        });

        refs.resultRevokeButton && refs.resultRevokeButton.addEventListener('click', event => {
            event.preventDefault();
            event.currentTarget.blur();
            void revokeActivationCode();
        });

        refs.checkDuplicatesButton && refs.checkDuplicatesButton.addEventListener('click', event => {
            event.preventDefault();
            event.currentTarget.blur();
            void lookupDuplicates();
        });

        refs.fixDuplicatesButton && refs.fixDuplicatesButton.addEventListener('click', event => {
            event.preventDefault();
            event.currentTarget.blur();
            void repairDuplicateLicenses();
        });

        refs.revokeButton && refs.revokeButton.addEventListener('click', event => {
            event.preventDefault();
            event.currentTarget.blur();
            void revokeActivationCode();
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
            const nextValue = normalizeDeviceCode(event.target.value);
            if (event.target.value !== nextValue) event.target.value = nextValue;
        });

        document.querySelectorAll('.issuer-input, .issuer-output, .issuer-button').forEach(node => {
            ['click', 'mousedown', 'touchstart', 'focus'].forEach(type => {
                node.addEventListener(type, event => {
                    event.stopPropagation();
                });
            });
        });

        refs.licenseList && refs.licenseList.addEventListener('click', event => {
            const button = event.target.closest('button');
            if (!button) return;
            event.preventDefault();
            button.blur();
            const copyCode = button.getAttribute('data-license-copy');
            const fillCode = button.getAttribute('data-license-fill');
            const repairCode = button.getAttribute('data-license-repair');
            const revokeCode = button.getAttribute('data-license-revoke');

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
