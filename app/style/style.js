const STYLE_STORAGE_KEY = 'rinno_style_preferences';
const STYLE_CUSTOM_CSS_ID = 'rinno-style-custom-css';
const STYLE_CUSTOM_CSS_TEMPLATE = `/* Rinno 桌面全局样式模板
   取消注释并修改数值后会自动应用。

   可用变量:
   --style-accent            主题主色
   --style-accent-strong     主题深色
   --style-accent-soft       主题柔色
   --text-main               主文字
   --text-sub                次级文字
   --glass-bg                实体组件底色
   --radius-lg/md/sm         组件圆角
*/

/* 1. 桌面网格间距 */
/*
.page {
    gap: 22px 16px;
    padding-top: 64px;
}
*/

/* 2. Dock 栏 */
/*
.dock {
    height: 82px;
    border-radius: 30px;
    background: rgba(255, 255, 255, 0.22);
}
*/

/* 3. 应用图标 */
/*
.app-icon {
    width: 58px;
    height: 58px;
    border-radius: 18px;
    box-shadow: 0 14px 30px rgba(0, 0, 0, 0.08);
}
*/

/* 4. 小组件 */
/*
.glass-panel,
.new-music-player,
.dreamy-bg,
.chat-input-bar {
    border-color: rgba(255, 255, 255, 0.24);
    background: var(--rinno-component-surface);
    box-shadow: var(--rinno-component-shadow);
}
*/

/* 5. 应用名称 */
/*
.app-name {
    color: var(--style-accent-strong);
    text-shadow: 0 1px 8px rgba(255, 255, 255, 0.72);
}
*/
`;

const STYLE_THEMES = {
    rose: {
        label: 'ROSE GREY',
        bg: '#ecebee',
        text: '#2b2b30',
        sub: '#7a7078',
        accent: '#d9b7c0',
        accentStrong: '#8d6e7b',
        accentSoft: '#f6eef1',
        surface: '#fffbfc',
        glassTint: '255, 251, 252',
        shadow: '88, 55, 68',
        dark: false
    },
    sage: {
        label: 'SAGE',
        bg: '#edf2ed',
        text: '#1f2a22',
        sub: '#657367',
        accent: '#b7c9bd',
        accentStrong: '#6f8878',
        accentSoft: '#f0f5ef',
        surface: '#fbfdf9',
        glassTint: '248, 252, 246',
        shadow: '39, 72, 48',
        dark: false
    },
    lake: {
        label: 'LAKE MIST',
        bg: '#e8f2f5',
        text: '#1f2d34',
        sub: '#647783',
        accent: '#a9c8d8',
        accentStrong: '#6a95a9',
        accentSoft: '#edf6f8',
        surface: '#fbfeff',
        glassTint: '246, 253, 255',
        shadow: '40, 77, 95',
        dark: false
    },
    mauve: {
        label: 'MAUVE',
        bg: '#eeeaf3',
        text: '#28212f',
        sub: '#74667e',
        accent: '#c9b5d9',
        accentStrong: '#84719b',
        accentSoft: '#f5eff8',
        surface: '#fffbff',
        glassTint: '253, 248, 255',
        shadow: '78, 58, 98',
        dark: false
    },
    clay: {
        label: 'CLAY APRICOT',
        bg: '#f2ebe5',
        text: '#31241d',
        sub: '#7c6758',
        accent: '#d9b08f',
        accentStrong: '#97745c',
        accentSoft: '#fbf0e7',
        surface: '#fffaf5',
        glassTint: '255, 248, 240',
        shadow: '99, 62, 37',
        dark: false
    },
    citrus: {
        label: 'CITRUS OLIVE',
        bg: '#f2f1e4',
        text: '#2b2a1d',
        sub: '#747152',
        accent: '#d7cf82',
        accentStrong: '#898143',
        accentSoft: '#faf7df',
        surface: '#fffdf2',
        glassTint: '255, 252, 230',
        shadow: '87, 83, 29',
        dark: false
    },
    coral: {
        label: 'CORAL FOG',
        bg: '#f4e9e7',
        text: '#312020',
        sub: '#7c5f5c',
        accent: '#e4a39c',
        accentStrong: '#a56a65',
        accentSoft: '#fff0ed',
        surface: '#fffafa',
        glassTint: '255, 246, 244',
        shadow: '108, 48, 45',
        dark: false
    },
    noir: {
        label: 'NOIR GOLD',
        bg: '#131820',
        text: '#f4efe6',
        sub: '#b8b0a3',
        accent: '#d6c59d',
        accentStrong: '#ecd59d',
        accentSoft: '#2f3944',
        surface: '#1c2026',
        glassTint: '42, 49, 58',
        shadow: '0, 0, 0',
        dark: true
    }
};

const STYLE_FONT_STACKS = {
    xinjie: '"Rinno Xinjie", "Songti SC", serif',
    system: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif',
    songti: '"Songti SC", SimSun, "STSong", serif',
    heiti: '"PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif',
    serif: 'Georgia, "Times New Roman", "Songti SC", serif',
    mono: '"SFMono-Regular", Consolas, "Liberation Mono", "Courier New", monospace'
};

const STYLE_FONT_RUNTIME_ID = 'rinno-style-font-runtime';
const STYLE_FONT_MIN_PX = 12;
const STYLE_FONT_MAX_PX = 24;
const STYLE_FONT_BASE_PX = 16;
const STYLE_BUILTIN_FONTS = [
    {
        value: 'xinjie',
        label: '心结',
        meta: '内置主题字体',
        sample: '把喜欢写进风里'
    },
    {
        value: 'system',
        label: '系统默认',
        meta: 'System UI',
        sample: '愿每个字都刚刚好'
    },
    {
        value: 'songti',
        label: '宋体雅致',
        meta: 'Song Style',
        sample: '温柔落在纸页边角'
    },
    {
        value: 'heiti',
        label: '黑体清晰',
        meta: 'Sans Serif',
        sample: '界面信息更直接清楚'
    },
    {
        value: 'serif',
        label: '衬线书页',
        meta: 'Editorial Serif',
        sample: '字句像翻开的旧书页'
    },
    {
        value: 'mono',
        label: '等宽札记',
        meta: 'Monospace',
        sample: '把片刻记成一行一行'
    }
];

const STYLE_DEFAULT_STATE = {
    theme: 'rose',
    wallpaper: 'theme',
    iconStyle: 'line',
    pagePreset: 'editorial',
    radius: 28,
    appRadius: 20,
    appNameColor: '#2b2b30',
    fontFamily: 'xinjie',
    fontSize: 16,
    fontWeight: 400,
    uiScale: 100,
    customFonts: [],
    lockWallpaper: '',
    desktopWallpaper: '',
    appIconCover: '',
    appIconCovers: {},
    customCss: STYLE_CUSTOM_CSS_TEMPLATE,
    hidden: {
        'status-bar': false,
        'dynamic-island': false
    }
};

let styleState = { ...STYLE_DEFAULT_STATE, hidden: { ...STYLE_DEFAULT_STATE.hidden } };
let styleSaveTimer = null;
const styleAppCoverValidationCache = new Map();
const styleAppCoverValidationRequests = new Map();
const styleAppCoverValidationTokens = new WeakMap();
const STYLE_APP_ICON_COVER_ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/pjpeg', 'image/gif']);
const STYLE_APP_ICON_COVER_ALLOWED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif']);

function parseStyleJson(content) {
    if (!content || typeof content !== 'string') return {};
    try {
        const parsed = JSON.parse(content);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (e) {
        return {};
    }
}

function clampStyleNumber(value, min, max, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, number));
}

function normalizeStyleFontSize(value, fallback = STYLE_DEFAULT_STATE.fontSize) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    if (number >= 60 && number <= 200) {
        return clampStyleNumber(Math.round((number / 100) * STYLE_FONT_BASE_PX), STYLE_FONT_MIN_PX, STYLE_FONT_MAX_PX, fallback);
    }
    return clampStyleNumber(Math.round(number), STYLE_FONT_MIN_PX, STYLE_FONT_MAX_PX, fallback);
}

function normalizeStyleImageMap(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(
        Object.entries(value)
            .map(([key, image]) => [String(key || ''), String(image || '')])
            .filter(([key, image]) => key && image)
    );
}

function createStyleCustomFontId(seed = '') {
    const normalized = String(seed || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 24);
    return `font-${normalized || 'custom'}-${Date.now().toString(36)}`;
}

function normalizeStyleCustomFonts(value) {
    if (!Array.isArray(value)) return [];
    const seen = new Set();
    return value
        .map(item => {
            if (!item || typeof item !== 'object') return null;
            const source = String(item.source || item.url || '').trim();
            if (!source) return null;
            const id = String(item.id || createStyleCustomFontId(item.name || source)).trim();
            if (!id || seen.has(id)) return null;
            seen.add(id);
            return {
                id,
                name: String(item.name || item.label || '自定义字体').trim().slice(0, 32) || '自定义字体',
                source,
                kind: item.kind === 'url' ? 'url' : 'upload',
                sample: String(item.sample || '把喜欢写成自己想要的样子').trim().slice(0, 40) || '把喜欢写成自己想要的样子'
            };
        })
        .filter(Boolean);
}

