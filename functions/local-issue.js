const {
    JSON_HEADERS,
    getHeader,
    issueUniqueActivationRecord,
    isSupportedDeviceCode,
    json,
    normalizeDeviceCode
} = require('./_license');

const LOCAL_HOST_PATTERN = /^(localhost|127(?:\.\d{1,3}){3}|\[::1\]|::1)(?::\d+)?$/i;

function isLocalUrl(value) {
    const source = String(value || '').trim();
    if (!source) return false;
    try {
        const target = new URL(source);
        return LOCAL_HOST_PATTERN.test(target.host);
    } catch (error) {
        return false;
    }
}

function isLocalIssueAllowed(event) {
    const host = String(getHeader(event.headers, 'host') || '').trim();
    const origin = getHeader(event.headers, 'origin');
    const referer = getHeader(event.headers, 'referer');
    const localEnv = process.env.NETLIFY_DEV === 'true'
        || process.env.NETLIFY_LOCAL === 'true'
        || process.env.RINNO_ALLOW_LOCAL_ISSUE === 'true';

    if (!localEnv) return false;
    if (!LOCAL_HOST_PATTERN.test(host)) return false;
    if (origin && !isLocalUrl(origin)) return false;
    if (!origin && referer && !isLocalUrl(referer)) return false;
    return true;
}

exports.handler = async function handler(event) {
    if (!isLocalIssueAllowed(event)) {
        return {
            statusCode: 404,
            headers: JSON_HEADERS,
            body: JSON.stringify({
                ok: false,
                message: 'Not found.'
            })
        };
    }

    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers: JSON_HEADERS,
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return json(405, {
            ok: false,
            message: 'Method Not Allowed'
        });
    }

    let body = {};
    try {
        body = JSON.parse(event.body || '{}');
    } catch (error) {
        return json(400, {
            ok: false,
            message: 'Invalid JSON body.'
        });
    }

    const deviceCode = normalizeDeviceCode(body.deviceCode);
    if (!isSupportedDeviceCode(deviceCode)) {
        return json(400, {
            ok: false,
            message: 'deviceCode must be a valid device code.'
        });
    }

    const note = String(body.note || 'localhost-dev-issue').trim().slice(0, 120);
    try {
        const issued = await issueUniqueActivationRecord(deviceCode, note);
        if (!issued.ok) {
            const duplicate = issued.record;
            return json(409, {
                ok: false,
                code: 'DUPLICATE_DEVICE_CODE',
                message: 'This device code already has an activation record.',
                activationCode: duplicate.activationCode,
                initialDeviceCode: duplicate.initialDeviceCode,
                currentDeviceCode: duplicate.currentDeviceCode,
                status: duplicate.status,
                issuedAt: duplicate.issuedAt,
                claimedAt: duplicate.claimedAt,
                duplicateCount: Array.isArray(issued.duplicates) ? issued.duplicates.length : 1
            });
        }

        const record = issued.record;

        return json(200, {
            ok: true,
            activationCode: record.activationCode,
            initialDeviceCode: record.initialDeviceCode,
            status: record.status,
            issuedAt: record.issuedAt,
            message: 'Local development activation code issued.'
        });
    } catch (error) {
        console.error('Local activation code issuance failed:', error);
        return json(500, {
            ok: false,
            message: 'Unable to issue local development activation code.'
        });
    }
};
