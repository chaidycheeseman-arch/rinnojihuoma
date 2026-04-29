const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const { getStore } = require('@netlify/blobs');

const STORE_NAME = process.env.RINNO_ACTIVATION_STORE || 'rinno-activation-codes';
const DEFAULT_LOCAL_STORE_PATH = '.data/licenses.json';
const CODE_PREFIX = 'RN';
const DEVICE_PREFIX_LENGTH = 4;
const CODE_ID_LENGTH = 10;
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
    return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
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

function sanitizeAdminRole(value) {
    return String(value || '').trim().toLowerCase() === 'founder' ? 'founder' : 'admin';
}

function resolveLocalStorePath() {
    return path.resolve(process.cwd(), process.env.RINNO_LOCAL_STORE_PATH || DEFAULT_LOCAL_STORE_PATH);
}

function shouldUseLocalStore() {
    return Boolean(process.env.RINNO_LOCAL_STORE_PATH)
        || process.env.NETLIFY_LOCAL === 'true'
        || process.env.NETLIFY_DEV === 'true';
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
        async setJSON(key, value) {
            const normalizedKey = normalizeActivationCode(key);
            await queueLocalStoreWrite(async () => {
                const filePath = resolveLocalStorePath();
                await fs.mkdir(path.dirname(filePath), { recursive: true });
                const snapshot = await readLocalStoreSnapshot();
                snapshot[normalizedKey] = value;
                await fs.writeFile(filePath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
            });
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
    return getStore(STORE_NAME);
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

function makeCodeId() {
    return crypto.randomBytes(5).toString('hex').toUpperCase();
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
        deviceProfile: {}
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
    const status = sanitizeString(source.status, 24) || (claimedAt || currentDeviceCode ? 'active' : 'issued');

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
        deviceProfile: sanitizeDeviceProfile(source.deviceProfile)
    };
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
    if (!activationCode || deviceCode.length !== 12) return null;

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
    JSON_HEADERS,
    SESSION_COOKIE_NAME,
    SESSION_TTL_MS,
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
    findAdminAccountByEmail,
    findAdminAccountById,
    formatIssuerAuditEntriesAsCsv,
    getClientIp,
    getAdminKey,
    getFounderBootstrapEmail,
    getHeader,
    getLicenseSecret,
    getLicenseStore,
    hashAdminPassword,
    hasStrictSignature,
    isActivationCodeValidForRecord,
    isHttpsRequest,
    json,
    makeCodeId,
    makeAdminId,
    normalizeAdminEmail,
    normalizeActivationCode,
    normalizeDeviceCode,
    parseCookieHeader,
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
    writeAdminAccounts
};
