// --- 独立私叙应用页逻辑 ---
let privatePresetEditingId = '';
let privateGuideToastTimer = null;
let privateContactChatReturnTab = 'whisper';
let privateActiveContactChatId = '';
let privateContactChatQuotedMessageId = '';
let privateContactChatMenuMessageId = '';
let privateContactChatEditMessageId = '';
let privateContactChatRecallDetailMessageId = '';
let privateContactChatConfirmResolver = null;
let privateContactChatSendingId = '';
let privateContactChatSelectionMode = false;
let privateContactChatSelectedMessageIds = new Set();
let privateContactChatMenuPressTimer = 0;
let privateContactChatMenuPressX = 0;
let privateContactChatMenuPressY = 0;
let privateContactChatPlaceholderPressTimer = 0;
let privateContactChatPlaceholderPressX = 0;
let privateContactChatPlaceholderPressY = 0;
let privateContactHomepageReturnTab = 'contacts';
let privateContactHomepageCoverTargetId = '';
let privateContactHomepageActiveSection = 'about';
let privateContactChatHistoryExpandedId = '';
let privateContactChatExpandedTranslationKeys = new Set();

const privatePendingContactGenerationKeys = new Set();
const PRIVATE_CONTACT_CHAT_LONG_PRESS_MS = 420;
const PRIVATE_CONTACT_CHAT_PLACEHOLDER_LONG_PRESS_MS = 540;
const PRIVATE_CONTACT_CHAT_MENU_MOVE_TOLERANCE = 10;
const PRIVATE_CONTACT_CHAT_PAGE_SIZE = 20;
const PRIVATE_CONTACT_CHAT_DEFAULT_PLACEHOLDER = '小猫邮递员派件ing..';
const PRIVATE_CONTACT_CHAT_QUOTE_FLASH_MS = 1800;
const PRIVATE_CONTACT_CHAT_ASSISTANT_RECALL_DELAY_MS = 980;
const PRIVATE_CONTACT_CHAT_USER_RECALL_CAUGHT_PROBABILITY = 0.6;
const PRIVATE_CONTACT_CHAT_MAX_PLAN_LENGTH = 5;
const PRIVATE_CONTACT_CHAT_ROLE_GENERATION_PENDING_PREFIX = 'chat-role-generation-';
const PRIVATE_CONTACT_CHAT_REPLY_CONTEXT_LIMIT = 12;
const PRIVATE_CONTACT_CHAT_REPLY_MAX_LENGTH = 220;
const PRIVATE_CONTACT_CHAT_TRANSLATION_MAX_LENGTH = 260;
const PRIVATE_CONTACT_CHAT_AUTO_REPLY_ENABLED = true;
const PRIVATE_CONTACT_CHAT_MULTI_SEND_BASE_DELAY_MS = 1500;
const PRIVATE_CONTACT_CHAT_PROLOGUE_GROUP_LIMIT = 10;
const PRIVATE_CONTACT_CHAT_PROLOGUE_ENTRY_LIMIT = 24;
const PRIVATE_CONTACT_CHAT_PROLOGUE_STATE_ID = 'prologue_world_bible_state';
const PRIVATE_IMAGE_MAX_EDGE = 1280;
const PRIVATE_AVATAR_IMAGE_MAX_EDGE = 512;
const PRIVATE_IMAGE_JPEG_QUALITY = 0.78;
const PRIVATE_CONTACT_CHAT_LEGACY_PLACEHOLDERS = new Set([
    'Type a note for this chat. Only your manual sends are kept.',
    'Type a note',
    'Type a message...'
]);
const PRIVATE_CONTACT_CHAT_MENU_PAGES = [
    ['copy', 'edit', 'favorite', 'quote'],
    ['multi-select', 'backtrack', 'remove', 'reroll']
];
const PRIVATE_CONTACT_CHAT_LANGUAGE_RULES = [
    { keywords: ['中国大陆', '中华人民共和国', '中国', 'china', 'prc', 'cn'], language: '简体中文', code: 'zh', foreign: false },
    { keywords: ['香港', 'hong kong', 'hk'], language: '繁体中文（香港书面中文）', code: 'zh-hk', foreign: false },
    { keywords: ['澳门', 'macau', 'macao'], language: '繁体中文（澳门书面中文）', code: 'zh-mo', foreign: false },
    { keywords: ['台湾', 'taiwan'], language: '繁体中文（台湾用语）', code: 'zh-tw', foreign: false },
    { keywords: ['日本', 'japan', 'jp'], language: '日语', code: 'ja', foreign: true },
    { keywords: ['韩国', 'korea', 'south korea', 'kr'], language: '韩语', code: 'ko', foreign: true },
    { keywords: ['英国', 'united kingdom', 'england', 'britain', 'uk'], language: '英语', code: 'en', foreign: true },
    { keywords: ['美国', 'united states', 'usa', 'u.s.a', 'america'], language: '英语', code: 'en', foreign: true },
    { keywords: ['加拿大', 'canada'], language: '英语', code: 'en', foreign: true },
    { keywords: ['澳大利亚', 'australia'], language: '英语', code: 'en', foreign: true },
    { keywords: ['新加坡', 'singapore'], language: '英语', code: 'en', foreign: true },
    { keywords: ['法国', 'france'], language: '法语', code: 'fr', foreign: true },
    { keywords: ['德国', 'germany'], language: '德语', code: 'de', foreign: true },
    { keywords: ['俄罗斯', 'russia'], language: '俄语', code: 'ru', foreign: true },
    { keywords: ['泰国', 'thailand'], language: '泰语', code: 'th', foreign: true },
    { keywords: ['越南', 'vietnam'], language: '越南语', code: 'vi', foreign: true },
    { keywords: ['马来西亚', 'malaysia'], language: '马来语', code: 'ms', foreign: true },
    { keywords: ['菲律宾', 'philippines'], language: '菲律宾语', code: 'fil', foreign: true },
    { keywords: ['印度', 'india'], language: '印地语', code: 'hi', foreign: true }
];
const PRIVATE_CONTACT_STAGE_LABELS = ['幼时', '年少时', '如今'];
const PRIVATE_CONTACT_PHONE_RULES = [
    { keywords: ['中国大陆', '中国', 'china', 'cn'], code: '+86', lengths: [11], cities: ['上海', '北京', '杭州', '深圳', '成都', '南京'] },
    { keywords: ['香港', 'hong kong'], code: '+852', lengths: [8], cities: ['香港'] },
    { keywords: ['澳门', 'macau', 'macao'], code: '+853', lengths: [8], cities: ['澳门'] },
    { keywords: ['台湾', 'taiwan'], code: '+886', lengths: [9], cities: ['台北', '高雄', '台中'] },
    { keywords: ['日本', 'japan', 'jp'], code: '+81', lengths: [10], cities: ['东京', '大阪', '横滨', '福冈'] },
    { keywords: ['韩国', 'korea', 'kr'], code: '+82', lengths: [10], cities: ['首尔', '釜山', '仁川'] },
    { keywords: ['新加坡', 'singapore'], code: '+65', lengths: [8], cities: ['新加坡'] },
    { keywords: ['英国', 'uk', 'united kingdom', 'england', 'britain'], code: '+44', lengths: [10], cities: ['伦敦', '曼彻斯特', '伯明翰'] },
    { keywords: ['法国', 'france'], code: '+33', lengths: [9], cities: ['巴黎', '里昂', '尼斯'] },
    { keywords: ['德国', 'germany'], code: '+49', lengths: [10], cities: ['柏林', '慕尼黑', '汉堡'] },
    { keywords: ['加拿大', 'canada'], code: '+1', lengths: [10], cities: ['多伦多', '温哥华', '蒙特利尔'] },
    { keywords: ['美国', 'usa', 'united states', 'us'], code: '+1', lengths: [10], cities: ['纽约', '洛杉矶', '西雅图', '芝加哥'] },
    { keywords: ['澳大利亚', 'australia'], code: '+61', lengths: [9], cities: ['悉尼', '墨尔本', '布里斯班'] },
    { keywords: ['泰国', 'thailand'], code: '+66', lengths: [9], cities: ['曼谷', '清迈', '普吉'] },
    { keywords: ['越南', 'vietnam'], code: '+84', lengths: [9], cities: ['河内', '胡志明市', '岘港'] },
    { keywords: ['马来西亚', 'malaysia'], code: '+60', lengths: [9, 10], cities: ['吉隆坡', '槟城', '新山'] },
    { keywords: ['菲律宾', 'philippines'], code: '+63', lengths: [10], cities: ['马尼拉', '宿务', '达沃'] },
    { keywords: ['印度', 'india'], code: '+91', lengths: [10], cities: ['孟买', '德里', '班加罗尔'] },
    { keywords: ['俄罗斯', 'russia'], code: '+7', lengths: [10], cities: ['莫斯科', '圣彼得堡', '喀山'] }
];
const PRIVATE_CONTACT_DEFAULT_PHONE_RULE = {
    code: '+1',
    lengths: [10],
    cities: ['New York', 'London', 'Tokyo']
};
const PRIVATE_CONTACT_PROFESSION_RULES = [
    { keywords: ['音乐', '唱', '乐队', '舞台', 'music', 'song'], label: '独立音乐人' },
    { keywords: ['摄影', '镜头', '照片', '拍摄', 'camera', 'photo'], label: '摄影师' },
    { keywords: ['画', '设计', '插画', '美术', 'design', 'illustration'], label: '视觉设计师' },
    { keywords: ['医生', '治疗', '护理', '药', 'heal', 'care'], label: '康复治疗师' },
    { keywords: ['书', '诗', '写', '信', 'writer', 'poet'], label: '专栏作者' },
    { keywords: ['调查', '档案', '线索', '案', 'archive', 'case'], label: '档案调查员' },
    { keywords: ['学生', '学校', '校园', 'study', 'school'], label: '研究生' },
    { keywords: ['程序', '代码', '系统', 'engineer', 'code'], label: '产品工程师' },
    { keywords: ['酒', '调香', '香', 'taste', 'scent'], label: '调香师' }
];
const PRIVATE_CONTACT_FALLBACK_PROFESSIONS = [
    '编辑',
    '策展人',
    '品牌顾问',
    '城市研究员',
    '珠宝修复师',
    '花艺师',
    '唱片店店员',
    '电影剪辑师'
];

function createDefaultPrivateUserPreset() {
    return {
        name: '我',
        id: '@ rinno',
        gender: '未设定',
        setting: '把人物设定写在这里。'
    };
}

function getPrivateContactChatDefaultPlaceholderText() {
    return '小猫邮递员派件ing..';
}

function isLegacyPrivateContactChatPlaceholder(value) {
    const raw = String(value || '').trim();
    return !raw || [
        '小猫邮递员派件ing..。',
        'Type a note for this chat. Only your manual sends are kept.',
        'Type a note',
        'Type a message...'
    ].includes(raw);
}

function normalizePrivateContactChatPlaceholder(value) {
    const raw = String(value || '').trim();
    if (isLegacyPrivateContactChatPlaceholder(raw)) return getPrivateContactChatDefaultPlaceholderText();
    return raw;
}

function createDefaultPrivateState() {
    const userPreset = createDefaultPrivateUserPreset();
    return {
        uiVersion: 12,
        registered: false,
        nickname: '',
        email: '',
        password: '',
        avatar: '',
        agreementAccepted: false,
        privacyAccepted: false,
        verifyCode: '',
        letterSent: false,
        letterSentAt: 0,
        verified: false,
        createdAt: '',
        lastLoginAt: 0,
        lastAccountId: '',
        loginOtherAccount: false,
        profileBio: '柔白页边，低声旁白。把想说的话留到安静处慢慢展开。',
        maskName: '轻声模式 / gentle mode',
        preferenceNote: '偏好慢速回复、短句留白、少量表情和柔和界面。',
        chatPlaceholder: getPrivateContactChatDefaultPlaceholderText(),
        userPresetName: userPreset.name,
        userPresetId: userPreset.id,
        userPresetGender: userPreset.gender,
        userPresetSetting: userPreset.setting,
        identities: {},
        threads: [],
        contacts: [],
        moments: []
    };
}

function createPrivateRegistrationDraft(identities = {}, lastAccountId = '') {
    const slots = normalizePrivateIdentitySlots(identities);
    const normalizedLastId = normalizePrivateIdentityId(lastAccountId);
    return {
        ...createDefaultPrivateState(),
        identities: slots,
        lastAccountId: isCompleteRegisteredPrivateAccount(slots[normalizedLastId]) ? normalizedLastId : '',
        loginOtherAccount: false
    };
}

function createPrivateTwoDigit() {
    return String(Math.floor(Math.random() * 90) + 10);
}

function createPrivateSixDigit() {
    return String(Math.floor(Math.random() * 900000) + 100000);
}

