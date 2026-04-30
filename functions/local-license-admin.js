const {
    JSON_HEADERS,
    findHistoricalDuplicateRecords,
    findLicenseRecords,
    getLicenseStore,
    issueUniqueActivationRecord,
    isSupportedDeviceCode,
    json,
    normalizeActivationCode,
    normalizeDeviceCode,
    releaseRecordDeviceClaims,
    getHeader
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

function isLocalAdminAllowed(event) {
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

function serializeLicenseRecord(record) {
    return {
        activationCode: record.activationCode,
        initialDeviceCode: record.initialDeviceCode,
        currentDeviceCode: record.currentDeviceCode,
        previousDeviceCode: record.previousDeviceCode,
        status: record.status,
        issuedAt: record.issuedAt,
        claimedAt: record.claimedAt,
        boundAt: record.boundAt,
        lastSeenAt: record.lastSeenAt,
        lastVerifyAt: record.lastVerifyAt,
        lastActivateAt: record.lastActivateAt,
        activationCount: record.activationCount,
        verifyCount: record.verifyCount,
        takeoverCount: record.takeoverCount,
        adminNote: record.adminNote,
        duplicateCount: record.duplicateCount,
        duplicateGroupDeviceCode: record.duplicateGroupDeviceCode,
        duplicateActiveCount: record.duplicateActiveCount
    };
}

exports.handler = async function handler(event) {
    if (!isLocalAdminAllowed(event)) {
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

    if (event.httpMethod === 'GET') {
        const query = event.queryStringParameters || {};
        const deviceCode = normalizeDeviceCode(query.deviceCode);
        const activationCode = normalizeActivationCode(query.activationCode);
        const duplicateHistory = String(query.duplicates || '').trim() === 'true';
        const expandDevice = String(query.expandDevice || '').trim() === 'true';
        const includeRevoked = String(query.includeRevoked || '').trim() === 'true';
        const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
        const maxGroups = Math.max(1, Math.min(200, Number(query.maxGroups) || 50));
        const maxEntries = Math.max(1, Math.min(5000, Number(query.maxEntries) || 500));

        if (!deviceCode && !activationCode && !duplicateHistory) {
            return json(400, {
                ok: false,
                message: 'deviceCode, activationCode, or duplicates=true is required.'
            });
        }

        try {
            const store = getLicenseStore();

            if (duplicateHistory) {
                const report = await findHistoricalDuplicateRecords({
                    store,
                    includeRevoked,
                    maxGroups,
                    maxEntries
                });

                return json(200, {
                    ok: true,
                    history: true,
                    totalGroups: report.totalGroups,
                    totalEntries: report.totalEntries,
                    entries: report.entries.map(serializeLicenseRecord),
                    groups: report.groups.map(group => ({
                        deviceCode: group.deviceCode,
                        duplicateCount: group.duplicateCount,
                        activeCount: group.activeCount
                    }))
                });
            }

            let resolvedDeviceCode = deviceCode;
            let entries = [];

            if (activationCode && expandDevice) {
                const seedEntries = await findLicenseRecords({
                    activationCode,
                    includeRevoked: true,
                    limit: 1,
                    store
                });
                const seed = seedEntries[0];
                if (!seed) {
                    return json(404, {
                        ok: false,
                        message: 'Activation record was not found.'
                    });
                }
                resolvedDeviceCode = seed.initialDeviceCode;
                entries = await findLicenseRecords({
                    deviceCode: resolvedDeviceCode,
                    includeRevoked,
                    limit,
                    store
                });
            } else {
                entries = await findLicenseRecords({
                    deviceCode,
                    activationCode,
                    includeRevoked,
                    limit,
                    store
                });
            }

            return json(200, {
                ok: true,
                entries: entries.map(serializeLicenseRecord),
                duplicateCount: resolvedDeviceCode ? entries.length : undefined,
                deviceCode: resolvedDeviceCode || undefined
            });
        } catch (error) {
            console.error('Local license lookup failed:', error);
            return json(500, {
                ok: false,
                message: 'Unable to query activation records.'
            });
        }
    }

    if (event.httpMethod === 'DELETE') {
        let body = {};
        try {
            body = JSON.parse(event.body || '{}');
        } catch (error) {
            return json(400, {
                ok: false,
                message: 'Invalid JSON body.'
            });
        }

        const activationCode = normalizeActivationCode(body.activationCode);
        if (!activationCode) {
            return json(400, {
                ok: false,
                message: 'activationCode is required.'
            });
        }

        try {
            const store = getLicenseStore();
            const matches = await findLicenseRecords({
                activationCode,
                includeRevoked: true,
                limit: 1,
                store
            });
            const record = matches[0];
            if (!record) {
                return json(404, {
                    ok: false,
                    message: 'Activation record was not found.'
                });
            }

            if (record.status !== 'revoked') {
                const revokedAt = new Date().toISOString();
                await store.setJSON(activationCode, {
                    ...record,
                    status: 'revoked',
                    previousDeviceCode: record.currentDeviceCode || record.previousDeviceCode,
                    currentDeviceCode: '',
                    lastSeenAt: revokedAt
                }, {
                    metadata: {
                        initialDeviceCode: record.initialDeviceCode,
                        status: 'revoked',
                        issuedAt: record.issuedAt
                    }
                });
            }

            await releaseRecordDeviceClaims(record, store);

            return json(200, {
                ok: true,
                entry: serializeLicenseRecord({
                    ...record,
                    status: 'revoked',
                    currentDeviceCode: '',
                    previousDeviceCode: record.currentDeviceCode || record.previousDeviceCode
                }),
                message: 'Activation code revoked.'
            });
        } catch (error) {
            console.error('Local license revoke failed:', error);
            return json(500, {
                ok: false,
                message: 'Unable to revoke activation code.'
            });
        }
    }

    if (event.httpMethod === 'POST') {
        let body = {};
        try {
            body = JSON.parse(event.body || '{}');
        } catch (error) {
            return json(400, {
                ok: false,
                message: 'Invalid JSON body.'
            });
        }

        const action = String(body.action || '').trim().toLowerCase();
        let deviceCode = normalizeDeviceCode(body.deviceCode);
        const activationCode = normalizeActivationCode(body.activationCode);
        if (action !== 'repair') {
            return json(400, {
                ok: false,
                message: 'Unsupported action.'
            });
        }
        if (!isSupportedDeviceCode(deviceCode) && !activationCode) {
            return json(400, {
                ok: false,
                message: 'deviceCode or activationCode is required.'
            });
        }

        try {
            const store = getLicenseStore();
            if (!isSupportedDeviceCode(deviceCode) && activationCode) {
                const seedEntries = await findLicenseRecords({
                    activationCode,
                    includeRevoked: true,
                    limit: 1,
                    store
                });
                const seed = seedEntries[0];
                if (!seed) {
                    return json(404, {
                        ok: false,
                        message: 'Activation record was not found.'
                    });
                }
                deviceCode = seed.initialDeviceCode;
            }

            const entries = await findLicenseRecords({
                deviceCode,
                includeRevoked: true,
                limit: 100,
                store
            });
            const activeEntries = entries.filter(entry => entry.status !== 'revoked');
            for (const entry of activeEntries) {
                const revokedAt = new Date().toISOString();
                await store.setJSON(entry.activationCode, {
                    ...entry,
                    status: 'revoked',
                    previousDeviceCode: entry.currentDeviceCode || entry.previousDeviceCode,
                    currentDeviceCode: '',
                    lastSeenAt: revokedAt
                }, {
                    metadata: {
                        initialDeviceCode: entry.initialDeviceCode,
                        status: 'revoked',
                        issuedAt: entry.issuedAt
                    }
                });
                await releaseRecordDeviceClaims(entry, store);
            }

            const noteSource = entries[0] && entries[0].adminNote ? entries[0].adminNote : 'localhost-dev-repair';
            const issued = await issueUniqueActivationRecord(deviceCode, `${noteSource} / repaired`);
            if (!issued.ok) {
                throw new Error('Unable to repair duplicate activation records.');
            }

            return json(200, {
                ok: true,
                repaired: true,
                revokedCount: activeEntries.length,
                deviceCode,
                entry: serializeLicenseRecord(issued.record),
                replacedEntries: activeEntries.map(serializeLicenseRecord),
                message: 'Duplicate activation records repaired.'
            });
        } catch (error) {
            console.error('Local license repair failed:', error);
            return json(500, {
                ok: false,
                message: 'Unable to repair duplicate activation records.'
            });
        }
    }

    return json(405, {
        ok: false,
        message: 'Method Not Allowed'
    });
};
