const {
    buildAdminSessionCookie,
    clearAdminSessionCookie,
    createAdminSessionToken,
    formatIssuerAuditEntriesAsCsv,
    getHeader,
    isHttpsRequest,
    json,
    readAuthenticatedAdminFromRequest,
    readIssuerAuditLog
} = require('./_license');

function jsonWithCookie(statusCode, payload, cookie) {
    const response = json(statusCode, payload);
    response.headers = {
        ...response.headers,
        'Set-Cookie': cookie
    };
    return response;
}

function csvWithCookie(body, cookie) {
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Cache-Control': 'no-store',
            'Content-Disposition': `attachment; filename="rinno-issuer-audit-${new Date().toISOString().slice(0, 10)}.csv"`,
            'Set-Cookie': cookie
        },
        body
    };
}

exports.handler = async function handler(event) {
    const secureCookie = isHttpsRequest(event.headers);
    const clearCookie = clearAdminSessionCookie({ secure: secureCookie });
    const userAgent = getHeader(event.headers, 'user-agent');

    if (event.httpMethod !== 'GET') {
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

    const limit = Math.max(1, Math.min(500, Number(event.queryStringParameters && event.queryStringParameters.limit) || 100));
    const format = String(event.queryStringParameters && event.queryStringParameters.format || 'json').trim().toLowerCase();

    try {
        const entries = await readIssuerAuditLog(limit);
        const refreshedToken = createAdminSessionToken({
            accountId: auth.account.id,
            email: auth.account.email,
            role: auth.account.role,
            sessionVersion: auth.account.sessionVersion,
            userAgent
        });
        const cookie = buildAdminSessionCookie(refreshedToken, { secure: secureCookie });

        if (format === 'csv') {
            return csvWithCookie(formatIssuerAuditEntriesAsCsv(entries), cookie);
        }

        return jsonWithCookie(200, {
            ok: true,
            authenticated: true,
            entries
        }, cookie);
    } catch (error) {
        console.error('Issuer audit read failed:', error);
        const refreshedToken = createAdminSessionToken({
            accountId: auth.account.id,
            email: auth.account.email,
            role: auth.account.role,
            sessionVersion: auth.account.sessionVersion,
            userAgent
        });
        return jsonWithCookie(500, {
            ok: false,
            message: 'Unable to load issuer audit log.'
        }, buildAdminSessionCookie(refreshedToken, { secure: secureCookie }));
    }
};