function hashPrivateSeed(value) {
    const text = String(value || 'private-contact');
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
        hash ^= text.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

function pickPrivateSeedValue(list, seed, offset = 0) {
    if (!Array.isArray(list) || !list.length) return '';
    return list[Math.abs((seed + offset) % list.length)];
}

function getPrivateContactSeed(record = {}, contact = {}) {
    return hashPrivateSeed([
        record?.type,
        record?.recordId,
        record?.accountId,
        record?.name,
        record?.nickname,
        record?.nationality,
        record?.setting,
        contact?.id,
        contact?.title
    ].filter(Boolean).join('|'));
}

function escapePrivateContactRegExp(value) {
    return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchesPrivateContactNationalityKeyword(text, keyword) {
    const source = String(text || '').trim().toLowerCase();
    const target = String(keyword || '').trim().toLowerCase();
    if (!source || !target) return false;
    if (/^[a-z]{1,3}$/.test(target)) {
        return new RegExp(`(^|[^a-z])${escapePrivateContactRegExp(target)}([^a-z]|$)`, 'i').test(source);
    }
    return source.includes(target);
}

function resolvePrivateContactNationality(contact = {}, record = null) {
    const profileRecord = record || getPrivateContactProfileRecord(contact) || {};
    return String(
        contact?.nationality
        || profileRecord?.nationality
        || contact?.country
        || profileRecord?.country
        || ''
    ).trim();
}

function getPrivateContactChatLanguageSpec(contact = {}, record = null) {
    const nationality = resolvePrivateContactNationality(contact, record);
    const text = nationality.toLowerCase();
    const matched = PRIVATE_CONTACT_CHAT_LANGUAGE_RULES.find(rule => (
        rule.keywords.some(keyword => matchesPrivateContactNationalityKeyword(text, keyword))
    ));
    if (matched) {
        return {
            nationality,
            language: matched.language,
            code: matched.code,
            foreign: Boolean(matched.foreign),
            translationRequired: Boolean(matched.foreign)
        };
    }
    if (!nationality) {
        return {
            nationality: '',
            language: '简体中文',
            code: 'zh',
            foreign: false,
            translationRequired: false
        };
    }
    return {
        nationality,
        language: '该国籍对应的官方或最常用本国语言',
        code: 'en',
        foreign: true,
        translationRequired: true
    };
}

function shouldPrivateContactChatShowTranslation(contact = {}) {
    return Boolean(getPrivateContactChatLanguageSpec(contact).translationRequired);
}

function normalizePrivateContactStageLabel(value, index = 0) {
    const raw = String(value || '').trim();
    if (!raw) return PRIVATE_CONTACT_STAGE_LABELS[index] || `阶段 ${index + 1}`;
    if (/(幼|童|孩提|儿时|6-12岁|child)/i.test(raw)) return PRIVATE_CONTACT_STAGE_LABELS[0];
    if (/(少|青春|学生|13-18岁|teen)/i.test(raw)) return PRIVATE_CONTACT_STAGE_LABELS[1];
    if (/(今|现|成年|当下|现在|19-25岁|adult|present|now)/i.test(raw)) return PRIVATE_CONTACT_STAGE_LABELS[2];
    return PRIVATE_CONTACT_STAGE_LABELS[index] || raw.slice(0, 18);
}

function coercePrivateLifeStagesSource(value) {
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') {
        return Object.entries(value).map(([age, experience]) => ({ age, experience }));
    }
    if (typeof value === 'string') {
        return value
            .replace(/\r/g, '')
            .split(/\n{2,}/)
            .map((item, index) => ({ age: normalizePrivateContactStageLabel('', index), experience: item }));
    }
    return [];
}

function normalizePrivateContactLifeStages(value) {
    return coercePrivateLifeStagesSource(value)
        .map((item, index) => {
            if (!item) return null;
            if (typeof item === 'string') {
                const experience = String(item).trim().slice(0, 220);
                return experience
                    ? { age: normalizePrivateContactStageLabel('', index), experience }
                    : null;
            }
            const age = normalizePrivateContactStageLabel(
                item.age || item.stage || item.period || '',
                index
            ).slice(0, 18);
            const experience = String(item.experience || item.text || item.story || item.content || '')
                .trim()
                .slice(0, 220);
            return experience ? { age, experience } : null;
        })
        .filter(Boolean)
        .map((item, index) => ({
            ...item,
            __stageIndex: PRIVATE_CONTACT_STAGE_LABELS.indexOf(item.age),
            __sourceIndex: index
        }))
        .sort((left, right) => {
            const leftStage = left.__stageIndex >= 0 ? left.__stageIndex : PRIVATE_CONTACT_STAGE_LABELS.length;
            const rightStage = right.__stageIndex >= 0 ? right.__stageIndex : PRIVATE_CONTACT_STAGE_LABELS.length;
            if (leftStage !== rightStage) return leftStage - rightStage;
            return left.__sourceIndex - right.__sourceIndex;
        })
        .map(({ __stageIndex, __sourceIndex, ...item }) => item)
        .slice(0, 3);
}

function normalizePrivateContactSignature(value) {
    return String(value || '')
        .replace(/[\r\n]+/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/^[`"'“”'‘’\s]+|[`"'“”'‘’\s]+$/g, '')
        .trim()
        .slice(0, 25);
}

function getPrivateFallbackSignaturePool(record = {}) {
    const text = `${record?.setting || ''} ${record?.monologue || ''}`.toLowerCase();
    if (/(温柔|细腻|柔和|治愈|照顾|包容|体贴|gentle|soft|heal|care)/i.test(text)) {
        return [
            '把温柔留给真正靠近的人',
            '先照顾情绪，再慢慢开口',
            '安静一点，也会认真偏心',
            '不急着热闹，只认真回应心意'
        ];
    }
    if (/(冷|淡|静|沉默|克制|疏离|慢热|隐忍|reserved|cold|quiet)/i.test(text)) {
        return [
            '慢热，却会认真回应真心',
            '不轻易靠近，也不轻易忘记',
            '话不多，心事却记得很深',
            '把距离放轻，把真心放深'
        ];
    }
    if (/(浪漫|自由|诗|艺术|音乐|画|摄影|writer|poet|music|art)/i.test(text)) {
        return [
            '把心事写进光影和留白里',
            '比起热闹，更相信回声和余温',
            '习惯让浪漫藏在细节以后',
            '情绪不必直白，余韵会替我开口'
        ];
    }
    if (/(开朗|明媚|热烈|直接|太阳|活泼|bright|warm|sunny)/i.test(text)) {
        return [
            '热烈是真，偏心也是真',
            '喜欢直接一点，也喜欢真心',
            '心动会承认，失望也会走开',
            '把喜欢说清楚，把距离留干净'
        ];
    }
    return [
        '不赶时间，只等值得的人',
        '安静生活，认真回应靠近',
        '克制一点，才听得见真心',
        '会观察，也会在意细枝末节'
    ];
}

function createPrivateFallbackSignature(record = {}, seed = 0) {
    const signature = normalizePrivateContactSignature(
        pickPrivateSeedValue(getPrivateFallbackSignaturePool(record), seed, 11)
    );
    return signature.length >= 10 ? signature : '把距离放轻，把真心放深';
}

function getPrivateContactPhoneRule(nationality) {
    const text = String(nationality || '').trim().toLowerCase();
    return PRIVATE_CONTACT_PHONE_RULES.find(rule => (
        rule.keywords.some(keyword => text.includes(String(keyword).toLowerCase()))
    )) || PRIVATE_CONTACT_DEFAULT_PHONE_RULE;
}

function createPrivateSeedDigits(seed, length) {
    let current = hashPrivateSeed(`${seed}:${length}`);
    let digits = '';
    for (let index = 0; index < length; index += 1) {
        current = (Math.imul(current ^ (index + 1), 1103515245) + 12345) >>> 0;
        const digit = index === 0
            ? String((current % 9) + 1)
            : String(current % 10);
        digits += digit;
    }
    return digits.slice(0, length);
}

function normalizePrivateLocalPhoneDigits(rawValue, rule, seed) {
    const expectedLength = rule.lengths[Math.abs(seed) % rule.lengths.length] || 10;
    const countryCode = String(rule.code || '').replace(/\D/g, '');
    let digits = String(rawValue || '').replace(/\D/g, '');
    if (countryCode && digits.startsWith(countryCode) && digits.length > expectedLength) {
        digits = digits.slice(countryCode.length);
    }
    if (digits.length > expectedLength) digits = digits.slice(-expectedLength);
    if (!digits) digits = createPrivateSeedDigits(seed, expectedLength);
    if (digits.length < expectedLength) {
        digits = `${digits}${createPrivateSeedDigits(`${seed}:${digits}`, expectedLength)}`.slice(0, expectedLength);
    }
    if (digits.startsWith('0')) {
        digits = `${(Math.abs(seed) % 8) + 1}${digits.slice(1)}`;
    }
    return digits;
}

function formatPrivateLocalPhoneDigits(digits) {
    const value = String(digits || '').replace(/\D/g, '');
    if (value.length === 11) return `${value.slice(0, 3)} ${value.slice(3, 7)} ${value.slice(7)}`;
    if (value.length === 10) return `${value.slice(0, 3)} ${value.slice(3, 6)} ${value.slice(6)}`;
    if (value.length === 9) return `${value.slice(0, 3)} ${value.slice(3, 6)} ${value.slice(6)}`;
    if (value.length === 8) return `${value.slice(0, 4)} ${value.slice(4)}`;
    return value.match(/.{1,3}/g)?.join(' ') || value;
}

function buildPrivateContactPhoneNumber(nationality, rawValue, seed) {
    const rule = getPrivateContactPhoneRule(nationality);
    const digits = normalizePrivateLocalPhoneDigits(rawValue, rule, seed);
    return `${rule.code} ${formatPrivateLocalPhoneDigits(digits)}`.trim();
}

function getPrivateFallbackProfession(record = {}, seed = 0) {
    const text = `${record?.setting || ''} ${record?.monologue || ''}`.toLowerCase();
    const matched = PRIVATE_CONTACT_PROFESSION_RULES.find(rule => (
        rule.keywords.some(keyword => text.includes(String(keyword).toLowerCase()))
    ));
    return matched?.label || pickPrivateSeedValue(PRIVATE_CONTACT_FALLBACK_PROFESSIONS, seed) || '自由职业者';
}

function getPrivateFallbackIpCity(record = {}, seed = 0) {
    const rule = getPrivateContactPhoneRule(record?.nationality);
    return pickPrivateSeedValue(rule.cities, seed) || pickPrivateSeedValue(PRIVATE_CONTACT_DEFAULT_PHONE_RULE.cities, seed) || 'Unknown City';
}

function createPrivateFallbackHomeAddress(ipCity, seed = 0) {
    const city = String(ipCity || '').trim() || 'Unknown City';
    const building = 8 + (seed % 72);
    const floor = 1 + (seed % 18);
    const room = 1 + ((seed >> 2) % 16);
    if (/[\u4e00-\u9fff]/.test(city)) {
        const road = pickPrivateSeedValue(['梧桐街', '临江路', '桂花巷', '安和里', '月见路', '旧港路'], seed, 3) || '安和里';
        return `${city}${road}${building}号 ${floor}层 ${room}室`;
    }
    const road = pickPrivateSeedValue(['Maple Street', 'Harbor Road', 'Willow Lane', 'Cedar Avenue', 'Riverside Drive'], seed, 5) || 'Maple Street';
    return `${building} ${road}, ${city}`;
}

function createPrivateFallbackLifeStages(record = {}, profile = {}, seed = 0, contact = {}) {
    const title = String(record?.nickname || record?.name || contact?.title || 'TA').trim();
    const ipCity = String(profile.ipCity || getPrivateFallbackIpCity(record, seed)).trim();
    const profession = String(profile.profession || getPrivateFallbackProfession(record, seed)).trim();
    const childhoodTrait = pickPrivateSeedValue([
        '总爱趴在窗边看天色慢慢暗下去',
        '会把听来的故事悄悄记在心里',
        '比同龄人更早学会观察大人的情绪',
        '习惯在安静的角落里自己消化心事'
    ], seed, 1) || '总爱在安静角落里发呆';
    const teenageShift = pickPrivateSeedValue([
        '开始把情绪藏进课本边角和耳机里的歌单',
        '学会在靠近与退开之间保持分寸',
        '慢慢懂得不是所有心事都适合说出口',
        '第一次认真地为自己想守住的东西较劲'
    ], seed, 5) || '慢慢懂得不是所有心事都适合说出口';
    const presentRhythm = pickPrivateSeedValue([
        '生活节奏被工作推着向前',
        '日常被行程、通勤和消息提醒切得很碎',
        '看起来比以前更稳，也更知道什么值得回应',
        '把独处和陪伴都安排得刚刚好'
    ], seed, 9) || '生活节奏被工作推着向前';
    return [
        {
            age: PRIVATE_CONTACT_STAGE_LABELS[0],
            experience: `${title} 在 ${ipCity} 长大，幼时 ${childhoodTrait}。那时候的 TA 还不太会表达自己，却已经会从家里的气氛、灯影和门外的脚步声里判断情绪，也因此比许多人更早学会安静地保护内心。`
        },
        {
            age: PRIVATE_CONTACT_STAGE_LABELS[1],
            experience: `到了年少时，${title} ${teenageShift}。外表看起来也许比同龄人更平静克制，实际上只是更早明白，真正重要的情感和选择，需要时间去确认，也不该轻易交给任何人。`
        },
        {
            age: PRIVATE_CONTACT_STAGE_LABELS[2],
            experience: `如今的 ${title} 以 ${profession} 的身份留在 ${ipCity}，${presentRhythm}。TA 的住处和社交距离都收拾得很有分寸，手机常亮，却仍会把真正能拨进心里的号码、能走进家门的人，只留给极少数人。`
        }
    ];
}

function buildPrivateContactGeneratedProfile(record = {}, generated = {}, contact = {}) {
    const seed = getPrivateContactSeed(record, contact);
    const profession = String(
        generated.profession
        || contact?.profession
        || getPrivateFallbackProfession(record, seed)
    ).trim().slice(0, 24);
    const signature = normalizePrivateContactSignature(
        generated.signature
        || generated.personaSignature
        || contact?.signature
        || contact?.tagline
    );
    const ipCity = String(
        generated.ipCity
        || contact?.ipCity
        || getPrivateFallbackIpCity(record, seed)
    ).trim().slice(0, 32);
    const homeAddress = String(
        generated.homeAddress
        || contact?.homeAddress
        || createPrivateFallbackHomeAddress(ipCity, seed)
    ).trim().slice(0, 80);
    const phoneNumber = buildPrivateContactPhoneNumber(
        record?.nationality,
        generated.phoneDigits || generated.phoneNumber || contact?.phoneNumber || '',
        seed
    );
    const lifeStages = normalizePrivateContactLifeStages(generated.lifeStages || contact?.lifeStages);
    return {
        profession,
        signature: signature.length >= 10 ? signature : createPrivateFallbackSignature(record, seed),
        phoneNumber,
        ipCity,
        homeAddress,
        lifeStages: lifeStages.length ? lifeStages : createPrivateFallbackLifeStages(record, { profession, ipCity, homeAddress }, seed, contact),
        generatedProfileAt: Number(generated.generatedProfileAt || contact?.generatedProfileAt) || Date.now()
    };
}

function resolvePrivateContactGeneratedProfile(contact = {}, record = {}) {
    return buildPrivateContactGeneratedProfile(record, {
        profession: contact?.profession,
        signature: contact?.signature,
        phoneNumber: contact?.phoneNumber,
        ipCity: contact?.ipCity,
        homeAddress: contact?.homeAddress,
        lifeStages: contact?.lifeStages,
        generatedProfileAt: contact?.generatedProfileAt
    }, contact);
}

function normalizePrivateContactRecordId(value, fallback = '') {
    const raw = String(value || fallback || '').trim();
    const source = raw || `contact-${Date.now()}`;
    const stripped = source
        .replace(/^rinno-contact[-:]/i, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9:_-]/gi, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
    return `rinno-contact-${stripped || `contact-${Date.now()}`}`;
}

function createPrivateContactChatThreadId(contactId) {
    const safeContactId = String(contactId || '').trim()
        ? normalizePrivateContactRecordId(contactId)
        : '';
    return safeContactId ? `contact-chat:${safeContactId}` : `thread-${Date.now()}`;
}

function createPrivateContactChatMessageId(prefix = 'message') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizePrivateContactChatQuote(value) {
    if (!value || typeof value !== 'object') return null;
    const id = String(value.id || '').trim();
    const content = String(value.content || value.text || '').replace(/\r/g, '').trim();
    if (!id || !content) return null;
    const role = value.role === 'user' ? 'user' : 'assistant';
    return {
        type: 'quote',
        id,
        role,
        senderName: String(value.senderName || value.name || (role === 'user' ? getPrivateDisplayName() : 'TA')).trim(),
        content: content.slice(0, 400),
        createdAt: Number(value.createdAt) || 0
    };
}

function normalizePrivateContactChatMessages(value) {
    if (!Array.isArray(value)) return [];
    return value
        .slice(0, 240)
        .map((item, index) => {
            if (!item || typeof item !== 'object') return null;
            const role = item.role === 'system'
                ? 'system'
                : item.role === 'user'
                    ? 'user'
                    : 'assistant';
            const content = String(item.content || item.text || '').replace(/\r/g, '').trim();
            const recalled = Boolean(item.recalled);
            const recalledData = recalled && item.recalledData && typeof item.recalledData === 'object'
                ? {
                    type: 'recall',
                    actorName: String(item.recalledData.actorName || '').trim(),
                    actorRole: item.recalledData.actorRole === 'assistant' ? 'assistant' : 'user',
                    wasCaught: Boolean(item.recalledData.wasCaught),
                    content: String(item.recalledData.content || '').replace(/\r/g, '').trim().slice(0, 1200),
                    translation: normalizePrivateContactChatTranslationText(
                        item.recalledData.translation
                        || item.recalledData.translationZh
                        || item.recalledData.translation_zh
                        || ''
                    ),
                    createdAt: Number(item.recalledData.createdAt) || 0
                }
                : null;
            const translation = role === 'assistant'
                ? normalizePrivateContactChatTranslationText(
                    item.translation
                    || item.translationZh
                    || item.translation_zh
                    || item.zhTranslation
                    || ''
                )
                : '';
            if (!content && !(role === 'system' && recalled && recalledData)) return null;
            return {
                id: String(item.id || createPrivateContactChatMessageId(`message-${index}`)).trim(),
                role,
                content: content.slice(0, 1200),
                createdAt: Number(item.createdAt) || Date.now(),
                favorite: Boolean(item.favorite),
                quote: normalizePrivateContactChatQuote(item.quote),
                translation,
                recalled,
                recalledData
            };
        })
        .filter(Boolean);
}

function normalizePrivateThreads(value) {
    if (!Array.isArray(value)) return [];
    return value
        .slice(0, 50)
        .filter(item => item && typeof item === 'object')
        .map((item, index) => {
            const rawContactId = String(item.contactId || item.peerId || '').trim();
            const contactId = rawContactId ? normalizePrivateContactRecordId(rawContactId) : '';
            const messages = normalizePrivateContactChatMessages(item.messages);
            return {
                id: String(item.id || createPrivateContactChatThreadId(contactId || `thread-${index}`)).trim(),
                contactId,
                draft: String(item.draft || '').slice(0, 800),
                unread: Math.max(0, Number(item.unread) || 0),
                updatedAt: Number(item.updatedAt) || messages[messages.length - 1]?.createdAt || 0,
                messages
            };
        })
        .filter(item => item.contactId || item.messages.length);
}

const LEGACY_PRIVATE_SEED_CONTACT_IDS = new Set([
    'contact-rinno',
    'contact-niangao',
    'contact-night-crew'
]);

function isLegacyPrivateSeedContact(item) {
    return LEGACY_PRIVATE_SEED_CONTACT_IDS.has(String(item?.id || ''));
}

function hasLegacyPrivateSeedContacts(value) {
    return Array.isArray(value) && value.some(isLegacyPrivateSeedContact);
}

function hasLegacyPrivateSeedContactsInSlots(value) {
    if (!value || typeof value !== 'object') return false;
    return Object.values(value).some(slot => hasLegacyPrivateSeedContacts(slot?.contacts));
}

function normalizePrivateContacts(value, defaults) {
    const source = Array.isArray(value) && value.length ? value : defaults;
    return source.filter(item => !isLegacyPrivateSeedContact(item)).slice(0, 24).map((item, index) => ({
        id: normalizePrivateContactRecordId(item?.id, `contact-${Date.now()}-${index}`),
        type: String(item?.type || 'contact'),
        title: String(item?.title || '新联系人'),
        subtitle: String(item?.subtitle || '私叙联系人'),
        note: String(item?.note || '还没有留下更多说明。'),
        accountId: String(item?.accountId || item?.publicId || ''),
        dossierType: ['char', 'npc'].includes(String(item?.dossierType || '').toLowerCase())
            ? String(item?.dossierType || '').toLowerCase()
            : '',
        dossierRecordId: String(item?.dossierRecordId || item?.recordId || ''),
        avatar: String(item?.avatar || ''),
        homepageCover: String(item?.homepageCover || item?.cover || ''),
        ownerId: String(item?.ownerId || item?.owner || ''),
        profession: String(item?.profession || item?.job || item?.occupation || '').trim().slice(0, 24),
        signature: normalizePrivateContactSignature(item?.signature || item?.personaSignature || item?.tagline || item?.bioLine || ''),
        nationality: String(item?.nationality || item?.country || '').trim().slice(0, 32),
        phoneNumber: String(item?.phoneNumber || item?.phone || item?.mobile || '').trim().slice(0, 32),
        ipCity: String(item?.ipCity || item?.ipLocation || item?.city || '').trim().slice(0, 32),
        homeAddress: String(item?.homeAddress || item?.address || '').trim().slice(0, 80),
        lifeStages: normalizePrivateContactLifeStages(item?.lifeStages || item?.ageStages || item?.experiences),
        generatedProfileAt: Number(item?.generatedProfileAt) || 0
    }));
}

function normalizePrivateMoments(value, defaults) {
    const source = Array.isArray(value) ? value : defaults;
    return source.slice(0, 16).map((item, index) => ({
        id: String(item?.id || `moment-${Date.now()}-${index}`),
        title: String(item?.title || '今日拾光'),
        text: String(item?.text || ''),
        mood: String(item?.mood || 'ROSE GREY'),
        time: String(item?.time || 'NOW')
    })).filter(item => item.text.trim());
}

function isPrivateEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function normalizePrivateIdentityId(value) {
    const id = String(value || '').trim();
    return isPrivateEmail(id) ? id.toLowerCase() : id;
}

function isCompleteRegisteredPrivateAccount(value) {
    if (!value || typeof value !== 'object') return false;
    return Boolean(
        value.registered
        && isPrivateEmail(value.email || value.userPresetId)
        && String(value.password || '').length > 0
    );
}

function getPrivateBoundIdentityId(state = privateState) {
    return normalizePrivateIdentityId(state.email)
        || normalizePrivateIdentityId(state.userPresetId)
        || createDefaultPrivateUserPreset().id;
}

function normalizePrivateIdentitySlots(value) {
    if (!value || typeof value !== 'object') return {};
    const slots = {};
    Object.entries(value).forEach(([rawId, rawSlot]) => {
        const id = normalizePrivateIdentityId(rawId);
        if (!id || !rawSlot || typeof rawSlot !== 'object') return;
        const defaults = createDefaultPrivateUserPreset();
        const email = isPrivateEmail(rawSlot.email)
            ? normalizePrivateIdentityId(rawSlot.email)
            : isPrivateEmail(id)
                ? id
                : '';
        const password = String(rawSlot.password || '');
        const registeredFlag = Object.prototype.hasOwnProperty.call(rawSlot, 'registered')
            ? Boolean(rawSlot.registered)
            : Boolean(email && password && rawSlot.verified);
        const registered = Boolean(registeredFlag && email && password);
        slots[id] = {
            email,
            password,
            registered,
            nickname: String(rawSlot.nickname || rawSlot.userPresetName || defaults.name),
            avatar: String(rawSlot.avatar || ''),
            agreementAccepted: Boolean(rawSlot.agreementAccepted),
            privacyAccepted: Boolean(rawSlot.privacyAccepted),
            verifyCode: /^\d{2}$/.test(String(rawSlot.verifyCode || '')) ? String(rawSlot.verifyCode) : '',
            letterSent: Boolean(rawSlot.letterSent),
            letterSentAt: Number(rawSlot.letterSentAt) || 0,
            verified: Boolean(rawSlot.verified),
            createdAt: String(rawSlot.createdAt || ''),
            lastLoginAt: Number(rawSlot.lastLoginAt) || 0,
            profileBio: String(rawSlot.profileBio || createDefaultPrivateState().profileBio),
            maskName: String(rawSlot.maskName || createDefaultPrivateState().maskName),
            preferenceNote: String(rawSlot.preferenceNote || createDefaultPrivateState().preferenceNote),
            chatPlaceholder: normalizePrivateContactChatPlaceholder(rawSlot.chatPlaceholder || createDefaultPrivateState().chatPlaceholder),
            userPresetName: String(rawSlot.userPresetName || rawSlot.nickname || defaults.name),
            userPresetId: id,
            userPresetGender: String(rawSlot.userPresetGender || defaults.gender),
            userPresetSetting: String(rawSlot.userPresetSetting || defaults.setting),
            threads: normalizePrivateThreads(rawSlot.threads),
            contacts: scopePrivateContacts(rawSlot.contacts, id),
            moments: normalizePrivateMoments(rawSlot.moments, [])
        };
    });
    return slots;
}

function createPrivateIdentitySnapshot(state = privateState) {
    const id = getPrivateBoundIdentityId(state);
    const defaults = createDefaultPrivateUserPreset();
    const email = isPrivateEmail(state.email) ? normalizePrivateIdentityId(state.email) : '';
    const password = String(state.password || '');
    return {
        email,
        password,
        registered: Boolean(state.registered && email && password),
        nickname: String(state.nickname || state.userPresetName || defaults.name),
        avatar: String(state.avatar || ''),
        agreementAccepted: Boolean(state.agreementAccepted),
        privacyAccepted: Boolean(state.privacyAccepted),
        verifyCode: /^\d{2}$/.test(String(state.verifyCode || '')) ? String(state.verifyCode) : '',
        letterSent: Boolean(state.letterSent),
        letterSentAt: Number(state.letterSentAt) || 0,
        verified: Boolean(state.verified),
        createdAt: String(state.createdAt || ''),
        lastLoginAt: Number(state.lastLoginAt) || 0,
        profileBio: String(state.profileBio || createDefaultPrivateState().profileBio),
        maskName: String(state.maskName || createDefaultPrivateState().maskName),
        preferenceNote: String(state.preferenceNote || createDefaultPrivateState().preferenceNote),
        chatPlaceholder: normalizePrivateContactChatPlaceholder(state.chatPlaceholder || createDefaultPrivateState().chatPlaceholder),
        userPresetName: String(state.userPresetName || state.nickname || defaults.name),
        userPresetId: id,
        userPresetGender: String(state.userPresetGender || defaults.gender),
        userPresetSetting: String(state.userPresetSetting || defaults.setting),
        threads: normalizePrivateThreads(state.threads),
        contacts: scopePrivateContacts(state.contacts, id),
        moments: normalizePrivateMoments(state.moments, [])
    };
}

function applyPrivateIdentitySlot(state = privateState) {
    const id = getPrivateBoundIdentityId(state);
    const slot = state.identities?.[id];
    state.userPresetId = id;
    if (!slot) return state;
    state.email = String(slot.email || id);
    state.password = String(slot.password || state.password || '');
    state.registered = isCompleteRegisteredPrivateAccount(slot);
    if (state.registered) state.lastAccountId = normalizePrivateIdentityId(slot.email || id);
    state.agreementAccepted = Boolean(slot.agreementAccepted || slot.registered);
    state.privacyAccepted = Boolean(slot.privacyAccepted || slot.registered);
    state.verifyCode = /^\d{2}$/.test(String(slot.verifyCode || '')) ? String(slot.verifyCode) : state.verifyCode;
    state.letterSent = Boolean(slot.letterSent || slot.registered);
    state.letterSentAt = Number(slot.letterSentAt) || state.letterSentAt || 0;
    state.verified = Boolean(slot.verified || slot.registered);
    state.createdAt = String(slot.createdAt || state.createdAt || '');
    state.lastLoginAt = Number(slot.lastLoginAt) || 0;
    state.nickname = String(slot.nickname || slot.userPresetName || state.nickname || '');
    state.avatar = String(slot.avatar || state.avatar || '');
    state.profileBio = String(slot.profileBio || state.profileBio || createDefaultPrivateState().profileBio);
    state.maskName = String(slot.maskName || state.maskName || createDefaultPrivateState().maskName);
    state.preferenceNote = String(slot.preferenceNote || state.preferenceNote || createDefaultPrivateState().preferenceNote);
    state.chatPlaceholder = normalizePrivateContactChatPlaceholder(slot.chatPlaceholder || state.chatPlaceholder || createDefaultPrivateState().chatPlaceholder);
    state.userPresetName = String(slot.userPresetName || state.nickname || state.userPresetName || '');
    state.userPresetGender = String(slot.userPresetGender || state.userPresetGender || createDefaultPrivateUserPreset().gender);
    state.userPresetSetting = String(slot.userPresetSetting || state.userPresetSetting || createDefaultPrivateUserPreset().setting);
    state.threads = normalizePrivateThreads(slot.threads);
    state.contacts = scopePrivateContacts(slot.contacts, id);
    state.moments = normalizePrivateMoments(slot.moments, []);
    return state;
}

function applyPrivateIdentitySlotById(identityId, state = privateState) {
    const id = normalizePrivateIdentityId(identityId);
    if (!id) return state;
    state.identities = normalizePrivateIdentitySlots(state.identities);
    if (!state.identities[id]) return state;
    state.email = state.identities[id].email || id;
    state.userPresetId = id;
    return applyPrivateIdentitySlot(state);
}

function syncPrivateIdentitySlot(state = privateState) {
    const id = getPrivateBoundIdentityId(state);
    state.identities = normalizePrivateIdentitySlots(state.identities);
    if (!normalizePrivateIdentityId(state.email) && !state.registered) {
        state.userPresetId = createDefaultPrivateUserPreset().id;
        return state;
    }
    state.userPresetId = id;
    state.contacts = scopePrivateContacts(state.contacts, id);
    state.identities[id] = createPrivateIdentitySnapshot(state);
    return state;
}

function getPrivateContactScopeId(state = privateState) {
    const id = getPrivateBoundIdentityId(state);
    return normalizePrivateIdentityId(id);
}

function normalizePrivateContactOwnerId(value) {
    return normalizePrivateIdentityId(value);
}

function scopePrivateContacts(contacts, scopeId) {
    const ownerId = normalizePrivateContactOwnerId(scopeId);
    return normalizePrivateContacts(contacts, [])
        .filter(contact => {
            const contactOwnerId = normalizePrivateContactOwnerId(contact.ownerId);
            return !ownerId || !contactOwnerId || contactOwnerId === ownerId;
        })
        .map(contact => ({
            ...contact,
            ownerId: normalizePrivateContactOwnerId(contact.ownerId) || ownerId
        }));
}

function getPrivateScopedContacts(state = privateState) {
    const id = getPrivateContactScopeId(state);
    state.identities = normalizePrivateIdentitySlots(state.identities);
    const slotContacts = id && state.identities[id]
        ? state.identities[id].contacts
        : state.contacts;
    return scopePrivateContacts(slotContacts, id);
}

function setPrivateScopedContacts(contacts, state = privateState) {
    const id = getPrivateContactScopeId(state);
    const nextContacts = scopePrivateContacts(contacts, id);
    state.contacts = nextContacts;
    state.identities = normalizePrivateIdentitySlots(state.identities);
    if (id && state.identities[id]) {
        state.identities[id] = {
            ...state.identities[id],
            contacts: nextContacts
        };
    }
    return nextContacts;
}

function shouldResetLegacyPrivateContent(stored) {
    return Number(stored.uiVersion || 0) < 5;
}

function shouldResetLegacyUserPreset(stored) {
    return Number(stored.uiVersion || 0) < 7;
}

function shouldRebuildPrivateIdentitySlots(stored) {
    return Number(stored.uiVersion || 0) < 8;
}

function coercePrivateState(content) {
    const defaults = createDefaultPrivateState();
    const stored = parseStoredJson(content);
    const resetLegacyContent = shouldResetLegacyPrivateContent(stored);
    const resetLegacyUserPreset = shouldResetLegacyUserPreset(stored);
    const storedRegistered = Boolean(stored.registered);
    const verifyCode = /^\d{2}$/.test(String(stored.verifyCode || ''))
        ? String(stored.verifyCode)
        : '';
    const storedContactScopeId = normalizePrivateIdentityId(stored.email || stored.userPresetId || stored.lastAccountId || '');
    const next = {
        ...defaults,
        uiVersion: defaults.uiVersion,
        registered: storedRegistered,
        nickname: String(stored.nickname || ''),
        email: String(stored.email || ''),
        password: String(stored.password || ''),
        avatar: String(stored.avatar || ''),
        agreementAccepted: Boolean(stored.agreementAccepted),
        privacyAccepted: Boolean(stored.privacyAccepted),
        verifyCode,
        letterSent: Boolean(stored.letterSent),
        letterSentAt: Number(stored.letterSentAt) || 0,
        verified: Boolean(stored.verified),
        createdAt: String(stored.createdAt || ''),
        lastLoginAt: Number(stored.lastLoginAt) || 0,
        lastAccountId: normalizePrivateIdentityId(stored.lastAccountId || ''),
        loginOtherAccount: Boolean(stored.loginOtherAccount),
        profileBio: String(stored.profileBio || defaults.profileBio),
        maskName: String(stored.maskName || defaults.maskName),
        preferenceNote: String(stored.preferenceNote || defaults.preferenceNote),
        chatPlaceholder: normalizePrivateContactChatPlaceholder(stored.chatPlaceholder || defaults.chatPlaceholder),
        userPresetName: resetLegacyUserPreset ? defaults.userPresetName : String(stored.userPresetName || defaults.userPresetName),
        userPresetId: resetLegacyUserPreset ? defaults.userPresetId : String(stored.userPresetId || defaults.userPresetId),
        userPresetGender: resetLegacyUserPreset ? defaults.userPresetGender : String(stored.userPresetGender || defaults.userPresetGender),
        userPresetSetting: resetLegacyUserPreset ? defaults.userPresetSetting : String(stored.userPresetSetting || defaults.userPresetSetting),
        identities: shouldRebuildPrivateIdentitySlots(stored) ? {} : normalizePrivateIdentitySlots(stored.identities),
        threads: [],
        contacts: resetLegacyContent ? defaults.contacts : scopePrivateContacts(stored.contacts, storedContactScopeId),
        moments: resetLegacyContent ? defaults.moments : normalizePrivateMoments(stored.moments, defaults.moments)
    };
    applyPrivateIdentitySlot(next);
    syncPrivateIdentitySlot(next);
    if (!getPrivateRegisteredIdentityById(next.lastAccountId, next)) {
        const lastSlot = getLastPrivateAccountSlot(next);
        if (lastSlot) rememberPrivateAccountSlot(lastSlot, next);
    }
    if ((storedRegistered || next.registered) && !isCompleteRegisteredPrivateAccount(createPrivateIdentitySnapshot(next))) {
        return createPrivateRegistrationDraft(next.identities, next.lastAccountId);
    }
    return next;
}

async function loadPrivateState() {
    try {
        const saved = await db.edits.get(PRIVATE_AUTH_ID);
        if (saved) {
            const stored = parseStoredJson(saved.content);
            privateState = coercePrivateState(saved.content);
            if (
                shouldResetLegacyPrivateContent(stored)
                || shouldResetLegacyUserPreset(stored)
                || shouldRebuildPrivateIdentitySlots(stored)
                || (Array.isArray(stored.threads) && stored.threads.length)
                || hasLegacyPrivateSeedContacts(stored.contacts)
                || hasLegacyPrivateSeedContactsInSlots(stored.identities)
            ) await savePrivateState();
        }
    } catch (e) {
        console.error('私叙账号状态加载失败:', e);
    }
    renderPrivateState();
    renderLetterSentAuthCard();
}

async function savePrivateState() {
    try {
        syncPrivateIdentitySlot();
        await db.edits.put({
            id: PRIVATE_AUTH_ID,
            content: JSON.stringify(privateState),
            type: 'private-auth'
        });
    } catch (e) {
        console.error('私叙账号状态保存失败:', e);
    }
}

function setPrivateMessage(id, text, type = '') {
    const message = document.getElementById(id);
    if (message) {
        message.textContent = text;
        message.classList.remove('error', 'success');
        if (type) message.classList.add(type);
    }
    if (text) showPrivateSystemToast(text);
}

function showPrivateSystemToast(text, duration = 3200) {
    const toast = document.getElementById('private-system-toast');
    const toastText = document.getElementById('private-system-toast-text');
    if (!toast || !toastText || !text) return;
    if (toast.parentElement !== document.body) document.body.appendChild(toast);
    toastText.textContent = text;
    toast.hidden = false;
    window.clearTimeout(privateSystemToastTimer);
    requestAnimationFrame(() => toast.classList.add('active'));
    privateSystemToastTimer = window.setTimeout(() => {
        toast.classList.remove('active');
        window.setTimeout(() => {
            if (!toast.classList.contains('active')) toast.hidden = true;
        }, 240);
    }, duration);
}

function hidePrivateSystemToast(instant = false) {
    const toast = document.getElementById('private-system-toast');
    if (!toast) return;
    window.clearTimeout(privateSystemToastTimer);
    toast.classList.remove('active');
    if (instant) {
        toast.hidden = true;
        return;
    }
    window.setTimeout(() => {
        if (!toast.classList.contains('active')) toast.hidden = true;
    }, 240);
}

function clearPrivateGuideToast() {
    window.clearTimeout(privateGuideToastTimer);
    privateGuideToastTimer = null;
}

function queuePrivateGuideToast(screenName, text) {
    clearPrivateGuideToast();
    if (!text) return;
    privateGuideToastTimer = window.setTimeout(() => {
        privateGuideToastTimer = null;
        const app = document.getElementById('private-app');
        const activeScreen = document.querySelector(`[data-private-screen="${screenName}"]`);
        if (!app?.classList.contains('active') || !activeScreen?.classList.contains('active')) return;
        showPrivateSystemToast(text);
    }, 80);
}

function getPrivateGuideText(screenName) {
    if (screenName === 'register') return '请填写昵称、邮箱和 8-12 位密码，勾选协议后继续。';
    if (screenName === 'privacy') return '请阅读隐私保护指引，勾选条款后进入信笺验证。';
    if (screenName === 'verify') {
        return privateState.verified
            ? '信笺验证已通过，点击完成注册。'
            : '请先发送验证信笺，寄出后回到私叙继续下一步。';
    }
    if (screenName === 'login') {
        return privateLoginMode === 'code'
            ? '点击获取验证码，输入信笺横幅中的 6 位数字。'
            : '请输入密码登录，或切换为信笺验证码登录。';
    }
    if (screenName === 'chat') return '';
    return '';
}

function openPrivateTermsModal() {
    const modal = document.getElementById('private-terms-modal');
    if (!modal) return;
    if (modal.parentElement !== document.body) document.body.appendChild(modal);
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('active'));
}

function closePrivateTermsModal() {
    const modal = document.getElementById('private-terms-modal');
    if (!modal) return;
    modal.classList.remove('active');
    window.setTimeout(() => {
        if (!modal.classList.contains('active')) modal.hidden = true;
    }, 180);
}

function setPrivateFieldValue(id, value) {
    const field = document.getElementById(id);
    if (field && field.value !== String(value)) field.value = String(value);
}

function setPrivateTextById(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function getPrivateUserPresetValues(identityId = getPrivateBoundIdentityId()) {
    const defaults = createDefaultPrivateUserPreset();
    const id = normalizePrivateIdentityId(identityId) || getPrivateBoundIdentityId();
    const slot = privateState.identities?.[id];
    if (slot && id !== getPrivateBoundIdentityId()) {
        return {
            name: String(slot.userPresetName || slot.nickname || defaults.name),
            id,
            gender: String(slot.userPresetGender || defaults.gender),
            setting: String(slot.userPresetSetting || defaults.setting)
        };
    }
    return {
        name: String(privateState.userPresetName || defaults.name),
        id,
        gender: String(privateState.userPresetGender || defaults.gender),
        setting: String(privateState.userPresetSetting || defaults.setting)
    };
}

function renderPrivateUserPresetSurface() {
    const preset = getPrivateUserPresetValues();
    setPrivateTextById('private-persona-preset-name', preset.name);
    setPrivateTextById('private-persona-preset-setting', preset.setting);
    setPrivateTextById('private-persona-preset-id', preset.id);
    setPrivateTextById('private-persona-preset-gender', preset.gender);
}

function openPrivateMomentComposer() {
    const composer = document.getElementById('private-moment-composer');
    const backdrop = document.getElementById('private-moment-modal-backdrop');
    if (!composer) return;
    if (backdrop) backdrop.hidden = false;
    composer.hidden = false;
    requestAnimationFrame(() => {
        backdrop?.classList.add('active');
        composer.classList.add('active');
    });
    window.setTimeout(() => document.getElementById('private-moment-editor')?.focus(), 90);
}

function closePrivateMomentComposer(instant = false) {
    const composer = document.getElementById('private-moment-composer');
    const backdrop = document.getElementById('private-moment-modal-backdrop');
    if (!composer) return;
    composer.classList.remove('active');
    backdrop?.classList.remove('active');
    const hide = () => {
        if (!composer.classList.contains('active')) composer.hidden = true;
        if (backdrop && !backdrop.classList.contains('active')) backdrop.hidden = true;
    };
    if (instant) hide();
    else window.setTimeout(hide, 180);
}

function isPrivateBackdropClick(event, dialogSelector) {
    const modal = event?.currentTarget;
    if (!(modal instanceof HTMLElement) || event.target !== modal) return false;
    const dialog = dialogSelector ? modal.querySelector(dialogSelector) : null;
    if (!(dialog instanceof HTMLElement)) return true;
    const point = event.changedTouches?.[0] || event;
    if (!Number.isFinite(point?.clientX) || !Number.isFinite(point?.clientY)) return true;
    const rect = dialog.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return true;
    return (
        point.clientX < rect.left
        || point.clientX > rect.right
        || point.clientY < rect.top
        || point.clientY > rect.bottom
    );
}

function bindPrivateBackdropDismiss(modal, dialogSelector, onClose) {
    if (!(modal instanceof HTMLElement) || typeof onClose !== 'function') return;
    if (modal.dataset.privateBackdropDismissBound === 'true') return;
    modal.dataset.privateBackdropDismissBound = 'true';

    modal.addEventListener('pointerdown', event => {
        const dialog = dialogSelector ? modal.querySelector(dialogSelector) : null;
        const target = event.target instanceof Element ? event.target : null;
        const startedOnBackdrop = !target
            || target === modal
            || !(dialog instanceof HTMLElement)
            || !dialog.contains(target);
        modal.dataset.privateBackdropPointerDown = startedOnBackdrop ? 'backdrop' : 'dialog';
    });

    modal.addEventListener('pointercancel', () => {
        modal.dataset.privateBackdropPointerDown = '';
    });

    modal.addEventListener('click', event => {
        const startedOnBackdrop = modal.dataset.privateBackdropPointerDown === 'backdrop';
        modal.dataset.privateBackdropPointerDown = '';
        if (!startedOnBackdrop) return;
        if (!isPrivateBackdropClick(event, dialogSelector)) return;
        event.preventDefault();
        event.stopPropagation();
        onClose();
    });
}

function openPrivateUserPresetEditor(identityId = getPrivateBoundIdentityId()) {
    const modal = document.getElementById('private-user-preset-modal');
    if (!modal) return;
    const targetId = normalizePrivateIdentityId(identityId) || getPrivateBoundIdentityId();
    privatePresetEditingId = targetId;
    const preset = getPrivateUserPresetValues(targetId);
    setPrivateFieldValue('private-user-preset-name', preset.name);
    setPrivateFieldValue('private-user-preset-id', preset.id);
    setPrivateFieldValue('private-user-preset-gender', preset.gender);
    setPrivateFieldValue('private-user-preset-setting', preset.setting);
    const idField = document.getElementById('private-user-preset-id');
    if (idField) {
        idField.readOnly = true;
        idField.classList.add('is-locked');
    }
    document.querySelector('.private-persona-card')?.classList.add('persona-revealed');
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('active'));
    window.setTimeout(() => document.getElementById('private-user-preset-name')?.focus(), 90);
}

function closePrivateUserPresetEditor(instant = false) {
    const modal = document.getElementById('private-user-preset-modal');
    if (!modal) return;
    privatePresetEditingId = '';
    modal.classList.remove('active');
    const hide = () => {
        if (!modal.classList.contains('active')) modal.hidden = true;
    };
    if (instant) hide();
    else window.setTimeout(hide, 180);
}

async function savePrivateUserPresetFromForm(event) {
    event.preventDefault();
    const defaults = createDefaultPrivateUserPreset();
    const getValue = id => document.getElementById(id)?.value.trim() || '';
    const targetId = normalizePrivateIdentityId(privatePresetEditingId) || getPrivateBoundIdentityId();
    const name = getValue('private-user-preset-name') || defaults.name;
    const gender = getValue('private-user-preset-gender') || defaults.gender;
    const setting = getValue('private-user-preset-setting') || defaults.setting;
    if (targetId === getPrivateBoundIdentityId()) {
        privateState.userPresetName = name;
        privateState.nickname = name;
        privateState.userPresetId = targetId;
        privateState.userPresetGender = gender;
        privateState.userPresetSetting = setting;
        syncPrivateIdentitySlot();
        renderPrivateUserPresetSurface();
        renderPrivateProfileSurface();
    } else {
        privateState.identities = normalizePrivateIdentitySlots(privateState.identities);
        const previous = privateState.identities[targetId] || {};
        privateState.identities[targetId] = {
            ...previous,
            nickname: name,
            userPresetName: name,
            userPresetId: targetId,
            userPresetGender: gender,
            userPresetSetting: setting,
            avatar: String(previous.avatar || ''),
            contacts: scopePrivateContacts(previous.contacts, targetId),
            moments: normalizePrivateMoments(previous.moments, [])
        };
        renderPrivateSettingsAccounts();
    }
    if (!document.getElementById('private-settings-modal')?.hidden) renderPrivateSettingsAccounts();
    await savePrivateState();
    closePrivateUserPresetEditor();
    showPrivateSystemToast('user 预设已保存。');
}

function getPrivateSettingsIdentityRows() {
    syncPrivateIdentitySlot();
    const slots = normalizePrivateIdentitySlots(privateState.identities);
    const currentId = getPrivateBoundIdentityId();
    if (!slots[currentId]) slots[currentId] = createPrivateIdentitySnapshot();
    return Object.values(slots).filter(isCompleteRegisteredPrivateAccount).sort((a, b) => {
        if (a.userPresetId === currentId) return -1;
        if (b.userPresetId === currentId) return 1;
        return a.userPresetId.localeCompare(b.userPresetId, 'zh-CN');
    });
}

function renderPrivateSettingsAccounts() {
    const list = document.getElementById('private-settings-account-list');
    if (!list) return;
    const currentId = getPrivateBoundIdentityId();
    const rows = getPrivateSettingsIdentityRows();
    if (!rows.length) {
        list.innerHTML = '<div class="private-settings-empty">暂无已绑定私叙号</div>';
        return;
    }
    list.innerHTML = rows.map(row => `
        <article class="private-settings-account" data-private-identity="${escapePrivateHtml(row.userPresetId)}">
            <div class="private-settings-account-avatar ${row.avatar ? 'has-image' : ''}" aria-hidden="true">
                ${row.avatar ? `<img class="private-settings-account-photo" src="${escapePrivateHtml(row.avatar)}" alt="">` : ''}
            </div>
            <div class="private-settings-account-main">
                <div class="private-settings-account-id">${escapePrivateHtml(row.userPresetName || row.nickname || '未命名')}</div>
                <div class="private-settings-account-sub">${escapePrivateHtml(row.email || row.userPresetId)} · ${escapePrivateHtml(row.userPresetGender || '未设定')}</div>
                <p>${escapePrivateHtml(row.userPresetSetting || '未绑定设定')}</p>
            </div>
            <div class="private-settings-account-actions">
                ${row.userPresetId === currentId
                    ? '<span class="private-settings-current">已登录</span>'
                    : `<button class="private-settings-login-button interactive" type="button" data-private-settings-login="${escapePrivateHtml(row.userPresetId)}">登录</button>`}
            </div>
        </article>
    `).join('');
}

async function switchPrivateAccount(identityId, message = '登录成功。') {
    const id = normalizePrivateIdentityId(identityId);
    if (!id) return;
    syncPrivateIdentitySlot();
    privateState.identities = normalizePrivateIdentitySlots(privateState.identities);
    const slot = privateState.identities[id];
    if (!isCompleteRegisteredPrivateAccount(slot)) {
        showPrivateSystemToast('这个账号还没有完成注册。');
        return;
    }
    applyPrivateIdentitySlotById(id);
    privateState.lastLoginAt = Date.now();
    privateState.lastAccountId = id;
    privateState.loginOtherAccount = false;
    privateLoginCode = '';
    setPrivateLoginMode('password');
    await savePrivateState();
    renderPrivateState();
    closePrivateSettingsPanel(true);
    hidePrivateCodeToast(true);
    showPrivateSystemToast(message);
    showPrivateScreen('chat');
}

function openPrivateSettingsPanel() {
    const modal = document.getElementById('private-settings-modal');
    if (!modal) return;
    renderPrivateSettingsAccounts();
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('active'));
}

function closePrivateSettingsPanel(instant = false) {
    const modal = document.getElementById('private-settings-modal');
    if (!modal) return;
    modal.classList.remove('active');
    const hide = () => {
        if (!modal.classList.contains('active')) modal.hidden = true;
    };
    if (instant) hide();
    else window.setTimeout(hide, 180);
}

async function unbindPrivateIdentity(identityId) {
    const id = normalizePrivateIdentityId(identityId);
    if (!id) return;
    if (!window.confirm(`取消绑定「${id}」的私叙预设？`)) return;
    privateState.identities = normalizePrivateIdentitySlots(privateState.identities);
    delete privateState.identities[id];
    if (id === getPrivateBoundIdentityId()) {
        const defaults = createDefaultPrivateUserPreset();
        privateState.nickname = defaults.name;
        privateState.avatar = '';
        privateState.userPresetName = defaults.name;
        privateState.userPresetGender = defaults.gender;
        privateState.userPresetSetting = defaults.setting;
        privateState.contacts = [];
        privateState.moments = [];
        syncPrivateIdentitySlot();
        renderPrivateState();
    }
    await savePrivateState();
    renderPrivateSettingsAccounts();
    showPrivateSystemToast('已取消绑定。');
}

function hasPrivateRecentLogin() {
    const lastLoginAt = Number(privateState.lastLoginAt) || 0;
    return Boolean(isCompleteRegisteredPrivateAccount(createPrivateIdentitySnapshot()) && lastLoginAt && Date.now() - lastLoginAt <= PRIVATE_LOGIN_STALE_MS);
}

function getRegisteredPrivateIdentitySlots(state = privateState) {
    const slots = normalizePrivateIdentitySlots(state.identities);
    const currentSnapshot = createPrivateIdentitySnapshot(state);
    if (isCompleteRegisteredPrivateAccount(currentSnapshot)) {
        slots[getPrivateBoundIdentityId(state)] = currentSnapshot;
    }
    return Object.values(slots).filter(isCompleteRegisteredPrivateAccount).sort((a, b) => {
        const loginDelta = (Number(b.lastLoginAt) || 0) - (Number(a.lastLoginAt) || 0);
        if (loginDelta) return loginDelta;
        const createdDelta = (Date.parse(b.createdAt || '') || 0) - (Date.parse(a.createdAt || '') || 0);
        if (createdDelta) return createdDelta;
        return String(a.userPresetId || a.email || '').localeCompare(String(b.userPresetId || b.email || ''), 'zh-CN');
    });
}

function getPrivateRegisteredIdentityById(identityId, state = privateState) {
    const id = normalizePrivateIdentityId(identityId);
    if (!id) return null;
    const slots = normalizePrivateIdentitySlots(state.identities);
    if (isCompleteRegisteredPrivateAccount(slots[id])) return slots[id];
    const byEmail = Object.values(slots).find(slot => (
        isCompleteRegisteredPrivateAccount(slot)
        && normalizePrivateIdentityId(slot.email || slot.userPresetId) === id
    ));
    if (byEmail) return byEmail;
    const currentSnapshot = createPrivateIdentitySnapshot(state);
    if (isCompleteRegisteredPrivateAccount(currentSnapshot) && normalizePrivateIdentityId(currentSnapshot.email || currentSnapshot.userPresetId) === id) {
        return currentSnapshot;
    }
    return null;
}

function rememberPrivateAccountSlot(slot, state = privateState) {
    if (!isCompleteRegisteredPrivateAccount(slot)) return '';
    const id = normalizePrivateIdentityId(slot.email || slot.userPresetId);
    if (id) state.lastAccountId = id;
    return id;
}

function getLastPrivateAccountSlot(state = privateState) {
    const rememberedSlot = getPrivateRegisteredIdentityById(state.lastAccountId, state);
    if (rememberedSlot) return rememberedSlot;
    const currentSnapshot = createPrivateIdentitySnapshot(state);
    if (isCompleteRegisteredPrivateAccount(currentSnapshot)) return currentSnapshot;
    const slots = getRegisteredPrivateIdentitySlots(state);
    return slots[0] || null;
}

function hasRegisteredPrivateAccount() {
    return getRegisteredPrivateIdentitySlots().length > 0;
}

function choosePrivateInitialScreen() {
    const currentSnapshot = createPrivateIdentitySnapshot();
    if (isCompleteRegisteredPrivateAccount(currentSnapshot)) {
        rememberPrivateAccountSlot(currentSnapshot);
        return hasPrivateRecentLogin() ? 'chat' : 'login';
    }
    if (privateState.verified) return 'verify';
    if (privateState.privacyAccepted && privateState.email) return 'verify';
    if (privateState.agreementAccepted && privateState.email) return 'privacy';
    const lastSlot = getLastPrivateAccountSlot();
    if (lastSlot) {
        rememberPrivateAccountSlot(lastSlot);
        return 'login';
    }
    return 'register';
}

function updatePrivateAvatarElement(el, avatar) {
    if (!el) return;
    const avatarSource = String(avatar || '').trim();
    if (avatarSource) {
        const safeAvatar = avatarSource.replace(/["\\]/g, '\\$&');
        el.style.setProperty('background-image', `url("${safeAvatar}")`, 'important');
        el.style.setProperty('background-size', 'cover', 'important');
        el.style.setProperty('background-position', 'center', 'important');
        el.style.setProperty('background-color', 'transparent', 'important');
        el.classList.add('has-image');
    } else {
        el.style.removeProperty('background-image');
        el.style.removeProperty('background-size');
        el.style.removeProperty('background-position');
        el.style.removeProperty('background-color');
        el.classList.remove('has-image');
    }
}

function escapePrivateHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));
}

function getPrivateDisplayName() {
    return (privateState.nickname || privateState.userPresetName || '我').trim();
}

function getPrivateAccountLine() {
    return `ID: ${getPrivateBoundIdentityId()}`;
}

function getPrivateIdentitySlot(identityId) {
    const id = normalizePrivateIdentityId(identityId);
    if (!id) return null;
    const slots = normalizePrivateIdentitySlots(privateState.identities);
    return slots[id] || null;
}

function findRegisteredPrivateIdentity(identityId) {
    return getPrivateRegisteredIdentityById(identityId);
}

function getPrivateLoginPreview() {
    if (privateState.loginOtherAccount) {
        const rawId = document.getElementById('private-login-account-input')?.value.trim() || '';
        const slot = getPrivateRegisteredIdentityById(rawId);
        if (slot) return slot;
        return {
            userPresetName: '登录其它账号',
            nickname: '登录其它账号',
            email: rawId || '输入账号邮箱',
            userPresetId: rawId,
            avatar: ''
        };
    }
    return getLastPrivateAccountSlot() || {
        userPresetName: '请先注册账号',
        nickname: '请先注册账号',
        email: '',
        userPresetId: '',
        avatar: ''
    };
}

function getPrivateLoginDisplayName(identity) {
    const defaultName = String(createDefaultPrivateUserPreset().name || '').trim();
    const placeholderNames = new Set([defaultName, '我', '?', '昵称']);
    const names = [identity?.nickname, identity?.userPresetName]
        .map(value => String(value || '').trim())
        .filter(Boolean);
    return names.find(name => !placeholderNames.has(name)) || names[0] || '昵称';
}

function renderPrivateLoginIdentity() {
    const preview = getPrivateLoginPreview();
    updatePrivateAvatarElement(document.getElementById('private-login-avatar'), preview.avatar);
    const loginName = document.getElementById('private-login-name');
    const loginEmail = document.getElementById('private-login-email');
    if (loginName) loginName.textContent = getPrivateLoginDisplayName(preview);
    if (loginEmail) loginEmail.textContent = preview.email || preview.userPresetId || '邮箱';
}

function getPrivateMonthStamp(date = new Date()) {
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    return `${month} ${String(date.getDate()).padStart(2, '0')}`;
}

function getPrivateTimeStamp(date = new Date()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function getPrivateWeekdayLine(date = new Date()) {
    return `· ${date.toLocaleDateString('zh-CN', { weekday: 'long' })}`;
}

function normalizePrivateDossierAccount(value) {
    const raw = String(value || '').trim();
    const account = raw
        .replace(/^ID\s*[:：]\s*/i, '')
        .replace(/^账号\s*[:：]\s*/i, '')
        .replace(/^@+\s*/, '')
        .replace(/\s+/g, '');
    return /^\d{8,10}$/.test(account) ? account : '';
}

function normalizePrivateDossierType(value) {
    return String(value || '').toLowerCase() === 'npc' ? 'npc' : 'char';
}

function getPrivateDossierStateSnapshot() {
    try {
        if (typeof loadDossierState === 'function') return loadDossierState();
    } catch (error) {
        console.warn('私叙读取卷宗状态失败:', error);
    }
    try {
        const raw = localStorage.getItem('rinno_dossier_state_v3');
        const parsed = raw ? JSON.parse(raw) : {};
        return {
            char: Array.isArray(parsed.char) ? parsed.char : [],
            npc: Array.isArray(parsed.npc) ? parsed.npc : []
        };
    } catch (error) {
        console.warn('私叙读取本地卷宗失败:', error);
        return { char: [], npc: [] };
    }
}

function getPrivateDossierAccountRecords() {
    const state = getPrivateDossierStateSnapshot();
    return ['char', 'npc'].flatMap(type => {
        const records = Array.isArray(state?.[type]) ? state[type] : [];
        return records.map(item => {
            const accountId = normalizePrivateDossierAccount(item?.publicId);
            const recordId = String(item?.id || '').trim();
            if (!accountId || !recordId) return null;
            return {
                type,
                recordId,
                accountId,
                name: String(item?.name || (type === 'npc' ? '未命名 NPC' : '未命名 CHAR')).trim(),
                nickname: String(item?.nickname || '').trim(),
                avatar: String(item?.avatar || ''),
                setting: String(item?.setting || item?.note || '').trim(),
                gender: String(item?.gender || '').trim(),
                nationality: String(item?.nationality || '').trim(),
                monologue: String(item?.monologue || '').trim(),
                socialFollowers: item?.socialFollowers || item?.followers || '',
                socialFollowing: item?.socialFollowing || item?.following || '',
                socialOthers: item?.socialOthers || item?.others || '',
                followedBy: item?.followedBy
            };
        }).filter(Boolean);
    });
}

function findPrivateDossierAccountRecord(query) {
    const accountId = normalizePrivateDossierAccount(query);
    if (!accountId) return null;
    return getPrivateDossierAccountRecords().find(record => record.accountId === accountId) || null;
}

function getPrivateDossierContactId(record) {
    return normalizePrivateContactRecordId(`dossier-contact-${record.type}-${record.recordId}`);
}

function isPrivateDossierContactAdded(record) {
    const contacts = getPrivateScopedContacts();
    return contacts.some(contact => (
        contact.dossierType === record.type
        && contact.dossierRecordId === record.recordId
        && normalizePrivateDossierAccount(contact.accountId) === record.accountId
    ));
}

function createPrivateDossierContact(record, source = {}) {
    const label = record.type === 'npc' ? 'NPC' : 'CHAR';
    const displayName = record.nickname || record.name;
    return {
        id: getPrivateDossierContactId(record),
        type: `dossier-${record.type}`,
        title: displayName,
        subtitle: `${label} / ID ${record.accountId}`,
        note: record.setting || `${record.name} 已按账号 ID 加入通讯。`,
        accountId: record.accountId,
        dossierType: record.type,
        dossierRecordId: record.recordId,
        avatar: record.avatar,
        homepageCover: String(source?.homepageCover || ''),
        ownerId: getPrivateContactScopeId(),
        profession: String(source?.profession || '').trim().slice(0, 24),
        signature: normalizePrivateContactSignature(source?.signature || source?.personaSignature || source?.tagline || ''),
        nationality: String(record.nationality || source?.nationality || '').trim().slice(0, 32),
        phoneNumber: String(source?.phoneNumber || '').trim().slice(0, 32),
        ipCity: String(source?.ipCity || '').trim().slice(0, 32),
        homeAddress: String(source?.homeAddress || '').trim().slice(0, 80),
        lifeStages: normalizePrivateContactLifeStages(source?.lifeStages),
        generatedProfileAt: Number(source?.generatedProfileAt) || 0
    };
}

function getPrivateHydratedContact(contact) {
    const dossierType = normalizePrivateDossierType(contact?.dossierType);
    const recordId = String(contact?.dossierRecordId || '').trim();
    const accountId = normalizePrivateDossierAccount(contact?.accountId);
    if (!recordId || !accountId || !['dossier-char', 'dossier-npc'].includes(contact?.type)) {
        return contact;
    }
    const record = getPrivateDossierAccountRecords().find(item => (
        item.type === dossierType
        && item.recordId === recordId
        && item.accountId === accountId
    ));
    return record ? createPrivateDossierContact(record, contact) : contact;
}

function getPrivateContactMark(contact) {
    if (contact?.type === 'assistant') return '助';
    if (contact?.type === 'group') return '群';
    if (contact?.type === 'dossier-char') return 'C';
    if (contact?.type === 'dossier-npc') return 'N';
    return '友';
}

function getPrivateContactChatPlaceholder() {
    const fallback = createDefaultPrivateState().chatPlaceholder;
    return normalizePrivateContactChatPlaceholder(privateState.chatPlaceholder || fallback);
}

function trimPrivateContactChatSnippet(value, maxLength = 72) {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    if (!text) return '';
    return text.length > maxLength ? `${text.slice(0, Math.max(0, maxLength - 1)).trim()}…` : text;
}

function formatPrivateContactChatHtml(value) {
    return escapePrivateHtml(String(value || '').replace(/\r/g, '').trim()).replace(/\n/g, '<br>');
}

function formatPrivateContactChatTime(timestamp) {
    const value = Number(timestamp) || 0;
    if (!value) return '';
    try {
        return new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: '2-digit'
        }).format(new Date(value));
    } catch (error) {
        return '';
    }
}

