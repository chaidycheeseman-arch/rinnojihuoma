const ZHENXUAN_STATE_KEY = 'rinno_zhenxuan_state_v1';
const ZHENXUAN_API_SETTINGS_KEY = 'api_parameter_config';
const ZHENXUAN_MAX_CUSTOM_CATEGORIES = 8;
const ZHENXUAN_SEARCH_LIMIT = 32;
const ZHENXUAN_GENERATED_ITEM_COUNT = 6;
const ZHENXUAN_GENERATION_TIMEOUT_MS = 45000;
const ZHENXUAN_ALLOWED_TONES = ['blush', 'pearl', 'champagne', 'olive', 'night'];

let zhenxuanEventsBound = false;
let activeZhenxuanPage = 'home';
let zhenxuanToastTimer = 0;
let zhenxuanGenerating = false;
let zhenxuanState = createDefaultZhenxuanState();

const ZHENXUAN_PAGES = {
    home: {
        note: '会随主题色流动的轻奢买手杂志。'
    },
    messages: {
        note: '这里会开始你和商家的全部对话。'
    },
    cart: {
        note: '购物车初始为空，用于结算和送礼物。'
    },
    profile: {
        note: '订单、收藏、店铺与足迹都收在这里。'
    }
};

const ZHENXUAN_BASE_CATEGORIES = [
    { id: 'recommend', label: '推荐' },
    { id: 'women', label: '女装' },
    { id: 'beauty', label: '美妆' },
    { id: 'delivery', label: '外卖' },
    { id: 'r18', label: 'R18' },
    { id: 'luxury', label: '奢侈品' }
];

const ZHENXUAN_PROFILE_ACTION_MESSAGES = {
    address: '定位入口已预留，后续可以继续承接地址、到店与礼赠去向。',
    service: '官方客服入口已预留，后续可以直接联系平台客服。',
    settings: '甄选设置入口已预留，后续可以继续细化个人偏好。'
};

const ZHENXUAN_CATEGORY_PRESETS = {
    recommend: {
        kicker: 'EDITORIAL / RECOMMENDED',
        headline: '把当季礼赠、轻奢热卖与主题色一起排进首页。',
        copy: '像翻开一本轻杂志：首页保持留白、柔光与轻盈陈列，让每次浏览都带一点被精心挑过的感觉。',
        moods: ['今日精选正在换页。', '轻奢陈列与柔和配色一起呼吸。', '适合送礼，也适合留给自己。'],
        items: [
            { name: '丝缎月光礼盒', price: '¥699', tag: 'GIFT', meta: '限量礼赠', note: '缎面盒型与烫金小卡一起收进同一份仪式感。', tone: 'blush' },
            { name: '雾面羊绒披肩', price: '¥1,280', tag: 'SOFT', meta: '轻奢面料', note: '偏暖的柔雾灰调，适合在主题色里做同频搭配。', tone: 'pearl' },
            { name: '玫瑰乌龙香氛', price: '¥359', tag: 'SCENT', meta: '日常氛围', note: '开场是茶香与花瓣感，尾调温柔，不会过分张扬。', tone: 'coral' },
            { name: '夜金真皮卡包', price: '¥920', tag: 'DAILY', meta: '低调金属感', note: '结构干净，边角和金属件更显高级。', tone: 'champagne' }
        ]
    },
    women: {
        kicker: 'WOMEN / EDIT',
        headline: '把女装页做成一张干净的时装编辑版面。',
        copy: '更在意肩线、垂坠感与版型呼吸，色阶跟随主题色微调，保持轻奢但不厚重。',
        moods: ['这一页更适合看材质。', '版型与留白一起决定高级感。', '换个主题色，整页氛围也会换。'],
        items: [
            { name: '收腰羊毛长大衣', price: '¥2,680', tag: 'COAT', meta: '编辑推荐', note: '肩线挺括但不生硬，适合搭配冷暖不同主题。', tone: 'pearl' },
            { name: '丝光衬衫连衣裙', price: '¥1,560', tag: 'DRESS', meta: '轻杂志风', note: '光感很轻，落在页面里会有柔和的折射效果。', tone: 'blush' },
            { name: '细带高跟凉鞋', price: '¥998', tag: 'SHOES', meta: '新季上架', note: '线条够简，适合做整页视觉收束。', tone: 'champagne' },
            { name: '珍珠灰托特包', price: '¥1,990', tag: 'BAG', meta: '通勤友好', note: '立体感强，但整体气质依旧安静。', tone: 'night' }
        ]
    },
    beauty: {
        kicker: 'BEAUTY / VANITY',
        headline: '美妆页更像香气与镜面光泽的采样本。',
        copy: '不堆满信息，而是用少量高密度单品维持页面节奏，让视觉像玻璃台面一样干净。',
        moods: ['香气、妆感与容器一起上场。', '只保留会让人停下来的那一点光。', '这一页更偏向静态陈列。'],
        items: [
            { name: '雾玫唇釉套组', price: '¥269', tag: 'LIP', meta: '镜面雾感', note: '两支入，色调从柔粉到低饱和玫瑰都很实穿。', tone: 'coral' },
            { name: '夜幕修护精华', price: '¥620', tag: 'CARE', meta: '晚间修护', note: '玻璃瓶身在深色主题下会更有轻奢感。', tone: 'night' },
            { name: '柔雾定妆粉饼', price: '¥318', tag: 'BASE', meta: '持妆干净', note: '适合喜欢无粉感但要求细腻妆效的人。', tone: 'pearl' },
            { name: '茶感白麝香喷雾', price: '¥430', tag: 'SCENT', meta: '轻香路线', note: '不甜腻，尾调很贴肤，像清洁过的衬衫领口。', tone: 'champagne' }
        ]
    },
    delivery: {
        kicker: 'DELIVERY / DAILY',
        headline: '外卖页保持轻巧，像城市里快速送达的一页清单。',
        copy: '把热度、口味与送礼属性简洁编排，既实用也保留一点轻奢的页面秩序。',
        moods: ['今天更适合点一份干净的安慰。', '礼物和晚餐都可以很体面。', '城市速度也能拥有杂志感。'],
        items: [
            { name: '奶油蘑菇烩饭', price: '¥59', tag: 'HOT', meta: '30 分钟送达', note: '奶香厚度适中，适合做晚间加餐。', tone: 'champagne' },
            { name: '青提气泡甜点杯', price: '¥36', tag: 'NEW', meta: '冷藏甜品', note: '包装足够漂亮，送人时也不会失礼。', tone: 'blush' },
            { name: '轻盐烤鸡沙拉', price: '¥48', tag: 'LIGHT', meta: '编辑健康餐', note: '清爽、份量稳定，页面气质也更轻。', tone: 'olive' },
            { name: '深夜花束茶饮', price: '¥29', tag: 'DRINK', meta: '夜间上新', note: '适合在 R18 或夜幕金主题下切换浏览。', tone: 'night' }
        ]
    },
    r18: {
        kicker: 'R18 / PRIVATE SELECT',
        headline: 'R18 分组保留神秘感，只做暧昧与夜色氛围的克制陈列。',
        copy: '不直接喧哗，而是把深夜香气、丝缎触感和私享礼盒收在一页，维持轻奢与边界感。',
        moods: ['夜色更适合低声说话。', '把暧昧做成不露声色的陈列。', '这一页保留一点只属于深夜的留白。'],
        items: [
            { name: '午夜丝缎睡袍', price: '¥468', tag: 'NIGHT', meta: '私享系列', note: '偏深色光泽，在夜幕金主题下很有气场。', tone: 'night' },
            { name: '乌木玫瑰蜡烛', price: '¥299', tag: 'MOOD', meta: '氛围单品', note: '更适合营造环境，不强调视觉冲击。', tone: 'coral' },
            { name: '深夜限定礼盒', price: '¥888', tag: 'BOX', meta: '双人礼赠', note: '包装更注重克制感，整体偏私密收藏路线。', tone: 'champagne' },
            { name: '薄纱香氛喷雾', price: '¥219', tag: 'SCENT', meta: '靠近皮肤', note: '清透不闷，属于会留在余味里的那种香。', tone: 'blush' }
        ]
    },
    luxury: {
        kicker: 'LUXURY / HERITAGE',
        headline: '奢侈品页更强调材质、工艺与继承感。',
        copy: '用更深的留白和更少的商品，把注意力留给轮廓、皮革与金属细节本身。',
        moods: ['真正昂贵的部分往往不需要很多字。', '工艺感比堆砌更重要。', '这一页的留白就是价值感。'],
        items: [
            { name: '金扣粒面手袋', price: '¥13,800', tag: 'ICON', meta: '经典款', note: '线条清晰，五金压得住整页视觉重心。', tone: 'champagne' },
            { name: '古董链条腕表', price: '¥26,500', tag: 'WATCH', meta: '传承收藏', note: '更适合在暗色主题下阅读细节。', tone: 'night' },
            { name: '羊绒皮边披毯', price: '¥5,980', tag: 'HOME', meta: '私宅陈设', note: '属于不需要很高音量的奢侈感。', tone: 'pearl' },
            { name: '珍珠母贝首饰盒', price: '¥3,260', tag: 'JEWEL', meta: '礼赠优选', note: '适合放进“我的甄选”礼物清单。', tone: 'blush' }
        ]
    }
};

