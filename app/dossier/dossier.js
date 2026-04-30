const DOSSIER_STORAGE_KEY = 'rinno_dossier_state_v3';

let dossierActiveTab = 'char';
let dossierState = null;
let dossierToastTimer = null;
let dossierEventsBound = false;
let dossierGenerating = false;
let dossierNetworkEditingNodeId = '';
let dossierNetworkDraftKind = 'char';
let dossierNetworkPinchState = null;
let dossierNetworkDragState = null;
let dossierNetworkSuppressClick = false;
let dossierStateReady = null;

const DOSSIER_NUMERIC_ID_LENGTH = 10;
const DOSSIER_NUMERIC_ID_MIN_LENGTH = 8;
const DOSSIER_NETWORK_SCALE_MIN = 0.65;
const DOSSIER_NETWORK_SCALE_MAX = 1.45;
const DOSSIER_NETWORK_DEFAULT_WIDTH = 1000;
const DOSSIER_NETWORK_DEFAULT_HEIGHT = 680;
const DOSSIER_GENERATED_PROFILE_TYPE = 'dossier_identity';

function createDefaultDossierState() {
    return {
        char: [],
        npc: [],
        activeCharId: '',
        activeNpcId: '',
        network: createDefaultDossierNetwork()
    };
}

function getDossierDigits(value) {
    return String(value || '').replace(/\D/g, '');
}

function fitDossierNumericId(value) {
    const digits = getDossierDigits(value);
    if (digits.length < DOSSIER_NUMERIC_ID_MIN_LENGTH) return '';
    return digits.slice(-DOSSIER_NUMERIC_ID_LENGTH).padStart(DOSSIER_NUMERIC_ID_LENGTH, '0');
}

function hashDossierToNumericId(seed, salt = 0) {
    const text = `${seed || 'dossier'}:${salt}`;
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
        hash ^= text.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return String(hash >>> 0).padStart(DOSSIER_NUMERIC_ID_LENGTH, '0').slice(-DOSSIER_NUMERIC_ID_LENGTH);
}

function createUniqueDossierNumericId(used = new Set(), seed = '') {
    const direct = fitDossierNumericId(seed);
    if (direct && !used.has(direct)) {
        used.add(direct);
        return direct;
    }

    for (let salt = 0; salt < 1000; salt += 1) {
        const candidate = hashDossierToNumericId(seed || `${Date.now()}:${Math.random()}`, salt);
        if (!used.has(candidate)) {
            used.add(candidate);
            return candidate;
        }
    }

    let candidate = '';
    do {
        candidate = fitDossierNumericId(`${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`);
    } while (used.has(candidate));
    used.add(candidate);
    return candidate;
}

function coerceUniqueDossierNumericId(value, used = new Set(), seed = '') {
    const direct = fitDossierNumericId(value);
    if (direct && !used.has(direct)) {
        used.add(direct);
        return direct;
    }
    return createUniqueDossierNumericId(used, seed || value);
}

function getDossierUsedRecordIds(state, excludeId = '') {
    const used = new Set();
    ['char', 'npc'].forEach(type => {
        (state?.[type] || []).forEach(item => {
            const id = String(item?.id || '');
            if (id && id !== excludeId) used.add(id);
        });
    });
    return used;
}

function getDossierUsedPublicIds(state, excludeRecordId = '') {
    const used = new Set();
    ['char', 'npc'].forEach(type => {
        (state?.[type] || []).forEach(item => {
            if (String(item?.id || '') === excludeRecordId) return;
            const id = fitDossierNumericId(item?.publicId);
            if (id) used.add(id);
        });
    });
    return used;
}

function createDossierId(type, state = null) {
    const used = getDossierUsedRecordIds(state || dossierState);
    return createUniqueDossierNumericId(used, `${type}:${Date.now()}:${Math.random()}`);
}

function ensureDossierPublicId(value, state, recordId, seed = '') {
    const used = getDossierUsedPublicIds(state, recordId);
    return coerceUniqueDossierNumericId(value || recordId, used, seed || `${recordId}:public`);
}

function escapeDossierHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function parseDossierTags(value) {
    if (Array.isArray(value)) {
        return value.map(item => String(item || '').trim()).filter(Boolean).slice(0, 8);
    }
    return String(value || '')
        .split(/[,\uFF0C\u3001/]/)
        .map(item => item.trim())
        .filter(Boolean)
        .slice(0, 8);
}

function normalizeDossierAvatar(value) {
    const avatar = String(value || '').trim();
    if (/^(data:image\/|https?:\/\/|blob:)/i.test(avatar)) return avatar;
    return '';
}

function formatDossierMonologue(value) {
    const raw = String(value || '')
        .replace(/\r/g, '')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n[ \t]+/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    if (!raw) return '';
    if (raw.includes('\n')) return raw.slice(0, 520);

    const sentences = raw.match(/[^。！？!?；;]+[。！？!?；;]?/g) || [raw];
    const paragraphs = [];
    let current = '';
    sentences.forEach(sentence => {
        const next = `${current}${sentence}`.trim();
        if (current && next.length > 76 && paragraphs.length < 2) {
            paragraphs.push(current);
            current = sentence.trim();
        } else {
            current = next;
        }
    });
    if (current) paragraphs.push(current);
    return paragraphs.join('\n\n').slice(0, 520);
}

function normalizeDossierRinnoSummaryText(value, maxLength = 1800) {
    return String(value || '')
        .replace(/\r/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
        .slice(0, maxLength);
}

function createDossierFallbackMonologue(item, type) {
    const label = type === 'npc' ? 'NPC' : 'CHAR';
    const name = String(item?.name || (type === 'npc' ? '这个 NPC' : '这个角色')).trim();
    const setting = String(item?.setting || item?.note || '').replace(/\s+/g, ' ').trim();
    const settingLine = setting
        ? `我把这些设定藏在日常里：${setting}。`
        : '我还没有被完整写下，很多事只在沉默里慢慢成形。';
    return formatDossierMonologue([
        `别人把我归进 ${label}，把姓名、来处和身份钉在纸面上，可我知道那不是全部。${settingLine}`,
        `${name}这个名字被叫起时，我会先看一眼光落在哪里，再把设定里的锋利、迟疑或温柔，慢慢放回自己的语气里。`,
        '如果故事继续向前，我希望留下的不是漂亮标签，而是某个具体瞬间里，我终于愿意承认的欲望、恐惧和柔软。'
    ].join('\n\n'));
}

function getDossierMetaLabel(item, type) {
    const nickname = String(item?.nickname || '').trim();
    const publicId = String(item?.publicId || '').trim();
    const gender = String(item?.gender || '').trim();
    const nationality = String(item?.nationality || '').trim();
    const parts = [nickname, publicId, gender, nationality].filter(Boolean);
    if (parts.length) return parts.join(' / ');
    return type === 'npc' ? 'NPC / 设定待补' : 'Char / 设定待补';
}

function getDossierNetworkAccountLabel(item, fallback = '账号待生成') {
    const nickname = String(item?.nickname || '').trim();
    const publicId = String(item?.publicId || item?.id || '').trim();
    const parts = [nickname, publicId].filter(Boolean);
    return parts.length ? parts.join(' / ') : fallback;
}

function normalizeDossierItem(item, type, index, context = {}) {
    const fallbackName = type === 'npc' ? '新 NPC' : '新角色';
    const rawId = String(item?.id || `${type}-${index + 1}`);
    const name = String(item?.name || fallbackName).trim().slice(0, 28) || fallbackName;
    const usedRecordIds = context.usedRecordIds || new Set();
    const usedPublicIds = context.usedPublicIds || new Set();
    const id = coerceUniqueDossierNumericId(rawId, usedRecordIds, `${type}:${index}:${rawId}:${name}`);
    if (context.idMap) context.idMap.set(rawId, id);
    const nickname = String(item?.nickname || '').trim().slice(0, 28);
    const publicId = coerceUniqueDossierNumericId(item?.publicId || item?.handle || id, usedPublicIds, `${id}:${name}:${type}:public`);
    const gender = String(item?.gender || '').trim().slice(0, 16);
    const nationality = String(item?.nationality || '').trim().slice(0, 28);
    const settingSource = item?.setting || item?.note || item?.relation || '';
    const setting = String(settingSource || '设定内容待补全。').trim();
    const monologue = formatDossierMonologue(item?.monologue || item?.essay || item?.solo || '')
        || createDossierFallbackMonologue({ ...item, setting }, type);
    const metaLabel = [gender, nationality].filter(Boolean).join(' / ') || (type === 'npc' ? 'NPC / 旁支人物' : 'Char / 角色');
    const social = getDossierSocialStats({ ...item, id, publicId, name, setting, monologue }, type);
    return {
        id,
        avatar: normalizeDossierAvatar(item?.avatar),
        name,
        nickname,
        publicId,
        gender,
        nationality,
        setting,
        monologue,
        socialFollowers: social.followers,
        socialFollowing: social.following,
        socialOthers: social.others,
        followedBy: social.followedBy,
        rinnoMemorySummary: normalizeDossierRinnoSummaryText(item?.rinnoMemorySummary || item?.memorySummary || ''),
        rinnoStorySummary: normalizeDossierRinnoSummaryText(item?.rinnoStorySummary || item?.storySummary || ''),
        rinnoSummaryDigest: normalizeDossierRinnoSummaryText(item?.rinnoSummaryDigest || item?.relationshipSummary || '', 1200),
        rinnoSummaryUpdatedAt: Math.max(0, Number(item?.rinnoSummaryUpdatedAt || item?.summaryUpdatedAt) || 0),
        role: String(item?.role || metaLabel).trim().slice(0, 42),
        tags: parseDossierTags(item?.tags),
        relation: String(item?.relation || setting || '关系待补全。').trim().slice(0, 64),
        note: String(item?.note || setting || '还没有写下备注。').trim().slice(0, 360)
    };
}

function clampDossierNumber(value, min, max, fallback = min) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, number));
}

function createDossierNetworkId(prefix = 'node') {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function normalizeDossierNetworkIdPart(value, fallback = 'item') {
    const text = String(value || '').trim();
    return (text || fallback).replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 72) || fallback;
}

function normalizeDossierNetworkKind(value) {
    const kind = String(value || '').toLowerCase();
    if (['char', 'npc', 'user', 'text-npc'].includes(kind)) return kind;
    if (kind === 'text' || kind === 'plain-npc') return 'text-npc';
    return 'char';
}

function getDossierNetworkEntityId(kind, data = {}) {
    const safeKind = normalizeDossierNetworkKind(kind);
    if (safeKind === 'char' || safeKind === 'npc') {
        const refId = String(data.refId || '').trim();
        return refId ? `${safeKind}:${normalizeDossierNetworkIdPart(refId)}` : '';
    }
    if (safeKind === 'user') {
        const userId = String(data.refId || data.id || getDossierUserPresetForNetwork().id || 'user').trim();
        return `user:${normalizeDossierNetworkIdPart(userId, 'user')}`;
    }
    const rawId = String(data.id || '').trim();
    if (rawId.startsWith('text-npc:')) return rawId;
    return `text-npc:${normalizeDossierNetworkIdPart(rawId || createDossierNetworkId('plain-npc'), 'plain-npc')}`;
}

function createDossierNetworkNode(kind, data = {}) {
    const safeKind = normalizeDossierNetworkKind(kind);
    const refId = ['char', 'npc'].includes(safeKind)
        ? String(data.refId || '').trim()
        : safeKind === 'user'
            ? String(data.refId || data.userId || getDossierUserPresetForNetwork().id || '').trim()
            : '';
    const id = getDossierNetworkEntityId(safeKind, { ...data, refId });
    return {
        id: String(id || data.id || createDossierNetworkId('node')),
        slot: String(data.slot || ''),
        kind: safeKind,
        refId,
        name: String(data.name || '').trim().slice(0, 28),
        setting: String(data.setting || data.note || '').trim(),
        createdAt: data.createdAt || new Date().toISOString()
    };
}

function isDossierNetworkUserNode(node) {
    return normalizeDossierNetworkKind(node?.kind) === 'user' || String(node?.id || '').startsWith('user:');
}

function isDossierNetworkUserPair(sourceNode, targetNode) {
    return isDossierNetworkUserNode(sourceNode) && isDossierNetworkUserNode(targetNode);
}

function getDossierNetworkContactKey(node) {
    if (!node) return '';
    const kind = normalizeDossierNetworkKind(node.kind);
    if (kind === 'char' || kind === 'npc') {
        const refId = String(node.refId || '').trim();
        if (refId) return `${kind}:${normalizeDossierNetworkIdPart(refId)}`;
    }
    if (kind === 'user') {
        const refId = String(node.refId || node.userId || node.id || getDossierUserPresetForNetwork().id || 'user').trim();
        return `user:${normalizeDossierNetworkIdPart(refId, 'user')}`;
    }
    return String(node.id || '').trim();
}

function isDossierNetworkSameContact(sourceNode, targetNode) {
    const sourceKey = getDossierNetworkContactKey(sourceNode);
    const targetKey = getDossierNetworkContactKey(targetNode);
    return Boolean(sourceKey && targetKey && sourceKey === targetKey);
}

function createDefaultDossierNetwork(data = {}) {
    const char = Array.isArray(data.char) ? data.char : [];
    const npc = Array.isArray(data.npc) ? data.npc : [];
    const nodes = [];

    if (char[0]) {
        nodes.push(createDossierNetworkNode('char', { slot: 'primary', refId: char[0].id }));
    } else {
        const user = getDossierUserPresetForNetwork();
        nodes.push(createDossierNetworkNode('user', { slot: 'primary', refId: user.id, name: user.name, setting: user.setting }));
    }
    if (char[1]) nodes.push(createDossierNetworkNode('char', { slot: 'ally', refId: char[1].id }));
    if (char[2]) nodes.push(createDossierNetworkNode('char', { slot: 'mirror', refId: char[2].id }));
    if (npc[0]) nodes.push(createDossierNetworkNode('npc', { slot: 'system', refId: npc[0].id }));

    const primaryId = nodes[0]?.id || '';
    const links = nodes.slice(1).map(node => ({
        id: createDossierNetworkId('link'),
        from: primaryId,
        to: node.id,
        relation: node.kind === 'npc' ? '剧情关联' : '关系待设定',
        description: node.setting || '关系描述待补充。'
    }));

    return {
        scale: 1,
        activeId: primaryId,
        nodes,
        links
    };
}

