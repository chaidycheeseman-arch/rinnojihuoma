const {
    buildAdminSessionCookie,
    clearAdminSessionCookie,
    createAdminSessionToken,
    findHistoricalDuplicateRecords,
    findLicenseRecords,
    getClientIp,
    getHeader,
    getLicenseStore,
    isHttpsRequest,
    json,
    normalizeActivationCode,
    normalizeDeviceCode,
    releaseRecordDeviceClaims,
    readAuthenticatedAdminFromRequest,
    appendIssuerAuditLog,
    issueUniqueActivationRecord
} = require('./_license');

function jsonWithCookie(statusCode, payload, cookie) {
    const response = json(statusCode, payload);
    response.headers = {
        ...response.headers,
        'Set-Cookie': cookie
    };
    return response;
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
            return jsonWithCookie(400, {
                ok: false,
                message: 'deviceCode, activationCode, or duplicates=true is required.'
            }, refreshedCookie);
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

                return jsonWithCookie(200, {
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
                }, refreshedCookie);
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
                    return jsonWithCookie(404, {
                        ok: false,
                        message: 'Activation record was not found.'
                    }, refreshedCookie);
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

            return jsonWithCookie(200, {
                ok: true,
                entries: entries.map(serializeLicenseRecord),
                duplicateCount: resolvedDeviceCode ? entries.length : undefined,
                deviceCode: resolvedDeviceCode || undefined
            }, refreshedCookie);
        } catch (error) {
            console.error('License lookup failed:', error);
            return jsonWithCookie(500, {
                ok: false,
                message: 'Unable to query activation records.'
            }, refreshedCookie);
        }
    }

    if (event.httpMethod === 'DELETE') {
        let body = {};
        try {
            body = JSON.parse(event.body || '{}');
        } catch (error) {
            return jsonWithCookie(400, {
                ok: false,
                message: 'Invalid JSON body.'
            }, refreshedCookie);
        }

        const activationCode = normalizeActivationCode(body.activationCode);
        if (!activationCode) {
            return jsonWithCookie(400, {
                ok: false,
                message: 'activationCode is required.'
            }, refreshedCookie);
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
                return jsonWithCookie(404, {
                    ok: false,
                    message: 'Activation record was not found.'
                }, refreshedCookie);
            }

            if (record.status !== 'revoked') {
                const revokedAt = new Date().toISOString();
                const revokedRecord = {
                    ...record,
                    status: 'revoked',
                    previousDeviceCode: record.currentDeviceCode || record.previousDeviceCode,
                    currentDeviceCode: '',
                    lastSeenAt: revokedAt
                };

                await store.setJSON(activationCode, revokedRecord, {
                    metadata: {
                        initialDeviceCode: revokedRecord.initialDeviceCode,
                        status: revokedRecord.status,
                        issuedAt: revokedRecord.issuedAt
                    }
                });
            }

            await releaseRecordDeviceClaims(record, store);

            await appendIssuerAuditLog({
                type: 'revoke-code',
                outcome: 'success',
                authMode: 'session',
                actorId: auth.account.id,
                actorEmail: auth.account.email,
                actorRole: auth.account.role,
                initialDeviceCode: record.initialDeviceCode,
                activationCode,
                note: record.adminNote,
                origin,
                referer,
                ip,
                userAgent,
                message: 'Activation code revoked.'
            }).catch(error => {
                console.warn('Issuer audit log append skipped during revoke:', error);
            });

            return jsonWithCookie(200, {
                ok: true,
                entry: serializeLicenseRecord({
                    ...record,
                    status: 'revoked',
                    currentDeviceCode: '',
                    previousDeviceCode: record.currentDeviceCode || record.previousDeviceCode
                }),
                message: 'Activation code revoked.'
            }, refreshedCookie);
        } catch (error) {
            console.error('License revoke failed:', error);
            return jsonWithCookie(500, {
                ok: false,
                message: 'Unable to revoke activation code.'
            }, refreshedCookie);
        }
    }

    if (event.httpMethod === 'POST') {
        let body = {};
        try {
            body = JSON.parse(event.body || '{}');
        } catch (error) {
            return jsonWithCookie(400, {
                ok: false,
                message: 'Invalid JSON body.'
            }, refreshedCookie);
        }

        const action = String(body.action || '').trim().toLowerCase();
        let deviceCode = normalizeDeviceCode(body.deviceCode);
        const activationCode = normalizeActivationCode(body.activationCode);
        if (action !== 'repair') {
            return jsonWithCookie(400, {
                ok: false,
                message: 'Unsupported action.'
            }, refreshedCookie);
        }
        if (deviceCode.length !== 12 && !activationCode) {
            return jsonWithCookie(400, {
                ok: false,
                message: 'deviceCode or activationCode is required.'
            }, refreshedCookie);
        }

        try {
            const store = getLicenseStore();
            if (deviceCode.length !== 12 && activationCode) {
                const seedEntries = await findLicenseRecords({
                    activationCode,
                    includeRevoked: true,
                    limit: 1,
                    store
                });
                const seed = seedEntries[0];
                if (!seed) {
                    return jsonWithCookie(404, {
                        ok: false,
                        message: 'Activation record was not found.'
                    }, refreshedCookie);
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

            const noteSource = entries[0] && entries[0].adminNote ? entries[0].adminNote : 'duplicate-repair';
            const issued = await issueUniqueActivationRecord(deviceCode, `${noteSource} / repaired`);
            if (!issued.ok) {
                throw new Error('Unable to repair duplicate activation records.');
            }

            await appendIssuerAuditLog({
                type: 'repair-duplicates',
                outcome: 'success',
                authMode: 'session',
                actorId: auth.account.id,
                actorEmail: auth.account.email,
                actorRole: auth.account.role,
                initialDeviceCode: deviceCode,
                activationCode: issued.record.activationCode,
                note: `${noteSource} / repaired`,
                origin,
                referer,
                ip,
                userAgent,
                message: `Duplicate records repaired. Revoked ${activeEntries.length} record(s).`
            }).catch(error => {
                console.warn('Issuer audit log append skipped during repair:', error);
            });

            return jsonWithCookie(200, {
                ok: true,
                repaired: true,
                revokedCount: activeEntries.length,
                deviceCode,
                entry: serializeLicenseRecord(issued.record),
                replacedEntries: activeEntries.map(serializeLicenseRecord),
                message: 'Duplicate activation records repaired.'
            }, refreshedCookie);
        } catch (error) {
            console.error('License repair failed:', error);
            return jsonWithCookie(500, {
                ok: false,
                message: 'Unable to repair duplicate activation records.'
            }, refreshedCookie);
        }
    }

    return jsonWithCookie(405, {
        ok: false,
        message: 'Method Not Allowed'
    }, refreshedCookie);
};