const ZHENXUAN_GENERATION_LIBRARY = {
    recommend: {
        editorial: 'EDITORIAL',
        nouns: ['礼盒', '香氛', '耳饰', '卡包', '丝巾', '项链'],
        tags: ['EDIT', 'GIFT', 'SELECT', 'NEW', 'PICK'],
        metas: ['首页主推', '礼赠优选', '柔光开场', '本季搭配', '编辑视线'],
        materials: ['缎光皮面', '浅金五金', '柔雾织纹', '镜面树脂', '烫金盒型', '细砂绒面'],
        scenes: ['适合礼物主位', '适合首页首屏', '适合下班后切换', '适合节日开场', '适合安静收藏', '适合日常提气'],
        prices: ['¥299', '¥399', '¥699', '¥920', '¥1,280', '¥1,680'],
        tones: ['blush', 'champagne', 'pearl', 'coral', 'night'],
        highlights: ['主位陈列', '柔雾气场', '轻奢收束', '礼赠前排', '低调闪光'],
        suggestions: ['月光', '绸缎', '玫瑰', '节日', '香草', '奶油白']
    },
    women: {
        editorial: 'WOMEN',
        nouns: ['大衣', '连衣裙', '凉鞋', '手袋', '衬衫', '腰带'],
        tags: ['COAT', 'DRESS', 'EDIT', 'SHAPE', 'RUNWAY'],
        metas: ['版型主位', '新季上架', '静奢通勤', '落肩线条', '编辑试衣间'],
        materials: ['双面羊毛', '丝光缎面', '柔韧皮革', '微褶雪纺', '细带五金', '珍珠灰纱感'],
        scenes: ['适合通勤整页', '适合晚间见面', '适合风格首位', '适合轮廓收束', '适合衣橱升级', '适合一页成套'],
        prices: ['¥699', '¥998', '¥1,560', '¥1,990', '¥2,680', '¥3,260'],
        tones: ['pearl', 'blush', 'champagne', 'night'],
        highlights: ['版型优先', '肩线更轻', '通勤主位', '一页成套', '线条先行'],
        suggestions: ['收腰', '珍珠灰', '黑金', '通勤', '缎面', '静奢']
    },
    beauty: {
        editorial: 'BEAUTY',
        nouns: ['唇釉', '精华', '粉饼', '香氛', '护手霜', '眼影盘'],
        tags: ['LIP', 'CARE', 'SCENT', 'BASE', 'GLOW'],
        metas: ['镜面雾感', '夜间修护', '轻香开场', '梳妆台主位', '玻璃柜采样'],
        materials: ['磨砂玻璃', '雾银泵头', '冷调镜面壳', '绸感包装', '浅香雾化喷头', '压纹盒盖'],
        scenes: ['适合镜前留白', '适合晚间修护', '适合香气收尾', '适合随身补妆', '适合礼盒拼组', '适合洗漱台陈列'],
        prices: ['¥129', '¥269', '¥318', '¥430', '¥620', '¥888'],
        tones: ['coral', 'pearl', 'champagne', 'night', 'blush'],
        highlights: ['香气先到', '光泽留住', '梳妆台主位', '少量高密度', '镜面停留'],
        suggestions: ['白麝香', '镜面', '晚安', '乌龙', '玫瑰雾', '玻璃感']
    },
    delivery: {
        editorial: 'DELIVERY',
        nouns: ['烩饭', '甜点杯', '沙拉', '茶饮', '轻食盒', '奶酪卷'],
        tags: ['HOT', 'NEW', 'LIGHT', 'DRINK', 'FAST'],
        metas: ['30 分钟送达', '晚餐备选', '冷藏甜品', '夜间上新', '办公室友好'],
        materials: ['保温纸盒', '冷藏透明杯', '磨砂餐具套', '轻量纸袋', '丝带封签', '简洁贴标'],
        scenes: ['适合晚上加餐', '适合办公室午后', '适合体面送达', '适合一个人收工', '适合深夜续命', '适合好友分享'],
        prices: ['¥29', '¥36', '¥48', '¥59', '¥79', '¥99'],
        tones: ['champagne', 'blush', 'olive', 'night', 'pearl'],
        highlights: ['送达即拍', '城市速度', '热量更轻', '深夜续命', '桌面体面'],
        suggestions: ['抹茶', '深夜', '青提', '轻盐', '奶油', '晚餐']
    },
    r18: {
        editorial: 'PRIVATE',
        nouns: ['睡袍', '蜡烛', '礼盒', '喷雾', '耳坠', '夜灯'],
        tags: ['NIGHT', 'MOOD', 'BOX', 'SCENT', 'PRIVATE'],
        metas: ['私享系列', '夜色主位', '低声礼赠', '靠近皮肤', '深夜留香'],
        materials: ['丝缎包边', '乌木蜡面', '磨砂玻璃瓶', '缎面纸盒', '暗金链节', '轻纱包装'],
        scenes: ['适合低光陈列', '适合靠近皮肤', '适合两人份礼赠', '适合夜色切换', '适合暧昧留白', '适合私密收藏'],
        prices: ['¥199', '¥219', '¥299', '¥468', '¥888', '¥1,199'],
        tones: ['night', 'coral', 'champagne', 'blush'],
        highlights: ['低光主位', '不露声色', '边界感更强', '留白更深', '只留余味'],
        suggestions: ['夜幕', '乌木', '丝缎', '靠近', '微醺', '黑玫瑰']
    },
    luxury: {
        editorial: 'HERITAGE',
        nouns: ['手袋', '腕表', '首饰盒', '披毯', '皮夹', '丝巾'],
        tags: ['ICON', 'VAULT', 'WATCH', 'ATELIER', 'RARE'],
        metas: ['传承收藏', '收藏柜主位', '高工线条', '私宅陈设', '珠宝柜台'],
        materials: ['粒面小牛皮', '拉丝金扣', '古董链节', '母贝饰面', '羊绒包边', '黑金锁扣'],
        scenes: ['适合会客厅陈列', '适合收藏柜主位', '适合低调送礼', '适合橱窗停留', '适合私人订购', '适合高净值礼单'],
        prices: ['¥3,260', '¥5,980', '¥9,800', '¥13,800', '¥18,600', '¥26,500'],
        tones: ['champagne', 'night', 'pearl', 'blush'],
        highlights: ['高工主位', '留白更深', '五金压场', '工艺先说话', '收藏级气场'],
        suggestions: ['黑金', '皮革', '古典', '私藏', '珠宝柜', '夜色']
    }
};

function createDefaultZhenxuanState() {
    return {
        customCategories: [],
        activeCategory: 'recommend',
        search: '',
        searchDraft: '',
        refreshSeed: 0,
        generatedCollections: {}
    };
}

function escapeZhenxuanHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function normalizeZhenxuanCategoryLabel(value) {
    return String(value || '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 8);
}

function normalizeZhenxuanSearchText(value) {
    return String(value || '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, ZHENXUAN_SEARCH_LIMIT);
}

function normalizeZhenxuanShortText(value, limit = 32) {
    return String(value || '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, limit);
}

function normalizeZhenxuanSentence(value, limit = 120) {
    return String(value || '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, limit);
}

function normalizeZhenxuanTone(value, fallback = 'champagne') {
    const tone = String(value || '').trim().toLowerCase();
    return ZHENXUAN_ALLOWED_TONES.includes(tone) ? tone : fallback;
}

function normalizeZhenxuanTag(value) {
    const cleaned = String(value || '')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9/&\-\s]/g, '')
        .replace(/\s+/g, ' ')
        .slice(0, 12);
    return cleaned || 'EDIT';
}

function normalizeZhenxuanPrice(value) {
    const cleaned = String(value || '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 18);
    if (!cleaned) return '¥ --';
    if (/^[¥￥$]/.test(cleaned)) return cleaned;
    if (/^\d[\d.,]*$/.test(cleaned)) return `¥${cleaned}`;
    return cleaned;
}

function normalizeZhenxuanState(value) {
    const defaults = createDefaultZhenxuanState();
    const source = value && typeof value === 'object' ? value : {};
    const customCategories = Array.isArray(source.customCategories)
        ? source.customCategories
            .map(item => ({
                id: String(item?.id || `custom-${Date.now().toString(36)}`),
                label: normalizeZhenxuanCategoryLabel(item?.label || '')
            }))
            .filter(item => item.label)
        : [];
    const deduped = [];
    const seen = new Set();
    customCategories.forEach(item => {
        const key = item.label.toLowerCase();
        if (seen.has(key) || deduped.length >= ZHENXUAN_MAX_CUSTOM_CATEGORIES) return;
        seen.add(key);
        deduped.push(item);
    });
    const activeCategory = String(source.activeCategory || defaults.activeCategory);
    const validCategoryIds = new Set([
        ...ZHENXUAN_BASE_CATEGORIES.map(item => item.id),
        ...deduped.map(item => item.id)
    ]);
    const generatedCollections = {};
    const rawGeneratedCollections = source.generatedCollections && typeof source.generatedCollections === 'object'
        ? source.generatedCollections
        : {};
    Object.entries(rawGeneratedCollections).forEach(([categoryId, entry]) => {
        const query = normalizeZhenxuanSearchText(entry?.query || '');
        const updatedAt = Number.isFinite(Number(entry?.updatedAt)) ? Number(entry.updatedAt) : Date.now();
        const collection = normalizeZhenxuanGeneratedCollection(entry?.collection, categoryId, query, updatedAt);
        if (!collection) return;
        generatedCollections[String(categoryId)] = {
            query,
            collection,
            updatedAt
        };
    });
    const normalizedActiveCategory = validCategoryIds.has(activeCategory) ? activeCategory : defaults.activeCategory;
    const fallbackSearch = normalizeZhenxuanSearchText(source.search || generatedCollections[normalizedActiveCategory]?.query || '');
    return {
        customCategories: deduped,
        activeCategory: normalizedActiveCategory,
        search: fallbackSearch,
        searchDraft: normalizeZhenxuanSearchText(source.searchDraft || fallbackSearch),
        refreshSeed: Number.isFinite(Number(source.refreshSeed)) ? Number(source.refreshSeed) : 0,
        generatedCollections
    };
}

function parseZhenxuanStateContent(content) {
    if (!content || typeof content !== 'string') return createDefaultZhenxuanState();
    try {
        return normalizeZhenxuanState(JSON.parse(content));
    } catch (error) {
        return createDefaultZhenxuanState();
    }
}

function readLegacyZhenxuanState() {
    try {
        return parseZhenxuanStateContent(localStorage.getItem(ZHENXUAN_STATE_KEY) || '');
    } catch (error) {
        return createDefaultZhenxuanState();
    }
}

async function readZhenxuanState() {
    try {
        if (typeof db !== 'undefined' && db?.edits?.get) {
            const saved = await db.edits.get(ZHENXUAN_STATE_KEY);
            if (saved?.content) return parseZhenxuanStateContent(saved.content);
        }
    } catch (error) {
        console.warn('Zhenxuan boutique Dexie read failed:', error);
    }
    return readLegacyZhenxuanState();
}

async function persistZhenxuanState(snapshot) {
    const content = JSON.stringify(normalizeZhenxuanState(snapshot));
    try {
        if (typeof db !== 'undefined' && db?.edits?.put) {
            await db.edits.put({
                id: ZHENXUAN_STATE_KEY,
                content,
                type: 'zhenxuan-boutique-state'
            });
        }
    } catch (error) {
        console.warn('Zhenxuan boutique Dexie save failed:', error);
    }
    try {
        localStorage.setItem(ZHENXUAN_STATE_KEY, content);
    } catch (error) {
        // Ignore local fallback failures.
    }
}

function writeZhenxuanState() {
    void persistZhenxuanState(zhenxuanState);
}

function buildZhenxuanChatEndpoint(rawEndpoint) {
    const raw = String(rawEndpoint || '').trim();
    if (!/^https?:\/\//i.test(raw)) {
        throw new Error('请先在设置的 API 聊天里填写 http/https 接口地址。');
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

function extractZhenxuanGeneratedText(payload) {
    const choice = Array.isArray(payload?.choices) ? payload.choices[0] : null;
    return String(
        choice?.message?.content
        || choice?.text
        || payload?.output_text
        || payload?.content
        || ''
    ).trim();
}

async function loadZhenxuanApiSettings() {
    if (typeof apiState !== 'undefined' && apiState?.chat) return apiState.chat;
    try {
        if (typeof db === 'undefined' || !db?.edits?.get) return {};
        const saved = await db.edits.get(ZHENXUAN_API_SETTINGS_KEY);
        const content = typeof saved?.content === 'string' ? JSON.parse(saved.content) : saved?.content;
        return content?.chat || {};
    } catch (error) {
        console.warn('Zhenxuan API settings load failed:', error);
        return {};
    }
}

function getZhenxuanApp() {
    return document.getElementById('zhenxuan-app');
}

function getZhenxuanCategoryList() {
    return [
        ...ZHENXUAN_BASE_CATEGORIES,
        ...zhenxuanState.customCategories
    ];
}

function getZhenxuanCategoryLabel(categoryId) {
    return getZhenxuanCategoryList().find(item => item.id === categoryId)?.label || '推荐';
}

function createZhenxuanCustomPreset(label) {
    return {
        kicker: `${label.toUpperCase()} / CUSTOM`,
        headline: `把「${label}」做成你自己的专属分组。`,
        copy: `这是你新加进来的栏目。先给它一页干净的陈列感，之后再慢慢填满更具体的单品和风格。`,
        moods: ['新分组已经就位。', '先从一页干净的留白开始。', '它会跟着主题色一起呼吸。'],
        items: [
            { name: `${label} 主题礼盒`, price: '¥399', tag: 'CUSTOM', meta: '新分组首发', note: '先用一套完整礼盒把这个分组的气质立住。', tone: 'blush' },
            { name: `${label} 灵感样册`, price: '¥199', tag: 'EDIT', meta: '氛围参考', note: '适合先收纳材质、色彩和想保留的视觉关键词。', tone: 'pearl' },
            { name: `${label} 私藏单品`, price: '¥699', tag: 'SELECT', meta: '轻奢提案', note: '留给你自己定义这一组真正想买什么。', tone: 'champagne' },
            { name: `${label} 送礼备选`, price: '¥288', tag: 'GIFT', meta: '礼物清单', note: '以后这里也可以变成单独的礼赠分区。', tone: 'olive' }
        ]
    };
}

function getZhenxuanCategoryPreset(categoryId) {
    if (ZHENXUAN_CATEGORY_PRESETS[categoryId]) return ZHENXUAN_CATEGORY_PRESETS[categoryId];
    const customCategory = zhenxuanState.customCategories.find(item => item.id === categoryId);
    return createZhenxuanCustomPreset(customCategory?.label || '自定义');
}

function hashZhenxuanSeed(value) {
    const text = String(value || 'zhenxuan');
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
        hash ^= text.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

function pickZhenxuanValue(list, seed, offset = 0) {
    if (!Array.isArray(list) || !list.length) return '';
    const index = Math.abs((Number(seed) || 0) + offset) % list.length;
    return list[index];
}

function getZhenxuanGenerationTheme(categoryId) {
    return ZHENXUAN_GENERATION_LIBRARY[categoryId] || ZHENXUAN_GENERATION_LIBRARY.recommend;
}

function normalizeZhenxuanGeneratedItem(item, categoryId, index, seed, keyword = '') {
    const source = item && typeof item === 'object' ? item : {};
    const theme = getZhenxuanGenerationTheme(categoryId);
    const fallbackTone = pickZhenxuanValue(theme.tones, seed, index * 2) || 'champagne';
    const name = normalizeZhenxuanShortText(source.name || '', 18);
    if (!name) return null;
    const material = normalizeZhenxuanShortText(source.material || '', 18);
    const scene = normalizeZhenxuanShortText(source.scene || '', 26);
    const meta = normalizeZhenxuanShortText(source.meta || source.caption || '本页精选', 20);
    const caption = normalizeZhenxuanShortText(source.caption || source.meta || '编辑主推', 20);
    const note = normalizeZhenxuanSentence(
        source.note
        || `${normalizeZhenxuanSearchText(keyword) || getZhenxuanCategoryLabel(categoryId)} 被压进 ${material || '细节材质'} 与 ${scene || '当前场景'} 的陈列语气里。`,
        96
    );
    return enrichZhenxuanItem({
        name,
        price: normalizeZhenxuanPrice(source.price),
        tag: normalizeZhenxuanTag(source.tag),
        meta,
        note,
        tone: normalizeZhenxuanTone(source.tone, fallbackTone),
        material,
        scene,
        caption
    }, categoryId, index, seed, keyword);
}

function normalizeZhenxuanGeneratedCollection(value, categoryId, query, seed = Date.now()) {
    const source = value && typeof value === 'object' ? value : {};
    const categoryLabel = getZhenxuanCategoryLabel(categoryId);
    const cleanQuery = normalizeZhenxuanSearchText(query) || categoryLabel;
    const theme = getZhenxuanGenerationTheme(categoryId);
    const localSeed = hashZhenxuanSeed([categoryId, cleanQuery, seed].join('|'));
    const items = (Array.isArray(source.items) ? source.items : [])
        .slice(0, ZHENXUAN_GENERATED_ITEM_COUNT)
        .map((item, index) => normalizeZhenxuanGeneratedItem(item, categoryId, index, localSeed, cleanQuery))
        .filter(Boolean);

    if (!items.length) return null;

    return {
        kicker: normalizeZhenxuanShortText(source.kicker || `${theme.editorial} / GENERATED`, 28) || `${theme.editorial} / GENERATED`,
        headline: normalizeZhenxuanSentence(source.headline || `围绕“${cleanQuery}”重做这一页 ${categoryLabel} 的精品陈列。`, 48),
        copy: normalizeZhenxuanSentence(source.copy || `保留 ${categoryLabel} 的底色，把“${cleanQuery}”压进材质、价位和礼赠顺序里，让这一页从头到尾都像同一套陈列。`, 110),
        issue: normalizeZhenxuanShortText(source.issue || buildZhenxuanIssue(localSeed), 18) || buildZhenxuanIssue(localSeed),
        note: normalizeZhenxuanSentence(source.note || `${categoryLabel} · 当前围绕“${cleanQuery}”整页重排。`, 40),
        sectionHeading: normalizeZhenxuanShortText(source.sectionHeading || `“${cleanQuery}”本页精选`, 20) || `${categoryLabel}精选`,
        footerLabel: normalizeZhenxuanShortText(source.footerLabel || `${items.length} 款本页上新`, 20) || `${items.length} 款本页上新`,
        mood: normalizeZhenxuanSentence(source.mood || `${cleanQuery} 主题已经重新上架。`, 36),
        items
    };
}

function getZhenxuanGeneratedEntry(categoryId = zhenxuanState.activeCategory) {
    const entry = zhenxuanState.generatedCollections?.[categoryId];
    return entry?.collection?.items?.length ? entry : null;
}

function getZhenxuanCategoryQuery(categoryId = zhenxuanState.activeCategory) {
    return normalizeZhenxuanSearchText(getZhenxuanGeneratedEntry(categoryId)?.query || '');
}

function syncZhenxuanSearchStateForCategory(categoryId = zhenxuanState.activeCategory) {
    const query = getZhenxuanCategoryQuery(categoryId);
    zhenxuanState.search = query;
    zhenxuanState.searchDraft = query;
}

function getZhenxuanCommittedQuery() {
    return normalizeZhenxuanSearchText(zhenxuanState.search || getZhenxuanCategoryQuery(zhenxuanState.activeCategory));
}

function getZhenxuanDraftQuery() {
    return normalizeZhenxuanSearchText(zhenxuanState.searchDraft || zhenxuanState.search || getZhenxuanCategoryQuery(zhenxuanState.activeCategory));
}

function resolveZhenxuanGenerationKeyword(keyword, categoryId = zhenxuanState.activeCategory) {
    return normalizeZhenxuanSearchText(keyword)
        || getZhenxuanDraftQuery()
        || getZhenxuanCategoryQuery(categoryId)
        || getZhenxuanCategoryLabel(categoryId);
}

function buildZhenxuanIssue(seed) {
    return `ISSUE ${String((Math.abs(Number(seed) || 0) % 80) + 12).padStart(2, '0')}`;
}

function rotateZhenxuanItems(items, seed) {
    if (!Array.isArray(items) || items.length <= 1) return Array.isArray(items) ? items.slice() : [];
    const offset = Math.abs(Number(seed) || 0) % items.length;
    return items.slice(offset).concat(items.slice(0, offset));
}

function createZhenxuanGeneratedName(keyword, noun, seed, offset = 0) {
    const compactKeyword = String(keyword || '')
        .replace(/\s+/g, '')
        .slice(0, 6) || '甄选';
    const prefix = offset === 0
        ? ''
        : pickZhenxuanValue(['雾光', '夜金', '绸缎', '月白', '柔砂', '静黑', '奶油'], seed, offset);
    return `${prefix}${compactKeyword}${noun}`.slice(0, 14);
}

function enrichZhenxuanItem(item, categoryId, index, seed, keyword = '') {
    const theme = getZhenxuanGenerationTheme(categoryId);
    const localSeed = hashZhenxuanSeed([categoryId, item?.name, keyword, seed, index].join('|'));
    const shortKeyword = normalizeZhenxuanSearchText(keyword).slice(0, 8);
    return {
        ...item,
        serial: String(index + 1).padStart(2, '0'),
        tone: item?.tone || pickZhenxuanValue(theme.tones, localSeed, index * 3),
        material: item?.material || pickZhenxuanValue(theme.materials, localSeed, index * 5),
        scene: item?.scene || pickZhenxuanValue(theme.scenes, localSeed, index * 7),
        caption: item?.caption || (shortKeyword ? `${shortKeyword} 主题重排` : pickZhenxuanValue(theme.highlights, localSeed, index * 11))
    };
}

function buildZhenxuanGeneratedItem(categoryId, keyword, seed, index) {
    const theme = getZhenxuanGenerationTheme(categoryId);
    const localSeed = hashZhenxuanSeed([categoryId, keyword, seed, index].join('|'));
    const cleanKeyword = normalizeZhenxuanSearchText(keyword) || getZhenxuanCategoryLabel(categoryId);
    const noun = pickZhenxuanValue(theme.nouns, localSeed, index * 2);
    const material = pickZhenxuanValue(theme.materials, localSeed, index * 3);
    const scene = pickZhenxuanValue(theme.scenes, localSeed, index * 5);
    const meta = pickZhenxuanValue(theme.metas, localSeed, index * 7);
    const tone = pickZhenxuanValue(theme.tones, localSeed, index * 11);
    return {
        name: createZhenxuanGeneratedName(cleanKeyword, noun, localSeed, index + 1),
        price: pickZhenxuanValue(theme.prices, localSeed, index * 13),
        tag: pickZhenxuanValue(theme.tags, localSeed, index * 17),
        meta,
        note: `${cleanKeyword} 被压进 ${material} 和 ${scene} 的语气里，这一件更适合放在这一页的${index === 0 ? '主位' : '中段'}。`,
        tone,
        material,
        scene,
        caption: pickZhenxuanValue(theme.highlights, localSeed, index * 19),
        serial: String(index + 1).padStart(2, '0')
    };
}

function buildZhenxuanGeneratedCollection(categoryId, keyword, seed) {
    const theme = getZhenxuanGenerationTheme(categoryId);
    const categoryLabel = getZhenxuanCategoryLabel(categoryId);
    const cleanKeyword = normalizeZhenxuanSearchText(keyword) || categoryLabel;
    const localSeed = hashZhenxuanSeed([categoryId, cleanKeyword, seed].join('|'));
    const items = Array.from({ length: ZHENXUAN_GENERATED_ITEM_COUNT }, (_, index) => (
        buildZhenxuanGeneratedItem(categoryId, cleanKeyword, localSeed, index)
    ));
    const headlineOptions = [
        `把「${cleanKeyword}」排成一页更像精品买手店的陈列。`,
        `围绕「${cleanKeyword}」重做这页 ${categoryLabel} 的质感和顺序。`,
        `让「${cleanKeyword}」成为这页 ${categoryLabel} 的主语。`
    ];
    return {
        kicker: `${theme.editorial} / GENERATED`,
        headline: pickZhenxuanValue(headlineOptions, localSeed),
        copy: `保留 ${categoryLabel} 的底色，把「${cleanKeyword}」压进材质、价位和礼赠顺序里，让这一页从标签到商品都像同一组陈列。`,
        items,
        issue: buildZhenxuanIssue(localSeed),
        note: `${categoryLabel} · 当前围绕「${cleanKeyword}」整页重刷。`,
        sectionHeading: `“${cleanKeyword}” 新陈列`,
        footerLabel: `${items.length} 款整页重排`,
        mood: `${cleanKeyword} 主题已经重新上架。`
    };
}

function buildZhenxuanGenerationPrompt(categoryId, keyword) {
    const categoryLabel = getZhenxuanCategoryLabel(categoryId);
    const preset = getZhenxuanCategoryPreset(categoryId);
    const theme = getZhenxuanGenerationTheme(categoryId);
    return [
        `当前标签页：${categoryLabel}`,
        `关键词：${keyword}`,
        `页面基调：${preset.copy}`,
        `栏目标题气质参考：${preset.headline}`,
        `优先使用的材质词：${theme.materials.slice(0, 6).join('、')}`,
        `优先使用的场景词：${theme.scenes.slice(0, 6).join('、')}`,
        `可选 tone 只能从这几个值里选：${ZHENXUAN_ALLOWED_TONES.join(', ')}`,
        '请生成一整页移动端精品商品陈列，而不是搜索结果列表。',
        '输出必须是严格 JSON，不要 Markdown，不要解释，不要多余文字。',
        'JSON 结构如下：',
        '{',
        '  "kicker": "大写英文短句",',
        '  "headline": "18-34 字中文标题",',
        '  "copy": "40-90 字中文导语",',
        '  "sectionHeading": "8-18 字中文栏目标题",',
        '  "footerLabel": "例如：6 款本页上新",',
        '  "mood": "12-28 字中文氛围句",',
        '  "note": "18-36 字中文页下注释",',
        '  "issue": "ISSUE 17",',
        '  "items": [',
        '    {',
        '      "name": "2-12 字中文商品名",',
        '      "price": "¥1680",',
        '      "tag": "4-10 位大写英文",',
        '      "meta": "4-12 字中文副标签",',
        '      "caption": "4-12 字中文短语",',
        '      "note": "20-50 字中文说明",',
        '      "material": "3-10 字中文材质",',
        '      "scene": "5-16 字中文场景",',
        '      "tone": "champagne"',
        '    }',
        '  ]',
        '}',
        `必须给出 ${ZHENXUAN_GENERATED_ITEM_COUNT} 个 items，名字不要重复，价格层级要拉开。`,
        '整体审美要像高端编辑买手店，克制、干净、有礼赠感，避免廉价电商口吻。',
        categoryId === 'r18'
            ? 'R18 标签页保持暧昧和私密感即可，不要露骨，不要出现露骨行为描写。'
            : '不要使用 emoji。'
    ].join('\n');
}

function parseZhenxuanGeneratedCollection(text, categoryId, keyword) {
    const raw = String(text || '').trim();
    if (!raw) throw new Error('接口没有返回可用的商品内容。');
    const unfenced = raw
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
    const jsonStart = unfenced.indexOf('{');
    const jsonEnd = unfenced.lastIndexOf('}');
    const jsonText = jsonStart >= 0 && jsonEnd > jsonStart
        ? unfenced.slice(jsonStart, jsonEnd + 1)
        : unfenced;

    let payload;
    try {
        payload = JSON.parse(jsonText);
    } catch (error) {
        throw new Error('接口返回的不是可解析的 JSON。');
    }

    const collection = normalizeZhenxuanGeneratedCollection(payload, categoryId, keyword, Date.now());
    if (!collection) {
        throw new Error('接口返回的商品结构不完整，请重试。');
    }
    return collection;
}

async function generateZhenxuanCollectionWithApi(categoryId, keyword) {
    const chat = await loadZhenxuanApiSettings();
    const endpoint = String(chat?.endpoint || '').trim();
    const model = String(chat?.model || '').trim();
    if (!endpoint || !model) {
        throw new Error('请先到 设置 - 接口与参数 - API 聊天 填写接口地址和模型。');
    }

    const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json'
    };
    if (chat.apiKey) headers.Authorization = `Bearer ${chat.apiKey}`;

    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timeoutId = controller
        ? window.setTimeout(() => controller.abort(), ZHENXUAN_GENERATION_TIMEOUT_MS)
        : 0;

    try {
        const response = await fetch(buildZhenxuanChatEndpoint(endpoint), {
            method: 'POST',
            headers,
            signal: controller?.signal,
            body: JSON.stringify({
                model,
                temperature: typeof chat.temperature === 'number' ? chat.temperature : 0.9,
                messages: [
                    {
                        role: 'system',
                        content: '你是高端电商的视觉编辑与商品陈列文案顾问。你负责为移动端“甄选”页面生成整页商品内容。只输出严格 JSON，不要 Markdown，不要解释，不要额外文字。'
                    },
                    {
                        role: 'user',
                        content: buildZhenxuanGenerationPrompt(categoryId, keyword)
                    }
                ]
            })
        });

        if (!response.ok) throw new Error(`API 生成失败：${response.status}`);
        const payload = await response.json();
        return parseZhenxuanGeneratedCollection(
            extractZhenxuanGeneratedText(payload),
            categoryId,
            keyword
        );
    } catch (error) {
        if (error?.name === 'AbortError') {
            throw new Error('接口生成超时了，请稍后再试。');
        }
        throw error;
    } finally {
        if (timeoutId) window.clearTimeout(timeoutId);
    }
}

function getZhenxuanCollectionModel() {
    const categoryId = zhenxuanState.activeCategory;
    const seed = Number(zhenxuanState.refreshSeed) || 0;
    const generatedEntry = getZhenxuanGeneratedEntry(categoryId);
    if (generatedEntry?.collection?.items?.length) return generatedEntry.collection;

    const preset = getZhenxuanCategoryPreset(categoryId);
    const rotated = rotateZhenxuanItems(preset.items, seed);
    const moodIndex = Math.abs(seed) % preset.moods.length;
    const items = rotated.map((item, index) => enrichZhenxuanItem(item, categoryId, index, seed));
    const categoryLabel = getZhenxuanCategoryLabel(categoryId);
    return {
        kicker: preset.kicker,
        headline: preset.headline,
        copy: preset.copy,
        items,
        issue: buildZhenxuanIssue(seed),
        note: `${categoryLabel} · 当前主推已经重新编排。`,
        sectionHeading: `${categoryLabel}精选`,
        footerLabel: `${items.length} 款在架`,
        mood: preset.moods[moodIndex] || `${categoryLabel} 正在流动。`
    };
}

function getZhenxuanSuggestedKeywords(categoryId) {
    const theme = getZhenxuanGenerationTheme(categoryId);
    const categoryLabel = getZhenxuanCategoryLabel(categoryId);
    const suggestions = ZHENXUAN_CATEGORY_PRESETS[categoryId]
        ? theme.suggestions
        : [categoryLabel, `${categoryLabel}礼盒`, `${categoryLabel}收藏`, '月白', '夜金', '送礼'];
    return Array.from(new Set(
        suggestions
            .map(normalizeZhenxuanSearchText)
            .filter(Boolean)
    )).slice(0, 6);
}

function showZhenxuanToast(text, duration = 1800) {
    const toast = document.getElementById('zhenxuan-toast');
    if (!toast) return;
    toast.textContent = text;
    toast.hidden = false;
    toast.classList.add('active');
    if (zhenxuanToastTimer) window.clearTimeout(zhenxuanToastTimer);
    zhenxuanToastTimer = window.setTimeout(() => {
        toast.classList.remove('active');
        window.setTimeout(() => {
            if (!toast.classList.contains('active')) toast.hidden = true;
        }, 180);
    }, duration);
}

function hideZhenxuanToast(instant = false) {
    const toast = document.getElementById('zhenxuan-toast');
    if (!toast) return;
    if (zhenxuanToastTimer) {
        window.clearTimeout(zhenxuanToastTimer);
        zhenxuanToastTimer = 0;
    }
    toast.classList.remove('active');
    if (instant) toast.hidden = true;
}

function setZhenxuanRefreshMessage(text, isError = false) {
    const message = document.getElementById('zhenxuan-refresh-message');
    if (!message) return;
    message.textContent = String(text || '');
    message.classList.toggle('error', Boolean(text) && isError);
}

function setZhenxuanGeneratingState(isGenerating) {
    zhenxuanGenerating = Boolean(isGenerating);
    getZhenxuanApp()?.classList.toggle('is-generating', zhenxuanGenerating);
    document.getElementById('zhenxuan-search-submit')?.toggleAttribute('disabled', zhenxuanGenerating);
    document.getElementById('zhenxuan-refresh-feed')?.toggleAttribute('disabled', zhenxuanGenerating);
    document.getElementById('zhenxuan-search-submit')?.classList.toggle('is-loading', zhenxuanGenerating);
    document.getElementById('zhenxuan-refresh-feed')?.classList.toggle('is-loading', zhenxuanGenerating);
    const submit = document.querySelector('#zhenxuan-refresh-form button[type="submit"]');
    if (submit) {
        submit.toggleAttribute('disabled', zhenxuanGenerating);
        submit.textContent = zhenxuanGenerating ? '生成中...' : '生成这一页';
    }
}

function renderZhenxuanRefreshSuggestions() {
    const wrap = document.getElementById('zhenxuan-refresh-suggestions');
    if (!wrap) return;
    const suggestions = getZhenxuanSuggestedKeywords(zhenxuanState.activeCategory);
    wrap.innerHTML = suggestions.map(item => `
        <button class="zhenxuan-refresh-preset interactive" type="button" data-zhenxuan-refresh-keyword="${escapeZhenxuanHtml(item)}">
            ${escapeZhenxuanHtml(item)}
        </button>
    `).join('');
}

function renderZhenxuanCategories() {
    const strip = document.getElementById('zhenxuan-category-strip');
    if (!strip) return;
    const chips = getZhenxuanCategoryList().map(item => `
        <button class="zhenxuan-category-chip interactive${item.id === zhenxuanState.activeCategory ? ' active' : ''}" type="button" data-zhenxuan-category="${escapeZhenxuanHtml(item.id)}">
            ${escapeZhenxuanHtml(item.label)}
        </button>
    `);
    chips.push(`
        <button class="zhenxuan-category-chip zhenxuan-category-chip-add interactive" type="button" data-zhenxuan-add-category="true" aria-label="添加分组">
            +
        </button>
    `);
    strip.innerHTML = chips.join('');
}

function renderZhenxuanHeaderMeta() {
    const badge = document.getElementById('zhenxuan-top-badge');
    if (badge) badge.textContent = getZhenxuanCollectionModel().issue;
    const note = document.getElementById('zhenxuan-note');
    if (note) note.textContent = getZhenxuanNoteText(activeZhenxuanPage);
}

function renderZhenxuanHero() {
    const hero = document.getElementById('zhenxuan-hero-card');
    const heading = document.getElementById('zhenxuan-section-heading');
    if (!hero || !heading) return;
    const collection = getZhenxuanCollectionModel();
    const activeLabel = getZhenxuanCategoryLabel(zhenxuanState.activeCategory);
    heading.textContent = collection.sectionHeading;
    hero.innerHTML = `
        <div class="zhenxuan-hero-kicker">
            <span>${escapeZhenxuanHtml(collection.kicker)}</span>
            <b>${escapeZhenxuanHtml(activeLabel)}</b>
        </div>
        <h2>${escapeZhenxuanHtml(collection.headline)}</h2>
        <p>${escapeZhenxuanHtml(collection.copy)}</p>
        <div class="zhenxuan-hero-footer">
            <span>${escapeZhenxuanHtml(collection.mood)}</span>
            <strong>${escapeZhenxuanHtml(collection.footerLabel)}</strong>
        </div>
    `;
}

function renderZhenxuanProducts() {
    const grid = document.getElementById('zhenxuan-product-grid');
    if (!grid) return;
    const collection = getZhenxuanCollectionModel();
    if (!collection.items.length) {
        grid.innerHTML = `
            <article class="zhenxuan-empty-card zhenxuan-empty-inline">
                <span class="zhenxuan-empty-kicker">NO RESULT</span>
                <h3>这一页暂时还没排出商品</h3>
                <p>换一个关键词，或者点刷新重新排版当前页。</p>
            </article>
        `;
        return;
    }
    grid.innerHTML = collection.items.map(item => `
        <article class="zhenxuan-product-card" data-tone="${escapeZhenxuanHtml(item.tone || 'blush')}">
            <div class="zhenxuan-product-figure">
                <div class="zhenxuan-product-figure-top">
                    <span>${escapeZhenxuanHtml(item.tag)}</span>
                    <em class="zhenxuan-product-code">NO. ${escapeZhenxuanHtml(item.serial || '01')}</em>
                </div>
                <div class="zhenxuan-product-silhouette" aria-hidden="true">
                    <i></i><i></i><i></i>
                </div>
                <div class="zhenxuan-product-figure-copy">
                    <b class="zhenxuan-product-caption">${escapeZhenxuanHtml(item.caption || item.meta)}</b>
                    <strong>${escapeZhenxuanHtml(item.meta)}</strong>
                </div>
            </div>
            <div class="zhenxuan-product-body">
                <div class="zhenxuan-product-body-top">
                    <div class="zhenxuan-product-heading-row">
                        <h3>${escapeZhenxuanHtml(item.name)}</h3>
                        <strong class="zhenxuan-product-price">${escapeZhenxuanHtml(item.price)}</strong>
                    </div>
                    <p>${escapeZhenxuanHtml(item.note)}</p>
                </div>
                <div class="zhenxuan-product-footer">
                    <span class="zhenxuan-product-material">${escapeZhenxuanHtml(item.material || '精选材质')}</span>
                    <span class="zhenxuan-product-scene">${escapeZhenxuanHtml(item.scene || '本页精选')}</span>
                </div>
            </div>
        </article>
    `).join('');
}

function renderZhenxuanHome() {
    const input = document.getElementById('zhenxuan-search-input');
    const draft = getZhenxuanDraftQuery();
    if (input && input.value !== draft) input.value = draft;
    renderZhenxuanHeaderMeta();
    renderZhenxuanCategories();
    renderZhenxuanHero();
    renderZhenxuanProducts();
    renderZhenxuanRefreshSuggestions();
}

function renderZhenxuanProducts() {
    const grid = document.getElementById('zhenxuan-product-grid');
    if (!grid) return;
    const collection = getZhenxuanCollectionModel();
    if (!collection.items.length) {
        grid.innerHTML = `
            <article class="zhenxuan-empty-card zhenxuan-empty-inline">
                <span class="zhenxuan-empty-kicker">NO RESULT</span>
                <h3>这一页暂时还没有排出商品</h3>
                <p>换一个关键词，或者点刷新重新生成当前标签页的整套陈列。</p>
            </article>
        `;
        return;
    }
    grid.innerHTML = collection.items.map(item => `
        <article class="zhenxuan-product-card" data-tone="${escapeZhenxuanHtml(item.tone || 'blush')}">
            <div class="zhenxuan-product-cover">
                <div class="zhenxuan-product-cover-top">
                    <span class="zhenxuan-product-tag">${escapeZhenxuanHtml(item.tag)}</span>
                    <em class="zhenxuan-product-code">ATELIER / ${escapeZhenxuanHtml(item.serial || '01')}</em>
                </div>
                <div class="zhenxuan-product-serial" aria-hidden="true">${escapeZhenxuanHtml(item.serial || '01')}</div>
                <div class="zhenxuan-product-cover-copy">
                    <b class="zhenxuan-product-caption">${escapeZhenxuanHtml(item.caption || item.meta)}</b>
                    <strong class="zhenxuan-product-meta">${escapeZhenxuanHtml(item.meta)}</strong>
                </div>
            </div>
            <div class="zhenxuan-product-body">
                <div class="zhenxuan-product-body-top">
                    <div class="zhenxuan-product-heading-row">
                        <div class="zhenxuan-product-heading-copy">
                            <span class="zhenxuan-product-index">COLLECTIBLE ${escapeZhenxuanHtml(item.serial || '01')}</span>
                            <h3>${escapeZhenxuanHtml(item.name)}</h3>
                        </div>
                        <strong class="zhenxuan-product-price">${escapeZhenxuanHtml(item.price)}</strong>
                    </div>
                    <p>${escapeZhenxuanHtml(item.note)}</p>
                </div>
                <div class="zhenxuan-product-facts">
                    <div class="zhenxuan-product-fact">
                        <span>MATERIAL</span>
                        <strong>${escapeZhenxuanHtml(item.material || '本页材质')}</strong>
                    </div>
                    <div class="zhenxuan-product-fact">
                        <span>SCENE</span>
                        <strong>${escapeZhenxuanHtml(item.scene || '本页陈列')}</strong>
                    </div>
                </div>
            </div>
        </article>
    `).join('');
}

function getZhenxuanNoteText(page) {
    if (page === 'home') {
        return getZhenxuanCollectionModel().note || `${getZhenxuanCategoryLabel(zhenxuanState.activeCategory)} · ${ZHENXUAN_PAGES.home.note}`;
    }
    return ZHENXUAN_PAGES[page]?.note || ZHENXUAN_PAGES.home.note;
}

function setZhenxuanPage(page, scrollToTop = true) {
    const nextPage = ZHENXUAN_PAGES[page] ? page : 'home';
    activeZhenxuanPage = nextPage;
    document.querySelectorAll('[data-zhenxuan-page]').forEach(section => {
        const isActive = section.getAttribute('data-zhenxuan-page') === nextPage;
        section.hidden = !isActive;
        section.classList.toggle('active', isActive);
    });
    document.querySelectorAll('[data-zhenxuan-tab]').forEach(tab => {
        const isActive = tab.getAttribute('data-zhenxuan-tab') === nextPage;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    renderZhenxuanHeaderMeta();
    if (scrollToTop) {
        const stage = document.getElementById('zhenxuan-stage');
        if (stage) stage.scrollTop = 0;
    }
}

function syncZhenxuanSearchDraft(value) {
    zhenxuanState.searchDraft = normalizeZhenxuanSearchText(value);
    writeZhenxuanState();
}

function generateZhenxuanProducts(keyword, options = {}) {
    const nextQuery = normalizeZhenxuanSearchText(keyword);
    zhenxuanState.search = nextQuery;
    zhenxuanState.searchDraft = nextQuery;
    zhenxuanState.refreshSeed = (Number(zhenxuanState.refreshSeed) || 0) + 1;
    writeZhenxuanState();
    renderZhenxuanHome();
    setZhenxuanPage('home', false);
    if (options.closeRefresh) closeZhenxuanRefreshSheet();
    showZhenxuanToast(nextQuery ? `已根据「${nextQuery}」重刷当前页` : '已重刷当前页陈列');
}

function openZhenxuanGroupSheet() {
    const sheet = document.getElementById('zhenxuan-group-sheet');
    const input = document.getElementById('zhenxuan-group-input');
    const message = document.getElementById('zhenxuan-group-message');
    if (message) {
        message.textContent = '';
        message.classList.remove('error');
    }
    if (input) input.value = '';
    if (!sheet) return;
    sheet.hidden = false;
    window.setTimeout(() => input?.focus(), 80);
}

function closeZhenxuanGroupSheet() {
    const sheet = document.getElementById('zhenxuan-group-sheet');
    const message = document.getElementById('zhenxuan-group-message');
    if (message) {
        message.textContent = '';
        message.classList.remove('error');
    }
    if (sheet) sheet.hidden = true;
}

function openZhenxuanRefreshSheet() {
    const sheet = document.getElementById('zhenxuan-refresh-sheet');
    const input = document.getElementById('zhenxuan-refresh-input');
    const message = document.getElementById('zhenxuan-refresh-message');
    if (message) {
        message.textContent = '';
        message.classList.remove('error');
    }
    if (input) input.value = getZhenxuanDraftQuery() || getZhenxuanCategoryLabel(zhenxuanState.activeCategory);
    renderZhenxuanRefreshSuggestions();
    if (!sheet) return;
    sheet.hidden = false;
    window.setTimeout(() => {
        input?.focus();
        input?.select();
    }, 80);
}

function closeZhenxuanRefreshSheet() {
    const sheet = document.getElementById('zhenxuan-refresh-sheet');
    const message = document.getElementById('zhenxuan-refresh-message');
    if (message) {
        message.textContent = '';
        message.classList.remove('error');
    }
    if (sheet) sheet.hidden = true;
}

function saveZhenxuanRefresh(event) {
    event.preventDefault();
    const input = document.getElementById('zhenxuan-refresh-input');
    generateZhenxuanProducts(input?.value || '', { closeRefresh: true });
    input?.blur();
}

function saveZhenxuanGroup(event) {
    event.preventDefault();
    const input = document.getElementById('zhenxuan-group-input');
    const message = document.getElementById('zhenxuan-group-message');
    const label = normalizeZhenxuanCategoryLabel(input?.value || '');
    if (!label) {
        if (message) {
            message.textContent = '先写下分组名称。';
            message.classList.add('error');
        }
        input?.focus();
        return;
    }
    const duplicated = getZhenxuanCategoryList().some(item => item.label.toLowerCase() === label.toLowerCase());
    if (duplicated) {
        if (message) {
            message.textContent = '已经有同名分组了。';
            message.classList.add('error');
        }
        input?.focus();
        return;
    }
    if (zhenxuanState.customCategories.length >= ZHENXUAN_MAX_CUSTOM_CATEGORIES) {
        if (message) {
            message.textContent = '自定义分组已到上限。';
            message.classList.add('error');
        }
        return;
    }
    const nextItem = {
        id: `custom-${Date.now().toString(36)}`,
        label
    };
    zhenxuanState.customCategories = [...zhenxuanState.customCategories, nextItem];
    zhenxuanState.activeCategory = nextItem.id;
    zhenxuanState.search = '';
    zhenxuanState.searchDraft = '';
    zhenxuanState.refreshSeed = 0;
    writeZhenxuanState();
    renderZhenxuanHome();
    setZhenxuanPage('home', false);
    closeZhenxuanGroupSheet();
    showZhenxuanToast(`已添加「${label}」`);
}

async function hydrateZhenxuanState() {
    zhenxuanState = await readZhenxuanState();
    renderZhenxuanHome();
    setZhenxuanPage(activeZhenxuanPage, false);
    return zhenxuanState;
}

function syncZhenxuanSearchDraft(value) {
    zhenxuanState.searchDraft = normalizeZhenxuanSearchText(value);
    writeZhenxuanState();
}

async function generateZhenxuanProducts(keyword, options = {}) {
    if (zhenxuanGenerating) return;
    const categoryId = zhenxuanState.activeCategory;
    const nextQuery = resolveZhenxuanGenerationKeyword(keyword, categoryId);
    zhenxuanState.search = nextQuery;
    zhenxuanState.searchDraft = nextQuery;
    writeZhenxuanState();
    setZhenxuanGeneratingState(true);
    setZhenxuanRefreshMessage(options.closeRefresh ? '正在为这一页生成整页商品，请稍等…' : '');
    showZhenxuanToast(nextQuery ? `正在根据“${nextQuery}”生成当前标签页` : '正在生成当前标签页', 1800);

    try {
        const collection = await generateZhenxuanCollectionWithApi(categoryId, nextQuery);
        const updatedAt = Date.now();
        zhenxuanState.generatedCollections = {
            ...zhenxuanState.generatedCollections,
            [categoryId]: {
                query: nextQuery,
                collection,
                updatedAt
            }
        };
        zhenxuanState.refreshSeed = updatedAt;
        writeZhenxuanState();
        renderZhenxuanHome();
        setZhenxuanPage('home', false);
        if (options.closeRefresh) closeZhenxuanRefreshSheet();
        showZhenxuanToast(`已根据“${nextQuery}”重做当前标签页`, 2200);
    } catch (error) {
        const message = error?.message || '生成失败，请稍后再试。';
        setZhenxuanRefreshMessage(message, true);
        showZhenxuanToast(message, 2600);
    } finally {
        setZhenxuanGeneratingState(false);
    }
}

function openZhenxuanRefreshSheet() {
    const sheet = document.getElementById('zhenxuan-refresh-sheet');
    const input = document.getElementById('zhenxuan-refresh-input');
    setZhenxuanRefreshMessage('');
    if (input) input.value = getZhenxuanDraftQuery() || getZhenxuanCategoryQuery() || getZhenxuanCategoryLabel(zhenxuanState.activeCategory);
    renderZhenxuanRefreshSuggestions();
    if (!sheet) return;
    sheet.hidden = false;
    window.setTimeout(() => {
        input?.focus();
        input?.select();
    }, 80);
}

function closeZhenxuanRefreshSheet() {
    const sheet = document.getElementById('zhenxuan-refresh-sheet');
    setZhenxuanRefreshMessage('');
    if (sheet) sheet.hidden = true;
}

function saveZhenxuanRefresh(event) {
    event.preventDefault();
    const input = document.getElementById('zhenxuan-refresh-input');
    void generateZhenxuanProducts(input?.value || '', { closeRefresh: true });
    input?.blur();
}

async function hydrateZhenxuanState() {
    zhenxuanState = await readZhenxuanState();
    syncZhenxuanSearchStateForCategory(zhenxuanState.activeCategory);
    renderZhenxuanHome();
    setZhenxuanPage(activeZhenxuanPage, false);
    return zhenxuanState;
}

async function openZhenxuanApp() {
    const app = getZhenxuanApp();
    if (!app) return;
    document.body.classList.remove('edit-mode');
    if (typeof closeSettingsApp === 'function') closeSettingsApp(true);
    if (typeof closeLetterApp === 'function') closeLetterApp(true);
    if (typeof closePrivateApp === 'function') closePrivateApp(true);
    if (typeof closePrologueApp === 'function') closePrologueApp(true);
    if (typeof closeStyleApp === 'function') closeStyleApp(true);
    if (typeof closeCommunityApp === 'function') closeCommunityApp(true);
    if (typeof closeEncounterApp === 'function') closeEncounterApp(true);
    if (typeof closeDossierApp === 'function') closeDossierApp(true);
    if (typeof closeWanyeApp === 'function') closeWanyeApp(true);
    if (typeof closeLingguangApp === 'function') closeLingguangApp(true);
    if (typeof closeGuideApp === 'function') closeGuideApp(true);
    if (typeof closePhoneApp === 'function') closePhoneApp(true);
    await hydrateZhenxuanState();
    document.body.classList.add('zhenxuan-open');
    app.classList.add('active');
}

function closeZhenxuanApp(instant = false) {
    const app = getZhenxuanApp();
    if (!app) return;
    closeZhenxuanGroupSheet();
    closeZhenxuanRefreshSheet();
    hideZhenxuanToast(true);
    if (instant) {
        const previousTransition = app.style.transition;
        app.style.transition = 'none';
        app.classList.remove('active');
        app.offsetHeight;
        requestAnimationFrame(() => {
            app.style.transition = previousTransition;
        });
    } else {
        app.classList.remove('active');
    }
    document.body.classList.remove('zhenxuan-open');
}

function bindZhenxuanEvents() {
    const app = getZhenxuanApp();
    if (!app || zhenxuanEventsBound) return;
    zhenxuanEventsBound = true;
    void hydrateZhenxuanState();

    document.getElementById('zhenxuan-close-title')?.addEventListener('click', event => {
        event.preventDefault();
        closeZhenxuanApp();
    });

    document.getElementById('zhenxuan-search-input')?.addEventListener('input', event => {
        syncZhenxuanSearchDraft(event.target?.value || '');
    });

    document.getElementById('zhenxuan-search-input')?.addEventListener('keydown', event => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        const input = event.target;
        generateZhenxuanProducts(input?.value || '');
        input?.blur?.();
    });

    document.getElementById('zhenxuan-search-submit')?.addEventListener('click', event => {
        event.preventDefault();
        const input = document.getElementById('zhenxuan-search-input');
        generateZhenxuanProducts(input?.value || '');
        input?.blur();
    });

    document.getElementById('zhenxuan-refresh-feed')?.addEventListener('click', event => {
        event.preventDefault();
        openZhenxuanRefreshSheet();
    });

    document.getElementById('zhenxuan-group-form')?.addEventListener('submit', saveZhenxuanGroup);
    document.getElementById('zhenxuan-refresh-form')?.addEventListener('submit', saveZhenxuanRefresh);
    document.getElementById('zhenxuan-group-cancel')?.addEventListener('click', event => {
        event.preventDefault();
        closeZhenxuanGroupSheet();
    });
    document.getElementById('zhenxuan-refresh-cancel')?.addEventListener('click', event => {
        event.preventDefault();
        closeZhenxuanRefreshSheet();
    });
    document.getElementById('zhenxuan-group-dismiss')?.addEventListener('click', event => {
        event.preventDefault();
        closeZhenxuanGroupSheet();
    });
    document.getElementById('zhenxuan-refresh-dismiss')?.addEventListener('click', event => {
        event.preventDefault();
        closeZhenxuanRefreshSheet();
    });
    document.getElementById('zhenxuan-group-sheet')?.addEventListener('click', event => {
        if (event.target === event.currentTarget) closeZhenxuanGroupSheet();
    });
    document.getElementById('zhenxuan-refresh-sheet')?.addEventListener('click', event => {
        if (event.target === event.currentTarget) closeZhenxuanRefreshSheet();
    });

    app.addEventListener('click', event => {
        const target = event.target instanceof Element ? event.target : event.target?.parentElement;
        const tab = target?.closest('[data-zhenxuan-tab]');
        if (tab) {
            event.preventDefault();
            setZhenxuanPage(tab.getAttribute('data-zhenxuan-tab') || 'home');
            return;
        }
        const category = target?.closest('[data-zhenxuan-category]');
        if (category) {
            event.preventDefault();
            zhenxuanState.activeCategory = category.getAttribute('data-zhenxuan-category') || 'recommend';
            zhenxuanState.refreshSeed = 0;
            syncZhenxuanSearchStateForCategory(zhenxuanState.activeCategory);
            writeZhenxuanState();
            renderZhenxuanHome();
            setZhenxuanPage('home', false);
            return;
        }
        const refreshPreset = target?.closest('[data-zhenxuan-refresh-keyword]');
        if (refreshPreset) {
            event.preventDefault();
            const keyword = refreshPreset.getAttribute('data-zhenxuan-refresh-keyword') || '';
            const input = document.getElementById('zhenxuan-refresh-input');
            if (input) {
                input.value = keyword;
                input.focus();
                input.setSelectionRange(keyword.length, keyword.length);
            }
            syncZhenxuanSearchDraft(keyword);
            return;
        }
        const addCategory = target?.closest('[data-zhenxuan-add-category]');
        if (addCategory) {
            event.preventDefault();
            openZhenxuanGroupSheet();
            return;
        }
        const profileAction = target?.closest('[data-zhenxuan-profile-action]');
        if (profileAction) {
            event.preventDefault();
            const key = profileAction.getAttribute('data-zhenxuan-profile-action') || '';
            if (ZHENXUAN_PROFILE_ACTION_MESSAGES[key]) showZhenxuanToast(ZHENXUAN_PROFILE_ACTION_MESSAGES[key], 2200);
        }
    });

    app.addEventListener('keydown', event => {
        const target = event.target instanceof Element ? event.target : event.target?.parentElement;
        const tab = target?.closest('[data-zhenxuan-tab]');
        if (tab && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            setZhenxuanPage(tab.getAttribute('data-zhenxuan-tab') || 'home');
        }
    });

    app.addEventListener('touchstart', event => event.stopPropagation(), { passive: true });
    app.addEventListener('mousedown', event => event.stopPropagation());
}

bindZhenxuanEvents();

document.querySelector('.home-indicator')?.addEventListener('click', () => {
    if (getZhenxuanApp()?.classList.contains('active')) closeZhenxuanApp(true);
});

document.addEventListener('keydown', event => {
    if (!getZhenxuanApp()?.classList.contains('active') || event.key !== 'Escape') return;
    if (!document.getElementById('zhenxuan-refresh-sheet')?.hidden) {
        closeZhenxuanRefreshSheet();
    } else if (!document.getElementById('zhenxuan-group-sheet')?.hidden) {
        closeZhenxuanGroupSheet();
    } else {
        closeZhenxuanApp();
    }
});

window.openZhenxuanApp = openZhenxuanApp;
window.closeZhenxuanApp = closeZhenxuanApp;
