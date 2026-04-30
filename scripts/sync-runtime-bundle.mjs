import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const rootDir = process.cwd();
const bundlePath = path.join(rootDir, 'script.js');
const activationBootstrapTemplatePath = path.join(rootDir, 'scripts', 'public-bootstrap.template.js');
const layoutSourcePath = path.join(rootDir, 'app', 'desktop-layout-source.js');

const fallbackAppFragments = [
    'app/style/style.tpl',
    'app/settings/settings.tpl',
    'app/prologue/prologue.tpl',
    'app/private/private.tpl',
    'app/letter/letter.tpl',
    'app/community/community.tpl',
    'app/encounter/encounter.tpl',
    'app/dossier/dossier.tpl',
    'app/wanye/wanye.tpl',
    'app/lingguang/lingguang.tpl',
    'app/guide/guide.tpl',
    'app/zhenxuan/zhenxuan.tpl',
    'app/phone/phone.tpl',
    'app/assets/assets.tpl'
];

const fallbackAppScripts = [
    'app/private/private.js',
    'app/letter/letter.js',
    'app/settings/settings.js',
    'app/prologue/prologue.js',
    'app/style/style.js',
    'app/community/community.js',
    'app/dossier/dossier.js',
    'app/guide/guide.js',
    'app/zhenxuan/zhenxuan.js',
    'app/phone/phone.js',
    'app/assets/assets.js'
];

const appLauncherFnsMap = {
    letter: 'openLetterApp',
    settings: 'openSettingsApp',
    style: 'openStyleApp',
    private: 'openPrivateApp',
    prologue: 'openPrologueApp',
    community: 'openCommunityApp',
    encounter: 'openEncounterApp',
    dossier: 'openDossierApp',
    wanye: 'openWanyeApp',
    lingguang: 'openLingguangApp',
    fuyue: 'openFuyueApp',
    mijing: 'openMijingApp',
    shiguang: 'openShiguangApp',
    echo: 'openEchoApp',
    guide: 'openGuideApp',
    zhenxuan: 'openZhenxuanApp',
    phone: 'openPhoneApp',
    assets: 'openAssetsApp'
};

const appCloserFnsMap = {
    letter: 'closeLetterApp',
    settings: 'closeSettingsApp',
    style: 'closeStyleApp',
    private: 'closePrivateApp',
    prologue: 'closePrologueApp',
    community: 'closeCommunityApp',
    encounter: 'closeEncounterApp',
    dossier: 'closeDossierApp',
    wanye: 'closeWanyeApp',
    lingguang: 'closeLingguangApp',
    fuyue: 'closeFuyueApp',
    mijing: 'closeMijingApp',
    shiguang: 'closeShiguangApp',
    echo: 'closeEchoApp',
    guide: 'closeGuideApp',
    zhenxuan: 'closeZhenxuanApp',
    phone: 'closePhoneApp',
    assets: 'closeAssetsApp'
};

const appLauncherNamesMap = {
    '信笺': 'letter',
    '设置': 'settings',
    '风格': 'style',
    '私叙': 'private',
    '序章': 'prologue',
    '社区': 'community',
    '邂逅': 'encounter',
    '卷宗': 'dossier',
    '晚契': 'wanye',
    '翎光': 'lingguang',
    '翊光': 'lingguang',
    '指南': 'guide',
    '甄选': 'zhenxuan',
    '电话': 'phone',
    '资管': 'assets',
    '赴约': 'fuyue',
    '秘境': 'mijing',
    '拾光': 'shiguang',
    '回响': 'echo'
};