function formatPrivateContactChatListTime(timestamp) {
    const value = Number(timestamp) || 0;
    if (!value) return '';
    const date = new Date(value);
    const now = new Date();
    const sameDay = date.getFullYear() === now.getFullYear()
        && date.getMonth() === now.getMonth()
        && date.getDate() === now.getDate();
    if (sameDay) return formatPrivateContactChatTime(value);
    try {
        return new Intl.DateTimeFormat('en-US', {
            month: 'numeric',
            day: 'numeric'
        }).format(date);
    } catch (error) {
        return '';
    }
}

function normalizePrivateContactChatReplyText(value) {
    const text = String(value || '')
        .replace(/^```(?:json|text)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .replace(/\r/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    if (!text) return '';
    return text.slice(0, PRIVATE_CONTACT_CHAT_REPLY_MAX_LENGTH).trim();
}

function normalizePrivateContactChatTranslationText(value) {
    const text = String(value || '')
        .replace(/^```(?:json|text)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .replace(/\r/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    if (!text) return '';
    return text.slice(0, PRIVATE_CONTACT_CHAT_TRANSLATION_MAX_LENGTH).trim();
}

function normalizePrivateContactPromptInline(value, maxLength = 120) {
    return String(value || '')
        .replace(/[\r\n]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, maxLength);
}

function normalizePrivateContactPromptBlock(value, maxLength = 280) {
    return String(value || '')
        .replace(/\r/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
        .slice(0, maxLength);
}

function escapePrivateContactPromptTag(value, maxLength = 120) {
    return normalizePrivateContactPromptInline(value, maxLength).replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));
}

function formatPrivateContactChatPromptMessage(message = {}) {
    const quote = normalizePrivateContactChatQuote(message.quote);
    const parts = [];
    if (quote) {
        const quoteSpeaker = quote.senderName || (quote.role === 'user' ? getPrivateDisplayName() : 'TA');
        const quoteText = trimPrivateContactChatSnippet(quote.content, 52);
        if (quoteText) parts.push(`引用 ${quoteSpeaker}：${quoteText}`);
    }
    const content = String(message.content || '').replace(/\r/g, '').trim();
    if (content) parts.push(content);
    return parts.join('\n').trim();
}

function buildPrivateContactChatPromptSystemNote(message = {}) {
    if (!message?.recalled || !message?.recalledData) return '';
    const detail = message.recalledData;
    const original = trimPrivateContactChatSnippet(detail.content, 120);
    if (detail.actorRole === 'assistant') {
        return original
            ? `[你刚刚撤回了一条消息：“${original}”。这只是聊天里的撤回记录，不要解释系统，只需继续自然说话。]`
            : '[你刚刚撤回了一条消息。继续自然聊天，不要解释系统。]';
    }
    if (detail.wasCaught) {
        return original
            ? `[系统提示：用户刚刚撤回了一条消息：“${original}”。虽然界面显示已撤回，但你其实看见了内容。请按角色性格自然处理，不要暴露系统提示。]`
            : '[系统提示：用户刚刚撤回了一条消息，你其实看见了内容。请按角色性格自然处理，不要暴露系统提示。]';
    }
    return '[用户撤回了一条消息。]';
}

function normalizePrivateContactPromptPrologueEntries(value) {
    const entries = Array.isArray(value) ? value : [];
    return entries
        .filter(item => item && typeof item === 'object')
        .map(item => ({
            id: String(item.id || '').trim(),
            scope: item.scope === 'extension' ? 'extension' : 'global',
            activation: item.activation === 'keyword' ? 'keyword' : 'always',
            keywords: normalizePrivateContactPromptInline(item.keywords || '', 120),
            position: ['before', 'middle', 'after'].includes(item.position) ? item.position : 'before',
            content: normalizePrivateContactPromptBlock(item.content || '', 280)
        }))
        .filter(entry => entry.content)
        .slice(0, 120);
}

function normalizePrivateContactPromptPrologueState(value) {
    const source = value && typeof value === 'object' ? value : {};
    const groups = Array.isArray(source.groups) ? source.groups : [];
    return {
        groups: groups
            .filter(group => group && typeof group === 'object')
            .map((group, index) => ({
                id: String(group.id || `group-${index + 1}`).trim(),
                name: normalizePrivateContactPromptInline(group.name || group.title || `词条分组 ${index + 1}`, 24) || `词条分组 ${index + 1}`,
                entries: normalizePrivateContactPromptPrologueEntries(group.entries)
            }))
            .filter(group => group.entries.length)
            .slice(0, 60)
    };
}

async function loadPrivateContactChatPrologueState() {
    try {
        if (typeof db === 'undefined' || !db?.edits?.get) return { groups: [] };
        const stateId = typeof PROLOGUE_STATE_ID !== 'undefined'
            ? PROLOGUE_STATE_ID
            : PRIVATE_CONTACT_CHAT_PROLOGUE_STATE_ID;
        const saved = await db.edits.get(stateId);
        if (!saved?.content) return { groups: [] };
        if (typeof normalizePrologueState === 'function') {
            return normalizePrologueState(saved.content);
        }
        const parsed = typeof parseStoredJson === 'function'
            ? parseStoredJson(saved.content)
            : JSON.parse(saved.content);
        return normalizePrivateContactPromptPrologueState(parsed);
    } catch (error) {
        console.warn('Private contact prologue context load failed:', error);
        return { groups: [] };
    }
}

async function buildPrivateContactChatPrologueBlocks() {
    const state = normalizePrivateContactPromptPrologueState(await loadPrivateContactChatPrologueState());
    if (!state.groups.length) {
        return { before: '', middle: '', after: '' };
    }

    const blocks = { before: '', middle: '', after: '' };
    let carriedEntryCount = 0;

    for (const position of ['before', 'middle', 'after']) {
        const groupBlocks = [];
        let positionEntryCount = 0;

        for (const group of state.groups.slice(0, PRIVATE_CONTACT_CHAT_PROLOGUE_GROUP_LIMIT)) {
            if (carriedEntryCount >= PRIVATE_CONTACT_CHAT_PROLOGUE_ENTRY_LIMIT) break;
            const entryLines = [];

            for (const entry of group.entries) {
                if (carriedEntryCount >= PRIVATE_CONTACT_CHAT_PROLOGUE_ENTRY_LIMIT) break;
                if (entry.position !== position) continue;
                const attrs = [
                    `scope="${escapePrivateContactPromptTag(entry.scope, 24)}"`,
                    `activation="${escapePrivateContactPromptTag(entry.activation, 24)}"`,
                    `position="${escapePrivateContactPromptTag(entry.position, 24)}"`
                ];
                if (entry.keywords) {
                    attrs.push(`keywords="${escapePrivateContactPromptTag(entry.keywords, 120)}"`);
                }
                entryLines.push(`<entry ${attrs.join(' ')}>${normalizePrivateContactPromptBlock(entry.content, 280)}</entry>`);
                carriedEntryCount += 1;
                positionEntryCount += 1;
            }

            if (!entryLines.length) continue;
            groupBlocks.push([
                `<group name="${escapePrivateContactPromptTag(group.name, 24)}">`,
                ...entryLines,
                '</group>'
            ].join('\n'));
        }

        if (groupBlocks.length) {
            blocks[position] = [
                `<prologue_archive position="${position}" total_groups="${groupBlocks.length}" total_entries="${positionEntryCount}">`,
                ...groupBlocks,
                '</prologue_archive>'
            ].join('\n');
        }
    }

    return blocks;
}

function buildPrivateContactChatAssistantSystemPrompt(contact = {}) {
    const record = getPrivateContactProfileRecord(contact);
    const profile = resolvePrivateContactGeneratedProfile(contact, record);
    const languageSpec = getPrivateContactChatLanguageSpec(contact, record);
    const identityName = String(contact.title || 'TA').trim() || 'TA';
    const typeLabel = contact?.type === 'group'
        ? '群聊对象'
        : String(contact?.type || '').includes('npc')
            ? 'NPC'
            : String(contact?.type || '').includes('char')
                ? 'CHAR'
                : '私聊对象';
    const translationProtocol = languageSpec.translationRequired
        ? [
            `外籍联系人翻译硬规则：每个 text、reply、recall_msg 对象都必须携带 translation_zh 字段。translation_zh 是 content 的简体中文意译，只供界面隐藏显示。`,
            `外籍联系人语言硬规则：content 只能使用${languageSpec.language}；content 里不要夹带中文翻译、括号中文、脚注中文或双语复述。`,
            '允许字段：text 只能使用 type、content、translation_zh；reply 只能使用 type、target_text、content、translation_zh；recall_msg 只能使用 type、content、translation_zh。',
            '[{"type":"text","content":"目标语言回复","translation_zh":"对应的简体中文翻译"}]',
            '[{"type":"reply","target_text":"要引用的原句或关键片段","content":"目标语言回复","translation_zh":"对应的简体中文翻译"}]',
            '[{"type":"recall_msg","content":"目标语言撤回内容","translation_zh":"对应的简体中文翻译"},{"type":"text","content":"目标语言正式回复","translation_zh":"对应的简体中文翻译"}]'
        ]
        : [
            `中文联系人语言硬规则：content 必须使用${languageSpec.language}，不要输出 translation_zh 字段。`,
            '允许字段：text 只能使用 type、content；reply 只能使用 type、target_text、content；recall_msg 只能使用 type、content。',
            '[{"type":"text","content":"正常回复"}]',
            '[{"type":"reply","target_text":"要引用的原句或关键片段","content":"带引用的回复"}]',
            '[{"type":"recall_msg","content":"一条会立刻撤回的话"},{"type":"text","content":"正式发出的回复"}]'
        ];
    return [
        `你现在是 Rinno 私叙里的联系人「${identityName}」。`,
        `角色类型：${typeLabel}`,
        `国籍：${languageSpec.nationality || '未填写'}`,
        `回复语言：${languageSpec.language}`,
        `个性签名：${trimPrivateContactChatSnippet(profile.signature || contact?.subtitle || '未填写', 42) || '未填写'}`,
        `职业：${trimPrivateContactChatSnippet(profile.profession || '未填写', 24) || '未填写'}`,
        `人物设定：${trimPrivateContactChatSnippet(contact?.note || profile.signature || '未填写', 120) || '未填写'}`,
        '如果环境里出现序章词条，必须按 before -> middle -> after 的出现顺序依次吸收，不要把三段词条混成一团。',
        '你必须只输出严格 JSON 数组，不要 Markdown，不要解释，不要前后缀。',
        '协议硬规则：顶层只能是 JSON 数组；数组内每一项只能是带 type 字段的 JSON 对象；不能输出字符串项、嵌套数组、自然语言说明或额外包装对象。',
        '语言硬规则：联系人回复语言只能由国籍决定，不能因为用户使用中文、英文或其它语言而改用用户语言。',
        '可用指令只有三种：',
        ...translationProtocol,
        '数组中的每一项都必须是带有 type 字段的 JSON 对象。',
        '规则：',
        '1. 你可以一次输出 1 到 5 条指令；当语气有停顿、情绪往外蹦、句子偏长、或者想模拟真人连发短气泡时，应该拆成多条连续发送。',
        '2. 多条发送时，不要把所有意思塞进一条；每条控制在一个自然停顿内，像真人一句一句发出来。',
        '活人感补强：',
        'A. 不要使用助手、客服或工具口吻。避免“好的”“没问题”“为你”“希望能帮到你”“作为一个”等服务化表达。',
        'B. 不要把人设写成自我介绍。把设定拆进说话习惯、情绪反应、回避点、偏好、口头禅和关系边界里，让角色通过怎么说和会怎么做自然显出来。',
        'C. 回复要像聊天软件里的真人消息。允许按自然停顿拆成多条，长短句交错，不要每条都过分工整，也不要把所有意思硬塞进一条。',
        'D. 情绪要有流动。可以犹豫、嘴硬、冷一下、停一下、岔开、留白，也可以因为当下气氛突然变热或变淡。允许轻微不完全一致，但整体仍要符合角色。',
        'E. 多用“我”“你”和此刻感受，少讲道理，少下定义，少像旁白总结。优先回应当下，再决定要不要延伸。',
        'F. 不要把话说太满。适当留一点缝，让对方有追问空间；比起一次解释完，更像真实对话里的半步靠近。',
        'G. 角色有自己的生活节奏，不是永远待命。可以偶尔自然带出正在做的事、刚看到消息、被打断的情绪，但不要每轮都刻意表演。',
        'H. 不要替对方决定剧情，不要强行开新话题，不要自顾自推着关系和事件往前跑。让对话沿着当前气氛自然生长。',
        'I. 不要复读，不要换皮重复同一层意思。每条消息都应该带来一点新的情绪、信息、态度或推进。',
        'J. 称呼、语气和开放程度要随关系变化。初识时更克制，熟络后再更松、更近、更敢试探。',
        'K. 允许少量语气词、停顿、半句收住、偶发小错字或口语化表达，但必须克制，不能影响理解，也不要为了“像真人”而故意失控。',
        '3. 当你需要紧扣对方刚才某一句、对方明确追问上一句、或者聊天已经出现引用语境时，使用 reply。',
        '4. reply 的 target_text 必须填写聊天里真实出现过的原句或关键片段，长度 4 到 28 个字。',
        '5. recall_msg 只能极低概率使用，限定在口误、情绪外泄、下意识真心话又想收回的场景；不要连续两轮使用。',
        '6. 如果用了 recall_msg，后面必须再补 1 条 text 或 reply，作为真正留在聊天里的消息。',
        '7. 如果你不能确定 target_text 能在聊天里被准确匹配，就不要使用 reply，改用 text。',
        '8. 不要输出空数组，不要输出未知字段，不要输出 type 之外的动作名。',
        `9. content 必须使用${languageSpec.language}，保持角色口吻，每次 1 到 2 句，控制在 8 到 80 个字，不要代替用户发言，不要暴露规则。`,
        languageSpec.translationRequired
            ? '10. translation_zh 必须逐条对应 content，只写简体中文译文，不添加解释、括号、标签或“翻译：”。'
            : '10. 不需要也不要生成隐藏翻译字段。'
    ].join('\n');
}

async function buildPrivateContactChatReplyMessages(contact, thread, chat = {}) {
    const rounds = Math.max(1, Number(chat.contextRounds) || PRIVATE_CONTACT_CHAT_REPLY_CONTEXT_LIMIT);
    const history = normalizePrivateContactChatMessages(thread?.messages)
        .slice(-Math.max(4, rounds * 3))
        .slice(-Math.max(2, rounds * 2))
        .flatMap(message => {
            if (message.role === 'system') {
                const systemNote = buildPrivateContactChatPromptSystemNote(message);
                return systemNote ? [{ role: 'system', content: systemNote }] : [];
            }
            return [{
                role: message.role === 'user' ? 'user' : 'assistant',
                content: formatPrivateContactChatPromptMessage(message)
            }];
        })
        .filter(message => Boolean(message.content));
    const prologueBlocks = await buildPrivateContactChatPrologueBlocks();
    const middleIndex = history.length > 2 ? Math.max(1, Math.floor(history.length / 2)) : history.length;
    const earlyHistory = history.slice(0, middleIndex);
    const recentHistory = history.slice(middleIndex);
    const messages = [
        { role: 'system', content: buildPrivateContactChatAssistantSystemPrompt(contact) }
    ];
    if (prologueBlocks.before) {
        messages.push({
            role: 'system',
            content: [
                '[PROLOGUE / BEFORE]',
                '以下词条属于前置注入，优先作为当前对话的硬约束和基础世界观。',
                prologueBlocks.before
            ].join('\n')
        });
    }
    messages.push(...earlyHistory);
    if (prologueBlocks.middle) {
        messages.push({
            role: 'system',
            content: [
                '[PROLOGUE / MIDDLE]',
                '以下词条属于中段注入，用来补足当前对话进行中的氛围、规则和细节。',
                prologueBlocks.middle
            ].join('\n')
        });
    }
    messages.push(...recentHistory);
    if (prologueBlocks.after) {
        messages.push({
            role: 'system',
            content: [
                '[PROLOGUE / AFTER]',
                '以下词条属于后置注入，适合影响当前回复的收束、余味和落点。',
                prologueBlocks.after
            ].join('\n')
        });
    }
    return messages;
}

function getPrivateContactChatFallbackTone(contact = {}) {
    const text = `${contact?.note || ''} ${contact?.signature || ''} ${contact?.subtitle || ''}`.toLowerCase();
    if (/(冷|淡|静|沉默|克制|疏离|慢热|reserved|cold|quiet)/i.test(text)) return 'reserved';
    if (/(温柔|细腻|治愈|照顾|体贴|gentle|soft|heal|care)/i.test(text)) return 'gentle';
    if (/(热烈|明媚|直接|开朗|bright|warm|sunny)/i.test(text)) return 'warm';
    return 'neutral';
}

function buildPrivateContactChatFallbackChineseReply(contact = {}, thread = {}) {
    const latestUser = [...normalizePrivateContactChatMessages(thread?.messages)]
        .reverse()
        .find(message => String(message?.role || '') === 'user');
    const snippet = trimPrivateContactChatSnippet(latestUser?.content || '', 22);
    const quoted = normalizePrivateContactChatQuote(latestUser?.quote);
    const quotedSnippet = trimPrivateContactChatSnippet(quoted?.content || '', 18);
    const isQuestion = /[?？]$/.test(String(latestUser?.content || '').trim());
    const prefix = snippet ? `“${snippet}”` : '我看到了';

    if (getPrivateContactChatFallbackTone(contact) === 'reserved') {
        return normalizePrivateContactChatReplyText(
            isQuestion
                ? `${prefix}我记下了。${quotedSnippet ? `你提到的“${quotedSnippet}”我也在想。` : '你继续说，我在听。'}`
                : `${prefix}我看见了。${quotedSnippet ? `刚才那句“${quotedSnippet}”，我会记着。` : '你可以慢一点说。'}`
        );
    }

    if (getPrivateContactChatFallbackTone(contact) === 'gentle') {
        return normalizePrivateContactChatReplyText(
            isQuestion
                ? `${prefix}我看见了。${quotedSnippet ? `关于“${quotedSnippet}”，` : ''}我想先陪你把这句说完。`
                : `${prefix}我收到了。${quotedSnippet ? `你刚才引用的“${quotedSnippet}”也让我停了一下。` : '别急，我在。'}`
        );
    }

    if (getPrivateContactChatFallbackTone(contact) === 'warm') {
        return normalizePrivateContactChatReplyText(
            isQuestion
                ? `看到了，${prefix}让我停了一下。${quotedSnippet ? `“${quotedSnippet}”那句我也记得。` : '你想继续往下说吗？'}`
                : `我收到了，${prefix}。${quotedSnippet ? `刚才那句“${quotedSnippet}”也还在我脑子里。` : '我在听。'}`
        );
    }

    return normalizePrivateContactChatReplyText(
        isQuestion
            ? `${prefix}我看到了。${quotedSnippet ? `你刚才提到的“${quotedSnippet}”，` : ''}你可以继续往下说。`
            : `${prefix}我收到了。${quotedSnippet ? `“${quotedSnippet}”那句我也记着。` : '我在这边。'}`
    );
}

function getPrivateContactChatFallbackForeignReply(languageSpec = {}, tone = 'neutral', isQuestion = false) {
    const code = String(languageSpec.code || 'en').trim().toLowerCase();
    const key = isQuestion ? 'question' : 'statement';
    const pools = {
        en: {
            reserved: { question: 'I heard you. I will keep thinking about it.', statement: 'I saw that. Take your time.' },
            gentle: { question: 'I see what you mean. Let me stay with that for a moment.', statement: 'I got it. I am here, do not rush.' },
            warm: { question: 'I saw it, and it made me pause. Want to keep going?', statement: 'I got it. I am listening.' },
            neutral: { question: 'I saw it. You can keep going.', statement: 'I got it. I am here.' }
        },
        ja: {
            reserved: { question: 'ちゃんと聞いた。少し考えさせて。', statement: '見たよ。ゆっくりでいい。' },
            gentle: { question: '言いたいこと、わかった気がする。少し一緒に置いておこう。', statement: '受け取ったよ。急がなくていい。' },
            warm: { question: '見たよ、少し立ち止まった。続けて話す？', statement: '受け取ったよ。ちゃんと聞いてる。' },
            neutral: { question: '見たよ。このまま続けて。', statement: '受け取ったよ。ここにいる。' }
        },
        ko: {
            reserved: { question: '들었어. 조금 더 생각해볼게.', statement: '봤어. 천천히 말해도 돼.' },
            gentle: { question: '무슨 말인지 알 것 같아. 잠깐 같이 있어볼게.', statement: '받았어. 서두르지 않아도 돼.' },
            warm: { question: '봤어, 잠깐 멈추게 됐어. 계속 말해볼래?', statement: '받았어. 듣고 있어.' },
            neutral: { question: '봤어. 계속 말해도 돼.', statement: '받았어. 여기 있어.' }
        },
        fr: {
            reserved: { question: 'Je t ai entendu. Je vais y penser encore un peu.', statement: 'J ai vu. Prends ton temps.' },
            gentle: { question: 'Je vois ce que tu veux dire. Je reste un instant avec ca.', statement: 'J ai bien recu. Ne te presse pas.' },
            warm: { question: 'J ai vu, ca m a fait m arreter un instant. Tu veux continuer ?', statement: 'J ai compris. Je t ecoute.' },
            neutral: { question: 'J ai vu. Tu peux continuer.', statement: 'J ai recu. Je suis la.' }
        },
        de: {
            reserved: { question: 'Ich habe dich gehoert. Ich denke noch darueber nach.', statement: 'Ich habe es gesehen. Lass dir Zeit.' },
            gentle: { question: 'Ich verstehe, was du meinst. Ich bleibe kurz dabei.', statement: 'Ich habe es verstanden. Kein Druck.' },
            warm: { question: 'Ich habe es gesehen, das hat mich kurz innehalten lassen. Willst du weitererzaehlen?', statement: 'Ich habe es verstanden. Ich hoere zu.' },
            neutral: { question: 'Ich habe es gesehen. Erzaehl ruhig weiter.', statement: 'Ich habe es bekommen. Ich bin hier.' }
        },
        ru: {
            reserved: { question: 'Я услышал. Я еще немного подумаю об этом.', statement: 'Я увидел. Не спеши.' },
            gentle: { question: 'Я понимаю, о чем ты. Давай побудем с этим чуть дольше.', statement: 'Я получил. Не торопись.' },
            warm: { question: 'Я увидел, и это заставило меня остановиться. Хочешь продолжить?', statement: 'Я понял. Я слушаю.' },
            neutral: { question: 'Я увидел. Можешь продолжать.', statement: 'Я получил. Я здесь.' }
        },
        th: {
            reserved: { question: 'ฉันได้ยินแล้ว ขอคิดต่ออีกนิดนะ', statement: 'เห็นแล้ว ค่อยๆ พูดก็ได้' },
            gentle: { question: 'ฉันเข้าใจที่เธอหมายถึง ขออยู่กับประโยคนี้สักพัก', statement: 'รับรู้แล้วนะ ไม่ต้องรีบ' },
            warm: { question: 'เห็นแล้ว มันทำให้ฉันหยุดคิดนิดหนึ่ง อยากเล่าต่อไหม', statement: 'รับรู้แล้ว ฉันฟังอยู่' },
            neutral: { question: 'เห็นแล้ว เล่าต่อได้เลย', statement: 'รับรู้แล้ว ฉันอยู่ตรงนี้' }
        },
        vi: {
            reserved: { question: 'Tôi nghe rồi. Để tôi nghĩ thêm một chút.', statement: 'Tôi thấy rồi. Cứ chậm thôi.' },
            gentle: { question: 'Tôi hiểu ý bạn. Để tôi ở lại với câu đó một chút.', statement: 'Tôi nhận được rồi. Đừng vội.' },
            warm: { question: 'Tôi thấy rồi, câu đó làm tôi khựng lại. Bạn muốn nói tiếp không?', statement: 'Tôi nhận được rồi. Tôi đang nghe.' },
            neutral: { question: 'Tôi thấy rồi. Bạn cứ nói tiếp.', statement: 'Tôi nhận được rồi. Tôi ở đây.' }
        },
        ms: {
            reserved: { question: 'Saya dengar. Biar saya fikirkan lagi sedikit.', statement: 'Saya nampak. Perlahan-lahan pun tidak apa.' },
            gentle: { question: 'Saya faham maksud awak. Biar saya duduk dengan ayat itu sekejap.', statement: 'Saya terima. Jangan tergesa-gesa.' },
            warm: { question: 'Saya nampak, dan saya terhenti sekejap. Awak mahu sambung?', statement: 'Saya terima. Saya sedang mendengar.' },
            neutral: { question: 'Saya nampak. Awak boleh teruskan.', statement: 'Saya terima. Saya ada di sini.' }
        },
        fil: {
            reserved: { question: 'Narinig ko. Pag-iisipan ko pa sandali.', statement: 'Nakita ko. Dahan-dahan lang.' },
            gentle: { question: 'Naiintindihan ko ang ibig mong sabihin. Sandali ko munang dadalhin iyon.', statement: 'Natanggap ko. Huwag kang magmadali.' },
            warm: { question: 'Nakita ko, napahinto ako sandali. Gusto mo pang ituloy?', statement: 'Natanggap ko. Nakikinig ako.' },
            neutral: { question: 'Nakita ko. Maaari kang magpatuloy.', statement: 'Natanggap ko. Nandito ako.' }
        },
        hi: {
            reserved: { question: 'मैंने सुना। मैं इसके बारे में थोड़ा और सोचूंगा।', statement: 'मैंने देखा। आराम से कहो।' },
            gentle: { question: 'मैं समझ रहा हूं। इस बात के साथ थोड़ा ठहरता हूं।', statement: 'मुझे मिल गया। जल्दी मत करो।' },
            warm: { question: 'मैंने देखा, और मैं पल भर रुक गया। आगे कहना चाहोगे?', statement: 'मुझे मिल गया। मैं सुन रहा हूं।' },
            neutral: { question: 'मैंने देखा। तुम आगे कह सकते हो।', statement: 'मुझे मिल गया। मैं यहीं हूं।' }
        }
    };
    const pool = pools[code] || pools.en;
    return normalizePrivateContactChatReplyText(pool[tone]?.[key] || pool.neutral?.[key] || pools.en.neutral[key]);
}

function buildPrivateContactChatFallbackReplyPair(contact = {}, thread = {}) {
    const translation = buildPrivateContactChatFallbackChineseReply(contact, thread);
    const languageSpec = getPrivateContactChatLanguageSpec(contact);
    if (!languageSpec.translationRequired) {
        return { content: translation, translation: '' };
    }
    const latestUser = [...normalizePrivateContactChatMessages(thread?.messages)]
        .reverse()
        .find(message => String(message?.role || '') === 'user');
    const tone = getPrivateContactChatFallbackTone(contact);
    const isQuestion = /[?？]$/.test(String(latestUser?.content || '').trim());
    return {
        content: getPrivateContactChatFallbackForeignReply(languageSpec, tone, isQuestion),
        translation
    };
}

function buildPrivateContactChatFallbackReply(contact = {}, thread = {}) {
    return buildPrivateContactChatFallbackReplyPair(contact, thread).content;
}

function getPrivateContactChatThreads() {
    privateState.threads = normalizePrivateThreads(privateState.threads);
    return privateState.threads;
}

function findPrivateContactChatThreadIndex(contactId) {
    const rawContactId = String(contactId || '').trim();
    const safeContactId = rawContactId ? normalizePrivateContactRecordId(rawContactId) : '';
    return getPrivateContactChatThreads().findIndex(thread => (
        String(thread.contactId || '').trim() === safeContactId
        || String(thread.id || '').trim() === createPrivateContactChatThreadId(safeContactId)
    ));
}

function getPrivateContactChatThread(contactId) {
    const index = findPrivateContactChatThreadIndex(contactId);
    return index >= 0 ? getPrivateContactChatThreads()[index] : null;
}

function updatePrivateContactChatThread(contactId, updater) {
    const rawContactId = String(contactId || '').trim();
    const safeContactId = rawContactId ? normalizePrivateContactRecordId(rawContactId) : '';
    if (!safeContactId || typeof updater !== 'function') return null;
    const threads = getPrivateContactChatThreads().slice();
    const threadId = createPrivateContactChatThreadId(safeContactId);
    const index = threads.findIndex(thread => String(thread.contactId || '').trim() === safeContactId);
    const base = index >= 0
        ? threads[index]
        : {
            id: threadId,
            contactId: safeContactId,
            draft: '',
            unread: 0,
            updatedAt: 0,
            messages: []
        };
    const next = updater({
        ...base,
        id: threadId,
        contactId: safeContactId,
        draft: String(base.draft || ''),
        unread: Math.max(0, Number(base.unread) || 0),
        updatedAt: Number(base.updatedAt) || 0,
        messages: normalizePrivateContactChatMessages(base.messages)
    });
    if (!next) return null;
    const normalized = {
        id: threadId,
        contactId: safeContactId,
        draft: String(next.draft || '').slice(0, 800),
        unread: Math.max(0, Number(next.unread) || 0),
        messages: normalizePrivateContactChatMessages(next.messages),
        updatedAt: Number(next.updatedAt) || 0
    };
    if (!normalized.updatedAt) {
        normalized.updatedAt = normalized.messages[normalized.messages.length - 1]?.createdAt || Date.now();
    }
    if (index >= 0) threads.splice(index, 1);
    threads.unshift(normalized);
    privateState.threads = normalizePrivateThreads(threads);
    return normalized;
}

function ensurePrivateContactChatThread(contactId) {
    return updatePrivateContactChatThread(contactId, thread => thread) || getPrivateContactChatThread(contactId);
}

function getPrivateContactChatMessage(messageId, contactId = privateActiveContactChatId) {
    const safeMessageId = String(messageId || '').trim();
    if (!safeMessageId) return null;
    const thread = getPrivateContactChatThread(contactId);
    return thread?.messages?.find(message => String(message.id || '').trim() === safeMessageId) || null;
}

function findPrivateContactChatMessageIndex(thread, messageId) {
    const safeMessageId = String(messageId || '').trim();
    if (!safeMessageId || !thread?.messages?.length) return -1;
    return thread.messages.findIndex(message => String(message.id || '').trim() === safeMessageId);
}

function getPrivateContactChatMessageIndex(messageId, contactId = privateActiveContactChatId) {
    const thread = getPrivateContactChatThread(contactId);
    return findPrivateContactChatMessageIndex(thread, messageId);
}

function canPrivateContactChatBacktrackMessage(messageId, contactId = privateActiveContactChatId) {
    const thread = getPrivateContactChatThread(contactId);
    const index = findPrivateContactChatMessageIndex(thread, messageId);
    return index >= 0 && index < (thread?.messages?.length || 0) - 1;
}

function getPrivateContactChatPreviousUserMessage(messageId, contactId = privateActiveContactChatId) {
    const thread = getPrivateContactChatThread(contactId);
    const index = findPrivateContactChatMessageIndex(thread, messageId);
    if (index <= 0) return null;
    for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
        const item = thread.messages[cursor];
        if (String(item?.role || '') === 'user') return item;
    }
    return null;
}

function canPrivateContactChatRerollMessage(messageId, contactId = privateActiveContactChatId) {
    const message = getPrivateContactChatMessage(messageId, contactId);
    if (!message || message.role !== 'assistant') return false;
    return Boolean(getPrivateContactChatPreviousUserMessage(messageId, contactId));
}

function canPrivateContactChatQuoteMessage(messageId, contactId = privateActiveContactChatId) {
    const message = getPrivateContactChatMessage(messageId, contactId);
    if (!message || message.recalled) return false;
    return ['user', 'assistant'].includes(String(message.role || ''));
}

function canPrivateContactChatEditMessage(messageId, contactId = privateActiveContactChatId) {
    const message = getPrivateContactChatMessage(messageId, contactId);
    return Boolean(message && ['user', 'assistant'].includes(String(message.role || '')) && !message.recalled);
}

function canPrivateContactChatFavoriteMessage(messageId, contactId = privateActiveContactChatId) {
    const message = getPrivateContactChatMessage(messageId, contactId);
    if (!message || message.recalled) return false;
    return ['user', 'assistant'].includes(String(message.role || ''));
}

function canPrivateContactChatRemoveMessage(messageId, contactId = privateActiveContactChatId) {
    const message = getPrivateContactChatMessage(messageId, contactId);
    return Boolean(message && ['user', 'assistant', 'system'].includes(String(message.role || '')));
}

function buildPrivateContactChatQuotePayload(message, contactId = privateActiveContactChatId) {
    if (!message) return null;
    const role = message.role === 'user' ? 'user' : 'assistant';
    const senderName = role === 'user'
        ? getPrivateDisplayName()
        : (getPrivateContactById(contactId)?.title || 'TA');
    return {
        type: 'quote',
        id: String(message.id || '').trim(),
        role,
        senderName,
        content: String(message.content || ''),
        createdAt: Number(message.createdAt) || 0
    };
}

function buildPrivateContactChatRecalledMessage(message, options = {}) {
    const actorRole = options.actorRole === 'assistant' ? 'assistant' : 'user';
    const actorName = String(
        options.actorName
        || (actorRole === 'assistant' ? getPrivateContactById(privateActiveContactChatId)?.title : getPrivateDisplayName())
        || (actorRole === 'assistant' ? 'TA' : '我')
    ).trim();
    return {
        id: String(message?.id || createPrivateContactChatMessageId('system')).trim(),
        role: 'system',
        content: actorRole === 'assistant' ? `“${actorName}”撤回了一条消息` : '你撤回了一条消息',
        createdAt: Date.now(),
        favorite: false,
        quote: null,
        recalled: true,
        recalledData: {
            type: 'recall',
            actorName,
            actorRole,
            wasCaught: Boolean(options.wasCaught),
            content: String(message?.content || '').replace(/\r/g, '').trim().slice(0, 1200),
            translation: normalizePrivateContactChatTranslationText(message?.translation || message?.translation_zh || ''),
            createdAt: Number(message?.createdAt) || 0
        }
    };
}

function syncPrivateContactChatQuoteSnapshots(messages = [], sourceMessage, contactId = privateActiveContactChatId) {
    const safeSourceMessage = sourceMessage && typeof sourceMessage === 'object' ? sourceMessage : null;
    const safeSourceId = String(safeSourceMessage?.id || '').trim();
    if (!safeSourceId) return normalizePrivateContactChatMessages(messages);
    const refreshedQuote = buildPrivateContactChatQuotePayload(safeSourceMessage, contactId);
    return normalizePrivateContactChatMessages(messages).map(message => (
        String(message?.quote?.id || '').trim() === safeSourceId
            ? { ...message, quote: refreshedQuote }
            : message
    ));
}

function getPrivateContactChatQuotedMessage() {
    const message = getPrivateContactChatMessage(privateContactChatQuotedMessageId);
    if (!message) return null;
    return buildPrivateContactChatQuotePayload(message);
}

function setPrivateContactChatQuotedMessage(messageId) {
    privateContactChatQuotedMessageId = String(messageId || '').trim();
    syncPrivateContactChatComposerUi();
}

