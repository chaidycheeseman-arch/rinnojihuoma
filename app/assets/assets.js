const ASSETS_KEY = 'rinno_assets_state_v1';
const ASSETS_PASSCODE_LENGTH = 6;
const ASSETS_LOT_SIZE = 100;
const ASSETS_PRICE_TICK_MS = 5000;
const ASSETS_CLOCK_TICK_MS = 1000;
const ASSETS_WORKDAY_DIVISOR = 22;
const ASSETS_BILL_LIMIT = 48;
const ASSETS_CARD_LIMIT = 12;

const ASSETS_COMPANIES = [
    {
        id: 'cxtz',
        name: '晨汐投资',
        ticker: 'CXT.SH',
        sector: '消费科技',
        base: 248.6,
        vol: 0.016,
        intro: '聚焦内容平台、轻零售与数字会员服务的综合消费公司，波动平缓，适合作为资管页里的基准持仓。'
    },
    {
        id: 'mgyj',
        name: '暮港医健',
        ticker: 'MGY.SZ',
        sector: '医疗服务',
        base: 87.4,
        vol: 0.014,
        intro: '以连锁诊疗与康复服务为主，现金流相对稳定，适合做稳健仓位。'
    },
    {
        id: 'xhny',
        name: '星河能源',
        ticker: 'XHN.SH',
        sector: '清洁能源',
        base: 156.2,
        vol: 0.021,
        intro: '新能源与储能并行布局，弹性更强，价格波幅略高于其余标的。'
    },
    {
        id: 'yfzy',
        name: '屿风置业',
        ticker: 'YFZ.SZ',
        sector: '城市运营',
        base: 31.8,
        vol: 0.012,
        intro: '偏稳健的城市服务与物业资产公司，适合补充低价位持仓。'
    },
    {
        id: 'wlhy',
        name: '雾岚航运',
        ticker: 'WLH.SH',
        sector: '物流航运',
        base: 72.3,
        vol: 0.017,
        intro: '跨境物流与航运一体化标的，景气变化会比较直接地反映在报价上。'
    }
];

const ASSETS_JOBS = [
    {
        id: 'j1',
        company: '晨汐投资',
        position: '品牌内容策划',
        salary: 18000,
        start: '09:30',
        end: '18:30',
        dept: '品牌叙事中心'
    },
    {
        id: 'j2',
        company: '暮港医健',
        position: '体验设计师',
        salary: 14800,
        start: '09:00',
        end: '18:00',
        dept: '用户体验组'
    },
    {
        id: 'j3',
        company: '星河能源',
        position: '数据策略分析',
        salary: 16600,
        start: '09:00',
        end: '18:30',
        dept: '经营分析部'
    },
    {
        id: 'j4',
        company: '屿风置业',
        position: '项目运营经理',
        salary: 19500,
        start: '09:30',
        end: '18:30',
        dept: '城市运营中心'
    }
];

const ASSETS_LOTTERIES = [
    {
        id: 'koi',
        name: '锦鲤六选',
        tag: 'KOI LUCK',
        price: 5,
        jackpot: 1200000,
        desc: '从 1 到 36 里抽 6 个数字，适合慢慢收集好运的玩法。'
    },
    {
        id: 'lucky7',
        name: 'Lucky 7',
        tag: 'LUCKY 7',
        price: 2,
        jackpot: 200000,
        desc: '三位数快开彩票，节奏更轻，适合随手来一注。'
    },
    {
        id: 'twocolor',
        name: '双色风铃',
        tag: 'TWO COLOR',
        price: 2,
        jackpot: 5000000,
        desc: '经典双区选号，红球与蓝球组合更有仪式感。'
    },
    {
        id: 'spin',
        name: '转运刮刮',
        tag: 'FORTUNE SPIN',
        price: 10,
        jackpot: 10000,
        desc: '更像即时小乐趣，重在立刻反馈与小额惊喜。'
    }
];

const ASSETS_PAYMENT_TOOLS = [
    {
        name: '银行卡',
        icon: '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/><line x1="5" y1="15" x2="10" y2="15"/>'
    },
    {
        name: '亲属卡',
        icon: '<rect x="2" y="7" width="20" height="13" rx="3"/><circle cx="9" cy="12" r="2"/><circle cx="15.5" cy="13" r="2"/><path d="M6 7a3 3 0 0 1 6 0"/>'
    },
    {
        name: '支付密码',
        icon: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'
    },
    {
        name: '免密支付',
        icon: '<rect x="2" y="6" width="20" height="14" rx="3"/><path d="m13 9-3 4h3l-2 4 5-6h-3l2-2z"/>'
    }
];

let assetsState = null;
let assetsEventsBound = false;
let assetsActiveTab = 'finance';
let assetsPriceTick = 0;
let assetsClockTick = 0;
let assetsCurrentStockId = '';
let assetsCurrentLotteryId = '';
let assetsLotterySelection = null;
let assetsLotteryDrawResult = null;
let assetsPaymentSheetState = null;
let assetsPaymentCommitTimer = 0;
let assetsUtilitySheetState = null;
let assetsDetailPageState = null;