function normalizeDossierNetworkLink(link, nodeIds, nodesById = new Map()) {
    const from = String(link?.from || '');
    const to = String(link?.to || '');
    if (!from || !to || from === to || !nodeIds.has(from) || !nodeIds.has(to)) return null;
    if (isDossierNetworkSameContact(nodesById.get(from), nodesById.get(to))) return null;
    if (isDossierNetworkUserPair(nodesById.get(from), nodesById.get(to))) return null;
    return {
        id: String(link?.id || createDossierNetworkId('link')),
        from,
        to,
        relation: String(link?.relation || '关系待设定').trim().slice(0, 64) || '关系待设定',
        description: String(link?.description || link?.note || '').trim().slice(0, 260)
    };
}

function normalizeDossierNetwork(value, data = {}, context = {}) {
    const source = value && typeof value === 'object' ? value : null;
    if (!source || !Array.isArray(source.nodes)) {
        return createDefaultDossierNetwork(data);
    }

    const idMap = context.idMap || new Map();
    const usedNodeIds = new Set();
    const legacyNodeIds = new Map();
    const nodes = source.nodes.map((node, index) => {
        const rawId = String(node?.id || `node-${index + 1}`);
        const kind = normalizeDossierNetworkKind(node?.kind);
        const refId = ['char', 'npc'].includes(kind)
            ? String(idMap.get(String(node?.refId || '')) || node?.refId || '')
            : kind === 'user'
                ? String(node?.refId || node?.userId || getDossierUserPresetForNetwork().id || '')
                : '';
        const normalizedNode = createDossierNetworkNode(kind, {
            ...node,
            refId,
            slot: node?.slot || (index === 0 ? 'primary' : '')
        });
        if (usedNodeIds.has(normalizedNode.id) && kind !== 'user') {
            normalizedNode.id = createDossierNetworkId('node');
        }
        usedNodeIds.add(normalizedNode.id);
        legacyNodeIds.set(rawId, normalizedNode.id);
        return normalizedNode;
    }).filter(Boolean);

    if (!nodes.length) return createDefaultDossierNetwork(data);
    if (!nodes.some(node => node.slot === 'primary')) nodes[0].slot = 'primary';

    const nodeIds = new Set(nodes.map(node => node.id));
    const nodesById = new Map(nodes.map(node => [node.id, node]));
    let links = Array.isArray(source.links)
        ? source.links.map(link => normalizeDossierNetworkLink({
            ...link,
            from: legacyNodeIds.get(String(link?.from || '')) || link?.from,
            to: legacyNodeIds.get(String(link?.to || '')) || link?.to
        }, nodeIds, nodesById)).filter(Boolean)
        : [];

    if (!links.length && nodes.length > 1) {
        const primaryId = nodes.find(node => node.slot === 'primary')?.id || nodes[0].id;
        links = nodes
            .filter(node => node.id !== primaryId)
            .filter(node => !isDossierNetworkSameContact(nodesById.get(primaryId), node))
            .filter(node => !isDossierNetworkUserPair(nodesById.get(primaryId), node))
            .map(node => ({
                id: createDossierNetworkId('link'),
                from: primaryId,
                to: node.id,
                relation: '关系待设定',
                description: node.setting || '关系描述待补充。'
            }));
    }

    const primaryId = nodes.find(node => node.slot === 'primary')?.id || nodes[0]?.id || '';
    const mappedActiveId = legacyNodeIds.get(String(source.activeId || '')) || source.activeId;
    const activeId = nodeIds.has(String(mappedActiveId || '')) ? String(mappedActiveId) : primaryId;

    return {
        scale: clampDossierNumber(source.scale, DOSSIER_NETWORK_SCALE_MIN, DOSSIER_NETWORK_SCALE_MAX, 1),
        activeId,
        nodes,
        links
    };
}

function normalizeDossierState(value) {
    const defaults = createDefaultDossierState();
    const source = value && typeof value === 'object' ? value : {};
    const charSource = Array.isArray(source.char) ? source.char : defaults.char;
    const npcSource = Array.isArray(source.npc) ? source.npc : defaults.npc;
    const context = {
        usedRecordIds: new Set(),
        usedPublicIds: new Set(),
        idMap: new Map()
    };
    const char = charSource.map((item, index) => normalizeDossierItem(item, 'char', index, context));
    const npc = npcSource.map((item, index) => normalizeDossierItem(item, 'npc', index, context));
    const mappedActiveCharId = context.idMap.get(String(source.activeCharId || '')) || source.activeCharId;
    const mappedActiveNpcId = context.idMap.get(String(source.activeNpcId || '')) || source.activeNpcId;
    const activeCharId = char.find(item => item.id === mappedActiveCharId)?.id || char[0]?.id || '';
    const activeNpcId = npc.find(item => item.id === mappedActiveNpcId)?.id || npc[0]?.id || '';
    const network = normalizeDossierNetwork(source.network, { char, npc }, context);

    return { char, npc, activeCharId, activeNpcId, network };
}

function loadDossierState() {
    if (!dossierState) dossierState = createDefaultDossierState();
    syncDossierStateBridge();
    return dossierState;
}

function syncDossierStateBridge() {
    window.rinnoDossierStateCache = dossierState || createDefaultDossierState();
    window.rinnoDossierStateReady = dossierStateReady || Promise.resolve(window.rinnoDossierStateCache);
}

function readLegacyDossierStateSnapshot() {
    try {
        localStorage.removeItem('rinno_dossier_state_v2');
        const raw = localStorage.getItem(DOSSIER_STORAGE_KEY);
        return {
            state: normalizeDossierState(raw ? JSON.parse(raw) : null),
            hasLegacy: Boolean(raw)
        };
    } catch (error) {
        console.warn('Dossier state reset:', error);
        return {
            state: createDefaultDossierState(),
            hasLegacy: false
        };
    }
}

async function persistDossierStateSnapshot(snapshot) {
    try {
        if (typeof db !== 'undefined' && db?.edits?.put) {
            await db.edits.put({
                id: DOSSIER_STORAGE_KEY,
                content: JSON.stringify(snapshot || createDefaultDossierState()),
                type: 'dossier-state'
            });
        }
    } catch (error) {
        console.warn('Dossier Dexie save failed:', error);
    }
    try {
        localStorage.removeItem('rinno_dossier_state_v2');
        localStorage.removeItem(DOSSIER_STORAGE_KEY);
    } catch (error) {
        // Ignore legacy cleanup failures.
    }
}

async function hydrateDossierState(force = false) {
    if (!force && dossierStateReady) return dossierStateReady;
    dossierStateReady = (async () => {
        let nextState = null;
        try {
            if (typeof db !== 'undefined' && db?.edits?.get) {
                const saved = await db.edits.get(DOSSIER_STORAGE_KEY);
                if (saved?.content) nextState = normalizeDossierState(JSON.parse(saved.content));
            }
        } catch (error) {
            console.warn('Dossier Dexie read failed:', error);
        }
        if (!nextState) {
            const legacy = readLegacyDossierStateSnapshot();
            nextState = legacy.state;
            if (legacy.hasLegacy) void persistDossierStateSnapshot(nextState);
        }
        dossierState = nextState || createDefaultDossierState();
        syncDossierStateBridge();
        return dossierState;
    })().catch(error => {
        console.warn('Dossier state hydrate failed:', error);
        dossierState = createDefaultDossierState();
        syncDossierStateBridge();
        return dossierState;
    });
    syncDossierStateBridge();
    return dossierStateReady;
}

function saveDossierState() {
    if (!dossierState) dossierState = createDefaultDossierState();
    syncDossierStateBridge();
    void persistDossierStateSnapshot(dossierState);
}

function getDossierActiveKey(type) {
    return type === 'npc' ? 'activeNpcId' : 'activeCharId';
}

function getDossierItems(type) {
    return loadDossierState()[type === 'npc' ? 'npc' : 'char'] || [];
}

function getDossierActiveItem(type) {
    const items = getDossierItems(type);
    const activeKey = getDossierActiveKey(type);
    const activeId = loadDossierState()[activeKey];
    return items.find(item => item.id === activeId) || items[0] || null;
}

function getDossierSearchValue(type) {
    const input = document.getElementById(`dossier-${type}-search`);
    return String(input?.value || '').trim().toLowerCase();
}

function filterDossierItems(type) {
    const query = getDossierSearchValue(type);
    const items = getDossierItems(type);
    if (!query) return items;
    return items.filter(item => {
        const text = [item.name, item.nickname, item.publicId, item.gender, item.nationality, item.setting, item.monologue, item.role, item.tags.join(' '), item.relation, item.note]
            .join(' ')
            .toLowerCase();
        return text.includes(query);
    });
}

function getDossierInitial(name) {
    return Array.from(String(name || '?').trim())[0]?.toUpperCase() || '?';
}

function createDossierAvatarMarkup(item, className = 'dossier-avatar') {
    if (item?.avatar) {
        return `<span class="${className} has-image" aria-hidden="true"><img src="${escapeDossierHtml(item.avatar)}" alt=""></span>`;
    }
    return `<span class="${className}" aria-hidden="true">${escapeDossierHtml(getDossierInitial(item?.name))}</span>`;
}

function createDossierParagraphMarkup(value) {
    const text = escapeDossierHtml(formatDossierMonologue(value));
    return text
        .split(/\n{2,}/)
        .map(part => part.trim())
        .filter(Boolean)
        .map(part => `<p>${part.replace(/\n/g, '<br>')}</p>`)
        .join('');
}

