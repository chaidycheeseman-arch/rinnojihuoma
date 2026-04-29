const {
    buildAdminSessionCookie,
    clearAdminSessionCookie,
    createAdminAccount,
    createAdminSessionToken,
    appendIssuerAuditLog,
    findAdminAccountByEmail,
    getClientIp,
    getHeader,
    isHttpsRequest,
    json,
    normalizeAdminEmail,
    readAuthenticatedAdminFromRequest,
    readAdminAccounts,
    serializeAdminAccountPublic,
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

    if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
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

    const refreshedCookie = buildAdminSessionCookie(createAdminSessionToken({
        accountId: auth.account.id,
        email: auth.account.email,
        role: auth.account.role,
        sessionVersion: auth.account.sessionVersion,
        userAgent
    }), { secure: secureCookie });

    if (event.httpMethod === 'GET') {
        return jsonWithCookie(200, {
            ok: true,
            authenticated: true,
            accounts: auth.accounts.map(serializeAdminAccountPublic)
        }, refreshedCookie);
    }

    if (auth.account.role !== 'founder') {
        return jsonWithCookie(403, {
            ok: false,
            message: 'Only the founder account can create administrators.'
        }, refreshedCookie);
    }

    let body = {};
    try {
        body = JSON.parse(event.body || '{}');
    } catch (error) {
        return jsonWithCookie(400, {
            ok: false,
            message: 'Invalid JSON body.'
        }, refreshedCookie);
    }

    const email = normalizeAdminEmail(body.email);
    const password = String(body.password || '').trim();
    const displayName = String(body.displayName || '').trim();
    const role = String(body.role || 'admin').trim().toLowerCase() === 'founder' ? 'founder' : 'admin';

    if (!email || !password) {
        return jsonWithCookie(400, {
            ok: false,
            message: 'email and password are required.'
        }, refreshedCookie);
    }

    if (findAdminAccountByEmail(auth.accounts, email)) {
        return jsonWithCookie(409, {
            ok: false,
            message: 'An administrator with this email already exists.'
        }, refreshedCookie);
    }

    if (role === 'founder') {
        return jsonWithCookie(403, {
            ok: false,
            message: 'Additional founder accounts are not allowed.'
        }, refreshedCookie);
    }

    try {
        const account = createAdminAccount({
            email,
            password,
            role,
            displayName,
            createdBy: auth.account.email
        });
        const nextAccounts = [...auth.accounts, account];
        await writeAdminAccounts(nextAccounts);

        await appendIssuerAuditLog({
            type: 'admin-create',
            outcome: 'success',
            authMode: 'session',
            actorId: auth.account.id,
            actorEmail: auth.account.email,
            actorRole: auth.account.role,
            targetEmail: account.email,
            origin,
            referer,
            ip,
            userAgent,
            message: 'Administrator account created.'
        }).catch(error => {
            console.warn('Issuer audit log append skipped during admin create:', error);
        });

        return jsonWithCookie(200, {
            ok: true,
            account: serializeAdminAccountPublic(account),
            accounts: nextAccounts.map(serializeAdminAccountPublic),
            message: 'Administrator account created.'
        }, refreshedCookie);
    } catch (error) {
        return jsonWithCookie(400, {
            ok: false,
            message: error && error.message ? error.message : 'Unable to create administrator account.'
        }, refreshedCookie);
    }
};