const appTitleCloseSelectorEntries = [
    ['#letter-title', 'letter'],
    ['#settings-title', 'settings'],
    ['#style-title', 'style'],
    ['#private-register-exit', 'private'],
    ['#prologue-close-title', 'prologue'],
    ['#encounter-close-title', 'encounter'],
    ['#dossier-close-title', 'dossier'],
    ['#wanye-close-title', 'wanye'],
    ['#lingguang-close-title', 'lingguang'],
    ['#fuyue-close-title', 'fuyue'],
    ['#mijing-close-title', 'mijing'],
    ['#shiguang-close-title', 'shiguang'],
    ['#echo-close-title', 'echo'],
    ['#guide-close-title', 'guide'],
    ['#zhenxuan-close-title', 'zhenxuan'],
    ['#phone-close-title', 'phone'],
    ['#assets-close-title', 'assets']
];

const bundleFallbackReplacements = [
    ['maxlength=\\"900\\"', ''],
    ['maxlength=\\"220\\"', ''],
    ['trim().slice(0, 900)', 'trim()'],
    ["setting: String(data.setting || data.note || '').trim().slice(0, 220)", "setting: String(data.setting || data.note || '').trim()"]
];

async function syncActivationBootstrap(bundleSource) {
    const anchor = bundleSource.indexOf('window.__rinnoActivationV2 = true;');
    const endMarker = "\n\n(() => {\n    const appRoot = document.getElementById('app-root');";
    const startIndex = anchor >= 0 ? bundleSource.lastIndexOf('(() => {', anchor) : -1;
    const endIndex = anchor >= 0 ? bundleSource.indexOf(endMarker, anchor) : -1;

    if (anchor < 0 || startIndex < 0 || endIndex < 0) {
        throw new Error(`Activation bootstrap block was not found in script.js (anchor=${anchor}, start=${startIndex}, end=${endIndex})`);
    }

    const templateSource = await fs.readFile(activationBootstrapTemplatePath, 'utf8');
    const patchedTemplateSource = templateSource.replace(
        "const AUTH_ENDPOINT = '/.netlify/functions/auth';",
        "const AUTH_ENDPOINT = window.__rinnoResolveLicenseApiUrl('/.netlify/functions/auth');"
    ).trimEnd();

    return `${bundleSource.slice(0, startIndex)}${patchedTemplateSource}${bundleSource.slice(endIndex)}`;
}