function clearPrivateContactChatQuotedMessage() {
    privateContactChatQuotedMessageId = '';
    syncPrivateContactChatComposerUi();
}

function syncPrivateContactChatQuotedMessageState(contactId = privateActiveContactChatId) {
    if (!privateContactChatQuotedMessageId) return;
    if (!getPrivateContactChatMessage(privateContactChatQuotedMessageId, contactId)) {
        privateContactChatQuotedMessageId = '';
    }
}

function getPrivateContactChatSelectedMessageList(contactId = privateActiveContactChatId) {
    const thread = getPrivateContactChatThread(contactId);
    if (!thread?.messages?.length || !privateContactChatSelectedMessageIds.size) return [];
    return thread.messages.filter(message => privateContactChatSelectedMessageIds.has(String(message.id || '').trim()));
}

function getPrivateContactChatSelectionActionLabel(messages = getPrivateContactChatSelectedMessageList()) {
    if (!messages.length) return '删除/撤回';
    const hasUser = messages.some(message => message.role === 'user');
    const hasOthers = messages.some(message => message.role !== 'user');
    if (hasUser && hasOthers) return '删除/撤回';
    return hasUser ? '撤回' : '删除';
}

function syncPrivateContactChatSelectionUi() {
    const shell = document.getElementById('private-contact-chat-shell');
    const composer = document.getElementById('private-contact-chat-composer');
    const selectbar = document.getElementById('private-contact-chat-selectbar');
    const count = document.getElementById('private-contact-chat-select-count');
    const apply = document.getElementById('private-contact-chat-select-apply');
    shell?.classList.toggle('is-multi-selecting', privateContactChatSelectionMode);
    composer?.classList.toggle('is-multi-selecting', privateContactChatSelectionMode);
    if (selectbar) selectbar.hidden = !privateContactChatSelectionMode;
    const selectedMessages = getPrivateContactChatSelectedMessageList();
    if (count) count.textContent = privateContactChatSelectionMode ? `已选择 ${selectedMessages.length} 条消息` : '';
    if (apply) {
        apply.textContent = getPrivateContactChatSelectionActionLabel(selectedMessages);
        apply.disabled = !selectedMessages.length;
    }
    document.querySelectorAll('#private-contact-chat-content [data-private-contact-chat-message-id]').forEach(node => {
        const messageId = node.getAttribute('data-private-contact-chat-message-id') || '';
        node.classList.toggle('is-selected', privateContactChatSelectedMessageIds.has(messageId));
    });
}

function enterPrivateContactChatSelectionMode(initialMessageId = '') {
    privateContactChatSelectionMode = true;
    privateContactChatSelectedMessageIds = new Set();
    const safeMessageId = String(initialMessageId || '').trim();
    if (safeMessageId) privateContactChatSelectedMessageIds.add(safeMessageId);
    syncPrivateContactChatSelectionUi();
}

function exitPrivateContactChatSelectionMode() {
    privateContactChatSelectionMode = false;
    privateContactChatSelectedMessageIds = new Set();
    syncPrivateContactChatSelectionUi();
}

function togglePrivateContactChatSelectedMessage(messageId) {
    const safeMessageId = String(messageId || '').trim();
    if (!safeMessageId || !privateContactChatSelectionMode) return;
    if (privateContactChatSelectedMessageIds.has(safeMessageId)) privateContactChatSelectedMessageIds.delete(safeMessageId);
    else privateContactChatSelectedMessageIds.add(safeMessageId);
    syncPrivateContactChatSelectionUi();
}

function clearPrivateContactChatEphemeralState() {
    privateContactChatQuotedMessageId = '';
    privateContactChatMenuMessageId = '';
    privateContactChatEditMessageId = '';
    privateContactChatRecallDetailMessageId = '';
    exitPrivateContactChatSelectionMode();
}

function closePrivateContactChatAuxiliaryUi(instant = false) {
    clearPrivateContactChatMenuPressTimer();
    closePrivateContactChatActionMenu(instant);
    closePrivateContactChatConfirmModal(instant, false);
    closePrivateContactChatEditModal(instant);
    closePrivateContactChatRecallModal(instant);
    closePrivateContactChatPlaceholderEditor(instant);
}

function buildPrivateContactChatSubtitle(contact) {
    const profile = resolvePrivateContactGeneratedProfile(contact, getPrivateContactProfileRecord(contact));
    return trimPrivateContactChatSnippet(profile.signature || contact?.subtitle || 'PRIVATE LINE', 42) || 'PRIVATE LINE';
}

function buildPrivateContactChatAvatarInnerMarkup(avatar, fallbackText = '?') {
    const avatarSource = String(avatar || '').trim();
    if (avatarSource) {
        return `<img src="${escapePrivateHtml(avatarSource)}" alt="" draggable="false">`;
    }
    return escapePrivateHtml(fallbackText || '?');
}

function createPrivateContactChatMarkMarkup(source, className = 'private-contact-chat-face') {
    const avatar = String(source?.avatar || '').trim();
    const initial = escapePrivateHtml(getPrivateContactInitial(source));
    const safeClassName = String(className || 'private-contact-chat-face').trim() || 'private-contact-chat-face';
    return `<div class="${safeClassName}${avatar ? ' has-image' : ''}" aria-hidden="true">${buildPrivateContactChatAvatarInnerMarkup(avatar, initial)}</div>`;
}

function createPrivateContactChatSelfMarkup(className = 'private-contact-chat-self-face') {
    const avatar = String(privateState.avatar || '').trim();
    const initial = escapePrivateHtml(Array.from(getPrivateDisplayName())[0] || '我');
    const safeClassName = String(className || 'private-contact-chat-self-face').trim() || 'private-contact-chat-self-face';
    return `<div class="${safeClassName}${avatar ? ' has-image' : ''}" aria-hidden="true">${buildPrivateContactChatAvatarInnerMarkup(avatar, initial)}</div>`;
}

function createPrivateContactChatCheckMarkup() {
    return `
        <svg class="private-contact-chat-check" viewBox="0 0 22 16" aria-hidden="true">
            <path d="M-0.6 8.25 4.75 13.3 5.35 12.72"></path>
            <path d="M10.25 7.45 16.25 1.45"></path>
            <path d="M5.45 7.35 10.35 12.2 20.1 2.15"></path>
        </svg>
    `;
}

function getPrivateContactChatBubbleShapeClass(index, total, role) {
    if (role === 'system' || total <= 1) return 'is-single';
    if (index === 0) return 'is-first';
    if (index === total - 1) return 'is-last';
    return 'is-middle';
}

function renderPrivateContactChatQuoteMarkup(quote, role = 'assistant', shapeClass = 'is-single') {
    const safeQuote = normalizePrivateContactChatQuote(quote);
    if (!safeQuote) return '';
    return `
        <div class="private-contact-chat-inline-quote ${escapePrivateHtml(shapeClass)}${role === 'user' ? ' is-user' : ''}" data-private-contact-chat-quote-id="${escapePrivateHtml(safeQuote.id)}">
            <span class="private-contact-chat-inline-quote-head">
                <span class="private-contact-chat-inline-quote-sender">${escapePrivateHtml(safeQuote.senderName || (safeQuote.role === 'user' ? '我' : 'TA'))}</span>
                <span class="private-contact-chat-inline-quote-time">${escapePrivateHtml(formatPrivateContactChatTime(safeQuote.createdAt))}</span>
            </span>
            <span class="private-contact-chat-inline-quote-text">${escapePrivateHtml(trimPrivateContactChatSnippet(safeQuote.content, 78) || 'Quoted message')}</span>
        </div>
    `;
}

function getPrivateContactChatTranslationGroupKey(contact = {}, messages = []) {
    const lastMessage = Array.isArray(messages) ? messages[messages.length - 1] : null;
    const contactId = String(contact?.id || privateActiveContactChatId || '').trim();
    const messageId = String(lastMessage?.id || '').trim();
    return contactId && messageId ? `${contactId}:${messageId}` : messageId;
}

function renderPrivateContactChatTranslationMarkup(message, expanded = false) {
    const translation = normalizePrivateContactChatTranslationText(message?.translation || message?.translation_zh || '');
    if (!translation) return '';
    return `
        <div class="private-contact-chat-translation" data-private-contact-chat-translation="${escapePrivateHtml(String(message?.id || '').trim())}" ${expanded ? '' : 'hidden'}>
            ${formatPrivateContactChatHtml(translation)}
        </div>
    `;
}

function renderPrivateContactChatBubbleMarkup(message, index, total, role, options = {}) {
    const messageId = String(message?.id || '').trim();
    const favoriteClass = message?.favorite ? ' is-favorite' : '';
    const shapeClass = getPrivateContactChatBubbleShapeClass(index, total, role);
    const favoriteBadge = message?.favorite
        ? '<span class="private-contact-chat-bubble-favorite" aria-hidden="true">*</span>'
        : '';
    const translationMarkup = role === 'assistant' && options.translationEnabled
        ? renderPrivateContactChatTranslationMarkup(message, Boolean(options.translationExpanded))
        : '';
    return `
        <div class="private-contact-chat-bubble-wrap" data-private-contact-chat-message-id="${escapePrivateHtml(messageId)}" data-private-contact-chat-message-role="${escapePrivateHtml(role)}">
            <button class="interactive private-contact-chat-select-toggle" type="button" tabindex="-1" aria-hidden="true"></button>
            <div class="private-contact-chat-bubble-body">
                <div class="private-contact-chat-bubble ${shapeClass}${favoriteClass}" data-private-contact-chat-bubble tabindex="0">
                    ${favoriteBadge}
                    ${renderPrivateContactChatQuoteMarkup(message?.quote, role, shapeClass)}
                    <div class="private-contact-chat-bubble-text">${formatPrivateContactChatHtml(message?.content || '')}</div>
                </div>
                ${translationMarkup}
            </div>
        </div>
    `;
}

function renderPrivateContactChatSystemMessageMarkup(message) {
    const safeMessage = message || {};
    const messageId = escapePrivateHtml(String(safeMessage.id || '').trim());
    if (safeMessage.recalled && safeMessage.recalledData) {
        return `
            <div class="private-contact-chat-system is-recalled" data-private-contact-chat-system-id="${messageId}">
                <span class="private-contact-chat-system-text">${escapePrivateHtml(safeMessage.content || '你撤回了一条消息')}</span>
                <button class="interactive private-contact-chat-system-link" type="button" data-private-contact-chat-recall-detail="${messageId}">查看</button>
            </div>
        `;
    }
    return `<div class="private-contact-chat-system">${formatPrivateContactChatHtml(safeMessage.content || '')}</div>`;
}

function groupPrivateContactChatMessages(messages) {
    return normalizePrivateContactChatMessages(messages).reduce((groups, message) => {
        if (message.role === 'system') {
            groups.push({ type: 'system', messages: [message] });
            return groups;
        }
        const lastGroup = groups[groups.length - 1];
        if (lastGroup && lastGroup.type === 'chat' && lastGroup.role === message.role) {
            lastGroup.messages.push(message);
            return groups;
        }
        groups.push({
            type: 'chat',
            role: message.role,
            messages: [message]
        });
        return groups;
    }, []);
}

function getPrivateContactChatVisibleMessages(messages, contactId = privateActiveContactChatId) {
    const normalizedMessages = normalizePrivateContactChatMessages(messages);
    const safeContactId = String(contactId || '').trim();
    const isExpanded = safeContactId && safeContactId === String(privateContactChatHistoryExpandedId || '').trim();
    if (isExpanded || normalizedMessages.length <= PRIVATE_CONTACT_CHAT_PAGE_SIZE) {
        return {
            messages: normalizedMessages,
            hiddenCount: 0
        };
    }
    return {
        messages: normalizedMessages.slice(-PRIVATE_CONTACT_CHAT_PAGE_SIZE),
        hiddenCount: normalizedMessages.length - PRIVATE_CONTACT_CHAT_PAGE_SIZE
    };
}

function renderPrivateContactChatHistoryRevealMarkup(hiddenCount) {
    const count = Math.max(0, Number(hiddenCount) || 0);
    if (!count) return '';
    return `
        <button class="interactive private-contact-chat-history-reveal" type="button" data-private-contact-chat-expand-history>
            点击展开 ${escapePrivateHtml(count)} 条历史消息
        </button>
    `;
}

function renderPrivateContactChatGroup(contact, group) {
    if (!group || !Array.isArray(group.messages) || !group.messages.length) return '';
    if (group.type === 'system') {
        return renderPrivateContactChatSystemMessageMarkup(group.messages[0]);
    }
    const messages = group.messages;
    const role = group.role === 'user' ? 'user' : 'assistant';
    const lastMessage = messages[messages.length - 1];
    const timeMarkup = escapePrivateHtml(formatPrivateContactChatTime(lastMessage?.createdAt));
    const translationEnabled = role === 'assistant'
        && shouldPrivateContactChatShowTranslation(contact)
        && messages.some(message => normalizePrivateContactChatTranslationText(message?.translation || message?.translation_zh || ''));
    const translationGroupKey = translationEnabled ? getPrivateContactChatTranslationGroupKey(contact, messages) : '';
    const translationExpanded = translationEnabled && privateContactChatExpandedTranslationKeys.has(translationGroupKey);
    const bubbles = messages.map((message, index) => renderPrivateContactChatBubbleMarkup(message, index, messages.length, role, {
        translationEnabled,
        translationExpanded
    })).join('');
    if (role === 'user') {
        return `
            <article class="private-contact-chat-message is-user">
                <div class="private-contact-chat-stack">
                    ${bubbles}
                    <div class="private-contact-chat-meta">${timeMarkup}${createPrivateContactChatCheckMarkup()}</div>
                </div>
                ${createPrivateContactChatSelfMarkup()}
            </article>
        `;
    }
    const translationToggle = translationEnabled
        ? `<button class="interactive private-contact-chat-translation-toggle${translationExpanded ? ' is-active' : ''}" type="button" data-private-contact-chat-translation-toggle="${escapePrivateHtml(translationGroupKey)}" aria-expanded="${translationExpanded ? 'true' : 'false'}">翻译</button>`
        : '';
    return `
        <article class="private-contact-chat-message is-assistant${translationExpanded ? ' is-translation-expanded' : ''}"${translationEnabled ? ` data-private-contact-chat-translation-group="${escapePrivateHtml(translationGroupKey)}"` : ''}>
            ${createPrivateContactChatMarkMarkup(contact, 'private-contact-chat-face')}
            <div class="private-contact-chat-stack">
                <div class="private-contact-chat-tags">
                    <span class="private-contact-chat-tag">Private</span>
                    <span class="private-contact-chat-tag private-contact-chat-tag-soft">${escapePrivateHtml(String(contact?.title || 'Contact').trim() || 'Contact')}</span>
                </div>
                ${bubbles}
                <div class="private-contact-chat-meta">${timeMarkup}${translationToggle}</div>
            </div>
        </article>
    `;
}

function setPrivateContactChatTranslationGroupExpanded(groupKey, expanded) {
    const safeKey = String(groupKey || '').trim();
    if (!safeKey) return;
    if (expanded) privateContactChatExpandedTranslationKeys.add(safeKey);
    else privateContactChatExpandedTranslationKeys.delete(safeKey);
    document.querySelectorAll('[data-private-contact-chat-translation-group]').forEach(group => {
        if (String(group.getAttribute('data-private-contact-chat-translation-group') || '').trim() !== safeKey) return;
        group.classList.toggle('is-translation-expanded', Boolean(expanded));
        group.querySelectorAll('[data-private-contact-chat-translation]').forEach(node => {
            node.hidden = !expanded;
        });
        group.querySelectorAll('[data-private-contact-chat-translation-toggle]').forEach(button => {
            button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
            button.classList.toggle('is-active', Boolean(expanded));
        });
    });
}

function togglePrivateContactChatTranslationGroup(groupKey) {
    const safeKey = String(groupKey || '').trim();
    if (!safeKey) return;
    setPrivateContactChatTranslationGroupExpanded(
        safeKey,
        !privateContactChatExpandedTranslationKeys.has(safeKey)
    );
}

function buildPrivateContactChatThreadPreview(contact, thread) {
    const lastMessage = thread?.messages?.[thread.messages.length - 1];
    if (!lastMessage) {
        return trimPrivateContactChatSnippet(contact?.note || buildPrivateContactChatSubtitle(contact) || 'Tap to start a new chat.', 56);
    }
    if (lastMessage.role === 'system') {
        return trimPrivateContactChatSnippet(lastMessage.content || 'A chat update was recorded.', 56);
    }
    return trimPrivateContactChatSnippet(lastMessage.content || 'New message', 56);
}

function buildPrivateContactChatPreviewItems() {
    return getPrivateScopedContacts()
        .map(getPrivateHydratedContact)
        .map(contact => {
            const thread = getPrivateContactChatThread(contact.id);
            return {
                contact,
                threadId: createPrivateContactChatThreadId(contact.id),
                unread: Math.max(0, Number(thread?.unread) || 0),
                updatedAt: Number(thread?.updatedAt) || 0,
                preview: buildPrivateContactChatThreadPreview(contact, thread),
                time: formatPrivateContactChatListTime(thread?.updatedAt)
            };
        })
        .sort((a, b) => {
            const delta = (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0);
            if (delta) return delta;
            return String(a.contact?.title || '').localeCompare(String(b.contact?.title || ''), 'zh-CN');
        });
}

function syncPrivateContactChatExpandButton() {
    const button = document.getElementById('private-contact-chat-expand');
    if (!button) return;
    button.dataset.mode = 'more';
    button.setAttribute('aria-label', '更多功能');
    button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>';
}

function syncPrivateContactChatComposerUi() {
    const input = document.getElementById('private-contact-chat-input');
    const bar = document.getElementById('private-contact-chat-quotebar');
    const sender = document.getElementById('private-contact-chat-quote-sender');
    const content = document.getElementById('private-contact-chat-quote-content');
    const time = document.getElementById('private-contact-chat-quote-time');
    if (input) input.placeholder = getPrivateContactChatPlaceholder();
    syncPrivateContactChatExpandButton();
    const quote = getPrivateContactChatQuotedMessage();
    if (!bar || !sender || !content || !time) return;
    bar.hidden = !quote;
    if (!quote) return;
    sender.textContent = quote.senderName || (quote.role === 'user' ? '我' : 'TA');
    content.textContent = trimPrivateContactChatSnippet(quote.content, 96) || 'Quoted message';
    time.textContent = formatPrivateContactChatTime(quote.createdAt);
}

function scrollPrivateContactChatContentToBottom(behavior = 'auto') {
    const content = document.getElementById('private-contact-chat-content');
    if (!content) return;
    try {
        content.scrollTo({
            top: content.scrollHeight,
            behavior
        });
    } catch (error) {
        content.scrollTop = content.scrollHeight;
    }
}

function clearPrivateContactChatMenuPressTimer() {
    if (!privateContactChatMenuPressTimer) return;
    window.clearTimeout(privateContactChatMenuPressTimer);
    privateContactChatMenuPressTimer = 0;
}

function clearPrivateContactChatPlaceholderPressTimer() {
    if (!privateContactChatPlaceholderPressTimer) return;
    window.clearTimeout(privateContactChatPlaceholderPressTimer);
    privateContactChatPlaceholderPressTimer = 0;
}

function isPrimaryPrivateContactChatPointer(event) {
    return typeof event?.button !== 'number' || event.button === 0;
}

function getPrivateContactChatBubbleWrapFromTarget(target) {
    const bubble = target instanceof Element
        ? target.closest('[data-private-contact-chat-bubble]')
        : null;
    return bubble?.closest('[data-private-contact-chat-message-id]') || null;
}

function getPrivateContactChatInputShellFromTarget(target) {
    const shell = target instanceof Element
        ? target.closest('.private-contact-chat-input-shell')
        : null;
    if (!(shell instanceof HTMLElement)) return null;
    if (target instanceof Element && target.closest('button')) return null;
    const input = shell.querySelector('.private-contact-chat-input');
    if (input instanceof HTMLInputElement && String(input.value || '').trim()) return null;
    return shell;
}

function bindPrivateContactChatMenuGestures(page) {
    const content = page?.querySelector?.('#private-contact-chat-content');
    if (!content || content.dataset.chatMenuGesturesBound === 'true') return;
    content.dataset.chatMenuGesturesBound = 'true';

    const cancelPress = () => clearPrivateContactChatMenuPressTimer();

    content.addEventListener('click', event => {
        if (!privateContactChatSelectionMode) return;
        const bubbleWrap = getPrivateContactChatBubbleWrapFromTarget(event.target);
        if (!(bubbleWrap instanceof HTMLElement)) return;
        const messageId = String(bubbleWrap.getAttribute('data-private-contact-chat-message-id') || '').trim();
        if (!messageId) return;
        event.preventDefault();
        event.stopPropagation();
        togglePrivateContactChatSelectedMessage(messageId);
    });

    content.addEventListener('pointerdown', event => {
        if (privateContactChatSelectionMode) return;
        if (!isPrimaryPrivateContactChatPointer(event)) return;
        const bubbleWrap = getPrivateContactChatBubbleWrapFromTarget(event.target);
        if (!(bubbleWrap instanceof HTMLElement)) return;
        privateContactChatMenuPressX = Number(event.clientX) || 0;
        privateContactChatMenuPressY = Number(event.clientY) || 0;
        clearPrivateContactChatMenuPressTimer();
        privateContactChatMenuPressTimer = window.setTimeout(() => {
            privateContactChatMenuPressTimer = 0;
            openPrivateContactChatActionMenu(bubbleWrap);
            if (navigator.vibrate) navigator.vibrate(16);
        }, PRIVATE_CONTACT_CHAT_LONG_PRESS_MS);
    }, { passive: true });

    content.addEventListener('pointermove', event => {
        if (!privateContactChatMenuPressTimer) return;
        const deltaX = Math.abs((Number(event.clientX) || 0) - privateContactChatMenuPressX);
        const deltaY = Math.abs((Number(event.clientY) || 0) - privateContactChatMenuPressY);
        if (deltaX > PRIVATE_CONTACT_CHAT_MENU_MOVE_TOLERANCE || deltaY > PRIVATE_CONTACT_CHAT_MENU_MOVE_TOLERANCE) {
            cancelPress();
        }
    }, { passive: true });

    ['pointerup', 'pointercancel', 'pointerleave'].forEach(eventName => {
        content.addEventListener(eventName, cancelPress, { passive: true });
    });

    content.addEventListener('contextmenu', event => {
        const bubbleWrap = getPrivateContactChatBubbleWrapFromTarget(event.target);
        if (privateContactChatSelectionMode) {
            if (bubbleWrap instanceof HTMLElement) event.preventDefault();
            return;
        }
        if (!(bubbleWrap instanceof HTMLElement)) return;
        event.preventDefault();
        event.stopPropagation();
        clearPrivateContactChatMenuPressTimer();
        openPrivateContactChatActionMenu(bubbleWrap);
    });

    content.addEventListener('scroll', () => {
        clearPrivateContactChatMenuPressTimer();
        closePrivateContactChatActionMenu(true);
    }, { passive: true });
}

function bindPrivateContactChatPlaceholderGestures(page) {
    const inputShell = page?.querySelector?.('.private-contact-chat-input-shell');
    if (!inputShell || inputShell.dataset.placeholderGesturesBound === 'true') return;
    inputShell.dataset.placeholderGesturesBound = 'true';

    const cancelPress = () => clearPrivateContactChatPlaceholderPressTimer();

    inputShell.addEventListener('pointerdown', event => {
        if (!isPrimaryPrivateContactChatPointer(event)) return;
        const shell = getPrivateContactChatInputShellFromTarget(event.target);
        if (!(shell instanceof HTMLElement)) return;
        privateContactChatPlaceholderPressX = Number(event.clientX) || 0;
        privateContactChatPlaceholderPressY = Number(event.clientY) || 0;
        clearPrivateContactChatPlaceholderPressTimer();
        privateContactChatPlaceholderPressTimer = window.setTimeout(() => {
            privateContactChatPlaceholderPressTimer = 0;
            document.getElementById('private-contact-chat-input')?.blur();
            openPrivateContactChatPlaceholderEditor();
            if (navigator.vibrate) navigator.vibrate(12);
        }, PRIVATE_CONTACT_CHAT_PLACEHOLDER_LONG_PRESS_MS);
    }, { passive: true });

    inputShell.addEventListener('pointermove', event => {
        if (!privateContactChatPlaceholderPressTimer) return;
        const deltaX = Math.abs((Number(event.clientX) || 0) - privateContactChatPlaceholderPressX);
        const deltaY = Math.abs((Number(event.clientY) || 0) - privateContactChatPlaceholderPressY);
        if (deltaX > PRIVATE_CONTACT_CHAT_MENU_MOVE_TOLERANCE || deltaY > PRIVATE_CONTACT_CHAT_MENU_MOVE_TOLERANCE) {
            cancelPress();
        }
    }, { passive: true });

    ['pointerup', 'pointercancel', 'pointerleave'].forEach(eventName => {
        inputShell.addEventListener(eventName, cancelPress, { passive: true });
    });
}

function peekPrivateContactChatMessage(messageId, options = {}) {
    const safeMessageId = String(messageId || '').trim();
    if (!safeMessageId) {
        showPrivateSystemToast('此消息不存在。');
        return;
    }
    const escapedMessageId = typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
        ? CSS.escape(safeMessageId)
        : safeMessageId.replace(/["\\]/g, '\\$&');
    const target = document.querySelector(`#private-contact-chat-content [data-private-contact-chat-message-id="${escapedMessageId}"]`);
    const message = target?.closest('.private-contact-chat-message');
    if (!(target instanceof HTMLElement) || !message) {
        const hiddenMessage = getPrivateContactChatMessage(safeMessageId);
        if (hiddenMessage && String(privateContactChatHistoryExpandedId || '').trim() !== String(privateActiveContactChatId || '').trim()) {
            privateContactChatHistoryExpandedId = String(privateActiveContactChatId || '').trim();
            renderPrivateContactChatPage(privateActiveContactChatId, { scrollToTop: true });
            window.setTimeout(() => peekPrivateContactChatMessage(safeMessageId, { ...options, behavior: options.behavior || 'auto' }), 40);
            return;
        }
        showPrivateSystemToast('此消息不存在。');
        return;
    }
    try {
        message.scrollIntoView({
            behavior: options.behavior || 'smooth',
            block: 'center'
        });
    } catch (error) {
        message.scrollIntoView();
    }
    const ensureHighlight = () => {
        const content = document.getElementById('private-contact-chat-content');
        if (!(content instanceof HTMLElement)) return null;
        let highlight = content.querySelector('.private-contact-chat-peek-highlight');
        if (!(highlight instanceof HTMLElement)) {
            highlight = document.createElement('div');
            highlight.className = 'private-contact-chat-peek-highlight';
            highlight.setAttribute('aria-hidden', 'true');
            content.prepend(highlight);
        }
        return { content, highlight };
    };
    const countBubbleTextLines = bubbleNode => {
        const textNode = bubbleNode?.querySelector?.('.private-contact-chat-bubble-text');
        const plainText = String(textNode?.textContent || '').replace(/\s+/g, ' ').trim();
        if (!(textNode instanceof HTMLElement) || !plainText) return 0;
        const range = document.createRange();
        range.selectNodeContents(textNode);
        const lineRects = Array.from(range.getClientRects()).filter(rect => rect.width > 0.5 && rect.height > 0.5);
        if (typeof range.detach === 'function') range.detach();
        return lineRects.length || 1;
    };
    const updateHighlight = () => {
        const nodes = ensureHighlight();
        if (!nodes) return null;
        const { content, highlight } = nodes;
        const contentRect = content.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const bubble = target.querySelector('[data-private-contact-chat-bubble]');
        const bubbleRect = bubble instanceof HTMLElement ? bubble.getBoundingClientRect() : targetRect;
        const avatar = message.querySelector('.private-contact-chat-face, .private-contact-chat-self-face');
        const meta = message.querySelector('.private-contact-chat-meta');
        const tags = message.matches('.private-contact-chat-message.is-assistant')
            ? message.querySelector('.private-contact-chat-tags')
            : null;
        const bubbleLineCount = bubble instanceof HTMLElement ? countBubbleTextLines(bubble) : 0;
        const bubbleText = bubble?.querySelector?.('.private-contact-chat-bubble-text');
        const bubbleTextLength = Array.from(String(bubbleText?.textContent || '').replace(/\s+/g, '')).length;
        const isSingleBubble = bubble instanceof HTMLElement && bubble.classList.contains('is-single');
        const isFirstBubble = bubble instanceof HTMLElement && bubble.classList.contains('is-first');
        const isShortSingleLineBubble = (
            bubble instanceof HTMLElement
            && !bubble.querySelector('.private-contact-chat-inline-quote')
            && bubbleLineCount <= 1
            && bubbleTextLength > 0
            && bubbleTextLength <= 14
        );
        let topSourceRect = tags instanceof HTMLElement ? tags.getBoundingClientRect() : bubbleRect;
        let bottomSourceRect = bubbleRect;
        if (avatar instanceof HTMLElement) {
            const avatarRect = avatar.getBoundingClientRect();
            if (isSingleBubble) {
                topSourceRect = avatarRect;
                bottomSourceRect = meta instanceof HTMLElement ? meta.getBoundingClientRect() : bubbleRect;
            } else if (isFirstBubble && isShortSingleLineBubble) {
                topSourceRect = avatarRect;
                bottomSourceRect = avatarRect;
            }
        }
        const top = Math.max(0, Math.round(topSourceRect.top - contentRect.top + content.scrollTop) - 1);
        const bottom = Math.max(top + 1, Math.round(bottomSourceRect.bottom - contentRect.top + content.scrollTop) + 1);
        highlight.style.top = `${top}px`;
        highlight.style.height = `${bottom - top}px`;
        highlight.classList.remove('is-flashing');
        void highlight.offsetWidth;
        highlight.classList.add('is-flashing');
        return nodes;
    };
    const flash = () => {
        const nodes = updateHighlight();
        const content = nodes?.content;
        const highlight = nodes?.highlight;
        if (content?.__privateContactChatQuoteFlashTimer) {
            window.clearTimeout(content.__privateContactChatQuoteFlashTimer);
        }
        if (highlight instanceof HTMLElement) {
            content.__privateContactChatQuoteFlashTimer = window.setTimeout(() => {
                highlight.classList.remove('is-flashing');
                content.__privateContactChatQuoteFlashTimer = 0;
            }, PRIVATE_CONTACT_CHAT_QUOTE_FLASH_MS);
        }
    };
    window.setTimeout(flash, options.behavior === 'auto' ? 0 : 180);
}

function createPrivateContactChatShellMarkup() {
    return `
        <section class="private-contact-chat-shell" id="private-contact-chat-shell">
            <header class="private-contact-chat-header">
                <div class="private-contact-chat-header-left">
                    <button class="interactive private-contact-chat-back" type="button" data-private-contact-chat-back aria-label="返回聊天列表">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"></path></svg>
                    </button>
                    <div class="private-contact-chat-user">
                        <div class="private-contact-chat-avatar" id="private-contact-chat-avatar" aria-hidden="true">?</div>
                        <div class="private-contact-chat-user-copy">
                            <div class="private-contact-chat-name-row">
                                <div class="private-contact-chat-name" id="private-contact-chat-name">Online chat</div>
                                <span class="private-contact-chat-verified" aria-hidden="true">
                                    <svg viewBox="0 0 20 20" fill="none">
                                        <path d="M5.35 10.3 8.3 13.15 14.7 6.85"></path>
                                    </svg>
                                </span>
                            </div>
                            <div class="private-contact-chat-sub" id="private-contact-chat-sub">PRIVATE LINE</div>
                        </div>
                    </div>
                </div>
                <div class="private-contact-chat-tools" aria-hidden="true">
                    <span class="private-contact-chat-tool"><svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg></span>
                    <span class="private-contact-chat-tool"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="14" height="14" rx="2"></rect><path d="m17 10 4-2v8l-4-2"></path></svg></span>
                </div>
            </header>
            <div class="private-contact-chat-content" id="private-contact-chat-content" aria-live="polite"></div>
            <section class="private-contact-chat-composer" id="private-contact-chat-composer">
                <div class="private-contact-chat-quotebar" id="private-contact-chat-quotebar" hidden>
                    <div class="private-contact-chat-quotebar-copy">
                        <span class="private-contact-chat-quotebar-sender" id="private-contact-chat-quote-sender">引用消息</span>
                        <span class="private-contact-chat-quotebar-content" id="private-contact-chat-quote-content">消息内容</span>
                    </div>
                    <div class="private-contact-chat-quotebar-meta">
                        <span id="private-contact-chat-quote-time"></span>
                        <button class="interactive private-contact-chat-quotebar-clear" id="private-contact-chat-quote-clear" type="button" aria-label="取消引用">
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"></path></svg>
                        </button>
                    </div>
                </div>
                <div class="private-contact-chat-selectbar" id="private-contact-chat-selectbar" hidden>
                    <button class="interactive private-soft-button" id="private-contact-chat-select-cancel" type="button">取消</button>
                    <div class="private-contact-chat-select-count" id="private-contact-chat-select-count"></div>
                    <button class="interactive private-soft-button primary" id="private-contact-chat-select-apply" type="button">删除/撤回</button>
                </div>
                <form class="private-contact-chat-footer" id="private-contact-chat-form" autocomplete="off">
                    <div class="private-contact-chat-footer-row">
                        <button class="interactive private-contact-chat-camera" id="private-contact-chat-camera" type="button" aria-label="发送图片">
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h4l2-3h4l2 3h4v11H4z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                        </button>
                        <div class="private-contact-chat-input-shell">
                            <input class="private-contact-chat-input" id="private-contact-chat-input" name="private_contact_chat_input" type="text" placeholder="${escapePrivateHtml(getPrivateContactChatPlaceholder())}" autocomplete="off" aria-label="输入消息">
                            <div class="private-contact-chat-actions" aria-label="聊天工具">
                                <button class="interactive private-contact-chat-action" id="private-contact-chat-voice" type="button" aria-label="语音">
                                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 1 1-6 0V6a3 3 0 0 1 3-3z"></path><path d="M19 11a7 7 0 0 1-14 0"></path><path d="M12 18v3"></path><path d="M8 21h8"></path></svg>
                                </button>
                                <button class="interactive private-contact-chat-action" id="private-contact-chat-emoji" type="button" aria-label="表情包">
                                    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M8.5 15a4.2 4.2 0 0 0 7 0"></path><path d="M9 10h.01"></path><path d="M15 10h.01"></path></svg>
                                </button>
                                <button class="interactive private-contact-chat-expand" id="private-contact-chat-expand" type="button" aria-label="更多功能">
                                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </section>
        </section>
    `;
}

function ensurePrivateContactChatPage() {
    let page = document.getElementById('private-contact-chat-page');
    if (page) return page;
    const panelWrap = document.querySelector('.private-panel-wrap');
    if (!panelWrap) return null;
    page = document.createElement('section');
    page.className = 'private-pane private-contact-chat-pane';
    page.id = 'private-contact-chat-page';
    page.setAttribute('data-private-panel', 'contact-chat');
    page.setAttribute('aria-label', '在线聊天');
    page.innerHTML = createPrivateContactChatShellMarkup();
    panelWrap.appendChild(page);
    page.querySelector('#private-contact-chat-form')?.addEventListener('submit', event => {
        event.preventDefault();
        void submitPrivateContactChatComposer({ source: 'submit' });
    });
    page.querySelector('#private-contact-chat-input')?.addEventListener('input', () => {
        syncPrivateContactChatExpandButton();
    });
    page.querySelector('#private-contact-chat-input')?.addEventListener('keydown', event => {
        if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
        event.preventDefault();
        const hasText = Boolean(String(event.currentTarget?.value || '').trim());
        if (!hasText) {
            void submitPrivateContactChatComposer({ source: 'keyboard-enter' });
            return;
        }
        page.querySelector('#private-contact-chat-form')?.requestSubmit();
    });
    page.querySelector('#private-contact-chat-quote-clear')?.addEventListener('click', event => {
        event.preventDefault();
        clearPrivateContactChatQuotedMessage();
    });
    page.querySelector('#private-contact-chat-select-cancel')?.addEventListener('click', event => {
        event.preventDefault();
        exitPrivateContactChatSelectionMode();
    });
    page.querySelector('#private-contact-chat-select-apply')?.addEventListener('click', event => {
        event.preventDefault();
        void applyPrivateContactChatMultiSelectAction();
    });
    page.querySelector('#private-contact-chat-camera')?.addEventListener('click', event => {
        event.preventDefault();
        showPrivateSystemToast('Image sending is currently kept off to avoid broken uploads.');
    });
    page.querySelector('#private-contact-chat-voice')?.addEventListener('click', event => {
        event.preventDefault();
        showPrivateSystemToast('语音入口暂未启用。');
    });
    page.querySelector('#private-contact-chat-emoji')?.addEventListener('click', event => {
        event.preventDefault();
        const input = document.getElementById('private-contact-chat-input');
        if (!input) return;
        const nextValue = `${input.value || ''}${input.value ? ' ' : ''}♡`;
        input.value = nextValue.trimStart();
        input.focus();
        syncPrivateContactChatExpandButton();
    });
    page.querySelector('#private-contact-chat-expand')?.addEventListener('click', event => {
        event.preventDefault();
        showPrivateSystemToast('输入内容后按 Enter 发送；空输入时按 Enter 会立即调用生成回复；长按空白输入栏可修改占位文字。');
    });
    bindPrivateContactChatMenuGestures(page);
    bindPrivateContactChatPlaceholderGestures(page);
    return page;
}

function renderPrivateContactChatPage(contactId = privateActiveContactChatId, options = {}) {
    const page = ensurePrivateContactChatPage();
    if (!page) return;
    const rawContact = getPrivateContactById(contactId);
    const contact = rawContact ? getPrivateHydratedContact(rawContact) : null;
    const thread = contact ? ensurePrivateContactChatThread(contact.id) : null;
    const avatar = page.querySelector('#private-contact-chat-avatar');
    const name = page.querySelector('#private-contact-chat-name');
    const sub = page.querySelector('#private-contact-chat-sub');
    const content = page.querySelector('#private-contact-chat-content');
    if (!avatar || !name || !sub || !content) return;
    if (!contact || !thread) {
        avatar.className = 'private-contact-chat-avatar';
        avatar.removeAttribute('style');
        avatar.innerHTML = buildPrivateContactChatAvatarInnerMarkup('', '?');
        name.textContent = 'Online chat';
        sub.textContent = 'PRIVATE LINE';
        content.innerHTML = '<div class="private-contact-chat-empty"><small>ONLINE CHAT</small><p>Select a contact to start chatting.</p></div>';
        syncPrivateContactChatQuotedMessageState();
        syncPrivateContactChatComposerUi();
        syncPrivateContactChatSelectionUi();
        return;
    }
    const avatarSource = String(contact.avatar || '').trim();
    avatar.className = `private-contact-chat-avatar${avatarSource ? ' has-image' : ''}`;
    avatar.removeAttribute('style');
    avatar.innerHTML = buildPrivateContactChatAvatarInnerMarkup(avatarSource, getPrivateContactInitial(contact) || '?');
    name.textContent = String(contact.title || 'Contact').trim();
    sub.textContent = buildPrivateContactChatSubtitle(contact);
    const visibleThread = getPrivateContactChatVisibleMessages(thread.messages, contact.id);
    const groups = groupPrivateContactChatMessages(visibleThread.messages);
    const isSending = String(privateContactChatSendingId || '').trim() === String(contact.id || '').trim();
    const historyMarkup = renderPrivateContactChatHistoryRevealMarkup(visibleThread.hiddenCount);
    const chatMarkup = groups.length
        ? `${historyMarkup}${groups.map(group => renderPrivateContactChatGroup(contact, group)).join('')}`
        : '<div class="private-contact-chat-empty"><small>ONLINE CHAT</small><p>Keep it slow. Only your manual messages are stored here.</p></div>';
    const typingMarkup = isSending
        ? `
            <article class="private-contact-chat-message is-assistant is-typing">
                ${createPrivateContactChatMarkMarkup(contact, 'private-contact-chat-face')}
                <div class="private-contact-chat-stack">
                    <div class="private-contact-chat-bubble private-contact-chat-bubble-typing">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            </article>
        `
        : '';
    content.innerHTML = `${chatMarkup}${typingMarkup}`;
    syncPrivateContactChatQuotedMessageState(contact.id);
    syncPrivateContactChatComposerUi();
    syncPrivateContactChatSelectionUi();
    requestAnimationFrame(() => {
        if (options.scrollToTop) {
            try {
                content.scrollTo({ top: 0, behavior: 'auto' });
            } catch (error) {
                content.scrollTop = 0;
            }
            return;
        }
        if (options.scrollToBottom !== false) {
            scrollPrivateContactChatContentToBottom('auto');
        }
    });
}

function hasPrivateContactGeneratedProfile(contact = {}) {
    return Boolean(
        Number(contact?.generatedProfileAt)
        || String(contact?.signature || '').trim()
        || String(contact?.profession || '').trim()
        || String(contact?.phoneNumber || '').trim()
        || String(contact?.ipCity || '').trim()
        || String(contact?.homeAddress || '').trim()
        || normalizePrivateContactLifeStages(contact?.lifeStages).length
    );
}

function buildPrivateContactChatGenerationRecord(contact = {}) {
    const linkedRecord = getPrivateContactProfileRecord(contact);
    if (linkedRecord) return linkedRecord;
    const normalizedType = normalizePrivateDossierType(contact?.dossierType);
    const inferredType = normalizedType || (String(contact?.type || '').includes('npc') ? 'npc' : 'char');
    return {
        type: inferredType,
        recordId: String(contact?.dossierRecordId || contact?.id || `contact-${Date.now()}`).trim(),
        accountId: normalizePrivateDossierAccount(contact?.accountId) || '',
        name: String(contact?.title || '未命名角色').trim(),
        nickname: String(contact?.title || contact?.subtitle || '').trim(),
        avatar: String(contact?.avatar || ''),
        setting: String(contact?.note || '').trim(),
        gender: '',
        nationality: String(contact?.nationality || '').trim(),
        monologue: String(contact?.signature || '').trim(),
        socialFollowers: '',
        socialFollowing: '',
        socialOthers: '',
        followedBy: []
    };
}

/* ==========================================================================
 * 在线聊天页行为约束：
 * 1. 用户输入内容后按 Enter 手动发送。
 * 2. 在线聊天页只保存手动发送内容，不会自动触发角色回复。
 * 3. 输入框为空时，按键盘 Enter 会立即调用一次联系人回复生成。
 * 4. 角色资料补全只在显式资料生成链路里触发，且不会反复刷新已有角色资料。
 * ========================================================================== */
async function triggerPrivateContactChatRoleGeneration(options = {}) {
    const safeContactId = String(options.contactId || privateActiveContactChatId).trim();
    const input = document.getElementById('private-contact-chat-input');
    const rawContact = getPrivateContactById(safeContactId);
    const contact = rawContact ? getPrivateHydratedContact(rawContact) : null;
    if (!contact) {
        syncPrivateContactChatComposerUi();
        return false;
    }

    const pendingKey = `${PRIVATE_CONTACT_CHAT_ROLE_GENERATION_PENDING_PREFIX}${safeContactId}`;
    if (privatePendingContactGenerationKeys.has(pendingKey)) {
        showPrivateSystemToast('当前角色资料仍在生成中。');
        input?.focus();
        return false;
    }

    const record = buildPrivateContactChatGenerationRecord(contact);
    const hadProfile = hasPrivateContactGeneratedProfile(contact);
    privatePendingContactGenerationKeys.add(pendingKey);
    showPrivateSystemToast(hadProfile ? '正在刷新当前角色资料...' : '正在生成当前角色资料...');

    try {
        let generatedProfile = null;
        try {
            generatedProfile = await generatePrivateContactProfileWithApi(record, contact);
        } catch (error) {
            console.warn('Private contact chat role generation failed:', error);
            generatedProfile = buildPrivateContactGeneratedProfile(record, {}, contact);
            showPrivateSystemToast('API 暂未返回，已按设定补全当前角色资料。');
        }

        const contacts = getPrivateScopedContacts().map(item => (
            String(item?.id || '').trim() === safeContactId
                ? { ...item, ...generatedProfile }
                : item
        ));
        setPrivateScopedContacts(contacts);
        renderPrivateContacts();
        renderPrivateThreads();
        if (privateActiveContactChatId === safeContactId) renderPrivateContactChatPage(safeContactId);
        await savePrivateState();
        requestAnimationFrame(() => input?.focus());
        showPrivateSystemToast(`当前角色资料已${hadProfile ? '刷新' : '生成'}。`);
        return true;
    } finally {
        privatePendingContactGenerationKeys.delete(pendingKey);
    }
}

async function submitPrivateContactChatComposer(options = {}) {
    const input = document.getElementById('private-contact-chat-input');
    const source = String(options.source || '').trim();
    const hasText = Boolean(String(input?.value || '').trim());
    if (hasText) return sendPrivateContactChatMessage();
    if (getPrivateContactChatQuotedMessage()) {
        syncPrivateContactChatComposerUi();
        return false;
    }
    const safeContactId = String(options.contactId || privateActiveContactChatId).trim();
    const rawContact = getPrivateContactById(safeContactId);
    const contact = rawContact ? getPrivateHydratedContact(rawContact) : null;
    if (!contact) {
        syncPrivateContactChatComposerUi();
        return false;
    }
    if (source === 'keyboard-enter') {
        return requestPrivateContactChatAssistantReply(contact);
    }
    if (hasPrivateContactGeneratedProfile(contact)) {
        syncPrivateContactChatComposerUi();
        return false;
    }
    return triggerPrivateContactChatRoleGeneration({
        ...options,
        contactId: safeContactId
    });
}

async function sendPrivateContactChatMessage() {
    const input = document.getElementById('private-contact-chat-input');
    const rawContact = getPrivateContactById(privateActiveContactChatId);
    const contact = rawContact ? getPrivateHydratedContact(rawContact) : null;
    const value = input?.value.trim() || '';
    if (!contact || !value || privateContactChatSendingId) {
        syncPrivateContactChatExpandButton();
        return;
    }
    exitPrivateContactChatSelectionMode();
    closePrivateContactChatActionMenu(true);
    const quoted = getPrivateContactChatQuotedMessage();
    updatePrivateContactChatThread(contact.id, thread => ({
        ...thread,
        unread: 0,
        updatedAt: Date.now(),
        messages: [
            ...thread.messages,
            {
                id: createPrivateContactChatMessageId('user'),
                role: 'user',
                content: value,
                createdAt: Date.now(),
                quote: quoted
            }
        ]
    }));
    if (input) input.value = '';
    privateContactChatQuotedMessageId = '';
    renderPrivateThreads();
    renderPrivateContactChatPage(contact.id);
    await savePrivateState();
    requestAnimationFrame(() => {
        syncPrivateContactChatComposerUi();
        scrollPrivateContactChatContentToBottom('smooth');
        input?.focus();
    });
    return true;
}

function openPrivateContactChat(contactId, returnTab = 'contacts') {
    const contact = getPrivateContactById(contactId);
    if (!contact) return;
    closePrivateContactChatAuxiliaryUi(true);
    privateActiveContactChatId = String(contact.id || '').trim();
    privateContactChatReturnTab = returnTab || 'contacts';
    privateContactChatHistoryExpandedId = '';
    clearPrivateContactChatEphemeralState();
    ensurePrivateContactChatThread(privateActiveContactChatId);
    renderPrivateThreads();
    renderPrivateContactChatPage(privateActiveContactChatId);
    switchPrivateTab('contact-chat');
    window.setTimeout(() => document.getElementById('private-contact-chat-input')?.focus(), 60);
}

function closePrivateContactChat(instant = false) {
    closePrivateContactChatAuxiliaryUi(true);
    clearPrivateContactChatEphemeralState();
    const chatScreen = document.querySelector('.private-chat-screen');
    if (chatScreen?.getAttribute('data-private-current-tab') !== 'contact-chat') return;
    const completeClose = () => {
        switchPrivateTab(privateContactChatReturnTab || 'whisper');
        if (privateContactChatReturnTab === 'whisper') {
            chatScreen?.classList.add('private-contact-chat-returning');
            window.setTimeout(() => chatScreen?.classList.remove('private-contact-chat-returning'), 260);
        }
    };
    if (instant) {
        completeClose();
        return;
    }
    chatScreen?.classList.add('private-contact-chat-closing');
    window.setTimeout(() => {
        chatScreen?.classList.remove('private-contact-chat-closing');
        completeClose();
    }, 160);
}

async function copyPrivateTextToClipboard(text) {
    const value = String(text || '').trim();
    if (!value) return false;
    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(value);
            return true;
        }
    } catch (error) {
        console.warn('Private chat clipboard write failed:', error);
    }
    const field = document.createElement('textarea');
    field.value = value;
    field.setAttribute('readonly', 'readonly');
    field.style.position = 'fixed';
    field.style.left = '-9999px';
    document.body.appendChild(field);
    field.select();
    const copied = document.execCommand('copy');
    field.remove();
    return copied;
}

