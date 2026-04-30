const {
    JSON_HEADERS,
    buildSessionCookie,
    clearSessionCookie,
    coerceLicenseRecord,
    createSessionToken,
    findRecordDeviceConflicts,
    getHeader,
    getLicenseStore,
    hasStrictSignature,
    isActivationCodeValidForRecord,
    isHttpsRequest,
    isSupportedDeviceCode,
    json,
    normalizeActivationCode,
    normalizeDeviceCode,
    releaseRemovedRecordDeviceClaims,
    reserveRecordDeviceClaims,
    sanitizeDeviceProfile
} = require('./_license');

function buildSuccessPayload(record, status, message, takeover, firstClaim) {
    return {
        ok: true,
        status,
        takeover: Boolean(takeover),
        firstClaim: Boolean(firstClaim),
        activationCode: record.activationCode,
        initialDeviceCode: record.initialDeviceCode,
        currentDeviceCode: record.currentDeviceCode || '',
        previousDeviceCode: record.previousDeviceCode || '',
        claimedAt: record.claimedAt || '',
        updatedAt: record.lastSeenAt || record.boundAt || record.issuedAt,
        message
    };
}

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

function serializeConflict(record) {
    return {
        activationCode: record.activationCode,
        initialDeviceCode: record.initialDeviceCode,
        currentDeviceCode: record.currentDeviceCode,
        previousDeviceCode: record.previousDeviceCode,
        status: record.status,
        issuedAt: record.issuedAt,
        claimedAt: record.claimedAt
    };
}

function buildDuplicateDeviceResponse(conflicts) {
    const list = Array.isArray(conflicts) ? conflicts : [];
    return {
        ok: false,
        code: 'DUPLICATE_DEVICE_CODE',
        status: 'denied',
        duplicateCount: list.length,
        conflicts: list.slice(0, 20).map(serializeConflict),
        message: 'This device code is already used by another activation record. Repair duplicates in the issuer console first.'
    };
}

async function persistReservedRecord(store, activationCode, previousRecord, nextRecord, metadata) {
    try {
        await store.setJSON(activationCode, nextRecord, { metadata });
    } catch (error) {
        await releaseRemovedRecordDeviceClaims(nextRecord, previousRecord, store).catch(() => undefined);
        throw error;
    }
}

