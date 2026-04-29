const {
    appendIssuerAuditLog,
    buildAdminSessionCookie,
    clearAdminSessionCookie,
    createAdminSessionToken,
    getClientIp,
    getHeader,
    hashAdminPassword,
    isHttpsRequest,
    json,
    readAuthenticatedAdminFromRequest,
    timingSafeEquals,
    verifyAdminPassword,
    writeAdminAccounts
} = require('./_license');

function jsonWithCookie(statusCode, payload, cookie) {
    const response = json(statusCode, payload);
    response.headers = {
        ...response.headers,
        'Set-Cookie': cookie
    };
    return response;
}

exports.handler = async function handler(event) {
    const secureCookie = isHttpsRequest(event.headers);
    const clearCookie = clearAdminSessionCookie({ secure: secureCookie });
    const userAgent = getHeader(event.headers, 'user-agent');
    const origin = getHeader(event.headers, 'origin');
    const referer = getHeader(event.headers, 'referer');
    const ip = getClientIp(event.headers);

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers: {
                ...json(200, {}).headers,
                'Content-Length': '0'
            },
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return jsonWithCookie(405, {
            ok: false,
            message: 'Method Not Allowed'
        }, clearCookie);
    }

    const auth = await readAuthenticatedAdminFromRequest(event).catch(() => ({ ok: false, reason: 'error' }));
    if (!auth.ok) {
        return jsonWithCookie(403, {
            ok: false,
            authenticated: false,
            message: 'Administrator session is missing or expired.'
        }, clearCookie);
    }

    let body = {};
    try {
        body = JSON.parse(event.body || '{}');
    } catch (error) {
        return jsonWithCookie(400, {
            ok: false,
            message: 'Invalid JSON body.'
        }, clearCookie);
    }

    const currentPassword = String(body.currentPassword || '').trim();
    const nextPassword = String(body.nextPassword || '').trim();
    const confirmPassword = String(body.confirmPassword || '').trim();
    const refreshedCookie = buildAdminSessionCookie(createAdminSessionToken({
        accountId: auth.account.id,
        email: auth.account.email,
        role: auth.account.role,
        sessionVersion: auth.account.sessionVersion,
        userAgent
    }), { secure: secureCookie });

    if (!currentPassword || !nextPassword || !confirmPassword) {
        return jsonWithCookie(400, {
            ok: false,
            message: 'currentPassword, nextPassword and confirmPassword are required.'
        }, refreshedCookie);
    }

    if (!verifyAdminPassword(auth.account, currentPassword)) {
        await appendIssuerAuditLog({
            type: 'admin-password-change',
            outcome: 'denied',
            authMode: 'session',
            actorId: auth.account.id,
            actorEmail: auth.account.email,
            actorRole: auth.account.role,
            origin,
            referer,
            ip,
            userAgent,
            message: 'Administrator password change failed.'
        }).catch(error => {
            console.warn('Issuer audit log append skipped during password denial:', error);
        });

        return jsonWithCookie(403, {
            ok: false,
            message: 'Current password is incorrect.'
        }, refreshedCookie);
    }

    if (!timingSafeEquals(nextPassword, confirmPassword)) {
        return jsonWithCookie(400, {
            ok: false,
            message: 'New password confirmation does not match.'
        }, refreshedCookie);
    }

    if (timingSafeEquals(currentPassword, nextPassword)) {
        return jsonWithCookie(400, {
            ok: false,
            message: 'New password must be different from the current password.'
        }, refreshedCookie);
    }

    try {
        const nextHash = hashAdminPassword(nextPassword);
        const now = new Date().toISOString();
        const nextAccounts = auth.accounts.map(account => account.id === auth.account.id
            ? {
                ...account,
                ...nextHash,
                sessionVersion: account.sessionVersion + 1,
                updatedAt: now,
                passwordChangedAt: now
            }
            : account);
        await writeAdminAccounts(nextAccounts);

        const nextAccount = nextAccounts.find(account => account.id === auth.account.id) || auth.account;
        const nextCookie = buildAdminSessionCookie(createAdminSessionToken({
            accountId: nextAccount.id,
            email: nextAccount.email,
            role: nextAccount.role,
            sessionVersion: nextAccount.sessionVersion,
            userAgent
        }), { secure: secureCookie });

        await appendIssuerAuditLog({
            type: 'admin-password-change',
            outcome: 'success',
            authMode: 'session',
            actorId: nextAccount.id,
            actorEmail: nextAccount.email,
            actorRole: nextAccount.role,
            origin,
            referer,
            ip,
            userAgent,
            message: 'Administrator password changed.'
        }).catch(error => {
            console.warn('Issuer audit log append skipped during password change:', error);
        });

        return jsonWithCookie(200, {
            ok: true,
            message: 'Password updated successfully.'
        }, nextCookie);
    } catch (error) {
        return jsonWithCookie(400, {
            ok: false,
            message: error && error.message ? error.message : 'Unable to update password.'
        }, refreshedCookie);
    }
};