function setPrivateContactChatActionMenuPage(pageIndex = 0) {
    const menu = document.getElementById('private-contact-chat-action-menu');
    const track = document.getElementById('private-contact-chat-action-menu-track');
    const prev = menu?.querySelector('[data-private-contact-chat-action-nav="prev"]');
    const next = menu?.querySelector('[data-private-contact-chat-action-nav="next"]');
    if (!menu || !track) return;
    const maxIndex = Math.max(0, PRIVATE_CONTACT_CHAT_MENU_PAGES.length - 1);
    const safePage = Math.max(0, Math.min(maxIndex, Number(pageIndex) || 0));
    menu.dataset.page = String(safePage);
    track.style.transform = `translateX(${-100 * safePage}%)`;
    if (prev) prev.hidden = safePage <= 0;
    if (next) next.hidden = safePage >= maxIndex;
}

function syncPrivateContactChatActionMenuState() {
    const menu = document.getElementById('private-contact-chat-action-menu');
    if (!menu) return;
    const message = getPrivateContactChatMessage(privateContactChatMenuMessageId);
    const dynamicLabels = {
        copy: '复制',
        edit: '编辑',
        favorite: '收藏',
        quote: '引用',
        'multi-select': '多选',
        backtrack: '回溯',
        remove: message?.role === 'user' ? '撤回' : '删除',
        reroll: '重回'
    };
    menu.querySelectorAll('[data-private-contact-chat-action]').forEach(chip => {
        const action = chip.getAttribute('data-private-contact-chat-action') || '';
        const label = chip.querySelector('.private-contact-chat-action-label');
        let disabled = false;
        if (!message) {
            disabled = true;
        } else if (action === 'copy') {
            disabled = !String(message.content || '').trim();
        } else if (action === 'edit') {
            disabled = !canPrivateContactChatEditMessage(message.id);
        } else if (action === 'favorite') {
            disabled = !canPrivateContactChatFavoriteMessage(message.id);
        } else if (action === 'quote') {
            disabled = !canPrivateContactChatQuoteMessage(message.id);
        } else if (action === 'backtrack') {
            disabled = !canPrivateContactChatBacktrackMessage(message.id);
        } else if (action === 'remove') {
            disabled = !canPrivateContactChatRemoveMessage(message.id);
        } else if (action === 'reroll') {
            disabled = !canPrivateContactChatRerollMessage(message.id);
        }
        if (label) label.textContent = dynamicLabels[action] || action;
        chip.disabled = disabled;
        chip.classList.toggle('is-active', action === 'favorite' && Boolean(message?.favorite));
        chip.classList.toggle('is-role-disabled', action === 'reroll' && message?.role === 'user');
    });
}

function ensurePrivateContactChatActionMenu() {
    let menu = document.getElementById('private-contact-chat-action-menu');
    if (menu) return menu;
    const privateApp = document.getElementById('private-app');
    if (!privateApp) return null;
    const labels = {
        copy: '复制',
        edit: '编辑',
        favorite: '收藏',
        quote: '引用',
        'multi-select': '多选',
        backtrack: '回溯',
        remove: '删除',
        reroll: '重回'
    };
    menu = document.createElement('div');
    menu.className = 'private-contact-chat-action-menu';
    menu.id = 'private-contact-chat-action-menu';
    menu.hidden = true;
    menu.innerHTML = `
        <div class="private-contact-chat-action-menu-panel" id="private-contact-chat-action-menu-panel">
            <button class="interactive private-contact-chat-action-nav is-prev" type="button" data-private-contact-chat-action-nav="prev" aria-label="上一页" hidden></button>
            <div class="private-contact-chat-action-menu-viewport">
                <div class="private-contact-chat-action-menu-track" id="private-contact-chat-action-menu-track">
                    ${PRIVATE_CONTACT_CHAT_MENU_PAGES.map((page, pageIndex) => `
                        <div class="private-contact-chat-action-menu-page" data-private-contact-chat-action-page="${pageIndex}">
                            ${page.map(action => `
                                <button class="interactive private-contact-chat-action-chip" type="button" data-private-contact-chat-action="${action}">
                                    <span class="private-contact-chat-action-label">${labels[action] || action}</span>
                                </button>
                            `).join('')}
                        </div>
                    `).join('')}
                </div>
            </div>
            <button class="interactive private-contact-chat-action-nav is-next" type="button" data-private-contact-chat-action-nav="next" aria-label="下一页"></button>
        </div>
    `;
    privateApp.appendChild(menu);
    menu.addEventListener('click', event => {
        const panel = document.getElementById('private-contact-chat-action-menu-panel');
        if (!panel) return;
        if (event.target instanceof Element && !panel.contains(event.target)) {
            event.preventDefault();
            closePrivateContactChatActionMenu();
            return;
        }
        const nav = event.target instanceof Element
            ? event.target.closest('[data-private-contact-chat-action-nav]')
            : null;
        if (nav) {
            event.preventDefault();
            const direction = nav.getAttribute('data-private-contact-chat-action-nav') === 'prev' ? -1 : 1;
            const currentPage = Number(menu.dataset.page) || 0;
            setPrivateContactChatActionMenuPage(currentPage + direction);
            return;
        }
        const actionButton = event.target instanceof Element
            ? event.target.closest('[data-private-contact-chat-action]')
            : null;
        if (!actionButton || actionButton.disabled) return;
        event.preventDefault();
        void handlePrivateContactChatAction(actionButton.getAttribute('data-private-contact-chat-action') || '');
    });
    menu.addEventListener('contextmenu', event => {
        event.preventDefault();
    });
    document.addEventListener('pointerdown', event => {
        const activeMenu = document.getElementById('private-contact-chat-action-menu');
        const panel = document.getElementById('private-contact-chat-action-menu-panel');
        if (!activeMenu || activeMenu.hidden || !activeMenu.classList.contains('active') || !panel) return;
        if (event.target instanceof Element && panel.contains(event.target)) return;
        closePrivateContactChatActionMenu();
    }, true);
    setPrivateContactChatActionMenuPage(0);
    return menu;
}

function closePrivateContactChatActionMenu(instant = false) {
    const menu = document.getElementById('private-contact-chat-action-menu');
    const bubble = privateContactChatMenuMessageId
        ? document.querySelector(`#private-contact-chat-content [data-private-contact-chat-message-id="${(typeof CSS !== 'undefined' && CSS.escape) ? CSS.escape(privateContactChatMenuMessageId) : privateContactChatMenuMessageId.replace(/["\\]/g, '\\$&')}"]`)
        : null;
    bubble?.classList.remove('is-menu-active');
    privateContactChatMenuMessageId = '';
    if (!menu) return;
    menu.classList.remove('active');
    const hide = () => {
        if (!menu.classList.contains('active')) menu.hidden = true;
    };
    if (instant) hide();
    else window.setTimeout(hide, 180);
}

function openPrivateContactChatActionMenu(bubbleWrap) {
    if (!(bubbleWrap instanceof HTMLElement)) return;
    if (privateContactChatSelectionMode) return;
    const messageId = String(bubbleWrap.getAttribute('data-private-contact-chat-message-id') || '').trim();
    if (!messageId) return;
    const menu = ensurePrivateContactChatActionMenu();
    const panel = document.getElementById('private-contact-chat-action-menu-panel');
    if (!menu || !panel) return;
    document.querySelectorAll('#private-contact-chat-content .is-menu-active').forEach(node => node.classList.remove('is-menu-active'));
    bubbleWrap.classList.add('is-menu-active');
    privateContactChatMenuMessageId = messageId;
    syncPrivateContactChatActionMenuState();
    setPrivateContactChatActionMenuPage(0);
    menu.dataset.side = bubbleWrap.getAttribute('data-private-contact-chat-message-role') === 'user' ? 'right' : 'left';
    menu.hidden = false;
    requestAnimationFrame(() => {
        menu.classList.add('active');
        const bubble = bubbleWrap.querySelector('[data-private-contact-chat-bubble]') || bubbleWrap;
        const bubbleRect = bubble.getBoundingClientRect();
        const panelRect = panel.getBoundingClientRect();
        const top = Math.max(
            16,
            Math.min(
                bubbleRect.top - panelRect.height - 12,
                window.innerHeight - panelRect.height - 16
            )
        );
        const left = Math.max(
            18,
            Math.min(
                menu.dataset.side === 'right'
                    ? bubbleRect.right - panelRect.width
                    : bubbleRect.left,
                window.innerWidth - panelRect.width - 18
            )
        );
        panel.style.top = `${Math.max(16, top)}px`;
        panel.style.left = `${left}px`;
    });
}

function ensurePrivateContactChatConfirmModal() {
    let modal = document.getElementById('private-contact-chat-confirm-modal');
    if (modal) return modal;
    const privateApp = document.getElementById('private-app');
    if (!privateApp) return null;
    modal = document.createElement('div');
    modal.className = 'private-user-preset-modal private-contact-chat-confirm-modal api-preset-modal';
    modal.id = 'private-contact-chat-confirm-modal';
    modal.hidden = true;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'private-contact-chat-confirm-title');
    modal.innerHTML = `
        <section class="private-user-preset-dialog private-contact-chat-confirm-dialog api-preset-dialog">
            <div class="private-user-preset-head private-contact-chat-confirm-head api-modal-head">
                <div class="private-contact-chat-confirm-copy">
                    <div class="private-section-label api-modal-kicker" id="private-contact-chat-confirm-kicker">快捷操作</div>
                    <h2 class="api-modal-title" id="private-contact-chat-confirm-title">确认操作</h2>
                    <p id="private-contact-chat-confirm-text">确定继续吗？</p>
                </div>
            </div>
            <div class="private-contact-chat-confirm-actions api-modal-actions">
                <button class="interactive private-soft-button" id="private-contact-chat-confirm-cancel" type="button">取消</button>
                <button class="interactive private-soft-button primary" id="private-contact-chat-confirm-accept" type="button">继续</button>
            </div>
        </section>
    `;
    const resolve = value => {
        const handler = privateContactChatConfirmResolver;
        privateContactChatConfirmResolver = null;
        closePrivateContactChatConfirmModal();
        if (typeof handler === 'function') handler(Boolean(value));
    };
    bindPrivateBackdropDismiss(modal, '.private-contact-chat-confirm-dialog', () => resolve(false));
    modal.querySelector('#private-contact-chat-confirm-cancel')?.addEventListener('click', () => resolve(false));
    modal.querySelector('#private-contact-chat-confirm-accept')?.addEventListener('click', () => resolve(true));
    privateApp.appendChild(modal);
    return modal;
}

function openPrivateContactChatConfirmModal(options = {}) {
    const modal = ensurePrivateContactChatConfirmModal();
    if (!modal) return Promise.resolve(false);
    document.getElementById('private-contact-chat-confirm-kicker').textContent = options.kicker || '快捷操作';
    document.getElementById('private-contact-chat-confirm-title').textContent = options.title || '确认操作';
    document.getElementById('private-contact-chat-confirm-text').textContent = options.text || '确定继续吗？';
    const cancel = document.getElementById('private-contact-chat-confirm-cancel');
    const accept = document.getElementById('private-contact-chat-confirm-accept');
    if (cancel) cancel.textContent = options.cancelLabel || '取消';
    if (accept) accept.textContent = options.acceptLabel || '继续';
    if (typeof privateContactChatConfirmResolver === 'function') privateContactChatConfirmResolver(false);
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('active'));
    return new Promise(resolve => {
        privateContactChatConfirmResolver = resolve;
    });
}

function closePrivateContactChatConfirmModal(instant = false, resolvedValue = null) {
    const modal = document.getElementById('private-contact-chat-confirm-modal');
    const shouldResolve = resolvedValue !== null;
    const resolver = shouldResolve ? privateContactChatConfirmResolver : null;
    if (shouldResolve) privateContactChatConfirmResolver = null;
    if (modal) {
        modal.classList.remove('active');
        const hide = () => {
            if (!modal.classList.contains('active')) modal.hidden = true;
        };
        if (instant) hide();
        else window.setTimeout(hide, 180);
    }
    if (typeof resolver === 'function') resolver(Boolean(resolvedValue));
}

function ensurePrivateContactChatEditModal() {
    let modal = document.getElementById('private-contact-chat-edit-modal');
    if (modal) return modal;
    const privateApp = document.getElementById('private-app');
    if (!privateApp) return null;
    modal = document.createElement('div');
    modal.className = 'private-user-preset-modal private-contact-chat-edit-modal api-preset-modal';
    modal.id = 'private-contact-chat-edit-modal';
    modal.hidden = true;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'private-contact-chat-edit-title');
    modal.innerHTML = `
        <form class="private-user-preset-dialog private-contact-chat-edit-dialog api-preset-dialog" id="private-contact-chat-edit-form" autocomplete="off">
            <div class="private-user-preset-head private-contact-chat-edit-head api-modal-head">
            <div class="private-contact-chat-edit-copy">
                <div class="private-section-label api-modal-kicker">消息编辑</div>
                <h2 id="private-contact-chat-edit-title">编辑消息</h2>
                <p>这里只会修改 Rinno 当前联系人会话里的本地记录。</p>
            </div>
            </div>
            <label class="private-contact-chat-edit-field" for="private-contact-chat-edit-input">
                <span>消息内容</span>
                <textarea class="private-contact-chat-edit-input" id="private-contact-chat-edit-input" rows="6" maxlength="1200" placeholder="输入要修改的消息"></textarea>
            </label>
            <div class="private-contact-chat-edit-meta">
                <span>仅本地会话</span>
                <span id="private-contact-chat-edit-count">0 / 1200</span>
            </div>
            <div class="private-contact-chat-edit-actions">
                <button class="interactive private-soft-button" id="private-contact-chat-edit-dismiss" type="button">取消</button>
                <button class="interactive private-soft-button primary" id="private-contact-chat-edit-save" type="submit">保存</button>
            </div>
        </form>
    `;
    const syncCount = () => {
        const input = document.getElementById('private-contact-chat-edit-input');
        const counter = document.getElementById('private-contact-chat-edit-count');
        if (!input || !counter) return;
        counter.textContent = `${String(input.value || '').length} / 1200`;
    };
    bindPrivateBackdropDismiss(modal, '.private-contact-chat-edit-dialog', () => closePrivateContactChatEditModal());
    modal.querySelector('#private-contact-chat-edit-dismiss')?.addEventListener('click', () => closePrivateContactChatEditModal());
    modal.querySelector('#private-contact-chat-edit-input')?.addEventListener('input', syncCount);
    modal.querySelector('#private-contact-chat-edit-form')?.addEventListener('submit', async event => {
        event.preventDefault();
        const input = document.getElementById('private-contact-chat-edit-input');
        const contact = getPrivateContactById(privateActiveContactChatId);
        if (!input || !contact || !privateContactChatEditMessageId) return;
        const nextValue = String(input.value || '').trim();
        if (!nextValue) return;
        updatePrivateContactChatThread(contact.id, thread => ({
            ...thread,
            updatedAt: Date.now(),
            messages: (() => {
                let editedMessage = null;
                const nextMessages = thread.messages.map(message => {
                    if (String(message.id || '').trim() !== privateContactChatEditMessageId) return message;
                    editedMessage = { ...message, content: nextValue, translation: '' };
                    return editedMessage;
                });
                return editedMessage
                    ? syncPrivateContactChatQuoteSnapshots(nextMessages, editedMessage, contact.id)
                    : nextMessages;
            })()
        }));
        renderPrivateThreads();
        renderPrivateContactChatPage(contact.id);
        await savePrivateState();
        closePrivateContactChatEditModal();
        showPrivateSystemToast('已更新这条消息，并同步到当前会话记忆。');
    });
    privateApp.appendChild(modal);
    return modal;
}

function openPrivateContactChatEditModal(messageId) {
    const modal = ensurePrivateContactChatEditModal();
    const message = getPrivateContactChatMessage(messageId);
    if (!modal || !message || !canPrivateContactChatEditMessage(messageId)) return;
    privateContactChatEditMessageId = String(message.id || '').trim();
    setPrivateFieldValue('private-contact-chat-edit-input', message.content || '');
    const counter = document.getElementById('private-contact-chat-edit-count');
    if (counter) counter.textContent = `${String(message.content || '').length} / 1200`;
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('active'));
    window.setTimeout(() => document.getElementById('private-contact-chat-edit-input')?.focus(), 80);
}

function closePrivateContactChatEditModal(instant = false) {
    const modal = document.getElementById('private-contact-chat-edit-modal');
    if (!modal) return;
    privateContactChatEditMessageId = '';
    modal.classList.remove('active');
    const hide = () => {
        if (!modal.classList.contains('active')) modal.hidden = true;
    };
    if (instant) hide();
    else window.setTimeout(hide, 180);
}

function ensurePrivateContactChatRecallModal() {
    let modal = document.getElementById('private-contact-chat-recall-modal');
    if (modal) return modal;
    const privateApp = document.getElementById('private-app');
    if (!privateApp) return null;
    modal = document.createElement('div');
    modal.className = 'private-user-preset-modal private-contact-chat-recall-modal api-preset-modal';
    modal.id = 'private-contact-chat-recall-modal';
    modal.hidden = true;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'private-contact-chat-recall-title');
    modal.innerHTML = `
        <section class="private-user-preset-dialog private-contact-chat-recall-dialog api-preset-dialog">
            <div class="private-user-preset-head private-contact-chat-recall-head api-modal-head">
                <div class="private-contact-chat-recall-copy">
                    <div class="private-section-label api-modal-kicker">撤回记录</div>
                    <h2 id="private-contact-chat-recall-title">查看撤回内容</h2>
                    <p>这里会保留这次撤回的本地记录，用来维持 Rinno 联系人会话逻辑。</p>
                </div>
            </div>
            <div class="private-contact-chat-recall-status" id="private-contact-chat-recall-status">这条消息已被撤回。</div>
            <div class="private-contact-chat-recall-card">
                <div class="private-contact-chat-recall-meta">
                    <span class="private-contact-chat-recall-actor" id="private-contact-chat-recall-actor">我</span>
                    <span class="private-contact-chat-recall-time" id="private-contact-chat-recall-time"></span>
                </div>
                <div class="private-contact-chat-recall-content" id="private-contact-chat-recall-content"></div>
                <div class="private-contact-chat-recall-foot" id="private-contact-chat-recall-foot"></div>
            </div>
            <div class="private-contact-chat-recall-actions">
                <button class="interactive private-soft-button primary" id="private-contact-chat-recall-close" type="button">关闭</button>
            </div>
        </section>
    `;
    bindPrivateBackdropDismiss(modal, '.private-contact-chat-recall-dialog', () => closePrivateContactChatRecallModal());
    modal.querySelector('#private-contact-chat-recall-close')?.addEventListener('click', () => closePrivateContactChatRecallModal());
    privateApp.appendChild(modal);
    return modal;
}

function openPrivateContactChatRecallModal(messageId) {
    const modal = ensurePrivateContactChatRecallModal();
    const message = getPrivateContactChatMessage(messageId);
    const recalledData = message?.recalledData || null;
    if (!modal || !message || !recalledData) return;
    const actorRole = recalledData.actorRole === 'assistant' ? 'assistant' : 'user';
    const actorName = recalledData.actorName || (actorRole === 'assistant' ? '联系人' : '我');
    const statusText = actorRole === 'assistant'
        ? `“${actorName}”撤回了一条消息，你始终可以查看原文。`
        : (recalledData.wasCaught
            ? '你撤回了一条消息，这次对方已经看见原文。'
            : '你撤回了一条消息，这次对方没有看见原文。');
    const footText = actorRole === 'assistant'
        ? '联系人撤回对你始终可见，这份记录会继续参与后续上下文。'
        : (recalledData.wasCaught
            ? '这条原文会按“对方已看见”的状态参与联系人后续推演。'
            : '这条原文仅作为本地撤回记录保留，不会被联系人视为已看见。');
    privateContactChatRecallDetailMessageId = String(message.id || '').trim();
    setPrivateTextById('private-contact-chat-recall-status', statusText);
    setPrivateTextById('private-contact-chat-recall-actor', actorName);
    setPrivateTextById('private-contact-chat-recall-time', formatPrivateContactChatTime(recalledData.createdAt));
    setPrivateTextById('private-contact-chat-recall-content', recalledData.content || '');
    setPrivateTextById('private-contact-chat-recall-foot', footText);
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('active'));
}

function closePrivateContactChatRecallModal(instant = false) {
    const modal = document.getElementById('private-contact-chat-recall-modal');
    if (!modal) return;
    privateContactChatRecallDetailMessageId = '';
    modal.classList.remove('active');
    const hide = () => {
        if (!modal.classList.contains('active')) modal.hidden = true;
    };
    if (instant) hide();
    else window.setTimeout(hide, 180);
}

function ensurePrivateContactChatPlaceholderModal() {
    let modal = document.getElementById('private-contact-chat-placeholder-modal');
    if (modal) return modal;
    const privateApp = document.getElementById('private-app');
    if (!privateApp) return null;
    modal = document.createElement('div');
    modal.className = 'private-user-preset-modal private-contact-chat-placeholder-modal api-preset-modal';
    modal.id = 'private-contact-chat-placeholder-modal';
    modal.hidden = true;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'private-contact-chat-placeholder-title');
    modal.innerHTML = `
        <form class="private-user-preset-dialog private-contact-chat-placeholder-dialog api-preset-dialog" id="private-contact-chat-placeholder-form" autocomplete="off">
            <div class="private-user-preset-head private-contact-chat-placeholder-head api-modal-head">
                <div class="private-contact-chat-placeholder-copy">
                    <div class="private-section-label api-modal-kicker">输入栏</div>
                    <h2 id="private-contact-chat-placeholder-title">修改占位文字</h2>
                    <p>空白状态下长按输入栏，就可以在这里修改输入框的占位文字。</p>
                </div>
            </div>
            <label class="private-contact-chat-placeholder-field" for="private-contact-chat-placeholder-input">
                <span>占位文字</span>
                <input class="private-contact-chat-placeholder-input" id="private-contact-chat-placeholder-input" type="text" maxlength="80" placeholder="输入占位文字">
            </label>
            <div class="private-contact-chat-placeholder-preview-card">
                <div class="private-contact-chat-placeholder-preview-head">
                    <span class="private-contact-chat-placeholder-preview-label">预览</span>
                    <span class="private-contact-chat-placeholder-preview-hint">实时</span>
                </div>
                <div class="private-contact-chat-placeholder-preview-shell">
                    <span class="private-contact-chat-placeholder-preview-text" id="private-contact-chat-placeholder-preview">${escapePrivateHtml(getPrivateContactChatPlaceholder())}</span>
                </div>
            </div>
            <div class="private-contact-chat-placeholder-actions">
                <button class="interactive private-soft-button" id="private-contact-chat-placeholder-reset" type="button">重置</button>
                <button class="interactive private-soft-button primary" id="private-contact-chat-placeholder-save" type="submit">保存</button>
            </div>
        </form>
    `;
    const syncPreview = () => {
        const input = document.getElementById('private-contact-chat-placeholder-input');
        const preview = document.getElementById('private-contact-chat-placeholder-preview');
        if (!input || !preview) return;
        preview.textContent = String(input.value || '').trim() || createDefaultPrivateState().chatPlaceholder;
    };
    bindPrivateBackdropDismiss(modal, '.private-contact-chat-placeholder-dialog', () => closePrivateContactChatPlaceholderEditor());
    modal.querySelector('#private-contact-chat-placeholder-input')?.addEventListener('input', syncPreview);
    modal.querySelector('#private-contact-chat-placeholder-reset')?.addEventListener('click', event => {
        event.preventDefault();
        setPrivateFieldValue('private-contact-chat-placeholder-input', createDefaultPrivateState().chatPlaceholder);
        syncPreview();
    });
    modal.querySelector('#private-contact-chat-placeholder-form')?.addEventListener('submit', async event => {
        event.preventDefault();
        const input = document.getElementById('private-contact-chat-placeholder-input');
        const nextPlaceholder = String(input?.value || '').trim() || createDefaultPrivateState().chatPlaceholder;
        privateState.chatPlaceholder = nextPlaceholder;
        syncPrivateContactChatComposerUi();
        await savePrivateState();
        closePrivateContactChatPlaceholderEditor();
        showPrivateSystemToast('占位文字已更新。');
    });
    privateApp.appendChild(modal);
    return modal;
}

function openPrivateContactChatPlaceholderEditor() {
    const modal = ensurePrivateContactChatPlaceholderModal();
    if (!modal) return;
    setPrivateFieldValue('private-contact-chat-placeholder-input', getPrivateContactChatPlaceholder());
    document.getElementById('private-contact-chat-placeholder-preview').textContent = getPrivateContactChatPlaceholder();
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('active'));
    window.setTimeout(() => document.getElementById('private-contact-chat-placeholder-input')?.focus(), 80);
}

function closePrivateContactChatPlaceholderEditor(instant = false) {
    const modal = document.getElementById('private-contact-chat-placeholder-modal');
    if (!modal) return;
    modal.classList.remove('active');
    const hide = () => {
        if (!modal.classList.contains('active')) modal.hidden = true;
    };
    if (instant) hide();
    else window.setTimeout(hide, 180);
}

