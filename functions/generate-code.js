const {
    JSON_HEADERS,
    appendIssuerAuditLog,
    buildActivationCode,
    buildAdminSessionCookie,
    clearAdminSessionCookie,
    createAdminSessionToken,
    createIssuedRecord,
    getAdminKey,
    getClientIp,
    getFounderBootstrapEmail,
    getHeader,
    getLicenseStore,
    isHttpsRequest,
    json,
    makeCodeId,
    normalizeDeviceCode,
    readAuthenticatedAdminFromRequest,
    timingSafeEquals
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
            headers: JSON_HEADERS,
            body: ''
        };
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

    const auth = await readAuthenticatedAdminFromRequest(event).catch(() => ({ ok: false, reason: 'error' }));
    const adminKey = String(getHeader(event.headers, 'x-admin-key') || body.adminKey || '').trim();
    const hasAdminKey = timingSafeEquals(adminKey, getAdminKey());
    const authMode = auth.ok ? 'session' : hasAdminKey ? 'key' : '';
    const refreshedCookie = auth.ok
        ? buildAdminSessionCookie(createAdminSessionToken({
            accountId: auth.account.id,
            email: auth.account.email,
            role: auth.account.role,
            sessionVersion: auth.account.sessionVersion,
            userAgent
        }), { secure: secureCookie })
        : clearCookie;

    if (!authMode) {
        await appendIssuerAuditLog({
            type: 'issue-code',
            outcome: 'denied',
            authMode: 'anonymous',
            initialDeviceCode: body.deviceCode,
            note: body.note,
            origin,
            referer,
            ip,
            userAgent,
            message: 'Issue request denied.'
        }).catch(error => {
            console.warn('Issuer audit log append skipped during denied issue:', error);
        });

        return jsonWithCookie(403, {
            ok: false,
            message: 'Administrator authentication is required.'
        }, clearCookie);
    }

    const deviceCode = normalizeDeviceCode(body.deviceCode);
    if (deviceCode.length !== 12) {
        return jsonWithCookie(400, {
            ok: false,
            message: 'deviceCode must be a 12-character device fingerprint.'
        }, refreshedCookie);
    }

    const note = String(body.note || '').trim().slice(0, 120);
    const issuedAt = new Date().toISOString();
    const codeId = makeCodeId();
    const activationCode = buildActivationCode(deviceCode, codeId);
    const record = createIssuedRecord(deviceCode, activationCode, codeId, note, issuedAt);
    const actorEmail = auth.ok ? auth.account.email : getFounderBootstrapEmail();
    const actorRole = auth.ok ? auth.account.role : 'founder';
    const actorId = auth.ok ? auth.account.id : 'legacy-admin-key';

    try {
        const store = getLicenseStore();
        await store.setJSON(activationCode, record, {
            metadata: {
                initialDeviceCode: record.initialDeviceCode,
                status: record.status,
                issuedAt: record.issuedAt
            }
        });

        await appendIssuerAuditLog({
            type: 'issue-code',
            outcome: 'success',
            authMode,
            actorId,
            actorEmail,
            actorRole,
            initialDeviceCode: record.initialDeviceCode,
            activationCode,
            note: record.adminNote,
            origin,
            referer,
            ip,
            userAgent,
            message: 'Activation code issued.'
        }).catch(error => {
            console.warn('Issuer audit log append skipped during issue:', error);
        });

        return jsonWithCookie(200, {
            ok: true,
            activationCode,
            initialDeviceCode: record.initialDeviceCode,
            status: record.status,
            issuedAt: record.issuedAt,
            message: 'Activation code issued.'
        }, refreshedCookie);
    } catch (error) {
        console.error('Activation code issuance failed:', error);
        return jsonWithCookie(500, {
            ok: false,
            message: 'Unable to issue activation code.'
        }, refreshedCookie);
    }
};
