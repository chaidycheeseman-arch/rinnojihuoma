const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const { getStore } = require('@netlify/blobs');

const STORE_NAME = process.env.RINNO_ACTIVATION_STORE || 'rinno-activation-codes';
const DEFAULT_LOCAL_STORE_PATH = '.data/licenses.json';
const CODE_PREFIX = 'RN';
const DEVICE_CODE_LENGTH = 16;
const DEVICE_PREFIX_LENGTH = 4;
const CODE_ID_LENGTH = 20;
const SIGNATURE_LENGTH = 12;
const SESSION_COOKIE_NAME = 'rinno_session';
const SESSION_TTL_MS = 10 * 60 * 1000;
const ADMIN_SESSION_COOKIE_NAME = 'rinno_admin_session';
const ADMIN_SESSION_TTL_MS = Math.max(
    15 * 60 * 1000,
    (Number(process.env.RINNO_ADMIN_SESSION_TTL_MINUTES) || 8 * 60) * 60 * 1000
);
const ADMIN_ACCOUNTS_KEY = '__rinno_admin_accounts__';
const ADMIN_ACCOUNT_LIMIT = Math.max(2, Number(process.env.RINNO_ADMIN_ACCOUNT_LIMIT) || 32);
const ADMIN_PASSWORD_MIN_LENGTH = Math.max(8, Number(process.env.RINNO_ADMIN_PASSWORD_MIN_LENGTH) || 8);
const AUDIT_LOG_KEY = '__rinno_issuer_audit_log__';
const AUDIT_LOG_LIMIT = Math.max(20, Number(process.env.RINNO_AUDIT_LOG_LIMIT) || 200);
const DEVICE_CLAIM_KEY_PREFIX = 'DEVICELOCK';
const DEVICE_INDEX_KEY_PREFIX = 'DEVICEINDEX';
const DEVICE_ALLOCATION_KEY_PREFIX = 'DEVICEID';
const USER_ACCOUNT_KEY_PREFIX = 'USERACCOUNT';
const DEVICE_INDEX_LIMIT = Math.max(20, Number(process.env.RINNO_DEVICE_INDEX_LIMIT) || 200);
const USER_ACCOUNT_ID_LIMIT = Math.max(24, Number(process.env.RINNO_USER_ACCOUNT_ID_LIMIT) || 80);
const USER_DISPLAY_NAME_LIMIT = Math.max(24, Number(process.env.RINNO_USER_DISPLAY_NAME_LIMIT) || 80);
const USER_PASSWORD_MIN_LENGTH = Math.max(6, Number(process.env.RINNO_USER_PASSWORD_MIN_LENGTH) || 6);
const USER_PASSWORD_MAX_LENGTH = Math.max(
    USER_PASSWORD_MIN_LENGTH,
    Number(process.env.RINNO_USER_PASSWORD_MAX_LENGTH) || 48
);
const RANDOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const JSON_HEADERS = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Key'
};

let localStoreWriteChain = Promise.resolve();

function json(statusCode, payload) {
    return {
        statusCode,
        headers: JSON_HEADERS,
        body: JSON.stringify(payload)
    };
}

function normalizeActivationCode(value) {
    return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 64);
}

function normalizeDeviceCode(value) {
    return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, DEVICE_CODE_LENGTH);
}

function isCurrentDeviceCode(value) {
    return normalizeDeviceCode(value).length === DEVICE_CODE_LENGTH;
}

function isSupportedDeviceCode(value) {
    return isCurrentDeviceCode(value);
}

function formatDeviceCode(value) {
    const normalized = normalizeDeviceCode(value);
    if (!normalized) return '';
    return (normalized.match(/.{1,4}/g) || [normalized]).join('-');
}

function sanitizeString(value, maxLength) {
    return String(value || '').slice(0, maxLength);
}

function sanitizeNumber(value) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : 0;
}

function sanitizeDeviceProfile(profile) {
    const source = profile && typeof profile === 'object' ? profile : {};
    return {
        userAgent: sanitizeString(source.userAgent, 512),
        language: sanitizeString(source.language, 64),
        platform: sanitizeString(source.platform, 64),
        vendor: sanitizeString(source.vendor, 64),
        screen: sanitizeString(source.screen, 32),
        availableScreen: sanitizeString(source.availableScreen, 32),
        timezone: sanitizeString(source.timezone, 64),
        colorDepth: sanitizeNumber(source.colorDepth),
        pixelRatio: sanitizeNumber(source.pixelRatio),
        hardwareConcurrency: sanitizeNumber(source.hardwareConcurrency),
        deviceMemory: sanitizeNumber(source.deviceMemory),
        maxTouchPoints: sanitizeNumber(source.maxTouchPoints)
    };
}

function normalizeAdminEmail(value) {
    return String(value || '').trim().toLowerCase().slice(0, 160);
}

function normalizeUserAccountId(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '')
        .slice(0, USER_ACCOUNT_ID_LIMIT);
}

function sanitizeAdminRole(value) {
    return String(value || '').trim().toLowerCase() === 'founder' ? 'founder' : 'admin';
}

function resolveLocalStorePath() {
    return path.resolve(process.cwd(), process.env.RINNO_LOCAL_STORE_PATH || DEFAULT_LOCAL_STORE_PATH);
}

function normalizeLicenseStatus(value) {
    const status = sanitizeString(value, 24).toLowerCase();
    if (status === 'active') return 'active';
    if (status === 'revoked') return 'revoked';
    return 'issued';
}

function isLicenseRecordKey(key) {
    const normalized = normalizeActivationCode(key);
    return normalized.startsWith(CODE_PREFIX) && normalized.length > CODE_PREFIX.length + DEVICE_PREFIX_LENGTH;
}

function shouldUseLocalStore() {
    const explicit = String(process.env.RINNO_USE_LOCAL_STORE || '').trim().toLowerCase();
    if (explicit === 'true') return true;
    if (explicit === 'false') return false;
    return process.env.NETLIFY_LOCAL === 'true'
        || process.env.NETLIFY_DEV === 'true';
}

function getManualBlobStoreOptions() {
    const siteID = String(
        process.env.RINNO_NETLIFY_BLOBS_SITE_ID
        || process.env.SITE_ID
        || ''
    ).trim();
    const token = String(
        process.env.RINNO_NETLIFY_BLOBS_TOKEN
        || process.env.NETLIFY_AUTH_TOKEN
        || ''
    ).trim();

    if (!siteID || !token) return null;

    return { siteID, token };
}

async function readLocalStoreSnapshot() {
    try {
        const raw = await fs.readFile(resolveLocalStorePath(), 'utf8');
        const parsed = JSON.parse(raw || '{}');
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
        if (error && error.code === 'ENOENT') return {};
        throw error;
    }
}

function queueLocalStoreWrite(task) {
    localStoreWriteChain = localStoreWriteChain
        .catch(() => undefined)
        .then(task);
    return localStoreWriteChain;
}