function formatDossierRinnoSummaryTime(value = 0) {
    const timestamp = Number(value) || 0;
    if (!timestamp) return '';
    try {
        return new Intl.DateTimeFormat('zh-CN', {
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).format(new Date(timestamp));
    } catch (error) {
        return '';
    }
}

function createDossierRinnoArchiveDetailMarkupLegacy(item = {}) {
    const memory = normalizeDossierRinnoSummaryText(item?.rinnoMemorySummary || '');
    const story = normalizeDossierRinnoSummaryText(item?.rinnoStorySummary || '');
    const digest = normalizeDossierRinnoSummaryText(item?.rinnoSummaryDigest || '', 1200);
    const stamp = formatDossierRinnoSummaryTime(item?.rinnoSummaryUpdatedAt);
    const formatBlock = value => escapeDossierHtml(value).replace(/\n/g, '<br>');
    if (!memory && !story && !digest) return '';
    return [
        memory ? `
            <div class="dossier-detail-line dossier-detail-setting">
                <span>RINNO MEMORY${stamp ? ` · ${escapeDossierHtml(stamp)}` : ''}</span>
                <p>${formatBlock(memory)}</p>
            </div>
        ` : '',
        story ? `
            <div class="dossier-detail-line dossier-detail-setting">
                <span>RINNO STORY</span>
                <p>${formatBlock(story)}</p>
            </div>
        ` : '',
        digest ? `
            <div class="dossier-detail-line dossier-detail-setting">
                <span>RINNO SUMMARY</span>
                <p>${formatBlock(digest)}</p>
            </div>
        ` : ''
    ].join('');
}

function createDossierRinnoArchiveProfileMarkupLegacy(item = {}) {
    const memory = normalizeDossierRinnoSummaryText(item?.rinnoMemorySummary || '');
    const story = normalizeDossierRinnoSummaryText(item?.rinnoStorySummary || '');
    const digest = normalizeDossierRinnoSummaryText(item?.rinnoSummaryDigest || '', 1200);
    const stamp = formatDossierRinnoSummaryTime(item?.rinnoSummaryUpdatedAt);
    const parts = [
        memory ? `【拾光记忆${stamp ? ` · ${stamp}` : ''}】\n${memory}` : '',
        story ? `【拾光剧情】\n${story}` : '',
        digest ? `【拾光关系总结】\n${digest}` : ''
    ].filter(Boolean).join('\n\n');
    return parts ? createDossierParagraphMarkup(parts) : '';
}

function createDossierRinnoArchiveDetailMarkup(item = {}) {
    const memory = normalizeDossierRinnoSummaryText(item?.rinnoMemorySummary || '');
    const story = normalizeDossierRinnoSummaryText(item?.rinnoStorySummary || '');
    const digest = normalizeDossierRinnoSummaryText(item?.rinnoSummaryDigest || '', 1200);
    const stamp = formatDossierRinnoSummaryTime(item?.rinnoSummaryUpdatedAt);
    const formatBlock = value => escapeDossierHtml(value).replace(/\n/g, '<br>');
    return [
        `
            <div class="dossier-detail-line dossier-detail-setting">
                <span>RINNO MEMORY${stamp ? ` 路 ${escapeDossierHtml(stamp)}` : ''}</span>
                <p>${formatBlock(memory || '暂无记忆')}</p>
            </div>
        `,
        `
            <div class="dossier-detail-line dossier-detail-setting">
                <span>RINNO STORY</span>
                <p>${formatBlock(story || '暂无剧情')}</p>
            </div>
        `,
        `
            <div class="dossier-detail-line dossier-detail-setting">
                <span>RINNO SUMMARY</span>
                <p>${formatBlock(digest || '暂无总结')}</p>
            </div>
        `
    ].join('');
}

function createDossierRinnoArchiveProfileMarkup(item = {}) {
    const memory = normalizeDossierRinnoSummaryText(item?.rinnoMemorySummary || '');
    const story = normalizeDossierRinnoSummaryText(item?.rinnoStorySummary || '');
    const digest = normalizeDossierRinnoSummaryText(item?.rinnoSummaryDigest || '', 1200);
    const stamp = formatDossierRinnoSummaryTime(item?.rinnoSummaryUpdatedAt);
    const parts = [
        `拾光记忆${stamp ? ` · ${stamp}` : ''}\n${memory || '暂无记忆'}`,
        `拾光剧情\n${story || '暂无剧情'}`,
        `拾光总结\n${digest || '暂无总结'}`
    ].join('\n\n');
    return '';
}

function getDossierProfileSeed(item, type) {
    const source = `${type}:${item?.id || ''}:${item?.name || ''}:${item?.publicId || ''}`;
    return Array.from(source).reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

const DOSSIER_SOCIAL_THEMES = [
    { words: ['画', '艺术', '音乐', '歌', '乐', '摄影', '照片', '舞台', '创作', 'artist', 'music'], names: ['Artists', 'Musicians'], weight: 460 },
    { words: ['档案', '卷宗', '记录', '系统', '线索', '真相', '证据', 'archive', 'case'], names: ['Archivists', 'Witnesses'], weight: 380 },
    { words: ['秘密', '夜', '阴影', '危险', '谋杀', '凶', '逃', '追', 'secret', 'night'], names: ['Night Watchers', 'Confidants'], weight: 520 },
    { words: ['爱', '温柔', '敏感', '慢热', '信任', '关系', '欲望', '心', 'love'], names: ['Dreamers', 'Soft Hearts'], weight: 420 },
    { words: ['学生', '校园', '书', '纸', '写', '诗', '信', '读', 'school', 'book'], names: ['Readers', 'Poets'], weight: 350 },
    { words: ['治愈', '守护', '照顾', '医生', '药', '伤', 'healer', 'care'], names: ['Caretakers', 'Healers'], weight: 300 },
    { words: ['旅行', '海', '风', '城市', '街', '远方', '旅', 'road'], names: ['Travelers', 'Strangers'], weight: 280 }
];

function normalizeDossierSocialNumber(value, fallback, min, max) {
    const digits = getDossierDigits(value);
    const number = Number.parseInt(digits || value, 10);
    if (!Number.isFinite(number)) return fallback;
    return Math.max(min, Math.min(max, number));
}

function normalizeDossierFollowedBy(value, fallback = []) {
    const source = Array.isArray(value)
        ? value
        : String(value || '').split(/[,，、/&]/);
    const names = source
        .map(item => String(item || '').replace(/[^A-Za-z0-9 '&-]/g, '').replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .slice(0, 2);
    return names.length ? names : fallback.slice(0, 2);
}

function getDossierSocialStats(item, type) {
    const seed = getDossierProfileSeed(item, type);
    const text = [item?.setting, item?.monologue, item?.role, item?.note, item?.name]
        .join(' ')
        .toLowerCase();
    const theme = DOSSIER_SOCIAL_THEMES.find(entry => entry.words.some(word => text.includes(String(word).toLowerCase())))
        || (type === 'npc'
            ? { names: ['Archivists', 'Witnesses'], weight: 320 }
            : { names: ['Artists', 'Dreamers'], weight: 360 });
    const settingDepth = Math.min(420, String(item?.setting || '').trim().length * 5);
    const fallbackFollowers = 620 + theme.weight + settingDepth + (seed % 1500);
    const fallbackFollowing = 48 + Math.round(theme.weight / 12) + (seed % 180);
    const fallbackOthers = 12 + (seed % 46);
    return {
        followers: normalizeDossierSocialNumber(item?.socialFollowers || item?.followers, fallbackFollowers, 100, 999999),
        following: normalizeDossierSocialNumber(item?.socialFollowing || item?.following, fallbackFollowing, 1, 9999),
        others: normalizeDossierSocialNumber(item?.socialOthers || item?.others, fallbackOthers, 1, 999),
        followedBy: normalizeDossierFollowedBy(item?.followedBy, theme.names)
    };
}

function formatDossierCount(value) {
    return Number(value || 0).toLocaleString('en-US');
}

function createDossierEmptyMarkup(type, compact = false) {
    const label = type === 'npc' ? 'NPC' : 'Char';
    return `
        <div class="dossier-empty${compact ? ' compact' : ''}">
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 6h16M4 12h10M4 18h7"/>
            </svg>
            <strong>还没有 ${label} 资料</strong>
            <span>点右上角新建一条，之后可以在这里搜索、编辑和删除。</span>
        </div>
    `;
}

function renderDossierList(type) {
    const list = document.getElementById(`dossier-${type}-list`);
    if (!list) return;
    const state = loadDossierState();
    const activeId = state[getDossierActiveKey(type)];
    const items = filterDossierItems(type);

    if (!items.length) {
        list.innerHTML = createDossierEmptyMarkup(type, true);
        return;
    }

    list.innerHTML = items.map((item, index) => {
        const active = item.id === activeId;
        const name = escapeDossierHtml(item.name);
        const itemId = escapeDossierHtml(item.id);
        const previewTitle = escapeDossierHtml(item.nickname || item.name);
        return `
            <article class="dossier-list-card dossier-storage-card${active ? ' active' : ''}" data-dossier-storage-type="${type}" data-dossier-storage-title="${previewTitle}" aria-current="${active ? 'true' : 'false'}">
                <button class="dossier-card-arrow dossier-card-arrow-left interactive" type="button" data-dossier-profile-type="${type}" data-dossier-profile-id="${itemId}" aria-label="打开${name}资料卡" title="资料卡">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                <button class="dossier-card-arrow dossier-card-arrow-right interactive" type="button" data-dossier-edit-type="${type}" data-dossier-edit-id="${itemId}" aria-label="编辑${name}" title="编辑">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
                </button>
                <button class="dossier-storage-face interactive" type="button" data-dossier-type="${type}" data-dossier-select="${itemId}" aria-pressed="${active}" aria-label="选中${name}">
                    ${createDossierAvatarMarkup(item, 'dossier-storage-avatar')}
                </button>
            </article>
        `;
    }).join('');
}

function renderDossierDetail(type) {
    const detail = document.getElementById(`dossier-${type}-detail`);
    if (!detail) return;
    const item = getDossierActiveItem(type);
    const label = type === 'npc' ? 'NPC' : 'CHAR';

    if (!item) {
        detail.innerHTML = `
            <section class="dossier-empty">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
                <strong>新建 ${label}</strong>
                <span>这里会显示当前选中的资料详情。</span>
                <button class="dossier-soft-button primary interactive" type="button" data-dossier-add-empty="${type}">新建资料</button>
            </section>
        `;
        return;
    }

    const items = getDossierItems(type);
    const order = Math.max(0, items.findIndex(entry => entry.id === item.id)) + 1;
    const rinnoArchiveDetail = createDossierRinnoArchiveDetailMarkup(item);
    detail.innerHTML = `
        <article class="dossier-detail-card">
            <div class="dossier-detail-portrait">
                ${createDossierAvatarMarkup(item, 'dossier-detail-avatar')}
            </div>
            <div class="dossier-detail-head">
                <div>
                    <div class="dossier-count">${label} ${String(order).padStart(2, '0')}</div>
                    <h2 class="dossier-detail-title">${escapeDossierHtml(item.name)}</h2>
                    <div class="dossier-detail-role">${escapeDossierHtml(getDossierMetaLabel(item, type))}</div>
                </div>
                <button class="dossier-icon-button interactive" type="button" data-dossier-edit="${type}" aria-label="编辑资料" title="编辑">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M4 20h4l11-11a2.8 2.8 0 0 0-4-4L4 16v4z"/>
                        <path d="M13.5 6.5l4 4"/>
                    </svg>
                </button>
            </div>
            <div class="dossier-profile-meta">
                <div>
                    <span>NICKNAME</span>
                    <strong>${escapeDossierHtml(item.nickname || '未填写')}</strong>
                </div>
                <div>
                    <span>ID</span>
                    <strong>${escapeDossierHtml(item.publicId || '未填写')}</strong>
                </div>
                <div>
                    <span>GENDER</span>
                    <strong>${escapeDossierHtml(item.gender || '未填写')}</strong>
                </div>
                <div>
                    <span>NATIONALITY</span>
                    <strong>${escapeDossierHtml(item.nationality || '未填写')}</strong>
                </div>
            </div>
            <div class="dossier-detail-grid">
                <div class="dossier-detail-line dossier-detail-setting">
                    <span>SETTING</span>
                    <p>${escapeDossierHtml(item.setting)}</p>
                </div>
                <div class="dossier-detail-line dossier-detail-monologue">
                    <span>MONOLOGUE</span>
                    <p>${escapeDossierHtml(item.monologue)}</p>
                </div>
                ${rinnoArchiveDetail}
            </div>
        </article>
    `;
}

function createDossierProfilePanelMarkup(item, type) {
    const label = type === 'npc' ? 'NPC' : 'CHAR';
    const stats = getDossierSocialStats(item, type);
    const displayName = item.nickname || item.name;
    const realName = item.name || displayName;
    const monologueHtml = createDossierParagraphMarkup(item.monologue || createDossierFallbackMonologue(item, type));
    const rinnoArchiveHtml = createDossierRinnoArchiveProfileMarkup(item);

    return `
        <article class="dossier-profile-paper">
            <header class="dossier-profile-hero">
                ${createDossierAvatarMarkup(item, 'dossier-profile-avatar')}
                <div class="dossier-profile-identity">
                    <div class="dossier-profile-name-row">
                        <h2>@${escapeDossierHtml(displayName)}<span>${label}</span></h2>
                    </div>
                    <p>${escapeDossierHtml(realName)}</p>
                </div>
            </header>
            <div class="dossier-profile-stats">
                <span>${formatDossierCount(stats.followers)} Followers</span>
                <i></i>
                <span>${formatDossierCount(stats.following)} Following</span>
            </div>
            <div class="dossier-profile-followed" aria-label="关注关联">
                <span></span><span></span><span></span>
                <p>Followed by <strong>${escapeDossierHtml(stats.followedBy.join(', '))}</strong> and <strong>${stats.others} others</strong></p>
            </div>
            <div class="dossier-profile-dots" aria-hidden="true">...</div>
            <section class="dossier-profile-monologue" aria-label="独白随笔">
                ${monologueHtml}
            </section>
            ${rinnoArchiveHtml ? `
                <section class="dossier-profile-monologue" aria-label="拾光档案摘要">
                    ${rinnoArchiveHtml}
                </section>
            ` : ''}
        </article>
    `;
}

function refreshDossierLinkedPrivateSurfaces() {
    try {
        if (typeof renderPrivateExperience === 'function') {
            renderPrivateExperience();
            return;
        }
        if (typeof renderPrivateContacts === 'function') renderPrivateContacts();
    } catch (error) {
        console.warn('卷宗刷新私叙界面失败:', error);
    }
}

function openDossierProfileCard(type, id = '') {
    const safeType = type === 'npc' ? 'npc' : 'char';
    const modal = document.getElementById('dossier-profile-modal');
    const content = document.getElementById('dossier-profile-content');
    if (!modal || !content) return;
    const state = loadDossierState();
    const item = state[safeType].find(entry => entry.id === id) || getDossierActiveItem(safeType);
    if (!item) return;

    state[getDossierActiveKey(safeType)] = item.id;
    saveDossierState();
    renderDossierList(safeType);
    renderDossierDetail(safeType);
    renderDossierNetwork();

    content.innerHTML = createDossierProfilePanelMarkup(item, safeType);
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('active'));
}

function closeDossierProfileCard() {
    const modal = document.getElementById('dossier-profile-modal');
    if (!modal) return;
    modal.classList.remove('active');
    window.setTimeout(() => {
        if (!modal.classList.contains('active')) modal.hidden = true;
    }, 180);
}

function getDossierUserPresetForNetwork() {
    const defaults = typeof createDefaultPrivateUserPreset === 'function'
        ? createDefaultPrivateUserPreset()
        : { name: '我', id: '@ rinno', gender: '未设定', setting: '把人物设定写在这里。' };
    const state = typeof privateState !== 'undefined' ? privateState : null;
    return {
        id: String(state?.userPresetId || document.getElementById('private-persona-preset-id')?.textContent || defaults.id),
        name: String(state?.userPresetName || document.getElementById('private-persona-preset-name')?.textContent || defaults.name),
        gender: String(state?.userPresetGender || document.getElementById('private-persona-preset-gender')?.textContent || defaults.gender),
        setting: String(state?.userPresetSetting || document.getElementById('private-persona-preset-setting')?.textContent || defaults.setting),
        avatar: String(state?.avatar || '')
    };
}

function getDossierNetworkKindLabel(kind) {
    return {
        char: 'Char',
        npc: 'NPC',
        user: 'USER',
        'text-npc': '文字 NPC'
    }[normalizeDossierNetworkKind(kind)] || '节点';
}

function getDossierNetworkNodeProfile(node, state = loadDossierState()) {
    const kind = normalizeDossierNetworkKind(node?.kind);
    if (kind === 'char' || kind === 'npc') {
        const item = state[kind].find(entry => entry.id === node.refId) || null;
        const nickname = String(item?.nickname || '').trim();
        const publicId = String(item?.publicId || item?.id || '').trim();
        return {
            kind,
            name: nickname || item?.name || node?.name || (kind === 'npc' ? '已删除 NPC' : '已删除 Char'),
            meta: item ? (publicId || '账号待生成') : '资料库中未找到',
            note: item?.setting || node?.setting || '关系资料待补充。',
            avatar: item?.avatar || ''
        };
    }
    if (kind === 'user') {
        const user = getDossierUserPresetForNetwork();
        return {
            kind,
            name: user.name || '我',
            meta: String(user.id || '').trim() || 'USER',
            note: user.setting || 'USER 设定待补充。',
            avatar: user.avatar || ''
        };
    }
    return {
        kind,
        name: node?.name || '文字 NPC',
        meta: '只存在于关系网',
        note: node?.setting || '这个文字 NPC 不会进入 NPC 库。',
        avatar: ''
    };
}

function createDossierNetworkAvatarMarkup(profile, className = 'dossier-network-avatar') {
    if (profile?.avatar) {
        return `<span class="${className} has-image" aria-hidden="true"><img src="${escapeDossierHtml(profile.avatar)}" alt=""></span>`;
    }
    return `<span class="${className}" aria-hidden="true">${escapeDossierHtml(getDossierInitial(profile?.name))}</span>`;
}

function getDossierNetworkCanvasMetrics(count) {
    const extra = Math.max(0, Number(count || 0) - 9);
    const steps = Math.ceil(extra / 4);
    return {
        width: DOSSIER_NETWORK_DEFAULT_WIDTH + steps * 130,
        height: DOSSIER_NETWORK_DEFAULT_HEIGHT + steps * 90
    };
}

function getDossierNetworkLayout(nodes) {
    const layout = {};
    if (!nodes.length) return layout;
    const primary = nodes.find(node => node.slot === 'primary') || nodes[0];
    const rest = nodes.filter(node => node.id !== primary.id);
    layout[primary.id] = { x: 50, y: 50 };

    rest.forEach((node, index) => {
        const firstRingCount = Math.min(rest.length, 8);
        const inSecondRing = index >= 8;
        const ringIndex = inSecondRing ? index - 8 : index;
        const ringCount = inSecondRing ? Math.max(1, rest.length - 8) : Math.max(1, firstRingCount);
        const radiusX = inSecondRing ? 42 : (rest.length <= 4 ? 30 : 34);
        const radiusY = inSecondRing ? 36 : (rest.length <= 4 ? 27 : 31);
        const offset = inSecondRing ? Math.PI / Math.max(2, ringCount) : 0;
        const angle = -Math.PI / 2 + offset + (Math.PI * 2 * ringIndex) / ringCount;
        layout[node.id] = {
            x: clampDossierNumber(50 + Math.cos(angle) * radiusX, 7, 93, 50),
            y: clampDossierNumber(50 + Math.sin(angle) * radiusY, 10, 90, 50)
        };
    });

    return layout;
}

function getDossierNetworkLinkPath(link, layout, metrics) {
    const from = layout[link.from];
    const to = layout[link.to];
    if (!from || !to) return null;
    const x1 = from.x * metrics.width / 100;
    const y1 = from.y * metrics.height / 100;
    const x2 = to.x * metrics.width / 100;
    const y2 = to.y * metrics.height / 100;
    return {
        x1,
        y1,
        x2,
        y2,
        labelX: (x1 + x2) / 2,
        labelY: (y1 + y2) / 2
    };
}

function renderDossierNetworkLinks(network, layout, metrics) {
    const svg = document.getElementById('dossier-network-links');
    if (!svg) return;
    svg.setAttribute('viewBox', `0 0 ${metrics.width} ${metrics.height}`);
    svg.innerHTML = network.links.map(link => {
        const path = getDossierNetworkLinkPath(link, layout, metrics);
        if (!path) return '';
        const relation = escapeDossierHtml(link.relation || '关系');
        return `
            <g class="dossier-network-link">
                <line x1="${path.x1.toFixed(1)}" y1="${path.y1.toFixed(1)}" x2="${path.x2.toFixed(1)}" y2="${path.y2.toFixed(1)}"></line>
                <text x="${path.labelX.toFixed(1)}" y="${(path.labelY - 8).toFixed(1)}">${relation}</text>
            </g>
        `;
    }).join('');
}

function applyDossierNetworkScale(scale, metrics = null) {
    const canvas = document.getElementById('dossier-network-canvas');
    const inner = document.getElementById('dossier-network-canvas-inner');
    const safeScale = clampDossierNumber(scale, DOSSIER_NETWORK_SCALE_MIN, DOSSIER_NETWORK_SCALE_MAX, 1);
    const size = metrics || getDossierNetworkCanvasMetrics(loadDossierState().network.nodes.length);
    if (canvas) {
        canvas.style.width = `${Math.round(size.width * safeScale)}px`;
        canvas.style.height = `${Math.round(size.height * safeScale)}px`;
    }
    if (inner) {
        inner.style.width = `${size.width}px`;
        inner.style.height = `${size.height}px`;
        inner.style.transform = `scale(${safeScale})`;
    }
}

function renderDossierNetworkNotes(network, state, profilesById) {
    const notes = document.getElementById('dossier-relation-notes');
    if (!notes) return;
    if (!network.links.length) {
        notes.innerHTML = `
            <article>
                <span>00 /</span>
                <p><strong>关系网待填写</strong>添加人物后，可以把 Char、NPC、USER 或文字 NPC 串进同一张关系图。</p>
            </article>
        `;
        return;
    }

    notes.innerHTML = network.links.map((link, index) => {
        const from = profilesById.get(link.from) || getDossierNetworkNodeProfile({ id: link.from }, state);
        const to = profilesById.get(link.to) || getDossierNetworkNodeProfile({ id: link.to }, state);
        return `
            <article>
                <span>${String(index + 1).padStart(2, '0')} /</span>
                <p><strong>${escapeDossierHtml(from.name)} 与 ${escapeDossierHtml(to.name)} · ${escapeDossierHtml(link.relation || '关系待设定')}</strong>${escapeDossierHtml(link.description || '关系描述待补充。')}</p>
            </article>
        `;
    }).join('');
}

function renderDossierNetwork() {
    const state = loadDossierState();
    state.network = normalizeDossierNetwork(state.network, { char: state.char, npc: state.npc });
    const network = state.network;
    const nodesRoot = document.getElementById('dossier-network-nodes');
    if (!nodesRoot) return;

    const entities = getDossierNetworkAvailableEntities(state);
    if (!network.nodes.some(node => node.id === network.activeId)) {
        const activeEntity = entities.find(node => node.id === network.activeId) || entities[0];
        if (activeEntity) {
            activeEntity.slot = 'primary';
            ensureDossierNetworkNode(network, activeEntity);
            network.activeId = activeEntity.id;
        }
    }

    const activeId = network.activeId || network.nodes[0]?.id || '';
    network.nodes.forEach(node => { node.slot = node.id === activeId ? 'primary' : ''; });
    const visibleNodeIds = new Set([activeId]);
    network.links.forEach(link => {
        if (link.from === activeId || link.to === activeId) {
            visibleNodeIds.add(link.from);
            visibleNodeIds.add(link.to);
        }
    });
    const visibleNodes = network.nodes.filter(node => visibleNodeIds.has(node.id));
    const visibleLinks = network.links.filter(link => visibleNodeIds.has(link.from) && visibleNodeIds.has(link.to));

    const metrics = getDossierNetworkCanvasMetrics(visibleNodes.length);
    const layout = getDossierNetworkLayout(visibleNodes);
    const profilesById = new Map();
    visibleNodes.forEach(node => profilesById.set(node.id, getDossierNetworkNodeProfile(node, state)));

    applyDossierNetworkScale(network.scale, metrics);
    renderDossierNetworkLinks({ ...network, links: visibleLinks }, layout, metrics);

    nodesRoot.innerHTML = visibleNodes.map((node, index) => {
        const profile = profilesById.get(node.id);
        const point = layout[node.id] || { x: 50, y: 50 };
        const kind = normalizeDossierNetworkKind(node.kind);
        const isPrimary = node.id === activeId || index === 0;
        return `
            <button class="dossier-network-node interactive ${isPrimary ? 'primary' : ''} kind-${kind}" type="button" data-dossier-network-node="${escapeDossierHtml(node.id)}" style="left:${point.x.toFixed(2)}%;top:${point.y.toFixed(2)}%;" aria-label="编辑${escapeDossierHtml(profile.name)}关系">
                ${createDossierNetworkAvatarMarkup(profile)}
                <span class="dossier-network-node-copy">
                    <strong>${escapeDossierHtml(profile.name)}</strong>
                    <small>${escapeDossierHtml(profile.meta)}</small>
                </span>
            </button>
        `;
    }).join('');

    renderDossierNetworkNotes({ ...network, links: visibleLinks }, state, profilesById);
}

function getDossierNetworkPrimaryNode(network) {
    return network.nodes.find(node => node.slot === 'primary') || network.nodes[0] || null;
}

function getDossierNetworkNodeLink(network, nodeId) {
    return network.links.find(link => link.from === nodeId || link.to === nodeId) || null;
}

function getDossierNetworkLinkedTarget(link, nodeId) {
    if (!link) return '';
    return link.from === nodeId ? link.to : link.from;
}

function getDossierNetworkAvailableEntities(state = loadDossierState()) {
    const user = getDossierUserPresetForNetwork();
    const userNode = createDossierNetworkNode('user', { refId: user.id, name: user.name, setting: user.setting });
    const existingTextNodes = (state.network?.nodes || []).filter(node => normalizeDossierNetworkKind(node.kind) === 'text-npc');
    return [
        userNode,
        ...state.char.map(item => createDossierNetworkNode('char', { refId: item.id, name: item.name, setting: item.setting })),
        ...state.npc.map(item => createDossierNetworkNode('npc', { refId: item.id, name: item.name, setting: item.setting })),
        ...existingTextNodes
    ];
}

function ensureDossierNetworkNode(network, node) {
    const existing = network.nodes.find(entry => entry.id === node.id);
    if (existing) {
        Object.assign(existing, node, { slot: existing.slot || node.slot || '' });
        return existing;
    }
    network.nodes.push(node);
    return node;
}

function renderDossierNetworkSourceOptions(selectedId = '') {
    const sourceSelect = document.getElementById('dossier-network-source');
    if (!sourceSelect) return;
    const state = loadDossierState();
    const entities = getDossierNetworkAvailableEntities(state);
    const activeId = selectedId || state.network.activeId || entities[0]?.id || '';
    sourceSelect.innerHTML = entities.map(node => {
        const profile = getDossierNetworkNodeProfile(node, state);
        return `<option value="${escapeDossierHtml(node.id)}">${escapeDossierHtml(profile.name)} · ${escapeDossierHtml(getDossierNetworkKindLabel(node.kind))}</option>`;
    }).join('');
    if (entities.some(node => node.id === activeId)) sourceSelect.value = activeId;
}

function renderDossierNetworkRecordOptions(kind, selectedRefId = '') {
    const recordSelect = document.getElementById('dossier-network-record');
    const label = document.getElementById('dossier-network-record-label');
    if (!recordSelect) return;
    const state = loadDossierState();
    const safeKind = normalizeDossierNetworkKind(kind);
    const type = safeKind === 'npc' ? 'npc' : 'char';
    const sourceNode = getDossierNetworkSelectedSourceNode(state);
    const items = (state[type] || []).filter(item => {
        const candidate = createDossierNetworkNode(safeKind, { refId: item.id, name: item.name, setting: item.setting });
        return !isDossierNetworkSameContact(sourceNode, candidate);
    });
    if (label) label.textContent = safeKind === 'npc' ? '关联 NPC' : '关联 Char';
    recordSelect.innerHTML = items.length
        ? items.map(item => `<option value="${escapeDossierHtml(item.id)}">${escapeDossierHtml(getDossierNetworkAccountLabel(item))}</option>`).join('')
        : `<option value="">没有可关联的 ${safeKind === 'npc' ? 'NPC' : 'Char'}</option>`;
    recordSelect.disabled = !items.length;
    if (items.some(item => item.id === selectedRefId)) recordSelect.value = selectedRefId;
    else if (items[0]) recordSelect.value = items[0].id;
}

function getDossierNetworkSelectedSourceNode(state = loadDossierState()) {
    const sourceId = document.getElementById('dossier-network-source')?.value || state.network?.activeId || '';
    return getDossierNetworkAvailableEntities(state).find(node => node.id === sourceId)
        || state.network?.nodes?.find(node => node.id === sourceId)
        || null;
}

function updateDossierNetworkUserKindButtonState() {
    const state = loadDossierState();
    const sourceNode = getDossierNetworkSelectedSourceNode(state);
    const sourceIsUser = isDossierNetworkUserNode(sourceNode);
    if (sourceIsUser && dossierNetworkDraftKind === 'user') {
        const fallbackKind = state.char.length ? 'char' : state.npc.length ? 'npc' : 'text-npc';
        setDossierNetworkKind(fallbackKind);
        return;
    }
    document.querySelectorAll('[data-dossier-network-kind="user"]').forEach(button => {
        button.disabled = sourceIsUser;
        button.setAttribute('aria-disabled', String(sourceIsUser));
        button.setAttribute('title', sourceIsUser ? 'USER 不能关联 USER' : '关联 USER');
    });
}

function getDossierNetworkDraftTarget(state = loadDossierState()) {
    const safeKind = normalizeDossierNetworkKind(dossierNetworkDraftKind);
    if (safeKind === 'char' || safeKind === 'npc') {
        const refId = document.getElementById('dossier-network-record')?.value || '';
        const item = state[safeKind].find(entry => entry.id === refId);
        if (item) return createDossierNetworkNode(safeKind, { refId, name: item.name, setting: item.setting });
        return createDossierNetworkNode(safeKind, {
            id: `${safeKind}:empty`,
            name: `暂无 ${safeKind === 'npc' ? 'NPC' : 'Char'}`,
            setting: '请先在资料库里添加可关联对象。'
        });
    }
    if (safeKind === 'user') {
        const user = getDossierUserPresetForNetwork();
        return createDossierNetworkNode('user', { refId: user.id, name: user.name, setting: user.setting });
    }
    const editingId = document.getElementById('dossier-network-node-id')?.value || dossierNetworkEditingNodeId;
    const existing = state.network?.nodes?.find(node => node.id === editingId) || null;
    const name = String(document.getElementById('dossier-network-text-name')?.value || existing?.name || '').trim();
    const setting = String(document.getElementById('dossier-network-text-setting')?.value || existing?.setting || '').trim();
    return createDossierNetworkNode('text-npc', {
        id: existing?.id || 'text-npc:draft',
        name: name || '文字 NPC',
        setting: setting || '这个对象只会存在于当前关系网。'
    });
}

function updateDossierNetworkModalPreview() {
    const face = document.getElementById('dossier-network-preview-face');
    const kicker = document.getElementById('dossier-network-preview-kicker');
    const title = document.getElementById('dossier-network-preview-title');
    const meta = document.getElementById('dossier-network-preview-meta');
    const note = document.getElementById('dossier-network-preview-note');
    if (!face || !kicker || !title || !meta || !note) return;

    const state = loadDossierState();
    state.network = normalizeDossierNetwork(state.network, { char: state.char, npc: state.npc });
    const entities = getDossierNetworkAvailableEntities(state);
    const sourceNode = getDossierNetworkSelectedSourceNode(state) || entities[0] || null;
    const targetNode = getDossierNetworkDraftTarget(state);
    const sourceProfile = sourceNode
        ? getDossierNetworkNodeProfile(sourceNode, state)
        : { name: '关系主体', meta: 'SOURCE', note: '', avatar: '' };
    const targetProfile = getDossierNetworkNodeProfile(targetNode, state);
    const relation = String(document.getElementById('dossier-network-relation')?.value || '').trim();

    face.innerHTML = createDossierNetworkAvatarMarkup(targetProfile, 'dossier-network-preview-avatar');
    kicker.textContent = `${getDossierNetworkKindLabel(sourceNode?.kind)} / ${getDossierNetworkKindLabel(targetNode.kind)}`;
    title.textContent = `${sourceProfile.name} → ${targetProfile.name}`;
    meta.textContent = targetProfile.meta || targetProfile.note || '关系对象';
    note.textContent = isDossierNetworkSameContact(sourceNode, targetNode)
        ? '同一个联系人不能添加关系。'
        : isDossierNetworkUserPair(sourceNode, targetNode)
            ? 'USER 不能和 USER 建立关系。'
        : relation ? `关系：${relation}` : '关系会按双方 ID 独立保存。';
    updateDossierNetworkUserKindButtonState();
}

function setDossierNetworkKind(kind, selectedRefId = '') {
    const safeKind = normalizeDossierNetworkKind(kind);
    dossierNetworkDraftKind = safeKind;
    document.querySelectorAll('[data-dossier-network-kind]').forEach(button => {
        const active = button.getAttribute('data-dossier-network-kind') === safeKind;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
    });

    const usesRecord = safeKind === 'char' || safeKind === 'npc';
    const usesText = safeKind === 'text-npc';
    const recordField = document.getElementById('dossier-network-record-field');
    const textNameField = document.getElementById('dossier-network-text-name-field');
    const textSettingField = document.getElementById('dossier-network-text-setting-field');
    if (recordField) recordField.hidden = !usesRecord;
    if (textNameField) textNameField.hidden = !usesText;
    if (textSettingField) textSettingField.hidden = !usesText;
    if (usesRecord) renderDossierNetworkRecordOptions(safeKind, selectedRefId);
    updateDossierNetworkModalPreview();
}

function openDossierNetworkModal(nodeId = '', preferredKind = 'char') {
    const modal = document.getElementById('dossier-network-modal');
    if (!modal) return;
    const state = loadDossierState();
    state.network = normalizeDossierNetwork(state.network, { char: state.char, npc: state.npc });
    const network = state.network;
    const activeId = network.activeId || getDossierNetworkPrimaryNode(network)?.id || '';
    let node = network.nodes.find(entry => entry.id === nodeId) || null;
    if (node?.id === activeId) {
        const firstLink = network.links.find(entry => entry.from === activeId || entry.to === activeId);
        const otherId = firstLink ? getDossierNetworkLinkedTarget(firstLink, activeId) : '';
        node = network.nodes.find(entry => entry.id === otherId) || null;
    }
    const link = node
        ? (network.links.find(entry => (entry.from === activeId && entry.to === node.id) || (entry.to === activeId && entry.from === node.id)) || getDossierNetworkNodeLink(network, node.id))
        : null;
    const kind = node ? normalizeDossierNetworkKind(node.kind) : normalizeDossierNetworkKind(preferredKind);

    dossierNetworkEditingNodeId = node?.id || '';
    const idInput = document.getElementById('dossier-network-node-id');
    const linkInput = document.getElementById('dossier-network-link-id');
    const title = document.getElementById('dossier-network-modal-title');
    const kicker = document.getElementById('dossier-network-modal-kicker');
    const deleteButton = document.getElementById('dossier-network-delete');
    const relationInput = document.getElementById('dossier-network-relation');
    const descriptionInput = document.getElementById('dossier-network-description');
    const textNameInput = document.getElementById('dossier-network-text-name');
    const textSettingInput = document.getElementById('dossier-network-text-setting');

    if (idInput) idInput.value = node?.id || '';
    if (linkInput) linkInput.value = link?.id || '';
    if (title) title.textContent = node ? '编辑关系' : '添加关系';
    if (kicker) kicker.textContent = node ? 'EDIT RELATION' : 'NEW RELATION';
    if (deleteButton) deleteButton.hidden = !node || network.nodes.length <= 1;
    if (relationInput) relationInput.value = link?.relation || '';
    if (descriptionInput) descriptionInput.value = link?.description || '';
    if (textNameInput) textNameInput.value = node?.name || '';
    if (textSettingInput) textSettingInput.value = node?.setting || '';

    renderDossierNetworkSourceOptions(link?.from || activeId);
    setDossierNetworkKind(kind, node?.refId || '');
    updateDossierNetworkModalPreview();

    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('active'));
    window.setTimeout(() => {
        const focusTarget = kind === 'text-npc'
            ? document.getElementById('dossier-network-text-name')
            : document.getElementById('dossier-network-record');
        focusTarget?.focus();
    }, 80);
}

function closeDossierNetworkModal() {
    const modal = document.getElementById('dossier-network-modal');
    if (!modal) return;
    modal.classList.remove('active');
    dossierNetworkEditingNodeId = '';
    window.setTimeout(() => {
        if (!modal.classList.contains('active')) modal.hidden = true;
    }, 180);
}

function openDossierNetworkSubjectModal() {
    const modal = document.getElementById('dossier-network-subject-modal');
    const list = document.getElementById('dossier-network-subject-list');
    if (!modal || !list) return;
    const state = loadDossierState();
    state.network = normalizeDossierNetwork(state.network, { char: state.char, npc: state.npc });
    const entities = getDossierNetworkAvailableEntities(state);
    list.innerHTML = entities.map(node => {
        const profile = getDossierNetworkNodeProfile(node, state);
        const active = node.id === state.network.activeId;
        return `
            <button class="dossier-network-subject-option interactive${active ? ' active' : ''}" type="button" data-dossier-network-subject="${escapeDossierHtml(node.id)}">
                ${createDossierNetworkAvatarMarkup(profile)}
                <span>
                    <strong>${escapeDossierHtml(profile.name)}</strong>
                    <small>${escapeDossierHtml(profile.meta)}</small>
                </span>
            </button>
        `;
    }).join('');
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('active'));
}

function closeDossierNetworkSubjectModal() {
    const modal = document.getElementById('dossier-network-subject-modal');
    if (!modal) return;
    modal.classList.remove('active');
    window.setTimeout(() => {
        if (!modal.classList.contains('active')) modal.hidden = true;
    }, 180);
}

function switchDossierNetworkSubject(id) {
    const state = loadDossierState();
    state.network = normalizeDossierNetwork(state.network, { char: state.char, npc: state.npc });
    const node = getDossierNetworkAvailableEntities(state).find(entry => entry.id === id) || state.network.nodes.find(entry => entry.id === id);
    if (!node) return;
    ensureDossierNetworkNode(state.network, node);
    state.network.activeId = node.id;
    saveDossierState();
    renderDossierNetwork();
    closeDossierNetworkSubjectModal();
    showDossierToast('已切换关系网对象。');
}

function getDossierNetworkNodePayload(kind) {
    const safeKind = normalizeDossierNetworkKind(kind);
    const state = loadDossierState();
    if (safeKind === 'char' || safeKind === 'npc') {
        const refId = document.getElementById('dossier-network-record')?.value || '';
        const item = state[safeKind].find(entry => entry.id === refId);
        if (!item) {
            showDossierToast(`请先选择可用的 ${safeKind === 'npc' ? 'NPC' : 'Char'}。`);
            return null;
        }
        return createDossierNetworkNode(safeKind, { refId, name: item.name, setting: item.setting });
    }
    if (safeKind === 'user') {
        const user = getDossierUserPresetForNetwork();
        return createDossierNetworkNode('user', { refId: user.id, name: user.name, setting: user.setting });
    }
    const name = String(document.getElementById('dossier-network-text-name')?.value || '').trim();
    const setting = String(document.getElementById('dossier-network-text-setting')?.value || '').trim();
    if (!name) {
        showDossierToast('请写下文字 NPC 名称。');
        document.getElementById('dossier-network-text-name')?.focus();
        return null;
    }
    return createDossierNetworkNode('text-npc', { name, setting });
}

function upsertDossierNetworkLink(network, sourceId, targetId, relation, description, linkId = '') {
    const oldLink = network.links.find(link => link.id === linkId)
        || network.links.find(link => (link.from === sourceId && link.to === targetId) || (link.from === targetId && link.to === sourceId));
    network.links = network.links.filter(link => link.id !== oldLink?.id);
    if (!targetId || targetId === sourceId || !network.nodes.some(node => node.id === targetId)) return;
    if (!sourceId || sourceId === targetId || !network.nodes.some(node => node.id === sourceId)) return;
    const sourceNode = network.nodes.find(node => node.id === sourceId);
    const targetNode = network.nodes.find(node => node.id === targetId);
    if (isDossierNetworkSameContact(sourceNode, targetNode)) return false;
    if (isDossierNetworkUserPair(sourceNode, targetNode)) return false;
    const from = sourceId;
    const to = targetId;
    network.links = network.links.filter(link => !((link.from === from && link.to === to) || (link.from === to && link.to === from)));
    network.links.push({
        id: oldLink?.id || createDossierNetworkId('link'),
        from,
        to,
        relation: String(relation || '').trim().slice(0, 64),
        description: String(description || '').trim().slice(0, 260)
    });
    return true;
}

function saveDossierNetworkNode(event) {
    event.preventDefault();
    const state = loadDossierState();
    state.network = normalizeDossierNetwork(state.network, { char: state.char, npc: state.npc });
    const network = state.network;
    const editingId = document.getElementById('dossier-network-node-id')?.value || dossierNetworkEditingNodeId;
    const existing = network.nodes.find(node => node.id === editingId) || null;
    const sourceId = document.getElementById('dossier-network-source')?.value || network.activeId || '';
    const payload = getDossierNetworkNodePayload(dossierNetworkDraftKind);
    if (!payload) return;
    const sourceNode = getDossierNetworkAvailableEntities(state).find(node => node.id === sourceId) || network.nodes.find(node => node.id === sourceId);
    if (!sourceNode) {
        showDossierToast('请先选择关系主体。');
        document.getElementById('dossier-network-source')?.focus();
        return;
    }

    const nextNode = {
        ...payload,
        id: existing?.id || payload.id || createDossierNetworkId('node'),
        slot: existing?.slot || ''
    };
    if (nextNode.id === sourceNode.id) {
        showDossierToast('关系主体和关联对象不能相同。');
        return;
    }
    if (isDossierNetworkSameContact(sourceNode, nextNode)) {
        showDossierToast('同一个联系人不能添加关系。');
        document.getElementById('dossier-network-record')?.focus();
        return;
    }
    if (isDossierNetworkUserPair(sourceNode, nextNode)) {
        showDossierToast('USER 不能和 USER 建立关系。');
        document.querySelector('[data-dossier-network-kind="user"]')?.focus();
        return;
    }

    const relation = String(document.getElementById('dossier-network-relation')?.value || '').trim();
    const description = String(document.getElementById('dossier-network-description')?.value || '').trim();
    if (!relation) {
        showDossierToast('请填写关系。');
        document.getElementById('dossier-network-relation')?.focus();
        return;
    }
    if (!description) {
        showDossierToast('请填写关系描述。');
        document.getElementById('dossier-network-description')?.focus();
        return;
    }

    ensureDossierNetworkNode(network, sourceNode);
    const existed = Boolean(network.nodes.find(node => node.id === nextNode.id));
    ensureDossierNetworkNode(network, nextNode);
    const linked = upsertDossierNetworkLink(
        network,
        sourceNode.id,
        nextNode.id,
        relation,
        description,
        document.getElementById('dossier-network-link-id')?.value || ''
    );
    if (!linked) {
        showDossierToast('同一个联系人不能添加关系。');
        return;
    }
    network.activeId = sourceNode.id;
    saveDossierState();
    renderDossierNetwork();
    closeDossierNetworkModal();
    showDossierToast(existed ? '关系已更新。' : '关系已添加。');
}

function deleteDossierNetworkNode() {
    const state = loadDossierState();
    const id = document.getElementById('dossier-network-node-id')?.value || dossierNetworkEditingNodeId;
    const node = state.network.nodes.find(entry => entry.id === id);
    if (!node || state.network.nodes.length <= 1) return;
    const profile = getDossierNetworkNodeProfile(node, state);
    if (!window.confirm(`删除关系节点「${profile.name}」？`)) return;

    state.network.nodes = state.network.nodes.filter(entry => entry.id !== id);
    state.network.links = state.network.links.filter(link => link.from !== id && link.to !== id);
    if (state.network.activeId === id) state.network.activeId = state.network.nodes[0]?.id || '';
    state.network.nodes.forEach(entry => { entry.slot = entry.id === state.network.activeId ? 'primary' : ''; });
    saveDossierState();
    renderDossierNetwork();
    closeDossierNetworkModal();
    showDossierToast('关系节点已删除。');
}

function getDossierNetworkTouchMetrics(touches, viewport) {
    if (!touches || touches.length < 2 || !viewport) return null;
    const first = touches[0];
    const second = touches[1];
    const rect = viewport.getBoundingClientRect();
    const firstX = first.clientX - rect.left;
    const firstY = first.clientY - rect.top;
    const secondX = second.clientX - rect.left;
    const secondY = second.clientY - rect.top;
    const deltaX = secondX - firstX;
    const deltaY = secondY - firstY;
    const distance = Math.hypot(deltaX, deltaY);
    if (!Number.isFinite(distance) || distance <= 0) return null;
    return {
        distance,
        centerX: (firstX + secondX) / 2,
        centerY: (firstY + secondY) / 2
    };
}

function setDossierNetworkScale(scale, options = {}) {
    const state = loadDossierState();
    state.network.scale = clampDossierNumber(scale, DOSSIER_NETWORK_SCALE_MIN, DOSSIER_NETWORK_SCALE_MAX, 1);
    if (options.persist !== false) saveDossierState();
    applyDossierNetworkScale(state.network.scale);
    return state.network.scale;
}

function beginDossierNetworkTouchGesture(event) {
    if (!event.touches || event.touches.length < 2) return;
    const viewport = event.currentTarget;
    const metrics = getDossierNetworkTouchMetrics(event.touches, viewport);
    if (!metrics) return;
    const state = loadDossierState();
    dossierNetworkPinchState = {
        startDistance: metrics.distance,
        startScale: state.network.scale,
        contentX: viewport.scrollLeft + metrics.centerX,
        contentY: viewport.scrollTop + metrics.centerY
    };
    viewport.classList.add('is-pinching');
    event.preventDefault();
    event.stopPropagation();
}

function moveDossierNetworkTouchGesture(event) {
    if (!dossierNetworkPinchState || !event.touches || event.touches.length < 2) return;
    const viewport = event.currentTarget;
    const metrics = getDossierNetworkTouchMetrics(event.touches, viewport);
    if (!metrics) return;
    const nextScale = dossierNetworkPinchState.startScale * (metrics.distance / dossierNetworkPinchState.startDistance);
    const appliedScale = setDossierNetworkScale(nextScale, { persist: false });
    const ratio = appliedScale / dossierNetworkPinchState.startScale;
    viewport.scrollLeft = dossierNetworkPinchState.contentX * ratio - metrics.centerX;
    viewport.scrollTop = dossierNetworkPinchState.contentY * ratio - metrics.centerY;
    event.preventDefault();
    event.stopPropagation();
}

function endDossierNetworkTouchGesture(event) {
    if (!dossierNetworkPinchState) return;
    if (event.touches && event.touches.length >= 2) return;
    dossierNetworkPinchState = null;
    document.getElementById('dossier-network-viewport')?.classList.remove('is-pinching');
    saveDossierState();
    event.stopPropagation();
}

function beginDossierNetworkPointerDrag(event) {
    if (event.pointerType === 'touch' || event.button !== 0) return;
    const viewport = event.currentTarget;
    const networkNode = event.target.closest?.('.dossier-network-node');
    const interactive = event.target.closest?.('button, input, textarea, select, a, [role="button"]');
    if (interactive && !networkNode) return;
    dossierNetworkDragState = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        scrollLeft: viewport.scrollLeft,
        scrollTop: viewport.scrollTop,
        moved: false
    };
    viewport.classList.add('is-dragging');
    viewport.setPointerCapture?.(event.pointerId);
    event.preventDefault();
    event.stopPropagation();
}

function moveDossierNetworkPointerDrag(event) {
    if (!dossierNetworkDragState || event.pointerId !== dossierNetworkDragState.pointerId) return;
    const viewport = event.currentTarget;
    const deltaX = event.clientX - dossierNetworkDragState.startX;
    const deltaY = event.clientY - dossierNetworkDragState.startY;
    if (Math.hypot(deltaX, deltaY) > 4) dossierNetworkDragState.moved = true;
    viewport.scrollLeft = dossierNetworkDragState.scrollLeft - deltaX;
    viewport.scrollTop = dossierNetworkDragState.scrollTop - deltaY;
    event.preventDefault();
    event.stopPropagation();
}

function endDossierNetworkPointerDrag(event) {
    if (!dossierNetworkDragState || event.pointerId !== dossierNetworkDragState.pointerId) return;
    const viewport = event.currentTarget;
    const moved = dossierNetworkDragState.moved;
    if (viewport.hasPointerCapture?.(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    viewport.classList.remove('is-dragging');
    dossierNetworkDragState = null;
    if (moved) {
        dossierNetworkSuppressClick = true;
        setTimeout(() => { dossierNetworkSuppressClick = false; }, 0);
    }
    event.preventDefault();
    event.stopPropagation();
}

function suppressDossierNetworkDragClick(event) {
    if (!dossierNetworkSuppressClick) return;
    dossierNetworkSuppressClick = false;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
}

function zoomDossierNetworkWithWheel(event) {
    if (!event.ctrlKey && !event.metaKey && !event.altKey) return;
    const viewport = event.currentTarget;
    const rect = viewport.getBoundingClientRect();
    const state = loadDossierState();
    const previousScale = state.network.scale || 1;
    const pointX = event.clientX - rect.left;
    const pointY = event.clientY - rect.top;
    const contentX = viewport.scrollLeft + pointX;
    const contentY = viewport.scrollTop + pointY;
    const nextScale = previousScale * (event.deltaY < 0 ? 1.08 : 0.92);
    const appliedScale = setDossierNetworkScale(nextScale, { persist: false });
    const ratio = appliedScale / previousScale;
    viewport.scrollLeft = contentX * ratio - pointX;
    viewport.scrollTop = contentY * ratio - pointY;
    saveDossierState();
    event.preventDefault();
    event.stopPropagation();
}

function bindDossierNetworkViewportGestures() {
    const viewport = document.getElementById('dossier-network-viewport');
    if (!viewport || viewport.dataset.dossierNetworkGesturesBound === 'true') return;
    viewport.dataset.dossierNetworkGesturesBound = 'true';
    viewport.addEventListener('touchstart', beginDossierNetworkTouchGesture, { passive: false });
    viewport.addEventListener('touchmove', moveDossierNetworkTouchGesture, { passive: false });
    viewport.addEventListener('touchend', endDossierNetworkTouchGesture, { passive: false });
    viewport.addEventListener('touchcancel', endDossierNetworkTouchGesture, { passive: false });
    viewport.addEventListener('pointerdown', beginDossierNetworkPointerDrag, { passive: false });
    viewport.addEventListener('pointermove', moveDossierNetworkPointerDrag, { passive: false });
    viewport.addEventListener('pointerup', endDossierNetworkPointerDrag, { passive: false });
    viewport.addEventListener('pointercancel', endDossierNetworkPointerDrag, { passive: false });
    viewport.addEventListener('lostpointercapture', endDossierNetworkPointerDrag, { passive: false });
    viewport.addEventListener('click', suppressDossierNetworkDragClick, true);
    viewport.addEventListener('wheel', zoomDossierNetworkWithWheel, { passive: false });
}

function renderDossier() {
    loadDossierState();
    renderDossierList('char');
    renderDossierDetail('char');
    renderDossierList('npc');
    renderDossierDetail('npc');
    renderDossierNetwork();
}

function switchDossierTab(tab, scrollToTop = true) {
    const next = ['char', 'npc', 'network'].includes(tab) ? tab : 'char';
    dossierActiveTab = next;

    document.querySelectorAll('[data-dossier-tab]').forEach(button => {
        const active = button.getAttribute('data-dossier-tab') === next;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
    });

    document.querySelectorAll('[data-dossier-view]').forEach(view => {
        const active = view.getAttribute('data-dossier-view') === next;
        view.hidden = !active;
        view.classList.toggle('active', active);
    });

    const issue = document.getElementById('dossier-issue');
    if (issue) {
        issue.textContent = {
            char: 'CHAR / 私叙角色档案',
            npc: 'NPC / 支线与系统人物',
            network: 'RELATION / 关系网'
        }[next];
    }

    const addButton = document.getElementById('dossier-add-current');
    if (addButton) {
        addButton.hidden = false;
        if (next === 'network') {
            addButton.setAttribute('aria-label', '切换关系网对象');
            addButton.setAttribute('title', '切换关系网对象');
            addButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="8" r="3.5"/><path d="M2.5 20a5.5 5.5 0 0 1 11 0"/><path d="M17 5h4v4"/><path d="M21 5l-6 6"/><path d="M17 19h4v-4"/><path d="M21 19l-6-6"/></svg>';
        } else {
            addButton.setAttribute('aria-label', '新增资料');
            addButton.setAttribute('title', '新增资料');
            addButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
        }
    }

    renderDossier();

    if (scrollToTop) {
        document.querySelector('#dossier-app .dossier-stage')?.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function showDossierToast(text, duration = 1800) {
    const toast = document.getElementById('dossier-toast');
    if (!toast || !text) return;
    if (toast.parentElement !== document.body) document.body.appendChild(toast);
    toast.textContent = text;
    toast.hidden = false;
    window.clearTimeout(dossierToastTimer);
    requestAnimationFrame(() => toast.classList.add('active'));
    dossierToastTimer = window.setTimeout(() => {
        toast.classList.remove('active');
        window.setTimeout(() => {
            if (!toast.classList.contains('active')) toast.hidden = true;
        }, 220);
    }, duration);
}

function hideDossierToast(instant = false) {
    const toast = document.getElementById('dossier-toast');
    if (!toast) return;
    window.clearTimeout(dossierToastTimer);
    toast.classList.remove('active');
    if (instant) {
        toast.hidden = true;
        return;
    }
    window.setTimeout(() => {
        if (!toast.classList.contains('active')) toast.hidden = true;
    }, 220);
}

function setDossierEditorMessage(message = '') {
    if (!message) {
        hideDossierToast(true);
        return;
    }
    showDossierToast(message, 2800);
}

function getDossierEditorAccountValue() {
    return fitDossierNumericId(document.getElementById('dossier-editor-public-id')?.value || '');
}

async function writeDossierClipboard(text) {
    const value = String(text || '');
    if (!value) return false;
    try {
        await navigator.clipboard?.writeText(value);
        return true;
    } catch (error) {
        try {
            const textarea = document.createElement('textarea');
            textarea.value = value;
            textarea.setAttribute('readonly', '');
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            textarea.select();
            const copied = document.execCommand('copy');
            textarea.remove();
            return copied;
        } catch (fallbackError) {
            console.warn('Dossier account copy failed:', fallbackError);
            return false;
        }
    }
}

async function copyDossierEditorAccount() {
    const account = getDossierEditorAccountValue();
    const copyButton = document.getElementById('dossier-editor-avatar-clear');
    if (!account) {
        setDossierEditorMessage('请先生成并保存账号 ID。');
        return;
    }
    const copied = await writeDossierClipboard(account);
    if (!copied) {
        setDossierEditorMessage('复制失败，请手动选中账号。');
        return;
    }
    if (copyButton) {
        copyButton.textContent = '已复制';
        window.setTimeout(() => {
            copyButton.textContent = '复制';
        }, 900);
    }
    setDossierEditorMessage(`已复制账号 ${account}`);
}

function renderDossierEditorAvatar(value = '', name = '') {
    const preview = document.getElementById('dossier-editor-avatar-preview');
    const picker = document.getElementById('dossier-editor-avatar-button');
    const label = document.getElementById('dossier-editor-avatar-label');
    const copyButton = document.getElementById('dossier-editor-avatar-clear');
    const nicknameLine = picker?.querySelector('.dossier-avatar-copy span');
    const avatar = normalizeDossierAvatar(value);
    if (!preview) return;
    if (avatar) {
        preview.innerHTML = `<img src="${escapeDossierHtml(avatar)}" alt="">`;
    } else {
        preview.textContent = getDossierInitial(name || document.getElementById('dossier-editor-name')?.value || 'P');
    }
    picker?.classList.toggle('has-image', Boolean(avatar));
    const account = getDossierEditorAccountValue();
    if (copyButton) {
        copyButton.hidden = !account;
        copyButton.textContent = '复制';
        copyButton.setAttribute('aria-label', account ? `复制账号 ${account}` : '复制账号');
        copyButton.title = account ? `复制账号 ${account}` : '复制账号';
    }
    if (nicknameLine) nicknameLine.textContent = document.getElementById('dossier-editor-nickname')?.value.trim() || '昵称';
    if (label) label.textContent = document.getElementById('dossier-editor-public-id')?.value.trim() || 'ID';
}

function readDossierAvatarFile(file) {
    return new Promise((resolve, reject) => {
        if (!file || !String(file.type || '').startsWith('image/')) {
            reject(new Error('Invalid image'));
            return;
        }

        const reader = new FileReader();
        reader.onerror = () => reject(reader.error || new Error('Image read failed'));
        reader.onload = () => resolve(String(reader.result || ''));
        reader.readAsDataURL(file);
    });
}

async function handleDossierAvatarUpload(file) {
    if (!file) return;
    try {
        const avatar = await readDossierAvatarFile(file);
        const input = document.getElementById('dossier-editor-avatar');
        if (input) input.value = avatar;
        renderDossierEditorAvatar(avatar);
        setDossierEditorMessage('');
    } catch (error) {
        console.warn('Dossier avatar upload failed:', error);
        setDossierEditorMessage('头像读取失败，请换一张图片。');
    }
}

function buildDossierChatEndpoint(rawEndpoint) {
    const raw = String(rawEndpoint || '').trim();
    if (!/^https?:\/\//i.test(raw)) {
        throw new Error('请先在设置的 API 聊天里填写 http/https 接口网址。');
    }
    const url = new URL(raw);
    url.search = '';
    url.hash = '';
    if (/\/chat\/completions\/?$/i.test(url.pathname)) return url.toString();
    if (/\/models\/?$/i.test(url.pathname)) {
        url.pathname = url.pathname.replace(/\/models\/?$/i, '/chat/completions');
        return url.toString();
    }
    url.pathname = url.pathname.replace(/\/+$/, '') + '/chat/completions';
    return url.toString();
}

function extractDossierGeneratedText(payload) {
    const choice = Array.isArray(payload?.choices) ? payload.choices[0] : null;
    return String(
        choice?.message?.content
        || choice?.text
        || payload?.output_text
        || payload?.content
        || ''
    ).trim();
}

function parseDossierGeneratedProfile(text) {
    const raw = String(text || '').trim();
    if (!raw) return {};
    const unfenced = raw
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
    const jsonStart = unfenced.indexOf('{');
    const jsonEnd = unfenced.lastIndexOf('}');
    const jsonText = jsonStart >= 0 && jsonEnd > jsonStart
        ? unfenced.slice(jsonStart, jsonEnd + 1)
        : unfenced;

    try {
        const data = JSON.parse(jsonText);
        if (!data || typeof data !== 'object') return { setting: raw };
        return {
            nickname: String(data.nickname || data.nickName || data['昵称'] || '').trim(),
            publicId: String(data.publicId || data.id || data.ID || data['ID'] || '').trim(),
            setting: String(data.setting || data.profile || data.content || data['设定内容'] || data['设定'] || '').trim(),
            monologue: String(data.monologue || data.essay || data.solo || data['独白'] || data['随笔'] || data['独白随笔'] || '').trim(),
            socialFollowers: data.socialFollowers ?? data.followers ?? data.followerCount ?? '',
            socialFollowing: data.socialFollowing ?? data.following ?? data.followingCount ?? '',
            socialOthers: data.socialOthers ?? data.others ?? data.otherFollowers ?? '',
            followedBy: data.followedBy || data.followed_by || data.followersBy || []
        };
    } catch (error) {
        return { setting: raw };
    }
}

async function loadDossierApiSettings() {
    if (typeof apiState !== 'undefined' && apiState?.chat) return apiState.chat;
    try {
        if (typeof db === 'undefined' || !db?.edits?.get) return {};
        const saved = await db?.edits?.get?.('api_parameter_config');
        const content = typeof saved?.content === 'string' ? JSON.parse(saved.content) : saved?.content;
        return content?.chat || {};
    } catch (error) {
        console.warn('Dossier API settings load failed:', error);
        return {};
    }
}

async function generateDossierIdentityWithApi(profile, type) {
    const chat = await loadDossierApiSettings();
    const endpoint = String(chat?.endpoint || '').trim();
    const model = String(chat?.model || '').trim();
    if (!endpoint || !model) {
        throw new Error('请先到「设置 - 接口与参数 - API 聊天」填写接口网址和模型。');
    }

    const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json'
    };
    if (chat.apiKey) headers.Authorization = `Bearer ${chat.apiKey}`;

    const label = type === 'npc' ? 'NPC' : 'Char';
    const draft = profile.setting || '用户还没有写设定内容。';
    const prompt = [
        `类型：${label}`,
        `姓名：${profile.name}`,
        `昵称参考：${profile.nickname || '请生成'}`,
        `ID参考：${profile.publicId || '请生成纯数字唯一 ID'}`,
        `旧独白参考：${profile.monologue || '请生成新的独白随笔'}`,
        `性别：${profile.gender || '未填写'}`,
        `国籍：${profile.nationality || '未填写'}`,
        `用户填写的设定内容：${draft}`,
        '请生成 nickname、publicId、monologue、socialFollowers、socialFollowing、followedBy、socialOthers。',
        'publicId 必须是 8 到 10 位纯数字，不要 @、字母、下划线或符号；它会作为后期聊天隔离 ID 使用，不能随意写成昵称。',
        'socialFollowers 和 socialFollowing 是数字，分别对应资料卡 Followers / Following；followedBy 是 2 个英文身份名组成的数组，例如 ["Artists","Musicians"]，必须贴合设定；socialOthers 是 1 到 999 的数字。',
        'monologue 是第一人称中文独白随笔，约 180 到 230 字，分成 3 段，用换行分段。',
        '独白必须自然融入设定内容里的 2 到 4 个具体信息，例如性格、身份、关系习惯、欲望、矛盾、场景或秘密；不要把设定原文整段搬进去，要把它转成角色自己的感受、动作和自我辩解。',
        '文风要温柔、细腻、克制，有画面和情绪余温，贴合 CHAR/NPC 类型差异。不要改写设定内容。'
    ].join('\n');

    const response = await fetch(buildDossierChatEndpoint(endpoint), {
        method: 'POST',
        headers,
        body: JSON.stringify({
            model,
            temperature: typeof chat.temperature === 'number' ? chat.temperature : 0.7,
            messages: [
                {
                    role: 'system',
                    content: '你是温柔、克制、审美精细的角色档案撰写顾问。根据用户自己填写的资料生成昵称、纯数字唯一 ID、第一人称独白随笔和英文社交信息，不要生成或改写设定内容。只输出严格 JSON，不要 Markdown。JSON 格式：{"nickname":"...","publicId":"1234567890","socialFollowers":1686,"socialFollowing":185,"followedBy":["Artists","Musicians"],"socialOthers":34,"monologue":"第一段\\n\\n第二段\\n\\n第三段"}。ID 必须是纯数字；followedBy 必须是英文身份名；独白约 200 字，必须自然嵌入设定细节，文笔温柔细腻，有角色专属的情绪、动作和画面。'
                },
                { role: 'user', content: prompt }
            ]
        })
    });

    if (!response.ok) throw new Error(`API 生成失败：${response.status}`);
    const payload = await response.json();
    const generated = extractDossierGeneratedText(payload);
    const generatedProfile = parseDossierGeneratedProfile(generated);
    if (!generatedProfile.nickname && !generatedProfile.publicId && !generatedProfile.monologue) {
        throw new Error('API 没有返回可用昵称、ID 或独白。');
    }
    return {
        nickname: generatedProfile.nickname.slice(0, 28),
        publicId: generatedProfile.publicId.slice(0, 32),
        monologue: formatDossierMonologue(generatedProfile.monologue).slice(0, 520),
        socialFollowers: generatedProfile.socialFollowers,
        socialFollowing: generatedProfile.socialFollowing,
        socialOthers: generatedProfile.socialOthers,
        followedBy: generatedProfile.followedBy
    };
}

function parseDossierGeneratedProfile(text, expectedId = '') {
    const raw = String(text || '').trim();
    if (!raw) {
        throw new Error('API did not return a dossier JSON object.');
    }
    let data;
    try {
        data = JSON.parse(raw);
    } catch (error) {
        throw new Error('Dossier response must be a single JSON object.');
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('Dossier response must be a JSON object.');
    }
    const type = String(data.type || '').trim();
    const id = String(data.id || '').trim();
    if (type !== DOSSIER_GENERATED_PROFILE_TYPE) {
        throw new Error('Dossier JSON type is invalid.');
    }
    if (!id || (expectedId && id !== expectedId)) {
        throw new Error('Dossier JSON id does not match the current record.');
    }

    const nickname = String(data.nickname || '').trim().slice(0, 28);
    const publicId = String(data.publicId || '').trim();
    const monologue = formatDossierMonologue(String(data.monologue || '')).slice(0, 520);
    const socialFollowers = Number(data.socialFollowers);
    const socialFollowing = Number(data.socialFollowing);
    const socialOthers = Number(data.socialOthers);
    const followedBy = Array.isArray(data.followedBy)
        ? data.followedBy
            .map(item => String(item || '').replace(/[^A-Za-z0-9 '&-]/g, '').replace(/\s+/g, ' ').trim())
            .filter(Boolean)
            .slice(0, 2)
        : [];

    if (!nickname || !/^\d{8,10}$/.test(publicId) || !monologue) {
        throw new Error('Dossier JSON fields are incomplete.');
    }
    if (!Number.isFinite(socialFollowers) || !Number.isFinite(socialFollowing) || !Number.isFinite(socialOthers)) {
        throw new Error('Dossier social fields must be numbers.');
    }
    if (followedBy.length !== 2) {
        throw new Error('Dossier followedBy must contain exactly 2 items.');
    }

    return {
        type,
        id,
        nickname,
        publicId,
        monologue,
        socialFollowers: Math.round(socialFollowers),
        socialFollowing: Math.round(socialFollowing),
        socialOthers: Math.round(socialOthers),
        followedBy
    };
}

async function generateDossierIdentityWithApi(profile, type) {
    const chat = await loadDossierApiSettings();
    const endpoint = String(chat?.endpoint || '').trim();
    const model = String(chat?.model || '').trim();
    if (!endpoint || !model) {
        throw new Error('请先到设置的 API 聊天中填写接口地址和模型。');
    }

    const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json'
    };
    if (chat.apiKey) headers.Authorization = `Bearer ${chat.apiKey}`;

    const label = type === 'npc' ? 'NPC' : 'CHAR';
    const draft = profile.setting || '';
    const prompt = [
        `targetType: ${DOSSIER_GENERATED_PROFILE_TYPE}`,
        `targetId: ${profile.id}`,
        `characterType: ${label}`,
        `name: ${profile.name}`,
        `nicknameHint: ${profile.nickname || ''}`,
        `publicIdHint: ${profile.publicId || ''}`,
        `monologueHint: ${profile.monologue || ''}`,
        `gender: ${profile.gender || ''}`,
        `nationality: ${profile.nationality || ''}`,
        `setting: ${draft}`,
        'Return exactly one JSON object. No markdown. No code fence. No explanation.',
        `JSON schema: {"type":"${DOSSIER_GENERATED_PROFILE_TYPE}","id":"${profile.id}","nickname":"...","publicId":"12345678","socialFollowers":1686,"socialFollowing":185,"followedBy":["Artists","Musicians"],"socialOthers":34,"monologue":"第一段\\n\\n第二段\\n\\n第三段"}`,
        'The value of "type" must be exact.',
        'The value of "id" must echo targetId exactly.',
        'publicId must be 8-10 digits only.',
        'followedBy must be an English array with exactly 2 role labels.',
        'monologue must be Chinese first-person writing in 3 paragraphs.'
    ].join('\n');

    const response = await fetch(buildDossierChatEndpoint(endpoint), {
        method: 'POST',
        headers,
        body: JSON.stringify({
            model,
            temperature: typeof chat.temperature === 'number' ? chat.temperature : 0.7,
            messages: [
                {
                    role: 'system',
                    content: 'Generate one strict JSON object for a dossier identity. The object must include exact type and id values from the user prompt. Do not output markdown, code fences, prose, aliases, or extra wrapper objects.'
                },
                { role: 'user', content: prompt }
            ]
        })
    });

    if (!response.ok) throw new Error(`API 生成失败：${response.status}`);
    const payload = await response.json();
    const generated = extractDossierGeneratedText(payload);
    const generatedProfile = parseDossierGeneratedProfile(generated, profile.id);
    return {
        nickname: generatedProfile.nickname,
        publicId: generatedProfile.publicId,
        monologue: generatedProfile.monologue,
        socialFollowers: generatedProfile.socialFollowers,
        socialFollowing: generatedProfile.socialFollowing,
        socialOthers: generatedProfile.socialOthers,
        followedBy: generatedProfile.followedBy
    };
}

function parseDossierGeneratedProfile(text) {
    const raw = String(text || '').trim();
    if (!raw) {
        throw new Error('API did not return a dossier JSON object.');
    }
    let data;
    try {
        data = JSON.parse(raw);
    } catch (error) {
        throw new Error('Dossier response must be a single JSON object.');
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('Dossier response must be a JSON object.');
    }

    const nickname = String(data.nickname || '').trim().slice(0, 28);
    const publicId = String(data.publicId || '').trim();
    const monologue = formatDossierMonologue(String(data.monologue || '')).slice(0, 520);
    const socialFollowers = Number(data.socialFollowers);
    const socialFollowing = Number(data.socialFollowing);
    const socialOthers = Number(data.socialOthers);
    const followedBy = Array.isArray(data.followedBy)
        ? data.followedBy
            .map(item => String(item || '').replace(/[^A-Za-z0-9 '&-]/g, '').replace(/\s+/g, ' ').trim())
            .filter(Boolean)
            .slice(0, 2)
        : [];

    if (!nickname || !/^\d{8,10}$/.test(publicId) || !monologue) {
        throw new Error('Dossier JSON fields are incomplete.');
    }
    if (!Number.isFinite(socialFollowers) || !Number.isFinite(socialFollowing) || !Number.isFinite(socialOthers)) {
        throw new Error('Dossier social fields must be numbers.');
    }
    if (followedBy.length !== 2) {
        throw new Error('Dossier followedBy must contain exactly 2 items.');
    }

    return {
        nickname,
        publicId,
        monologue,
        socialFollowers: Math.round(socialFollowers),
        socialFollowing: Math.round(socialFollowing),
        socialOthers: Math.round(socialOthers),
        followedBy
    };
}

async function generateDossierIdentityWithApi(profile, type) {
    const chat = await loadDossierApiSettings();
    const endpoint = String(chat?.endpoint || '').trim();
    const model = String(chat?.model || '').trim();
    if (!endpoint || !model) {
        throw new Error('请先到设置的 API 聊天中填写接口地址和模型。');
    }

    const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json'
    };
    if (chat.apiKey) headers.Authorization = `Bearer ${chat.apiKey}`;

    const label = type === 'npc' ? 'NPC' : 'CHAR';
    const draft = profile.setting || '';
    const prompt = [
        `characterType: ${label}`,
        `name: ${profile.name}`,
        `nicknameHint: ${profile.nickname || ''}`,
        `publicIdHint: ${profile.publicId || ''}`,
        `monologueHint: ${profile.monologue || ''}`,
        `gender: ${profile.gender || ''}`,
        `nationality: ${profile.nationality || ''}`,
        `setting: ${draft}`,
        'Return exactly one JSON object. No markdown. No code fence. No explanation.',
        'JSON schema: {"nickname":"...","publicId":"12345678","socialFollowers":1686,"socialFollowing":185,"followedBy":["Artists","Musicians"],"socialOthers":34,"monologue":"第一段\\n\\n第二段\\n\\n第三段"}',
        'Use these exact field names: nickname, publicId, socialFollowers, socialFollowing, followedBy, socialOthers, monologue.',
        'publicId must be 8-10 digits only.',
        'followedBy must be an English array with exactly 2 role labels.',
        'monologue must be Chinese first-person writing in 3 paragraphs.'
    ].join('\n');

    const response = await fetch(buildDossierChatEndpoint(endpoint), {
        method: 'POST',
        headers,
        body: JSON.stringify({
            model,
            temperature: typeof chat.temperature === 'number' ? chat.temperature : 0.7,
            messages: [
                {
                    role: 'system',
                    content: 'Generate one strict JSON object for a dossier identity. Do not output markdown, code fences, prose, aliases, or wrapper fields.'
                },
                { role: 'user', content: prompt }
            ]
        })
    });

    if (!response.ok) throw new Error(`API 生成失败：${response.status}`);
    const payload = await response.json();
    const generated = extractDossierGeneratedText(payload);
    return parseDossierGeneratedProfile(generated);
}

function openDossierEditor(type, id = '') {
    const safeType = type === 'npc' ? 'npc' : 'char';
    const modal = document.getElementById('dossier-editor-modal');
    if (!modal) return;

    const item = getDossierItems(safeType).find(entry => entry.id === id) || null;
    const label = safeType === 'npc' ? 'NPC' : 'Char';

    document.getElementById('dossier-editor-type').value = safeType;
    document.getElementById('dossier-editor-id').value = item?.id || '';
    document.getElementById('dossier-editor-avatar').value = item?.avatar || '';
    document.getElementById('dossier-editor-name').value = item?.name || '';
    document.getElementById('dossier-editor-nickname').value = item?.nickname || '';
    document.getElementById('dossier-editor-public-id').value = item?.publicId || '';
    document.getElementById('dossier-editor-monologue').value = item?.monologue || '';
    document.getElementById('dossier-editor-gender').value = item?.gender || '';
    document.getElementById('dossier-editor-nationality').value = item?.nationality || '';
    document.getElementById('dossier-editor-setting').value = item?.setting || '';
    renderDossierEditorAvatar(item?.avatar || '', item?.name || '');

    const kicker = document.getElementById('dossier-editor-kicker');
    const title = document.getElementById('dossier-editor-title');
    const subline = document.getElementById('dossier-editor-subline');
    const deleteButton = document.getElementById('dossier-delete-entry');
    if (kicker) kicker.textContent = label.toUpperCase();
    const titleLabel = safeType === 'npc' ? 'NPC' : 'CHAR';
    if (title) title.textContent = item ? `编辑${titleLabel}` : `新增${titleLabel}`;
    if (subline) subline.textContent = item ? `EDIT ${titleLabel}` : `NEW ${titleLabel}`;
    if (deleteButton) deleteButton.hidden = !item;
    setDossierEditorMessage('');

    modal.hidden = false;
    const editor = document.getElementById('dossier-editor-form');
    if (editor) editor.scrollTop = 0;
    requestAnimationFrame(() => {
        if (editor) editor.scrollTop = 0;
        modal.classList.add('active');
    });
    window.setTimeout(() => document.getElementById('dossier-editor-name')?.focus(), 80);
}

function closeDossierEditor() {
    const modal = document.getElementById('dossier-editor-modal');
    if (!modal) return;
    modal.classList.remove('active');
    window.setTimeout(() => {
        if (!modal.classList.contains('active')) modal.hidden = true;
    }, 180);
}

async function saveDossierEditor(event) {
    event.preventDefault();
    if (dossierGenerating) return;
    const state = loadDossierState();
    const type = document.getElementById('dossier-editor-type')?.value === 'npc' ? 'npc' : 'char';
    const idInput = document.getElementById('dossier-editor-id');
    const nameInput = document.getElementById('dossier-editor-name');
    const submitButton = document.getElementById('dossier-editor-submit');
    const name = String(nameInput?.value || '').trim();
    const genderInput = document.getElementById('dossier-editor-gender');
    const nationalityInput = document.getElementById('dossier-editor-nationality');
    const settingInput = document.getElementById('dossier-editor-setting');
    const requiredFields = [
        { input: nameInput, label: '姓名', value: name },
        { input: genderInput, label: '性别', value: genderInput?.value },
        { input: nationalityInput, label: '国籍', value: nationalityInput?.value },
        { input: settingInput, label: '设定内容', value: settingInput?.value }
    ];
    const missing = requiredFields.filter(field => !String(field.value || '').trim());

    if (missing.length) {
        setDossierEditorMessage(`系统提示：请先补全${missing.map(field => field.label).join('、')}。`);
        missing[0].input?.focus();
        return;
    }

    const id = idInput?.value || createDossierId(type, state);
    const existingIndex = state[type].findIndex(item => item.id === id);
    const existingItem = existingIndex >= 0 ? state[type][existingIndex] : null;
    const profile = {
        ...existingItem,
        id,
        avatar: document.getElementById('dossier-editor-avatar')?.value || '',
        name,
        nickname: document.getElementById('dossier-editor-nickname')?.value || '',
        publicId: document.getElementById('dossier-editor-public-id')?.value || '',
        monologue: document.getElementById('dossier-editor-monologue')?.value || '',
        gender: genderInput?.value || '',
        nationality: nationalityInput?.value || '',
        setting: settingInput?.value || ''
    };
    const isAvatarOnlyUpdate = existingItem
        && normalizeDossierAvatar(profile.avatar) !== normalizeDossierAvatar(existingItem.avatar)
        && String(profile.name || '').trim() === String(existingItem.name || '').trim()
        && String(profile.nickname || '').trim() === String(existingItem.nickname || '').trim()
        && fitDossierNumericId(profile.publicId) === fitDossierNumericId(existingItem.publicId)
        && String(profile.monologue || '').trim() === String(existingItem.monologue || '').trim()
        && String(profile.gender || '').trim() === String(existingItem.gender || '').trim()
        && String(profile.nationality || '').trim() === String(existingItem.nationality || '').trim()
        && String(profile.setting || '').trim() === String(existingItem.setting || '').trim();

    if (isAvatarOnlyUpdate) {
        state[type][existingIndex] = {
            ...existingItem,
            avatar: normalizeDossierAvatar(profile.avatar)
        };
        state[getDossierActiveKey(type)] = id;
        saveDossierState();
        closeDossierEditor();
        switchDossierTab(type, false);
        renderDossierNetwork();
        if (typeof renderPrivateContacts === 'function') renderPrivateContacts();
        showDossierToast('头像已更新。');
        return;
    }

    dossierGenerating = true;
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = '生成中...';
    }
    setDossierEditorMessage('正在调用 API 生成昵称、ID 和独白...');

    try {
        const generatedProfile = await generateDossierIdentityWithApi(profile, type);
        if (generatedProfile.nickname) profile.nickname = generatedProfile.nickname;
        if (generatedProfile.publicId) profile.publicId = generatedProfile.publicId;
        if (generatedProfile.monologue) profile.monologue = generatedProfile.monologue;
        if (generatedProfile.socialFollowers) profile.socialFollowers = generatedProfile.socialFollowers;
        if (generatedProfile.socialFollowing) profile.socialFollowing = generatedProfile.socialFollowing;
        if (generatedProfile.socialOthers) profile.socialOthers = generatedProfile.socialOthers;
        if (generatedProfile.followedBy) profile.followedBy = generatedProfile.followedBy;
        profile.publicId = ensureDossierPublicId(profile.publicId || id, state, id, `${type}:${name}:${profile.setting}`);
        const nicknameInput = document.getElementById('dossier-editor-nickname');
        const publicIdInput = document.getElementById('dossier-editor-public-id');
        const monologueInput = document.getElementById('dossier-editor-monologue');
        if (nicknameInput) nicknameInput.value = profile.nickname;
        if (publicIdInput) publicIdInput.value = profile.publicId;
        if (monologueInput) monologueInput.value = profile.monologue;
        renderDossierEditorAvatar(profile.avatar, profile.name);
    } catch (error) {
        setDossierEditorMessage(error?.message || 'API 生成失败，请检查接口配置。');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = '生成昵称·ID·独白并保存';
        }
        dossierGenerating = false;
        return;
    }

    const nextItem = normalizeDossierItem(profile, type, state[type].length);

    const index = state[type].findIndex(item => item.id === id);
    if (index >= 0) {
        state[type][index] = nextItem;
    } else {
        state[type].push(nextItem);
    }

    state[getDossierActiveKey(type)] = id;
    saveDossierState();
    closeDossierEditor();
    switchDossierTab(type, false);
    refreshDossierLinkedPrivateSurfaces();
    showDossierToast(index >= 0 ? '资料、ID 与独白已更新。' : '资料、ID 与独白已新增。');
    if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = '生成昵称·ID·独白并保存';
    }
    dossierGenerating = false;
}

async function deleteDossierEntry() {
    const state = loadDossierState();
    const type = document.getElementById('dossier-editor-type')?.value === 'npc' ? 'npc' : 'char';
    const id = document.getElementById('dossier-editor-id')?.value || '';
    const item = state[type].find(entry => entry.id === id);
    if (!item) {
        closeDossierEditor();
        return;
    }
    if (!window.confirm(`删除「${item.name}」？`)) return;

    state[type] = state[type].filter(entry => entry.id !== id);
    state[getDossierActiveKey(type)] = state[type][0]?.id || '';
    saveDossierState();
    if (typeof removePrivateContactsLinkedToDossierRecord === 'function') {
        try {
            await removePrivateContactsLinkedToDossierRecord(type, id);
        } catch (error) {
            console.warn('卷宗删除后同步私叙联系人失败:', error);
        }
    } else {
        refreshDossierLinkedPrivateSurfaces();
    }
    closeDossierEditor();
    switchDossierTab(type, false);
    showDossierToast('资料已删除。');
}

async function openDossierApp() {
    const dossierApp = document.getElementById('dossier-app');
    if (!dossierApp) return;
    bindDossierEvents();
    bindDossierNetworkViewportGestures();
    await hydrateDossierState();
    document.body.classList.remove('edit-mode');
    if (typeof closeSettingsApp === 'function') closeSettingsApp(true);
    if (typeof closeLetterApp === 'function') closeLetterApp(true);
    if (typeof closePrivateApp === 'function') closePrivateApp(true);
    if (typeof closePrologueApp === 'function') closePrologueApp(true);
    if (typeof closeStyleApp === 'function') closeStyleApp(true);
    if (typeof closeCommunityApp === 'function') closeCommunityApp(true);
    document.body.classList.add('dossier-open');
    dossierApp.classList.add('active');
    switchDossierTab(dossierActiveTab, false);
    dossierApp.querySelector('.dossier-shell')?.scrollTo({ top: 0 });
}

function closeDossierApp(instant = false) {
    const dossierApp = document.getElementById('dossier-app');
    hideDossierToast(true);
    closeDossierEditor();
    closeDossierProfileCard();
    closeDossierNetworkModal();
    closeDossierNetworkSubjectModal();
    if (!dossierApp) return;
    if (instant) {
        const previousTransition = dossierApp.style.transition;
        dossierApp.style.transition = 'none';
        dossierApp.classList.remove('active');
        dossierApp.offsetHeight;
        requestAnimationFrame(() => {
            dossierApp.style.transition = previousTransition;
        });
    } else {
        dossierApp.classList.remove('active');
    }
    document.body.classList.remove('dossier-open');
}

function bindDossierEvents() {
    const dossierApp = document.getElementById('dossier-app');
    if (!dossierApp || dossierEventsBound) return;
    dossierEventsBound = true;
    bindDossierNetworkViewportGestures();

    dossierApp.addEventListener('click', event => {
        const closeTitle = event.target.closest('#dossier-close-title');
        if (closeTitle) {
            event.preventDefault();
            closeDossierApp();
            return;
        }

        const addButton = event.target.closest('#dossier-add-current');
        if (addButton) {
            event.preventDefault();
            if (dossierActiveTab === 'network') {
                openDossierNetworkSubjectModal();
                return;
            }
            openDossierEditor(dossierActiveTab === 'npc' ? 'npc' : 'char');
            return;
        }

        const tabButton = event.target.closest('[data-dossier-tab]');
        if (tabButton) {
            event.preventDefault();
            switchDossierTab(tabButton.getAttribute('data-dossier-tab'));
            return;
        }

        const profileButton = event.target.closest('[data-dossier-profile-id]');
        if (profileButton) {
            event.preventDefault();
            event.stopPropagation();
            const type = profileButton.getAttribute('data-dossier-profile-type') === 'npc' ? 'npc' : 'char';
            openDossierProfileCard(type, profileButton.getAttribute('data-dossier-profile-id') || '');
            return;
        }

        const profileCloseButton = event.target.closest('[data-dossier-profile-close]');
        if (profileCloseButton) {
            event.preventDefault();
            closeDossierProfileCard();
            return;
        }

        const editByIdButton = event.target.closest('[data-dossier-edit-id]');
        if (editByIdButton) {
            event.preventDefault();
            event.stopPropagation();
            const type = editByIdButton.getAttribute('data-dossier-edit-type') === 'npc' ? 'npc' : 'char';
            openDossierEditor(type, editByIdButton.getAttribute('data-dossier-edit-id') || '');
            return;
        }

        const selectButton = event.target.closest('[data-dossier-select]');
        if (selectButton) {
            const type = selectButton.getAttribute('data-dossier-type') === 'npc' ? 'npc' : 'char';
            const id = selectButton.getAttribute('data-dossier-select') || '';
            loadDossierState()[getDossierActiveKey(type)] = id;
            saveDossierState();
            renderDossierList(type);
            renderDossierDetail(type);
            renderDossierNetwork();
            return;
        }

        const editButton = event.target.closest('[data-dossier-edit]');
        if (editButton) {
            const type = editButton.getAttribute('data-dossier-edit') === 'npc' ? 'npc' : 'char';
            openDossierEditor(type, getDossierActiveItem(type)?.id || '');
            return;
        }

        const addEmpty = event.target.closest('[data-dossier-add-empty]');
        if (addEmpty) {
            openDossierEditor(addEmpty.getAttribute('data-dossier-add-empty') === 'npc' ? 'npc' : 'char');
            return;
        }

        const networkAdd = event.target.closest('[data-dossier-network-add]');
        if (networkAdd) {
            event.preventDefault();
            openDossierNetworkModal('', networkAdd.getAttribute('data-dossier-network-add') || 'char');
            return;
        }

        const networkNode = event.target.closest('[data-dossier-network-node]');
        if (networkNode) {
            event.preventDefault();
            openDossierNetworkModal(networkNode.getAttribute('data-dossier-network-node') || '');
            return;
        }

        const networkKind = event.target.closest('[data-dossier-network-kind]');
        if (networkKind) {
            event.preventDefault();
            if (networkKind.disabled) return;
            setDossierNetworkKind(networkKind.getAttribute('data-dossier-network-kind') || 'char');
            return;
        }

        const networkSubject = event.target.closest('[data-dossier-network-subject]');
        if (networkSubject) {
            event.preventDefault();
            switchDossierNetworkSubject(networkSubject.getAttribute('data-dossier-network-subject') || '');
        }
    });

    dossierApp.addEventListener('input', event => {
        if (event.target?.id === 'dossier-char-search') renderDossierList('char');
        if (event.target?.id === 'dossier-npc-search') renderDossierList('npc');
        if ([
            'dossier-network-source',
            'dossier-network-record',
            'dossier-network-text-name',
            'dossier-network-text-setting',
            'dossier-network-relation',
            'dossier-network-description'
        ].includes(event.target?.id)) updateDossierNetworkModalPreview();
        if (['dossier-editor-name', 'dossier-editor-nickname', 'dossier-editor-public-id'].includes(event.target?.id)) {
            const avatar = document.getElementById('dossier-editor-avatar')?.value || '';
            const name = document.getElementById('dossier-editor-name')?.value || '';
            renderDossierEditorAvatar(avatar, name);
        }
    });

    dossierApp.addEventListener('change', event => {
        if (event.target?.id === 'dossier-network-source') {
            setDossierNetworkKind(dossierNetworkDraftKind);
            return;
        }
        if (event.target?.id === 'dossier-network-record') {
            updateDossierNetworkModalPreview();
        }
    });

    document.getElementById('dossier-editor-form')?.addEventListener('submit', saveDossierEditor);
    document.getElementById('dossier-network-form')?.addEventListener('submit', saveDossierNetworkNode);
    document.getElementById('dossier-network-delete')?.addEventListener('click', deleteDossierNetworkNode);
    document.getElementById('dossier-delete-entry')?.addEventListener('click', deleteDossierEntry);
    document.getElementById('dossier-editor-avatar-button')?.addEventListener('click', event => {
        event.preventDefault();
        document.getElementById('dossier-editor-avatar-file')?.click();
    });
    document.getElementById('dossier-editor-avatar-clear')?.addEventListener('click', event => {
        event.preventDefault();
        copyDossierEditorAccount();
    });
    document.getElementById('dossier-editor-avatar-file')?.addEventListener('change', event => {
        handleDossierAvatarUpload(event.target.files?.[0]);
        event.target.value = '';
    });
    document.getElementById('dossier-editor-modal')?.addEventListener('click', event => {
        if (event.target === event.currentTarget) closeDossierEditor();
    });
    document.getElementById('dossier-profile-modal')?.addEventListener('click', event => {
        if (event.target === event.currentTarget) closeDossierProfileCard();
    });
    document.getElementById('dossier-network-modal')?.addEventListener('click', event => {
        if (event.target === event.currentTarget) closeDossierNetworkModal();
    });
    document.getElementById('dossier-network-subject-modal')?.addEventListener('click', event => {
        if (event.target === event.currentTarget) closeDossierNetworkSubjectModal();
    });

    ['touchstart', 'touchmove', 'mousedown'].forEach(eventName => {
        dossierApp.addEventListener(eventName, event => event.stopPropagation(), { passive: true });
    });

    document.querySelector('.home-indicator')?.addEventListener('click', () => {
        if (document.body.classList.contains('dossier-open')) closeDossierApp();
    });

    document.addEventListener('keydown', event => {
        if (!document.body.classList.contains('dossier-open') || event.key !== 'Escape') return;
        const profileModal = document.getElementById('dossier-profile-modal');
        const modal = document.getElementById('dossier-editor-modal');
        const networkModal = document.getElementById('dossier-network-modal');
        const subjectModal = document.getElementById('dossier-network-subject-modal');
        if (subjectModal && !subjectModal.hidden) {
            closeDossierNetworkSubjectModal();
        } else if (networkModal && !networkModal.hidden) {
            closeDossierNetworkModal();
        } else if (profileModal && !profileModal.hidden) {
            closeDossierProfileCard();
        } else if (modal && !modal.hidden) {
            closeDossierEditor();
        } else {
            closeDossierApp();
        }
    });
}

bindDossierEvents();
void hydrateDossierState();

window.openDossierApp = openDossierApp;
window.closeDossierApp = closeDossierApp;