function assetsEsc(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function assetsRoundMoney(value) {
    return Math.round((Number(value) || 0) * 100) / 100;
}

function assetsFmt(value, digits = 2) {
    return `¥${assetsRoundMoney(value).toLocaleString('zh-CN', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
    })}`;
}

function assetsFmtCompact(value) {
    const number = Number(value) || 0;
    if (Math.abs(number) >= 10000) return `¥${(number / 10000).toFixed(2)}万`;
    return assetsFmt(number, 0);
}

function assetsFmtSignedMoney(value) {
    const number = assetsRoundMoney(value);
    return `${number >= 0 ? '+' : '-'}${assetsFmt(Math.abs(number))}`;
}

function assetsFmtSignedPercent(value) {
    const number = Number(value) || 0;
    return `${number >= 0 ? '+' : '-'}${Math.abs(number).toFixed(2)}%`;
}

function assetsClamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function assetsNormalizePasscode(value) {
    return String(value || '').replace(/\D/g, '').slice(0, ASSETS_PASSCODE_LENGTH);
}

function assetsNormalizeCardLast4(value) {
    const digits = String(value || '').replace(/\D/g, '');
    return digits.slice(-4);
}

function assetsMakeId(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function assetsGetNow() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return {
        timestamp: now.getTime(),
        dateKey: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
        dateLabel: now.toLocaleDateString('zh-CN', {
            month: 'long',
            day: 'numeric',
            weekday: 'short'
        }),
        time: `${hh}:${mm}:${ss}`,
        shortTime: `${hh}:${mm}`
    };
}

function assetsShowToast(message, duration = 2200) {
    const toast = document.getElementById('assets-toast');
    if (!toast || !message) return;
    toast.textContent = String(message);
    toast.classList.add('show');
    window.clearTimeout(assetsShowToast._timer);
    assetsShowToast._timer = window.setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

function assetsGetCompanyById(id) {
    return ASSETS_COMPANIES.find(company => company.id === String(id)) || null;
}

function assetsGetJobById(id) {
    return ASSETS_JOBS.find(job => job.id === String(id)) || null;
}

function assetsGetLotteryById(id) {
    return ASSETS_LOTTERIES.find(item => item.id === String(id)) || null;
}

function assetsPickBankCardStyle(type, bank) {
    const source = `${type || ''} ${bank || ''}`.toLowerCase();
    if (source.includes('black') || source.includes('黑') || source.includes('无限')) return 'black';
    if (source.includes('platinum') || source.includes('铂') || source.includes('白')) return 'platinum';
    if (source.includes('gold') || source.includes('金')) return 'gold';
    if (source.includes('cyber') || source.includes('电竞') || source.includes('赛博')) return 'cyber';
    return 'blue';
}

function assetsGetBankCardBadge(type) {
    const safeType = String(type || '').trim();
    if (!safeType) return 'RINNO CARD';
    return safeType.toUpperCase();
}

function assetsCreateDefaultFamilyCard() {
    return {
        enabled: true,
        holder: '家人',
        relation: '日常代付',
        monthlyLimit: 3000,
        monthlySpent: 0
    };
}

function assetsNormalizeFamilyCard(source) {
    const defaults = assetsCreateDefaultFamilyCard();
    const monthlyLimit = assetsRoundMoney(Math.max(0, Number(source?.monthlyLimit ?? defaults.monthlyLimit)));
    const monthlySpent = assetsRoundMoney(
        assetsClamp(Number(source?.monthlySpent ?? defaults.monthlySpent), 0, monthlyLimit || defaults.monthlyLimit)
    );
    return {
        enabled: typeof source?.enabled === 'boolean' ? source.enabled : defaults.enabled,
        holder: String(source?.holder || defaults.holder).trim() || defaults.holder,
        relation: String(source?.relation || defaults.relation).trim() || defaults.relation,
        monthlyLimit,
        monthlySpent
    };
}

function assetsGetFamilyCard() {
    return assetsState?.familyCard || assetsCreateDefaultFamilyCard();
}

function assetsRenderBankCard(card, extraClass = '') {
    return `
        <button class="assets-bank-card is-${assetsEsc(card.style)}${extraClass ? ` ${extraClass}` : ''}" type="button" data-assets-card="${assetsEsc(card.id)}">
            <div class="assets-bank-card-top">
                <div class="assets-bank-card-bank">
                    ${assetsEsc(card.bank)}
                    <span>${assetsEsc(card.type)}</span>
                </div>
                <div class="assets-bank-card-badge">${assetsEsc(assetsGetBankCardBadge(card.type))}</div>
            </div>
            <div class="assets-bank-card-chip" aria-hidden="true"></div>
            <div class="assets-bank-card-number">**** **** **** ${assetsEsc(card.last4)}</div>
            <div class="assets-bank-card-bottom">
                <div>
                    <div class="assets-bank-card-label">Balance</div>
                    <div class="assets-bank-card-value">${assetsFmt(card.balance)}</div>
                </div>
                <div class="assets-bank-card-holder">
                    <span>Holder</span>
                    <strong>${assetsEsc(card.holder)}</strong>
                </div>
            </div>
        </button>
    `;
}

function assetsCreateInitialMarket() {
    const prices = {};
    const history = {};
    ASSETS_COMPANIES.forEach(company => {
        const points = [];
        let current = company.base * (0.93 + Math.random() * 0.14);
        for (let index = 0; index < 36; index += 1) {
            const drift = (Math.random() - 0.48) * company.vol * current;
            current = assetsClamp(current + drift, company.base * 0.68, company.base * 1.42);
            points.push(assetsRoundMoney(current));
        }
        prices[company.id] = points[points.length - 1];
        history[company.id] = points;
    });
    return { prices, history };
}

function assetsCreateSampleCards() {
    return [
        {
            id: assetsMakeId('card'),
            bank: '招商银行',
            type: 'Platinum',
            last4: '1024',
            balance: 12860,
            holder: 'RINNO USER',
            style: 'platinum'
        },
        {
            id: assetsMakeId('card'),
            bank: '浦发银行',
            type: 'Black',
            last4: '6628',
            balance: 26400,
            holder: 'RINNO USER',
            style: 'black'
        }
    ];
}

function assetsCreateSampleBills(cards) {
    const firstCard = cards[0];
    const secondCard = cards[1];
    const now = Date.now();
    return [
        {
            id: assetsMakeId('bill'),
            title: '充值到零钱',
            note: firstCard ? `来自 ${firstCard.bank} 尾号 ${firstCard.last4}` : '银行卡转入',
            amount: 1200,
            icon: 'deposit',
            createdAt: now - 1000 * 60 * 55
        },
        {
            id: assetsMakeId('bill'),
            title: '卖出 星河能源',
            note: `${ASSETS_LOT_SIZE} 股已卖出`,
            amount: 15620,
            icon: 'stock-sell',
            createdAt: now - 1000 * 60 * 60 * 6
        },
        {
            id: assetsMakeId('bill'),
            title: '工资到账',
            note: '打卡完成后自动入账',
            amount: 818.18,
            icon: 'salary',
            createdAt: now - 1000 * 60 * 60 * 26
        },
        {
            id: assetsMakeId('bill'),
            title: '提现到银行卡',
            note: secondCard ? `转入 ${secondCard.bank} 尾号 ${secondCard.last4}` : '零钱提现',
            amount: -666,
            icon: 'withdraw',
            createdAt: now - 1000 * 60 * 60 * 40
        }
    ];
}

function assetsCreateDefaultState() {
    const market = assetsCreateInitialMarket();
    const cards = assetsCreateSampleCards();
    return {
        version: 4,
        cash: 46880,
        holdings: {
            cxtz: { shares: 300, cost: 242.6 },
            xhny: { shares: 200, cost: 151.3 }
        },
        work: {
            jobId: 'j1',
            today: '',
            punchIn: '',
            punchOut: '',
            logs: [],
            totalEarned: 0
        },
        lottery: {
            history: [],
            totalSpent: 0,
            totalWon: 0
        },
        payment: {
            passcode: '',
            noPasswordEnabled: false
        },
        familyCard: assetsCreateDefaultFamilyCard(),
        cards,
        bills: assetsCreateSampleBills(cards),
        prices: market.prices,
        history: market.history
    };
}

function assetsNormalizeHoldings(source) {
    const next = {};
    const raw = source && typeof source === 'object' ? source : {};
    ASSETS_COMPANIES.forEach(company => {
        const item = raw[company.id];
        const shares = Math.max(0, Math.floor(Number(item?.shares ?? item?.count ?? item?.qty ?? 0)));
        if (!shares) return;
        const cost = Number(item?.cost ?? item?.avgCost ?? item?.costBasis ?? company.base);
        next[company.id] = {
            shares,
            cost: assetsRoundMoney(Number.isFinite(cost) ? cost : company.base)
        };
    });
    return next;
}

function assetsNormalizeWorkState(source) {
    const jobId = assetsGetJobById(source?.jobId)?.id || '';
    const logs = Array.isArray(source?.logs)
        ? source.logs
            .map(item => ({
                day: String(item?.day || ''),
                in: String(item?.in || ''),
                out: String(item?.out || ''),
                pay: assetsRoundMoney(item?.pay || 0)
            }))
            .filter(item => item.day)
            .slice(0, 12)
        : [];
    return {
        jobId,
        today: String(source?.today || ''),
        punchIn: String(source?.punchIn || ''),
        punchOut: String(source?.punchOut || ''),
        logs,
        totalEarned: assetsRoundMoney(source?.totalEarned || 0)
    };
}

function assetsNormalizeLotteryState(source) {
    const history = Array.isArray(source?.history)
        ? source.history
            .map(item => ({
                lotteryId: assetsGetLotteryById(item?.lotteryId)?.id || '',
                title: String(item?.title || ''),
                ticketText: String(item?.ticketText || ''),
                resultText: String(item?.resultText || ''),
                payout: assetsRoundMoney(item?.payout || 0),
                price: assetsRoundMoney(item?.price || 0),
                createdAt: Number.isFinite(Number(item?.createdAt)) ? Number(item.createdAt) : String(item?.createdAt || '')
            }))
            .filter(item => item.lotteryId)
            .slice(0, 16)
        : [];
    return {
        history,
        totalSpent: assetsRoundMoney(source?.totalSpent || 0),
        totalWon: assetsRoundMoney(source?.totalWon || 0)
    };
}

function assetsNormalizePaymentState(source) {
    const passcode = assetsNormalizePasscode(source?.passcode);
    return {
        passcode,
        noPasswordEnabled: Boolean(source?.noPasswordEnabled)
    };
}

function assetsNormalizeBankCards(source) {
    const raw = Array.isArray(source) ? source : [];
    return raw
        .map(item => {
            const bank = String(item?.bank || item?.name || '').trim();
            const type = String(item?.type || '').trim();
            const holder = String(item?.holder || item?.owner || '').trim();
            const last4 = assetsNormalizeCardLast4(item?.last4 ?? item?.number ?? item?.tail);
            const balance = assetsRoundMoney(Math.max(0, Number(item?.balance ?? 0)));
            if (!bank || !type || !holder || last4.length !== 4) return null;
            return {
                id: String(item?.id || assetsMakeId('card')),
                bank,
                type,
                last4,
                balance,
                holder,
                style: String(item?.style || assetsPickBankCardStyle(type, bank))
            };
        })
        .filter(Boolean)
        .slice(0, ASSETS_CARD_LIMIT);
}

function assetsNormalizeBills(source) {
    const raw = Array.isArray(source) ? source : [];
    return raw
        .map(item => {
            const title = String(item?.title || '').trim();
            const amount = assetsRoundMoney(item?.amount || 0);
            if (!title || !Number.isFinite(amount)) return null;
            const createdAtNumber = Number(item?.createdAt);
            return {
                id: String(item?.id || assetsMakeId('bill')),
                title,
                note: String(item?.note || item?.desc || ''),
                amount,
                icon: String(item?.icon || 'balance'),
                createdAt: Number.isFinite(createdAtNumber) ? createdAtNumber : String(item?.createdAt || '')
            };
        })
        .filter(Boolean)
        .slice(0, ASSETS_BILL_LIMIT);
}

function assetsNormalizeMarketPrices(source, defaults) {
    const next = {};
    ASSETS_COMPANIES.forEach(company => {
        const price = Number(source?.[company.id]);
        next[company.id] = assetsRoundMoney(
            Number.isFinite(price) ? assetsClamp(price, company.base * 0.52, company.base * 1.58) : defaults[company.id]
        );
    });
    return next;
}

function assetsNormalizeMarketHistory(source, prices, defaults) {
    const next = {};
    ASSETS_COMPANIES.forEach(company => {
        const rawList = Array.isArray(source?.[company.id]) ? source[company.id] : defaults[company.id];
        const cleaned = rawList
            .map(item => Number(item))
            .filter(item => Number.isFinite(item))
            .slice(-36)
            .map(item => assetsRoundMoney(assetsClamp(item, company.base * 0.52, company.base * 1.58)));
        if (!cleaned.length) cleaned.push(prices[company.id]);
        while (cleaned.length < 36) cleaned.unshift(cleaned[0]);
        cleaned[cleaned.length - 1] = prices[company.id];
        next[company.id] = cleaned;
    });
    return next;
}

function assetsNormalizeState(source) {
    const defaults = assetsCreateDefaultState();
    if (!source || typeof source !== 'object') return defaults;
    const prices = assetsNormalizeMarketPrices(source.prices, defaults.prices);
    return {
        version: 4,
        cash: assetsRoundMoney(Math.max(0, Number(source.cash ?? defaults.cash))),
        holdings: assetsNormalizeHoldings(source.holdings),
        work: assetsNormalizeWorkState(source.work),
        lottery: assetsNormalizeLotteryState(source.lottery),
        payment: assetsNormalizePaymentState(source.payment),
        familyCard: assetsNormalizeFamilyCard(source.familyCard),
        cards: assetsNormalizeBankCards(source.cards),
        bills: assetsNormalizeBills(source.bills),
        prices,
        history: assetsNormalizeMarketHistory(source.history, prices, defaults.history)
    };
}

function assetsParseStateContent(content) {
    if (!content || typeof content !== 'string') return assetsCreateDefaultState();
    try {
        return assetsNormalizeState(JSON.parse(content));
    } catch (error) {
        return assetsCreateDefaultState();
    }
}

function assetsReadLegacyState() {
    try {
        return assetsParseStateContent(window.localStorage?.getItem(ASSETS_KEY) || '');
    } catch (error) {
        return assetsCreateDefaultState();
    }
}

async function assetsReadState() {
    try {
        if (typeof db !== 'undefined' && db?.edits?.get) {
            const saved = await db.edits.get(ASSETS_KEY);
            if (saved?.content) return assetsParseStateContent(saved.content);
        }
    } catch (error) {
        console.warn('Assets Dexie read failed:', error);
    }
    return assetsReadLegacyState();
}

async function assetsPersistState(snapshot) {
    const content = JSON.stringify(assetsNormalizeState(snapshot));
    try {
        if (typeof db !== 'undefined' && db?.edits?.put) {
            await db.edits.put({
                id: ASSETS_KEY,
                content,
                type: 'assets-state'
            });
        }
    } catch (error) {
        console.warn('Assets Dexie save failed:', error);
    }
    try {
        window.localStorage?.setItem(ASSETS_KEY, content);
    } catch (error) {
        // Ignore localStorage failures.
    }
}

async function hydrateAssetsState() {
    if (assetsState) return assetsState;
    assetsState = await assetsReadState();
    return assetsState;
}

function writeAssetsState() {
    if (!assetsState) return;
    void assetsPersistState(assetsState);
}

function assetsGetHolding(companyId) {
    return assetsState?.holdings?.[companyId] || null;
}

function assetsGetCardById(cardId) {
    return Array.isArray(assetsState?.cards) ? assetsState.cards.find(card => card.id === String(cardId)) || null : null;
}

function assetsGetTotalCardBalance() {
    return Array.isArray(assetsState?.cards)
        ? assetsRoundMoney(assetsState.cards.reduce((sum, card) => sum + (Number(card.balance) || 0), 0))
        : 0;
}

function assetsGetStockValue(companyId) {
    const holding = assetsGetHolding(companyId);
    const price = Number(assetsState?.prices?.[companyId] || 0);
    return holding ? assetsRoundMoney(holding.shares * price) : 0;
}

function assetsGetStockPnL(companyId) {
    const holding = assetsGetHolding(companyId);
    if (!holding) return 0;
    return assetsRoundMoney((Number(assetsState?.prices?.[companyId] || 0) - holding.cost) * holding.shares);
}

function assetsGetTotalStockValue() {
    return ASSETS_COMPANIES.reduce((sum, company) => sum + assetsGetStockValue(company.id), 0);
}

function assetsGetTotalAssets() {
    return assetsRoundMoney((assetsState?.cash || 0) + assetsGetTotalStockValue() + assetsGetTotalCardBalance());
}

function assetsGetActiveJob() {
    return assetsGetJobById(assetsState?.work?.jobId);
}

function assetsGetLatestWorkLog() {
    return Array.isArray(assetsState?.work?.logs) ? assetsState.work.logs[0] || null : null;
}

function assetsGetTodayIncome() {
    const today = assetsGetNow().dateKey;
    const todayLog = Array.isArray(assetsState?.work?.logs)
        ? assetsState.work.logs.find(item => item.day === today)
        : null;
    return todayLog ? todayLog.pay : 0;
}

function assetsGetDayChange(companyId) {
    const list = Array.isArray(assetsState?.history?.[companyId]) ? assetsState.history[companyId] : [];
    const last = Number(list[list.length - 1] || 0);
    const prev = Number(list[list.length - 2] || last || 1);
    const diff = assetsRoundMoney(last - prev);
    const percent = prev ? (diff / prev) * 100 : 0;
    return { diff, percent };
}

function assetsMakePath(points, width, height, padding = 3) {
    const list = Array.isArray(points) ? points : [];
    if (!list.length) return '';
    const min = Math.min(...list);
    const max = Math.max(...list);
    const range = max - min || 1;
    return list.map((point, index) => {
        const x = padding + (index * (width - padding * 2)) / Math.max(1, list.length - 1);
        const y = height - padding - ((point - min) / range) * (height - padding * 2);
        return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(' ');
}

function assetsGetBillIconSvg(icon) {
    switch (icon) {
        case 'salary':
            return '<path d="M3 7h18v10H3z"/><path d="M3 10h18"/><path d="M8 15h4"/>';
        case 'deposit':
            return '<path d="M12 5v14"/><path d="M7 10l5-5 5 5"/><path d="M5 19h14"/>';
        case 'withdraw':
            return '<path d="M12 5v14"/><path d="M7 14l5 5 5-5"/><path d="M5 5h14"/>';
        case 'stock-buy':
            return '<path d="M4 16l5-5 4 4 7-8"/><path d="M18 7h2v2"/>';
        case 'stock-sell':
            return '<path d="M4 8l5 5 4-4 7 8"/><path d="M18 17h2v-2"/>';
        case 'lottery':
            return '<circle cx="12" cy="12" r="8"/><path d="M9 9h.01"/><path d="M15 9h.01"/><path d="M8.5 14c.8 1.2 2 2 3.5 2s2.7-.8 3.5-2"/>';
        default:
            return '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/><line x1="5" y1="15" x2="10" y2="15"/>';
    }
}

function assetsGetBillTimeText(createdAt) {
    if (typeof createdAt === 'string' && createdAt && !Number.isFinite(Number(createdAt))) return createdAt;
    const stamp = Number(createdAt);
    if (!Number.isFinite(stamp)) return '';
    const date = new Date(stamp);
    const now = new Date();
    const sameDay = date.getFullYear() === now.getFullYear()
        && date.getMonth() === now.getMonth()
        && date.getDate() === now.getDate();
    if (sameDay) {
        return `今天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
    }
    return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

function assetsRenderBillListHtml(items) {
    if (!Array.isArray(items) || !items.length) {
        return '<div class="assets-bill-empty assets-bill-empty--plain">暂无账单</div>';
    }
    return items.map(item => `
        <div class="assets-bill-item">
            <div class="assets-bill-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">${assetsGetBillIconSvg(item.icon)}</svg>
            </div>
            <div class="assets-bill-copy">
                <div class="assets-bill-title">${assetsEsc(item.title)}</div>
                <div class="assets-bill-note">${assetsEsc(item.note || '资金变动')}</div>
                <div class="assets-bill-time">${assetsEsc(assetsGetBillTimeText(item.createdAt))}</div>
            </div>
            <div class="assets-bill-amount ${item.amount >= 0 ? 'is-in' : 'is-out'}">${assetsEsc(assetsFmtSignedMoney(item.amount))}</div>
        </div>
    `).join('');
}

function assetsAddBill(entry) {
    if (!assetsState) return;
    if (!Array.isArray(assetsState.bills)) assetsState.bills = [];
    const title = String(entry?.title || '').trim();
    const amount = assetsRoundMoney(entry?.amount || 0);
    if (!title || !Number.isFinite(amount)) return;
    assetsState.bills.unshift({
        id: assetsMakeId('bill'),
        title,
        note: String(entry?.note || ''),
        amount,
        icon: String(entry?.icon || 'balance'),
        createdAt: Number(entry?.createdAt || Date.now())
    });
    assetsState.bills = assetsState.bills.slice(0, ASSETS_BILL_LIMIT);
}

function assetsRenderMarketBanner() {
    const svg = document.getElementById('assets-market-svg');
    const tickerRow = document.getElementById('assets-market-ticker-row');
    if (!svg || !tickerRow || !assetsState) return;

    svg.innerHTML = ASSETS_COMPANIES.map(company => {
        const points = assetsState.history[company.id] || [];
        return `<path class="assets-mline" d="${assetsMakePath(points, 360, 80, 4)}"></path>`;
    }).join('');

    tickerRow.innerHTML = ASSETS_COMPANIES.map(company => {
        const price = assetsState.prices[company.id];
        const change = assetsGetDayChange(company.id);
        return `
            <div class="assets-ticker-item">
                <span class="assets-ticker-name">${assetsEsc(company.ticker)}</span>
                <span class="assets-ticker-price">${assetsFmt(price)}</span>
                <span class="assets-ticker-chg ${change.diff >= 0 ? 'up' : 'dn'}">${assetsFmtSignedPercent(change.percent)}</span>
            </div>
        `;
    }).join('');
}

function assetsRenderFinancePage() {
    if (!assetsState) return;
    assetsRenderMarketBanner();
    const list = document.getElementById('assets-stock-list');
    const clock = document.getElementById('assets-stock-clock');
    if (!list) return;
    if (clock) clock.textContent = assetsGetNow().shortTime;
    list.innerHTML = ASSETS_COMPANIES.map(company => {
        const holding = assetsGetHolding(company.id);
        const change = assetsGetDayChange(company.id);
        return `
            <button class="assets-stock-card interactive" type="button" data-assets-stock="${company.id}">
                <div>
                    <div class="assets-stock-name">${assetsEsc(company.name)}</div>
                    <div class="assets-stock-sector">
                        ${assetsEsc(company.sector)}
                        ${holding ? ` · 持仓 ${holding.shares} 股` : ' · 可加入自选'}
                    </div>
                </div>
                <div class="assets-stock-price-col">
                    <span class="assets-stock-price">${assetsFmt(assetsState.prices[company.id])}</span>
                    <span class="assets-stock-chg ${change.diff >= 0 ? 'up' : 'dn'}">${assetsFmtSignedPercent(change.percent)}</span>
                </div>
                <svg class="assets-sparkline-svg" viewBox="0 0 44 26" preserveAspectRatio="none" aria-hidden="true">
                    <path class="assets-sparkline-path" d="${assetsMakePath(assetsState.history[company.id], 44, 26, 2)}"></path>
                </svg>
            </button>
        `;
    }).join('');
}

function assetsRenderStockDetail() {
    const modal = document.getElementById('assets-stock-detail');
    const company = assetsGetCompanyById(assetsCurrentStockId);
    if (!modal || !company || !assetsState) return;
    const holding = assetsGetHolding(company.id);
    const dayChange = assetsGetDayChange(company.id);
    modal.innerHTML = `
        <div class="assets-detail-tag">${assetsEsc(company.ticker)}</div>
        <div class="assets-detail-name">${assetsEsc(company.name)}</div>
        <div class="assets-detail-price-row">
            <div class="assets-detail-price">${assetsFmt(assetsState.prices[company.id])}</div>
            <div class="assets-detail-chg ${dayChange.diff >= 0 ? 'up' : 'dn'}">
                ${assetsFmtSignedMoney(dayChange.diff)} / ${assetsFmtSignedPercent(dayChange.percent)}
            </div>
        </div>
        <div class="assets-detail-chart-wrap">
            <svg class="assets-detail-chart-svg" viewBox="0 0 320 72" preserveAspectRatio="none" aria-hidden="true">
                <path class="assets-detail-chart-path" d="${assetsMakePath(assetsState.history[company.id], 320, 72, 4)}"></path>
            </svg>
        </div>
        <div class="assets-detail-intro-lbl">Company Brief</div>
        <div class="assets-detail-intro">${assetsEsc(company.intro)}</div>
        <div class="assets-detail-holding">
            持仓 <strong>${holding ? `${holding.shares} 股` : '0 股'}</strong>
            · 当前市值 <strong>${assetsFmt(assetsGetStockValue(company.id))}</strong>
            · 浮动盈亏 <strong>${assetsFmtSignedMoney(assetsGetStockPnL(company.id))}</strong>
        </div>
        <div class="assets-detail-trade-row">
            <button class="assets-trade-btn buy interactive" type="button" data-assets-trade="buy">买入一手</button>
            <button class="assets-trade-btn sell interactive" type="button" data-assets-trade="sell">卖出一手</button>
        </div>
    `;
}

function assetsOpenStockModal(companyId) {
    assetsCurrentStockId = String(companyId || '');
    const overlay = document.getElementById('assets-stock-modal');
    if (!overlay) return;
    assetsRenderStockDetail();
    overlay.hidden = false;
}

function assetsCommitStockTrade(action) {
    const company = assetsGetCompanyById(assetsCurrentStockId);
    if (!company || !assetsState) return;
    const price = Number(assetsState.prices[company.id] || company.base);
    const lotCost = assetsRoundMoney(price * ASSETS_LOT_SIZE);
    const holding = assetsGetHolding(company.id) || { shares: 0, cost: price };
    if (action === 'buy') {
        if (assetsState.cash < lotCost) {
            assetsShowToast('零钱不足，暂时买不了这一手。');
            return;
        }
        const totalShares = holding.shares + ASSETS_LOT_SIZE;
        const totalCost = holding.shares * holding.cost + lotCost;
        assetsState.cash = assetsRoundMoney(assetsState.cash - lotCost);
        assetsState.holdings[company.id] = {
            shares: totalShares,
            cost: assetsRoundMoney(totalCost / totalShares)
        };
        assetsAddBill({
            title: `买入 ${company.name}`,
            note: `${ASSETS_LOT_SIZE} 股 · ${assetsFmt(price)} / 股`,
            amount: -lotCost,
            icon: 'stock-buy'
        });
        assetsShowToast(`已买入 ${company.name} ${ASSETS_LOT_SIZE} 股。`);
    } else if (action === 'sell') {
        if (holding.shares < ASSETS_LOT_SIZE) {
            assetsShowToast('持仓不足，暂时卖不出这一手。');
            return;
        }
        const leftShares = holding.shares - ASSETS_LOT_SIZE;
        assetsState.cash = assetsRoundMoney(assetsState.cash + lotCost);
        if (leftShares > 0) assetsState.holdings[company.id] = { shares: leftShares, cost: holding.cost };
        else delete assetsState.holdings[company.id];
        assetsAddBill({
            title: `卖出 ${company.name}`,
            note: `${ASSETS_LOT_SIZE} 股 · ${assetsFmt(price)} / 股`,
            amount: lotCost,
            icon: 'stock-sell'
        });
        assetsShowToast(`已卖出 ${company.name} ${ASSETS_LOT_SIZE} 股。`);
    } else {
        return;
    }
    writeAssetsState();
    assetsRefreshVisibleState(false);
}

function assetsHandleStockTrade(action) {
    const company = assetsGetCompanyById(assetsCurrentStockId);
    if (!company || !assetsState) return;
    if (action === 'buy') {
        const price = Number(assetsState.prices[company.id] || company.base);
        const lotCost = assetsRoundMoney(price * ASSETS_LOT_SIZE);
        if (assetsState.cash < lotCost) {
            assetsShowToast('零钱不足，暂时买不了这一手。');
            return;
        }
        assetsRequireOutflowPasscode(`买入 ${company.name}`, () => {
            assetsCommitStockTrade('buy');
        });
        return;
    }
    assetsCommitStockTrade('sell');
}

function assetsRenderWorkPage() {
    if (!assetsState) return;
    const hero = document.getElementById('assets-work-hero');
    const punch = document.getElementById('assets-punch-wrap');
    const interviews = document.getElementById('assets-interview-list');
    if (!hero || !punch || !interviews) return;

    const job = assetsGetActiveJob();
    const now = assetsGetNow();
    const todayLog = assetsGetLatestWorkLog();
    if (!job) {
        hero.innerHTML = `
            <div class="assets-work-no-job">
                <strong>今天还没有接入工作</strong>
                下面保留了几份面试机会，选一份就可以开始打卡。
            </div>
        `;
    } else {
        hero.innerHTML = `
            <div class="assets-work-company">${assetsEsc(job.company)}</div>
            <div class="assets-work-position">${assetsEsc(job.position)}</div>
            <div class="assets-work-meta-row">
                <div class="assets-work-meta-item">
                    <span class="assets-work-meta-label">工作时间</span>
                    <span class="assets-work-meta-value">${assetsEsc(job.start)} - ${assetsEsc(job.end)}</span>
                </div>
                <div class="assets-work-meta-item">
                    <span class="assets-work-meta-label">月薪</span>
                    <span class="assets-work-meta-value">${assetsFmt(job.salary, 0)}</span>
                </div>
                <div class="assets-work-meta-item">
                    <span class="assets-work-meta-label">累计入账</span>
                    <span class="assets-work-meta-value">${assetsFmt(assetsState.work.totalEarned)}</span>
                </div>
            </div>
        `;
    }

    const canPunchIn = Boolean(job) && assetsState.work.today !== now.dateKey;
    const canPunchOut = Boolean(job) && assetsState.work.today === now.dateKey && assetsState.work.punchIn && !assetsState.work.punchOut;
    punch.innerHTML = `
        <div class="assets-punch-time-center">
            <div class="assets-punch-clock-display" id="assets-punch-clock">${now.time}</div>
            <div class="assets-punch-date-display">${assetsEsc(now.dateLabel)}</div>
        </div>
        <div class="assets-punch-status-row">
            <div class="assets-punch-status-box">
                <div class="assets-punch-status-lbl">上班打卡</div>
                <div class="assets-punch-status-val">${assetsEsc(assetsState.work.punchIn || '--:--:--')}</div>
            </div>
            <div class="assets-punch-status-box">
                <div class="assets-punch-status-lbl">下班打卡</div>
                <div class="assets-punch-status-val">${assetsEsc(assetsState.work.punchOut || '--:--:--')}</div>
            </div>
        </div>
        <div class="assets-punch-btns">
            <button class="assets-punch-btn in interactive" type="button" data-assets-punch="in" ${canPunchIn ? '' : 'disabled'}>上班打卡</button>
            <button class="assets-punch-btn out interactive" type="button" data-assets-punch="out" ${canPunchOut ? '' : 'disabled'}>下班打卡</button>
        </div>
        <div class="assets-punch-penalty">
            ${todayLog ? `最近一次到账 ${assetsFmt(todayLog.pay)}` : '完成下班打卡后，当日工资会自动入账。'}
        </div>
    `;

    interviews.innerHTML = ASSETS_JOBS.map(jobItem => {
        const active = job?.id === jobItem.id;
        return `
            <div class="assets-interview-card">
                <div class="assets-interview-company">${assetsEsc(jobItem.company)} · ${assetsEsc(jobItem.dept)}</div>
                <div class="assets-interview-position">${assetsEsc(jobItem.position)}</div>
                <div class="assets-interview-salary">${assetsFmt(jobItem.salary, 0)} / 月</div>
                <div class="assets-interview-actions">
                    <button class="assets-interview-btn accept interactive" type="button" data-assets-accept="${jobItem.id}">
                        ${active ? '当前在岗' : '接受 offer'}
                    </button>
                    <button class="assets-interview-btn interactive" type="button" data-assets-decline="${jobItem.id}">
                        ${active ? '保留岗位' : '先放一放'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function assetsAcceptJob(jobId) {
    const job = assetsGetJobById(jobId);
    if (!job || !assetsState) return;
    assetsState.work.jobId = job.id;
    assetsState.work.today = '';
    assetsState.work.punchIn = '';
    assetsState.work.punchOut = '';
    writeAssetsState();
    assetsRenderWorkPage();
    assetsShowToast(`已接受 ${job.company} 的 offer。`);
}

function assetsDeclineJob(jobId) {
    const job = assetsGetJobById(jobId);
    if (!job) return;
    assetsShowToast(`先为你保留 ${job.company} 这份机会。`);
}

function assetsHandlePunch(type) {
    if (!assetsState) return;
    const job = assetsGetActiveJob();
    if (!job) {
        assetsShowToast('先接入一份工作再打卡。');
        return;
    }
    const now = assetsGetNow();
    if (type === 'in') {
        if (assetsState.work.today === now.dateKey) {
            assetsShowToast('今天已经完成上班打卡。');
            return;
        }
        assetsState.work.today = now.dateKey;
        assetsState.work.punchIn = now.time;
        assetsState.work.punchOut = '';
        writeAssetsState();
        assetsRenderWorkPage();
        assetsShowToast('上班打卡成功。');
        return;
    }
    if (type === 'out') {
        if (assetsState.work.today !== now.dateKey || !assetsState.work.punchIn || assetsState.work.punchOut) {
            assetsShowToast('需要先完成上班打卡。');
            return;
        }
        const pay = assetsRoundMoney(job.salary / ASSETS_WORKDAY_DIVISOR);
        assetsState.work.punchOut = now.time;
        assetsState.work.totalEarned = assetsRoundMoney(assetsState.work.totalEarned + pay);
        assetsState.cash = assetsRoundMoney(assetsState.cash + pay);
        assetsState.work.logs.unshift({
            day: now.dateKey,
            in: assetsState.work.punchIn,
            out: assetsState.work.punchOut,
            pay
        });
        assetsState.work.logs = assetsState.work.logs.slice(0, 12);
        assetsAddBill({
            title: '工资到账',
            note: `${job.company} · ${job.position}`,
            amount: pay,
            icon: 'salary'
        });
        writeAssetsState();
        assetsRefreshVisibleState(false);
        assetsShowToast(`工资到账 ${assetsFmt(pay)}。`);
    }
}

function assetsBuildLotteryPick(lottery) {
    if (!lottery) return null;
    if (lottery.id === 'koi') {
        const values = new Set();
        while (values.size < 6) values.add(String(Math.floor(Math.random() * 36) + 1).padStart(2, '0'));
        const balls = Array.from(values).sort();
        return { title: '本次选号', balls, ticketText: balls.join(' ') };
    }
    if (lottery.id === 'twocolor') {
        const reds = new Set();
        while (reds.size < 6) reds.add(String(Math.floor(Math.random() * 33) + 1).padStart(2, '0'));
        const blue = String(Math.floor(Math.random() * 16) + 1).padStart(2, '0');
        return {
            title: '本次选号',
            balls: Array.from(reds).sort().map(value => ({ value, blue: false })).concat([{ value: blue, blue: true }]),
            ticketText: `${Array.from(reds).sort().join(' ')} + ${blue}`
        };
    }
    if (lottery.id === 'lucky7') {
        const digits = Array.from({ length: 3 }, () => String(Math.floor(Math.random() * 10)));
        return { title: '本次号码', balls: digits, ticketText: digits.join('') };
    }
    const values = Array.from({ length: 5 }, () => String(Math.floor(Math.random() * 9) + 1));
    return { title: '本次刮面', balls: values, ticketText: values.join(' ') };
}

function assetsRollLottery(lottery, pick) {
    const roll = Math.random();
    let payout = 0;
    let resultText = '谢谢参与';
    if (roll < 0.01) {
        payout = assetsRoundMoney(Math.max(lottery.price * 80, lottery.jackpot * 0.002));
        resultText = '头奖命中';
    } else if (roll < 0.05) {
        payout = assetsRoundMoney(lottery.price * 16);
        resultText = '中出高倍奖';
    } else if (roll < 0.18) {
        payout = assetsRoundMoney(lottery.price * 4);
        resultText = '中出小奖';
    } else if (roll < 0.38) {
        payout = assetsRoundMoney(lottery.price);
        resultText = '返还本金';
    }
    return {
        lotteryId: lottery.id,
        title: lottery.name,
        ticketText: pick?.ticketText || '',
        resultText,
        payout,
        price: lottery.price,
        createdAt: Date.now()
    };
}

function assetsRenderLotteryPage() {
    if (!assetsState) return;
    const badge = document.getElementById('assets-lottery-cash');
    const list = document.getElementById('assets-lottery-list');
    if (badge) badge.textContent = assetsFmt(assetsState.cash);
    if (!list) return;
    list.innerHTML = ASSETS_LOTTERIES.map(lottery => {
        const recent = assetsState.lottery.history.find(item => item.lotteryId === lottery.id);
        return `
            <div class="assets-lottery-card">
                <div class="assets-lottery-tag">${assetsEsc(lottery.tag)}</div>
                <div class="assets-lottery-name">${assetsEsc(lottery.name)}</div>
                <div class="assets-lottery-desc">
                    ${assetsEsc(lottery.desc)}
                    ${recent ? ` 最近一次 ${assetsEsc(recent.resultText)}。` : ''}
                </div>
                <div class="assets-lottery-footer">
                    <div class="assets-lottery-price-tag">单注 <strong>${assetsFmt(lottery.price, 0)}</strong></div>
                    <button class="assets-lottery-buy-btn interactive" type="button" data-assets-lottery="${lottery.id}">进入</button>
                </div>
            </div>
        `;
    }).join('');
}

function assetsRenderLotteryDetail() {
    const panel = document.getElementById('assets-lottery-detail');
    const lottery = assetsGetLotteryById(assetsCurrentLotteryId);
    if (!panel || !lottery || !assetsState) return;
    if (!assetsLotterySelection) assetsLotterySelection = assetsBuildLotteryPick(lottery);
    const recent = assetsLotteryDrawResult || assetsState.lottery.history.find(item => item.lotteryId === lottery.id) || null;
    const balls = Array.isArray(assetsLotterySelection?.balls) ? assetsLotterySelection.balls : [];
    panel.innerHTML = `
        <div class="assets-lot-modal-tag">${assetsEsc(lottery.tag)}</div>
        <div class="assets-lot-modal-name">${assetsEsc(lottery.name)}</div>
        <div class="assets-lot-modal-desc">${assetsEsc(lottery.desc)}</div>
        <div class="assets-lot-pick-label">${assetsEsc(assetsLotterySelection?.title || '本次选号')}</div>
        <div class="assets-lot-result-box">
            <div class="assets-lot-result-lbl">你的号码</div>
            <div class="assets-lot-result-balls">
                ${balls.map(item => {
                    const data = typeof item === 'string' ? { value: item, blue: false } : item;
                    return `<span class="assets-lot-result-ball${data.blue ? ' blue' : ''}">${assetsEsc(data.value)}</span>`;
                }).join('')}
            </div>
        </div>
        ${recent ? `
            <div class="assets-lot-win-banner">
                ${assetsEsc(recent.resultText)}${recent.payout ? ` · 到账 ${assetsFmt(recent.payout)}` : ''}
            </div>
        ` : ''}
        <div class="assets-detail-holding">
            单次投入 <strong>${assetsFmt(lottery.price, 0)}</strong>
            · 当前奖池 <strong>${assetsFmtCompact(lottery.jackpot)}</strong>
        </div>
        <div class="assets-lot-action-row">
            <button class="assets-lot-action-btn interactive" type="button" data-assets-lottery-refresh>换一注</button>
            <button class="assets-lot-action-btn primary interactive" type="button" data-assets-lottery-draw>抽一次</button>
        </div>
    `;
}

function assetsOpenLotteryModal(lotteryId) {
    const lottery = assetsGetLotteryById(lotteryId);
    const overlay = document.getElementById('assets-lottery-modal');
    if (!lottery || !overlay) return;
    assetsCurrentLotteryId = lottery.id;
    assetsLotterySelection = assetsBuildLotteryPick(lottery);
    assetsLotteryDrawResult = null;
    assetsRenderLotteryDetail();
    overlay.hidden = false;
}

function assetsRefreshLotteryPick() {
    const lottery = assetsGetLotteryById(assetsCurrentLotteryId);
    if (!lottery) return;
    assetsLotterySelection = assetsBuildLotteryPick(lottery);
    assetsLotteryDrawResult = null;
    assetsRenderLotteryDetail();
}

function assetsCommitLotteryDraw() {
    const lottery = assetsGetLotteryById(assetsCurrentLotteryId);
    if (!lottery || !assetsState) return;
    if (assetsState.cash < lottery.price) {
        assetsShowToast('零钱不足，暂时抽不了这一注。');
        return;
    }
    if (!assetsLotterySelection) assetsLotterySelection = assetsBuildLotteryPick(lottery);
    const record = assetsRollLottery(lottery, assetsLotterySelection);
    assetsState.cash = assetsRoundMoney(assetsState.cash - lottery.price + record.payout);
    assetsState.lottery.totalSpent = assetsRoundMoney(assetsState.lottery.totalSpent + lottery.price);
    assetsState.lottery.totalWon = assetsRoundMoney(assetsState.lottery.totalWon + record.payout);
    assetsState.lottery.history.unshift(record);
    assetsState.lottery.history = assetsState.lottery.history.slice(0, 16);
    assetsLotteryDrawResult = record;
    assetsAddBill({
        title: `彩票支出 · ${lottery.name}`,
        note: record.ticketText || '已提交本次号码',
        amount: -lottery.price,
        icon: 'lottery',
        createdAt: record.createdAt
    });
    if (record.payout > 0) {
        assetsAddBill({
            title: `彩票到账 · ${lottery.name}`,
            note: record.resultText,
            amount: record.payout,
            icon: 'deposit',
            createdAt: record.createdAt + 1
        });
    }
    writeAssetsState();
    assetsRefreshVisibleState(false);
    assetsShowToast(record.payout ? `恭喜到账 ${assetsFmt(record.payout)}。` : '这次没中，下次好运会更近。');
}

function assetsHandleLotteryDraw() {
    const lottery = assetsGetLotteryById(assetsCurrentLotteryId);
    if (!lottery || !assetsState) return;
    if (assetsState.cash < lottery.price) {
        assetsShowToast('零钱不足，暂时抽不了这一注。');
        return;
    }
    assetsRequireOutflowPasscode(`购买 ${lottery.name}`, () => {
        assetsCommitLotteryDraw();
    });
}

function assetsGetWalletToolMeta(index) {
    const cards = Array.isArray(assetsState?.cards) ? assetsState.cards : [];
    const passcodeSet = assetsState?.payment?.passcode?.length === ASSETS_PASSCODE_LENGTH;
    const familyCard = assetsGetFamilyCard();
    const noPasswordEnabled = Boolean(assetsState?.payment?.noPasswordEnabled);
    if (index === 0) {
        return {
            active: cards.length > 0,
            badge: cards.length ? `${cards.length} 张已绑` : '去添加',
            desc: cards.length ? '查看和管理银行卡' : '添加第一张银行卡'
        };
    }
    if (index === 1) {
        return {
            active: familyCard.enabled,
            badge: familyCard.enabled ? '1 张在用' : '未开通',
            desc: familyCard.enabled ? '查看亲属卡额度与代付状态' : '给家里人留一张代付卡'
        };
    }
    if (index === 2) {
        return {
            active: passcodeSet,
            badge: passcodeSet ? '已设置' : '未设置',
            desc: passcodeSet ? '修改当前 6 位数字密码' : '先设置 6 位数字密码'
        };
    }
    return {
        active: noPasswordEnabled,
        badge: noPasswordEnabled ? '已开启' : '已关闭',
        desc: noPasswordEnabled ? '资金动作直接通过，不再弹验证' : '关闭时按支付密码验证'
    };
}

function assetsGetWalletPanelToolMeta(kind) {
    const cards = Array.isArray(assetsState?.cards) ? assetsState.cards : [];
    const passcodeSet = assetsState?.payment?.passcode?.length === ASSETS_PASSCODE_LENGTH;
    const familyCard = assetsGetFamilyCard();
    const noPasswordEnabled = Boolean(assetsState?.payment?.noPasswordEnabled);
    if (kind === 'cards') {
        return {
            active: cards.length > 0,
            badge: cards.length ? `${cards.length} 张已绑` : '去添加',
            desc: cards.length ? '进入银行卡页面管理卡片' : '先添加第一张银行卡'
        };
    }
    if (kind === 'family') {
        return {
            active: familyCard.enabled,
            badge: familyCard.enabled ? '1 张在用' : '未开通',
            desc: familyCard.enabled ? '查看亲属卡额度与代付状态' : '给家里人留一张代付卡'
        };
    }
    if (kind === 'passcode') {
        return {
            active: passcodeSet,
            badge: passcodeSet ? '已设置' : '未设置',
            desc: passcodeSet ? '修改当前 6 位数字密码' : '先设置 6 位数字密码'
        };
    }
    return {
        active: noPasswordEnabled,
        badge: noPasswordEnabled ? '已开启' : '已关闭',
        desc: noPasswordEnabled ? '资金动作直接通过，不再弹验证' : '关闭时按支付密码验证'
    };
}

function assetsGetWalletBillEntryMeta() {
    const bills = Array.isArray(assetsState?.bills) ? assetsState.bills : [];
    const latest = bills[0] || null;
    return {
        count: bills.length,
        title: latest ? latest.title : '账单入口',
        note: latest
            ? `${assetsGetBillTimeText(latest.createdAt)} · ${latest.note || '查看全部资金变动'}`
            : '股票、彩票、充值、提现等资金流转都会自动记在这里',
        badge: bills.length ? `共 ${Math.min(bills.length, 99)} 条` : '暂无记录',
        amount: latest ? assetsFmtSignedMoney(latest.amount) : '去查看'
    };
}

function assetsRenderWalletCards() {
    const wrap = document.getElementById('assets-bankcards-wrap');
    if (!wrap || !assetsState) return;
    const cards = Array.isArray(assetsState.cards) ? assetsState.cards : [];
    if (!cards.length) {
        wrap.innerHTML = '<div class="assets-bankcards-empty">这里先留空。点右上角的 + 绑定银行卡，后面充值、提现和账单都会跟着这张卡走。</div>';
        return;
    }
    wrap.innerHTML = `
        <div class="assets-bankcards-scroll">
            ${cards.map(card => assetsRenderBankCard(card)).join('')}
        </div>
    `;
}

function assetsRenderWalletBills() {
    const list = document.getElementById('assets-bill-list');
    if (!list || !assetsState) return;
    const bills = Array.isArray(assetsState.bills) ? assetsState.bills.slice(0, 4) : [];
    list.innerHTML = assetsRenderBillListHtml(bills);
}

function assetsRenderWalletPage() {
    if (!assetsState) return;
    const hero = document.getElementById('assets-balance-hero');
    const breakdown = document.getElementById('assets-breakdown-list');
    const paymentRow = document.getElementById('assets-payment-row');
    if (!hero || !breakdown || !paymentRow) return;

    const stockValue = assetsGetTotalStockValue();
    const cardValue = assetsGetTotalCardBalance();
    const lotteryNet = assetsRoundMoney(assetsState.lottery.totalWon - assetsState.lottery.totalSpent);
    hero.innerHTML = `
        <div class="assets-balance-label">Total Assets</div>
        <div class="assets-balance-amount"><strong>${assetsFmt(assetsGetTotalAssets())}</strong></div>
        <div class="assets-balance-sub">
            零钱 ${assetsFmt(assetsState.cash)} · 银行卡 ${assetsFmt(cardValue)} · 持仓 ${assetsFmt(stockValue)} · 出账统一验证密码
        </div>
        <div class="assets-balance-chip-row">
            <div class="assets-balance-chip">
                <span>零钱余额</span>
                <strong>${assetsFmt(assetsState.cash)}</strong>
            </div>
            <div class="assets-balance-chip">
                <span>银行卡资产</span>
                <strong>${assetsFmt(cardValue)}</strong>
            </div>
            <div class="assets-balance-chip">
                <span>股票市值</span>
                <strong>${assetsFmt(stockValue)}</strong>
            </div>
        </div>
        <div class="assets-balance-actions">
            <button class="assets-balance-action primary interactive" type="button" data-assets-wallet-action="deposit">充值</button>
            <button class="assets-balance-action ghost interactive" type="button" data-assets-wallet-action="withdraw">提现</button>
            <button class="assets-balance-action ghost interactive" type="button" data-assets-wallet-action="bills">账单</button>
        </div>
    `;

    const metrics = [
        { name: '零钱余额', desc: '当前可直接用于出账的资金', amount: assetsFmt(assetsState.cash) },
        { name: '银行卡总额', desc: '已绑定银行卡中的可用余额', amount: assetsFmt(cardValue) },
        { name: '今日工资', desc: '当天完成下班打卡后的入账金额', amount: assetsFmt(assetsGetTodayIncome()) },
        { name: '彩票净值', desc: '累计中奖减去累计投入后的结果', amount: assetsFmtSignedMoney(lotteryNet) }
    ];
    breakdown.innerHTML = metrics.map(item => `
        <div class="assets-breakdown-item">
            <div>
                <div class="assets-bd-name">${assetsEsc(item.name)}</div>
                <div class="assets-bd-desc">${assetsEsc(item.desc)}</div>
            </div>
            <div class="assets-bd-amount">${assetsEsc(item.amount)}</div>
        </div>
    `).join('');

    paymentRow.innerHTML = ASSETS_PAYMENT_TOOLS.map((tool, index) => {
        const meta = assetsGetWalletToolMeta(index);
        return `
            <button class="assets-payment-tool interactive${meta.active ? ' is-active' : ''}" type="button" data-assets-pay-index="${index}">
                <div class="assets-payment-icon">
                    <svg viewBox="0 0 24 24" aria-hidden="true">${tool.icon}</svg>
                </div>
                <div class="assets-payment-copy">
                    <span class="assets-payment-name">${assetsEsc(tool.name)}</span>
                </div>
            </button>
        `;
    }).join('');

    assetsRenderWalletCards();
    assetsRenderWalletBills();
}

function assetsUpdateHeaderTotal() {
    const total = document.getElementById('assets-header-total');
    if (total && assetsState) total.textContent = assetsFmt(assetsGetTotalAssets());
    const badge = document.getElementById('assets-lottery-cash');
    if (badge && assetsState) badge.textContent = assetsFmt(assetsState.cash);
}

function assetsTickPrices() {
    if (!assetsState) return;
    ASSETS_COMPANIES.forEach(company => {
        const current = Number(assetsState.prices[company.id] || company.base);
        const drift = (Math.random() - 0.48) * company.vol * current;
        const next = assetsRoundMoney(assetsClamp(current + drift, company.base * 0.65, company.base * 1.48));
        assetsState.prices[company.id] = next;
        const history = Array.isArray(assetsState.history[company.id]) ? assetsState.history[company.id].slice(-35) : [];
        history.push(next);
        assetsState.history[company.id] = history;
    });
    assetsRefreshVisibleState(false);
}

function assetsTickClock() {
    const punchClock = document.getElementById('assets-punch-clock');
    const stockClock = document.getElementById('assets-stock-clock');
    const now = assetsGetNow();
    if (punchClock) punchClock.textContent = now.time;
    if (stockClock) stockClock.textContent = now.shortTime;
}

function assetsRefreshVisibleState(shouldPersist = true) {
    if (!assetsState) return;
    assetsUpdateHeaderTotal();
    if (assetsActiveTab === 'finance') assetsRenderFinancePage();
    if (assetsActiveTab === 'work') assetsRenderWorkPage();
    if (assetsActiveTab === 'lottery') assetsRenderLotteryPage();
    if (assetsActiveTab === 'wallet') assetsRenderWalletPage();
    const stockModal = document.getElementById('assets-stock-modal');
    if (stockModal && !stockModal.hidden && assetsCurrentStockId) assetsRenderStockDetail();
    const lotteryModal = document.getElementById('assets-lottery-modal');
    if (lotteryModal && !lotteryModal.hidden && assetsCurrentLotteryId) assetsRenderLotteryDetail();
    if (assetsUtilitySheetState && assetsUtilitySheetState.type !== 'card-form' && assetsUtilitySheetState.type !== 'transfer') {
        assetsRenderUtilitySheet();
    }
    if (assetsPaymentSheetState) assetsRenderPaymentSheet();
    if (shouldPersist) writeAssetsState();
}

function assetsSetTab(tab) {
    const next = ['finance', 'work', 'lottery', 'wallet'].includes(tab) ? tab : 'finance';
    assetsActiveTab = next;
    document.querySelectorAll('.assets-tab').forEach(button => {
        const active = button.getAttribute('data-assets-tab') === next;
        button.classList.toggle('active', active);
        button.setAttribute('aria-selected', String(active));
    });
    document.querySelectorAll('.assets-page').forEach(page => {
        const active = page.getAttribute('data-assets-page') === next;
        page.classList.toggle('active', active);
        page.hidden = !active;
        if (active) page.scrollTop = 0;
    });
    if (next === 'finance') assetsRenderFinancePage();
    if (next === 'work') assetsRenderWorkPage();
    if (next === 'lottery') assetsRenderLotteryPage();
    if (next === 'wallet') assetsRenderWalletPage();
}

function assetsGetUtilityOverlay() {
    return document.getElementById('assets-utility-sheet');
}

function assetsGetUtilityBody() {
    return document.getElementById('assets-utility-sheet-body');
}

function assetsEnsureOverlays() {
    const app = document.getElementById('assets-app');
    if (!app) return;

    if (!document.getElementById('assets-payment-sheet')) {
        const overlay = document.createElement('div');
        overlay.className = 'assets-payment-overlay';
        overlay.id = 'assets-payment-sheet';
        overlay.hidden = true;
        overlay.innerHTML = '<div class="assets-payment-panel" id="assets-payment-sheet-body"></div>';
        app.appendChild(overlay);
        overlay.addEventListener('pointerdown', event => event.stopPropagation());
        overlay.addEventListener('touchstart', event => event.stopPropagation(), { passive: true });
        overlay.addEventListener('touchmove', event => event.stopPropagation(), { passive: false });
        overlay.addEventListener('mousedown', event => event.stopPropagation());
        overlay.addEventListener('click', event => {
            const target = event.target instanceof Element ? event.target : null;
            if (!target) return;
            const close = target.closest('[data-assets-payment-close]');
            const digit = target.closest('[data-assets-payment-key]');
            const remove = target.closest('[data-assets-payment-delete]');
            if (close) {
                event.preventDefault();
                event.stopPropagation();
                assetsClosePaymentSheet();
                return;
            }
            if (digit) {
                event.preventDefault();
                event.stopPropagation();
                assetsHandlePaymentDigit(digit.getAttribute('data-assets-payment-key'));
                return;
            }
            if (remove) {
                event.preventDefault();
                event.stopPropagation();
                assetsHandlePaymentDelete();
                return;
            }
            if (event.target === event.currentTarget) {
                event.preventDefault();
                event.stopPropagation();
                assetsClosePaymentSheet();
            }
        });
    }

    if (!document.getElementById('assets-utility-sheet')) {
        const overlay = document.createElement('div');
        overlay.className = 'assets-utility-overlay';
        overlay.id = 'assets-utility-sheet';
        overlay.hidden = true;
        overlay.innerHTML = '<div class="assets-utility-panel" id="assets-utility-sheet-body"></div>';
        app.appendChild(overlay);
        overlay.addEventListener('pointerdown', event => event.stopPropagation());
        overlay.addEventListener('touchstart', event => event.stopPropagation(), { passive: true });
        overlay.addEventListener('touchmove', event => event.stopPropagation(), { passive: false });
        overlay.addEventListener('mousedown', event => event.stopPropagation());
        overlay.addEventListener('click', assetsHandleUtilitySheetClick);
        overlay.addEventListener('submit', assetsHandleUtilitySheetSubmit);
    }
}

function assetsOpenUtilitySheet(state) {
    assetsEnsureOverlays();
    assetsUtilitySheetState = state;
    const overlay = assetsGetUtilityOverlay();
    if (overlay) overlay.hidden = false;
    assetsRenderUtilitySheet();
}

function assetsCloseUtilitySheet() {
    const overlay = assetsGetUtilityOverlay();
    if (overlay) overlay.hidden = true;
    assetsUtilitySheetState = null;
}

function assetsOpenCardsSheet() {
    assetsOpenUtilitySheet({ type: 'cards' });
}

function assetsOpenBillsSheet() {
    assetsOpenUtilitySheet({ type: 'bills' });
}

function assetsOpenFamilySheet() {
    assetsOpenUtilitySheet({ type: 'family' });
}

function assetsOpenSecuritySheet() {
    assetsOpenUtilitySheet({ type: 'no-password' });
}

function assetsOpenNoPasswordSheet() {
    assetsOpenUtilitySheet({ type: 'no-password' });
}

function assetsOpenTransferSheet(type) {
    assetsOpenUtilitySheet({ type: 'transfer', mode: type === 'withdraw' ? 'withdraw' : 'deposit' });
}

function assetsOpenCardDetailSheet(cardId) {
    if (!assetsGetCardById(cardId)) return;
    assetsOpenUtilitySheet({ type: 'card-detail', cardId: String(cardId) });
}

function assetsOpenCardFormSheet(mode, cardId = '') {
    assetsOpenUtilitySheet({
        type: 'card-form',
        mode: mode === 'edit' ? 'edit' : 'create',
        cardId: String(cardId || '')
    });
}

function assetsRenderCardsSheet() {
    const cards = Array.isArray(assetsState?.cards) ? assetsState.cards : [];
    return `
        <div class="assets-utility-sheet">
            <button class="assets-utility-close interactive" type="button" data-assets-utility-close>
                <div class="assets-utility-kicker">CARD WALLET</div>
                <h2 class="assets-utility-title">银行卡</h2>
            </button>
            <p class="assets-utility-note">卡面参考银行卡样式来做，管理入口就放在这里。新增、编辑、删除都会先验证银行卡密码。</p>
            <div class="assets-utility-card-list">
                ${cards.length
                    ? cards.map(card => `
                        <button class="assets-utility-card-button interactive" type="button" data-assets-sheet-card="${assetsEsc(card.id)}">
                            <div class="assets-utility-card-meta">
                                <div class="assets-utility-card-copy">
                                    <strong>${assetsEsc(card.bank)} · ${assetsEsc(card.type)}</strong>
                                    <span>尾号 ${assetsEsc(card.last4)} · 持卡人 ${assetsEsc(card.holder)}</span>
                                </div>
                                <b>${assetsFmt(card.balance)}</b>
                            </div>
                        </button>
                    `).join('')
                    : '<div class="assets-bill-empty">还没有绑定银行卡。点下面按钮先加一张卡，再去做充值、提现和账单联动。</div>'}
            </div>
            <div class="assets-utility-actions">
                <button class="assets-utility-button interactive" type="button" data-assets-utility-close>关闭</button>
                <button class="assets-utility-button primary interactive" type="button" data-assets-sheet-add-card>新增银行卡</button>
            </div>
        </div>
    `;
}

function assetsRenderBillsSheet() {
    const bills = Array.isArray(assetsState?.bills) ? assetsState.bills : [];
    return `
        <div class="assets-utility-sheet">
            <button class="assets-utility-close interactive" type="button" data-assets-utility-close>
                <div class="assets-utility-kicker">BILLS</div>
                <h2 class="assets-utility-title">全部账单</h2>
            </button>
            <p class="assets-utility-note">股票买入、彩票支出、充值提现，以及后面继续接入的红包转账出账，都会走同一套账单记录。</p>
            <div class="assets-utility-stack">
                <div class="assets-bill-list">${assetsRenderBillListHtml(bills)}</div>
            </div>
        </div>
    `;
}

function assetsRenderFamilySheet() {
    const familyCard = assetsGetFamilyCard();
    const restLimit = Math.max(0, assetsRoundMoney(familyCard.monthlyLimit - familyCard.monthlySpent));
    return `
        <div class="assets-utility-sheet">
            <button class="assets-utility-close interactive" type="button" data-assets-utility-close>
                <div class="assets-utility-kicker">FAMILY CARD</div>
                <h2 class="assets-utility-title">亲属卡</h2>
            </button>
            <p class="assets-utility-note">${familyCard.enabled ? '给家里人单独留一张代付卡，消费记录还是会继续记进资管账单。' : '亲属卡已暂停，需要时可以随时恢复。'}</p>
            <div class="assets-setting-card">
                <div class="assets-setting-card-head">
                    <div class="assets-setting-card-copy">
                        <strong>${assetsEsc(familyCard.holder)}</strong>
                        <span>${assetsEsc(familyCard.relation)}</span>
                    </div>
                    <span class="assets-setting-pill${familyCard.enabled ? ' is-on' : ''}">${familyCard.enabled ? '使用中' : '已暂停'}</span>
                </div>
                <div class="assets-setting-grid">
                    <div class="assets-setting-metric">
                        <span>月度额度</span>
                        <strong>${assetsFmt(familyCard.monthlyLimit, 0)}</strong>
                    </div>
                    <div class="assets-setting-metric">
                        <span>本月已用</span>
                        <strong>${assetsFmt(familyCard.monthlySpent)}</strong>
                    </div>
                    <div class="assets-setting-metric">
                        <span>剩余额度</span>
                        <strong>${assetsFmt(restLimit)}</strong>
                    </div>
                    <div class="assets-setting-metric">
                        <span>扣款方式</span>
                        <strong>资管零钱</strong>
                    </div>
                </div>
            </div>
            <div class="assets-utility-actions">
                <button class="assets-utility-button interactive" type="button" data-assets-utility-close>关闭</button>
                <button class="assets-utility-button primary interactive" type="button" data-assets-family-toggle>${familyCard.enabled ? '暂停亲属卡' : '恢复亲属卡'}</button>
            </div>
        </div>
    `;
}

function assetsRenderNoPasswordSheet() {
    const passcodeSet = assetsState?.payment?.passcode?.length === ASSETS_PASSCODE_LENGTH;
    const noPasswordEnabled = Boolean(assetsState?.payment?.noPasswordEnabled);
    return `
        <div class="assets-utility-sheet">
            <button class="assets-utility-close interactive" type="button" data-assets-utility-close>
                <div class="assets-utility-kicker">NO PASSWORD</div>
                <h2 class="assets-utility-title">免密支付</h2>
            </button>
            <p class="assets-utility-note">${noPasswordEnabled ? '买股票、买彩票、转入零钱和转回银行卡都会直接通过，不再单独弹验证。' : '关闭免密后，资金动作会按照支付密码处理。'}</p>
            <div class="assets-setting-card">
                <div class="assets-setting-card-head">
                    <div class="assets-setting-card-copy">
                        <strong>${noPasswordEnabled ? '当前已开启免密' : '当前按密码处理'}</strong>
                        <span>${passcodeSet ? '支付密码已设置，可随时切换回验证模式。' : '还没有支付密码，关闭免密后会在第一次资金动作时引导设置。'}</span>
                    </div>
                    <span class="assets-setting-pill${noPasswordEnabled ? ' is-on' : ''}">${noPasswordEnabled ? 'ON' : 'OFF'}</span>
                </div>
                <div class="assets-setting-grid assets-setting-grid--two">
                    <div class="assets-setting-metric">
                        <span>出账方式</span>
                        <strong>${noPasswordEnabled ? '直接通过' : '密码验证'}</strong>
                    </div>
                    <div class="assets-setting-metric">
                        <span>支付密码</span>
                        <strong>${passcodeSet ? '已设置' : '未设置'}</strong>
                    </div>
                </div>
            </div>
            <div class="assets-utility-actions">
                <button class="assets-utility-button interactive" type="button" data-assets-utility-close>关闭</button>
                <button class="assets-utility-button primary interactive" type="button" data-assets-no-password-toggle>${noPasswordEnabled ? '关闭免密支付' : '开启免密支付'}</button>
            </div>
        </div>
    `;
}

function assetsRenderSecuritySheet() {
    return assetsRenderNoPasswordSheet();
}

function assetsRenderCardDetailSheet(card) {
    return `
        <div class="assets-utility-sheet">
            <button class="assets-utility-close interactive" type="button" data-assets-utility-close>
                <div class="assets-utility-kicker">CARD DETAIL</div>
                <h2 class="assets-utility-title">${assetsEsc(card.bank)}</h2>
            </button>
            <p class="assets-utility-note">这里可以继续调整卡片信息，充值和提现时会直接读取这张卡的余额。</p>
            <div class="assets-utility-stack">
                ${assetsRenderBankCard(card, 'assets-bank-card--sheet')}
                <div class="assets-utility-card-button">
                    <div class="assets-utility-card-copy">
                        <strong>${assetsEsc(card.bank)} · ${assetsEsc(card.type)}</strong>
                        <span>尾号 ${assetsEsc(card.last4)} · 持卡人 ${assetsEsc(card.holder)}</span>
                    </div>
                </div>
            </div>
            <div class="assets-utility-actions">
                <button class="assets-utility-button danger interactive" type="button" data-assets-sheet-delete-card="${assetsEsc(card.id)}">删除银行卡</button>
                <button class="assets-utility-button primary interactive" type="button" data-assets-sheet-edit-card="${assetsEsc(card.id)}">编辑信息</button>
            </div>
        </div>
    `;
}

function assetsRenderCardFormSheet(mode, card) {
    const isEdit = mode === 'edit';
    return `
        <div class="assets-utility-sheet">
            <button class="assets-utility-close interactive" type="button" data-assets-utility-close>
                <div class="assets-utility-kicker">${isEdit ? 'EDIT CARD' : 'ADD CARD'}</div>
                <h2 class="assets-utility-title">${isEdit ? '编辑银行卡' : '新增银行卡'}</h2>
            </button>
            <p class="assets-utility-note">输入卡的名称、类型、尾号、余额和持卡人。保存后会直接写入资管资产和账单逻辑里。</p>
            <form class="assets-utility-form" id="assets-card-form" data-card-mode="${isEdit ? 'edit' : 'create'}" data-card-id="${assetsEsc(card?.id || '')}">
                <label class="assets-utility-field">
                    <span>银行卡名称</span>
                    <input name="bank" type="text" maxlength="16" autocomplete="off" value="${assetsEsc(card?.bank || '')}" placeholder="例如 招商银行">
                </label>
                <div class="assets-utility-grid">
                    <label class="assets-utility-field">
                        <span>卡类型</span>
                        <input name="type" type="text" maxlength="18" autocomplete="off" value="${assetsEsc(card?.type || '')}" placeholder="例如 Platinum">
                    </label>
                    <label class="assets-utility-field">
                        <span>尾号</span>
                        <input name="last4" type="text" inputmode="numeric" maxlength="4" autocomplete="off" value="${assetsEsc(card?.last4 || '')}" placeholder="4 位尾号">
                    </label>
                </div>
                <div class="assets-utility-grid">
                    <label class="assets-utility-field">
                        <span>余额</span>
                        <input name="balance" type="number" inputmode="decimal" step="0.01" min="0" autocomplete="off" value="${assetsEsc(card?.balance ?? '')}" placeholder="0.00">
                    </label>
                    <label class="assets-utility-field">
                        <span>持卡人</span>
                        <input name="holder" type="text" maxlength="18" autocomplete="off" value="${assetsEsc(card?.holder || '')}" placeholder="例如 RINNO USER">
                    </label>
                </div>
                <div class="assets-utility-actions">
                    <button class="assets-utility-button interactive" type="button" data-assets-utility-close>取消</button>
                    <button class="assets-utility-button primary interactive" type="submit">${isEdit ? '保存修改' : '添加银行卡'}</button>
                </div>
            </form>
        </div>
    `;
}

function assetsRenderTransferSheet(mode) {
    const cards = Array.isArray(assetsState?.cards) ? assetsState.cards : [];
    const isWithdraw = mode === 'withdraw';
    const noPasswordEnabled = Boolean(assetsState?.payment?.noPasswordEnabled);
    return `
        <div class="assets-utility-sheet">
            <button class="assets-utility-close interactive" type="button" data-assets-utility-close>
                <div class="assets-utility-kicker">${isWithdraw ? 'CASH OUT' : 'CASH IN'}</div>
                <h2 class="assets-utility-title">${isWithdraw ? '转回银行卡' : '转入零钱'}</h2>
            </button>
            <p class="assets-utility-note">
                ${isWithdraw ? '把资管零钱转回你选中的银行卡。' : '从已绑定银行卡转一笔钱进资管零钱。'}
                ${noPasswordEnabled ? '当前已开启免密，这一步不会再弹验证。' : '确认后会按你的支付设置处理。'}
            </p>
            <form class="assets-utility-form" id="assets-transfer-form" data-transfer-mode="${assetsEsc(mode)}">
                <label class="assets-utility-field">
                    <span>金额</span>
                    <input name="amount" type="number" inputmode="decimal" step="0.01" min="0" autocomplete="off" placeholder="请输入金额">
                </label>
                <div class="assets-utility-choice-list">
                    ${cards.length
                        ? cards.map((card, index) => `
                            <div class="assets-utility-choice">
                                <label>
                                    <input type="radio" name="cardId" value="${assetsEsc(card.id)}" ${index === 0 ? 'checked' : ''}>
                                    <div>
                                        <strong>${assetsEsc(card.bank)} · ${assetsEsc(card.type)}</strong>
                                        <span>尾号 ${assetsEsc(card.last4)} · 余额 ${assetsFmt(card.balance)}</span>
                                    </div>
                                </label>
                            </div>
                        `).join('')
                        : '<div class="assets-bill-empty">还没有银行卡，先去添加银行卡再做充值或提现。</div>'}
                </div>
                <div class="assets-utility-actions">
                    <button class="assets-utility-button interactive" type="button" data-assets-utility-close>取消</button>
                    <button class="assets-utility-button primary interactive" type="submit">${isWithdraw ? '确认转回' : '确认转入'}</button>
                </div>
            </form>
        </div>
    `;
}

function assetsRenderUtilitySheet() {
    const body = assetsGetUtilityBody();
    if (!body || !assetsUtilitySheetState || !assetsState) return;
    const state = assetsUtilitySheetState;
    if (state.type === 'cards') {
        body.innerHTML = assetsRenderCardsSheet();
        return;
    }
    if (state.type === 'bills') {
        body.innerHTML = assetsRenderBillsSheet();
        return;
    }
    if (state.type === 'family') {
        body.innerHTML = assetsRenderFamilySheet();
        return;
    }
    if (state.type === 'security' || state.type === 'no-password') {
        body.innerHTML = assetsRenderNoPasswordSheet();
        return;
    }
    if (state.type === 'card-detail') {
        const card = assetsGetCardById(state.cardId);
        body.innerHTML = card
            ? assetsRenderCardDetailSheet(card)
            : '<div class="assets-utility-sheet"><p class="assets-utility-note">这张卡已经不存在了。</p></div>';
        return;
    }
    if (state.type === 'card-form') {
        const card = state.mode === 'edit' ? assetsGetCardById(state.cardId) : null;
        body.innerHTML = assetsRenderCardFormSheet(state.mode, card);
        return;
    }
    if (state.type === 'transfer') {
        body.innerHTML = assetsRenderTransferSheet(state.mode);
        return;
    }
}

function assetsDeleteCard(cardId) {
    if (!assetsState) return;
    const card = assetsGetCardById(cardId);
    if (!card) return;
    assetsState.cards = assetsState.cards.filter(item => item.id !== card.id);
    writeAssetsState();
    assetsRefreshVisibleState(false);
    assetsCloseUtilitySheet();
    assetsShowToast(`已删除 ${card.bank} 尾号 ${card.last4}。`);
}

function assetsToggleFamilyCard() {
    if (!assetsState) return;
    assetsState.familyCard = assetsNormalizeFamilyCard({
        ...assetsGetFamilyCard(),
        enabled: !assetsGetFamilyCard().enabled
    });
    writeAssetsState();
    assetsRefreshVisibleState(false);
    assetsShowToast(assetsState.familyCard.enabled ? '已恢复亲属卡。' : '已暂停亲属卡。');
}

function assetsToggleNoPassword() {
    if (!assetsState) return;
    assetsState.payment.noPasswordEnabled = !assetsState.payment.noPasswordEnabled;
    writeAssetsState();
    assetsRefreshVisibleState(false);
    assetsShowToast(assetsState.payment.noPasswordEnabled ? '免密支付已开启。' : '免密支付已关闭。');
}

function assetsHandleCardFormSubmit(form) {
    if (!assetsState || !(form instanceof HTMLFormElement)) return;
    const bank = String(form.elements.bank?.value || '').trim();
    const type = String(form.elements.type?.value || '').trim();
    const last4 = assetsNormalizeCardLast4(form.elements.last4?.value);
    const holder = String(form.elements.holder?.value || '').trim();
    const balance = assetsRoundMoney(Math.max(0, Number(form.elements.balance?.value || 0)));
    if (!bank || !type || !holder || last4.length !== 4) {
        assetsShowToast('请把银行卡名称、类型、尾号和持卡人补完整。');
        return;
    }
    if (!Number.isFinite(balance)) {
        assetsShowToast('银行卡余额格式不对。');
        return;
    }
    const style = assetsPickBankCardStyle(type, bank);
    const mode = form.getAttribute('data-card-mode') === 'edit' ? 'edit' : 'create';
    const cardId = String(form.getAttribute('data-card-id') || '');
    if (mode === 'edit') {
        const card = assetsGetCardById(cardId);
        if (!card) {
            assetsShowToast('这张卡已经不存在了。');
            assetsCloseUtilitySheet();
            return;
        }
        card.bank = bank;
        card.type = type;
        card.last4 = last4;
        card.holder = holder;
        card.balance = balance;
        card.style = style;
        assetsShowToast(`已更新 ${bank} 尾号 ${last4}。`);
    } else {
        if (assetsState.cards.length >= ASSETS_CARD_LIMIT) {
            assetsShowToast(`最多保留 ${ASSETS_CARD_LIMIT} 张银行卡。`);
            return;
        }
        assetsState.cards.unshift({
            id: assetsMakeId('card'),
            bank,
            type,
            last4,
            balance,
            holder,
            style
        });
        assetsShowToast(`已添加 ${bank} 尾号 ${last4}。`);
    }
    writeAssetsState();
    assetsRefreshVisibleState(false);
    assetsCloseUtilitySheet();
}

function assetsHandleTransferFormSubmit(form) {
    if (!assetsState || !(form instanceof HTMLFormElement)) return;
    const mode = form.getAttribute('data-transfer-mode') === 'withdraw' ? 'withdraw' : 'deposit';
    const amount = assetsRoundMoney(Number(form.elements.amount?.value || 0));
    const cardId = String(form.elements.cardId?.value || '');
    const card = assetsGetCardById(cardId);
    if (!card) {
        assetsShowToast('先选一张银行卡。');
        return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
        assetsShowToast('请输入有效金额。');
        return;
    }
    if (mode === 'deposit' && card.balance < amount) {
        assetsShowToast('银行卡余额不足，无法完成充值。');
        return;
    }
    if (mode === 'withdraw' && assetsState.cash < amount) {
        assetsShowToast('零钱余额不足，暂时无法提现。');
        return;
    }
    assetsCloseUtilitySheet();
    assetsRequireOutflowPasscode(mode === 'withdraw' ? '转回银行卡' : '转入零钱', () => {
        if (!assetsState) return;
        if (mode === 'deposit') {
            card.balance = assetsRoundMoney(card.balance - amount);
            assetsState.cash = assetsRoundMoney(assetsState.cash + amount);
            assetsAddBill({
                title: '充值到零钱',
                note: `来自 ${card.bank} 尾号 ${card.last4}`,
                amount,
                icon: 'deposit'
            });
            assetsShowToast(`已从 ${card.bank} 转入 ${assetsFmt(amount)}。`);
        } else {
            card.balance = assetsRoundMoney(card.balance + amount);
            assetsState.cash = assetsRoundMoney(assetsState.cash - amount);
            assetsAddBill({
                title: '提现到银行卡',
                note: `转入 ${card.bank} 尾号 ${card.last4}`,
                amount: -amount,
                icon: 'withdraw'
            });
            assetsShowToast(`已提现 ${assetsFmt(amount)} 到 ${card.bank}。`);
        }
        writeAssetsState();
        assetsRefreshVisibleState(false);
    });
}

function assetsHandleUtilitySheetClick(event) {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    if (target === event.currentTarget) {
        event.preventDefault();
        assetsCloseUtilitySheet();
        return;
    }
    const close = target.closest('[data-assets-utility-close]');
    if (close) {
        event.preventDefault();
        assetsCloseUtilitySheet();
        return;
    }
    const cardButton = target.closest('[data-assets-sheet-card]');
    if (cardButton) {
        event.preventDefault();
        assetsOpenCardDetailSheet(cardButton.getAttribute('data-assets-sheet-card'));
        return;
    }
    const addCard = target.closest('[data-assets-sheet-add-card]');
    if (addCard) {
        event.preventDefault();
        assetsCloseUtilitySheet();
        assetsRequireCardPasscode('添加银行卡', () => {
            assetsOpenCardFormSheet('create');
        });
        return;
    }
    const familyToggle = target.closest('[data-assets-family-toggle]');
    if (familyToggle) {
        event.preventDefault();
        assetsToggleFamilyCard();
        return;
    }
    const noPasswordToggle = target.closest('[data-assets-no-password-toggle]');
    if (noPasswordToggle) {
        event.preventDefault();
        assetsToggleNoPassword();
        return;
    }
    const editCard = target.closest('[data-assets-sheet-edit-card]');
    if (editCard) {
        event.preventDefault();
        const cardId = editCard.getAttribute('data-assets-sheet-edit-card') || '';
        assetsCloseUtilitySheet();
        assetsRequireCardPasscode('编辑银行卡', () => {
            assetsOpenCardFormSheet('edit', cardId);
        });
        return;
    }
    const deleteCard = target.closest('[data-assets-sheet-delete-card]');
    if (deleteCard) {
        event.preventDefault();
        const cardId = deleteCard.getAttribute('data-assets-sheet-delete-card') || '';
        const card = assetsGetCardById(cardId);
        if (!card) {
            assetsShowToast('这张卡已经不存在了。');
            assetsCloseUtilitySheet();
            return;
        }
        assetsRequireCardPasscode('删除银行卡', () => {
            if (!window.confirm(`确认删除 ${card.bank} 尾号 ${card.last4} 吗？`)) return;
            assetsDeleteCard(cardId);
        });
        return;
    }
    const changePasscode = target.closest('[data-assets-sheet-change-passcode]');
    if (changePasscode) {
        event.preventDefault();
        assetsCloseUtilitySheet();
        if (assetsState?.payment?.passcode) {
            assetsOpenPaymentSheet({ flow: 'change', title: '修改支付密码' });
        } else {
            assetsOpenPaymentSheet({ flow: 'setup', title: '设置支付密码' });
        }
    }
}

function assetsHandleUtilitySheetSubmit(event) {
    if (!(event.target instanceof HTMLFormElement)) return;
    event.preventDefault();
    const form = event.target;
    if (form.id === 'assets-card-form') {
        assetsHandleCardFormSubmit(form);
        return;
    }
    if (form.id === 'assets-transfer-form') {
        assetsHandleTransferFormSubmit(form);
    }
}

function assetsGetDetailPageOverlay() {
    return document.getElementById('assets-detail-page');
}

function assetsGetDetailPageBody() {
    return document.getElementById('assets-detail-page-body');
}

function assetsEnsureDetailPage() {
    const stage = document.getElementById('assets-stage');
    if (!stage || document.getElementById('assets-detail-page')) return;
    const overlay = document.createElement('div');
    overlay.className = 'assets-detail-overlay';
    overlay.id = 'assets-detail-page';
    overlay.hidden = true;
    overlay.innerHTML = '<div class="assets-detail-page-shell" id="assets-detail-page-body"></div>';
    stage.appendChild(overlay);
    overlay.addEventListener('pointerdown', event => event.stopPropagation());
    overlay.addEventListener('touchstart', event => event.stopPropagation(), { passive: true });
    overlay.addEventListener('touchmove', event => event.stopPropagation(), { passive: false });
    overlay.addEventListener('mousedown', event => event.stopPropagation());
    overlay.addEventListener('click', event => {
        const target = event.target instanceof Element ? event.target : null;
        if (!target) return;
        const close = target.closest('[data-assets-detail-close]');
        if (!close) return;
        event.preventDefault();
        event.stopPropagation();
        assetsCloseDetailPage();
    });
}

function assetsOpenBankPage() {
    if (!assetsState) return;
    assetsEnsureDetailPage();
    assetsDetailPageState = { type: 'bank' };
    const overlay = assetsGetDetailPageOverlay();
    if (overlay) overlay.hidden = false;
    assetsRenderDetailPage();
}

function assetsCloseDetailPage() {
    const overlay = assetsGetDetailPageOverlay();
    if (overlay) overlay.hidden = true;
    assetsDetailPageState = null;
}

function assetsRenderBankPage() {
    const cards = Array.isArray(assetsState?.cards) ? assetsState.cards : [];
    const total = assetsGetTotalCardBalance();
    const leadCard = cards[0] || null;
    return `
        <div class="assets-detail-page assets-bank-page">
            <div class="assets-detail-page-head">
                <button class="assets-detail-back interactive" type="button" data-assets-detail-close aria-label="返回资产页">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18 9 12l6-6"/></svg>
                </button>
                <div class="assets-detail-page-copy">
                    <span class="assets-detail-page-kicker">BANKING</span>
                    <h2 class="assets-detail-page-title">银行卡</h2>
                    <p class="assets-detail-page-note">所有收付用到的银行卡都在这里管理。</p>
                </div>
                <button class="assets-detail-add interactive" type="button" data-assets-add-card aria-label="添加银行卡">+</button>
            </div>

            <div class="assets-bank-page-hero">
                <span class="assets-bank-page-kicker">Bank Cards</span>
                <strong class="assets-bank-page-total">${assetsFmt(total)}</strong>
                <p class="assets-bank-page-intro">
                    ${leadCard
                        ? `${assetsEsc(leadCard.bank)} 尾号 ${assetsEsc(leadCard.last4)} 会作为常用收付卡，其他卡也能在转入零钱和转回银行卡时切换。`
                        : '先添加银行卡，再去做转入零钱和转回银行卡。'}
                </p>
                <div class="assets-bank-page-metrics">
                    <div class="assets-bank-page-metric">
                        <span>已绑定</span>
                        <strong>${cards.length} 张</strong>
                    </div>
                    <div class="assets-bank-page-metric">
                        <span>常用卡</span>
                        <strong>${leadCard ? `尾号 ${assetsEsc(leadCard.last4)}` : '--'}</strong>
                    </div>
                    <div class="assets-bank-page-metric">
                        <span>收付切换</span>
                        <strong>按需选择</strong>
                    </div>
                </div>
                <div class="assets-bank-page-actions">
                    <button class="assets-bank-page-action primary interactive" type="button" data-assets-add-card>新增银行卡</button>
                    <button class="assets-bank-page-action interactive" type="button" data-assets-wallet-action="deposit">转入零钱</button>
                    <button class="assets-bank-page-action interactive" type="button" data-assets-wallet-action="withdraw">转回银行卡</button>
                </div>
            </div>

            <div class="assets-bank-page-list">
                ${cards.length
                    ? cards.map((card, index) => `
                        <button class="assets-bank-page-item interactive" type="button" data-assets-card="${assetsEsc(card.id)}">
                            <div class="assets-bank-page-item-main">
                                <div class="assets-bank-page-item-top">
                                    <strong>${assetsEsc(card.bank)}</strong>
                                    <span class="assets-bank-page-item-badge">${assetsEsc(assetsGetBankCardBadge(card.type))}</span>
                                </div>
                                <div class="assets-bank-page-item-note">尾号 ${assetsEsc(card.last4)} · 持卡人 ${assetsEsc(card.holder)}</div>
                            </div>
                            <div class="assets-bank-page-item-side">
                                <b>${assetsFmt(card.balance)}</b>
                                <span>${index === 0 ? '常用收付卡' : '已绑定'}</span>
                            </div>
                        </button>
                    `).join('')
                    : `
                        <div class="assets-bank-page-empty">
                            <strong>还没有银行卡</strong>
                            <span>点右上角的 + 先添加一张卡，后面的转入零钱、转回银行卡和账单都会围绕银行卡联动。</span>
                            <button class="assets-bank-page-empty-button interactive" type="button" data-assets-add-card>添加银行卡</button>
                        </div>
                    `}
            </div>

            <div class="assets-bank-page-footnote">
                点开任意一张卡，可以继续编辑信息或删除。
            </div>
        </div>
    `;
}

function assetsRenderDetailPage() {
    const body = assetsGetDetailPageBody();
    if (!body || !assetsDetailPageState || !assetsState) return;
    if (assetsDetailPageState.type === 'bank') {
        body.innerHTML = assetsRenderBankPage();
    }
}

function assetsRenderWalletPage() {
    if (!assetsState) return;
    const hero = document.getElementById('assets-balance-hero');
    const breakdown = document.getElementById('assets-breakdown-list');
    const paymentRow = document.getElementById('assets-payment-row');
    const bankcardsWrap = document.getElementById('assets-bankcards-wrap');
    const billList = document.getElementById('assets-bill-list');
    if (!hero || !breakdown || !paymentRow || !bankcardsWrap || !billList) return;

    const stockValue = assetsGetTotalStockValue();
    const cardValue = assetsGetTotalCardBalance();
    const lotteryNet = assetsRoundMoney(assetsState.lottery.totalWon - assetsState.lottery.totalSpent);
    const walletTools = [
        {
            index: 0,
            label: '银行卡',
            meta: assetsGetWalletPanelToolMeta('cards'),
            icon: '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/><line x1="5" y1="15" x2="10" y2="15"/>'
        },
        {
            index: 1,
            label: '亲属卡',
            meta: assetsGetWalletPanelToolMeta('family'),
            icon: '<rect x="2" y="7" width="20" height="13" rx="3"/><circle cx="9" cy="12" r="2"/><circle cx="15.5" cy="13" r="2"/><path d="M6 7a3 3 0 0 1 6 0"/>'
        },
        {
            index: 2,
            label: '支付密码',
            meta: assetsGetWalletPanelToolMeta('passcode'),
            icon: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'
        },
        {
            index: 3,
            label: '免密支付',
            meta: assetsGetWalletPanelToolMeta('no-password'),
            icon: '<rect x="2" y="6" width="20" height="14" rx="3"/><path d="m13 9-3 4h3l-2 4 5-6h-3l2-2z"/>'
        }
    ];

    hero.innerHTML = `
        <div class="assets-balance-label">Total Assets</div>
        <div class="assets-balance-amount"><strong>${assetsFmt(assetsGetTotalAssets())}</strong></div>
        <div class="assets-balance-sub">
            零钱 ${assetsFmt(assetsState.cash)} · 银行卡 ${assetsFmt(cardValue)} · 持仓 ${assetsFmt(stockValue)}
        </div>
        <div class="assets-balance-chip-row">
            <div class="assets-balance-chip">
                <span>零钱余额</span>
                <strong>${assetsFmt(assetsState.cash)}</strong>
            </div>
            <div class="assets-balance-chip">
                <span>银行卡资产</span>
                <strong>${assetsFmt(cardValue)}</strong>
            </div>
            <div class="assets-balance-chip">
                <span>股票市值</span>
                <strong>${assetsFmt(stockValue)}</strong>
            </div>
        </div>
        <div class="assets-balance-actions">
            <button class="assets-balance-action primary interactive" type="button" data-assets-wallet-action="deposit">
                <span class="assets-balance-action-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><path d="M12 4v11"/><path d="m8 11 4 4 4-4"/><path d="M5 20h14"/></svg>
                </span>
                <span class="assets-balance-action-copy">
                    <strong>转入零钱</strong>
                    <small>从银行卡转进资管余额</small>
                </span>
            </button>
            <button class="assets-balance-action secondary interactive" type="button" data-assets-wallet-action="withdraw">
                <span class="assets-balance-action-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><path d="M12 20V9"/><path d="m8 13 4-4 4 4"/><path d="M5 4h14"/></svg>
                </span>
                <span class="assets-balance-action-copy">
                    <strong>转回银行卡</strong>
                    <small>把资管零钱退回已绑银行卡</small>
                </span>
            </button>
        </div>
    `;

    breakdown.innerHTML = [
        { name: '零钱余额', desc: '当前可直接用于支付和出账的资金', amount: assetsFmt(assetsState.cash) },
        { name: '银行卡总额', desc: '已绑定银行卡里的可用余额', amount: assetsFmt(cardValue) },
        { name: '今日工资', desc: '当天完成下班打卡后自动入账', amount: assetsFmt(assetsGetTodayIncome()) },
        { name: '彩票净值', desc: '累计中奖减去累计投入后的结果', amount: assetsFmtSignedMoney(lotteryNet) }
    ].map(item => `
        <div class="assets-breakdown-item">
            <div>
                <div class="assets-bd-name">${assetsEsc(item.name)}</div>
                <div class="assets-bd-desc">${assetsEsc(item.desc)}</div>
            </div>
            <div class="assets-bd-amount">${assetsEsc(item.amount)}</div>
        </div>
    `).join('');

    paymentRow.innerHTML = walletTools.map(tool => `
        <button class="assets-payment-tool interactive${tool.meta.active ? ' is-active' : ''}" type="button" data-assets-pay-index="${tool.index}">
            <div class="assets-payment-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">${tool.icon}</svg>
            </div>
            <div class="assets-payment-copy">
                <span class="assets-payment-name">${assetsEsc(tool.label)}</span>
            </div>
        </button>
    `).join('');
    bankcardsWrap.hidden = true;
    bankcardsWrap.innerHTML = '';
    assetsRenderWalletBills();
}

function assetsRefreshVisibleState(shouldPersist = true) {
    if (!assetsState) return;
    assetsUpdateHeaderTotal();
    if (assetsActiveTab === 'finance') assetsRenderFinancePage();
    if (assetsActiveTab === 'work') assetsRenderWorkPage();
    if (assetsActiveTab === 'lottery') assetsRenderLotteryPage();
    if (assetsActiveTab === 'wallet') assetsRenderWalletPage();
    const stockModal = document.getElementById('assets-stock-modal');
    if (stockModal && !stockModal.hidden && assetsCurrentStockId) assetsRenderStockDetail();
    const lotteryModal = document.getElementById('assets-lottery-modal');
    if (lotteryModal && !lotteryModal.hidden && assetsCurrentLotteryId) assetsRenderLotteryDetail();
    if (assetsUtilitySheetState && assetsUtilitySheetState.type !== 'card-form' && assetsUtilitySheetState.type !== 'transfer') {
        assetsRenderUtilitySheet();
    }
    if (assetsDetailPageState) assetsRenderDetailPage();
    if (assetsPaymentSheetState) assetsRenderPaymentSheet();
    if (shouldPersist) writeAssetsState();
}

function assetsSetTab(tab) {
    const next = ['finance', 'work', 'lottery', 'wallet'].includes(tab) ? tab : 'finance';
    if (next !== 'wallet' && assetsDetailPageState) assetsCloseDetailPage();
    assetsActiveTab = next;
    document.querySelectorAll('.assets-tab').forEach(button => {
        const active = button.getAttribute('data-assets-tab') === next;
        button.classList.toggle('active', active);
        button.setAttribute('aria-selected', String(active));
    });
    document.querySelectorAll('.assets-page').forEach(page => {
        const active = page.getAttribute('data-assets-page') === next;
        page.classList.toggle('active', active);
        page.hidden = !active;
        if (active) page.scrollTop = 0;
    });
    if (next === 'finance') assetsRenderFinancePage();
    if (next === 'work') assetsRenderWorkPage();
    if (next === 'lottery') assetsRenderLotteryPage();
    if (next === 'wallet') assetsRenderWalletPage();
}

function assetsHandlePaymentToolAction(index) {
    if (!assetsState) return;
    if (index === 0) {
        assetsOpenBankPage();
        return;
    }
    if (index === 1) {
        assetsOpenFamilySheet();
        return;
    }
    if (index === 2) {
        if (assetsState.payment.passcode) assetsOpenPaymentSheet({ flow: 'change', title: '修改支付密码' });
        else assetsOpenPaymentSheet({ flow: 'setup', title: '设置支付密码' });
        return;
    }
    assetsOpenNoPasswordSheet();
}

function closeAssetsApp(instant = false) {
    const app = assetsGetApp();
    if (!app) return;
    window.clearInterval(assetsPriceTick);
    window.clearInterval(assetsClockTick);
    assetsPriceTick = 0;
    assetsClockTick = 0;
    document.getElementById('assets-stock-modal')?.setAttribute('hidden', '');
    document.getElementById('assets-lottery-modal')?.setAttribute('hidden', '');
    assetsCloseDetailPage();
    assetsClosePaymentSheet();
    assetsCloseUtilitySheet();
    writeAssetsState();
    if (instant) {
        const prevTransition = app.style.transition;
        app.style.transition = 'none';
        app.classList.remove('active');
        void app.offsetHeight;
        requestAnimationFrame(() => {
            app.style.transition = prevTransition;
        });
    } else {
        app.classList.remove('active');
    }
    document.body.classList.remove('assets-open');
}

function assetsCreatePaymentSheetState(config = {}) {
    const flow = config.flow === 'change' ? 'change' : config.flow === 'verify' ? 'verify' : 'setup';
    return {
        flow,
        step: flow === 'change' ? 'verify-current' : flow === 'verify' ? 'verify' : 'create',
        value: '',
        firstValue: '',
        animate: true,
        title: String(config.title || (flow === 'change' ? '修改支付密码' : flow === 'verify' ? '验证支付密码' : '设置支付密码')),
        note: String(config.note || (flow === 'change' ? '先输入当前 6 位支付密码' : flow === 'verify' ? '请输入支付密码后继续' : '请输入 6 位数字作为支付密码')),
        error: false,
        onSuccess: typeof config.onSuccess === 'function' ? config.onSuccess : null
    };
}

function assetsOpenPaymentSheet(config = {}) {
    assetsEnsureOverlays();
    window.clearTimeout(assetsSetPaymentError._timer);
    window.clearTimeout(assetsPaymentCommitTimer);
    assetsPaymentCommitTimer = 0;
    assetsPaymentSheetState = assetsCreatePaymentSheetState(config);
    const overlay = document.getElementById('assets-payment-sheet');
    if (overlay) overlay.hidden = false;
    assetsRenderPaymentSheet();
}

function assetsClosePaymentSheet() {
    const overlay = document.getElementById('assets-payment-sheet');
    if (overlay) overlay.hidden = true;
    window.clearTimeout(assetsSetPaymentError._timer);
    window.clearTimeout(assetsPaymentCommitTimer);
    assetsPaymentCommitTimer = 0;
    assetsPaymentSheetState = null;
}

function assetsGetPaymentSheetMeta(state) {
    if (!state) return { step: '', note: '' };
    if (state.flow === 'change') {
        if (state.step === 'verify-current') return { step: '验证当前密码', note: '先输入当前 6 位支付密码' };
        if (state.step === 'new') return { step: '输入新密码', note: '请输入新的 6 位数字密码' };
        return { step: '确认新密码', note: '请再次输入新的支付密码' };
    }
    if (state.flow === 'verify') {
        return { step: '验证密码', note: state.note || '请输入支付密码' };
    }
    if (state.step === 'confirm') {
        return { step: '确认密码', note: '请再次输入，确认支付密码' };
    }
    return { step: '创建密码', note: state.note || '请输入 6 位数字作为支付密码' };
}

function assetsRenderPaymentSheet() {
    const state = assetsPaymentSheetState;
    const body = document.getElementById('assets-payment-sheet-body');
    const overlay = document.getElementById('assets-payment-sheet');
    if (!body || !overlay || !state) return;
    const meta = assetsGetPaymentSheetMeta(state);
    const dots = Array.from({ length: ASSETS_PASSCODE_LENGTH }, (_, index) => `
        <span class="assets-payment-dot${index < state.value.length ? ' filled' : ''}"></span>
    `).join('');
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'];
    body.innerHTML = `
        <div class="assets-payment-sheet${state.animate ? ' is-entering' : ''}">
            <button class="assets-payment-sheet-close interactive" type="button" data-assets-payment-close>
                <span>${assetsEsc(state.title)}</span>
            </button>
            <div class="assets-payment-sheet-step">${assetsEsc(meta.step)}</div>
            <p class="assets-payment-sheet-note">${assetsEsc(state.error ? state.note : meta.note)}</p>
            <div class="assets-payment-dots${state.error ? ' is-error' : ''}">
                ${dots}
            </div>
            <div class="assets-payment-keypad">
                ${keys.map(key => {
                    if (!key) return '<span class="assets-payment-key assets-payment-key--ghost" aria-hidden="true"></span>';
                    if (key === 'delete') {
                        return '<button class="assets-payment-key assets-payment-key--delete interactive" type="button" data-assets-payment-delete>删除</button>';
                    }
                    return `<button class="assets-payment-key interactive" type="button" data-assets-payment-key="${key}">${key}</button>`;
                }).join('')}
            </div>
        </div>
    `;
    overlay.hidden = false;
    state.animate = false;
}

function assetsSetPaymentError(message) {
    const state = assetsPaymentSheetState;
    if (!state) return;
    window.clearTimeout(assetsSetPaymentError._timer);
    state.error = true;
    state.note = String(message || '密码输入有误');
    assetsRenderPaymentSheet();
    assetsSetPaymentError._timer = window.setTimeout(() => {
        if (assetsPaymentSheetState !== state) return;
        state.error = false;
        assetsRenderPaymentSheet();
    }, 420);
}

function assetsCommitPaymentSheet() {
    const state = assetsPaymentSheetState;
    if (!state || state.value.length !== ASSETS_PASSCODE_LENGTH || !assetsState) return;
    window.clearTimeout(assetsPaymentCommitTimer);
    assetsPaymentCommitTimer = 0;
    const currentPasscode = assetsState.payment.passcode;
    if (state.flow === 'setup') {
        if (state.step === 'create') {
            state.firstValue = state.value;
            state.value = '';
            state.step = 'confirm';
            state.error = false;
            assetsRenderPaymentSheet();
            return;
        }
        if (state.value !== state.firstValue) {
            state.value = '';
            state.firstValue = '';
            state.step = 'create';
            assetsSetPaymentError('两次输入不一致，请重新设置');
            return;
        }
        assetsState.payment.passcode = state.value;
        assetsClosePaymentSheet();
        writeAssetsState();
        assetsRefreshVisibleState(false);
        if (state.onSuccess) state.onSuccess();
        else assetsShowToast('支付密码已保存。');
        return;
    }
    if (state.flow === 'change') {
        if (state.step === 'verify-current') {
            if (state.value !== currentPasscode) {
                state.value = '';
                assetsSetPaymentError('当前支付密码不正确');
                return;
            }
            state.value = '';
            state.error = false;
            state.step = 'new';
            assetsRenderPaymentSheet();
            return;
        }
        if (state.step === 'new') {
            state.firstValue = state.value;
            state.value = '';
            state.error = false;
            state.step = 'confirm-new';
            assetsRenderPaymentSheet();
            return;
        }
        if (state.value !== state.firstValue) {
            state.value = '';
            state.firstValue = '';
            state.step = 'new';
            assetsSetPaymentError('两次新密码不一致，请重新输入');
            return;
        }
        assetsState.payment.passcode = state.value;
        assetsClosePaymentSheet();
        writeAssetsState();
        assetsRefreshVisibleState(false);
        if (state.onSuccess) state.onSuccess();
        else assetsShowToast('支付密码已更新。');
        return;
    }
    if (state.value !== currentPasscode) {
        state.value = '';
        assetsSetPaymentError('支付密码不正确');
        return;
    }
    assetsClosePaymentSheet();
    if (state.onSuccess) state.onSuccess();
    else assetsShowToast('密码验证通过。', 1200);
}

function assetsHandlePaymentDigit(value) {
    const state = assetsPaymentSheetState;
    if (!state) return;
    if (!/^\d$/.test(String(value || ''))) return;
    if (state.value.length >= ASSETS_PASSCODE_LENGTH) return;
    window.clearTimeout(assetsPaymentCommitTimer);
    assetsPaymentCommitTimer = 0;
    state.value += value;
    state.error = false;
    assetsRenderPaymentSheet();
    if (state.value.length === ASSETS_PASSCODE_LENGTH) {
        assetsPaymentCommitTimer = window.setTimeout(() => {
            if (assetsPaymentSheetState !== state) return;
            assetsPaymentCommitTimer = 0;
            assetsCommitPaymentSheet();
        }, 90);
    }
}

function assetsHandlePaymentDelete() {
    if (!assetsPaymentSheetState) return;
    window.clearTimeout(assetsPaymentCommitTimer);
    assetsPaymentCommitTimer = 0;
    assetsPaymentSheetState.value = assetsPaymentSheetState.value.slice(0, -1);
    assetsPaymentSheetState.error = false;
    assetsRenderPaymentSheet();
}

function assetsRequestPasscode(options = {}) {
    if (!assetsState) return;
    const label = String(options.label || '继续操作');
    if (!assetsState.payment.passcode) {
        assetsOpenPaymentSheet({
            flow: 'setup',
            title: String(options.setupTitle || '设置支付密码'),
            note: String(options.setupNote || `先设置 6 位数字密码，再继续${label}`),
            onSuccess: options.onSuccess
        });
        return;
    }
    assetsOpenPaymentSheet({
        flow: 'verify',
        title: String(options.verifyTitle || '验证支付密码'),
        note: String(options.verifyNote || `输入支付密码后继续${label}`),
        onSuccess: options.onSuccess
    });
}

function assetsRequireOutflowPasscode(label, onSuccess) {
    if (!assetsState) return;
    if (assetsState.payment.noPasswordEnabled) {
        if (typeof onSuccess === 'function') onSuccess();
        return;
    }
    assetsRequestPasscode({
        label,
        setupTitle: '设置支付密码',
        setupNote: `设置支付密码后继续${label}`,
        verifyTitle: '输入支付密码',
        verifyNote: `输入支付密码后继续${label}`,
        onSuccess
    });
}

function assetsRequireCardPasscode(label, onSuccess) {
    assetsRequestPasscode({
        label,
        setupTitle: '设置银行卡密码',
        setupNote: `先设置 6 位数字密码，才能${label}`,
        verifyTitle: '验证银行卡密码',
        verifyNote: `输入银行卡密码后继续${label}`,
        onSuccess
    });
}

function assetsHandleWalletAction(action) {
    if (!assetsState) return;
    if (action === 'deposit') {
        if (!assetsState.cards.length) {
            assetsShowToast('先添加一张银行卡，再转入零钱。');
            return;
        }
        assetsOpenTransferSheet('deposit');
        return;
    }
    if (action === 'withdraw') {
        if (!assetsState.cards.length) {
            assetsShowToast('先添加一张银行卡，再转回银行卡。');
            return;
        }
        assetsOpenTransferSheet('withdraw');
        return;
    }
    assetsOpenBillsSheet();
}

function assetsHandlePaymentToolAction(index) {
    if (!assetsState) return;
    if (index === 0) {
        assetsOpenCardsSheet();
        return;
    }
    if (index === 1) {
        assetsOpenFamilySheet();
        return;
    }
    if (index === 2) {
        if (assetsState.payment.passcode) assetsOpenPaymentSheet({ flow: 'change', title: '修改支付密码' });
        else assetsOpenPaymentSheet({ flow: 'setup', title: '设置支付密码' });
        return;
    }
    assetsOpenNoPasswordSheet();
}

function assetsGetApp() {
    return document.getElementById('assets-app');
}

function assetsCloseOtherApps() {
    [
        'closeSettingsApp',
        'closeLetterApp',
        'closePrivateApp',
        'closePrologueApp',
        'closeStyleApp',
        'closeCommunityApp',
        'closeEncounterApp',
        'closeDossierApp',
        'closeWanyeApp',
        'closeLingguangApp',
        'closeFuyueApp',
        'closeMijingApp',
        'closeShiguangApp',
        'closeEchoApp',
        'closeGuideApp',
        'closeZhenxuanApp',
        'closePhoneApp'
    ].forEach(name => {
        try {
            if (typeof window[name] === 'function') window[name](true);
        } catch (error) {
            // Ignore peer close failures.
        }
    });
}

async function openAssetsApp() {
    const app = assetsGetApp();
    if (!app) return;
    document.body.classList.remove('edit-mode');
    assetsCloseOtherApps();
    await hydrateAssetsState();
    assetsEnsureOverlays();
    assetsUpdateHeaderTotal();
    assetsSetTab(assetsActiveTab);
    assetsTickClock();
    if (!assetsPriceTick) assetsPriceTick = window.setInterval(assetsTickPrices, ASSETS_PRICE_TICK_MS);
    if (!assetsClockTick) assetsClockTick = window.setInterval(assetsTickClock, ASSETS_CLOCK_TICK_MS);
    document.body.classList.add('assets-open');
    app.classList.add('active');
}

function closeAssetsApp(instant = false) {
    const app = assetsGetApp();
    if (!app) return;
    window.clearInterval(assetsPriceTick);
    window.clearInterval(assetsClockTick);
    assetsPriceTick = 0;
    assetsClockTick = 0;
    document.getElementById('assets-stock-modal')?.setAttribute('hidden', '');
    document.getElementById('assets-lottery-modal')?.setAttribute('hidden', '');
    assetsClosePaymentSheet();
    assetsCloseUtilitySheet();
    writeAssetsState();
    if (instant) {
        const prevTransition = app.style.transition;
        app.style.transition = 'none';
        app.classList.remove('active');
        void app.offsetHeight;
        requestAnimationFrame(() => {
            app.style.transition = prevTransition;
        });
    } else {
        app.classList.remove('active');
    }
    document.body.classList.remove('assets-open');
}

function bindAssetsEvents() {
    const app = assetsGetApp();
    if (!app || assetsEventsBound) return;
    assetsEventsBound = true;
    void hydrateAssetsState();
    assetsEnsureOverlays();

    document.getElementById('assets-close-title')?.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        closeAssetsApp();
    });

    document.getElementById('assets-lottery-modal-close')?.addEventListener('click', event => {
        event.preventDefault();
        document.getElementById('assets-lottery-modal')?.setAttribute('hidden', '');
    });

    document.getElementById('assets-stock-modal')?.addEventListener('click', event => {
        if (event.target === event.currentTarget) event.currentTarget.hidden = true;
    });

    document.getElementById('assets-lottery-modal')?.addEventListener('click', event => {
        if (event.target === event.currentTarget) event.currentTarget.hidden = true;
    });

    app.addEventListener('click', event => {
        const tab = event.target.closest('[data-assets-tab]');
        if (tab) {
            event.preventDefault();
            assetsSetTab(tab.getAttribute('data-assets-tab') || 'finance');
            return;
        }
        const stock = event.target.closest('[data-assets-stock]');
        if (stock) {
            event.preventDefault();
            assetsOpenStockModal(stock.getAttribute('data-assets-stock'));
            return;
        }
        const trade = event.target.closest('[data-assets-trade]');
        if (trade) {
            event.preventDefault();
            assetsHandleStockTrade(trade.getAttribute('data-assets-trade'));
            return;
        }
        const jobAccept = event.target.closest('[data-assets-accept]');
        if (jobAccept) {
            event.preventDefault();
            assetsAcceptJob(jobAccept.getAttribute('data-assets-accept'));
            return;
        }
        const jobDecline = event.target.closest('[data-assets-decline]');
        if (jobDecline) {
            event.preventDefault();
            assetsDeclineJob(jobDecline.getAttribute('data-assets-decline'));
            return;
        }
        const punch = event.target.closest('[data-assets-punch]');
        if (punch) {
            event.preventDefault();
            assetsHandlePunch(punch.getAttribute('data-assets-punch'));
            return;
        }
        const lottery = event.target.closest('[data-assets-lottery]');
        if (lottery) {
            event.preventDefault();
            assetsOpenLotteryModal(lottery.getAttribute('data-assets-lottery'));
            return;
        }
        const lotteryDraw = event.target.closest('[data-assets-lottery-draw]');
        if (lotteryDraw) {
            event.preventDefault();
            assetsHandleLotteryDraw();
            return;
        }
        const lotteryRefresh = event.target.closest('[data-assets-lottery-refresh]');
        if (lotteryRefresh) {
            event.preventDefault();
            assetsRefreshLotteryPick();
            return;
        }
        const paymentTool = event.target.closest('[data-assets-pay-index]');
        if (paymentTool) {
            event.preventDefault();
            assetsHandlePaymentToolAction(Number(paymentTool.getAttribute('data-assets-pay-index')));
            return;
        }
        const card = event.target.closest('[data-assets-card]');
        if (card) {
            event.preventDefault();
            assetsOpenCardDetailSheet(card.getAttribute('data-assets-card'));
            return;
        }
        const addCard = event.target.closest('[data-assets-add-card]');
        if (addCard) {
            event.preventDefault();
            assetsRequireCardPasscode('添加银行卡', () => {
                assetsOpenCardFormSheet('create');
            });
            return;
        }
        const openBills = event.target.closest('[data-assets-open-bills]');
        if (openBills) {
            event.preventDefault();
            assetsOpenBillsSheet();
            return;
        }
        const walletAction = event.target.closest('[data-assets-wallet-action]');
        if (walletAction) {
            event.preventDefault();
            assetsHandleWalletAction(walletAction.getAttribute('data-assets-wallet-action'));
        }
    });

    app.addEventListener('touchstart', event => event.stopPropagation(), { passive: true });
    app.addEventListener('touchmove', event => event.stopPropagation(), { passive: false });
    app.addEventListener('mousedown', event => event.stopPropagation());

    document.addEventListener('keydown', event => {
        if (assetsPaymentSheetState) {
            if (/^\d$/.test(event.key)) {
                event.preventDefault();
                assetsHandlePaymentDigit(event.key);
                return;
            }
            if (event.key === 'Backspace') {
                event.preventDefault();
                assetsHandlePaymentDelete();
                return;
            }
            if (event.key === 'Escape') {
                event.preventDefault();
                assetsClosePaymentSheet();
                return;
            }
        }
        if (assetsUtilitySheetState && event.key === 'Escape') {
            event.preventDefault();
            assetsCloseUtilitySheet();
        }
    });

    document.querySelector('.home-indicator')?.addEventListener('click', () => {
        if (assetsGetApp()?.classList.contains('active')) closeAssetsApp(true);
    });
}

function assetsOpenCardsSheet() {
    assetsOpenBankPage();
}

function assetsHandlePaymentToolAction(index) {
    if (!assetsState) return;
    if (index === 0) {
        assetsOpenBankPage();
        return;
    }
    if (index === 1) {
        assetsOpenFamilySheet();
        return;
    }
    if (index === 2) {
        if (assetsState.payment.passcode) assetsOpenPaymentSheet({ flow: 'change', title: '修改支付密码' });
        else assetsOpenPaymentSheet({ flow: 'setup', title: '设置支付密码' });
        return;
    }
    assetsOpenNoPasswordSheet();
}

function closeAssetsApp(instant = false) {
    const app = assetsGetApp();
    if (!app) return;
    window.clearInterval(assetsPriceTick);
    window.clearInterval(assetsClockTick);
    assetsPriceTick = 0;
    assetsClockTick = 0;
    document.getElementById('assets-stock-modal')?.setAttribute('hidden', '');
    document.getElementById('assets-lottery-modal')?.setAttribute('hidden', '');
    assetsCloseDetailPage();
    assetsClosePaymentSheet();
    assetsCloseUtilitySheet();
    writeAssetsState();
    if (instant) {
        const prevTransition = app.style.transition;
        app.style.transition = 'none';
        app.classList.remove('active');
        void app.offsetHeight;
        requestAnimationFrame(() => {
            app.style.transition = prevTransition;
        });
    } else {
        app.classList.remove('active');
    }
    document.body.classList.remove('assets-open');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindAssetsEvents, { once: true });
} else {
    bindAssetsEvents();
}

window.openAssetsApp = openAssetsApp;
window.closeAssetsApp = closeAssetsApp;
window.requireAssetsOutflowPasscode = assetsRequireOutflowPasscode;