function escapeRegExp(value) {
    return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeSourceAsset(source) {
    return String(source || '').replace(/^\uFEFF/, '');
}

async function readSourceAsset(relativePath) {
    const sourcePath = path.join(rootDir, relativePath);
    return normalizeSourceAsset(await fs.readFile(sourcePath, 'utf8'));
}

function formatObjectKey(key, forceQuote = false) {
    if (!forceQuote && /^[A-Za-z_$][0-9A-Za-z_$]*$/.test(key)) return key;
    return JSON.stringify(key);
}

function formatObjectConst(variableName, entries, { indent = '    ', quoteKeys = false } = {}) {
    const lines = Object.entries(entries).map(([key, value]) => (
        `${indent}    ${formatObjectKey(key, quoteKeys)}: ${JSON.stringify(value)}`
    ));

    return `${indent}const ${variableName} = {\n${lines.join(',\n')}\n${indent}};\n`;
}

function formatStringConst(variableName, value, { indent = '    ' } = {}) {
    return `${indent}const ${variableName} = ${JSON.stringify(value)};\n`;
}

function formatTupleArrayConst(variableName, entries, { indent = '    ' } = {}) {
    const lines = entries.map(([left, right]) => (
        `${indent}    [${JSON.stringify(left)}, ${JSON.stringify(right)}]`
    ));

    return `${indent}const ${variableName} = [\n${lines.join(',\n')}\n${indent}];\n`;
}

function replaceSection(bundleSource, startToken, endToken, replacement, label) {
    const startIndex = bundleSource.indexOf(startToken);
    const endIndex = startIndex >= 0 ? bundleSource.indexOf(endToken, startIndex + startToken.length) : -1;

    if (startIndex < 0 || endIndex < 0) {
        throw new Error(`${label} section was not found in script.js`);
    }

    return `${bundleSource.slice(0, startIndex)}${replacement}${bundleSource.slice(endIndex)}`;
}

function extractStringArrayFromConst(bundleSource, variableName, fallbackList = []) {
    const pattern = new RegExp(`const\\s+${escapeRegExp(variableName)}\\s*=\\s*\\[(.*?)\\];`, 's');
    const match = bundleSource.match(pattern);

    if (!match) return [...fallbackList];

    const values = [...match[1].matchAll(/'([^'\\]*(?:\\.[^'\\]*)*)'/g)]
        .map(item => item[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\'))
        .filter(Boolean);

    if (!values.length) return [...fallbackList];

    const seen = new Set();
    return values.filter(value => {
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
    });
}

async function buildFileContentMap(relativePaths = []) {
    const entries = await Promise.all(relativePaths.map(async relativePath => [
        relativePath,
        await readSourceAsset(relativePath)
    ]));

    return Object.fromEntries(entries);
}

export async function syncRuntimeBundle() {
    let bundleSource = await fs.readFile(bundlePath, 'utf8');
    bundleSource = await syncActivationBootstrap(bundleSource);

    const appFragments = extractStringArrayFromConst(bundleSource, 'appFragments', fallbackAppFragments);
    const appScriptFiles = extractStringArrayFromConst(bundleSource, 'appScriptFiles', fallbackAppScripts);
    const embeddedAppFragments = await buildFileContentMap(appFragments);
    const embeddedAppScripts = await buildFileContentMap(appScriptFiles);
    const layoutSource = await fs.readFile(layoutSourcePath, 'utf8');

    bundleSource = replaceSection(
        bundleSource,
        'const appLauncherFns = {',
        'const appCloserFns = {',
        formatObjectConst('appLauncherFns', appLauncherFnsMap),
        'appLauncherFns'
    );

    bundleSource = replaceSection(
        bundleSource,
        'const appCloserFns = {',
        'const appLauncherNames = {',
        formatObjectConst('appCloserFns', appCloserFnsMap),
        'appCloserFns'
    );

    bundleSource = replaceSection(
        bundleSource,
        'const appLauncherNames = {',
        'let appRuntimeReady =',
        `${formatObjectConst('appLauncherNames', appLauncherNamesMap, { quoteKeys: true })}\n${formatTupleArrayConst('appTitleCloseSelectors', appTitleCloseSelectorEntries)}`,
        'appLauncherNames'
    );

    bundleSource = replaceSection(
        bundleSource,
        'const embeddedAppFragments = {',
        'const embeddedAppScripts = {',
        formatObjectConst('embeddedAppFragments', embeddedAppFragments, { quoteKeys: true }),
        'embeddedAppFragments'
    );

    bundleSource = replaceSection(
        bundleSource,
        'const embeddedAppScripts = {',
        'const coreSource = ',
        formatObjectConst('embeddedAppScripts', embeddedAppScripts, { quoteKeys: true }),
        'embeddedAppScripts'
    );

    bundleSource = replaceSection(
        bundleSource,
        'const layoutSource =',
        'const layoutMigrationSource = ',
        formatStringConst('layoutSource', normalizeSourceAsset(layoutSource)),
        'layoutSource'
    );

    for (const [from, to] of bundleFallbackReplacements) {
        bundleSource = bundleSource.split(from).join(to);
    }

    await fs.writeFile(bundlePath, bundleSource, 'utf8');
    return {
        bundlePath,
        appFragments,
        appScriptFiles
    };
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
    syncRuntimeBundle()
        .then(result => {
            console.log(`Runtime bundle synced: ${result.bundlePath}`);
            console.log('Fragments:');
            result.appFragments.forEach(asset => console.log(`- ${asset}`));
            console.log('Scripts:');
            result.appScriptFiles.forEach(asset => console.log(`- ${asset}`));
        })
        .catch(error => {
            console.error('Failed to sync runtime bundle:', error);
            process.exitCode = 1;
        });
}
