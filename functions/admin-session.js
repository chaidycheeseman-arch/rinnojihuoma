const {
    JSON_HEADERS,
    appendIssuerAuditLog,
    buildAdminSessionCookie,
    clearAdminSessionCookie,
    createAdminSessionToken,
    getClientIp,
    getHeader,
    isHttpsRequest,
    json,
    normalizeAdminEmail,
    readAuthenticatedAdminFromRequest,
    readAdminAccounts,
    serializeAdminAccountPublic,
    verifyAdminPassword,
    writeAdminAccounts
} = require('./_license');

function withCookie(response, cookie) {
    return {
        ...response,
        headers: {
            ...response.headers,
            'Set-Cookie': cookie
        }
    };
}

function jsonWithCookie(statusCode, payload, cookie) {
    return withCookie(json(statusCode, payload), cookie);
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
            headers: JSON_HEADERS,
            body: ''
        };
    }

    if (event.httpMethod === 'GET') {
        const auth = await readAuthenticatedAdminFromRequest(event).catch(() => ({ ok: false, reason: 'error' }));
        if (!auth.ok) {
            return jsonWithCookie(200, {
                ok: true,
                authenticated: false,
                account: null
            }, clearCookie);
        }

        const token = createAdminSessionToken({
            accountId: auth.account.id,
            email: auth.account.email,
            role: auth.account.role,
            sessionVersion: auth.account.sessionVersion,
            userAgent
        });

        return jsonWithCookie(200, {
            ok: true,
            authenticated: true,
            account: serializeAdminAccountPublic(auth.account),
            expiresAt: auth.session.expiresAt
        }, buildAdminSessionCookie(token, { secure: secureCookie }));
    }

    if (event.httpMethod === 'DELETE') {
        const auth = await readAuthenticatedAdminFromRequest(event).catch(() => ({ ok: false, reason: 'error' }));
        if (auth.ok) {
            await appendIssuerAuditLog({
                type: 'admin-logout',
                outcome: 'success',
                authMode: 'session',
                actorId: auth.account.id,
                actorEmail: auth.account.email,
                actorRole: auth.account.role,
                origin,
                referer,
                ip,
                userAgent,
                message: 'Administrator signed out.'
            }).catch(error => {
                console.warn('Issuer audit log append skipped during logout:', error);
            });
        }

        return jsonWithCookie(200, {
            ok: true,
            authenticated: false,
            account: null,
            message: 'Administrator signed out.'
        }, clearCookie);
    }

    if (event.httpMethod !== 'POST') {
        return jsonWithCookie(405, {
            ok: false,
            message: 'Method Not Allowed'
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

    const email = normalizeAdminEmail(body.email);
    const password = String(body.password || '').trim();
    if (!email || !password) {
        return jsonWithCookie(400, {
            ok: false,
            authenticated: false,
            message: 'email and password are required.'
        }, clearCookie);
    }

    const accounts = await readAdminAccounts();
    const account = accounts.find(item => item.email === email && item.status === 'active');
    const valid = account && verifyAdminPassword(account, password);

    if (!valid) {
        await appendIssuerAuditLog({
            type: 'admin-login',
            outcome: 'denied',
            authMode: 'password',
            actorEmail: email,
            origin,
            referer,
            ip,
            userAgent,
            message: 'Administrator login failed.'
        }).catch(error => {
            console.warn('Issuer audit log append skipped during failed login:', error);
        });

        return jsonWithCookie(403, {
            ok: false,
            authenticated: false,
            message: 'Invalid administrator email or password.'
        }, clearCookie);
    }

    const now = new Date().toISOString();
    const nextAccounts = accounts.map(item => item.id === account.id
        ? {
            ...item,
            lastLoginAt: now,
            updatedAt: now
        }
        : item);
    await writeAdminAccounts(nextAccounts);
    const currentAccount = nextAccounts.find(item => item.id === account.id) || account;

    const token = createAdminSessionToken({
        accountId: currentAccount.id,
        email: currentAccount.email,
        role: currentAccount.role,
        sessionVersion: currentAccount.sessionVersion,
        userAgent
    });
    const cookie = buildAdminSessionCookie(token, { secure: secureCookie });

    await appendIssuerAuditLog({
        type: 'admin-login',
        outcome: 'success',
        authMode: 'password',
        actorId: currentAccount.id,
        actorEmail: currentAccount.email,
        actorRole: currentAccount.role,
        origin,
        referer,
        ip,
        userAgent,
        message: 'Administrator login succeeded.'
    }).catch(error => {
        console.warn('Issuer audit log append skipped during login:', error);
    });

    return jsonWithCookie(200, {
        ok: true,
        authenticated: true,
        account: serializeAdminAccountPublic(currentAccount),
        message: 'Administrator session established.'
    }, cookie);
};