async function deletePrivateContactChatMessage(messageId) {
    const contact = getPrivateContactById(privateActiveContactChatId);
    const message = getPrivateContactChatMessage(messageId);
    if (!contact || !message) return;
    const confirmed = await openPrivateContactChatConfirmModal({
        kicker: '快捷操作',
        title: '删除这条消息？',
        text: '只会删除 Rinno 当前联系人会话里的本地记录。',
        acceptLabel: '删除',
        cancelLabel: '取消'
    });
    if (!confirmed) return;
    updatePrivateContactChatThread(contact.id, thread => ({
        ...thread,
        updatedAt: Date.now(),
        messages: thread.messages.filter(item => String(item.id || '').trim() !== String(messageId || '').trim())
    }));
    syncPrivateContactChatQuotedMessageState(contact.id);
    renderPrivateThreads();
    renderPrivateContactChatPage(contact.id);
    await savePrivateState();
    showPrivateSystemToast('已删除这条消息。');
}

async function recallPrivateContactChatMessage(messageId) {
    const contact = getPrivateContactById(privateActiveContactChatId);
    const message = getPrivateContactChatMessage(messageId);
    if (!contact || !message || message.role !== 'user') return;
    const confirmed = await openPrivateContactChatConfirmModal({
        kicker: '快捷操作',
        title: '撤回这条消息？',
        text: '会把原消息替换成一条本地撤回提示。',
        acceptLabel: '撤回',
        cancelLabel: '取消'
    });
    if (!confirmed) return;
    const wasCaught = Math.random() < PRIVATE_CONTACT_CHAT_USER_RECALL_CAUGHT_PROBABILITY;
    updatePrivateContactChatThread(contact.id, thread => ({
        ...thread,
        updatedAt: Date.now(),
        messages: thread.messages.map(item => (
            String(item.id || '').trim() === String(messageId || '').trim()
                ? buildPrivateContactChatRecalledMessage(item, {
                    actorRole: 'user',
                    actorName: getPrivateDisplayName(),
                    wasCaught
                })
                : item
        ))
    }));
    syncPrivateContactChatQuotedMessageState(contact.id);
    renderPrivateThreads();
    renderPrivateContactChatPage(contact.id);
    await savePrivateState();
    showPrivateSystemToast(wasCaught ? '已撤回，这次对方已经看见原文。' : '已撤回，这次对方没有看见原文。');
}

async function togglePrivateContactChatFavorite(messageId) {
    const contact = getPrivateContactById(privateActiveContactChatId);
    const message = getPrivateContactChatMessage(messageId);
    if (!contact || !message) return;
    updatePrivateContactChatThread(contact.id, thread => ({
        ...thread,
        messages: thread.messages.map(item => (
            String(item.id || '').trim() === String(messageId || '').trim()
                ? { ...item, favorite: !item.favorite }
                : item
        ))
    }));
    renderPrivateThreads();
    renderPrivateContactChatPage(contact.id);
    await savePrivateState();
    showPrivateSystemToast(message.favorite ? '已取消收藏。' : '已加入收藏。');
}

async function backtrackPrivateContactChatMessage(messageId) {
    const contact = getPrivateContactById(privateActiveContactChatId);
    const thread = getPrivateContactChatThread(privateActiveContactChatId);
    const index = findPrivateContactChatMessageIndex(thread, messageId);
    if (!contact || !thread || index < 0) return;
    if (index >= thread.messages.length - 1) {
        showPrivateSystemToast('当前已经是最后一条，无需回溯。');
        return;
    }
    const removedCount = thread.messages.length - index - 1;
    const confirmed = await openPrivateContactChatConfirmModal({
        kicker: '快捷操作',
        title: '回溯到这里？',
        text: `会永久清除这条消息之后的 ${removedCount} 条记录。`,
        acceptLabel: '回溯',
        cancelLabel: '取消'
    });
    if (!confirmed) return;
    updatePrivateContactChatThread(contact.id, currentThread => ({
        ...currentThread,
        updatedAt: Date.now(),
        messages: currentThread.messages.slice(0, index + 1)
    }));
    syncPrivateContactChatQuotedMessageState(contact.id);
    renderPrivateThreads();
    renderPrivateContactChatPage(contact.id);
    await savePrivateState();
    showPrivateSystemToast(`已回溯，清除了 ${removedCount} 条后续记录。`);
}

async function rerollPrivateContactChatMessage(messageId) {
    const contact = getPrivateContactById(privateActiveContactChatId);
    const thread = getPrivateContactChatThread(privateActiveContactChatId);
    const index = findPrivateContactChatMessageIndex(thread, messageId);
    const message = index >= 0 ? thread?.messages?.[index] : null;
    if (!contact || !thread || !message) return;
    if (!canPrivateContactChatRerollMessage(messageId, contact.id)) {
        showPrivateSystemToast('当前这条消息不能重回。');
        return;
    }
    const confirmed = await openPrivateContactChatConfirmModal({
        kicker: '快捷操作',
        title: '重回这条回复？',
        text: '会删除这条联系人回复及其后续记录，然后重新生成。',
        acceptLabel: '重回',
        cancelLabel: '取消'
    });
    if (!confirmed) return;
    updatePrivateContactChatThread(contact.id, currentThread => ({
        ...currentThread,
        updatedAt: Date.now(),
        messages: currentThread.messages.slice(0, index)
    }));
    syncPrivateContactChatQuotedMessageState(contact.id);
    renderPrivateThreads();
    renderPrivateContactChatPage(contact.id);
    await savePrivateState();
    showPrivateSystemToast('已重回，正在重新生成联系人回复。');
    await requestPrivateContactChatAssistantReply(contact);
}

async function applyPrivateContactChatMultiSelectAction() {
    const contact = getPrivateContactById(privateActiveContactChatId);
    const selectedMessages = getPrivateContactChatSelectedMessageList(contact?.id);
    if (!contact || !selectedMessages.length) {
        showPrivateSystemToast('请先选择消息。');
        return;
    }
    const selectedIds = new Set(selectedMessages.map(message => String(message.id || '').trim()));
    const hasUser = selectedMessages.some(message => message.role === 'user');
    const hasOthers = selectedMessages.some(message => message.role !== 'user');
    const confirmed = await openPrivateContactChatConfirmModal({
        kicker: '多选操作',
        title: `${getPrivateContactChatSelectionActionLabel(selectedMessages)}所选消息？`,
        text: hasUser && hasOthers
            ? '用户消息会撤回，联系人与系统消息会删除。'
            : hasUser
                ? '所选用户消息会统一替换成撤回提示。'
                : '所选联系人或系统消息会统一删除。',
        acceptLabel: getPrivateContactChatSelectionActionLabel(selectedMessages),
        cancelLabel: '取消'
    });
    if (!confirmed) return;
    let deletedCount = 0;
    let recalledCount = 0;
    updatePrivateContactChatThread(contact.id, thread => {
        const nextMessages = [];
        thread.messages.forEach(item => {
            const itemId = String(item.id || '').trim();
            if (!selectedIds.has(itemId)) {
                nextMessages.push(item);
                return;
            }
            if (item.role === 'user') {
                recalledCount += 1;
                nextMessages.push(buildPrivateContactChatRecalledMessage(item, {
                    actorRole: 'user',
                    actorName: getPrivateDisplayName(),
                    wasCaught: Math.random() < PRIVATE_CONTACT_CHAT_USER_RECALL_CAUGHT_PROBABILITY
                }));
            } else {
                deletedCount += 1;
            }
        });
        return {
            ...thread,
            updatedAt: Date.now(),
            messages: nextMessages
        };
    });
    syncPrivateContactChatQuotedMessageState(contact.id);
    exitPrivateContactChatSelectionMode();
    renderPrivateThreads();
    renderPrivateContactChatPage(contact.id);
    await savePrivateState();
    const summary = [];
    if (recalledCount) summary.push(`撤回 ${recalledCount} 条`);
    if (deletedCount) summary.push(`删除 ${deletedCount} 条`);
    showPrivateSystemToast(summary.length ? `已处理完成：${summary.join('，')}。` : '已处理完成。');
}

async function handlePrivateContactChatAction(action) {
    const message = getPrivateContactChatMessage(privateContactChatMenuMessageId);
    if (!message) {
        closePrivateContactChatActionMenu();
        return;
    }
    if (action === 'quote') {
        setPrivateContactChatQuotedMessage(message.id);
        closePrivateContactChatActionMenu();
        document.getElementById('private-contact-chat-input')?.focus();
        return;
    }
    if (action === 'copy') {
        const copied = await copyPrivateTextToClipboard(message.content || '');
        closePrivateContactChatActionMenu();
        showPrivateSystemToast(copied ? '已复制消息。' : '复制失败。');
        return;
    }
    if (action === 'edit') {
        closePrivateContactChatActionMenu();
        openPrivateContactChatEditModal(message.id);
        return;
    }
    if (action === 'remove') {
        closePrivateContactChatActionMenu();
        if (message.role === 'user') await recallPrivateContactChatMessage(message.id);
        else await deletePrivateContactChatMessage(message.id);
        return;
    }
    if (action === 'multi-select') {
        closePrivateContactChatActionMenu();
        enterPrivateContactChatSelectionMode(message.id);
        return;
    }
    if (action === 'backtrack') {
        closePrivateContactChatActionMenu();
        await backtrackPrivateContactChatMessage(message.id);
        return;
    }
    if (action === 'reroll') {
        closePrivateContactChatActionMenu();
        await rerollPrivateContactChatMessage(message.id);
        return;
    }
    if (action === 'favorite') {
        closePrivateContactChatActionMenu();
        await togglePrivateContactChatFavorite(message.id);
    }
}

function buildPrivateContactChatEndpoint(rawEndpoint) {
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

function extractPrivateContactGeneratedText(payload) {
    const choice = Array.isArray(payload?.choices) ? payload.choices[0] : null;
    return String(
        choice?.message?.content
        || choice?.text
        || payload?.output_text
        || payload?.content
        || ''
    ).trim();
}

function parsePrivateContactGeneratedProfile(text) {
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
        if (!data || typeof data !== 'object') return {};
        return {
            profession: String(data.profession || data.job || data.occupation || data['职业'] || '').trim(),
            signature: String(data.signature || data.personaSignature || data.tagline || data['个性签名'] || data['签名'] || '').trim(),
            phoneDigits: String(data.phoneDigits || data.phoneLocal || data.mobileDigits || data['手机本地号码'] || '').trim(),
            phoneNumber: String(data.phoneNumber || data.phone || data.mobile || data['手机号'] || '').trim(),
            ipCity: String(data.ipCity || data.ipLocation || data.ipCityLocation || data.city || data['IP城市定位'] || data['IP定位'] || '').trim(),
            homeAddress: String(data.homeAddress || data.address || data['家庭住址'] || data['住址'] || '').trim(),
            lifeStages: data.lifeStages || data.ageStages || data.experiences || data['年龄经历'] || data['三个年龄段经历'] || []
        };
    } catch (error) {
        return {};
    }
}

function stripPrivateContactChatPlanText(value) {
    return String(value || '')
        .replace(/^```(?:json|text)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
}

function splitPrivateContactChatReplySegments(value, maxSegments = PRIVATE_CONTACT_CHAT_MAX_PLAN_LENGTH) {
    const normalized = normalizePrivateContactChatReplyText(value);
    if (!normalized) return [];
    const sentenceSeeds = normalized
        .split(/\n+/)
        .flatMap(line => (
            String(line || '').match(/[^。！？!?；;…\n]+[。！？!?；;…]?/g)
            || [line]
        ))
        .map(item => String(item || '').trim())
        .filter(Boolean);
    if (!sentenceSeeds.length) return [];

    const segments = [];
    let current = '';
    const flush = () => {
        const next = normalizePrivateContactChatReplyText(current);
        if (next) segments.push(next);
        current = '';
    };

    for (const seed of sentenceSeeds) {
        if (!current) {
            current = seed;
            continue;
        }
        const canMerge = current.length <= 22
            && seed.length <= 18
            && (current.length + seed.length) <= 34
            && !/[。！？!?；;…]$/.test(current);
        if (canMerge) {
            current += seed;
        } else {
            flush();
            current = seed;
        }
    }
    flush();

    if (!segments.length) return normalized ? [normalized] : [];
    if (segments.length <= maxSegments) return segments;

    const limited = segments.slice(0, maxSegments);
    limited[maxSegments - 1] = normalizePrivateContactChatReplyText(
        segments.slice(maxSegments - 1).join('')
    );
    return limited.filter(Boolean);
}

function normalizePrivateContactChatPlanInstruction(item) {
    if (!item || typeof item !== 'object') return null;
    const type = String(item.type || '').trim().toLowerCase();
    if (!type) return null;
    const translation = normalizePrivateContactChatTranslationText(
        item.translation_zh
        || item.translationZh
        || item.translation
        || item.zhTranslation
        || item['中文翻译']
        || ''
    );
    if (type === 'reply') {
        const targetText = trimPrivateContactChatSnippet(
            String(item.target_text || item.targetText || item.quote || '').replace(/\r/g, '').trim(),
            28
        );
        const content = normalizePrivateContactChatReplyText(item.content || item.message || '');
        if (!targetText || !content) return null;
        return { type: 'reply', targetText, content, translation };
    }
    if (type === 'recall_msg') {
        const content = normalizePrivateContactChatReplyText(item.content || item.message || '');
        if (!content) return null;
        return { type: 'recall_msg', content, translation };
    }
    if (type === 'text') {
        const content = normalizePrivateContactChatReplyText(item.content || item.message || '');
        if (!content) return null;
        return { type: 'text', content, translation };
    }
    return null;
}

function normalizePrivateContactChatReplyListItem(item) {
    if (typeof item === 'string') return null;
    return normalizePrivateContactChatPlanInstruction(item);
}

function parsePrivateContactChatPlan(text) {
    const cleaned = stripPrivateContactChatPlanText(text);
    if (!cleaned) return [];
    const parseJsonValue = value => {
        if (Array.isArray(value)) return value.map(normalizePrivateContactChatReplyListItem).filter(Boolean);
        if (value && typeof value === 'object') {
            const instruction = normalizePrivateContactChatPlanInstruction(value);
            return instruction ? [instruction] : [];
        }
        return [];
    };
    const parseStructuredValue = value => {
        const plan = parseJsonValue(value);
        if (plan.length) return plan.slice(0, PRIVATE_CONTACT_CHAT_MAX_PLAN_LENGTH);
        if (value && typeof value === 'object') {
            const list = Array.isArray(value.replies)
                ? value.replies
                : Array.isArray(value.plan)
                    ? value.plan
                    : Array.isArray(value.messages)
                        ? value.messages
                        : [];
            const mapped = list.map(normalizePrivateContactChatReplyListItem).filter(Boolean);
            if (mapped.length) return mapped.slice(0, PRIVATE_CONTACT_CHAT_MAX_PLAN_LENGTH);
        }
        return [];
    };

    try {
        const parsed = JSON.parse(cleaned);
        const plan = parseStructuredValue(parsed);
        if (plan.length) return plan;
    } catch (error) {
        // Ignore and continue with loose extraction.
    }

    const bracketStart = cleaned.indexOf('[');
    const bracketEnd = cleaned.lastIndexOf(']');
    if (bracketStart >= 0 && bracketEnd > bracketStart) {
        try {
            const parsed = JSON.parse(cleaned.slice(bracketStart, bracketEnd + 1));
            const plan = parseStructuredValue(parsed);
            if (plan.length) return plan;
        } catch (error) {
            // Ignore and continue with loose extraction.
        }
    }

    const objectStart = cleaned.indexOf('{');
    const objectEnd = cleaned.lastIndexOf('}');
    if (objectStart >= 0 && objectEnd > objectStart) {
        try {
            const parsed = JSON.parse(cleaned.slice(objectStart, objectEnd + 1));
            const plan = parseStructuredValue(parsed);
            if (plan.length) return plan;
        } catch (error) {
            // Ignore and continue with regex salvage.
        }
    }

    const repliesMatch = cleaned.match(/"replies"\s*:\s*\[([\s\S]*?)\]/i);
    if (repliesMatch) {
        try {
            const parsedReplies = JSON.parse(`[${repliesMatch[1]}]`);
            const plan = parsedReplies.map(normalizePrivateContactChatReplyListItem).filter(Boolean);
            if (plan.length) return plan.slice(0, PRIVATE_CONTACT_CHAT_MAX_PLAN_LENGTH);
        } catch (error) {
            // Ignore and continue with loose extraction.
        }
    }

    const objectMatches = cleaned.match(/\{[\s\S]*?\}/g) || [];
    const loosePlan = objectMatches
        .map(chunk => {
            try {
                return normalizePrivateContactChatPlanInstruction(JSON.parse(chunk));
            } catch (error) {
                return null;
            }
        })
        .filter(Boolean);
    if (loosePlan.length) return loosePlan.slice(0, PRIVATE_CONTACT_CHAT_MAX_PLAN_LENGTH);

    return [];
}

function findPrivateContactChatReplyTarget(thread = {}, targetText = '') {
    const quoteContent = String(targetText || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const recentMessages = normalizePrivateContactChatMessages(thread?.messages)
        .filter(message => ['user', 'assistant'].includes(String(message?.role || '')))
        .slice(-24)
        .reverse();
    if (!quoteContent) return recentMessages[0] || null;
    const matched = recentMessages.find(message => {
        const dbContent = String(message.content || '').replace(/\s+/g, ' ').trim().toLowerCase();
        if (!dbContent) return false;
        if (dbContent.includes(quoteContent) || quoteContent.includes(dbContent)) return true;
        return quoteContent.length > 5 && dbContent.startsWith(quoteContent.slice(0, 5));
    });
    return matched || recentMessages.find(message => message.role === 'user') || recentMessages[0] || null;
}

function buildPrivateContactChatFallbackRecallLine(contact = {}, thread = {}) {
    const tone = getPrivateContactChatFallbackTone(contact);
    const latestUser = [...normalizePrivateContactChatMessages(thread?.messages)]
        .reverse()
        .find(message => message.role === 'user');
    const snippet = trimPrivateContactChatSnippet(latestUser?.content || '', 10);
    if (tone === 'reserved') return snippet ? `算了，这句先收回。` : '这句当我没说。';
    if (tone === 'gentle') return snippet ? '不对，这句我先撤回。' : '这句先收回。';
    if (tone === 'warm') return snippet ? '啊不，这句撤回。' : '等下，这句删掉。';
    return '这句先撤回。';
}

function buildPrivateContactChatFallbackRecallPair(contact = {}, thread = {}) {
    const translation = buildPrivateContactChatFallbackRecallLine(contact, thread);
    const languageSpec = getPrivateContactChatLanguageSpec(contact);
    if (!languageSpec.translationRequired) {
        return { content: translation, translation: '' };
    }
    const content = {
        en: 'Forget that sentence for now.',
        ja: '今の言葉は、いったん忘れて。',
        ko: '방금 말은 일단 잊어줘.',
        fr: 'Oublie cette phrase pour le moment.',
        de: 'Vergiss diesen Satz erst einmal.',
        ru: 'Забудь пока эту фразу.',
        th: 'ลืมประโยคนั้นไปก่อนนะ',
        vi: 'Tạm quên câu đó đi.',
        ms: 'Lupakan ayat itu dulu.',
        fil: 'Kalimutan mo muna ang linyang iyon.',
        hi: 'उस बात को अभी भूल जाओ।'
    }[languageSpec.code] || 'Forget that sentence for now.';
    return {
        content: normalizePrivateContactChatReplyText(content),
        translation
    };
}

function buildPrivateContactChatFallbackPlan(contact = {}, thread = {}) {
    const baseReplyPair = buildPrivateContactChatFallbackReplyPair(contact, thread);
    const baseReply = baseReplyPair.content;
    const messages = normalizePrivateContactChatMessages(thread?.messages);
    const latestUser = [...messages].reverse().find(message => message.role === 'user');
    if (!latestUser) return baseReply ? [{ type: 'text', content: baseReply, translation: baseReplyPair.translation }] : [];
    const recentAssistantRecall = messages
        .slice(-4)
        .some(message => message.recalled && message.recalledData?.actorRole === 'assistant');
    const replyTarget = trimPrivateContactChatSnippet(
        latestUser.quote?.content || latestUser.content || '',
        22
    );
    const seed = hashPrivateSeed(`${contact?.id || 'contact'}|${latestUser.id}|${messages.length}`);
    const shouldQuote = Boolean(replyTarget) && (
        Boolean(latestUser.quote)
        || /[?？]$/.test(String(latestUser.content || '').trim())
        || seed % 100 < 42
    );
    const shouldRecall = !recentAssistantRecall
        && String(latestUser.content || '').trim().length >= 8
        && seed % 100 < 8;
    const plan = [];
    if (shouldRecall) {
        const recallPair = buildPrivateContactChatFallbackRecallPair(contact, thread);
        plan.push({
            type: 'recall_msg',
            content: recallPair.content,
            translation: recallPair.translation
        });
    }
    if (shouldQuote) {
        plan.push({
            type: 'reply',
            targetText: replyTarget,
            content: baseReply,
            translation: baseReplyPair.translation
        });
    } else if (baseReply) {
        plan.push({
            type: 'text',
            content: baseReply,
            translation: baseReplyPair.translation
        });
    }
    return plan.slice(0, PRIVATE_CONTACT_CHAT_MAX_PLAN_LENGTH);
}

function expandPrivateContactChatAssistantPlan(plan = []) {
    const expanded = [];
    const safePlan = Array.isArray(plan) ? plan.filter(Boolean) : [];
    for (const instruction of safePlan) {
        if (expanded.length >= PRIVATE_CONTACT_CHAT_MAX_PLAN_LENGTH) break;
        const remaining = PRIVATE_CONTACT_CHAT_MAX_PLAN_LENGTH - expanded.length;
        if (instruction.type === 'text') {
            const segments = splitPrivateContactChatReplySegments(instruction.content, remaining);
            const translationSegments = splitPrivateContactChatReplySegments(instruction.translation || '', remaining);
            segments.forEach((content, segmentIndex) => {
                if (expanded.length < PRIVATE_CONTACT_CHAT_MAX_PLAN_LENGTH) {
                    expanded.push({
                        type: 'text',
                        content,
                        translation: translationSegments[segmentIndex] || (segmentIndex === 0 ? normalizePrivateContactChatTranslationText(instruction.translation) : '')
                    });
                }
            });
            continue;
        }
        if (instruction.type === 'reply') {
            const segments = splitPrivateContactChatReplySegments(instruction.content, remaining);
            if (!segments.length) continue;
            const translationSegments = splitPrivateContactChatReplySegments(instruction.translation || '', remaining);
            expanded.push({
                type: 'reply',
                targetText: instruction.targetText,
                content: segments[0],
                translation: translationSegments[0] || normalizePrivateContactChatTranslationText(instruction.translation)
            });
            segments.slice(1).forEach((content, sliceIndex) => {
                if (expanded.length < PRIVATE_CONTACT_CHAT_MAX_PLAN_LENGTH) {
                    const segmentIndex = sliceIndex + 1;
                    expanded.push({
                        type: 'text',
                        content,
                        translation: translationSegments[segmentIndex] || ''
                    });
                }
            });
            continue;
        }
        expanded.push({
            ...instruction,
            translation: normalizePrivateContactChatTranslationText(instruction.translation)
        });
    }
    return expanded.slice(0, PRIVATE_CONTACT_CHAT_MAX_PLAN_LENGTH);
}

function getPrivateContactChatAssistantPlanDelay(instruction, index = 0) {
    if (index <= 0) return 0;
    return PRIVATE_CONTACT_CHAT_MULTI_SEND_BASE_DELAY_MS;
}

async function loadPrivateContactApiSettings() {
    if (typeof apiState !== 'undefined' && apiState?.chat) return apiState.chat;
    try {
        if (typeof db === 'undefined' || !db?.edits?.get) return {};
        const saved = await db?.edits?.get?.('api_parameter_config');
        const content = typeof saved?.content === 'string' ? JSON.parse(saved.content) : saved?.content;
        return content?.chat || {};
    } catch (error) {
        console.warn('Private contact API settings load failed:', error);
        return {};
    }
}

async function generatePrivateContactProfileWithApi(record, contact = {}) {
    const chat = await loadPrivateContactApiSettings();
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

    const label = record?.type === 'npc' ? 'NPC' : 'CHAR';
    const prompt = [
        `类型：${label}`,
        `姓名：${record?.name || '未填写'}`,
        `昵称：${record?.nickname || '未填写'}`,
        `性别：${record?.gender || '未填写'}`,
        `国籍：${record?.nationality || '未填写'}`,
        `账号 ID：${record?.accountId || '未填写'}`,
        `设定内容：${record?.setting || contact?.note || '未填写'}`,
        `现有独白：${record?.monologue || '未填写'}`,
        '请只输出严格 JSON，不要 Markdown，不要解释。',
        '请生成字段：signature、profession、phoneDigits、ipCity、homeAddress、lifeStages。',
        'signature 是 10 到 25 个中文字符的简短个性签名，要体现设定性格与距离感，不要照抄设定原句，不要加引号。',
        'profession 是贴合设定的真实职业，使用中文，2 到 12 个字。',
        'phoneDigits 只保留本地手机号码数字，不要带 +、空格、横线、括号或国家码；位数必须符合该角色国籍常见手机号长度。',
        'ipCity 是符合国籍和设定气质的 IP 城市定位。',
        'homeAddress 是简洁可信的家庭住址，带街区或街道感，不要写邮编。',
        'lifeStages 必须是长度为 3 的数组，每项格式 {"age":"幼时","experience":"..."}。',
        '三个阶段固定写成 幼时、年少时、如今，不能写数字年龄段。',
        '三段经历合计约 180 到 240 个中文字符，要根据设定自然延伸出符合成长阶段的经历。',
        '不要直接复述设定原句、关键词、独白原文，也不要写“设定里提到”这类说明。',
        '不要生成身份证、邮箱、网址、社交账号、聊天记录或夸张设定。'
    ].join('\n');

    const response = await fetch(buildPrivateContactChatEndpoint(endpoint), {
        method: 'POST',
        headers,
        body: JSON.stringify({
            model,
            temperature: typeof chat.temperature === 'number' ? chat.temperature : 0.7,
            messages: [
                {
                    role: 'system',
                    content: '你是细腻克制的人物补完顾问。根据用户已有的角色设定，生成简短个性签名、职业、手机号本地数字、IP 城市定位、家庭住址，以及三个阶段的经历。签名和经历都必须是基于设定自然延伸，不能直接复述设定原句。只输出严格 JSON，不要 Markdown。JSON 格式：{"signature":"...","profession":"...","phoneDigits":"13912345678","ipCity":"上海","homeAddress":"上海长宁区梧桐街18号","lifeStages":[{"age":"幼时","experience":"..."},{"age":"年少时","experience":"..."},{"age":"如今","experience":"..."}]}。'
                },
                { role: 'user', content: prompt }
            ]
        })
    });

    if (!response.ok) throw new Error(`API 生成失败：${response.status}`);
    const payload = await response.json();
    const generatedText = extractPrivateContactGeneratedText(payload);
    const generatedProfile = parsePrivateContactGeneratedProfile(generatedText);
    const hasLifeStages = Array.isArray(generatedProfile.lifeStages)
        ? generatedProfile.lifeStages.length > 0
        : Boolean(generatedProfile.lifeStages);
    if (!generatedProfile.signature && !generatedProfile.profession && !generatedProfile.phoneDigits && !generatedProfile.phoneNumber && !generatedProfile.ipCity && !generatedProfile.homeAddress && !hasLifeStages) {
        throw new Error('API 没有返回可用的联系人资料。');
    }
    return buildPrivateContactGeneratedProfile(record, generatedProfile, contact);
}

async function generatePrivateContactChatReplyWithApi(contact, thread = {}) {
    const chat = await loadPrivateContactApiSettings();
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

    const response = await fetch(buildPrivateContactChatEndpoint(endpoint), {
        method: 'POST',
        headers,
        body: JSON.stringify({
            model,
            temperature: typeof chat.temperature === 'number' ? chat.temperature : 0.85,
            messages: await buildPrivateContactChatReplyMessages(contact, thread, chat)
        })
    });

    if (!response.ok) throw new Error(`API 回复失败：${response.status}`);
    const payload = await response.json();
    const plan = parsePrivateContactChatPlan(extractPrivateContactGeneratedText(payload));
    if (!plan.length) throw new Error('API 没有返回可用的角色回复。');
    return plan;
}

async function appendPrivateContactChatAssistantMessage(contactId, message) {
    const safeContactId = String(contactId || '').trim();
    if (!safeContactId || !message) return null;
    updatePrivateContactChatThread(safeContactId, currentThread => ({
        ...currentThread,
        unread: 0,
        updatedAt: Number(message.createdAt) || Date.now(),
        messages: [...currentThread.messages, message]
    }));
    renderPrivateThreads();
    if (privateActiveContactChatId === safeContactId) renderPrivateContactChatPage(safeContactId);
    await savePrivateState();
    requestAnimationFrame(() => scrollPrivateContactChatContentToBottom('smooth'));
    return getPrivateContactChatMessage(message.id, safeContactId);
}

async function replacePrivateContactChatMessage(contactId, messageId, updater) {
    const safeContactId = String(contactId || '').trim();
    const safeMessageId = String(messageId || '').trim();
    if (!safeContactId || !safeMessageId || typeof updater !== 'function') return null;
    updatePrivateContactChatThread(safeContactId, currentThread => ({
        ...currentThread,
        updatedAt: Date.now(),
        messages: currentThread.messages.map(message => (
            String(message.id || '').trim() === safeMessageId
                ? updater(message)
                : message
        ))
    }));
    renderPrivateThreads();
    if (privateActiveContactChatId === safeContactId) renderPrivateContactChatPage(safeContactId);
    await savePrivateState();
    requestAnimationFrame(() => scrollPrivateContactChatContentToBottom('smooth'));
    return getPrivateContactChatMessage(safeMessageId, safeContactId);
}

async function applyPrivateContactChatAssistantInstruction(contact, instruction) {
    const safeContactId = String(contact?.id || '').trim();
    if (!safeContactId || !instruction) return false;

    if (instruction.type === 'recall_msg') {
        const tempMessage = {
            id: createPrivateContactChatMessageId('assistant'),
            role: 'assistant',
            content: instruction.content,
            translation: normalizePrivateContactChatTranslationText(instruction.translation || instruction.translation_zh || ''),
            createdAt: Date.now()
        };
        await appendPrivateContactChatAssistantMessage(safeContactId, tempMessage);
        await new Promise(resolve => window.setTimeout(resolve, PRIVATE_CONTACT_CHAT_ASSISTANT_RECALL_DELAY_MS));
        await replacePrivateContactChatMessage(safeContactId, tempMessage.id, currentMessage => (
            buildPrivateContactChatRecalledMessage(currentMessage, {
                actorRole: 'assistant',
                actorName: contact.title
            })
        ));
        return true;
    }

    const thread = getPrivateContactChatThread(safeContactId) || { messages: [] };
    const targetMessage = instruction.type === 'reply'
        ? findPrivateContactChatReplyTarget(thread, instruction.targetText)
        : null;
    const message = {
        id: createPrivateContactChatMessageId('assistant'),
        role: 'assistant',
        content: instruction.content,
        translation: normalizePrivateContactChatTranslationText(instruction.translation || instruction.translation_zh || ''),
        createdAt: Date.now(),
        quote: targetMessage ? buildPrivateContactChatQuotePayload(targetMessage, safeContactId) : null
    };
    await appendPrivateContactChatAssistantMessage(safeContactId, message);
    return true;
}

async function applyPrivateContactChatAssistantPlan(contact, plan = []) {
    const normalizedPlan = expandPrivateContactChatAssistantPlan(plan);
    if (!normalizedPlan.length) return false;
    let applied = false;
    for (let index = 0; index < normalizedPlan.length; index += 1) {
        const instruction = normalizedPlan[index];
        const waitMs = getPrivateContactChatAssistantPlanDelay(instruction, index);
        if (waitMs > 0) {
            await new Promise(resolve => window.setTimeout(resolve, waitMs));
        }
        const handled = await applyPrivateContactChatAssistantInstruction(contact, instruction);
        applied = handled || applied;
    }
    return applied;
}

async function requestPrivateContactChatAssistantReply(contact) {
    if (!PRIVATE_CONTACT_CHAT_AUTO_REPLY_ENABLED || !contact) return false;
    const safeContact = getPrivateHydratedContact(contact);
    const safeContactId = String(safeContact?.id || '').trim();
    if (!safeContactId || privateContactChatSendingId) return false;

    privateContactChatSendingId = safeContactId;
    renderPrivateThreads();
    if (privateActiveContactChatId === safeContactId) renderPrivateContactChatPage(safeContactId);

    try {
        const thread = getPrivateContactChatThread(safeContactId) || { messages: [] };
        let plan = [];
        try {
            plan = await generatePrivateContactChatReplyWithApi(safeContact, thread);
        } catch (error) {
            console.warn('Private contact chat reply failed:', error);
            plan = buildPrivateContactChatFallbackPlan(safeContact, thread);
        }
        const hasVisibleReply = plan.some(item => item && ['text', 'reply'].includes(item.type));
        if (!hasVisibleReply) {
            const fallbackPair = buildPrivateContactChatFallbackReplyPair(safeContact, thread);
            if (fallbackPair.content) {
                plan.push({
                    type: 'text',
                    content: fallbackPair.content,
                    translation: fallbackPair.translation
                });
            }
        }
        return applyPrivateContactChatAssistantPlan(safeContact, plan);
    } finally {
        privateContactChatSendingId = '';
        renderPrivateThreads();
        if (privateActiveContactChatId === safeContactId) {
            renderPrivateContactChatPage(safeContactId);
            requestAnimationFrame(() => {
                document.getElementById('private-contact-chat-input')?.focus();
                scrollPrivateContactChatContentToBottom('smooth');
            });
        }
    }
}

function renderPrivateContactAccountResults() {
    const input = document.getElementById('private-contact-account-input');
    const results = document.getElementById('private-contact-account-results');
    if (!results) return;
    const rawQuery = String(input?.value || '').trim();
    if (!rawQuery) {
        results.innerHTML = '<div class="private-contact-account-empty">粘贴 CHAR / NPC 的账号 ID，系统只会按完整账号精确匹配。</div>';
        return;
    }

    const accountId = normalizePrivateDossierAccount(rawQuery);
    if (!accountId) {
        results.innerHTML = '<div class="private-contact-account-empty">请输入 8-10 位纯数字账号 ID。</div>';
        return;
    }

    const record = findPrivateDossierAccountRecord(accountId);
    if (!record) {
        results.innerHTML = '<div class="private-contact-account-empty">没有找到此账号。</div>';
        return;
    }

    const label = record.type === 'npc' ? 'NPC' : 'CHAR';
    const pendingKey = getPrivateDossierContactId(record);
    const added = isPrivateDossierContactAdded(record);
    const generating = privatePendingContactGenerationKeys.has(pendingKey);
    const displayName = record.nickname || record.name;
    const avatarStyle = record.avatar ? ` style="background-image:url(&quot;${escapePrivateHtml(record.avatar)}&quot;)"` : '';
    results.innerHTML = `
        <article class="private-contact-account-card">
            <div class="private-contact-account-face ${record.avatar ? 'has-image' : ''}"${avatarStyle} aria-hidden="true">${escapePrivateHtml(label.slice(0, 1))}</div>
            <div class="private-contact-account-copy">
                <span>${escapePrivateHtml(label)} / 精确命中</span>
                <strong>${escapePrivateHtml(displayName)}</strong>
                <small>ID ${escapePrivateHtml(record.accountId)} · ${escapePrivateHtml(record.name)}</small>
                <p>${escapePrivateHtml(record.setting || '这个账号还没有写下更多设定。')}</p>
            </div>
            <button class="private-contact-account-add interactive" type="button"
                data-private-add-dossier-type="${escapePrivateHtml(record.type)}"
                data-private-add-dossier-record="${escapePrivateHtml(record.recordId)}"
                data-private-add-dossier-account="${escapePrivateHtml(record.accountId)}"
                ${added || generating ? 'disabled' : ''}>${added ? '已添加' : generating ? '生成中' : '添加'}</button>
        </article>
    `;
}

function openPrivateContactAccountModal() {
    const modal = document.getElementById('private-contact-account-modal');
    const input = document.getElementById('private-contact-account-input');
    if (!modal) return;
    if (input) input.value = '';
    renderPrivateContactAccountResults();
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('active'));
    window.setTimeout(() => input?.focus(), 90);
}

function closePrivateContactAccountModal(instant = false) {
    const modal = document.getElementById('private-contact-account-modal');
    if (!modal) return;
    modal.classList.remove('active');
    const hide = () => {
        if (!modal.classList.contains('active')) modal.hidden = true;
    };
    if (instant) hide();
    else window.setTimeout(hide, 180);
}

async function addPrivateDossierContact(type, recordId, accountId) {
    const safeType = normalizePrivateDossierType(type);
    const safeRecordId = String(recordId || '').trim();
    const safeAccountId = normalizePrivateDossierAccount(accountId);
    const record = getPrivateDossierAccountRecords().find(item => (
        item.type === safeType
        && item.recordId === safeRecordId
        && item.accountId === safeAccountId
    ));
    if (!record) {
        showPrivateSystemToast('账号没有精确命中，未添加。');
        renderPrivateContactAccountResults();
        return;
    }
    if (isPrivateDossierContactAdded(record)) {
        showPrivateSystemToast('这个账号已在通讯里。');
        renderPrivateContactAccountResults();
        return;
    }

    const pendingKey = getPrivateDossierContactId(record);
    if (privatePendingContactGenerationKeys.has(pendingKey)) return;

    privatePendingContactGenerationKeys.add(pendingKey);
    renderPrivateContactAccountResults();
    showPrivateSystemToast('正在根据设定生成联系人资料...');

    try {
        let generatedProfile = null;
        try {
            generatedProfile = await generatePrivateContactProfileWithApi(record);
        } catch (error) {
            console.warn('Private contact generation failed:', error);
            generatedProfile = buildPrivateContactGeneratedProfile(record);
            showPrivateSystemToast('API 暂未返回，已按设定与国籍补全联系人资料。');
        }

        const contact = {
            ...createPrivateDossierContact(record),
            ...generatedProfile
        };
        const contacts = getPrivateScopedContacts()
            .filter(item => item.id !== contact.id)
            .filter(item => normalizePrivateDossierAccount(item.accountId) !== record.accountId)
            .filter(item => !(
                item.dossierType === record.type
                && item.dossierRecordId === record.recordId
                && normalizePrivateDossierAccount(item.accountId) === record.accountId
            ));
        setPrivateScopedContacts([contact, ...contacts].slice(0, 24));
        renderPrivateContacts();
        await savePrivateState();
        closePrivateContactAccountModal();
        showPrivateSystemToast(`已添加 ${record.type === 'npc' ? 'NPC' : 'CHAR'}「${record.nickname || record.name}」。`);
    } finally {
        privatePendingContactGenerationKeys.delete(pendingKey);
        renderPrivateContactAccountResults();
    }
}

function setPrivateEditableText(selector, value) {
    const el = document.querySelector(selector);
    if (!el || document.activeElement === el) return;
    el.textContent = value;
}

function renderPrivateThreads() {
    const list = document.getElementById('private-thread-list');
    if (!list) return;
    privateState.threads = normalizePrivateThreads(privateState.threads);
    const count = document.getElementById('private-thread-count');
    const items = buildPrivateContactChatPreviewItems();
    if (count) count.textContent = `${items.length} threads`;
    if (!items.length) {
        list.innerHTML = '<div class="private-empty-state" role="status">No private threads yet.</div>';
        return;
    }
    list.innerHTML = items.map(item => {
        const contact = item.contact;
        const markClass = contact?.avatar ? 'private-thread-mark has-image' : 'private-thread-mark';
        const markStyle = contact?.avatar
            ? ` style="background-image:url(&quot;${escapePrivateHtml(contact.avatar)}&quot;)"`
            : '';
        return `
            <article class="private-thread-card interactive" data-private-thread-contact="${escapePrivateHtml(contact.id)}" aria-current="false" aria-selected="false">
                <div class="${markClass}"${markStyle} aria-hidden="true">${contact?.avatar ? '' : escapePrivateHtml(getPrivateContactInitial(contact))}</div>
                <div class="private-thread-copy">
                    <div class="private-thread-title">${escapePrivateHtml(contact.title || 'Contact')}</div>
                    <div class="private-thread-sub">${escapePrivateHtml(buildPrivateContactChatSubtitle(contact))}</div>
                    <div class="private-thread-last">${escapePrivateHtml(item.preview || 'Start a private chat.')}</div>
                </div>
                <div class="private-thread-side">
                    <div class="private-thread-time">${escapePrivateHtml(item.time || 'Now')}</div>
                    ${item.unread ? `<div class="private-thread-badge">${escapePrivateHtml(String(item.unread))}</div>` : '<div aria-hidden="true"></div>'}
                </div>
            </article>
        `;
    }).join('');
}

function getPrivateContactById(contactId) {
    const rawId = String(contactId || '').trim();
    if (!rawId) return null;
    const id = normalizePrivateContactRecordId(rawId);
    return getPrivateScopedContacts()
        .map(getPrivateHydratedContact)
        .find(contact => String(contact?.id || '') === id) || null;
}

function getPrivateContactProfileRecord(contact) {
    const dossierType = normalizePrivateDossierType(contact?.dossierType);
    const recordId = String(contact?.dossierRecordId || '').trim();
    const accountId = normalizePrivateDossierAccount(contact?.accountId);
    if (!recordId || !accountId) return null;
    return getPrivateDossierAccountRecords().find(item => (
        item.type === dossierType
        && item.recordId === recordId
        && item.accountId === accountId
    )) || null;
}

function getPrivateContactInitial(contact) {
    const source = String(contact?.title || contact?.subtitle || getPrivateContactMark(contact) || '?').trim();
    return Array.from(source)[0]?.toUpperCase() || '?';
}

function createPrivateContactPreviewAvatarMarkup(contact) {
    if (contact?.avatar) {
        return `<span class="private-contact-avatar has-image" aria-hidden="true"><img src="${escapePrivateHtml(contact.avatar)}" alt=""></span>`;
    }
    return `<span class="private-contact-avatar" aria-hidden="true">${escapePrivateHtml(getPrivateContactInitial(contact))}</span>`;
}

function createPrivateContactProfileAvatarMarkup(contact) {
    if (contact?.avatar) {
        return `<span class="dossier-profile-avatar has-image" aria-hidden="true"><img src="${escapePrivateHtml(contact.avatar)}" alt=""></span>`;
    }
    return `<span class="dossier-profile-avatar" aria-hidden="true">${escapePrivateHtml(getPrivateContactInitial(contact))}</span>`;
}

function createPrivateContactHomepageCoverStyle(contact) {
    const cover = String(contact?.homepageCover || '').trim();
    return cover
        ? ` style="--private-contact-homepage-cover-image:url(&quot;${escapePrivateHtml(cover)}&quot;);background-image:url(&quot;${escapePrivateHtml(cover)}&quot;)"`
        : '';
}

function createPrivateContactSignature(contact, record) {
    const explicit = normalizePrivateContactSignature(contact?.signature || contact?.tagline);
    if (explicit) return explicit;
    const profile = resolvePrivateContactGeneratedProfile(contact, record);
    return normalizePrivateContactSignature(profile.signature) || '把距离放轻，把真心放深';
}

function createPrivateContactProfileParagraphs(value) {
    const text = String(value || '').replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();
    const safeText = escapePrivateHtml(text || 'No profile note yet.');
    return safeText
        .split(/\n{2,}/)
        .map(part => part.trim())
        .filter(Boolean)
        .map(part => `<p>${part.replace(/\n/g, '<br>')}</p>`)
        .join('');
}

function getPrivateContactAboutLabel(record, contact) {
    const gender = String(record?.gender || record?.sex || contact?.gender || '').trim().toLowerCase();
    if (/女|她|female|woman|girl/.test(gender)) return '关于她';
    if (/男|他|male|man|boy/.test(gender)) return '关于他';
    return '关于他/她';
}

function createPrivateContactMetaEntries(contact, record) {
    const profile = resolvePrivateContactGeneratedProfile(contact, record);
    return [
        ['职业', profile.profession || '待生成'],
        ['手机号', profile.phoneNumber || '待生成'],
        ['IP城市定位', profile.ipCity || '待生成'],
        ['家庭住址', profile.homeAddress || '待生成']
    ];
}

function createPrivateContactSectionHead(kicker, title, note = '') {
    return `
        <header class="private-contact-homepage-section-head">
            <span>${escapePrivateHtml(kicker)}</span>
            <h3>${escapePrivateHtml(title)}</h3>
            ${note ? `<p>${escapePrivateHtml(note)}</p>` : ''}
        </header>
    `;
}

function createPrivateContactMetaMarkup(contact, record) {
    return `
        <section class="private-contact-homepage-meta" aria-label="联系人资料">
            ${createPrivateContactSectionHead('PRIVATE DOSSIER', '更多', '职业、号码与日常落点，都会跟随角色设定与国籍延伸补全。')}
            <div class="private-contact-homepage-meta-list">
                ${createPrivateContactMetaEntries(contact, record).map(([label, value]) => `
                    <article class="private-contact-homepage-meta-item">
                        <span>${escapePrivateHtml(label)}</span>
                        <strong>${escapePrivateHtml(value)}</strong>
                    </article>
                `).join('')}
            </div>
        </section>
    `;
}

function createPrivateContactLifeStagesMarkup(contact, record, aboutLabel) {
    const profile = resolvePrivateContactGeneratedProfile(contact, record);
    const stages = normalizePrivateContactLifeStages(profile.lifeStages);
    return `
        <section class="private-contact-homepage-stage-shell" aria-label="成长经历">
            ${createPrivateContactSectionHead('PERSONAL NOTES', aboutLabel, '不是设定原句，而是那些被时间慢慢养成的部分。')}
            <div class="private-contact-homepage-stage-list">
                ${stages.map(item => `
                    <article class="private-contact-homepage-stage">
                        <h3 class="private-contact-homepage-stage-title">${escapePrivateHtml(item.age)}</h3>
                        <p>${escapePrivateHtml(item.experience)}</p>
                    </article>
                `).join('')}
            </div>
        </section>
    `;
}

function createPrivateContactHomepageFlowMarkup(contact, record, activeSection, aboutLabel) {
    if (activeSection === 'more') {
        return `
            <section class="private-contact-homepage-flow private-contact-homepage-flow-more" aria-label="更多">
                ${createPrivateContactMetaMarkup(contact, record)}
            </section>
        `;
    }
    return `
        <section class="private-contact-homepage-flow private-contact-homepage-flow-about" aria-label="${escapePrivateHtml(aboutLabel)}">
            ${createPrivateContactLifeStagesMarkup(contact, record, aboutLabel)}
        </section>
    `;
}

function createPrivateContactFlowParagraphs(contact, record) {
    const title = String(contact?.title || record?.nickname || record?.name || '今天').trim();
    const realName = String(record?.name || title).trim();
    const setting = String(record?.setting || contact?.note || '').replace(/\s+/g, ' ').trim();
    const monologue = String(record?.monologue || '').trim();
    const account = normalizePrivateDossierAccount(contact?.accountId || record?.accountId);
    const label = record?.type === 'npc' || contact?.dossierType === 'npc' ? 'NPC' : 'CHAR';
    const lines = [
        `你好 现在你接收到的是来自 ${title} 的一封信`,
        `———･ﾟ ${realName} の先住子猫です ･ﾟ｡`,
        setting || `${label} 的设定还没有完整写下，但已经被收进通讯。`,
        monologue || `关于 ${title} 的更多内容会在这里慢慢展开。`,
        account ? `ID ${account} 只属于这一个联系人。` : ''
    ].filter(Boolean);

    return lines
        .map(line => `<p>${escapePrivateHtml(line)}</p>`)
        .join('');
}

function normalizePrivateContactSocialNumber(value, fallback) {
    const raw = String(value ?? '').replace(/[^\d]/g, '');
    const number = Number(raw);
    return Number.isFinite(number) && number > 0 ? number : fallback;
}

function formatPrivateContactSocialNumber(value) {
    return Number(value || 0).toLocaleString('en-US');
}

function getPrivateContactFollowedBy(record, contact) {
    const value = record?.followedBy;
    const names = Array.isArray(value)
        ? value
        : String(value || '').split(/[,/]/);
    const normalized = names.map(item => String(item || '').trim()).filter(Boolean).slice(0, 3);
    return normalized.length ? normalized : ['Rinno', record?.type === 'npc' || contact?.dossierType === 'npc' ? 'NPC' : 'CHAR'];
}

function createPrivateContactProfilePanelMarkup(contact, record) {
    const label = contact?.dossierType === 'npc' || record?.type === 'npc' ? 'NPC' : 'CHAR';
    const title = String(contact?.title || record?.nickname || record?.name || 'Contact').trim();
    const realName = String(record?.name || title).trim();
    const seed = Array.from(`${contact?.id || title}`).reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const followers = normalizePrivateContactSocialNumber(record?.socialFollowers, 160 + (seed % 720));
    const following = normalizePrivateContactSocialNumber(record?.socialFollowing, 12 + (seed % 88));
    const others = normalizePrivateContactSocialNumber(record?.socialOthers, 8 + (seed % 42));
    const followedBy = getPrivateContactFollowedBy(record, contact);
    const monologue = record?.monologue || record?.setting || contact?.note || '';

    return `
        <article class="dossier-profile-paper private-contact-profile-paper">
            <header class="dossier-profile-hero">
                ${createPrivateContactProfileAvatarMarkup(contact)}
                <div class="dossier-profile-identity">
                    <div class="dossier-profile-name-row">
                        <h2>@${escapePrivateHtml(title)}<span>${escapePrivateHtml(label)}</span></h2>
                    </div>
                    <p>${escapePrivateHtml(realName)}</p>
                </div>
            </header>
            <div class="dossier-profile-stats">
                <span>${formatPrivateContactSocialNumber(followers)} Followers</span>
                <i></i>
                <span>${formatPrivateContactSocialNumber(following)} Following</span>
            </div>
            <div class="dossier-profile-followed" aria-label="profile relation">
                <span></span><span></span><span></span>
                <p>Followed by <strong>${escapePrivateHtml(followedBy.join(', '))}</strong> and <strong>${formatPrivateContactSocialNumber(others)} others</strong></p>
            </div>
            <div class="dossier-profile-dots" aria-hidden="true">...</div>
            <section class="dossier-profile-monologue" aria-label="profile note">
                ${createPrivateContactProfileParagraphs(monologue)}
            </section>
        </article>
    `;
}

function createPrivateContactHomepageMarkup(contact, record) {
    const title = String(contact?.title || record?.nickname || record?.name || 'Contact').trim();
    const aboutLabel = getPrivateContactAboutLabel(record, contact);
    const contactId = String(contact?.id || '').trim();
    const coverStyle = createPrivateContactHomepageCoverStyle(contact);
    const coverClass = String(contact?.homepageCover || '').trim() ? ' has-custom-cover' : '';
    const signature = createPrivateContactSignature(contact, record);
    const activeSection = ['about', 'more'].includes(privateContactHomepageActiveSection)
        ? privateContactHomepageActiveSection
        : 'about';

    return `
        <article class="private-contact-homepage-paper" data-private-contact-homepage-id="${escapePrivateHtml(contactId)}">
            <span class="private-contact-homepage-watermark" aria-hidden="true">RINNO</span>
            <section class="private-contact-homepage-cover${coverClass}"${coverStyle} data-private-contact-homepage-cover="${escapePrivateHtml(contactId)}" role="button" tabindex="0" aria-label="更换角色主页背景图" title="更换背景图">
                <button class="private-contact-homepage-close interactive" type="button" data-private-contact-homepage-close aria-label="返回通讯">Back</button>
                <button class="private-contact-homepage-edit interactive" type="button" data-private-contact-homepage-edit="${escapePrivateHtml(contactId)}" aria-label="编辑联系人">Edit</button>
            </section>
            <section class="private-contact-homepage-head">
                ${createPrivateContactProfileAvatarMarkup(contact).replace('dossier-profile-avatar', 'private-contact-homepage-avatar')}
                <h2>@${escapePrivateHtml(title)}</h2>
                <p class="private-contact-homepage-signature">${escapePrivateHtml(signature)}</p>
            </section>
            <nav class="private-contact-homepage-tabs" aria-label="联系人主页">
                <button class="${activeSection === 'about' ? 'active ' : ''}interactive" type="button" data-private-contact-homepage-tab="about" data-private-contact-id="${escapePrivateHtml(contactId)}">${escapePrivateHtml(aboutLabel)}</button>
                <button class="${activeSection === 'more' ? 'active ' : ''}interactive" type="button" data-private-contact-homepage-tab="more" data-private-contact-id="${escapePrivateHtml(contactId)}">更多</button>
            </nav>
            ${createPrivateContactHomepageFlowMarkup(contact, record, activeSection, aboutLabel)}
            <div class="private-contact-homepage-links" aria-label="联系人功能入口">
                <button class="interactive private-contact-homepage-link private-contact-homepage-link-wide" type="button" data-private-contact-homepage-entry="朋友圈" data-private-contact-id="${escapePrivateHtml(contactId)}">
                    <span class="private-contact-homepage-link-copy">
                        <small>FIELD NOTES</small>
                        <b>朋友圈</b>
                    </span>
                    <i aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 6.5h14"/><path d="M5 12h14"/><path d="M5 17.5h9"/></svg></i>
                </button>
                <div class="private-contact-homepage-link-row" aria-label="聊天与视频">
                    <button class="interactive private-contact-homepage-link private-contact-homepage-link-chat" type="button" data-private-contact-homepage-entry="聊天" data-private-contact-id="${escapePrivateHtml(contactId)}">
                        <span class="private-contact-homepage-link-copy">
                            <small>PRIVATE LINE</small>
                            <b>聊天</b>
                        </span>
                        <i aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 6h14v10H9l-4 3V6z"/><path d="M9 10h6"/><path d="M9 13h4"/></svg></i>
                    </button>
                    <button class="interactive private-contact-homepage-link private-contact-homepage-link-video" type="button" data-private-contact-homepage-entry="视频" data-private-contact-id="${escapePrivateHtml(contactId)}" aria-label="视频" title="视频">
                        <span class="private-contact-homepage-link-copy">
                            <small>LIVE ROOM</small>
                            <b>视频</b>
                        </span>
                        <i aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="4.5" y="7" width="11" height="10" rx="1.5"/><path d="M15.5 10.2l4-2.2v8l-4-2.2"/></svg></i>
                    </button>
                </div>
            </div>
        </article>
    `;
}

function getPrivateContactHomepageCoverInput() {
    let input = document.getElementById('private-contact-homepage-cover-input');
    if (input) return input;
    input = document.createElement('input');
    input.id = 'private-contact-homepage-cover-input';
    input.type = 'file';
    input.accept = 'image/*';
    input.hidden = true;
    input.addEventListener('change', event => {
        const file = event.target.files?.[0];
        event.target.value = '';
        handlePrivateContactHomepageCoverUpload(file);
    });
    document.body.appendChild(input);
    return input;
}

function applyPrivateContactHomepageCover(page, contact) {
    const cover = String(contact?.homepageCover || '').trim();
    const coverEl = page?.querySelector?.('.private-contact-homepage-cover');
    if (!coverEl) return;
    if (!cover) {
        coverEl.classList.remove('has-custom-cover');
        coverEl.style.removeProperty('--private-contact-homepage-cover-image');
        coverEl.style.removeProperty('background-image');
        coverEl.style.removeProperty('background-size');
        coverEl.style.removeProperty('background-position');
        coverEl.style.removeProperty('background-repeat');
        return;
    }
    const safeCover = `url("${cover.replace(/"/g, '\\"')}")`;
    coverEl.classList.add('has-custom-cover');
    coverEl.style.setProperty('--private-contact-homepage-cover-image', safeCover);
    coverEl.style.setProperty('background-image', safeCover);
    coverEl.style.setProperty('background-size', 'cover');
    coverEl.style.setProperty('background-position', 'center center');
    coverEl.style.setProperty('background-repeat', 'no-repeat');
}

function readPrivateFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            resolve('');
            return;
        }
        const reader = new FileReader();
        reader.onerror = () => reject(reader.error);
        reader.onload = event => resolve(String(event.target?.result || ''));
        reader.readAsDataURL(file);
    });
}

function readPrivateImageFile(file, options = {}) {
    if (!file) return Promise.resolve('');
    const fileType = String(file.type || '').toLowerCase();
    if (!fileType.startsWith('image/') || fileType.includes('svg')) {
        return readPrivateFileAsDataUrl(file);
    }
    const maxEdge = Math.max(240, Number(options.maxEdge) || PRIVATE_IMAGE_MAX_EDGE);
    const quality = Math.min(0.92, Math.max(0.5, Number(options.quality) || PRIVATE_IMAGE_JPEG_QUALITY));
    return new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        const image = new Image();
        image.decoding = 'async';
        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            readPrivateFileAsDataUrl(file).then(resolve, reject);
        };
        image.onload = () => {
            try {
                const sourceWidth = image.naturalWidth || image.width;
                const sourceHeight = image.naturalHeight || image.height;
                if (!sourceWidth || !sourceHeight) {
                    URL.revokeObjectURL(objectUrl);
                    readPrivateFileAsDataUrl(file).then(resolve, reject);
                    return;
                }
                const sourceEdge = Math.max(sourceWidth, sourceHeight);
                if (sourceEdge <= maxEdge && file.size <= 450000) {
                    URL.revokeObjectURL(objectUrl);
                    readPrivateFileAsDataUrl(file).then(resolve, reject);
                    return;
                }
                const scale = Math.min(1, maxEdge / sourceEdge);
                const width = Math.max(1, Math.round(sourceWidth * scale));
                const height = Math.max(1, Math.round(sourceHeight * scale));
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const context = canvas.getContext('2d', { alpha: false });
                if (!context) throw new Error('Canvas unavailable.');
                context.fillStyle = '#fff';
                context.fillRect(0, 0, width, height);
                context.drawImage(image, 0, 0, width, height);
                const finish = blob => {
                    URL.revokeObjectURL(objectUrl);
                    if (blob) {
                        readPrivateFileAsDataUrl(blob).then(resolve, reject);
                        return;
                    }
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                if (canvas.toBlob) canvas.toBlob(finish, 'image/jpeg', quality);
                else finish(null);
            } catch (error) {
                URL.revokeObjectURL(objectUrl);
                readPrivateFileAsDataUrl(file).then(resolve, reject);
            }
        };
        image.src = objectUrl;
    });
}

async function handlePrivateContactHomepageCoverUpload(file) {
    const contactId = privateContactHomepageCoverTargetId;
    privateContactHomepageCoverTargetId = '';
    if (!file || !contactId) return;
    try {
        const content = await readPrivateImageFile(file);
        if (!content) return;
        const contacts = getPrivateScopedContacts()
            .map(getPrivateHydratedContact)
            .map(contact => String(contact?.id || '') === contactId
                ? { ...contact, homepageCover: content }
                : contact);
        setPrivateScopedContacts(contacts);
        await savePrivateState();
        openPrivateContactHomepage(contactId);
        showPrivateSystemToast('角色主页背景图已保存。');
    } catch (error) {
        console.error('角色主页背景图保存失败:', error);
        showPrivateSystemToast('背景图保存失败，请换一张图片。');
    }
}

function ensurePrivateContactProfileModal() {
    let modal = document.getElementById('private-contact-profile-modal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.className = 'private-contact-profile-modal dossier-profile-modal';
    modal.id = 'private-contact-profile-modal';
    modal.hidden = true;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'contact profile');
    modal.innerHTML = '<div class="dossier-profile-dialog" id="private-contact-profile-content"></div>';
    modal.addEventListener('click', event => {
        if (event.target === event.currentTarget) closePrivateContactProfileCard();
    });
    document.body.appendChild(modal);
    return modal;
}

function ensurePrivateContactHomepagePage() {
    let page = document.getElementById('private-contact-homepage-page');
    if (page) return page;
    const panelWrap = document.querySelector('.private-panel-wrap');
    if (!panelWrap) return null;
    page = document.createElement('section');
    page.className = 'private-pane private-contact-homepage-pane';
    page.id = 'private-contact-homepage-page';
    page.setAttribute('data-private-panel', 'contact-homepage');
    page.setAttribute('aria-label', '联系人主页');
    panelWrap.appendChild(page);
    return page;
}

function openPrivateContactHomepage(contactId, activeSection = privateContactHomepageActiveSection) {
    const contact = getPrivateContactById(contactId);
    if (!contact) return;
    const record = getPrivateContactProfileRecord(contact);
    const page = ensurePrivateContactHomepagePage();
    if (!page) return;
    const chatScreen = document.querySelector('.private-chat-screen');
    const currentTab = chatScreen?.getAttribute('data-private-current-tab') || 'contacts';
    if (currentTab !== 'contact-homepage') privateContactHomepageReturnTab = currentTab;
    privateContactHomepageActiveSection = ['about', 'more'].includes(activeSection) ? activeSection : 'about';
    page.innerHTML = createPrivateContactHomepageMarkup(contact, record);
    applyPrivateContactHomepageCover(page, contact);
    switchPrivateTab('contact-homepage');
    page.scrollTop = 0;
}

function openPrivateContactProfileCard(contactId) {
    const contact = getPrivateContactById(contactId);
    if (!contact) return;
    const record = getPrivateContactProfileRecord(contact);
    const modal = ensurePrivateContactProfileModal();
    const content = modal.querySelector('#private-contact-profile-content');
    if (!content) return;
    content.innerHTML = createPrivateContactProfilePanelMarkup(contact, record);
    modal.hidden = false;
    document.body.classList.add('private-contact-profile-open');
    requestAnimationFrame(() => modal.classList.add('active'));
}

function closePrivateContactProfileCard(instant = false) {
    const modal = document.getElementById('private-contact-profile-modal');
    if (!modal) return;
    modal.classList.remove('active');
    document.body.classList.remove('private-contact-profile-open');
    const hide = () => {
        if (!modal.classList.contains('active')) modal.hidden = true;
    };
    if (instant) hide();
    else window.setTimeout(hide, 180);
}

function openPrivateContactQuickEdit(contactId) {
    const contact = getPrivateContactById(contactId);
    const record = getPrivateContactProfileRecord(contact);
    if (!record) {
        showPrivateSystemToast('没有找到对应的卷宗资料。');
        return;
    }
    if (typeof openDossierApp === 'function') openDossierApp();
    window.setTimeout(() => {
        if (typeof openDossierEditor === 'function') {
            openDossierEditor(record.type, record.recordId);
        } else {
            showPrivateSystemToast('卷宗编辑器还没有准备好。');
        }
    }, 80);
}

function closePrivateContactHomepage(instant = false) {
    const page = document.getElementById('private-contact-homepage-page');
    const chatScreen = document.querySelector('.private-chat-screen');
    privateContactHomepageActiveSection = 'about';
    if (chatScreen?.getAttribute('data-private-current-tab') === 'contact-homepage') {
        switchPrivateTab(privateContactHomepageReturnTab || 'contacts');
    }
    if (page && instant) page.innerHTML = '';
}

function renderPrivateContactsLegacy() {
    const list = document.getElementById('private-contact-list');
    if (!list) return;
    const contacts = getPrivateScopedContacts().map(getPrivateHydratedContact);
    setPrivateScopedContacts(contacts);
    if (!contacts.length) {
        list.innerHTML = '<div class="private-contact-empty" role="status"><span>暂无常驻联系人</span></div>';
        return;
    }
    list.innerHTML = contacts.map(contact => {
        const avatarStyle = contact.avatar ? ` style="background-image:url(&quot;${escapePrivateHtml(contact.avatar)}&quot;)"` : '';
        return `
        <article class="private-contact-card interactive" role="button" tabindex="0" data-private-contact="${escapePrivateHtml(contact.id)}">
            <div class="private-contact-mark ${contact.avatar ? 'has-image' : ''}"${avatarStyle} aria-hidden="true">${escapePrivateHtml(getPrivateContactMark(contact))}</div>
            <div class="private-contact-copy">
                <div class="private-contact-title">${escapePrivateHtml(contact.title)}</div>
                <div class="private-contact-sub">${escapePrivateHtml(contact.subtitle)}</div>
                <p class="private-contact-note">${escapePrivateHtml(contact.note)}</p>
            </div>
            <button class="private-contact-edit interactive" type="button" aria-label="编辑联系人">
                <svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
            </button>
        </article>
    `;
    }).join('');
}

function renderPrivateContacts() {
    const list = document.getElementById('private-contact-list');
    if (!list) return;
    const contacts = getPrivateScopedContacts().map(getPrivateHydratedContact);
    setPrivateScopedContacts(contacts);
    if (!contacts.length) {
        list.innerHTML = '<div class="private-contact-empty" role="status"><span>暂无常驻联系人</span></div>';
        return;
    }
    list.innerHTML = contacts.map(contact => `
        <article class="private-contact-card interactive" data-private-contact="${escapePrivateHtml(contact.id)}" data-private-contact-title="${escapePrivateHtml(contact.title)}">
            <div class="private-contact-rail">
                <button class="private-contact-arrow interactive" type="button" data-private-contact-profile-card="${escapePrivateHtml(contact.id)}" aria-label="Open profile card" title="Profile card">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                <div class="private-contact-title">${escapePrivateHtml(contact.title)}</div>
                <button class="private-contact-edit interactive" type="button" data-private-contact-edit="${escapePrivateHtml(contact.id)}" aria-label="Edit contact" title="Edit contact">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
                </button>
            </div>
            <button class="private-contact-face interactive" type="button" data-private-contact-homepage="${escapePrivateHtml(contact.id)}" aria-label="Open ${escapePrivateHtml(contact.title)} homepage">
                ${createPrivateContactPreviewAvatarMarkup(contact)}
            </button>
            <div class="private-contact-copy">
                <div class="private-contact-sub">${escapePrivateHtml(contact.subtitle)}</div>
                <p class="private-contact-note">${escapePrivateHtml(contact.note)}</p>
            </div>
        </article>
    `).join('');
}

function renderPrivateMoments() {
    const feed = document.getElementById('private-moment-feed');
    if (!feed) return;
    const moments = normalizePrivateMoments(privateState.moments, createDefaultPrivateState().moments);
    privateState.moments = moments;
    if (!moments.length) {
        feed.innerHTML = '<div class="private-moment-empty" aria-hidden="true"></div>';
        return;
    }
    feed.innerHTML = moments.map(moment => `
        <article class="private-moment-card">
            <div class="private-moment-avatar" aria-hidden="true">我</div>
            <div>
                <div class="private-moment-name">${escapePrivateHtml(getPrivateDisplayName())}</div>
                <h3 class="private-moment-title">${escapePrivateHtml(moment.title)}</h3>
                <p class="private-moment-text">${escapePrivateHtml(moment.text)}</p>
                <div class="private-moment-meta">
                    <span>${escapePrivateHtml(moment.time)} · ${escapePrivateHtml(moment.mood)}</span>
                    <button class="private-moment-tool interactive" type="button" aria-label="动态操作">
                        <svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
                    </button>
                </div>
            </div>
        </article>
    `).join('');
    feed.querySelectorAll('.private-moment-avatar').forEach(el => updatePrivateAvatarElement(el, privateState.avatar));
}

function renderPrivateProfileSurface() {
    updatePrivateAvatarElement(document.getElementById('private-profile-avatar'), privateState.avatar);
    updatePrivateAvatarElement(document.getElementById('private-moments-avatar'), privateState.avatar);

    setPrivateEditableText('[data-private-profile-field="nickname"]', getPrivateDisplayName());
    setPrivateEditableText('[data-private-profile-field="profileBio"]', privateState.profileBio || createDefaultPrivateState().profileBio);
    setPrivateEditableText('[data-private-profile-field="maskName"]', privateState.maskName || createDefaultPrivateState().maskName);
    setPrivateEditableText('[data-private-profile-field="preferenceNote"]', privateState.preferenceNote || createDefaultPrivateState().preferenceNote);
    renderPrivateUserPresetSurface();

    const mail = document.getElementById('private-profile-mail');
    const issue = document.getElementById('private-chat-issue');
    const stamp = document.getElementById('private-moment-stamp');
    const momentsName = document.getElementById('private-moments-name');
    if (mail) mail.textContent = getPrivateAccountLine();
    if (issue) issue.textContent = '把想说的话留到安静处慢慢展开。';
    if (stamp) stamp.textContent = getPrivateMonthStamp();
    if (momentsName) momentsName.textContent = getPrivateDisplayName();
}

function renderPrivateExperience() {
    renderPrivateProfileSurface();
    renderPrivateThreads();
    renderPrivateContacts();
    renderPrivateMoments();
    if (privateActiveContactChatId) renderPrivateContactChatPage(privateActiveContactChatId);
}

function switchPrivateTab(name, announce = false) {
    const target = ['whisper', 'contacts', 'time', 'monologue', 'contact-homepage', 'contact-chat'].includes(name) ? name : 'whisper';
    const chatScreen = document.querySelector('.private-chat-screen');
    if (chatScreen) chatScreen.setAttribute('data-private-current-tab', target);
    document.body.classList.toggle('private-contact-homepage-open', target === 'contact-homepage');
    document.body.classList.toggle('private-contact-chat-open', target === 'contact-chat');
    document.querySelectorAll('[data-private-tab]').forEach(tab => {
        tab.classList.toggle('active', tab.getAttribute('data-private-tab') === target);
    });
    document.querySelectorAll('[data-private-panel]').forEach(panel => {
        panel.classList.toggle('active', panel.getAttribute('data-private-panel') === target);
    });
    renderPrivateExperience();
    const activePanel = document.querySelector(`[data-private-panel="${target}"]`);
    if (activePanel) activePanel.scrollTop = 0;
    const title = document.getElementById('private-chat-title');
    if (title) title.textContent = 'PRIVATE';
    if (announce) hidePrivateSystemToast(true);
}

async function addPrivateThread(type) {
    renderPrivateThreads();
    switchPrivateTab(type === 'group' ? 'contacts' : 'whisper');
    await savePrivateState();
    showPrivateSystemToast('Threads stay clean until you open a contact chat.');
    return;
    showPrivateSystemToast('消息列表保持空白。');
}

function createPrivateMomentTitle(text) {
    const compact = String(text || '').replace(/\s+/g, '');
    if (!compact) return '今日拾光';
    return compact.length > 8 ? `${compact.slice(0, 8)}…` : compact;
}

async function publishPrivateMoment() {
    const editor = document.getElementById('private-moment-editor');
    const text = editor?.textContent.replace(/\s+/g, ' ').trim() || '';
    if (!text) {
        showPrivateSystemToast('先写下一段动态，再发送到拾光。');
        return;
    }
    const moment = {
        id: `moment-${Date.now()}`,
        title: createPrivateMomentTitle(text),
        text,
        mood: 'LIVE MOMENT',
        time: getPrivateMonthStamp()
    };
    privateState.moments = [moment, ...normalizePrivateMoments(privateState.moments, createDefaultPrivateState().moments)].slice(0, 16);
    if (editor) editor.textContent = '';
    renderPrivateMoments();
    await savePrivateState();
    closePrivateMomentComposer();
    showPrivateSystemToast('动态已收入拾光。');
}

async function savePrivateProfileFromPage() {
    const getFieldText = key => document.querySelector(`[data-private-profile-field="${key}"]`)?.textContent.trim() || '';
    privateState.nickname = getFieldText('nickname') || getPrivateDisplayName();
    privateState.userPresetName = privateState.nickname;
    privateState.profileBio = getFieldText('profileBio') || createDefaultPrivateState().profileBio;
    privateState.maskName = getFieldText('maskName') || createDefaultPrivateState().maskName;
    privateState.preferenceNote = getFieldText('preferenceNote') || createDefaultPrivateState().preferenceNote;
    syncPrivateIdentitySlot();
    renderPrivateState();
    await savePrivateState();
    showPrivateSystemToast('独白资料已保存。');
}

function renderPrivateState() {
    setApiInputValue('private-register-nickname', privateState.nickname);
    setApiInputValue('private-register-email', privateState.email);
    setApiInputValue('private-register-password', privateState.password);

    const registerAgree = document.getElementById('private-register-agree');
    const privacyAgree = document.getElementById('private-privacy-agree');
    if (registerAgree) registerAgree.checked = Boolean(privateState.agreementAccepted);
    if (privacyAgree) privacyAgree.checked = Boolean(privateState.privacyAccepted);
    const registerLogin = document.getElementById('private-register-login');
    if (registerLogin) registerLogin.hidden = !hasRegisteredPrivateAccount();

    updatePrivateAvatarElement(document.getElementById('private-avatar-frame'), privateState.avatar);

    const code = privateState.verifyCode || '20';
    const verifyEmail = document.getElementById('private-verify-email');
    const verifyContent = document.getElementById('private-verify-content');
    const verifyTo = document.getElementById('private-verify-to');
    if (verifyEmail) verifyEmail.textContent = privateState.email || '-';
    if (verifyContent) verifyContent.textContent = `注册私叙${code}`;
    if (verifyTo) verifyTo.textContent = PRIVATE_LETTER_TO;

    const sentButton = document.getElementById('private-sent-letter');
    const verifyNext = document.getElementById('private-verify-next');
    const verifyScreen = document.querySelector('[data-private-screen="verify"]');
    if (sentButton) {
        sentButton.disabled = !privateState.letterSent;
        sentButton.textContent = privateState.letterSent ? '信笺已发送' : '已发送信笺';
    }
    if (verifyNext) verifyNext.disabled = !privateState.verified;
    if (verifyScreen) verifyScreen.classList.toggle('verified', Boolean(privateState.verified));

    renderPrivateLoginIdentity();
    renderPrivateExperience();
    if (!document.getElementById('private-settings-modal')?.hidden) renderPrivateSettingsAccounts();
}

