const {
    JSON_HEADERS,
    buildActivationCode,
    createIssuedRecord,
    getHeader,
    getLicenseStore,
    json,
    makeCodeId,
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
    if (deviceCode.length !== 12) {
        return json(400, {
            ok: false,
            message: 'deviceCode must be a 12-character device fingerprint.'
        });
    }

    const note = String(body.note || 'localhost-dev-issue').trim().slice(0, 120);
    const issuedAt = new Date().toISOString();
    const codeId = makeCodeId();
    const activationCode = buildActivationCode(deviceCode, codeId);
    const record = createIssuedRecord(deviceCode, activationCode, codeId, note, issuedAt);

    try {
        const store = getLicenseStore();
        await store.setJSON(activationCode, record, {
            metadata: {
                initialDeviceCode: record.initialDeviceCode,
                status: record.status,
                issuedAt: record.issuedAt
            }
        });

        return json(200, {
            ok: true,
            activationCode,
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