exports.handler = async function handler(event) {
    const secureCookie = isHttpsRequest(event.headers);
    const clearCookie = clearSessionCookie({ secure: secureCookie });
    const userAgent = getHeader(event.headers, 'user-agent');

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

    const mode = body.mode === 'activate' ? 'activate' : body.mode === 'verify' ? 'verify' : '';
    const activationCode = normalizeActivationCode(body.activationCode);
    const deviceCode = normalizeDeviceCode(body.deviceCode);
    const deviceProfile = sanitizeDeviceProfile(body.deviceProfile);
    const now = new Date().toISOString();

    if (!mode) {
        return jsonWithCookie(400, {
            ok: false,
            message: 'mode is required.'
        }, clearCookie);
    }

    if (activationCode.length < 8) {
        return jsonWithCookie(400, {
            ok: false,
            message: 'activationCode is invalid.'
        }, clearCookie);
    }

    if (!isSupportedDeviceCode(deviceCode)) {
        return jsonWithCookie(400, {
            ok: false,
            message: 'deviceCode must be a valid device code.'
        }, clearCookie);
    }

    try {
        const store = getLicenseStore();
        const existingRecord = await store.get(activationCode, { type: 'json' });

        if (!existingRecord) {
            return jsonWithCookie(403, {
                ok: false,
                code: 'INVALID_CODE',
                status: 'denied',
                message: 'Activation code was not found.'
            }, clearCookie);
        }

        const record = coerceLicenseRecord(activationCode, existingRecord, now);

        if (!hasStrictSignature(record) || !isActivationCodeValidForRecord(activationCode, record)) {
            return jsonWithCookie(403, {
                ok: false,
                code: 'INVALID_SIGNATURE',
                status: 'denied',
                message: 'Activation code signature is invalid.'
            }, clearCookie);
        }

        if (record.status === 'revoked') {
            return jsonWithCookie(403, {
                ok: false,
                code: 'REVOKED_CODE',
                status: 'denied',
                message: 'Activation code has been revoked.'
            }, clearCookie);
        }

        if (record.status === 'issued' || !record.claimedAt) {
            if (record.initialDeviceCode !== deviceCode) {
                return jsonWithCookie(403, {
                    ok: false,
                    code: 'INITIAL_DEVICE_MISMATCH',
                    status: 'denied',
                    expectedDeviceCode: record.initialDeviceCode,
                    message: 'First activation must happen on the original issued device.'
                }, clearCookie);
            }

            const activatedRecord = {
                ...record,
                status: 'active',
                currentDeviceCode: deviceCode,
                previousDeviceCode: '',
                claimedAt: now,
                boundAt: now,
                lastSeenAt: now,
                lastVerifyAt: mode === 'verify' ? now : record.lastVerifyAt,
                lastActivateAt: mode === 'activate' ? now : record.lastActivateAt,
                activationCount: record.activationCount + (mode === 'activate' ? 1 : 0),
                verifyCount: record.verifyCount + (mode === 'verify' ? 1 : 0),
                takeoverCount: record.takeoverCount,
                deviceProfile
            };

            const conflicts = await findRecordDeviceConflicts(activatedRecord, store);
            if (conflicts.length > 0) {
                return jsonWithCookie(409, buildDuplicateDeviceResponse(conflicts), clearCookie);
            }

            const reservation = await reserveRecordDeviceClaims(record, activatedRecord, store);
            if (!reservation.ok) {
                return jsonWithCookie(409, buildDuplicateDeviceResponse(reservation.conflicts), clearCookie);
            }

            await persistReservedRecord(store, activationCode, record, activatedRecord, {
                initialDeviceCode: activatedRecord.initialDeviceCode,
                currentDeviceCode: activatedRecord.currentDeviceCode,
                claimedAt: activatedRecord.claimedAt,
                status: 'active'
            });
            await releaseRemovedRecordDeviceClaims(record, activatedRecord, store);

            const sessionCookie = buildSessionCookie(
                createSessionToken({
                    activationCode,
                    deviceCode,
                    userAgent
                }),
                { secure: secureCookie }
            );

            return jsonWithCookie(200, buildSuccessPayload(
                activatedRecord,
                'first-claim',
                'First activation succeeded.',
                false,
                true
            ), sessionCookie);
        }

        if (record.currentDeviceCode === deviceCode) {
            const verifiedRecord = {
                ...record,
                lastSeenAt: now,
                lastVerifyAt: mode === 'verify' ? now : record.lastVerifyAt,
                lastActivateAt: mode === 'activate' ? now : record.lastActivateAt,
                activationCount: record.activationCount + (mode === 'activate' ? 1 : 0),
                verifyCount: record.verifyCount + (mode === 'verify' ? 1 : 0),
                deviceProfile: record.deviceProfile.userAgent ? record.deviceProfile : deviceProfile
            };

            await store.setJSON(activationCode, verifiedRecord, {
                metadata: {
                    initialDeviceCode: verifiedRecord.initialDeviceCode,
                    currentDeviceCode: verifiedRecord.currentDeviceCode,
                    claimedAt: verifiedRecord.claimedAt,
                    status: 'active'
                }
            });

            const sessionCookie = buildSessionCookie(
                createSessionToken({
                    activationCode,
                    deviceCode,
                    userAgent
                }),
                { secure: secureCookie }
            );

            return jsonWithCookie(200, buildSuccessPayload(
                verifiedRecord,
                'verified',
                'Device verification succeeded.',
                false,
                false
            ), sessionCookie);
        }

        if (mode === 'verify') {
            return jsonWithCookie(403, {
                ok: false,
                code: 'DEVICE_REPLACED',
                status: 'kicked',
                currentDeviceCode: record.currentDeviceCode,
                message: 'This device has been replaced by another device.'
            }, clearCookie);
        }

        const takeoverRecord = {
            ...record,
            previousDeviceCode: record.currentDeviceCode,
            currentDeviceCode: deviceCode,
            boundAt: now,
            lastSeenAt: now,
            lastActivateAt: now,
            activationCount: record.activationCount + 1,
            takeoverCount: record.takeoverCount + 1,
            deviceProfile
        };

        const takeoverConflicts = await findRecordDeviceConflicts(takeoverRecord, store);
        if (takeoverConflicts.length > 0) {
            return jsonWithCookie(409, buildDuplicateDeviceResponse(takeoverConflicts), clearCookie);
        }

        const reservation = await reserveRecordDeviceClaims(record, takeoverRecord, store);
        if (!reservation.ok) {
            return jsonWithCookie(409, buildDuplicateDeviceResponse(reservation.conflicts), clearCookie);
        }

        await persistReservedRecord(store, activationCode, record, takeoverRecord, {
            initialDeviceCode: takeoverRecord.initialDeviceCode,
            currentDeviceCode: takeoverRecord.currentDeviceCode,
            claimedAt: takeoverRecord.claimedAt,
            status: 'active'
        });
        await releaseRemovedRecordDeviceClaims(record, takeoverRecord, store);

        const sessionCookie = buildSessionCookie(
            createSessionToken({
                activationCode,
                deviceCode,
                userAgent
            }),
            { secure: secureCookie }
        );

        return jsonWithCookie(200, buildSuccessPayload(
            takeoverRecord,
            'takeover',
            'Device takeover succeeded.',
            true,
            false
        ), sessionCookie);
    } catch (error) {
        console.error('Activation auth failed:', error);
        return jsonWithCookie(500, {
            ok: false,
            message: 'Activation service failed.'
        }, clearCookie);
    }
};