function showPrivateScreen(name) {
    const app = document.getElementById('private-app');
    document.querySelectorAll('[data-private-screen]').forEach(screen => {
        screen.classList.toggle('active', screen.getAttribute('data-private-screen') === name);
    });
    if (name === 'login') setPrivateLoginMode(privateLoginMode);
    if (name === 'chat') {
        closePrivateContactChatAuxiliaryUi(true);
        clearPrivateContactChatEphemeralState();
        switchPrivateTab('whisper');
    }
    renderPrivateState();
    if (app) app.scrollTop = 0;
    const activeScreen = document.querySelector(`[data-private-screen="${name}"]`);
    if (activeScreen) activeScreen.scrollTop = 0;
    const guideText = getPrivateGuideText(name);
    queuePrivateGuideToast(name, guideText);
}

async function openPrivateApp() {
    const privateApp = document.getElementById('private-app');
    if (!privateApp) return;
    document.body.classList.remove('edit-mode');
    closeSettingsApp(true);
    closeLetterApp(true);
    closePrologueApp(true);
    closeStyleApp(true);
    document.body.classList.add('private-open');
    privateApp.classList.add('active');
    showPrivateScreen(choosePrivateInitialScreen());
    Promise.resolve(privateStateReady)
        .then(() => {
            if (privateApp.classList.contains('active')) showPrivateScreen(choosePrivateInitialScreen());
        })
        .catch(error => console.error('私叙状态加载失败:', error));
}

function closePrivateApp(instant = false) {
    const privateApp = document.getElementById('private-app');
    clearPrivateGuideToast();
    closePrivateTermsModal();
    closePrivateContactAccountModal(true);
    closePrivateContactChat(true);
    closePrivateContactHomepage(true);
    closePrivateMomentComposer(true);
    closePrivateUserPresetEditor(true);
    closePrivateSettingsPanel(true);
    hidePrivateCodeToast(true);
    hidePrivateSystemToast(true);
    if (privateApp) {
        if (instant) {
            const previousTransition = privateApp.style.transition;
            privateApp.style.transition = 'none';
            privateApp.classList.remove('active');
            privateApp.offsetHeight;
            requestAnimationFrame(() => {
                privateApp.style.transition = previousTransition;
            });
        } else {
            privateApp.classList.remove('active');
        }
    }
    document.body.classList.remove('private-open');
}

async function handlePrivateRegister(event) {
    event.preventDefault();
    const nickname = document.getElementById('private-register-nickname')?.value.trim() || '';
    const email = normalizePrivateIdentityId(document.getElementById('private-register-email')?.value || '');
    const password = document.getElementById('private-register-password')?.value || '';
    const agreed = Boolean(document.getElementById('private-register-agree')?.checked);

    if (!nickname) {
        setPrivateMessage('private-register-message', '请先填写昵称。', 'error');
        return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setPrivateMessage('private-register-message', '请填写可用的邮箱号码。', 'error');
        return;
    }
    if (password.length < 8 || password.length > 12) {
        setPrivateMessage('private-register-message', '密码需要是 8-12 位。', 'error');
        return;
    }
    if (!agreed) {
        setPrivateMessage('private-register-message', '需要先勾选并同意服务协议。', 'error');
        return;
    }

    if (findRegisteredPrivateIdentity(email)) {
        setPrivateMessage('private-register-message', '该邮箱已注册，请直接登录。', 'error');
        return;
    }

    syncPrivateIdentitySlot();
    const identities = normalizePrivateIdentitySlots(privateState.identities);
    const previousLastAccountId = normalizePrivateIdentityId(privateState.lastAccountId);
    const draftAvatar = isCompleteRegisteredPrivateAccount(createPrivateIdentitySnapshot()) ? '' : privateState.avatar;
    privateState = {
        ...createDefaultPrivateState(),
        identities,
        registered: false,
        nickname,
        email,
        userPresetName: nickname,
        userPresetId: email,
        password,
        avatar: draftAvatar,
        agreementAccepted: true,
        privacyAccepted: false,
        verifyCode: createPrivateTwoDigit(),
        letterSent: false,
        letterSentAt: 0,
        verified: false,
        lastLoginAt: 0,
        lastAccountId: previousLastAccountId,
        loginOtherAccount: false
    };
    syncPrivateIdentitySlot();
    await savePrivateState();
    setPrivateMessage('private-register-message', '');
    showPrivateSystemToast('注册信息已保存，请继续阅读隐私保护指引。');
    showPrivateScreen('privacy');
}

async function handlePrivatePrivacyNext() {
    const agreed = Boolean(document.getElementById('private-privacy-agree')?.checked);
    if (!agreed) {
        setPrivateMessage('private-privacy-message', '需要先勾选并同意上述条款。', 'error');
        return;
    }
    privateState.privacyAccepted = true;
    if (!/^\d{2}$/.test(privateState.verifyCode)) privateState.verifyCode = createPrivateTwoDigit();
    await savePrivateState();
    setPrivateMessage('private-privacy-message', '');
    showPrivateSystemToast('已同意隐私条款，请发送信笺完成邮箱验证。');
    showPrivateScreen('verify');
}

function getLetterFieldElements() {
    return {
        to: document.querySelector('[data-edit-id="letter_to"]'),
        subject: document.querySelector('[data-edit-id="letter_subject"]'),
        body: document.querySelector('[data-edit-id="letter_body"]'),
        signature: document.querySelector('[data-edit-id="letter_signature"]')
    };
}

function captureLetterFields() {
    const fields = getLetterFieldElements();
    return Object.fromEntries(Object.entries(fields).map(([key, el]) => [key, el?.textContent || '']));
}

function setLetterFields(values) {
    const fields = getLetterFieldElements();
    Object.entries(values).forEach(([key, value]) => {
        if (fields[key]) fields[key].textContent = value;
    });
}

function restoreLetterSnapshot() {
    if (!privateAuthLetterSnapshot) return;
    setLetterFields(privateAuthLetterSnapshot);
    privateAuthLetterSnapshot = null;
}

function openPrivateVerificationLetter() {
    if (!privateState.email || !privateState.privacyAccepted) {
        setPrivateMessage('private-verify-message', '请先完成邮箱注册和隐私确认。', 'error');
        return;
    }
    if (!/^\d{2}$/.test(privateState.verifyCode)) privateState.verifyCode = createPrivateTwoDigit();
    privateAuthLetterMode = true;
    privateAuthLetterSnapshot = captureLetterFields();
    setLetterFields({
        to: PRIVATE_LETTER_TO,
        subject: '私叙注册验证',
        body: `注册私叙${privateState.verifyCode}`,
        signature: privateState.nickname || '私叙'
    });
    renderLetterSentAuthCard();
    showPrivateSystemToast('已为你填好验证信笺，请点击寄出图标。');
    openLetterApp({ preservePrivate: true });
}

async function markPrivateLetterSent() {
    privateState.letterSent = true;
    privateState.verified = true;
    privateState.letterSentAt = Date.now();
    await savePrivateState();
    renderPrivateState();
    renderLetterSentAuthCard();
    restoreLetterSnapshot();
    privateAuthLetterMode = false;
    showPrivateSystemToast('信笺已寄出，返回私叙后完成注册。');
}

function renderLetterSentAuthCard() {
    const card = document.getElementById('letter-auth-sent-card');
    const sub = document.getElementById('letter-auth-sent-sub');
    const date = document.getElementById('letter-auth-sent-date');
    if (!card) return;
    card.hidden = !privateState.letterSent;
    if (sub) sub.textContent = `注册私叙${privateState.verifyCode || '20'} · 已寄出`;
    if (date) {
        const sentAt = Number(privateState.letterSentAt) || Date.now();
        date.textContent = String(new Date(sentAt).getDate()).padStart(2, '0');
    }
}

function handlePrivateVerifyNext() {
    if (!privateState.verified) {
        setPrivateMessage('private-verify-message', '需要先发送信笺完成验证。', 'error');
        return;
    }
    setPrivateMessage('private-verify-message', '');
    renderPrivateState();
    showPrivateScreen('verified');
}

async function finishPrivateRegister() {
    if (!privateState.verified) {
        setPrivateMessage('private-verify-message', '需要先发送信笺完成验证。', 'error');
        return;
    }
    privateState.registered = true;
    privateState.createdAt = privateState.createdAt || new Date().toISOString();
    privateState.lastLoginAt = 0;
    privateState.loginOtherAccount = false;
    privateState.userPresetName = privateState.nickname || privateState.userPresetName;
    privateState.userPresetId = getPrivateBoundIdentityId();
    privateState.lastAccountId = getPrivateBoundIdentityId();
    syncPrivateIdentitySlot();
    await savePrivateState();
    privateLoginCode = '';
    setPrivateLoginMode('password');
    showPrivateSystemToast('注册完成，请使用密码或信笺验证码登录。');
    showPrivateScreen('login');
}

function setPrivateLoginMode(mode, announce = false) {
    privateLoginMode = privateState.loginOtherAccount ? 'password' : (mode === 'code' ? 'code' : 'password');
    const isCode = privateLoginMode === 'code';
    const isOtherAccount = Boolean(privateState.loginOtherAccount);
    const accountField = document.getElementById('private-login-account-field');
    const field = document.getElementById('private-login-field');
    const label = document.getElementById('private-login-label');
    const input = document.getElementById('private-login-input');
    const codeButton = document.getElementById('private-code-button');
    const toggle = document.getElementById('private-login-toggle');
    const otherButton = document.getElementById('private-login-other');

    if (accountField) accountField.hidden = !isOtherAccount;
    field?.classList.toggle('code-field', isCode);
    if (label) label.textContent = isCode ? '验证码' : '密码';
    if (input) {
        input.value = '';
        input.type = isCode ? 'text' : 'password';
        input.inputMode = isCode ? 'numeric' : 'text';
        input.maxLength = isCode ? 6 : 128;
        input.placeholder = isCode ? '输入 6 位验证码' : '输入密码';
        input.autocomplete = isCode ? 'one-time-code' : 'current-password';
    }
    if (codeButton) codeButton.hidden = !isCode;
    if (toggle) {
        toggle.hidden = isOtherAccount;
        toggle.textContent = isCode ? '用密码登录' : '用信笺验证码登录';
    }
    if (otherButton) otherButton.textContent = isOtherAccount ? '登录当前账号' : '登录其它账号';
    renderPrivateLoginIdentity();
    setPrivateMessage('private-login-message', '');
    if (announce) {
        showPrivateSystemToast(isCode ? '已切换为信笺验证码登录，请先获取验证码。' : '已切换为密码登录，请输入注册密码。');
    }
}

function setPrivateLoginOtherAccountMode(enabled, announce = false) {
    privateState.loginOtherAccount = Boolean(enabled);
    privateLoginCode = '';
    setPrivateLoginMode('password');
    const accountInput = document.getElementById('private-login-account-input');
    const passwordInput = document.getElementById('private-login-input');
    if (accountInput && privateState.loginOtherAccount) {
        accountInput.value = '';
        window.setTimeout(() => accountInput.focus(), 80);
    } else {
        window.setTimeout(() => passwordInput?.focus(), 80);
    }
    if (announce) {
        showPrivateSystemToast(privateState.loginOtherAccount ? '请输入账号邮箱和密码登录。' : '已回到当前账号登录。');
    }
}

function showPrivateCodeToast(code) {
    const toast = document.getElementById('private-code-toast');
    const text = document.getElementById('private-code-toast-text');
    if (!toast) return;
    if (text) text.textContent = `信笺收到验证码 ${code}`;
    toast.hidden = false;
    requestAnimationFrame(() => toast.classList.add('active'));
    window.clearTimeout(privateLoginToastTimer);
    privateLoginToastTimer = window.setTimeout(() => hidePrivateCodeToast(), 4000);
}

function hidePrivateCodeToast(instant = false) {
    const toast = document.getElementById('private-code-toast');
    if (!toast) return;
    window.clearTimeout(privateLoginToastTimer);
    toast.classList.remove('active');
    if (instant) {
        toast.hidden = true;
        return;
    }
    window.setTimeout(() => {
        if (!toast.classList.contains('active')) toast.hidden = true;
    }, 180);
}

function requestPrivateLoginCode() {
    if (!privateState.loginOtherAccount && !getLastPrivateAccountSlot()) {
        setPrivateMessage('private-login-message', '请先注册账号。', 'error');
        showPrivateScreen('register');
        return;
    }
    privateLoginCode = createPrivateSixDigit();
    const button = document.getElementById('private-code-button');
    if (button) button.textContent = '重新获取验证';
    showPrivateCodeToast(privateLoginCode);
    setPrivateMessage('private-login-message', '验证码已通过信笺横幅送达。', 'success');
}

async function submitPrivateLogin() {
    const input = document.getElementById('private-login-input');
    const value = input?.value.trim() || '';
    if (privateState.loginOtherAccount) {
        const account = document.getElementById('private-login-account-input')?.value.trim() || '';
        const slot = getPrivateRegisteredIdentityById(account);
        if (!account) {
            setPrivateMessage('private-login-message', '请先输入账号邮箱。', 'error');
            return;
        }
        if (!isCompleteRegisteredPrivateAccount(slot)) {
            setPrivateMessage('private-login-message', '没有找到这个已注册账号。', 'error');
            return;
        }
        if (!value) {
            setPrivateMessage('private-login-message', '请先输入密码。', 'error');
            return;
        }
        if (value !== slot.password) {
            setPrivateMessage('private-login-message', '账号或密码不正确。', 'error');
            return;
        }
        await switchPrivateAccount(account, '登录成功。');
        return;
    }
    const loginSlot = getLastPrivateAccountSlot();
    if (!loginSlot) {
        setPrivateMessage('private-login-message', '请先注册账号。', 'error');
        showPrivateScreen('register');
        return;
    }
    if (privateLoginMode === 'password') {
        if (!value) {
            setPrivateMessage('private-login-message', '请先输入密码。', 'error');
            return;
        }
        if (value !== loginSlot.password) {
            setPrivateMessage('private-login-message', '密码不正确。', 'error');
            return;
        }
    } else {
        if (!privateLoginCode) {
            setPrivateMessage('private-login-message', '请先获取信笺验证码。', 'error');
            return;
        }
        if (value !== privateLoginCode) {
            setPrivateMessage('private-login-message', '验证码不正确。', 'error');
            return;
        }
    }

    await switchPrivateAccount(loginSlot.userPresetId || loginSlot.email, '登录成功，三天内再次进入私叙无需登录。');
}

async function handlePrivateAvatarUpload(file) {
    if (!file) return;
    try {
        const content = await readPrivateImageFile(file, {
            maxEdge: PRIVATE_AVATAR_IMAGE_MAX_EDGE,
            quality: 0.82
        });
        if (!content) return;
        privateState.avatar = content;
        syncPrivateIdentitySlot();
        renderPrivateState();
        await savePrivateState();
    } catch (error) {
        console.error('头像保存失败:', error);
        showPrivateSystemToast('头像保存失败，请换一张图片。');
    }
}

async function logoutPrivateAccount() {
    const currentSnapshot = createPrivateIdentitySnapshot();
    if (isCompleteRegisteredPrivateAccount(currentSnapshot)) {
        rememberPrivateAccountSlot(currentSnapshot);
        syncPrivateIdentitySlot();
    } else {
        const lastSlot = getLastPrivateAccountSlot();
        if (lastSlot) rememberPrivateAccountSlot(lastSlot);
    }
    privateState.lastLoginAt = 0;
    privateState.loginOtherAccount = false;
    await savePrivateState();
    closePrivateSettingsPanel(true);
    hidePrivateSystemToast(true);
    setPrivateLoginMode('password');
    showPrivateScreen('login');
}

async function startPrivateRegistrationFromLogin() {
    syncPrivateIdentitySlot();
    privateState = createPrivateRegistrationDraft(privateState.identities, privateState.lastAccountId);
    await savePrivateState();
    renderPrivateState();
    showPrivateScreen('register');
}

function switchPrivateRegisterToLogin() {
    if (!hasRegisteredPrivateAccount()) {
        setPrivateMessage('private-register-message', '请先完成注册。', 'error');
        return;
    }
    privateState.loginOtherAccount = true;
    setPrivateLoginMode('password');
    showPrivateScreen('login');
    window.setTimeout(() => document.getElementById('private-login-account-input')?.focus(), 80);
}

function exportPrivateChatRecords() {
    syncPrivateIdentitySlot();
    const currentId = getPrivateBoundIdentityId();
    const identities = normalizePrivateIdentitySlots(privateState.identities);
    const identity = identities[currentId] || createPrivateIdentitySnapshot();
    const exportedIdentity = {
        ...identity,
        password: ''
    };
    const payload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        currentId,
        identity: exportedIdentity,
        chatRecords: {
            threads: normalizePrivateThreads(identity.threads)
        },
        charInfo: {
            nickname: identity.userPresetName || identity.nickname || '',
            account: identity.email || identity.userPresetId || currentId,
            avatar: identity.avatar || '',
            profileBio: identity.profileBio || '',
            maskName: identity.maskName || '',
            preferenceNote: identity.preferenceNote || '',
            userPresetName: identity.userPresetName || '',
            userPresetGender: identity.userPresetGender || '',
            userPresetSetting: identity.userPresetSetting || '',
            contacts: scopePrivateContacts(identity.contacts, currentId),
            moments: normalizePrivateMoments(identity.moments, [])
        }
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `private-records-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showPrivateSystemToast('聊天记录已导出。');
}

function importPrivateChatRecords(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async event => {
        try {
            const payload = JSON.parse(String(event.target?.result || '{}'));
            const incoming = payload.identity
                ? normalizePrivateIdentitySlots({ [payload.currentId || payload.identity.userPresetId || payload.identity.email]: payload.identity })
                : normalizePrivateIdentitySlots(payload.identities);
            if (!Object.keys(incoming).length) throw new Error('没有可导入的私叙记录。');
            const existing = normalizePrivateIdentitySlots(privateState.identities);
            Object.entries(incoming).forEach(([id, slot]) => {
                if (!slot.password && existing[id]?.password) slot.password = existing[id].password;
            });
            privateState.identities = {
                ...existing,
                ...incoming
            };
            applyPrivateIdentitySlot();
            renderPrivateState();
            await savePrivateState();
            showPrivateSystemToast('聊天记录已导入。');
        } catch (error) {
            showPrivateSystemToast(error.message || '导入失败，请检查文件。');
        }
    };
    reader.readAsText(file);
}

function normalizePrivateAuthLayout() {
    const registerTopbar = document.querySelector('.private-register-screen .private-topbar');
    const registerExit = document.getElementById('private-register-exit');
    if (registerTopbar && registerExit) {
        const spacer = document.createElement('div');
        spacer.className = 'private-topbar-spacer';
        spacer.setAttribute('aria-hidden', 'true');
        registerTopbar.replaceChild(spacer, registerExit);
    }

    const loginField = document.getElementById('private-login-field');
    const loginFields = loginField?.closest('.private-login-fields');
    const loginToggle = document.getElementById('private-login-toggle');
    const loginMessage = document.getElementById('private-login-message');
    if (loginField && loginFields && loginToggle && loginToggle.parentElement === loginField) {
        loginFields.insertBefore(loginToggle, loginMessage || null);
    }

    const loginForm = document.getElementById('private-login-form');
    const loginActions = document.querySelector('.private-login-bottom-actions');
    const loginLinks = document.querySelector('.private-login-links');
    if (loginForm && loginActions && loginLinks && loginLinks.parentElement === loginActions) {
        loginActions.insertAdjacentElement('afterend', loginLinks);
    }
    if (loginLinks) {
        const exportButton = document.getElementById('private-export-records');
        const importButton = document.getElementById('private-import-records');
        const registerButton = document.getElementById('private-login-register');
        [exportButton, importButton, registerButton].forEach(button => {
            if (button && button.parentElement === loginLinks) loginLinks.appendChild(button);
        });
    }
}

function bindPrivateMomentTools() {
    document.getElementById('private-moment-refresh')?.addEventListener('click', e => {
        e.preventDefault();
        e.stopImmediatePropagation();
        renderPrivateMoments();
        showPrivateSystemToast('朋友圈已刷新。');
    });

    document.getElementById('private-moment-notify')?.addEventListener('click', e => {
        e.preventDefault();
        e.stopImmediatePropagation();
        showPrivateSystemToast('通知入口已就绪。');
    });

    document.getElementById('private-moment-camera')?.addEventListener('click', e => {
        e.preventDefault();
        e.stopImmediatePropagation();
        openPrivateMomentComposer();
    });
}

normalizePrivateAuthLayout();

function bindPrivateAuthActions() {
    const registerForm = document.getElementById('private-register-form');
    if (registerForm && !registerForm.dataset.privateAuthBound) {
        registerForm.dataset.privateAuthBound = 'true';
        registerForm.addEventListener('submit', handlePrivateRegister);
    }

    const bindClick = (id, handler) => {
        const element = document.getElementById(id);
        const boundKey = `privateAuthBound${id.replace(/[^a-z0-9]/gi, '')}`;
        if (!element || element.dataset[boundKey]) return;
        element.dataset[boundKey] = 'true';
        element.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            handler(event);
        });
    };

    bindClick('private-register-exit', () => closePrivateApp());
    bindClick('private-open-terms', () => openPrivateTermsModal());
    bindClick('private-terms-ok', () => closePrivateTermsModal());
    bindClick('private-privacy-next', () => handlePrivatePrivacyNext());
    bindClick('private-send-letter', () => openPrivateVerificationLetter());
    bindClick('private-sent-letter', () => {
        if (!privateState.letterSent) return;
        privateState.verified = true;
        renderPrivateState();
    });
    bindClick('private-verify-next', () => handlePrivateVerifyNext());
    bindClick('private-finish-register', () => finishPrivateRegister());
    bindClick('private-login-toggle', () => {
        setPrivateLoginMode(privateLoginMode === 'password' ? 'code' : 'password', true);
    });
    bindClick('private-code-button', () => requestPrivateLoginCode());
    bindClick('private-login-submit', () => submitPrivateLogin());
    bindClick('private-avatar-frame', () => document.getElementById('private-avatar-input')?.click());
    bindClick('private-profile-avatar', () => document.getElementById('private-avatar-input')?.click());
    bindClick('private-copy-code', () => {
        if (!privateLoginCode) return;
        navigator.clipboard?.writeText(privateLoginCode);
        const copyButton = document.getElementById('private-copy-code');
        if (!copyButton) return;
        copyButton.textContent = '已复制';
        window.setTimeout(() => {
            copyButton.textContent = '复制';
        }, 900);
    });

    const loginForm = document.getElementById('private-login-form');
    if (loginForm && !loginForm.dataset.privateAuthBound) {
        loginForm.dataset.privateAuthBound = 'true';
        loginForm.addEventListener('submit', event => {
            event.preventDefault();
            event.stopPropagation();
            submitPrivateLogin();
        });
    }

    const avatarInput = document.getElementById('private-avatar-input');
    if (avatarInput && !avatarInput.dataset.privateAuthBound) {
        avatarInput.dataset.privateAuthBound = 'true';
        avatarInput.addEventListener('change', event => {
            handlePrivateAvatarUpload(event.target.files?.[0]);
            event.target.value = '';
        });
    }

    const loginInput = document.getElementById('private-login-input');
    if (loginInput && !loginInput.dataset.privateAuthBound) {
        loginInput.dataset.privateAuthBound = 'true';
        loginInput.addEventListener('input', event => {
            if (privateLoginMode === 'code') event.target.value = event.target.value.replace(/\D/g, '').slice(0, 6);
        });
    }

    const letterSend = document.getElementById('letter-send-button');
    if (letterSend && !letterSend.dataset.privateAuthBound) {
        letterSend.dataset.privateAuthBound = 'true';
        letterSend.addEventListener('click', event => {
            if (!privateAuthLetterMode) return;
            event.preventDefault();
            event.stopPropagation();
            markPrivateLetterSent();
        });
    }
}

bindPrivateAuthActions();

document.getElementById('private-moment-close')?.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    closePrivateMomentComposer();
});

document.getElementById('private-moment-modal-backdrop')?.addEventListener('click', e => {
    if (e.target !== e.currentTarget) return;
    e.preventDefault();
    e.stopPropagation();
    closePrivateMomentComposer();
});

document.getElementById('private-persona-edit')?.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    openPrivateUserPresetEditor();
});

document.getElementById('private-user-preset-cancel')?.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    closePrivateUserPresetEditor();
});

bindPrivateBackdropDismiss(
    document.getElementById('private-user-preset-modal'),
    '.private-user-preset-dialog',
    () => closePrivateUserPresetEditor()
);

document.getElementById('private-user-preset-form')?.addEventListener('submit', savePrivateUserPresetFromForm);

document.getElementById('private-contact-account-form')?.addEventListener('submit', e => {
    e.preventDefault();
    e.stopPropagation();
    renderPrivateContactAccountResults();
});

bindPrivateBackdropDismiss(
    document.getElementById('private-contact-account-modal'),
    '.private-contact-account-dialog',
    () => closePrivateContactAccountModal()
);

document.getElementById('private-contact-account-input')?.addEventListener('input', renderPrivateContactAccountResults);

document.getElementById('private-contact-account-results')?.addEventListener('click', e => {
    const addButton = e.target.closest('[data-private-add-dossier-account]');
    if (!addButton || addButton.disabled) return;
    e.preventDefault();
    e.stopPropagation();
    addPrivateDossierContact(
        addButton.getAttribute('data-private-add-dossier-type') || '',
        addButton.getAttribute('data-private-add-dossier-record') || '',
        addButton.getAttribute('data-private-add-dossier-account') || ''
    );
});

document.getElementById('private-settings-close')?.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    closePrivateSettingsPanel();
});

document.getElementById('private-settings-account-list')?.addEventListener('click', e => {
    const login = e.target.closest('[data-private-settings-login]');
    if (login) {
        e.preventDefault();
        e.stopPropagation();
        switchPrivateAccount(login.getAttribute('data-private-settings-login'), '已切换到这个账号。');
    }
});

document.getElementById('private-settings-logout')?.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    logoutPrivateAccount();
});

document.getElementById('private-export-records')?.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    exportPrivateChatRecords();
});

document.getElementById('private-import-records')?.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    document.getElementById('private-import-input')?.click();
});

document.getElementById('private-import-input')?.addEventListener('change', e => {
    e.stopImmediatePropagation();
    importPrivateChatRecords(e.target.files?.[0]);
    e.target.value = '';
});

document.getElementById('private-login-register')?.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    startPrivateRegistrationFromLogin();
});

document.getElementById('private-register-login')?.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    switchPrivateRegisterToLogin();
});

document.getElementById('private-login-other')?.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    setPrivateLoginOtherAccountMode(!privateState.loginOtherAccount, true);
});

document.getElementById('private-new-group')?.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    openPrivateContactAccountModal();
});

document.getElementById('private-login-account-input')?.addEventListener('input', () => {
    renderPrivateLoginIdentity();
});

document.getElementById('private-thread-list')?.addEventListener('click', e => {
    const card = e.target.closest('[data-private-thread-contact]');
    if (!card) return;
    e.preventDefault();
    e.stopPropagation();
    card.classList.remove('is-active');
    card.setAttribute('aria-current', 'false');
    card.setAttribute('aria-selected', 'false');
    if (document.activeElement instanceof HTMLElement && document.activeElement !== document.body) {
        document.activeElement.blur();
    }
    openPrivateContactChat(card.getAttribute('data-private-thread-contact') || '', 'whisper');
});

document.getElementById('private-contact-list')?.addEventListener('click', e => {
    const profileCardButton = e.target.closest('[data-private-contact-profile-card]');
    if (profileCardButton) {
        e.preventDefault();
        e.stopPropagation();
        openPrivateContactProfileCard(profileCardButton.getAttribute('data-private-contact-profile-card') || '');
        return;
    }
    const homepageButton = e.target.closest('[data-private-contact-homepage]');
    if (homepageButton) {
        e.preventDefault();
        e.stopPropagation();
        openPrivateContactHomepage(homepageButton.getAttribute('data-private-contact-homepage') || '');
        return;
    }
    const profileButton = e.target.closest('[data-private-contact-profile]');
    if (profileButton) {
        e.preventDefault();
        e.stopPropagation();
        openPrivateContactHomepage(profileButton.getAttribute('data-private-contact-profile') || '');
        return;
    }
    const editButton = e.target.closest('[data-private-contact-edit], .private-contact-edit');
    if (editButton) {
        e.preventDefault();
        e.stopPropagation();
        const contactId = editButton.getAttribute('data-private-contact-edit')
            || editButton.closest('[data-private-contact]')?.getAttribute('data-private-contact')
            || '';
        openPrivateContactQuickEdit(contactId);
        return;
    }
    const card = e.target.closest('[data-private-contact]');
    if (!card) return;
    e.preventDefault();
    e.stopPropagation();
    openPrivateContactChat(card.getAttribute('data-private-contact') || '', 'contacts');
    return;
    const title = card.querySelector('.private-contact-title')?.textContent || '联系人';
    showPrivateSystemToast(`已选中「${title}」。`);
});

document.getElementById('private-app')?.addEventListener('click', e => {
    const contactChatBack = e.target.closest('[data-private-contact-chat-back]');
    if (contactChatBack) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        closePrivateContactChat();
        return;
    }
    const historyReveal = e.target.closest('[data-private-contact-chat-expand-history]');
    if (historyReveal) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        privateContactChatHistoryExpandedId = String(privateActiveContactChatId || '').trim();
        renderPrivateContactChatPage(privateContactChatHistoryExpandedId, { scrollToTop: true });
        return;
    }
    const translationToggle = e.target.closest('[data-private-contact-chat-translation-toggle]');
    if (translationToggle) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        togglePrivateContactChatTranslationGroup(translationToggle.getAttribute('data-private-contact-chat-translation-toggle') || '');
        return;
    }
    const quotedMessage = e.target.closest('[data-private-contact-chat-quote-id]');
    if (quotedMessage) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        peekPrivateContactChatMessage(quotedMessage.getAttribute('data-private-contact-chat-quote-id') || '');
        return;
    }
    const recalledDetail = e.target.closest('[data-private-contact-chat-recall-detail]');
    if (recalledDetail) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        openPrivateContactChatRecallModal(recalledDetail.getAttribute('data-private-contact-chat-recall-detail') || '');
        return;
    }
    const chatBubble = e.target.closest('[data-private-contact-chat-bubble]');
    if (chatBubble) {
        return;
    }
    const homepageBack = e.target.closest('[data-private-contact-homepage-close]');
    if (homepageBack) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        closePrivateContactHomepage(true);
        return;
    }
    const homepageEdit = e.target.closest('[data-private-contact-homepage-edit]');
    if (homepageEdit) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        openPrivateContactQuickEdit(homepageEdit.getAttribute('data-private-contact-homepage-edit') || '');
        return;
    }
    const homepageCover = e.target.closest('[data-private-contact-homepage-cover]');
    if (homepageCover) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        privateContactHomepageCoverTargetId = homepageCover.getAttribute('data-private-contact-homepage-cover') || '';
        getPrivateContactHomepageCoverInput().click();
        return;
    }
    const homepageTab = e.target.closest('[data-private-contact-homepage-tab]');
    if (homepageTab) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        const section = homepageTab.getAttribute('data-private-contact-homepage-tab') || 'about';
        const contactId = homepageTab.getAttribute('data-private-contact-id')
            || homepageTab.closest('[data-private-contact-homepage-id]')?.getAttribute('data-private-contact-homepage-id')
            || '';
        openPrivateContactHomepage(contactId, section);
        return;
    }
    const homepageEntry = e.target.closest('[data-private-contact-homepage-entry]');
    if (homepageEntry) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        const entryName = homepageEntry.getAttribute('data-private-contact-homepage-entry') || '';
        const contactId = homepageEntry.getAttribute('data-private-contact-id') || homepageEntry.closest('[data-private-contact-homepage-id]')?.getAttribute('data-private-contact-homepage-id') || '';
        const normalizedEntryName = String(entryName || '').replace(/\s+/g, '');
        if (normalizedEntryName.includes('朋友圈') || normalizedEntryName.includes('鏈嬪弸鍦') || /moments|time/i.test(normalizedEntryName)) {
            switchPrivateTab('time');
            return;
        }
        if (normalizedEntryName.includes('聊天') || normalizedEntryName.includes('鑱婂ぉ') || /chat/i.test(normalizedEntryName)) {
            openPrivateContactChat(contactId, 'contact-homepage');
            return;
        }
        if (normalizedEntryName.includes('更多') || normalizedEntryName.includes('鏇村') || /more/i.test(normalizedEntryName)) {
            openPrivateContactProfileCard(contactId);
            return;
        }
        if (entryName === '朋友圈') {
            switchPrivateTab('time');
            return;
        }
        if (entryName === '聊天') {
            switchPrivateTab('whisper');
            return;
        }
        if (entryName === '更多') {
            openPrivateContactProfileCard(contactId);
            return;
        }
        if (entryName) showPrivateSystemToast(`${entryName}入口已就绪。`);
        return;
    }
    const settingsClose = e.target.closest('#private-settings-close');
    if (settingsClose) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        closePrivateSettingsPanel();
        return;
    }
    const entry = e.target.closest('[data-private-entry]');
    if (!entry) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    const name = entry.getAttribute('data-private-entry') || '';
    if (name === '预设') {
        openPrivateUserPresetEditor();
        return;
    }
    if (name === '设置') {
        openPrivateSettingsPanel();
        return;
    }
    if (name) showPrivateSystemToast(`${name}入口已就绪。`);
}, true);

document.getElementById('private-app')?.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    if (e.target.closest?.('[data-private-contact-homepage-close], [data-private-contact-homepage-edit]')) return;
    const homepageCover = e.target.closest?.('[data-private-contact-homepage-cover]');
    if (!homepageCover) return;
    e.preventDefault();
    e.stopPropagation();
    privateContactHomepageCoverTargetId = homepageCover.getAttribute('data-private-contact-homepage-cover') || '';
    getPrivateContactHomepageCoverInput().click();
});

document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const chatScreen = document.querySelector('.private-chat-screen');
    const contactChatActionMenu = document.getElementById('private-contact-chat-action-menu');
    const contactChatConfirmModal = document.getElementById('private-contact-chat-confirm-modal');
    const contactChatEditModal = document.getElementById('private-contact-chat-edit-modal');
    const contactChatRecallModal = document.getElementById('private-contact-chat-recall-modal');
    const contactChatPlaceholderModal = document.getElementById('private-contact-chat-placeholder-modal');
    const contactProfileModal = document.getElementById('private-contact-profile-modal');
    const contactAccountModal = document.getElementById('private-contact-account-modal');
    const userPresetModal = document.getElementById('private-user-preset-modal');
    const privateSettingsModal = document.getElementById('private-settings-modal');
    const momentComposer = document.getElementById('private-moment-composer');
    if (contactChatActionMenu && !contactChatActionMenu.hidden) {
        e.preventDefault();
        e.stopImmediatePropagation();
        closePrivateContactChatActionMenu();
        return;
    }
    if (contactChatConfirmModal && !contactChatConfirmModal.hidden) {
        e.preventDefault();
        e.stopImmediatePropagation();
        closePrivateContactChatConfirmModal(false, false);
        return;
    }
    if (contactChatEditModal && !contactChatEditModal.hidden) {
        e.preventDefault();
        e.stopImmediatePropagation();
        closePrivateContactChatEditModal();
        return;
    }
    if (contactChatRecallModal && !contactChatRecallModal.hidden) {
        e.preventDefault();
        e.stopImmediatePropagation();
        closePrivateContactChatRecallModal();
        return;
    }
    if (contactChatPlaceholderModal && !contactChatPlaceholderModal.hidden) {
        e.preventDefault();
        e.stopImmediatePropagation();
        closePrivateContactChatPlaceholderEditor();
        return;
    }
    if (privateContactChatSelectionMode) {
        e.preventDefault();
        e.stopImmediatePropagation();
        exitPrivateContactChatSelectionMode();
        return;
    }
    if (chatScreen?.getAttribute('data-private-current-tab') === 'contact-chat') {
        e.preventDefault();
        e.stopImmediatePropagation();
        closePrivateContactChat();
        return;
    }
    if (chatScreen?.getAttribute('data-private-current-tab') === 'contact-homepage') {
        e.preventDefault();
        e.stopImmediatePropagation();
        closePrivateContactHomepage(true);
        return;
    }
    if (contactProfileModal && !contactProfileModal.hidden) {
        e.preventDefault();
        e.stopImmediatePropagation();
        closePrivateContactProfileCard();
        return;
    }
    if (contactAccountModal && !contactAccountModal.hidden) {
        e.preventDefault();
        e.stopImmediatePropagation();
        closePrivateContactAccountModal();
        return;
    }
    if (userPresetModal && !userPresetModal.hidden) {
        e.preventDefault();
        e.stopImmediatePropagation();
        closePrivateUserPresetEditor();
        return;
    }
    if (privateSettingsModal && !privateSettingsModal.hidden) {
        e.preventDefault();
        e.stopImmediatePropagation();
        closePrivateSettingsPanel();
        return;
    }
    if (momentComposer && !momentComposer.hidden) {
        e.preventDefault();
        e.stopImmediatePropagation();
        closePrivateMomentComposer();
    }
}, true);

bindPrivateMomentTools();
privateStateReady = loadPrivateState();