function getStyleCustomFontFaceName(id) {
    return `Rinno Custom Font ${String(id || '').replace(/[^a-z0-9_-]/gi, '_')}`;
}

function inferStyleFontFormat(source = '') {
    const raw = String(source || '').trim().toLowerCase();
    if (!raw) return 'truetype';
    if (raw.includes('font/woff2') || /\.woff2(?:[?#].*)?$/.test(raw)) return 'woff2';
    if (raw.includes('font/woff') || /\.woff(?:[?#].*)?$/.test(raw)) return 'woff';
    if (raw.includes('font/otf') || /\.otf(?:[?#].*)?$/.test(raw)) return 'opentype';
    if (raw.includes('font/ttf') || /\.ttf(?:[?#].*)?$/.test(raw)) return 'truetype';
    return 'truetype';
}

function getStyleCustomFontById(fontId, customFonts = styleState.customFonts) {
    const normalizedId = String(fontId || '').trim();
    return Array.isArray(customFonts)
        ? customFonts.find(font => font?.id === normalizedId) || null
        : null;
}

function isStyleFontValueAvailable(value, customFonts = styleState.customFonts) {
    const normalized = String(value || '').trim();
    if (STYLE_FONT_STACKS[normalized]) return true;
    const customId = normalized.replace(/^custom:/, '');
    return Boolean(customId && getStyleCustomFontById(customId, customFonts));
}

function getStyleFontStack(value, customFonts = styleState.customFonts) {
    const normalized = String(value || '').trim();
    if (STYLE_FONT_STACKS[normalized]) return STYLE_FONT_STACKS[normalized];
    const customId = normalized.replace(/^custom:/, '');
    const customFont = getStyleCustomFontById(customId, customFonts);
    if (customFont) {
        return `"${getStyleCustomFontFaceName(customFont.id)}", -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif`;
    }
    return STYLE_FONT_STACKS[STYLE_DEFAULT_STATE.fontFamily] || STYLE_FONT_STACKS.system;
}

function getStyleFontLabel(value, customFonts = styleState.customFonts) {
    const normalized = String(value || '').trim();
    const builtin = STYLE_BUILTIN_FONTS.find(font => font.value === normalized);
    if (builtin) return builtin.label;
    const customId = normalized.replace(/^custom:/, '');
    return getStyleCustomFontById(customId, customFonts)?.name || '未命名字体';
}

function coerceStyleState(saved = {}) {
    const migrated = {
        ...saved,
        iconStyle: saved.iconStyle || saved.icons,
        pagePreset: saved.pagePreset || saved.page,
        appRadius: saved.appRadius || saved.iconRadius,
        fontSize: saved.fontSize || (Number(saved.textScale) ? Math.round(Number(saved.textScale) * 100) : undefined)
    };
    const normalizedMigrated = Object.fromEntries(
        Object.entries(migrated).filter(([key]) => Object.prototype.hasOwnProperty.call(STYLE_DEFAULT_STATE, key))
    );
    const customFonts = normalizeStyleCustomFonts(normalizedMigrated.customFonts);
    const fontFamily = isStyleFontValueAvailable(normalizedMigrated.fontFamily, customFonts)
        ? String(normalizedMigrated.fontFamily)
        : STYLE_DEFAULT_STATE.fontFamily;

    return {
        ...STYLE_DEFAULT_STATE,
        ...normalizedMigrated,
        theme: STYLE_THEMES[normalizedMigrated.theme] ? normalizedMigrated.theme : STYLE_DEFAULT_STATE.theme,
        wallpaper: ['theme', 'silk', 'paper', 'glass'].includes(normalizedMigrated.wallpaper) ? normalizedMigrated.wallpaper : STYLE_DEFAULT_STATE.wallpaper,
        iconStyle: ['line', 'soft', 'filled'].includes(normalizedMigrated.iconStyle) ? normalizedMigrated.iconStyle : STYLE_DEFAULT_STATE.iconStyle,
        pagePreset: ['editorial', 'compact', 'airy'].includes(normalizedMigrated.pagePreset) ? normalizedMigrated.pagePreset : STYLE_DEFAULT_STATE.pagePreset,
        radius: clampStyleNumber(normalizedMigrated.radius, 10, 36, STYLE_DEFAULT_STATE.radius),
        appRadius: clampStyleNumber(normalizedMigrated.appRadius, 8, 28, STYLE_DEFAULT_STATE.appRadius),
        appNameColor: /^#[0-9a-f]{6}$/i.test(String(normalizedMigrated.appNameColor || '')) ? normalizedMigrated.appNameColor : STYLE_DEFAULT_STATE.appNameColor,
        fontFamily,
        fontSize: normalizeStyleFontSize(normalizedMigrated.fontSize, STYLE_DEFAULT_STATE.fontSize),
        fontWeight: clampStyleNumber(normalizedMigrated.fontWeight, 300, 700, STYLE_DEFAULT_STATE.fontWeight),
        uiScale: clampStyleNumber(normalizedMigrated.uiScale, 90, 110, STYLE_DEFAULT_STATE.uiScale),
        customFonts,
        lockWallpaper: String(normalizedMigrated.lockWallpaper || ''),
        desktopWallpaper: String(normalizedMigrated.desktopWallpaper || ''),
        appIconCover: String(normalizedMigrated.appIconCover || ''),
        appIconCovers: normalizeStyleImageMap(normalizedMigrated.appIconCovers),
        customCss: typeof normalizedMigrated.customCss === 'string' ? normalizedMigrated.customCss : STYLE_CUSTOM_CSS_TEMPLATE,
        hidden: {
            ...STYLE_DEFAULT_STATE.hidden,
            ...(normalizedMigrated.hidden && typeof normalizedMigrated.hidden === 'object' ? normalizedMigrated.hidden : {})
        }
    };
}

async function loadStyleState() {
    let saved = {};
    try {
        if (typeof db !== 'undefined' && db?.edits) {
            const stored = await db.edits.get(STYLE_STORAGE_KEY);
            saved = parseStyleJson(stored?.content);
        }
    } catch (e) {
        console.warn('风格偏好数据库读取跳过:', e);
    }
    if (!Object.keys(saved).length) {
        const legacy = parseStyleJson(localStorage.getItem(STYLE_STORAGE_KEY));
        saved = legacy;
        if (Object.keys(legacy).length) saveStyleState();
    }
    styleState = coerceStyleState(saved);
    if (styleState.appIconCover && !Object.keys(styleState.appIconCovers).length) {
        const legacyCover = styleState.appIconCover;
        const appIconCovers = {};
        document.querySelectorAll('.app-wrapper').forEach(app => {
            appIconCovers[getStyleAppCoverKey(app)] = legacyCover;
        });
        if (Object.keys(appIconCovers).length) {
            styleState = coerceStyleState({ ...styleState, appIconCover: '', appIconCovers });
            saveStyleState();
        }
    }
    renderStyleState();
}

function saveStyleState() {
    const content = JSON.stringify(styleState);
    try {
        localStorage.removeItem(STYLE_STORAGE_KEY);
    } catch (e) {
        console.warn('风格偏好本地备份跳过:', e);
    }
    try {
        if (typeof db !== 'undefined' && db?.edits) {
            db.edits.put({ id: STYLE_STORAGE_KEY, content, type: 'style-preferences' });
        }
    } catch (e) {
        console.warn('风格偏好保存失败:', e);
    }
}

function saveStyleState() {
    const content = JSON.stringify(styleState);
    try {
        if (typeof db !== 'undefined' && db?.edits) {
            void db.edits.put({ id: STYLE_STORAGE_KEY, content, type: 'style-preferences' });
        }
    } catch (e) {
        console.warn('椋庢牸鍋忓ソ淇濆瓨澶辫触:', e);
    }
    try {
        localStorage.removeItem(STYLE_STORAGE_KEY);
    } catch (e) {
        // Ignore legacy cleanup failures.
    }
}

function scheduleStyleSave() {
    window.clearTimeout(styleSaveTimer);
    styleSaveTimer = window.setTimeout(saveStyleState, 140);
}

function cssUrl(value) {
    if (!value) return 'none';
    return `url("${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}")`;
}

function styleCssEscape(value) {
    if (window.CSS?.escape) return window.CSS.escape(String(value));
    return String(value || '').replace(/["\\]/g, '\\$&');
}

function styleEscapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function hexToRgbString(value, fallback = '255, 255, 255') {
    const hex = String(value || '').replace('#', '').trim();
    if (!/^[0-9a-f]{6}$/i.test(hex)) return fallback;
    return `${parseInt(hex.slice(0, 2), 16)}, ${parseInt(hex.slice(2, 4), 16)}, ${parseInt(hex.slice(4, 6), 16)}`;
}

function getWallpaperGradient(theme, target) {
    const accentRgb = hexToRgbString(theme.accent);
    const accentSoftRgb = hexToRgbString(theme.accentSoft);
    const depth = theme.dark
        ? `linear-gradient(180deg, ${theme.bg} 0%, #202834 100%)`
        : `linear-gradient(180deg, ${theme.surface} 0%, ${theme.bg} 60%, ${theme.accentSoft} 100%)`;
    const variant = {
        theme: `radial-gradient(ellipse 128% 88% at 14% 6%, rgba(${accentRgb}, ${theme.dark ? 0.26 : 0.34}) 0 24%, transparent 70%), radial-gradient(ellipse 112% 76% at 88% 14%, rgba(${accentSoftRgb}, ${theme.dark ? 0.18 : 0.58}) 0 30%, transparent 78%), ${depth}`,
        silk: `linear-gradient(135deg, rgba(${accentSoftRgb}, ${theme.dark ? 0.22 : 0.72}) 0%, ${theme.bg} 48%, rgba(${accentRgb}, ${theme.dark ? 0.20 : 0.36}) 100%)`,
        paper: `repeating-linear-gradient(135deg, rgba(${theme.shadow}, ${theme.dark ? 0.05 : 0.024}) 0 1px, transparent 1px 18px), ${depth}`,
        glass: `linear-gradient(140deg, rgba(${theme.glassTint}, ${theme.dark ? 0.34 : 0.72}), rgba(${theme.glassTint}, ${theme.dark ? 0.10 : 0.18})), radial-gradient(ellipse 150% 82% at 50% 0%, rgba(${accentRgb}, ${theme.dark ? 0.22 : 0.30}) 0 34%, transparent 82%), ${depth}`
    }[styleState.wallpaper] || depth;

    if (target === 'lock') {
        return `linear-gradient(180deg, rgba(${theme.glassTint}, ${theme.dark ? 0.06 : 0.12}), rgba(${theme.shadow}, ${theme.dark ? 0.18 : 0.045})), ${variant}`;
    }
    return variant;
}

function getWallpaperLayer(target) {
    const theme = STYLE_THEMES[styleState.theme] || STYLE_THEMES.rose;
    const custom = target === 'lock' ? styleState.lockWallpaper : styleState.desktopWallpaper;
    if (custom) {
        if (target === 'lock') return cssUrl(custom);
        return `linear-gradient(180deg, rgba(${theme.glassTint}, ${theme.dark ? 0.08 : 0.14}), rgba(${theme.shadow}, ${theme.dark ? 0.18 : 0.035})), ${cssUrl(custom)}`;
    }
    if (styleState.wallpaper === 'theme') return 'none';
    if (target === 'lock') return 'none';
    return getWallpaperGradient(theme, target);
}

function getCustomStyleElement() {
    let styleEl = document.getElementById(STYLE_CUSTOM_CSS_ID);
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = STYLE_CUSTOM_CSS_ID;
        document.head.appendChild(styleEl);
    }
    return styleEl;
}

function getStyleFontRuntimeElement() {
    let styleEl = document.getElementById(STYLE_FONT_RUNTIME_ID);
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = STYLE_FONT_RUNTIME_ID;
        document.head.appendChild(styleEl);
    }
    return styleEl;
}

function applyStyleFontFaces() {
    const fontFaces = styleState.customFonts
        .map(font => {
            const family = getStyleCustomFontFaceName(font.id).replace(/"/g, '\\"');
            const source = String(font.source || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
            const format = inferStyleFontFormat(font.source);
            return `@font-face { font-family: "${family}"; src: url("${source}") format("${format}"); font-weight: 100 900; font-style: normal; font-display: swap; }`;
        })
        .join('\n');
    getStyleFontRuntimeElement().textContent = fontFaces;
}

function applyStyleTheme() {
    const theme = STYLE_THEMES[styleState.theme] || STYLE_THEMES.rose;
    const root = document.documentElement;
    const accentRgb = hexToRgbString(theme.accent);
    const accentStrongRgb = hexToRgbString(theme.accentStrong);
    const accentSoftRgb = hexToRgbString(theme.accentSoft);
    root.style.setProperty('--page-bg', theme.bg);
    root.style.setProperty('--text-main', theme.text);
    root.style.setProperty('--text-sub', theme.sub);
    root.style.setProperty('--style-accent', theme.accent);
    root.style.setProperty('--style-accent-strong', theme.accentStrong);
    root.style.setProperty('--style-accent-soft', theme.accentSoft);
    root.style.setProperty('--style-page-surface', theme.surface);
    root.style.setProperty('--style-accent-rgb', accentRgb);
    root.style.setProperty('--style-accent-strong-rgb', accentStrongRgb);
    root.style.setProperty('--style-accent-soft-rgb', accentSoftRgb);
    root.style.setProperty('--style-glass-tint-rgb', theme.glassTint);
    root.style.setProperty('--style-shadow-rgb', theme.shadow);
    root.style.setProperty('--blur-val', '0px');
    root.style.setProperty('--saturate-val', '100%');
    root.style.setProperty('--rinno-component-surface', `repeating-linear-gradient(135deg, rgba(${theme.shadow}, ${theme.dark ? 0.055 : 0.018}) 0 1px, transparent 1px 16px), linear-gradient(180deg, rgba(${theme.glassTint}, ${theme.dark ? 0.94 : 0.96}), rgba(${theme.glassTint}, ${theme.dark ? 0.76 : 0.82}))`);
    root.style.setProperty('--rinno-component-surface-soft', `linear-gradient(180deg, rgba(${theme.glassTint}, ${theme.dark ? 0.82 : 0.90}), rgba(${theme.glassTint}, ${theme.dark ? 0.64 : 0.74}))`);
    root.style.setProperty('--rinno-component-surface-flat', `rgba(${theme.glassTint}, ${theme.dark ? 0.82 : 0.90})`);
    root.style.setProperty('--rinno-component-border', `1px solid rgba(${theme.shadow}, ${theme.dark ? 0.24 : 0.085})`);
    root.style.setProperty('--rinno-component-highlight', `1px solid rgba(${theme.glassTint}, ${theme.dark ? 0.18 : 0.72})`);
    root.style.setProperty('--rinno-component-shadow', `0 10px 24px rgba(${theme.shadow}, ${theme.dark ? 0.22 : 0.065})`);
    root.style.setProperty('--rinno-component-shadow-soft', `0 5px 14px rgba(${theme.shadow}, ${theme.dark ? 0.18 : 0.052})`);
    root.style.setProperty('--rinno-component-line', `rgba(${theme.shadow}, ${theme.dark ? 0.26 : 0.10})`);
    root.style.setProperty('--glass-bg', 'var(--rinno-component-surface)');
    root.style.setProperty('--glass-border', 'var(--rinno-component-border)');
    root.style.setProperty('--glass-shadow', 'var(--rinno-component-shadow)');
    root.style.setProperty('--style-glass-bg', 'var(--rinno-component-surface)');
    root.style.setProperty('--style-glass-border', 'var(--rinno-component-border)');
    root.style.setProperty('--rinno-app-icon-surface', 'linear-gradient(to bottom, rgba(255, 255, 255, 0.42), rgba(255, 255, 255, 0.22))');
    root.style.setProperty('--rinno-app-icon-border', '1px solid rgba(255, 255, 255, 0.46)');
    root.style.setProperty('--rinno-app-icon-shadow', '0 4px 10px rgba(0, 0, 0, 0.05)');
    root.style.setProperty('--style-icon-surface', 'var(--rinno-app-icon-surface)');
    root.style.setProperty('--style-control-shadow', `0 12px 30px rgba(${theme.shadow}, ${theme.dark ? 0.16 : 0.058})`);
    root.style.setProperty('--style-theme-wash', `radial-gradient(ellipse 140% 88% at 12% -4%, rgba(${accentRgb}, ${theme.dark ? 0.18 : 0.22}) 0 28%, transparent 72%), radial-gradient(ellipse 120% 84% at 96% 8%, rgba(${accentSoftRgb}, ${theme.dark ? 0.10 : 0.34}) 0 34%, transparent 82%)`);
    root.style.setProperty('--style-app-bg', `var(--style-theme-wash), linear-gradient(180deg, ${theme.surface} 0%, ${theme.bg} 56%, ${theme.surface} 100%)`);
    root.style.setProperty('--style-app-top-bg', `rgba(${accentSoftRgb}, ${theme.dark ? 0.18 : 0.22})`);
    root.style.setProperty('--style-card-bg', `linear-gradient(180deg, rgba(${theme.glassTint}, ${theme.dark ? 0.18 : 0.78}), rgba(${theme.glassTint}, ${theme.dark ? 0.08 : 0.48}))`);
    root.style.setProperty('--style-soft-card-bg', `linear-gradient(135deg, rgba(${accentSoftRgb}, ${theme.dark ? 0.12 : 0.54}), rgba(${theme.glassTint}, ${theme.dark ? 0.08 : 0.68}))`);
    root.style.setProperty('--style-primary-bg', `linear-gradient(135deg, rgba(${theme.glassTint}, ${theme.dark ? 0.26 : 0.94}), rgba(${accentRgb}, ${theme.dark ? 0.16 : 0.28}))`);
    root.style.setProperty('--style-line-color', `rgba(${accentStrongRgb}, ${theme.dark ? 0.28 : 0.24})`);
    root.style.setProperty('--style-faint-line-color', `rgba(${accentStrongRgb}, ${theme.dark ? 0.18 : 0.14})`);
    root.style.setProperty('--style-primary-text', theme.dark ? theme.text : '#2b2730');
    document.body.classList.toggle('style-theme-dark', Boolean(theme.dark));
}

function applyStyleTypography() {
    const root = document.documentElement;
    const fontStack = getStyleFontStack(styleState.fontFamily);
    applyStyleFontFaces();
    root.style.setProperty('--font-family', fontStack);
    root.style.setProperty('--style-global-font-family', fontStack);
    root.style.setProperty('--style-font-size-px', `${styleState.fontSize}px`);
    root.style.setProperty('--style-font-size-scale', String(styleState.fontSize / STYLE_FONT_BASE_PX));
    root.style.setProperty('--style-font-weight', String(styleState.fontWeight));
    root.style.setProperty('--style-ui-scale', String(styleState.uiScale / 100));
}

function applyStyleShape() {
    const root = document.documentElement;
    const radius = Number(styleState.radius);
    const appRadius = Number(styleState.appRadius);
    root.style.setProperty('--radius-lg', `${radius}px`);
    root.style.setProperty('--radius-md', `${Math.max(8, Math.round(radius * 0.72))}px`);
    root.style.setProperty('--radius-sm', `${Math.max(6, Math.round(radius * 0.48))}px`);
    root.style.setProperty('--style-app-radius', `${appRadius}px`);
    root.style.setProperty('--style-app-name-color', styleState.appNameColor);
}

function applyStyleWallpaper() {
    const root = document.documentElement;
    const lock = getWallpaperLayer('lock');
    const desktop = getWallpaperLayer('desktop');
    root.style.setProperty('--style-lock-wallpaper', lock);
    root.style.setProperty('--style-desktop-wallpaper', desktop);
    root.style.setProperty('--style-lock-preview-bg', lock);
    root.style.setProperty('--style-desktop-preview-bg', desktop);
    root.style.setProperty('--style-lock-wallpaper-size', styleState.lockWallpaper ? 'cover, cover' : 'cover');
    root.style.setProperty('--style-desktop-wallpaper-size', styleState.desktopWallpaper ? 'auto, cover' : 'cover');
}

function getStyleAppName(app) {
    return (app?.querySelector?.('.app-name')?.textContent || '').trim()
        || app?.getAttribute?.('data-open-app')
        || '未命名应用';
}

function getStyleAppLauncher(app) {
    return String(app?.getAttribute?.('data-open-app') || '').trim();
}

function getStyleAppLayoutId(app) {
    return String(app?.getAttribute?.('data-iid') || '').trim();
}

function getStyleAppCoverAliases(app) {
    const name = getStyleAppName(app);
    const launcher = getStyleAppLauncher(app);
    const layoutId = getStyleAppLayoutId(app);
    const aliases = [];
    if (layoutId) aliases.push(`iid:${layoutId}`);
    if (launcher && name) aliases.push(`${launcher}:${name}`);
    if (name) aliases.push(`name:${name}`);
    return Array.from(new Set(aliases.filter(Boolean)));
}

function getStyleAppCoverKey(app) {
    return getStyleAppCoverAliases(app)[0] || '';
}

function resolveStyleAppCoverEntry(app, covers = styleState.appIconCovers) {
    const aliases = getStyleAppCoverAliases(app);
    const map = covers && typeof covers === 'object' ? covers : {};
    for (const key of aliases) {
        const cover = String(map[key] || '').trim();
        if (cover) {
            return {
                key,
                cover,
                aliases
            };
        }
    }
    return {
        key: aliases[0] || '',
        cover: '',
        aliases
    };
}

function clearStyleAppIconCoverElement(app, icon) {
    app.classList.remove('style-icon-cover');
    app.removeAttribute('data-style-app-cover-invalid');
    app.removeAttribute('data-style-app-cover-loading');
    app.removeAttribute('data-style-app-cover-ready');
    app.style.removeProperty('--style-app-icon-cover');
    if (!icon) return;
    icon.style.removeProperty('--style-app-icon-cover');
    icon.style.removeProperty('background-image');
    icon.style.removeProperty('background-size');
    icon.style.removeProperty('background-position');
    icon.style.removeProperty('background-repeat');
}

function paintStyleAppIconCoverElement(app, icon, coverUrl) {
    if (!icon) return;
    app.classList.add('style-icon-cover');
    app.removeAttribute('data-style-app-cover-invalid');
    app.removeAttribute('data-style-app-cover-loading');
    app.setAttribute('data-style-app-cover-ready', 'true');
    app.style.setProperty('--style-app-icon-cover', coverUrl);
    icon.style.setProperty('--style-app-icon-cover', coverUrl);
    icon.style.setProperty('background-image', `${coverUrl}, var(--rinno-app-icon-surface)`);
    icon.style.setProperty('background-size', 'contain, cover');
    icon.style.setProperty('background-position', 'center, center');
    icon.style.setProperty('background-repeat', 'no-repeat, no-repeat');
}

function validateStyleAppCoverSource(source = '') {
    const normalized = String(source || '').trim();
    if (!normalized) return Promise.resolve(false);
    if (styleAppCoverValidationCache.has(normalized)) {
        return Promise.resolve(Boolean(styleAppCoverValidationCache.get(normalized)));
    }
    if (styleAppCoverValidationRequests.has(normalized)) {
        return styleAppCoverValidationRequests.get(normalized);
    }

    const request = new Promise(resolve => {
        const image = new Image();
        let settled = false;
        const finish = valid => {
            if (settled) return;
            settled = true;
            styleAppCoverValidationCache.set(normalized, Boolean(valid));
            styleAppCoverValidationRequests.delete(normalized);
            resolve(Boolean(valid));
        };
        image.onload = () => finish(Boolean(image.naturalWidth && image.naturalHeight));
        image.onerror = () => finish(false);
        image.decoding = 'async';
        image.src = normalized;
        if (image.complete) {
            finish(Boolean(image.naturalWidth && image.naturalHeight));
            return;
        }
        window.setTimeout(() => {
            finish(Boolean(image.complete && image.naturalWidth && image.naturalHeight));
        }, 5000);
    });

    styleAppCoverValidationRequests.set(normalized, request);
    return request;
}

function applyStyleAppIconCoverToElement(app, cover = '') {
    if (!(app instanceof Element)) return;
    const icon = app.querySelector('.app-icon');
    const normalizedCover = String(cover || '').trim();
    const token = (styleAppCoverValidationTokens.get(app) || 0) + 1;
    styleAppCoverValidationTokens.set(app, token);

    if (!normalizedCover) {
        clearStyleAppIconCoverElement(app, icon);
        return;
    }

    const coverUrl = cssUrl(normalizedCover);
    const cachedValidity = styleAppCoverValidationCache.get(normalizedCover);
    if (cachedValidity === true) {
        paintStyleAppIconCoverElement(app, icon, coverUrl);
        return;
    }
    if (cachedValidity === false) {
        clearStyleAppIconCoverElement(app, icon);
        app.setAttribute('data-style-app-cover-invalid', 'true');
        return;
    }

    clearStyleAppIconCoverElement(app, icon);
    app.setAttribute('data-style-app-cover-loading', 'true');
    void validateStyleAppCoverSource(normalizedCover).then(valid => {
        if (styleAppCoverValidationTokens.get(app) !== token) return;
        if (valid) {
            paintStyleAppIconCoverElement(app, icon, coverUrl);
            return;
        }
        clearStyleAppIconCoverElement(app, icon);
        app.setAttribute('data-style-app-cover-invalid', 'true');
    });
}

function applyStyleIconCover() {
    const root = document.documentElement;
    root.style.setProperty('--style-app-icon-cover', 'none');
    document.body.classList.remove('style-icon-cover');
    const nextCovers = { ...styleState.appIconCovers };
    const coverFrequency = new Map();
    Object.values(nextCovers).forEach(value => {
        const cover = String(value || '').trim();
        if (!cover) return;
        coverFrequency.set(cover, (coverFrequency.get(cover) || 0) + 1);
    });
    let dominantCover = '';
    let dominantCoverCount = 0;
    coverFrequency.forEach((count, cover) => {
        if (count > dominantCoverCount) {
            dominantCover = cover;
            dominantCoverCount = count;
        }
    });
    let migrated = false;
    document.querySelectorAll('.app-wrapper').forEach(app => {
        const resolved = resolveStyleAppCoverEntry(app, nextCovers);
        const name = getStyleAppName(app);
        const shouldInheritDominantCover = !resolved.cover
            && dominantCover
            && ['稚序', '墨卷', '图匣'].includes(name);
        if (shouldInheritDominantCover && resolved.key) {
            nextCovers[resolved.key] = dominantCover;
            resolved.cover = dominantCover;
            migrated = true;
        }
        if (resolved.cover && resolved.key && nextCovers[resolved.key] !== resolved.cover) {
            nextCovers[resolved.key] = resolved.cover;
            migrated = true;
        }
        if (resolved.cover) {
            resolved.aliases.forEach(alias => {
                if (alias !== resolved.key && nextCovers[alias] === resolved.cover) {
                    delete nextCovers[alias];
                    migrated = true;
                }
            });
        }
        applyStyleAppIconCoverToElement(app, resolved.cover);
    });
    if (migrated) {
        styleState = coerceStyleState({ ...styleState, appIconCovers: nextCovers });
        saveStyleState();
    }
}

function applyStyleDatasets() {
    const styleApp = document.getElementById('style-app');
    if (styleApp) {
        styleApp.dataset.theme = styleState.theme;
        styleApp.dataset.wallpaper = styleState.wallpaper;
        styleApp.dataset.icons = styleState.iconStyle;
        styleApp.dataset.page = styleState.pagePreset;
    }

    document.body.dataset.styleIcon = styleState.iconStyle;
    document.body.dataset.stylePagePreset = styleState.pagePreset;
    document.body.removeAttribute('data-style-device-shell');
    document.body.removeAttribute('data-style-preview-shell');
    Array.from(document.body.attributes).forEach(attribute => {
        if (attribute.name.startsWith('data-style-hide-')) document.body.removeAttribute(attribute.name);
    });
    Object.keys(STYLE_DEFAULT_STATE.hidden).forEach(key => {
        document.body.setAttribute(`data-style-hide-${key}`, String(Boolean(styleState.hidden[key])));
    });
}

function applyStyleCustomCss() {
    getCustomStyleElement().textContent = styleState.customCss || '';
}

function applyStyleState() {
    applyStyleTheme();
    applyStyleShape();
    applyStyleTypography();
    applyStyleWallpaper();
    applyStyleIconCover();
    applyStyleDatasets();
    applyStyleCustomCss();
}

const STYLE_DESKTOP_COVER_LABELS = {
    profile_card_cover: '资料卡封面',
    profile_card_avatar: '资料卡头像',
    dream_card_background: '叠卡背景',
    dream_card_image: '叠卡图片',
    dual_avatar_left: '左侧头像',
    dual_avatar_right: '右侧头像',
    sun_card_avatar: 'Sun 头像',
    mock_chat_image: '聊天图片',
    settings_cover: '设置封面',
    badge_pin_image: '吧唧图片',
    love_note_avatar: '便签头像',
    vinyl_disc_photo: '黑胶图片',
    capsule_list_img_a: '胶囊图片 A',
    capsule_list_img_b: '胶囊图片 B',
    weather_polaroid_photo: '拍立得图片',
    snow_heart_photo: '爱心拍立得图片',
    camera_disc_body_photo: '相机封面',
    camera_disc_photo: '相机镜头图片',
    mood_bento_note_photo: '暖心便签图片',
    mood_bento_sheet_photo: '暖心纸页图片',
    profile_receipt_card_avatar: '主页档案卡头像',
    profile_receipt_avatar: '主页档案头像',
    moment_gallery_avatar: '动态相册头像',
    moment_gallery_photo_a: '动态相册图片 A',
    moment_gallery_photo_b: '动态相册图片 B',
    moment_gallery_photo_c: '动态相册图片 C'
};

const STYLE_LEGACY_DESKTOP_COVER_IDS = {
    bg1: 'profile_card_cover',
    av1: 'profile_card_avatar',
    bg2: 'dream_card_background',
    av2: 'dream_card_image',
    av3: 'dual_avatar_left',
    av4: 'dual_avatar_right',
    av5: 'sun_card_avatar',
    av6: 'mock_chat_image'
};

let pendingStyleCoverTarget = '';
let pendingStyleAppCoverTarget = '';

function getStyleEditIdAliases(editId) {
    const id = String(editId || '');
    const aliases = new Set([id]);
    if (STYLE_LEGACY_DESKTOP_COVER_IDS[id]) aliases.add(STYLE_LEGACY_DESKTOP_COVER_IDS[id]);
    Object.entries(STYLE_LEGACY_DESKTOP_COVER_IDS).forEach(([legacyId, currentId]) => {
        if (currentId === id) aliases.add(legacyId);
    });
    return Array.from(aliases).filter(Boolean);
}

function getStyleEditElements(editId) {
    if (!editId) return [];
    return getStyleEditIdAliases(editId).flatMap(id =>
        Array.from(document.querySelectorAll(`[data-edit-id="${styleCssEscape(id)}"]`))
    );
}

function applyStyleEditableImage(el, content = '') {
    if (!(el instanceof Element)) return;
    const helper = window.applyRinnoEditableImageContent;
    if (typeof helper === 'function') {
        helper(el, content);
        return;
    }

    const nextContent = String(content || '').trim();
    if (nextContent) {
        el.style.backgroundImage = `url("${nextContent}")`;
        el.style.backgroundSize = 'cover';
        el.style.backgroundPosition = 'center center';
        el.style.backgroundRepeat = 'no-repeat';
        el.classList.add('rinno-has-custom-image');
        return;
    }

    el.style.removeProperty('background-image');
    el.style.removeProperty('background-size');
    el.style.removeProperty('background-position');
    el.style.removeProperty('background-repeat');
    el.classList.remove('rinno-has-custom-image');
}

function getStyleCoverTitle(el, editId) {
    if (STYLE_DESKTOP_COVER_LABELS[editId]) return STYLE_DESKTOP_COVER_LABELS[editId];
    const component = el.closest('[data-component-kind]');
    if (component?.dataset.componentKind) return component.dataset.componentKind.replace(/-/g, ' ');
    const block = el.closest('#slider > .page > [data-iid]');
    if (block?.getAttribute('data-iid')) return block.getAttribute('data-iid').replace(/^panel-/, '').replace(/-/g, ' ');
    return editId.replace(/_/g, ' ');
}

function getStyleDesktopCoverSlots() {
    const seen = new Set();
    return Array.from(document.querySelectorAll('#slider [data-edit-type="image"][data-edit-id]'))
        .map(el => {
            const editId = el.getAttribute('data-edit-id') || '';
            if (!editId || seen.has(editId)) return null;
            seen.add(editId);
            const backgroundImage = el.classList.contains('rinno-has-custom-image')
                ? (el.style.backgroundImage || '')
                : '';
            return {
                editId,
                title: getStyleCoverTitle(el, editId),
                backgroundImage
            };
        })
        .filter(Boolean);
}

async function saveStyleDesktopCover(editId, content) {
    getStyleEditElements(editId).forEach(el => {
        applyStyleEditableImage(el, content);
    });
    const saver = window.saveEdit || (typeof saveEdit === 'function' ? saveEdit : null);
    if (typeof saver === 'function') {
        await saver(editId, content, 'image');
        return;
    }
    if (typeof db !== 'undefined' && db?.edits) {
        await db.edits.put({ id: editId, content, type: 'image' });
    }
}

async function deleteStyleDesktopCover(editId) {
    getStyleEditElements(editId).forEach(el => {
        applyStyleEditableImage(el, '');
    });
    try {
        if (typeof db !== 'undefined' && db?.edits?.delete) {
            for (const id of getStyleEditIdAliases(editId)) await db.edits.delete(id);
        } else if (typeof db !== 'undefined' && db?.edits?.toArray && db?.edits?.clear && db?.edits?.bulkPut) {
            const records = await db.edits.toArray();
            await db.edits.clear();
            const aliases = new Set(getStyleEditIdAliases(editId));
            await db.edits.bulkPut(records.filter(record => !aliases.has(record?.id)));
        }
    } catch (error) {
        console.warn('桌面封面重置失败:', error);
    }
}

async function replaceStyleDesktopCovers(target, file) {
    const content = await readStyleFileAsDataUrl(file);
    if (!content) return;
    const slots = target === 'all'
        ? getStyleDesktopCoverSlots()
        : getStyleDesktopCoverSlots().filter(slot => slot.editId === target);
    for (const slot of slots) {
        await saveStyleDesktopCover(slot.editId, content);
    }
    renderStyleCoverManager();
}

async function resetStyleDesktopCovers(target) {
    const slots = target === 'all'
        ? getStyleDesktopCoverSlots()
        : getStyleDesktopCoverSlots().filter(slot => slot.editId === target);
    for (const slot of slots) {
        await deleteStyleDesktopCover(slot.editId);
    }
    renderStyleCoverManager();
}

function renderStyleCoverManager() {
    const list = document.getElementById('style-desktop-cover-list');
    if (!list) return;
    const slots = getStyleDesktopCoverSlots();
    list.innerHTML = '';
    if (!slots.length) {
        list.innerHTML = '<div class="style-cover-empty">当前桌面没有可替换的图片位。</div>';
        return;
    }
    slots.forEach(slot => {
        const row = document.createElement('article');
        row.className = 'style-cover-row';
        const thumb = document.createElement('span');
        thumb.className = 'style-cover-thumb';
        if (slot.backgroundImage) thumb.style.backgroundImage = slot.backgroundImage;
        const copy = document.createElement('span');
        copy.className = 'style-cover-copy';
        copy.innerHTML = `<span class="style-cover-title">${styleEscapeHtml(slot.title)}</span><span class="style-cover-meta">${styleEscapeHtml(slot.editId)}</span>`;
        const actions = document.createElement('span');
        actions.className = 'style-cover-actions';
        actions.innerHTML = `
            <button class="style-cover-action interactive" type="button" data-style-cover-replace="${styleEscapeHtml(slot.editId)}" aria-label="更换${styleEscapeHtml(slot.title)}" title="更换">
                <svg viewBox="0 0 24 24"><path d="M4.5 8.2h3.8L9.9 6h4.2l1.6 2.2h3.8c.9 0 1.6.7 1.6 1.6v7.7c0 .9-.7 1.6-1.6 1.6h-15c-.9 0-1.6-.7-1.6-1.6V9.8c0-.9.7-1.6 1.6-1.6Z"/><circle cx="12" cy="13.6" r="3.4"/></svg>
            </button>
            <button class="style-cover-action interactive" type="button" data-style-cover-reset="${styleEscapeHtml(slot.editId)}" aria-label="重置${styleEscapeHtml(slot.title)}" title="重置">
                <svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 0 1 15.5-6.2"/><path d="M18 6h3V3"/><path d="M21 12a9 9 0 0 1-15.5 6.2"/><path d="M6 18H3v3"/></svg>
            </button>
        `;
        row.append(thumb, copy, actions);
        list.appendChild(row);
    });
}

function getStyleAppCoverSlots() {
    const seen = new Set();
    return Array.from(document.querySelectorAll('.app-wrapper'))
        .map(app => {
            const resolved = resolveStyleAppCoverEntry(app);
            const key = resolved.key;
            if (!key || seen.has(key)) return null;
            seen.add(key);
            const name = getStyleAppName(app);
            const launcher = getStyleAppLauncher(app);
            return {
                key,
                name,
                meta: launcher || getStyleAppLayoutId(app) || key.replace(/^name:/, ''),
                cover: resolved.cover
            };
        })
        .filter(Boolean);
}

function setStyleAppCovers(target, content = '') {
    const nextCovers = { ...styleState.appIconCovers };
    const slots = target === 'all'
        ? getStyleAppCoverSlots()
        : getStyleAppCoverSlots().filter(slot => slot.key === target);
    if (target !== 'all' && !slots.length) {
        const safeTarget = String(target || '').trim();
        if (safeTarget) {
            if (content) nextCovers[safeTarget] = content;
            else delete nextCovers[safeTarget];
        }
    }
    slots.forEach(slot => {
        if (content) nextCovers[slot.key] = content;
        else delete nextCovers[slot.key];
    });
    updateStyleState({
        appIconCover: target === 'all' ? '' : styleState.appIconCover,
        appIconCovers: nextCovers
    });
}

async function replaceStyleAppCovers(target, file) {
    const content = await readStyleAppIconCoverFile(file);
    if (!content) return;
    setStyleAppCovers(target, content);
}

function resetStyleAppCovers(target) {
    setStyleAppCovers(target, '');
}

function renderStyleAppCoverManager() {
    const list = document.getElementById('style-app-cover-list');
    if (!list) return;
    const slots = getStyleAppCoverSlots();
    list.innerHTML = '';
    if (!slots.length) {
        list.innerHTML = '<div class="style-cover-empty">当前桌面没有可更换封面的应用。</div>';
        return;
    }
    slots.forEach(slot => {
        const row = document.createElement('article');
        row.className = 'style-cover-row';
        const thumb = document.createElement('span');
        thumb.className = 'style-cover-thumb';
        if (slot.cover) thumb.style.backgroundImage = cssUrl(slot.cover);
        const copy = document.createElement('span');
        copy.className = 'style-cover-copy';
        copy.innerHTML = `<span class="style-cover-title">${styleEscapeHtml(slot.name)}</span><span class="style-cover-meta">${styleEscapeHtml(slot.meta)}</span>`;
        const actions = document.createElement('span');
        actions.className = 'style-cover-actions';
        actions.innerHTML = `
            <button class="style-cover-action interactive" type="button" data-style-app-cover-replace="${styleEscapeHtml(slot.key)}" aria-label="更换${styleEscapeHtml(slot.name)}图标封面" title="更换">
                <svg viewBox="0 0 24 24"><path d="M4.5 8.2h3.8L9.9 6h4.2l1.6 2.2h3.8c.9 0 1.6.7 1.6 1.6v7.7c0 .9-.7 1.6-1.6 1.6h-15c-.9 0-1.6-.7-1.6-1.6V9.8c0-.9.7-1.6 1.6-1.6Z"/><circle cx="12" cy="13.6" r="3.4"/></svg>
            </button>
            <button class="style-cover-action interactive" type="button" data-style-app-cover-reset="${styleEscapeHtml(slot.key)}" aria-label="重置${styleEscapeHtml(slot.name)}图标封面" title="重置">
                <svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 0 1 15.5-6.2"/><path d="M18 6h3V3"/><path d="M21 12a9 9 0 0 1-15.5 6.2"/><path d="M6 18H3v3"/></svg>
            </button>
        `;
        row.append(thumb, copy, actions);
        list.appendChild(row);
    });
}

function getStyleFontChoices() {
    const builtinChoices = STYLE_BUILTIN_FONTS.map(font => ({
        ...font,
        previewFamily: getStyleFontStack(font.value),
        removeId: ''
    }));
    const customChoices = styleState.customFonts.map(font => ({
        value: `custom:${font.id}`,
        label: font.name,
        meta: font.kind === 'url' ? 'URL 字体' : '本地上传',
        sample: font.sample || '把喜欢写成自己想要的样子',
        previewFamily: getStyleFontStack(`custom:${font.id}`),
        removeId: font.id
    }));
    return [...builtinChoices, ...customChoices];
}

function renderStyleFontOptions() {
    const grid = document.getElementById('style-font-grid');
    if (!grid) return;
    const activeValue = String(styleState.fontFamily || '');
    grid.innerHTML = '';
    getStyleFontChoices().forEach(choice => {
        const card = document.createElement('article');
        const active = activeValue === choice.value;
        card.className = `style-font-card${active ? ' active' : ''}`;
        card.innerHTML = `
            <button
                class="style-font-card-hit interactive${active ? ' active' : ''}"
                type="button"
                data-style-choice
                data-style-group="fontFamily"
                data-style-value="${styleEscapeHtml(choice.value)}"
                style="--style-font-preview-family: ${styleEscapeHtml(choice.previewFamily)};"
                aria-pressed="${active ? 'true' : 'false'}"
            >
                <span class="style-font-card-top">
                    <span class="style-font-card-name">${styleEscapeHtml(choice.label)}</span>
                    <span class="style-font-card-note">${styleEscapeHtml(choice.meta)}</span>
                </span>
                <span class="style-font-card-sample">${styleEscapeHtml(choice.sample)}</span>
                <span class="style-font-card-meta">${styleEscapeHtml(choice.value)}</span>
            </button>
            ${choice.removeId ? `
                <button
                    class="style-font-card-remove interactive"
                    type="button"
                    data-style-font-remove="${styleEscapeHtml(choice.removeId)}"
                    aria-label="删除 ${styleEscapeHtml(choice.label)}"
                    title="删除字体"
                >
                    <svg viewBox="0 0 24 24"><path d="M6 12h12"/><path d="M9 6h6"/><path d="M8 6h8l-1 12H9L8 6Z"/></svg>
                </button>
            ` : ''}
        `;
        grid.appendChild(card);
    });
}

function clearStyleFontDraft() {
    const nameInput = document.getElementById('style-font-custom-name');
    const urlInput = document.getElementById('style-font-custom-url');
    if (nameInput) nameInput.value = '';
    if (urlInput) urlInput.value = '';
}

function createStyleFontRecord(source, options = {}) {
    const rawName = String(options.name || '').trim();
    const fallbackName = options.fallbackName || '自定义字体';
    const name = (rawName || fallbackName).slice(0, 32);
    return {
        id: createStyleCustomFontId(name),
        name,
        source: String(source || '').trim(),
        kind: options.kind === 'url' ? 'url' : 'upload',
        sample: String(options.sample || '把喜欢写成自己想要的样子').trim().slice(0, 40) || '把喜欢写成自己想要的样子'
    };
}

function upsertStyleCustomFont(record) {
    const nextFonts = normalizeStyleCustomFonts([...styleState.customFonts, record]);
    updateStyleState({
        customFonts: nextFonts,
        fontFamily: `custom:${record.id}`
    });
}

function removeStyleCustomFont(fontId) {
    const normalizedId = String(fontId || '').trim();
    if (!normalizedId) return;
    const nextFonts = styleState.customFonts.filter(font => font?.id !== normalizedId);
    const nextFontFamily = styleState.fontFamily === `custom:${normalizedId}`
        ? STYLE_DEFAULT_STATE.fontFamily
        : styleState.fontFamily;
    updateStyleState({
        customFonts: nextFonts,
        fontFamily: nextFontFamily
    });
}

async function addStyleCustomFontFromFile(file, preferredName = '') {
    if (!file) return;
    const source = await readStyleFileAsDataUrl(file);
    if (!source) return;
    const fallbackName = String(file.name || '自定义字体').replace(/\.[^.]+$/, '') || '自定义字体';
    const record = createStyleFontRecord(source, {
        name: preferredName,
        fallbackName,
        kind: 'upload'
    });
    upsertStyleCustomFont(record);
    clearStyleFontDraft();
}

function addStyleCustomFontFromUrl(url, preferredName = '') {
    const source = String(url || '').trim();
    if (!/^https?:\/\//i.test(source)) return;
    const fallbackName = decodeURIComponent(source.split('/').pop() || 'URL 字体')
        .replace(/\?.*$/, '')
        .replace(/\.[^.]+$/, '')
        || 'URL 字体';
    const record = createStyleFontRecord(source, {
        name: preferredName,
        fallbackName,
        kind: 'url'
    });
    upsertStyleCustomFont(record);
    clearStyleFontDraft();
}

function renderStyleControls() {
    const theme = STYLE_THEMES[styleState.theme] || STYLE_THEMES.rose;
    const styleApp = document.getElementById('style-app');
    renderStyleFontOptions();

    document.querySelectorAll('[data-style-choice]').forEach(button => {
        const group = button.getAttribute('data-style-group');
        const value = button.getAttribute('data-style-value');
        const activeValue = group === 'theme'
            ? styleState.theme
            : group === 'wallpaper'
                ? styleState.wallpaper
                : group === 'iconStyle'
                    ? styleState.iconStyle
                    : group === 'fontFamily'
                        ? styleState.fontFamily
                        : group === 'pagePreset'
                        ? styleState.pagePreset
                        : '';
        const isActive = Boolean(value && activeValue === value);
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        button.closest('.style-font-card')?.classList.toggle('active', isActive);
    });

    const setValue = (id, value) => {
        const input = document.getElementById(id);
        if (input && input.value !== String(value)) input.value = String(value);
    };
    setValue('style-radius-scale', styleState.radius);
    setValue('style-app-radius-scale', styleState.appRadius);
    setValue('style-app-name-color', styleState.appNameColor);
    setValue('style-font-size-scale', styleState.fontSize);
    setValue('style-font-weight', styleState.fontWeight);
    setValue('style-ui-scale', styleState.uiScale);

    const cssEditor = document.getElementById('style-custom-css');
    if (cssEditor && cssEditor.value !== styleState.customCss) cssEditor.value = styleState.customCss;

    const updateText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };
    updateText('style-theme-status', theme.label);
    updateText('style-radius-value', `${styleState.radius}px`);
    updateText('style-app-radius-value', `${styleState.appRadius}px`);
    updateText('style-font-size-value', `${styleState.fontSize}px`);
    updateText('style-font-weight-value', String(styleState.fontWeight));
    updateText('style-ui-scale-value', `${styleState.uiScale}%`);
    updateText('style-font-family-value', getStyleFontLabel(styleState.fontFamily));
    updateText('style-scale-status', `${styleState.fontSize}px / ${styleState.uiScale}%`);

    document.querySelectorAll('[data-style-hide]').forEach(button => {
        const key = button.getAttribute('data-style-hide');
        const active = Boolean(styleState.hidden[key]);
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    const coverPreview = document.getElementById('style-icon-cover-preview');
    if (coverPreview) {
        coverPreview.style.backgroundImage = styleState.appIconCover ? cssUrl(styleState.appIconCover) : '';
        coverPreview.classList.toggle('empty', !styleState.appIconCover);
    }

    if (styleApp) styleApp.style.setProperty('--style-current-accent', theme.accent);
}

function renderStyleState() {
    applyStyleState();
    renderStyleControls();
    renderStyleAppCoverManager();
    renderStyleCoverManager();
}

function openStyleSubpage(sectionName) {
    const styleApp = document.getElementById('style-app');
    if (!styleApp || !sectionName) return;
    const target = styleApp.querySelector(`[data-style-section="${sectionName}"]`);
    if (!target) return;
    styleApp.querySelectorAll('.style-subpage').forEach(section => {
        const active = section === target;
        section.hidden = !active;
        section.classList.toggle('active', active);
        section.setAttribute('aria-hidden', active ? 'false' : 'true');
    });
    document.getElementById('style-main-view')?.setAttribute('aria-hidden', 'true');
    styleApp.classList.add('subpage-active');
    styleApp.scrollTop = 0;
}

function closeStyleSubpage() {
    const styleApp = document.getElementById('style-app');
    if (!styleApp) return;
    styleApp.querySelectorAll('.style-subpage').forEach(section => {
        section.hidden = true;
        section.classList.remove('active');
        section.setAttribute('aria-hidden', 'true');
    });
    document.getElementById('style-main-view')?.setAttribute('aria-hidden', 'false');
    styleApp.classList.remove('subpage-active');
    styleApp.scrollTop = 0;
}

function updateStyleState(patch, shouldDebounce = false) {
    styleState = coerceStyleState({
        ...styleState,
        ...patch,
        hidden: patch.hidden ? { ...styleState.hidden, ...patch.hidden } : styleState.hidden
    });
    renderStyleState();
    if (shouldDebounce) scheduleStyleSave();
    else saveStyleState();
}

function setStyleChoice(group, value) {
    if (!group || !value) return;
    if (group === 'theme') updateStyleState({ theme: value });
    if (group === 'wallpaper') updateStyleState({ wallpaper: value });
    if (group === 'iconStyle') updateStyleState({ iconStyle: value });
    if (group === 'fontFamily' && isStyleFontValueAvailable(value)) updateStyleState({ fontFamily: value });
    if (group === 'pagePreset') updateStyleState({ pagePreset: value });
}

function readStyleFileAsDataUrl(file) {
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

function getStyleFileExtension(name = '') {
    const normalized = String(name || '').trim().toLowerCase();
    const dotIndex = normalized.lastIndexOf('.');
    return dotIndex >= 0 ? normalized.slice(dotIndex) : '';
}

function isStyleAppIconCoverFileSupported(file) {
    if (!file) return false;
    const fileType = String(file.type || '').trim().toLowerCase();
    const extension = getStyleFileExtension(file.name || '');
    return STYLE_APP_ICON_COVER_ALLOWED_TYPES.has(fileType) || STYLE_APP_ICON_COVER_ALLOWED_EXTENSIONS.has(extension);
}

function loadStyleImageElement(source = '') {
    const normalized = String(source || '').trim();
    return new Promise((resolve, reject) => {
        if (!normalized) {
            reject(new Error('Style image source is empty.'));
            return;
        }
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Style image failed to load.'));
        image.decoding = 'async';
        image.src = normalized;
    });
}

async function normalizeStyleAppIconCoverContent(content = '') {
    const normalized = String(content || '').trim();
    if (!normalized) return '';
    try {
        const image = await loadStyleImageElement(normalized);
        const maxEdge = 512;
        const sourceWidth = Math.max(1, image.naturalWidth || image.width || maxEdge);
        const sourceHeight = Math.max(1, image.naturalHeight || image.height || maxEdge);
        const scale = Math.min(maxEdge / sourceWidth, maxEdge / sourceHeight, 1);
        const drawWidth = Math.max(1, Math.round(sourceWidth * scale));
        const drawHeight = Math.max(1, Math.round(sourceHeight * scale));
        const canvas = document.createElement('canvas');
        canvas.width = maxEdge;
        canvas.height = maxEdge;
        const context = canvas.getContext('2d');
        if (!context) return normalized;
        context.clearRect(0, 0, maxEdge, maxEdge);
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        context.drawImage(
            image,
            Math.round((maxEdge - drawWidth) / 2),
            Math.round((maxEdge - drawHeight) / 2),
            drawWidth,
            drawHeight
        );
        return canvas.toDataURL('image/png');
    } catch (error) {
        console.warn('应用图标封面解析失败，已回退为原图标。', error);
        styleAppCoverValidationCache.set(normalized, false);
        return '';
    }
}

async function readStyleAppIconCoverFile(file) {
    if (!file) return '';
    if (!isStyleAppIconCoverFileSupported(file)) {
        if (typeof window.showPrivateSystemToast === 'function') {
            window.showPrivateSystemToast('应用图标仅支持 PNG / JPG / GIF。');
        }
        return '';
    }
    const content = await readStyleFileAsDataUrl(file);
    if (!content) return '';
    if (/^data:image\/gif(?:;|,)/i.test(content) || String(file.type || '').trim().toLowerCase() === 'image/gif') {
        return content;
    }
    return normalizeStyleAppIconCoverContent(content);
}

async function handleStyleImageInput(kind, file) {
    const content = await readStyleFileAsDataUrl(file);
    if (!content) return;
    if (kind === 'lockWallpaper') updateStyleState({ lockWallpaper: content });
    if (kind === 'desktopWallpaper') updateStyleState({ desktopWallpaper: content });
    if (kind === 'appIconCover') setStyleAppCovers('all', content);
}

function resetStyleWallpaper(kind) {
    if (kind === 'lockWallpaper') {
        updateStyleState({ lockWallpaper: '' });
        return;
    }
    if (kind === 'desktopWallpaper') {
        updateStyleState({ desktopWallpaper: '' });
        return;
    }
    updateStyleState({ lockWallpaper: '', desktopWallpaper: '', wallpaper: 'theme' });
}

function bindStyleControls() {
    if (document.documentElement.dataset.styleControlsReady === 'true') return;
    document.documentElement.dataset.styleControlsReady = 'true';

    document.addEventListener('click', event => {
        const target = event.target instanceof Element ? event.target : event.target?.parentElement;
        const fontRemove = target?.closest('[data-style-font-remove]');
        if (fontRemove) {
            event.preventDefault();
            removeStyleCustomFont(fontRemove.getAttribute('data-style-font-remove') || '');
            return;
        }

        if (target?.closest('#style-font-upload-trigger')) {
            event.preventDefault();
            document.getElementById('style-font-file-input')?.click();
            return;
        }

        if (target?.closest('#style-font-url-save')) {
            event.preventDefault();
            const name = document.getElementById('style-font-custom-name')?.value || '';
            const url = document.getElementById('style-font-custom-url')?.value || '';
            addStyleCustomFontFromUrl(url, name);
            return;
        }

        const choice = target?.closest('[data-style-choice]');
        if (choice) {
            event.preventDefault();
            setStyleChoice(choice.getAttribute('data-style-group'), choice.getAttribute('data-style-value'));
            return;
        }

        const entry = target?.closest('[data-style-entry]');
        if (entry) {
            event.preventDefault();
            openStyleSubpage(entry.getAttribute('data-style-entry'));
            return;
        }

        if (target?.closest('[data-style-back]')) {
            event.preventDefault();
            closeStyleSubpage();
            return;
        }

        const appCoverReplace = target?.closest('[data-style-app-cover-replace]');
        if (appCoverReplace) {
            event.preventDefault();
            pendingStyleAppCoverTarget = appCoverReplace.getAttribute('data-style-app-cover-replace') || '';
            document.getElementById('style-app-icon-cover-input')?.click();
            return;
        }

        const appCoverReset = target?.closest('[data-style-app-cover-reset]');
        if (appCoverReset) {
            event.preventDefault();
            resetStyleAppCovers(appCoverReset.getAttribute('data-style-app-cover-reset') || '');
            return;
        }

        if (target?.closest('#style-replace-all-app-covers')) {
            event.preventDefault();
            pendingStyleAppCoverTarget = 'all';
            document.getElementById('style-app-icon-cover-input')?.click();
            return;
        }

        if (target?.closest('#style-reset-all-app-covers')) {
            event.preventDefault();
            resetStyleAppCovers('all');
            return;
        }

        const coverReplace = target?.closest('[data-style-cover-replace]');
        if (coverReplace) {
            event.preventDefault();
            pendingStyleCoverTarget = coverReplace.getAttribute('data-style-cover-replace') || '';
            document.getElementById('style-desktop-cover-input')?.click();
            return;
        }

        const coverReset = target?.closest('[data-style-cover-reset]');
        if (coverReset) {
            event.preventDefault();
            resetStyleDesktopCovers(coverReset.getAttribute('data-style-cover-reset') || '');
            return;
        }

        if (target?.closest('#style-replace-all-covers')) {
            event.preventDefault();
            pendingStyleCoverTarget = 'all';
            document.getElementById('style-desktop-cover-input')?.click();
            return;
        }

        if (target?.closest('#style-reset-all-covers')) {
            event.preventDefault();
            resetStyleDesktopCovers('all');
            return;
        }

        const wallpaperReset = target?.closest('[data-style-reset-wallpaper]');
        if (wallpaperReset) {
            event.preventDefault();
            event.stopPropagation();
            resetStyleWallpaper(wallpaperReset.getAttribute('data-style-reset-wallpaper') || '');
            return;
        }

        const upload = target?.closest('[data-style-upload]');
        if (upload) {
            event.preventDefault();
            const kind = upload.getAttribute('data-style-upload');
            if (kind === 'appIconCover') pendingStyleAppCoverTarget = 'all';
            const inputId = kind === 'lockWallpaper'
                ? 'style-lock-wallpaper-input'
                : kind === 'desktopWallpaper'
                    ? 'style-desktop-wallpaper-input'
                    : 'style-app-icon-cover-input';
            document.getElementById(inputId)?.click();
            return;
        }

        const hideToggle = target?.closest('[data-style-hide]');
        if (hideToggle) {
            event.preventDefault();
            const key = hideToggle.getAttribute('data-style-hide');
            updateStyleState({ hidden: { [key]: !styleState.hidden[key] } });
            return;
        }

        if (target?.closest('#style-reset-wallpapers')) {
            event.preventDefault();
            resetStyleWallpaper('all');
            return;
        }

        if (target?.closest('#style-reset-icon-cover')) {
            event.preventDefault();
            updateStyleState({ appIconCover: '', appIconCovers: {} });
            return;
        }

        if (target?.closest('#style-reset-css')) {
            event.preventDefault();
            updateStyleState({ customCss: STYLE_CUSTOM_CSS_TEMPLATE });
        }
    });

    document.getElementById('style-title')?.addEventListener('click', event => {
        event.preventDefault();
        closeStyleApp();
    });

    document.querySelectorAll('[data-style-entry]').forEach(entry => {
        entry.addEventListener('keydown', event => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            openStyleSubpage(entry.getAttribute('data-style-entry'));
        });
    });

    document.querySelectorAll('[data-style-upload]').forEach(upload => {
        upload.addEventListener('keydown', event => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            upload.click();
        });
    });

    const bindInput = (id, handler) => {
        document.getElementById(id)?.addEventListener('input', event => handler(event.target.value));
    };
    bindInput('style-radius-scale', value => updateStyleState({ radius: Number(value) }, true));
    bindInput('style-app-radius-scale', value => updateStyleState({ appRadius: Number(value) }, true));
    bindInput('style-app-name-color', value => updateStyleState({ appNameColor: value }, true));
    bindInput('style-font-size-scale', value => updateStyleState({ fontSize: Number(value) }, true));
    bindInput('style-font-weight', value => updateStyleState({ fontWeight: Number(value) }, true));
    bindInput('style-ui-scale', value => updateStyleState({ uiScale: Number(value) }, true));
    bindInput('style-custom-css', value => updateStyleState({ customCss: value }, true));

    [
        ['style-lock-wallpaper-input', 'lockWallpaper'],
        ['style-desktop-wallpaper-input', 'desktopWallpaper'],
        ['style-app-icon-cover-input', 'appIconCover']
    ].forEach(([id, kind]) => {
        document.getElementById(id)?.addEventListener('change', async event => {
            const file = event.target.files?.[0];
            event.target.value = '';
            try {
                if (kind === 'appIconCover' && pendingStyleAppCoverTarget) {
                    const target = pendingStyleAppCoverTarget;
                    pendingStyleAppCoverTarget = '';
                    await replaceStyleAppCovers(target, file);
                    return;
                }
                await handleStyleImageInput(kind, file);
            } catch (e) {
                console.error('风格图片读取失败:', e);
            }
        });
    });

    document.getElementById('style-desktop-cover-input')?.addEventListener('change', async event => {
        const file = event.target.files?.[0];
        event.target.value = '';
        const target = pendingStyleCoverTarget;
        pendingStyleCoverTarget = '';
        if (!file || !target) return;
        try {
            await replaceStyleDesktopCovers(target, file);
        } catch (e) {
            console.error('桌面封面读取失败:', e);
        }
    });

    document.getElementById('style-font-file-input')?.addEventListener('change', async event => {
        const file = event.target.files?.[0];
        const preferredName = document.getElementById('style-font-custom-name')?.value || '';
        event.target.value = '';
        try {
            await addStyleCustomFontFromFile(file, preferredName);
        } catch (error) {
            console.error('字体文件读取失败:', error);
        }
    });

    document.getElementById('style-font-custom-url')?.addEventListener('keydown', event => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        const name = document.getElementById('style-font-custom-name')?.value || '';
        addStyleCustomFontFromUrl(event.target.value, name);
    });
}

function openStyleApp() {
    const styleApp = document.getElementById('style-app');
    if (!styleApp) return;
    document.body.classList.remove('edit-mode');
    if (typeof closeSettingsApp === 'function') closeSettingsApp(true);
    if (typeof closeLetterApp === 'function') closeLetterApp(true);
    if (typeof closePrivateApp === 'function') closePrivateApp(true);
    if (typeof closePrologueApp === 'function') closePrologueApp(true);
    if (typeof closeCommunityApp === 'function') closeCommunityApp(true);
    if (typeof closeEncounterApp === 'function') closeEncounterApp(true);
    if (typeof closeDossierApp === 'function') closeDossierApp(true);
    if (typeof closeWanyeApp === 'function') closeWanyeApp(true);
    if (typeof closeLingguangApp === 'function') closeLingguangApp(true);
    if (typeof closeGuideApp === 'function') closeGuideApp(true);
    if (typeof closePhoneApp === 'function') closePhoneApp(true);
    renderStyleState();
    closeStyleSubpage();
    document.body.classList.add('style-open');
    styleApp.classList.add('active');
    styleApp.scrollTop = 0;
}

function closeStyleApp(instant = false) {
    const styleApp = document.getElementById('style-app');
    if (styleApp) {
        if (instant) {
            const previousTransition = styleApp.style.transition;
            styleApp.style.transition = 'none';
            styleApp.classList.remove('active');
            styleApp.offsetHeight;
            requestAnimationFrame(() => {
                styleApp.style.transition = previousTransition;
            });
        } else {
            styleApp.classList.remove('active');
        }
    }
    document.body.classList.remove('style-open');
    closeStyleSubpage();
}

bindStyleControls();
renderStyleState();
loadStyleState();
document.addEventListener('rinno:ready', () => {
    if (!Object.keys(styleState.appIconCovers || {}).length) return;
    applyStyleIconCover();
    renderStyleAppCoverManager();
});
