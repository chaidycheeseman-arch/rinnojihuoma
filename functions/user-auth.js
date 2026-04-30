const {
    JSON_HEADERS,
    USER_PASSWORD_MAX_LENGTH,
    USER_PASSWORD_MIN_LENGTH,
    buildSessionCookie,
    clearSessionCookie,
    coerceLicenseRecord,
    createSessionToken,
    findLicenseRecordByAccountId,
    findRecordDeviceConflicts,
    getHeader,
    getLicenseStore,
    hasStrictSignature,
    hashUserPassword,
    isActivationCodeValidForRecord,
    isHttpsRequest,
    isSupportedDeviceCode,
    json,
    normalizeActivationCode,
    normalizeDeviceCode,
    normalizeUserAccountId,
    releaseRemovedRecordDeviceClaims,
    reserveRecordDeviceClaims,
    sanitizeDeviceProfile,
    sanitizeString,
    verifyUserPassword,
    writeUserAccountIndex
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

function buildSuccessPayload(record, status, message, options = {}) {
    return {
        ok: true,
        status,
        takeover: Boolean(options.takeover),
        firstClaim: Boolean(options.firstClaim),
        registered: Boolean(options.registered),
        verified: Boolean(options.verified),
        activationCode: record.activationCode,
        accountId: record.accountId,
        accountDisplayName: record.accountDisplayName || record.accountId,
        initialDeviceCode: record.initialDeviceCode,
        currentDeviceCode: record.currentDeviceCode || '',
        previousDeviceCode: record.previousDeviceCode || '',
        claimedAt: record.claimedAt || '',
        registeredAt: record.accountRegisteredAt || '',
        updatedAt: record.lastSeenAt || record.boundAt || record.issuedAt,
        message
    };
}

function serializeConflict(record) {
    return {
        activationCode: record.activationCode,
        initialDeviceCode: record.initialDeviceCode,
        currentDeviceCode: record.currentDeviceCode,
        previousDeviceCode: record.previousDeviceCode,
        accountId: record.accountId,
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
        message: 'This device code is already occupied by another activation record.'
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

function buildSessionPayload(record, userAgent, secureCookie) {
    return buildSessionCookie(createSessionToken({
        activationCode: record.activationCode,
        deviceCode: record.currentDeviceCode,
        userAgent
    }), { secure: secureCookie });
}

function isRevokedRecord(record) {
    return record.status === 'revoked';
}

function buildRecordMetadata(record) {
    return {
        initialDeviceCode: record.initialDeviceCode,
        currentDeviceCode: record.currentDeviceCode,
        claimedAt: record.claimedAt,
        status: record.status
    };
}

function sanitizePassword(value) {
    return String(value || '').trim();
}

function accountDisplayNameFromInput(accountId, displayName) {
    return sanitizeString(displayName, 80) || accountId;
}

async function refreshAccountIndex(store, record) {
    if (!record.accountId || !record.activationCode) return;
    await writeUserAccountIndex(record.accountId, record.activationCode, store).catch(error => {
        console.warn('User account index refresh skipped:', error);
    });
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

    const mode = body.mode === 'register'
        ? 'register'
        : body.mode === 'login'
            ? 'login'
            : body.mode === 'verify'
                ? 'verify'
                : '';
    const activationCode = normalizeActivationCode(body.activationCode);
    const deviceCode = normalizeDeviceCode(body.deviceCode);
    const accountId = normalizeUserAccountId(body.accountId || body.account || body.username || body.email);
    const displayName = accountDisplayNameFromInput(accountId, body.accountDisplayName || body.displayName || body.nickname);
    const password = sanitizePassword(body.password);
    const deviceProfile = sanitizeDeviceProfile(body.deviceProfile);
    const now = new Date().toISOString();

    if (!mode) {
        return jsonWithCookie(400, {
            ok: false,
            message: 'mode is required.'
        }, clearCookie);
    }

    if (!isSupportedDeviceCode(deviceCode)) {
        return jsonWithCookie(400, {
            ok: false,
            message: 'deviceCode must be a valid device code.'
        }, clearCookie);
    }

    if (mode === 'register') {
        if (activationCode.length < 8) {
            return jsonWithCookie(400, {
                ok: false,
                code: 'INVALID_CODE',
                message: 'activationCode is invalid.'
            }, clearCookie);
        }
        if (!accountId) {
            return jsonWithCookie(400, {
                ok: false,
                code: 'INVALID_ACCOUNT',
                message: 'accountId is required.'
            }, clearCookie);
        }
        if (password.length < USER_PASSWORD_MIN_LENGTH || password.length > USER_PASSWORD_MAX_LENGTH) {
            return jsonWithCookie(400, {
                ok: false,
                code: 'INVALID_PASSWORD',
                message: `password must be ${USER_PASSWORD_MIN_LENGTH}-${USER_PASSWORD_MAX_LENGTH} characters.`
            }, clearCookie);
        }
    }

    if (mode === 'login') {
        if (!accountId) {
            return jsonWithCookie(400, {
                ok: false,
                code: 'INVALID_ACCOUNT',
                message: 'accountId is required.'
            }, clearCookie);
        }
        if (!password) {
            return jsonWithCookie(400, {
                ok: false,
                code: 'INVALID_PASSWORD',
                message: 'password is required.'
            }, clearCookie);
        }
    }

    if (mode === 'verify' && activationCode.length < 8) {
        return jsonWithCookie(400, {
            ok: false,
            code: 'INVALID_CODE',
            message: 'activationCode is invalid.'
        }, clearCookie);
    }

    try {
        const store = getLicenseStore();

        if (mode === 'register') {
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

            if (isRevokedRecord(record)) {
                return jsonWithCookie(403, {
                    ok: false,
                    code: 'REVOKED_CODE',
                    status: 'denied',
                    message: 'Activation code has been revoked.'
                }, clearCookie);
            }

            if (record.accountId) {
                return jsonWithCookie(409, {
                    ok: false,
                    code: 'ACCOUNT_ALREADY_REGISTERED',
                    status: 'denied',
                    accountId: record.accountId,
                    message: 'This activation code has already been used to register an account.'
                }, clearCookie);
            }

            const existingAccountRecord = await findLicenseRecordByAccountId(accountId, store);
            if (
                existingAccountRecord
                && existingAccountRecord.activationCode !== activationCode
                && existingAccountRecord.status !== 'revoked'
            ) {
                return jsonWithCookie(409, {
                    ok: false,
                    code: 'ACCOUNT_ID_TAKEN',
                    status: 'denied',
                    accountId,
                    message: 'This account is already bound to another activation code.'
                }, clearCookie);
            }

            if (record.status !== 'issued' || record.claimedAt) {
                return jsonWithCookie(409, {
                    ok: false,
                    code: 'ALREADY_ACTIVATED',
                    status: 'denied',
                    message: 'This activation code has already been claimed. Please log in with the registered account.'
                }, clearCookie);
            }

            if (record.initialDeviceCode !== deviceCode) {
                return jsonWithCookie(403, {
                    ok: false,
                    code: 'INITIAL_DEVICE_MISMATCH',
                    status: 'denied',
                    expectedDeviceCode: record.initialDeviceCode,
                    message: 'First registration must happen on the original issued device.'
                }, clearCookie);
            }

            const nextRecord = {
                ...record,
                status: 'active',
                currentDeviceCode: deviceCode,
                previousDeviceCode: '',
                claimedAt: now,
                boundAt: now,
                lastSeenAt: now,
                lastVerifyAt: '',
                lastActivateAt: now,
                activationCount: record.activationCount + 1,
                verifyCount: record.verifyCount,
                takeoverCount: record.takeoverCount,
                deviceProfile,
                accountId,
                accountDisplayName: displayName,
                ...hashUserPassword(password),
                accountRegisteredAt: now,
                accountLastLoginAt: now,
                accountSessionVersion: Math.max(1, Number(record.accountSessionVersion) || 1)
            };

            const conflicts = await findRecordDeviceConflicts(nextRecord, store);
            if (conflicts.length > 0) {
                return jsonWithCookie(409, buildDuplicateDeviceResponse(conflicts), clearCookie);
            }

            const reservation = await reserveRecordDeviceClaims(record, nextRecord, store);
            if (!reservation.ok) {
                return jsonWithCookie(409, buildDuplicateDeviceResponse(reservation.conflicts), clearCookie);
            }

            await persistReservedRecord(store, activationCode, record, nextRecord, buildRecordMetadata(nextRecord));
            await releaseRemovedRecordDeviceClaims(record, nextRecord, store);
            await refreshAccountIndex(store, nextRecord);

            return jsonWithCookie(200, buildSuccessPayload(
                nextRecord,
                'registered',
                'Account registration succeeded.',
                { firstClaim: true, registered: true }
            ), buildSessionPayload(nextRecord, userAgent, secureCookie));
        }

        if (mode === 'login') {
            const record = await findLicenseRecordByAccountId(accountId, store);
            if (!record || !record.accountId) {
                return jsonWithCookie(403, {
                    ok: false,
                    code: 'ACCOUNT_NOT_FOUND',
                    status: 'denied',
                    message: 'Account was not found.'
                }, clearCookie);
            }

            if (!hasStrictSignature(record) || !isActivationCodeValidForRecord(record.activationCode, record)) {
                return jsonWithCookie(403, {
                    ok: false,
                    code: 'INVALID_SIGNATURE',
                    status: 'denied',
                    message: 'Activation code signature is invalid.'
                }, clearCookie);
            }

            if (isRevokedRecord(record)) {
                return jsonWithCookie(403, {
                    ok: false,
                    code: 'REVOKED_CODE',
                    status: 'denied',
                    message: 'Activation code has been revoked.'
                }, clearCookie);
            }

            if (!verifyUserPassword(record, password)) {
                return jsonWithCookie(403, {
                    ok: false,
                    code: 'INVALID_CREDENTIALS',
                    status: 'denied',
                    message: 'Account or password is invalid.'
                }, clearCookie);
            }

            if (record.currentDeviceCode === deviceCode) {
                const verifiedRecord = {
                    ...record,
                    lastSeenAt: now,
                    lastVerifyAt: now,
                    verifyCount: record.verifyCount + 1,
                    deviceProfile: record.deviceProfile.userAgent ? record.deviceProfile : deviceProfile,
                    accountLastLoginAt: now
                };

                await store.setJSON(record.activationCode, verifiedRecord, {
                    metadata: buildRecordMetadata(verifiedRecord)
                });
                await refreshAccountIndex(store, verifiedRecord);

                return jsonWithCookie(200, buildSuccessPayload(
                    verifiedRecord,
                    'logged-in',
                    'Login succeeded.',
                    { verified: true }
                ), buildSessionPayload(verifiedRecord, userAgent, secureCookie));
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
                deviceProfile,
                accountLastLoginAt: now
            };

            const conflicts = await findRecordDeviceConflicts(takeoverRecord, store);
            if (conflicts.length > 0) {
                return jsonWithCookie(409, buildDuplicateDeviceResponse(conflicts), clearCookie);
            }

            const reservation = await reserveRecordDeviceClaims(record, takeoverRecord, store);
            if (!reservation.ok) {
                return jsonWithCookie(409, buildDuplicateDeviceResponse(reservation.conflicts), clearCookie);
            }

            await persistReservedRecord(store, record.activationCode, record, takeoverRecord, buildRecordMetadata(takeoverRecord));
            await releaseRemovedRecordDeviceClaims(record, takeoverRecord, store);
            await refreshAccountIndex(store, takeoverRecord);

            return jsonWithCookie(200, buildSuccessPayload(
                takeoverRecord,
                'takeover',
                'Login takeover succeeded.',
                { takeover: true }
            ), buildSessionPayload(takeoverRecord, userAgent, secureCookie));
        }

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

        if (isRevokedRecord(record)) {
            return jsonWithCookie(403, {
                ok: false,
                code: 'REVOKED_CODE',
                status: 'denied',
                message: 'Activation code has been revoked.'
            }, clearCookie);
        }

        if (!record.accountId) {
            return jsonWithCookie(403, {
                ok: false,
                code: 'ACCOUNT_REQUIRED',
                status: 'denied',
                message: 'This activation code has not completed account registration yet.'
            }, clearCookie);
        }

        if (accountId && record.accountId !== accountId) {
            return jsonWithCookie(403, {
                ok: false,
                code: 'ACCOUNT_MISMATCH',
                status: 'denied',
                expectedAccountId: record.accountId,
                message: 'The stored account does not match this activation record.'
            }, clearCookie);
        }

        if (record.currentDeviceCode !== deviceCode) {
            return jsonWithCookie(403, {
                ok: false,
                code: 'DEVICE_REPLACED',
                status: 'kicked',
                accountId: record.accountId,
                currentDeviceCode: record.currentDeviceCode,
                message: 'This device has been replaced by another device.'
            }, clearCookie);
        }

        const verifiedRecord = {
            ...record,
            lastSeenAt: now,
            lastVerifyAt: now,
            verifyCount: record.verifyCount + 1
        };

        await store.setJSON(record.activationCode, verifiedRecord, {
            metadata: buildRecordMetadata(verifiedRecord)
        });
        await refreshAccountIndex(store, verifiedRecord);

        return jsonWithCookie(200, buildSuccessPayload(
            verifiedRecord,
            'verified',
            'Device verification succeeded.',
            { verified: true }
        ), buildSessionPayload(verifiedRecord, userAgent, secureCookie));
    } catch (error) {
        console.error('User auth failed:', error);
        return jsonWithCookie(500, {
            ok: false,
            message: 'User authentication service failed.'
        }, clearCookie);
    }
};
