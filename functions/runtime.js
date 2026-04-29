const fs = require('fs/promises');
const path = require('path');
const {
    buildSessionCookie,
    clearSessionCookie,
    coerceLicenseRecord,
    createSessionToken,
    getHeader,
    getLicenseStore,
    hasStrictSignature,
    isActivationCodeValidForRecord,
    isHttpsRequest,
    json,
    parseCookieHeader,
    readSessionToken
} = require('./_license');

const RUNTIME_START_MARKERS = [
    "(() => {\r\n    const appRoot = document.getElementById('app-root');",
    "(() => {\n    const appRoot = document.getElementById('app-root');"
];

async function readProtectedRuntimeSource() {
    const sourcePath = path.resolve(process.cwd(), 'script.js');
    const source = await fs.readFile(sourcePath, 'utf8');
    const startIndex = RUNTIME_START_MARKERS
        .map(marker => source.indexOf(marker))
        .find(index => index >= 0);

    if (typeof startIndex !== 'number' || startIndex < 0) {
        throw new Error('Protected runtime marker not found in script.js');
    }

    return source.slice(startIndex);
}

function jsonWithCookie(statusCode, payload, cookie) {
    const response = json(statusCode, payload);
    response.headers = {
        ...response.headers,
        'Set-Cookie': cookie
    };
    return response;
}

function javascriptResponse(body, cookie) {
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/javascript; charset=utf-8',
            'Cache-Control': 'no-store, no-cache, must-revalidate, private',
            'Set-Cookie': cookie
        },
        body
    };
}

exports.handler = async function handler(event) {
    const secureCookie = isHttpsRequest(event.headers);
    const clearCookie = clearSessionCookie({ secure: secureCookie });
    const userAgent = getHeader(event.headers, 'user-agent');

    if (event.httpMethod !== 'GET') {
        return jsonWithCookie(405, {
            ok: false,
            message: 'Method Not Allowed'
        }, clearCookie);
    }

    const cookies = parseCookieHeader(getHeader(event.headers, 'cookie'));
    const session = readSessionToken(cookies.rinno_session, userAgent);
    if (!session) {
        return jsonWithCookie(403, {
            ok: false,
            message: 'Protected runtime session is missing or expired.'
        }, clearCookie);
    }

    try {
        const store = getLicenseStore();
        const existingRecord = await store.get(session.activationCode, { type: 'json' });
        if (!existingRecord) {
            return jsonWithCookie(403, {
                ok: false,
                message: 'Activation record was not found.'
            }, clearCookie);
        }

        const record = coerceLicenseRecord(session.activationCode, existingRecord, new Date().toISOString());
        const runtimeAllowed = record.status !== 'revoked'
            && hasStrictSignature(record)
            && isActivationCodeValidForRecord(session.activationCode, record)
            && record.currentDeviceCode === session.deviceCode;

        if (!runtimeAllowed) {
            return jsonWithCookie(403, {
                ok: false,
                message: 'Protected runtime access was denied for this device.'
            }, clearCookie);
        }

        const runtimeSource = await readProtectedRuntimeSource();
        const sessionCookie = buildSessionCookie(
            createSessionToken({
                activationCode: session.activationCode,
                deviceCode: session.deviceCode,
                userAgent
            }),
            { secure: secureCookie }
        );

        return javascriptResponse(runtimeSource, sessionCookie);
    } catch (error) {
        console.error('Protected runtime failed:', error);
        return jsonWithCookie(500, {
            ok: false,
            message: 'Protected runtime failed to load.'
        }, clearCookie);
    }
};