function createLocalStore() {
    return {
        async get(key, options = {}) {
            const normalizedKey = normalizeActivationCode(key);
            const snapshot = await readLocalStoreSnapshot();
            const value = snapshot[normalizedKey] || null;
            if (!value) return null;
            return options.type === 'json' ? value : JSON.stringify(value);
        },
        async setJSON(key, value, options = {}) {
            const normalizedKey = normalizeActivationCode(key);
            return queueLocalStoreWrite(async () => {
                const filePath = resolveLocalStorePath();
                await fs.mkdir(path.dirname(filePath), { recursive: true });
                const snapshot = await readLocalStoreSnapshot();
                if (options.onlyIfNew && Object.prototype.hasOwnProperty.call(snapshot, normalizedKey)) {
                    return { modified: false };
                }
                snapshot[normalizedKey] = value;
                await fs.writeFile(filePath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
                return { modified: true };
            });
        },
        async delete(key) {
            const normalizedKey = normalizeActivationCode(key);
            return queueLocalStoreWrite(async () => {
                const filePath = resolveLocalStorePath();
                const snapshot = await readLocalStoreSnapshot();
                if (!Object.prototype.hasOwnProperty.call(snapshot, normalizedKey)) return;
                delete snapshot[normalizedKey];
                await fs.mkdir(path.dirname(filePath), { recursive: true });
                await fs.writeFile(filePath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
            });
        },
        async list() {
            const snapshot = await readLocalStoreSnapshot();
            return {
                blobs: Object.keys(snapshot).map(key => ({ key })),
                directories: []
            };
        }
    };
}

async function writeAdminAccounts(accounts) {
    const store = getLicenseStore();
    const normalized = coerceAdminAccounts(accounts);
    await store.setJSON(ADMIN_ACCOUNTS_KEY, normalized);
    return normalized;
}

async function readAdminAccounts() {
    const store = getLicenseStore();
    const existing = await store.get(ADMIN_ACCOUNTS_KEY, { type: 'json' });
    const accounts = coerceAdminAccounts(existing);
    const founderEmail = getFounderBootstrapEmail();
    const founderExists = accounts.some(account => account.email === founderEmail && account.role === 'founder');

    if (founderExists) return accounts;

    const founderAccount = createAdminAccount({
        email: founderEmail,
        password: getFounderBootstrapPassword(),
        role: 'founder',
        displayName: 'Founder',
        createdBy: 'bootstrap'
    });
    const nextAccounts = [founderAccount, ...accounts].slice(0, ADMIN_ACCOUNT_LIMIT);
    await store.setJSON(ADMIN_ACCOUNTS_KEY, nextAccounts);
    return nextAccounts;
}

function findAdminAccountById(accounts, accountId) {
    return Array.isArray(accounts)
        ? accounts.find(account => account.id === sanitizeString(accountId, 64))
        : undefined;
}

function findAdminAccountByEmail(accounts, email) {
    const normalizedEmail = normalizeAdminEmail(email);
    return Array.isArray(accounts)
        ? accounts.find(account => account.email === normalizedEmail)
        : undefined;
}

function getLicenseStore() {
    if (shouldUseLocalStore()) return createLocalStore();
    const manualOptions = getManualBlobStoreOptions();
    return manualOptions
        ? getStore({ name: STORE_NAME, ...manualOptions })
        : getStore(STORE_NAME);
}

function getLicenseSecret() {
    const secret = String(process.env.RINNO_LICENSE_SECRET || '').trim();
    if (secret.length < 16) {
        throw new Error('RINNO_LICENSE_SECRET is missing or too short.');
    }
    return secret;
}

function getAdminKey() {
    const adminKey = String(process.env.RINNO_ADMIN_KEY || '').trim();
    if (adminKey.length < 8) {
        throw new Error('RINNO_ADMIN_KEY is missing or too short.');
    }
    return adminKey;
}

function getFounderBootstrapEmail() {
    return normalizeAdminEmail(process.env.RINNO_FOUNDER_EMAIL || '2305201466@qq.com');
}

function getFounderBootstrapPassword() {
    const founderPassword = String(
        process.env.RINNO_FOUNDER_PASSWORD
        || process.env.RINNO_ADMIN_KEY
        || ''
    ).trim();
    if (founderPassword.length < ADMIN_PASSWORD_MIN_LENGTH) {
        throw new Error('RINNO_FOUNDER_PASSWORD is missing or too short.');
    }
    return founderPassword;
}

function makeAdminId() {
    return `adm_${crypto.randomBytes(8).toString('hex')}`;
}

function hashAdminPassword(password, salt = crypto.randomBytes(16).toString('hex'), secret = getLicenseSecret()) {
    const normalizedSalt = sanitizeString(salt, 128) || crypto.randomBytes(16).toString('hex');
    const digest = crypto
        .scryptSync(String(password || ''), `${normalizedSalt}:${secret}`, 64)
        .toString('hex')
        .toUpperCase();
    return {
        passwordSalt: normalizedSalt,
        passwordHash: digest
    };
}

function verifyAdminPassword(account, password, secret = getLicenseSecret()) {
    if (!account || !account.passwordSalt || !account.passwordHash) return false;
    const expected = hashAdminPassword(password, account.passwordSalt, secret).passwordHash;
    return timingSafeEquals(expected, account.passwordHash);
}

function hashUserPassword(password, salt = crypto.randomBytes(16).toString('hex'), secret = getLicenseSecret()) {
    const normalizedSalt = sanitizeString(salt, 128) || crypto.randomBytes(16).toString('hex');
    const digest = crypto
        .scryptSync(String(password || ''), `${normalizedSalt}:${secret}`, 64)
        .toString('hex')
        .toUpperCase();
    return {
        accountPasswordSalt: normalizedSalt,
        accountPasswordHash: digest
    };
}

function verifyUserPassword(record, password, secret = getLicenseSecret()) {
    if (!record || !record.accountPasswordSalt || !record.accountPasswordHash) return false;
    const expected = hashUserPassword(password, record.accountPasswordSalt, secret).accountPasswordHash;
    return timingSafeEquals(expected, record.accountPasswordHash);
}

function sanitizeAdminAccount(account) {
    const source = account && typeof account === 'object' ? account : {};
    return {
        id: sanitizeString(source.id, 64),
        email: normalizeAdminEmail(source.email),
        role: sanitizeAdminRole(source.role),
        status: sanitizeString(source.status || 'active', 24) === 'disabled' ? 'disabled' : 'active',
        displayName: sanitizeString(source.displayName, 80),
        passwordSalt: sanitizeString(source.passwordSalt, 128),
        passwordHash: sanitizeString(source.passwordHash, 256).toUpperCase(),
        sessionVersion: Math.max(1, sanitizeNumber(source.sessionVersion) || 1),
        createdAt: sanitizeString(source.createdAt, 64),
        updatedAt: sanitizeString(source.updatedAt, 64),
        lastLoginAt: sanitizeString(source.lastLoginAt, 64),
        passwordChangedAt: sanitizeString(source.passwordChangedAt, 64),
        createdBy: sanitizeString(source.createdBy, 160)
    };
}

function serializeAdminAccountPublic(account) {
    const sanitized = sanitizeAdminAccount(account);
    return {
        id: sanitized.id,
        email: sanitized.email,
        role: sanitized.role,
        status: sanitized.status,
        displayName: sanitized.displayName || sanitized.email,
        sessionVersion: sanitized.sessionVersion,
        createdAt: sanitized.createdAt,
        updatedAt: sanitized.updatedAt,
        lastLoginAt: sanitized.lastLoginAt,
        passwordChangedAt: sanitized.passwordChangedAt,
        createdBy: sanitized.createdBy
    };
}

function createAdminAccount({
    email,
    password,
    role = 'admin',
    displayName = '',
    createdBy = '',
    createdAt = new Date().toISOString()
}) {
    const normalizedEmail = normalizeAdminEmail(email);
    if (!normalizedEmail) {
        throw new Error('Administrator email is required.');
    }

    const normalizedPassword = String(password || '');
    if (normalizedPassword.length < ADMIN_PASSWORD_MIN_LENGTH) {
        throw new Error(`Administrator password must be at least ${ADMIN_PASSWORD_MIN_LENGTH} characters.`);
    }

    const hashRecord = hashAdminPassword(normalizedPassword);
    return sanitizeAdminAccount({
        id: makeAdminId(),
        email: normalizedEmail,
        role: sanitizeAdminRole(role),
        status: 'active',
        displayName: sanitizeString(displayName, 80),
        ...hashRecord,
        sessionVersion: 1,
        createdAt,
        updatedAt: createdAt,
        lastLoginAt: '',
        passwordChangedAt: createdAt,
        createdBy: sanitizeString(createdBy, 160)
    });
}

function coerceAdminAccounts(records) {
    return Array.isArray(records)
        ? records
            .map(sanitizeAdminAccount)
            .filter(account => account.id && account.email && account.passwordHash)
            .slice(0, ADMIN_ACCOUNT_LIMIT)
        : [];
}

function timingSafeEquals(left, right) {
    const a = Buffer.from(String(left || ''));
    const b = Buffer.from(String(right || ''));
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
}

function randomChars(length, alphabet = RANDOM_CODE_ALPHABET) {
    const size = Math.max(1, Number(length) || 1);
    const chars = [];
    while (chars.length < size) {
        const bytes = crypto.randomBytes(size - chars.length);
        for (const byte of bytes) {
            chars.push(alphabet[byte % alphabet.length]);
            if (chars.length >= size) break;
        }
    }
    return chars.join('');
}

function makeCodeId() {
    return randomChars(CODE_ID_LENGTH);
}

function makeDeviceCodeValue() {
    return randomChars(DEVICE_CODE_LENGTH);
}

function computeSignature(initialDeviceCode, codeId, secret = getLicenseSecret()) {
    return crypto
        .createHmac('sha256', secret)
        .update(`${normalizeDeviceCode(initialDeviceCode)}:${String(codeId || '').toUpperCase()}`)
        .digest('hex')
        .toUpperCase()
        .slice(0, SIGNATURE_LENGTH);
}

function buildActivationCode(initialDeviceCode, codeId, secret = getLicenseSecret()) {
    const normalizedDeviceCode = normalizeDeviceCode(initialDeviceCode);
    const normalizedCodeId = String(codeId || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_ID_LENGTH);
    const devicePrefix = normalizedDeviceCode.slice(0, DEVICE_PREFIX_LENGTH).padEnd(DEVICE_PREFIX_LENGTH, '0');
    const signature = computeSignature(normalizedDeviceCode, normalizedCodeId, secret);
    return `${CODE_PREFIX}${devicePrefix}${normalizedCodeId}${signature}`;
}

function createIssuedRecord(initialDeviceCode, activationCode, codeId, adminNote, issuedAt) {
    return {
        activationCode,
        initialDeviceCode: normalizeDeviceCode(initialDeviceCode),
        currentDeviceCode: '',
        previousDeviceCode: '',
        codeId: String(codeId || '').toUpperCase().slice(0, CODE_ID_LENGTH),
        status: 'issued',
        createdAt: issuedAt,
        issuedAt,
        claimedAt: '',
        boundAt: '',
        lastSeenAt: '',
        lastVerifyAt: '',
        lastActivateAt: '',
        activationCount: 0,
        verifyCount: 0,
        takeoverCount: 0,
        adminNote: sanitizeString(adminNote, 120),
        deviceProfile: {},
        accountId: '',
        accountDisplayName: '',
        accountPasswordSalt: '',
        accountPasswordHash: '',
        accountRegisteredAt: '',
        accountLastLoginAt: '',
        accountSessionVersion: 1
    };
}

function makeDeviceClaimKey(deviceCode) {
    const normalizedDeviceCode = normalizeDeviceCode(deviceCode);
    return `${DEVICE_CLAIM_KEY_PREFIX}${normalizedDeviceCode}`;
}

function makeDeviceIndexKey(deviceCode) {
    const normalizedDeviceCode = normalizeDeviceCode(deviceCode);
    return `${DEVICE_INDEX_KEY_PREFIX}${normalizedDeviceCode}`;
}

function makeDeviceAllocationKey(deviceCode) {
    const normalizedDeviceCode = normalizeDeviceCode(deviceCode);
    return `${DEVICE_ALLOCATION_KEY_PREFIX}${normalizedDeviceCode}`;
}

function makeUserAccountIndexKey(accountId) {
    const normalizedAccountId = normalizeUserAccountId(accountId);
    if (!normalizedAccountId) return `${USER_ACCOUNT_KEY_PREFIX}EMPTY`;
    const digest = crypto
        .createHash('sha256')
        .update(normalizedAccountId)
        .digest('hex')
        .toUpperCase()
        .slice(0, 32);
    return `${USER_ACCOUNT_KEY_PREFIX}${digest}`;
}

function sanitizeDeviceClaimRecord(record) {
    const source = record && typeof record === 'object' ? record : {};
    return {
        deviceCode: normalizeDeviceCode(source.deviceCode),
        activationCode: normalizeActivationCode(source.activationCode),
        createdAt: sanitizeString(source.createdAt, 64),
        updatedAt: sanitizeString(source.updatedAt, 64)
    };
}

function sanitizeDeviceIndexRecord(record) {
    const source = record && typeof record === 'object' ? record : {};
    const activationCodes = Array.isArray(source.activationCodes)
        ? source.activationCodes
            .map(code => normalizeActivationCode(code))
            .filter(isLicenseRecordKey)
        : [];
    return {
        deviceCode: normalizeDeviceCode(source.deviceCode),
        activationCodes: Array.from(new Set(activationCodes)).slice(0, DEVICE_INDEX_LIMIT),
        updatedAt: sanitizeString(source.updatedAt, 64)
    };
}

function sanitizeUserAccountIndexRecord(record) {
    const source = record && typeof record === 'object' ? record : {};
    return {
        accountId: normalizeUserAccountId(source.accountId),
        activationCode: normalizeActivationCode(source.activationCode),
        updatedAt: sanitizeString(source.updatedAt, 64)
    };
}

function coerceLicenseRecord(activationCode, record, now) {
    const source = record && typeof record === 'object' ? record : {};
    const initialDeviceCode = normalizeDeviceCode(
        source.initialDeviceCode
        || source.allowedDeviceCode
        || source.deviceCode
    );
    const currentDeviceCode = normalizeDeviceCode(source.currentDeviceCode || source.deviceCode);
    const claimedAt = sanitizeString(source.claimedAt, 64)
        || sanitizeString(source.firstVerifiedAt, 64)
        || sanitizeString(source.boundAt, 64);
    const status = normalizeLicenseStatus(
        sanitizeString(source.status, 24) || (claimedAt || currentDeviceCode ? 'active' : 'issued')
    );
    const accountId = normalizeUserAccountId(
        source.accountId
        || source.userAccountId
        || source.account
        || source.username
        || source.email
    );

    return {
        activationCode: normalizeActivationCode(activationCode),
        initialDeviceCode,
        currentDeviceCode,
        previousDeviceCode: normalizeDeviceCode(source.previousDeviceCode),
        codeId: String(source.codeId || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_ID_LENGTH),
        status,
        createdAt: sanitizeString(source.createdAt, 64) || now,
        issuedAt: sanitizeString(source.issuedAt, 64) || sanitizeString(source.createdAt, 64) || now,
        claimedAt,
        boundAt: sanitizeString(source.boundAt, 64) || claimedAt,
        lastSeenAt: sanitizeString(source.lastSeenAt, 64),
        lastVerifyAt: sanitizeString(source.lastVerifyAt, 64),
        lastActivateAt: sanitizeString(source.lastActivateAt, 64),
        activationCount: Math.max(0, sanitizeNumber(source.activationCount || source.claimCount)),
        verifyCount: Math.max(0, sanitizeNumber(source.verifyCount)),
        takeoverCount: Math.max(0, sanitizeNumber(source.takeoverCount)),
        adminNote: sanitizeString(source.adminNote, 120),
        deviceProfile: sanitizeDeviceProfile(source.deviceProfile),
        accountId,
        accountDisplayName: sanitizeString(source.accountDisplayName || source.displayName, USER_DISPLAY_NAME_LIMIT),
        accountPasswordSalt: sanitizeString(source.accountPasswordSalt, 128),
        accountPasswordHash: sanitizeString(source.accountPasswordHash, 256).toUpperCase(),
        accountRegisteredAt: sanitizeString(source.accountRegisteredAt, 64),
        accountLastLoginAt: sanitizeString(source.accountLastLoginAt, 64),
        accountSessionVersion: Math.max(1, sanitizeNumber(source.accountSessionVersion) || 1)
    };
}

function collectReservedDeviceCodes(record) {
    const source = record && typeof record === 'object' ? record : {};
    return Array.from(new Set([
        normalizeDeviceCode(source.initialDeviceCode),
        normalizeDeviceCode(source.currentDeviceCode),
        normalizeDeviceCode(source.previousDeviceCode)
    ].filter(deviceCode => isSupportedDeviceCode(deviceCode))));
}

async function readDeviceClaim(deviceCode, store = getLicenseStore()) {
    const normalizedDeviceCode = normalizeDeviceCode(deviceCode);
    if (!isSupportedDeviceCode(normalizedDeviceCode)) return null;
    const raw = await store.get(makeDeviceClaimKey(normalizedDeviceCode), { type: 'json' });
    if (!raw) return null;
    const claim = sanitizeDeviceClaimRecord(raw);
    return claim.deviceCode === normalizedDeviceCode && claim.activationCode
        ? claim
        : null;
}

async function readDeviceActivationIndex(deviceCode, store = getLicenseStore()) {
    const normalizedDeviceCode = normalizeDeviceCode(deviceCode);
    if (!isSupportedDeviceCode(normalizedDeviceCode)) return null;
    const raw = await store.get(makeDeviceIndexKey(normalizedDeviceCode), { type: 'json' });
    if (!raw) return null;
    const index = sanitizeDeviceIndexRecord(raw);
    return index.deviceCode === normalizedDeviceCode ? index : null;
}

async function readUserAccountIndex(accountId, store = getLicenseStore()) {
    const normalizedAccountId = normalizeUserAccountId(accountId);
    if (!normalizedAccountId) return null;
    const raw = await store.get(makeUserAccountIndexKey(normalizedAccountId), { type: 'json' });
    if (!raw) return null;
    const index = sanitizeUserAccountIndexRecord(raw);
    return index.accountId === normalizedAccountId && index.activationCode
        ? index
        : null;
}

async function writeDeviceActivationIndex(deviceCode, activationCodes, store = getLicenseStore()) {
    const normalizedDeviceCode = normalizeDeviceCode(deviceCode);
    if (!isSupportedDeviceCode(normalizedDeviceCode)) return null;
    const index = sanitizeDeviceIndexRecord({
        deviceCode: normalizedDeviceCode,
        activationCodes,
        updatedAt: new Date().toISOString()
    });
    await store.setJSON(makeDeviceIndexKey(normalizedDeviceCode), index);
    return index;
}

async function writeUserAccountIndex(accountId, activationCode, store = getLicenseStore()) {
    const normalizedAccountId = normalizeUserAccountId(accountId);
    const normalizedActivationCode = normalizeActivationCode(activationCode);
    if (!normalizedAccountId || !normalizedActivationCode) return null;
    const index = sanitizeUserAccountIndexRecord({
        accountId: normalizedAccountId,
        activationCode: normalizedActivationCode,
        updatedAt: new Date().toISOString()
    });
    await store.setJSON(makeUserAccountIndexKey(normalizedAccountId), index);
    return index;
}

async function appendDeviceActivationIndex(deviceCode, activationCode, store = getLicenseStore()) {
    const normalizedDeviceCode = normalizeDeviceCode(deviceCode);
    const normalizedActivationCode = normalizeActivationCode(activationCode);
    if (!isSupportedDeviceCode(normalizedDeviceCode) || !normalizedActivationCode) return null;
    const existing = await readDeviceActivationIndex(normalizedDeviceCode, store);
    const activationCodes = [
        normalizedActivationCode,
        ...((existing && existing.activationCodes) || [])
    ];
    return writeDeviceActivationIndex(normalizedDeviceCode, activationCodes, store);
}

async function listIndexedDeviceActivationCodes(deviceCode, store = getLicenseStore()) {
    const index = await readDeviceActivationIndex(deviceCode, store);
    return index ? index.activationCodes.slice() : [];
}

async function listRecentAuditActivationCodesForDevice(deviceCode, store = getLicenseStore()) {
    const normalizedDeviceCode = normalizeDeviceCode(deviceCode);
    if (!isSupportedDeviceCode(normalizedDeviceCode)) return [];
    const existing = await store.get(AUDIT_LOG_KEY, { type: 'json' });
    const entries = Array.isArray(existing)
        ? existing.map(sanitizeAuditEntry).filter(entry => entry.initialDeviceCode === normalizedDeviceCode && entry.activationCode)
        : [];
    return Array.from(new Set(entries.map(entry => entry.activationCode))).slice(0, DEVICE_INDEX_LIMIT);
}

async function isDeviceClaimStale(claim, store = getLicenseStore()) {
    const normalizedClaim = sanitizeDeviceClaimRecord(claim);
    if (!isSupportedDeviceCode(normalizedClaim.deviceCode) || !normalizedClaim.activationCode) return true;

    const raw = await store.get(normalizedClaim.activationCode, { type: 'json' });
    if (!raw) return true;

    const record = coerceLicenseRecord(normalizedClaim.activationCode, raw, new Date().toISOString());
    if (record.status === 'revoked') return true;
    return !collectReservedDeviceCodes(record).includes(normalizedClaim.deviceCode);
}

async function claimDeviceCode(deviceCode, activationCode, store = getLicenseStore()) {
    const normalizedDeviceCode = normalizeDeviceCode(deviceCode);
    const normalizedActivationCode = normalizeActivationCode(activationCode);
    if (!isSupportedDeviceCode(normalizedDeviceCode) || !normalizedActivationCode) {
        return {
            ok: false,
            reason: 'invalid'
        };
    }

    const now = new Date().toISOString();
    const key = makeDeviceClaimKey(normalizedDeviceCode);
    const claim = sanitizeDeviceClaimRecord({
        deviceCode: normalizedDeviceCode,
        activationCode: normalizedActivationCode,
        createdAt: now,
        updatedAt: now
    });

    for (let attempt = 0; attempt < 2; attempt += 1) {
        const writeResult = await store.setJSON(key, claim, {
            onlyIfNew: true,
            metadata: {
                deviceCode: normalizedDeviceCode,
                activationCode: normalizedActivationCode
            }
        });

        if (!writeResult || writeResult.modified !== false) {
            return {
                ok: true,
                claimed: true,
                claim
            };
        }

        const existingClaim = await readDeviceClaim(normalizedDeviceCode, store);
        if (existingClaim && existingClaim.activationCode === normalizedActivationCode) {
            return {
                ok: true,
                claimed: false,
                claim: existingClaim
            };
        }

        if (existingClaim && await isDeviceClaimStale(existingClaim, store)) {
            await store.delete(key);
            continue;
        }

        return {
            ok: false,
            reason: 'conflict',
            claim: existingClaim
        };
    }

    return {
        ok: false,
        reason: 'conflict',
        claim: await readDeviceClaim(normalizedDeviceCode, store)
    };
}

async function releaseDeviceCodeClaim(deviceCode, activationCode, store = getLicenseStore()) {
    const normalizedDeviceCode = normalizeDeviceCode(deviceCode);
    const normalizedActivationCode = normalizeActivationCode(activationCode);
    if (!isSupportedDeviceCode(normalizedDeviceCode) || !normalizedActivationCode) {
        return {
            ok: false,
            reason: 'invalid'
        };
    }

    const key = makeDeviceClaimKey(normalizedDeviceCode);
    const existingClaim = await readDeviceClaim(normalizedDeviceCode, store);
    if (!existingClaim) {
        return {
            ok: true,
            released: false
        };
    }

    if (existingClaim.activationCode !== normalizedActivationCode) {
        if (await isDeviceClaimStale(existingClaim, store)) {
            await store.delete(key);
            return {
                ok: true,
                released: true
            };
        }

        return {
            ok: false,
            reason: 'owned-by-other',
            claim: existingClaim
        };
    }

    await store.delete(key);
    return {
        ok: true,
        released: true
    };
}

async function listLicenseKeys(store = getLicenseStore()) {
    if (typeof store.list !== 'function') return [];
    const result = await store.list();
    const blobs = Array.isArray(result && result.blobs) ? result.blobs : [];
    return blobs
        .map(entry => normalizeActivationCode(entry && entry.key))
        .filter(isLicenseRecordKey);
}

async function findLicenseRecords(options = {}) {
    const now = new Date().toISOString();
    const store = options.store || getLicenseStore();
    const activationCode = normalizeActivationCode(options.activationCode);
    const deviceCode = normalizeDeviceCode(options.deviceCode);
    const includeRevoked = Boolean(options.includeRevoked);
    const limit = Math.max(1, Math.min(5000, Number(options.limit) || 50));

    let keys = [];
    if (activationCode) {
        keys = [activationCode];
    } else if (deviceCode) {
        keys = await listIndexedDeviceActivationCodes(deviceCode, store);
        if (!keys.length) {
            keys = await listRecentAuditActivationCodesForDevice(deviceCode, store);
        }
        if (!keys.length) {
            keys = await listLicenseKeys(store);
        }
    } else {
        keys = await listLicenseKeys(store);
    }

    const records = [];
    const matchedDeviceActivationCodes = [];
    for (const key of keys) {
        const raw = await store.get(key, { type: 'json' });
        if (!raw) continue;
        const record = coerceLicenseRecord(key, raw, now);
        if (activationCode && record.activationCode !== activationCode) continue;
        if (deviceCode) {
            const matchesDevice = record.initialDeviceCode === deviceCode
                || record.currentDeviceCode === deviceCode
                || record.previousDeviceCode === deviceCode;
            if (!matchesDevice) continue;
            matchedDeviceActivationCodes.push(record.activationCode);
        }
        if (!includeRevoked && record.status === 'revoked') continue;
        records.push(record);
    }

    if (deviceCode && !activationCode && matchedDeviceActivationCodes.length > 0) {
        await writeDeviceActivationIndex(deviceCode, matchedDeviceActivationCodes, store).catch(() => undefined);
    }

    return records
        .sort((left, right) => {
            const a = new Date(right.issuedAt || right.createdAt || 0).getTime();
            const b = new Date(left.issuedAt || left.createdAt || 0).getTime();
            return a - b;
        })
        .slice(0, limit);
}

async function findLicenseRecordByAccountId(accountId, store = getLicenseStore()) {
    const normalizedAccountId = normalizeUserAccountId(accountId);
    if (!normalizedAccountId) return null;

    const now = new Date().toISOString();
    const indexed = await readUserAccountIndex(normalizedAccountId, store);
    if (indexed) {
        const rawIndexedRecord = await store.get(indexed.activationCode, { type: 'json' });
        if (rawIndexedRecord) {
            const indexedRecord = coerceLicenseRecord(indexed.activationCode, rawIndexedRecord, now);
            if (indexedRecord.accountId === normalizedAccountId) return indexedRecord;
        }
    }

    const keys = await listLicenseKeys(store);
    for (const key of keys) {
        const raw = await store.get(key, { type: 'json' });
        if (!raw) continue;
        const record = coerceLicenseRecord(key, raw, now);
        if (record.accountId !== normalizedAccountId) continue;
        await writeUserAccountIndex(normalizedAccountId, record.activationCode, store).catch(() => undefined);
        return record;
    }

    return null;
}

async function findDeviceOwnershipConflicts(deviceCode, activationCode, store = getLicenseStore()) {
    const normalizedDeviceCode = normalizeDeviceCode(deviceCode);
    const normalizedActivationCode = normalizeActivationCode(activationCode);
    if (!isSupportedDeviceCode(normalizedDeviceCode)) return [];

    const records = await findLicenseRecords({
        store,
        deviceCode: normalizedDeviceCode,
        includeRevoked: false,
        limit: 200
    });

    return records.filter(record => record.activationCode !== normalizedActivationCode);
}

async function findRecordDeviceConflicts(record, store = getLicenseStore()) {
    const normalizedActivationCode = normalizeActivationCode(record && record.activationCode);
    const seen = new Set();
    const conflicts = [];

    for (const deviceCode of collectReservedDeviceCodes(record)) {
        const matches = await findDeviceOwnershipConflicts(deviceCode, normalizedActivationCode, store);
        for (const match of matches) {
            if (seen.has(match.activationCode)) continue;
            seen.add(match.activationCode);
            conflicts.push(match);
        }
    }

    return conflicts;
}

async function reserveRecordDeviceClaims(previousRecord, nextRecord, store = getLicenseStore()) {
    const previousCodes = new Set(collectReservedDeviceCodes(previousRecord));
    const claimedCodes = [];

    for (const deviceCode of collectReservedDeviceCodes(nextRecord)) {
        if (previousCodes.has(deviceCode)) continue;

        const conflicts = await findDeviceOwnershipConflicts(deviceCode, nextRecord.activationCode, store);
        if (conflicts.length > 0) {
            await Promise.allSettled(
                claimedCodes.map(code => releaseDeviceCodeClaim(code, nextRecord.activationCode, store))
            );
            return {
                ok: false,
                reason: 'duplicate-device',
                deviceCode,
                conflicts
            };
        }

        const claimResult = await claimDeviceCode(deviceCode, nextRecord.activationCode, store);
        if (!claimResult.ok) {
            await Promise.allSettled(
                claimedCodes.map(code => releaseDeviceCodeClaim(code, nextRecord.activationCode, store))
            );
            return {
                ok: false,
                reason: 'duplicate-device',
                deviceCode,
                conflicts: await findDeviceOwnershipConflicts(deviceCode, nextRecord.activationCode, store)
            };
        }

        if (claimResult.claimed) claimedCodes.push(deviceCode);
    }

    return {
        ok: true,
        claimedCodes
    };
}

async function releaseRemovedRecordDeviceClaims(previousRecord, nextRecord, store = getLicenseStore()) {
    const nextCodes = new Set(collectReservedDeviceCodes(nextRecord));
    const activationCode = normalizeActivationCode(
        (previousRecord && previousRecord.activationCode)
        || (nextRecord && nextRecord.activationCode)
    );

    await Promise.allSettled(
        collectReservedDeviceCodes(previousRecord)
            .filter(deviceCode => !nextCodes.has(deviceCode))
            .map(deviceCode => releaseDeviceCodeClaim(deviceCode, activationCode, store))
    );
}

async function releaseRecordDeviceClaims(record, store = getLicenseStore()) {
    const activationCode = normalizeActivationCode(record && record.activationCode);
    if (!activationCode) return;

    await Promise.allSettled(
        collectReservedDeviceCodes(record).map(deviceCode => releaseDeviceCodeClaim(deviceCode, activationCode, store))
    );
}

async function findHistoricalDuplicateRecords(options = {}) {
    const store = options.store || getLicenseStore();
    const includeRevoked = options.includeRevoked !== false;
    const maxGroups = Math.max(1, Math.min(200, Number(options.maxGroups) || 50));
    const maxEntries = Math.max(1, Math.min(5000, Number(options.maxEntries) || 500));
    const records = await findLicenseRecords({
        store,
        includeRevoked,
        limit: maxEntries
    });

    const groups = new Map();
    for (const record of records) {
        const deviceCode = normalizeDeviceCode(record.initialDeviceCode);
        if (!isSupportedDeviceCode(deviceCode)) continue;
        const list = groups.get(deviceCode) || [];
        list.push(record);
        groups.set(deviceCode, list);
    }

    const duplicateGroups = Array.from(groups.entries())
        .map(([deviceCode, entries]) => {
            const sortedEntries = entries.slice().sort((left, right) => {
                const leftTime = new Date(left.issuedAt || left.createdAt || 0).getTime();
                const rightTime = new Date(right.issuedAt || right.createdAt || 0).getTime();
                return rightTime - leftTime;
            });

            return {
                deviceCode,
                duplicateCount: sortedEntries.length,
                activeCount: sortedEntries.filter(entry => entry.status !== 'revoked').length,
                entries: sortedEntries
            };
        })
        .filter(group => group.duplicateCount > 1)
        .sort((left, right) => {
            if (right.duplicateCount !== left.duplicateCount) return right.duplicateCount - left.duplicateCount;
            const rightTime = new Date(right.entries[0] && (right.entries[0].issuedAt || right.entries[0].createdAt) || 0).getTime();
            const leftTime = new Date(left.entries[0] && (left.entries[0].issuedAt || left.entries[0].createdAt) || 0).getTime();
            return rightTime - leftTime;
        })
        .slice(0, maxGroups);

    const entries = duplicateGroups.flatMap(group => group.entries.map(entry => ({
        ...entry,
        duplicateCount: group.duplicateCount,
        duplicateGroupDeviceCode: group.deviceCode,
        duplicateActiveCount: group.activeCount
    })));

    return {
        groups: duplicateGroups,
        entries,
        totalGroups: duplicateGroups.length,
        totalEntries: entries.length
    };
}

async function issueUniqueActivationRecord(initialDeviceCode, adminNote = '', issuedAt = new Date().toISOString()) {
    const store = getLicenseStore();
    const normalizedDeviceCode = normalizeDeviceCode(initialDeviceCode);
    if (!isSupportedDeviceCode(normalizedDeviceCode)) {
        return {
            ok: false,
            reason: 'invalid-device-code'
        };
    }
    const duplicateRecords = await findLicenseRecords({
        store,
        deviceCode: normalizedDeviceCode,
        includeRevoked: false,
        limit: 20
    });

    if (duplicateRecords.length > 0) {
        return {
            ok: false,
            reason: 'duplicate-device',
            record: duplicateRecords[0],
            duplicates: duplicateRecords
        };
    }

    for (let attempt = 0; attempt < 30; attempt += 1) {
        const codeId = makeCodeId();
        const activationCode = buildActivationCode(normalizedDeviceCode, codeId);
        const record = createIssuedRecord(normalizedDeviceCode, activationCode, codeId, adminNote, issuedAt);
        const claimResult = await claimDeviceCode(normalizedDeviceCode, activationCode, store);

        if (!claimResult.ok) {
            const conflicts = await findDeviceOwnershipConflicts(normalizedDeviceCode, activationCode, store);
            if (conflicts.length > 0) {
                return {
                    ok: false,
                    reason: 'duplicate-device',
                    record: conflicts[0],
                    duplicates: conflicts
                };
            }
            continue;
        }

        try {
            const writeResult = await store.setJSON(activationCode, record, {
                onlyIfNew: true,
                metadata: {
                    initialDeviceCode: record.initialDeviceCode,
                    status: record.status,
                    issuedAt: record.issuedAt
                }
            });

            if (writeResult && writeResult.modified === false) {
                await releaseDeviceCodeClaim(normalizedDeviceCode, activationCode, store).catch(() => undefined);
                continue;
            }

            await appendDeviceActivationIndex(normalizedDeviceCode, activationCode, store).catch(() => undefined);

            return {
                ok: true,
                record
            };
        } catch (error) {
            await releaseDeviceCodeClaim(normalizedDeviceCode, activationCode, store).catch(() => undefined);
            throw error;
        }
    }

    throw new Error('Unable to generate a unique activation code.');
}

async function allocateUniqueDeviceCode(options = {}) {
    const store = options.store || getLicenseStore();
    const source = sanitizeString(options.source || 'browser', 32) || 'browser';

    for (let attempt = 0; attempt < 64; attempt += 1) {
        const deviceCode = makeDeviceCodeValue();
        const now = new Date().toISOString();
        const writeResult = await store.setJSON(makeDeviceAllocationKey(deviceCode), {
            deviceCode,
            source,
            createdAt: now,
            updatedAt: now
        }, {
            onlyIfNew: true,
            metadata: {
                deviceCode,
                source
            }
        });

        if (writeResult && writeResult.modified === false) continue;

        const existingClaim = await readDeviceClaim(deviceCode, store).catch(() => null);
        if (existingClaim) continue;

        return {
            ok: true,
            deviceCode
        };
    }

    throw new Error('Unable to allocate a unique device code.');
}

function hasStrictSignature(record) {
    return Boolean(record && record.initialDeviceCode && record.codeId);
}

function isActivationCodeValidForRecord(activationCode, record, secret = getLicenseSecret()) {
    if (!hasStrictSignature(record)) return false;
    return buildActivationCode(record.initialDeviceCode, record.codeId, secret) === normalizeActivationCode(activationCode);
}

function getHeader(headers, name) {
    if (!headers || typeof headers !== 'object') return '';
    const expected = String(name || '').toLowerCase();
    const matchedKey = Object.keys(headers).find(key => key.toLowerCase() === expected);
    return matchedKey ? String(headers[matchedKey] || '') : '';
}

function isHttpsRequest(headers) {
    const forwardedProto = getHeader(headers, 'x-forwarded-proto');
    if (forwardedProto) return forwardedProto.toLowerCase() === 'https';
    const siteUrl = String(process.env.URL || '').trim();
    return siteUrl.startsWith('https://');
}

function parseCookieHeader(value) {
    return String(value || '')
        .split(/;\s*/)
        .reduce((cookies, pair) => {
            if (!pair) return cookies;
            const separator = pair.indexOf('=');
            if (separator <= 0) return cookies;
            const key = pair.slice(0, separator).trim();
            const cookieValue = pair.slice(separator + 1).trim();
            if (key) cookies[key] = decodeURIComponent(cookieValue);
            return cookies;
        }, {});
}

function base64urlEncode(input) {
    return Buffer.from(String(input), 'utf8')
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');
}

function base64urlDecode(input) {
    const normalized = String(input || '').replace(/-/g, '+').replace(/_/g, '/');
    const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
    return Buffer.from(normalized + padding, 'base64').toString('utf8');
}

function signCompactValue(value, secret = getLicenseSecret()) {
    return crypto
        .createHmac('sha256', secret)
        .update(String(value || ''))
        .digest('hex')
        .toUpperCase();
}

function hashUserAgent(userAgent, secret = getLicenseSecret()) {
    return signCompactValue(String(userAgent || ''), secret).slice(0, 24);
}

function createSessionToken({ activationCode, deviceCode, userAgent, expiresAt }, secret = getLicenseSecret()) {
    const expiry = Math.max(Date.now() + 1000, Number(expiresAt) || (Date.now() + SESSION_TTL_MS));
    const payload = {
        v: 1,
        a: normalizeActivationCode(activationCode),
        d: normalizeDeviceCode(deviceCode),
        u: hashUserAgent(userAgent, secret),
        e: expiry
    };
    const encoded = base64urlEncode(JSON.stringify(payload));
    const signature = signCompactValue(encoded, secret);
    return `${encoded}.${signature}`;
}

function readSessionToken(token, userAgent, secret = getLicenseSecret()) {
    const raw = String(token || '').trim();
    const separator = raw.indexOf('.');
    if (!raw || separator <= 0) return null;

    const encoded = raw.slice(0, separator);
    const signature = raw.slice(separator + 1);
    const expectedSignature = signCompactValue(encoded, secret);
    if (!timingSafeEquals(signature, expectedSignature)) return null;

    let payload = null;
    try {
        payload = JSON.parse(base64urlDecode(encoded));
    } catch (error) {
        return null;
    }

    if (!payload || payload.v !== 1) return null;
    if (Number(payload.e) <= Date.now()) return null;
    if (hashUserAgent(userAgent, secret) !== String(payload.u || '')) return null;

    const activationCode = normalizeActivationCode(payload.a);
    const deviceCode = normalizeDeviceCode(payload.d);
    if (!activationCode || !isSupportedDeviceCode(deviceCode)) return null;

    return {
        activationCode,
        deviceCode,
        expiresAt: Number(payload.e)
    };
}

function buildSessionCookie(token, options = {}) {
    const secure = Boolean(options.secure);
    const maxAgeSeconds = Math.max(0, Math.floor(options.maxAgeSeconds || (SESSION_TTL_MS / 1000)));
    const parts = [
        `${SESSION_COOKIE_NAME}=${encodeURIComponent(String(token || ''))}`,
        'Path=/',
        'HttpOnly',
        'SameSite=Strict',
        `Max-Age=${maxAgeSeconds}`
    ];
    if (secure) parts.push('Secure');
    return parts.join('; ');
}

function clearSessionCookie(options = {}) {
    const secure = Boolean(options.secure);
    const parts = [
        `${SESSION_COOKIE_NAME}=`,
        'Path=/',
        'HttpOnly',
        'SameSite=Strict',
        'Max-Age=0',
        'Expires=Thu, 01 Jan 1970 00:00:00 GMT'
    ];
    if (secure) parts.push('Secure');
    return parts.join('; ');
}

function createAdminSessionToken({ accountId, email, role, sessionVersion, userAgent, expiresAt }, secret = getLicenseSecret()) {
    const expiry = Math.max(Date.now() + 1000, Number(expiresAt) || (Date.now() + ADMIN_SESSION_TTL_MS));
    const payload = {
        v: 1,
        i: sanitizeString(accountId, 64),
        m: normalizeAdminEmail(email),
        r: sanitizeAdminRole(role),
        s: Math.max(1, Number(sessionVersion) || 1),
        u: hashUserAgent(userAgent, secret),
        e: expiry
    };
    const encoded = base64urlEncode(JSON.stringify(payload));
    const signature = signCompactValue(encoded, secret);
    return `${encoded}.${signature}`;
}

function readAdminSessionToken(token, userAgent, secret = getLicenseSecret()) {
    const raw = String(token || '').trim();
    const separator = raw.indexOf('.');
    if (!raw || separator <= 0) return null;

    const encoded = raw.slice(0, separator);
    const signature = raw.slice(separator + 1);
    const expectedSignature = signCompactValue(encoded, secret);
    if (!timingSafeEquals(signature, expectedSignature)) return null;

    let payload = null;
    try {
        payload = JSON.parse(base64urlDecode(encoded));
    } catch (error) {
        return null;
    }

    if (!payload || payload.v !== 1) return null;
    if (Number(payload.e) <= Date.now()) return null;
    if (hashUserAgent(userAgent, secret) !== String(payload.u || '')) return null;
    const accountId = sanitizeString(payload.i, 64);
    const email = normalizeAdminEmail(payload.m);
    if (!accountId || !email) return null;

    return {
        accountId,
        email,
        role: sanitizeAdminRole(payload.r),
        sessionVersion: Math.max(1, Number(payload.s) || 1),
        expiresAt: Number(payload.e)
    };
}

function buildAdminSessionCookie(token, options = {}) {
    const secure = Boolean(options.secure);
    const maxAgeSeconds = Math.max(0, Math.floor(options.maxAgeSeconds || (ADMIN_SESSION_TTL_MS / 1000)));
    const parts = [
        `${ADMIN_SESSION_COOKIE_NAME}=${encodeURIComponent(String(token || ''))}`,
        'Path=/',
        'HttpOnly',
        'SameSite=Strict',
        `Max-Age=${maxAgeSeconds}`
    ];
    if (secure) parts.push('Secure');
    return parts.join('; ');
}

function clearAdminSessionCookie(options = {}) {
    const secure = Boolean(options.secure);
    const parts = [
        `${ADMIN_SESSION_COOKIE_NAME}=`,
        'Path=/',
        'HttpOnly',
        'SameSite=Strict',
        'Max-Age=0',
        'Expires=Thu, 01 Jan 1970 00:00:00 GMT'
    ];
    if (secure) parts.push('Secure');
    return parts.join('; ');
}

async function readAuthenticatedAdminFromRequest(event) {
    const headers = event && event.headers ? event.headers : {};
    const userAgent = getHeader(headers, 'user-agent');
    const cookies = parseCookieHeader(getHeader(headers, 'cookie'));
    const session = readAdminSessionToken(cookies[ADMIN_SESSION_COOKIE_NAME], userAgent);
    if (!session) {
        return {
            ok: false,
            reason: 'missing'
        };
    }

    const accounts = await readAdminAccounts();
    const account = findAdminAccountById(accounts, session.accountId);
    if (!account || account.status !== 'active') {
        return {
            ok: false,
            reason: 'missing-account'
        };
    }

    if (account.email !== session.email || account.sessionVersion !== session.sessionVersion) {
        return {
            ok: false,
            reason: 'stale'
        };
    }

    return {
        ok: true,
        userAgent,
        session,
        account,
        accounts
    };
}

function getClientIp(headers) {
    const direct = getHeader(headers, 'x-nf-client-connection-ip')
        || getHeader(headers, 'client-ip');
    if (direct) return String(direct).trim().slice(0, 120);

    const forwardedFor = String(getHeader(headers, 'x-forwarded-for') || '').split(',')[0].trim();
    return forwardedFor.slice(0, 120);
}

function sanitizeAuditEntry(entry) {
    const source = entry && typeof entry === 'object' ? entry : {};
    return {
        id: sanitizeString(source.id, 48),
        type: sanitizeString(source.type, 32),
        at: sanitizeString(source.at, 64),
        outcome: sanitizeString(source.outcome, 24),
        authMode: sanitizeString(source.authMode, 24),
        actorId: sanitizeString(source.actorId, 64),
        actorEmail: normalizeAdminEmail(source.actorEmail),
        actorRole: sanitizeAdminRole(source.actorRole),
        targetEmail: normalizeAdminEmail(source.targetEmail),
        initialDeviceCode: normalizeDeviceCode(source.initialDeviceCode),
        activationCode: normalizeActivationCode(source.activationCode),
        note: sanitizeString(source.note, 120),
        origin: sanitizeString(source.origin, 240),
        referer: sanitizeString(source.referer, 320),
        ip: sanitizeString(source.ip, 120),
        userAgent: sanitizeString(source.userAgent, 320),
        message: sanitizeString(source.message, 240)
    };
}

async function readIssuerAuditLog(limit = AUDIT_LOG_LIMIT) {
    const store = getLicenseStore();
    const existing = await store.get(AUDIT_LOG_KEY, { type: 'json' });
    const normalized = Array.isArray(existing)
        ? existing.map(sanitizeAuditEntry).filter(entry => entry.id && entry.at)
        : [];
    return normalized.slice(0, Math.max(1, limit));
}

async function appendIssuerAuditLog(entry) {
    const sanitized = sanitizeAuditEntry({
        ...entry,
        id: sanitizeString(entry && entry.id ? entry.id : crypto.randomUUID(), 48),
        at: sanitizeString(entry && entry.at ? entry.at : new Date().toISOString(), 64)
    });

    const store = getLicenseStore();
    const existing = await store.get(AUDIT_LOG_KEY, { type: 'json' });
    const list = Array.isArray(existing)
        ? existing.map(sanitizeAuditEntry).filter(item => item.id && item.at)
        : [];
    list.unshift(sanitized);
    await store.setJSON(AUDIT_LOG_KEY, list.slice(0, AUDIT_LOG_LIMIT));

    return sanitized;
}

function escapeCsvCell(value) {
    const text = String(value ?? '');
    if (!/[",\r\n]/.test(text)) return text;
    return `"${text.replace(/"/g, '""')}"`;
}

function formatIssuerAuditEntriesAsCsv(entries) {
    const rows = [
        [
            'id',
            'at',
            'type',
            'outcome',
            'authMode',
            'actorEmail',
            'actorRole',
            'targetEmail',
            'initialDeviceCode',
            'activationCode',
            'note',
            'ip',
            'origin',
            'referer',
            'message'
        ]
    ];

    const list = Array.isArray(entries) ? entries.map(sanitizeAuditEntry) : [];
    list.forEach(entry => {
        rows.push([
            entry.id,
            entry.at,
            entry.type,
            entry.outcome,
            entry.authMode,
            entry.actorEmail,
            entry.actorRole,
            entry.targetEmail,
            entry.initialDeviceCode,
            entry.activationCode,
            entry.note,
            entry.ip,
            entry.origin,
            entry.referer,
            entry.message
        ]);
    });

    return `${rows.map(columns => columns.map(escapeCsvCell).join(',')).join('\n')}\n`;
}

module.exports = {
    ADMIN_ACCOUNTS_KEY,
    ADMIN_ACCOUNT_LIMIT,
    ADMIN_SESSION_COOKIE_NAME,
    ADMIN_SESSION_TTL_MS,
    ADMIN_PASSWORD_MIN_LENGTH,
    AUDIT_LOG_KEY,
    DEVICE_CODE_LENGTH,
    JSON_HEADERS,
    SESSION_COOKIE_NAME,
    SESSION_TTL_MS,
    USER_PASSWORD_MAX_LENGTH,
    USER_PASSWORD_MIN_LENGTH,
    allocateUniqueDeviceCode,
    appendIssuerAuditLog,
    buildAdminSessionCookie,
    buildActivationCode,
    buildSessionCookie,
    clearAdminSessionCookie,
    clearSessionCookie,
    coerceLicenseRecord,
    coerceAdminAccounts,
    createAdminAccount,
    createIssuedRecord,
    createAdminSessionToken,
    createSessionToken,
    findLicenseRecords,
    findLicenseRecordByAccountId,
    findAdminAccountByEmail,
    findAdminAccountById,
    findHistoricalDuplicateRecords,
    findRecordDeviceConflicts,
    formatIssuerAuditEntriesAsCsv,
    issueUniqueActivationRecord,
    getClientIp,
    getAdminKey,
    getFounderBootstrapEmail,
    getHeader,
    getLicenseSecret,
    getLicenseStore,
    formatDeviceCode,
    hashAdminPassword,
    hasStrictSignature,
    isActivationCodeValidForRecord,
    isCurrentDeviceCode,
    isHttpsRequest,
    isSupportedDeviceCode,
    json,
    makeCodeId,
    makeAdminId,
    normalizeAdminEmail,
    normalizeActivationCode,
    normalizeDeviceCode,
    normalizeUserAccountId,
    normalizeLicenseStatus,
    parseCookieHeader,
    releaseRecordDeviceClaims,
    releaseRemovedRecordDeviceClaims,
    reserveRecordDeviceClaims,
    readAdminAccounts,
    readAuthenticatedAdminFromRequest,
    readAdminSessionToken,
    readIssuerAuditLog,
    readSessionToken,
    serializeAdminAccountPublic,
    sanitizeDeviceProfile,
    sanitizeString,
    timingSafeEquals,
    verifyAdminPassword,
    verifyUserPassword,
    writeAdminAccounts,
    writeUserAccountIndex,
    hashUserPassword
};
