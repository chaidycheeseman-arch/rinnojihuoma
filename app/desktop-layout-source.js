// --- 本地持久化布局拖拽逻辑 (基于 Dexie 存储) ---
const APP_LAYOUT_IDS = {
    '卷宗': 'app-dossier',
    '甄选': 'app-curated',
    '信笺': 'app-letter',
    '资管': 'app-assets',
    '社区': 'app-community',
    '赴约': 'app-date',
    '秘境': 'app-secret',
    '分支': 'app-branch',
    '踪迹': 'app-trace',
    '闲趣': 'app-leisure',
    '放映': 'app-cinema',
    '序章': 'app-prologue',
    '拾光': 'app-time',
    '风格': 'app-style',
    '邂逅': 'app-encounter',
    '晚契': 'app-wanye',
    '翎光': 'app-lingguang',
    '翊光': 'app-lingguang',
    '指南': 'app-guide',
    '电话': 'app-phone',
    '私叙': 'app-private',
    '回响': 'app-echo',
    '同频': 'app-frequency',
    '设置': 'app-settings'
};

const DEFAULT_ICON_HOME = {
    '卷宗': 'grid-page-1-1',
    '甄选': 'grid-page-1-1',
    '信笺': 'grid-page-1-1',
    '资管': 'grid-page-1-1',
    '社区': 'grid-page-2-1',
    '赴约': 'grid-page-2-1',
    '秘境': 'grid-page-2-1',
    '分支': 'grid-page-2-1',
    '踪迹': 'grid-page-2-2',
    '闲趣': 'grid-page-2-2',
    '放映': 'grid-page-2-2',
    '序章': 'grid-page-3-1',
    '拾光': 'grid-page-3-1',
    '风格': 'grid-page-3-1',
    '邂逅': 'grid-page-3-1',
    '晚契': 'grid-page-3-1',
    '翎光': 'grid-page-3-1',
    '翊光': 'grid-page-3-1',
    '指南': 'grid-page-3-1',
    '电话': 'dock-main',
    '私叙': 'dock-main',
    '回响': 'grid-page-3-1',
    '同频': 'dock-main',
    '设置': 'dock-main'
};

const LAYOUT_META_CID = '__rinno_layout_meta__';
const DOCK_ICON_LIMIT = 4;
const FREE_ICON_GRID_LIMIT = 4;
const PAGE_ICON_GRID_SELECTOR = '#slider > .page > .app-grid-2x2, #slider > .page > .app-grid-4-cols';
const ICON_CONTAINER_SELECTOR = `.dock, ${PAGE_ICON_GRID_SELECTOR}`;
const DESKTOP_COMPONENT_BLOCK_SELECTOR = '#slider > .page > [data-iid]:not(.app-wrapper):not(.status-bar):not(.dock):not(.pagination):not(.search-pill):not(.app-grid-2x2):not(.app-grid-4-cols):not(.free-icon-grid)';
const EDIT_MODE_CLICK_TARGET_SELECTOR = `.app-wrapper, .dock, .search-pill, ${DESKTOP_COMPONENT_BLOCK_SELECTOR}`;
const DOCK_DRAG_SAFETY_MARGIN = 6;
let layoutSaveQueue = Promise.resolve();

function purgeEmptySlots() {
    document.querySelectorAll('.empty-slot').forEach(slot => slot.remove());
}

function escapeLayoutSelectorValue(value) {
    return String(value || '').replace(/["\\]/g, '\\$&');
}

function getLayoutContainerByCid(cid) {
    if (!cid) return null;
    return document.querySelector('[data-cid="' + escapeLayoutSelectorValue(cid) + '"]');
}

function getDesktopPages() {
    return Array.from(document.querySelectorAll('#slider > .page'));
}

function isPageLayoutCid(cid) {
    return /^page[-_]/.test(String(cid || ''));
}

function ensurePageCid(page, index = 0) {
    if (!page) return '';
    let cid = page.getAttribute('data-cid') || '';
    if (!cid || /^c\d+$/.test(cid)) {
        cid = 'page-' + (index + 1);
        page.setAttribute('data-cid', cid);
    }
    return cid;
}

function createPageWithCid(cid) {
    const sliderEl = document.getElementById('slider');
    if (!sliderEl) return null;
    const existing = cid ? getLayoutContainerByCid(cid) : null;
    if (existing && existing.parentNode === sliderEl) return existing;
    const page = document.createElement('div');
    page.className = 'page';
    page.setAttribute('data-cid', cid || createNextPageCid());
    sliderEl.appendChild(page);
    return page;
}

function createNextPageCid() {
    const used = new Set(getDesktopPages().map((page, index) => ensurePageCid(page, index)));
    let index = used.size + 1;
    let cid = `page-${index}`;
    while (used.has(cid)) {
        index += 1;
        cid = `page-${index}`;
    }
    return cid;
}

function getLayoutPageCids() {
    return getDesktopPages().map((page, index) => ensurePageCid(page, index)).filter(Boolean);
}

function ensureDesktopPageInventory(fallbackCid = '') {
    if (getDesktopPages().length === 0) createPageWithCid(fallbackCid || createNextPageCid());
    return getLayoutPageCids();
}

function uniqueLayoutValues(values) {
    const seen = new Set();
    return values.filter(value => {
        const key = String(value || '');
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function getLayoutMeta(savedLayouts = []) {
    const meta = savedLayouts.find(layoutData => layoutData && layoutData.cid === LAYOUT_META_CID) || {};
    const pageCids = Array.isArray(meta.pageCids) ? meta.pageCids.map(String).filter(Boolean) : [];
    const current = Number(meta.currentPage);
    return {
        pageCids,
        currentPage: Number.isFinite(current) ? current : 0
    };
}

function isLayoutRecord(layoutData) {
    return Boolean(layoutData && layoutData.cid && layoutData.cid !== LAYOUT_META_CID);
}

function restoreSavedPages(pageCids, savedLayouts = []) {
    const sliderEl = document.getElementById('slider');
    if (!sliderEl) return;
    const cidsFromLayouts = savedLayouts
        .map(layoutData => String((layoutData && layoutData.cid) || ''))
        .filter(isPageLayoutCid);
    const cidsFromFreeGrids = savedLayouts
        .map(layoutData => getFreeIconGridPageId(layoutData && layoutData.cid))
        .filter(Boolean);
    const orderedPageCids = uniqueLayoutValues(pageCids.concat(cidsFromLayouts, cidsFromFreeGrids));

    orderedPageCids.forEach(cid => {
        if (!getLayoutContainerByCid(cid)) createPageWithCid(cid);
    });

    orderedPageCids.forEach(cid => {
        const page = getLayoutContainerByCid(cid);
        if (page && page.parentNode === sliderEl) sliderEl.appendChild(page);
    });
}

function clampCurrentPageToPages(preferred = currentPage) {
    const pages = getDesktopPages();
    currentPage = pages.length ? clampNumber(Number(preferred) || 0, 0, pages.length - 1) : 0;
    return currentPage;
}

function syncSliderToCurrentPage() {
    if (!slider) return;
    clampCurrentPageToPages();
    slider.style.transform = 'translateX(-' + (currentPage * 100) + 'vw)';
}

function getAppLayoutName(app) {
    return (app.querySelector('.app-name')?.textContent || '').trim();
}

function toLayoutSlug(value) {
    const text = String(value || 'item').trim();
    const slug = Array.from(text).map(ch => ch.charCodeAt(0).toString(36)).join('-');
    return slug || 'item';
}

function getAppLayoutId(app, index = 0) {
    const name = getAppLayoutName(app);
    return APP_LAYOUT_IDS[name] || `app-${toLayoutSlug(name || index)}`;
}

function getPanelLayoutId(panel, pageIndex, blockIndex) {
    if (panel.classList.contains('free-icon-grid') && panel.getAttribute('data-cid')) {
        return `${panel.getAttribute('data-cid')}-block`;
    }
    if (panel.classList.contains('app-grid-2x2') || panel.classList.contains('app-grid-4-cols')) {
        return `${panel.getAttribute('data-cid')}-block`;
    }
    if (panel.classList.contains('new-info-card')) return 'panel-profile-card';
    if (panel.classList.contains('chat-bubble-group')) return 'panel-chat-bubbles';
    if (panel.classList.contains('new-music-player')) return 'panel-music-player';
    if (panel.classList.contains('dreamy-card-wrapper')) return 'panel-dreamy-card';
    if (panel.classList.contains('new-dual-avatar')) return 'panel-dual-avatar';
    if (panel.classList.contains('new-sun-card')) return 'panel-sun-card';
    if (panel.classList.contains('mock-chat-wrapper')) return 'panel-mock-chat';
    return `panel-page-${pageIndex + 1}-${blockIndex + 1}`;
}

function assignStableLayoutIds() {
    const pages = Array.from(document.querySelectorAll('#slider > .page'));
    pages.forEach((page, pageIndex) => {
        if (!page.getAttribute('data-cid') || /^c\d+$/.test(page.getAttribute('data-cid'))) {
            page.setAttribute('data-cid', `page-${pageIndex + 1}`);
        }

        const pageCid = page.getAttribute('data-cid');
        const grids = Array.from(page.querySelectorAll(':scope > .app-grid-2x2, :scope > .app-grid-4-cols'));
        grids.forEach((grid, gridIndex) => {
            if (grid.classList.contains('free-icon-grid')) {
                if (!grid.getAttribute('data-cid') || /^c\d+$/.test(grid.getAttribute('data-cid'))) {
                    const freeIndex = Array.from(page.querySelectorAll(':scope > .free-icon-grid')).indexOf(grid) + 1;
                    grid.setAttribute('data-cid', `free-grid-${pageCid}-${freeIndex}`);
                }
                return;
            }
            const gridCid = pageCid.startsWith('page-')
                ? `grid-${pageCid}-${gridIndex + 1}`
                : `${pageCid}-grid-${gridIndex + 1}`;
            grid.setAttribute('data-cid', gridCid);
        });
    });

    const dock = document.querySelector('.dock');
    if (dock) dock.setAttribute('data-cid', 'dock-main');

    document.querySelectorAll('.app-wrapper').forEach((app, index) => {
        app.setAttribute('data-iid', getAppLayoutId(app, index));
    });

    pages.forEach((page, pageIndex) => {
        Array.from(page.children).forEach((panel, blockIndex) => {
            if (!panel.matches('div') || panel.classList.contains('app-wrapper')) return;
            if (panel.classList.contains('status-bar') || panel.classList.contains('dock') || panel.classList.contains('pagination') || panel.classList.contains('search-pill')) return;
            const existingIid = panel.getAttribute('data-iid') || '';
            if (panel.dataset.componentInstance === 'true' && existingIid && !isLegacyLayoutId(existingIid)) return;
            panel.setAttribute('data-iid', getPanelLayoutId(panel, pageIndex, blockIndex));
        });
    });
}

function isLegacyLayoutId(id) {
    return /^c\d+$/.test(String(id || '')) || /^i\d+$/.test(String(id || ''));
}

function layoutUsesLegacyIds(savedLayouts) {
    return savedLayouts.some(layoutData => {
        if (!isLayoutRecord(layoutData)) return false;
        if (isLegacyLayoutId(layoutData.cid)) return true;
        return Array.isArray(layoutData.iids) && layoutData.iids.some(isLegacyLayoutId);
    });
}

function isIconContainer(container) {
    return container?.classList.contains('dock') || container?.classList.contains('app-grid-2x2') || container?.classList.contains('app-grid-4-cols');
}

function isValidLayoutChild(container, child) {
    if (!container || !child || !child.hasAttribute('data-iid') || child.classList.contains('empty-slot')) return false;
    if (isIconContainer(container)) return child.classList.contains('app-wrapper');
    if (container.classList.contains('page')) return !child.classList.contains('app-wrapper');
    return true;
}

function getLayoutChildren(container) {
    return Array.from(container.children).filter(child => isValidLayoutChild(container, child));
}

function getDockIconChildren(dock = document.querySelector('.dock')) {
    return Array.from(dock?.children || []).filter(child => child.classList.contains('app-wrapper') && child.hasAttribute('data-iid') && !child.classList.contains('empty-slot'));
}

function getIconCountInContainer(container) {
    return Array.from(container?.children || []).filter(child =>
        child.classList.contains('app-wrapper') &&
        child.hasAttribute('data-iid') &&
        !child.classList.contains('empty-slot')
    ).length;
}

function canDockAcceptIcon(dock, app = draggedNode) {
    if (!dock || !dock.classList?.contains('dock')) return true;
    if (!app || !app.classList?.contains('app-wrapper')) return false;
    if (app.parentNode === dock) return true;
    return getDockIconChildren(dock).length < DOCK_ICON_LIMIT;
}

function getFallbackIconGrid() {
    return document.querySelector('.app-grid-4-cols, .app-grid-2x2');
}

function getDefaultIconContainer(app, allowDock = true) {
    const homeCid = DEFAULT_ICON_HOME[getAppLayoutName(app)];
    let target = homeCid ? getLayoutContainerByCid(homeCid) : null;
    if (target?.classList.contains('dock') && !allowDock) target = null;
    return target && isIconContainer(target) ? target : getFallbackIconGrid();
}

function moveDockOverflowIcon(app) {
    const target = getDefaultIconContainer(app, false);
    if (target && target !== app.parentNode && isIconContainer(target)) target.appendChild(app);
}

function enforceDockIconLimit() {
    const dock = document.querySelector('.dock');
    if (!dock) return;
    getDockIconChildren(dock)
        .filter(app => DEFAULT_ICON_HOME[getAppLayoutName(app)] !== 'dock-main')
        .forEach(app => {
            if (getDockIconChildren(dock).length > DOCK_ICON_LIMIT) moveDockOverflowIcon(app);
        });
    getDockIconChildren(dock).slice(DOCK_ICON_LIMIT).forEach(moveDockOverflowIcon);
}

function repairLooseAppIcons() {
    document.querySelectorAll('#slider > .page > .app-wrapper').forEach(app => {
        const target = getDefaultIconContainer(app);
        if (target && isIconContainer(target)) target.appendChild(app);
    });
    enforceDockIconLimit();
}

function getFreeIconGridPageId(cid) {
    const match = String(cid || '').match(/^free-grid-(.+)-\d+$/);
    return match ? match[1] : '';
}

function getNextFreeIconGridId(page) {
    const pageCid = page.getAttribute('data-cid') || `page-${Array.from(document.querySelectorAll('#slider > .page')).indexOf(page) + 1}`;
    let index = 1;
    while (document.querySelector(`[data-cid="free-grid-${pageCid}-${index}"]`)) index++;
    return `free-grid-${pageCid}-${index}`;
}

function configureFreeIconGrid(grid, cid = grid?.getAttribute('data-cid') || '') {
    if (!grid) return null;
    const normalizedCid = String(cid || '').trim();
    grid.className = 'app-grid-2x2 free-icon-grid half-width';
    if (normalizedCid) {
        grid.setAttribute('data-cid', normalizedCid);
        grid.setAttribute('data-iid', `${normalizedCid}-block`);
    }
    grid.dataset.freeIconGrid = 'true';
    return grid;
}

function getFreeIconGridChildren(grid) {
    return Array.from(grid?.children || []).filter(child =>
        child.classList.contains('app-wrapper') &&
        child.hasAttribute('data-iid') &&
        !child.classList.contains('empty-slot')
    );
}

function rebuildFreeIconGridSegment(page, segment) {
    if (!page || !Array.isArray(segment) || !segment.length) return;
    const apps = segment.flatMap(getFreeIconGridChildren);
    const beforeNode = segment[segment.length - 1].nextElementSibling;
    segment.forEach(grid => grid.remove());
    for (let index = 0; index < apps.length; index += FREE_ICON_GRID_LIMIT) {
        const grid = createFreeIconGrid(page);
        page.insertBefore(grid, beforeNode);
        apps.slice(index, index + FREE_ICON_GRID_LIMIT).forEach(app => grid.appendChild(app));
    }
}

function normalizeFreeIconGrids() {
    getDesktopPages().forEach(page => {
        const children = Array.from(page.children);
        let index = 0;
        while (index < children.length) {
            const node = children[index];
            if (!node?.classList?.contains('free-icon-grid')) {
                index += 1;
                continue;
            }

            const segment = [];
            while (index < children.length && children[index]?.classList?.contains('free-icon-grid')) {
                segment.push(children[index]);
                index += 1;
            }

            const needsRewrite = segment.some(grid => {
                const icons = getFreeIconGridChildren(grid);
                return (
                    !grid.classList.contains('app-grid-2x2') ||
                    grid.classList.contains('app-grid-4-cols') ||
                    grid.classList.contains('full-width') ||
                    icons.length === 0 ||
                    icons.length > FREE_ICON_GRID_LIMIT
                );
            });

            if (needsRewrite) {
                rebuildFreeIconGridSegment(page, segment);
            } else {
                segment.forEach(grid => configureFreeIconGrid(grid));
            }
        }
    });
    purgeEmptyFreeIconGrids();
}

function createFreeIconGrid(page) {
    const grid = document.createElement('div');
    const cid = getNextFreeIconGridId(page);
    return configureFreeIconGrid(grid, cid);
}

function ensureFreeIconGrid(page, beforeNode = null) {
    if (!page) return null;
    if (beforeNode && beforeNode.parentNode === page) {
        const previous = beforeNode.previousElementSibling;
        if (previous?.classList.contains('free-icon-grid') && getFreeIconGridChildren(previous).length < FREE_ICON_GRID_LIMIT) {
            return configureFreeIconGrid(previous);
        }
    } else {
        const last = page.lastElementChild;
        if (last?.classList.contains('free-icon-grid') && getFreeIconGridChildren(last).length < FREE_ICON_GRID_LIMIT) {
            return configureFreeIconGrid(last);
        }
    }

    const grid = createFreeIconGrid(page);
    if (beforeNode && beforeNode.parentNode === page) {
        page.insertBefore(grid, beforeNode);
    } else {
        page.appendChild(grid);
    }
    return grid;
}

function createMissingFreeIconGrid(cid) {
    const pageCid = getFreeIconGridPageId(cid);
    let page = pageCid ? getLayoutContainerByCid(pageCid) : null;
    if (!page && pageCid) page = createPageWithCid(pageCid);
    if (!page) return null;
    const grid = document.createElement('div');
    configureFreeIconGrid(grid, cid);
    page.appendChild(grid);
    return grid;
}

function purgeEmptyFreeIconGrids() {
    document.querySelectorAll('.free-icon-grid').forEach(grid => {
        const children = getFreeIconGridChildren(grid);
        if (children.length === 0) grid.remove();
    });
}

function getPageDesktopComponentCount(page) {
    if (!page) return 0;
    return Array.from(page.querySelectorAll(':scope > [data-iid]')).filter(node => {
        if (node.classList.contains('app-wrapper')) return false;
        if (node.classList.contains('status-bar') || node.classList.contains('dock') || node.classList.contains('pagination') || node.classList.contains('search-pill')) return false;
        if (node.classList.contains('app-grid-2x2') || node.classList.contains('app-grid-4-cols') || node.classList.contains('free-icon-grid')) return false;
        return true;
    }).length;
}

function isDesktopPageEffectivelyEmpty(page) {
    if (!page) return false;
    const directIcons = getIconCountInContainer(page);
    const gridIcons = Array.from(page.querySelectorAll(':scope > .app-grid-2x2, :scope > .app-grid-4-cols'))
        .reduce((total, grid) => total + getIconCountInContainer(grid), 0);
    const componentCount = getPageDesktopComponentCount(page);
    return directIcons + gridIcons + componentCount === 0;
}

function pruneEmptyDesktopPages() {
    const pages = getDesktopPages();
    if (pages.length <= 1) return false;
    let removed = false;
    pages.forEach(page => {
        if (!isDesktopPageEffectivelyEmpty(page)) return;
        if (getDesktopPages().length <= 1) return;
        page.remove();
        removed = true;
    });
    return removed;
}

async function initLayoutPersistence() {
    purgeEmptySlots();
    assignStableLayoutIds();
    let restoredPageIndex = 0;

    try {
        const savedRecords = await db.layout.toArray();
        const savedLayouts = (savedRecords || []).filter(isLayoutRecord);
        const meta = getLayoutMeta(savedRecords || []);
        restoredPageIndex = meta.currentPage;

        if (savedRecords && savedRecords.length > 0) {
            if (layoutUsesLegacyIds(savedLayouts)) {
                await db.layout.clear();
            } else {
                restoreSavedPages(meta.pageCids, savedLayouts);

                savedLayouts.forEach(layoutData => {
                    let container = getLayoutContainerByCid(layoutData.cid);
                    if (!container && String(layoutData.cid || '').startsWith('free-grid-')) {
                        container = createMissingFreeIconGrid(layoutData.cid);
                    }
                    if (!container && isPageLayoutCid(layoutData.cid)) {
                        container = createPageWithCid(layoutData.cid);
                    }
                });

                savedLayouts.forEach(layoutData => {
                    const container = getLayoutContainerByCid(layoutData.cid);
                    if(container) {
                        const iids = Array.isArray(layoutData.iids) ? layoutData.iids : [];
                        iids.forEach(iid => {
                            if (!iid || iid.startsWith('empty|') || iid.startsWith('empty_')) return;
                            let item = document.querySelector('[data-iid="' + escapeLayoutSelectorValue(iid) + '"]');
                            if(item && isValidLayoutChild(container, item)) container.appendChild(item);
                        });
                    }
                });
            }
        }
    } catch(e) {
        console.error("Layout load failed:", e);
    }
    purgeEmptySlots();
    repairLooseAppIcons();
    normalizeFreeIconGrids();
    purgeEmptyFreeIconGrids();
    pruneEmptyDesktopPages();
    ensureDesktopPageInventory();
    clampCurrentPageToPages(restoredPageIndex);
    updatePagination();
    syncSliderToCurrentPage();
    await saveCurrentLayout();
}

async function persistCurrentLayout(options = {}) {
    purgeEmptySlots();
    assignStableLayoutIds();
    repairLooseAppIcons();
    normalizeFreeIconGrids();
    purgeEmptyFreeIconGrids();
    pruneEmptyDesktopPages();
    const pageCids = ensureDesktopPageInventory(options && typeof options === 'object' ? (options.preserveCid || '') : '');
    clampCurrentPageToPages();
    const layout = [{
        cid: LAYOUT_META_CID,
        pageCids,
        currentPage,
        savedAt: Date.now()
    }];

    document.querySelectorAll('[data-cid]').forEach(container => {
        const cid = container.getAttribute('data-cid');
        if (!cid || cid === LAYOUT_META_CID) return;
        const children = getLayoutChildren(container);
        const isDesktopPage = container.matches('#slider > .page');
        if(isDesktopPage || children.length > 0) {
            layout.push({
                cid: cid,
                iids: children.map(c => c.getAttribute('data-iid'))
            });
        }
    });
    
    try {
        await db.layout.clear();
        await db.layout.bulkPut(layout);
    } catch (e) {
        console.error("Layout save failed:", e);
    }
}

function saveCurrentLayout(options = {}) {
    const nextOptions = options && typeof options === 'object' ? { ...options } : {};
    layoutSaveQueue = layoutSaveQueue
        .catch(() => {})
        .then(() => persistCurrentLayout(nextOptions));
    return layoutSaveQueue;
}

initLayoutPersistence();


// --- 原有：时钟、日历与时间戳逻辑 ---
const weekDays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
function updateClock() {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const day = weekDays[now.getDay()];
    const setText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };
    
    const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    setText('clock', timeStr);
    setText('lock-time-display', timeStr);
    setText('lock-date-display', `${month}\u6708${date}\u65e5 ${day}`);
    
    const ampm = h >= 12 ? 'PM' : 'AM';
    let h12 = h % 12;
    h12 = h12 ? h12 : 12; 
    setText('chat-time-mock', `${h12}:${String(m).padStart(2, '0')} ${ampm}`);
}
setInterval(updateClock, 1000); updateClock();


// --- 实时电池与电量检测逻辑 ---
function initBatteryTracker() {
    const batLevel = document.getElementById('bat-level');
    const batCharging = document.getElementById('bat-charging');
    
    function updateBatteryState(battery) {
        const level = battery.level;
        batLevel.setAttribute('width', Math.max(1, 17 * level));
        
        if (battery.charging) {
            batLevel.setAttribute('fill', '#34C759'); 
            batCharging.style.display = 'block';      
        } else {
            batCharging.style.display = 'none';
            if (level <= 0.2) {
                batLevel.setAttribute('fill', '#FF3B30'); 
            } else {
                batLevel.setAttribute('fill', 'var(--text-main)'); 
            }
        }
    }

    if ('getBattery' in navigator) {
        navigator.getBattery().then(bat => {
            updateBatteryState(bat);
            bat.addEventListener('levelchange', () => updateBatteryState(bat));
            bat.addEventListener('chargingchange', () => updateBatteryState(bat));
        });
    } else {
        batLevel.setAttribute('width', '14');
        batLevel.setAttribute('fill', 'var(--text-main)');
    }
}
initBatteryTracker();


// --- 音乐进度条拖拽逻辑 ---
const pContainer = document.querySelector('.progress-container');
const pFill = document.querySelector('.progress-line-fill');
const pHeart = document.querySelector('.progress-heart');
let isDraggingProgress = false;

function updateMusicProgress(e) {
    const rect = pContainer.getBoundingClientRect();
    let clientX = e.clientX;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
    } else if (e.clientX === undefined && e.type.includes('touch')) {
        return;
    }
    
    let x = clientX - rect.left;
    x = Math.max(0, Math.min(x, rect.width));
    const percent = (x / rect.width) * 100;
    pFill.style.width = percent + '%';
    pHeart.style.left = percent + '%';
}

if (pContainer) {
    pContainer.addEventListener('pointerdown', (e) => {
        isDraggingProgress = true;
        e.stopPropagation(); // 阻止长按抖动和滑动切换
        updateMusicProgress(e);
    });

    document.addEventListener('pointermove', (e) => {
        if (isDraggingProgress) {
            e.preventDefault(); 
            e.stopPropagation();
            updateMusicProgress(e);
        }
    }, { passive: false });

    document.addEventListener('pointerup', () => {
        if (isDraggingProgress) isDraggingProgress = false;
    });
    document.addEventListener('pointercancel', () => {
        if (isDraggingProgress) isDraggingProgress = false;
    });
    // 防止 touch 事件冒泡引起父级排版
    pContainer.addEventListener('touchstart', (e) => e.stopPropagation(), {passive: true});
    pContainer.addEventListener('touchmove', (e) => {
        if (isDraggingProgress) {
            e.stopPropagation();
            e.preventDefault();
        }
    }, {passive: false});
}


// --- 页面滑动及分页指示联动逻辑 ---
const slider = document.getElementById('slider');
let currentPage = 0; let startX = 0; let startY = 0; let isSwiping = false; let isMouseSwiping = false;

function getInteractionPoint(e, useChangedTouch = false) {
    const touchList = useChangedTouch ? e.changedTouches : e.touches;
    const touch = touchList && touchList.length ? touchList[0] : null;
    if (touch) return { x: touch.clientX, y: touch.clientY };
    if (Number.isFinite(e.clientX) && Number.isFinite(e.clientY)) return { x: e.clientX, y: e.clientY };
    return null;
}

function getViewportBounds() {
    const viewport = window.visualViewport;
    return {
        width: Math.max(1, (viewport && viewport.width) ? viewport.width : window.innerWidth),
        height: Math.max(1, (viewport && viewport.height) ? viewport.height : window.innerHeight)
    };
}

function clampNumber(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function getDockSafeBottomY(viewport = getViewportBounds()) {
    const maxY = Math.max(0, viewport.height - 1);
    const dock = document.querySelector('.dock');
    if (!dock) return maxY;
    const rect = dock.getBoundingClientRect();
    return clampNumber(Math.floor(rect.bottom - DOCK_DRAG_SAFETY_MARGIN), 0, maxY);
}

function clearArrangeDropTargets() {
    window._dropNodeToSwap = null;
    window._dropParentToAppend = null;
    window._dropInsertBefore = null;
    window._dropPageForFreeGrid = null;
}

function isSwipeBlocked(e) {
    return Boolean(e.target.closest('.progress-container, [contenteditable="true"], input, textarea, select, button, .settings-app, .private-app, .letter-app, .prologue-app, .style-app, .community-app, .encounter-app, .dossier-app, .wanye-app, .lingguang-app, .guide-app, .phone-app, .lock-screen:not(.unlocked)'));
}

function beginSwipe(point, e) {
    if (!point || document.body.classList.contains('edit-mode') || document.body.classList.contains('settings-open') || document.body.classList.contains('private-open') || document.body.classList.contains('letter-open') || document.body.classList.contains('prologue-open') || document.body.classList.contains('style-open') || isSwipeBlocked(e)) return false;
    startX = point.x;
    startY = point.y;
    isSwiping = true;
    return true;
}

function moveSwipe(point) {
    if (!isSwiping || !point) return;
    const deltaX = startX - point.x;
    const deltaY = startY - point.y;
    if (Math.abs(deltaY) > Math.abs(deltaX)) isSwiping = false;
}

function finishSwipe(point) {
    if (!isSwiping || !point) return;
    const diffX = startX - point.x;
    const totalPages = document.querySelectorAll('#slider > .page').length;
    if (Math.abs(diffX) > 60) {
        if (diffX > 0 && currentPage < totalPages - 1) currentPage++;
        else if (diffX < 0 && currentPage > 0) currentPage--;
    }
    syncSliderToCurrentPage();
    updatePagination();
    saveCurrentLayout();
    isSwiping = false;
}

function updatePagination() {
    const pages = document.querySelectorAll('#slider > .page');
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    clampCurrentPageToPages();
    pagination.innerHTML = '';
    pages.forEach((_, idx) => {
        const dot = document.createElement('div');
        dot.className = 'dot' + (idx === currentPage ? ' active' : '');
        pagination.appendChild(dot);
    });
}

slider.addEventListener('touchstart', (e) => {
    beginSwipe(getInteractionPoint(e), e);
}, { passive: true });

slider.addEventListener('touchmove', (e) => {
    moveSwipe(getInteractionPoint(e));
}, { passive: true });

slider.addEventListener('touchend', (e) => {
    finishSwipe(getInteractionPoint(e, true));
});

slider.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    isMouseSwiping = beginSwipe(getInteractionPoint(e), e);
});

document.addEventListener('mousemove', (e) => {
    if (!isMouseSwiping) return;
    moveSwipe(getInteractionPoint(e));
});

document.addEventListener('mouseup', (e) => {
    if (!isMouseSwiping) return;
    isMouseSwiping = false;
    finishSwipe(getInteractionPoint(e));
});


// --- 页面动态增减逻辑 ---
function createNewPage() {
    const newPage = createPageWithCid(createNextPageCid());
    updatePagination();
    saveCurrentLayout({ preserveCid: newPage?.getAttribute('data-cid') || '' });
    return newPage;
}

function checkEmptyPages() {
    purgeEmptySlots();
    purgeEmptyFreeIconGrids();
    pruneEmptyDesktopPages();
    if (getDesktopPages().length === 0) createPageWithCid(createNextPageCid());
    clampCurrentPageToPages();
    updatePagination();
    syncSliderToCurrentPage();
}


// --- 终极核心：关闭自动排序。绝对定位互换法与突破限制排位机制 ---
let dragTimer = null;
let draggedNode = null;
let ghostNode = null;
let dragStartX = 0, dragStartY = 0;
let edgeTimer = null;      
let edgeCooldown = false;  

function getIconDropContainerAt(x, y) {
    const containers = Array.from(document.querySelectorAll(ICON_CONTAINER_SELECTOR));
    return containers.find(container => {
        const rect = container.getBoundingClientRect();
        const inside = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
        return inside && (!container.classList.contains('dock') || canDockAcceptIcon(container, draggedNode));
    }) || null;
}

function getDesktopComponentBlockFrom(element) {
    return (element && element.closest) ? element.closest(DESKTOP_COMPONENT_BLOCK_SELECTOR) : null;
}

function getDesktopInteractiveTarget(element) {
    const appTarget = (element && element.closest) ? element.closest('.app-wrapper') : null;
    return appTarget || getDesktopComponentBlockFrom(element);
}

function getEditModeClickTarget(element) {
    return (element && element.closest) ? element.closest(EDIT_MODE_CLICK_TARGET_SELECTOR) : null;
}

function getPageIconGridFrom(element) {
    return (element && element.closest) ? element.closest(PAGE_ICON_GRID_SELECTOR) : null;
}

function isPointInsideAppVisual(app, x, y) {
    const parts = Array.from(app.querySelectorAll('.app-icon, .app-name')).filter(part => {
        const style = getComputedStyle(part);
        return style.display !== 'none' && style.visibility !== 'hidden';
    });
    const rects = parts.length ? parts.map(part => part.getBoundingClientRect()) : [app.getBoundingClientRect()];
    const bounds = rects.reduce((acc, rect) => ({
        left: Math.min(acc.left, rect.left),
        top: Math.min(acc.top, rect.top),
        right: Math.max(acc.right, rect.right),
        bottom: Math.max(acc.bottom, rect.bottom)
    }), { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity });
    const padding = app.closest('.dock') ? 14 : 10;
    return x >= bounds.left - padding && x <= bounds.right + padding && y >= bounds.top - padding && y <= bounds.bottom + padding;
}

function getGridColumnCount(container) {
    if (container.classList.contains('page')) return 2;
    if (container.classList.contains('app-grid-4-cols')) return 4;
    if (container.classList.contains('app-grid-2x2')) return 2;
    return 1;
}

function getIconGridInsertBefore(container, x, y) {
    const children = Array.from(container.children).filter(child => child !== draggedNode && child.hasAttribute('data-iid') && !child.classList.contains('empty-slot'));
    if (children.length === 0) return null;

    if (container.classList.contains('dock')) {
        const sorted = children.slice().sort((a, b) => {
            const ar = a.getBoundingClientRect();
            const br = b.getBoundingClientRect();
            return (ar.left + ar.width / 2) - (br.left + br.width / 2);
        });
        return sorted.find(child => {
            const rect = child.getBoundingClientRect();
            return x < rect.left + rect.width / 2;
        }) || null;
    }

    const cols = getGridColumnCount(container);
    const rect = container.getBoundingClientRect();
    const col = clampNumber(Math.floor(((x - rect.left) / Math.max(1, rect.width)) * cols), 0, cols - 1);
    const rowCenters = [];
    children.forEach(child => {
        const childRect = child.getBoundingClientRect();
        const centerY = childRect.top + childRect.height / 2;
        const existing = rowCenters.find(row => Math.abs(row - centerY) < childRect.height / 2);
        if (!existing) rowCenters.push(centerY);
    });
    rowCenters.sort((a, b) => a - b);

    let row = 0;
    while (row < rowCenters.length - 1 && y > (rowCenters[row] + rowCenters[row + 1]) / 2) row++;
    if (rowCenters.length > 0) {
        const lastRowChildren = children.slice(Math.max(0, (rowCenters.length - 1) * cols));
        const lastRect = lastRowChildren[0]?.getBoundingClientRect();
        if (lastRect && y > rowCenters[rowCenters.length - 1] + lastRect.height / 2) row = rowCenters.length;
    }

    return children[row * cols + col] || null;
}

function isTransparentLayoutSurface(block) {
    if (!block) return false;
    if (block.classList.contains('image-grid-widget')) return true;
    const style = getComputedStyle(block);
    const hasImage = style.backgroundImage && style.backgroundImage !== 'none';
    const hasShadow = style.boxShadow && style.boxShadow !== 'none';
    const hasBorder = ['Top', 'Right', 'Bottom', 'Left'].some(side => parseFloat(style['border' + side + 'Width']) > 0 && style['border' + side + 'Style'] !== 'none');
    const bg = style.backgroundColor || '';
    const transparentBg = !bg || bg === 'transparent' || /rgba\([^)]*,\s*0\s*\)/.test(bg);
    return style.pointerEvents === 'none' || (!hasImage && !hasShadow && !hasBorder && transparentBg);
}

function isPointOnVisibleLayoutContent(block, x, y) {
    if (!block) return false;
    const visibleChildren = Array.from(block.querySelectorAll('*')).filter(child => {
        if (child.classList.contains('desktop-component-delete') || child.closest('.desktop-component-delete')) return false;
        const style = getComputedStyle(child);
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
        const rect = child.getBoundingClientRect();
        if (rect.width <= 1 || rect.height <= 1) return false;
        const hasText = Array.from(child.childNodes).some(node => node.nodeType === Node.TEXT_NODE && Boolean((node.textContent || '').replace(/\s+/g, '')));
        const hasMedia = child.matches('svg, img, canvas, video');
        const hasImage = style.backgroundImage && style.backgroundImage !== 'none';
        const hasShadow = style.boxShadow && style.boxShadow !== 'none';
        const hasBorder = ['Top', 'Right', 'Bottom', 'Left'].some(side => parseFloat(style['border' + side + 'Width']) > 0 && style['border' + side + 'Style'] !== 'none');
        const bg = style.backgroundColor || '';
        const hasBg = hasImage || (bg && bg !== 'transparent' && !/rgba\([^)]*,\s*0\s*\)/.test(bg));
        return hasText || hasMedia || hasBg || hasShadow || hasBorder;
    });
    return visibleChildren.some(child => {
        const rect = child.getBoundingClientRect();
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    });
}

function getVisibleTargetBlock(element, x, y) {
    const block = getDesktopComponentBlockFrom(element);
    if (!block) return null;
    if (block === draggedNode) return block;
    if (!isTransparentLayoutSurface(block)) return block;
    return isPointOnVisibleLayoutContent(block, x, y) ? block : null;
}

function getDropInsertBefore(container, x, y) {
    if (container.classList.contains('dock') || container.classList.contains('app-grid-2x2') || container.classList.contains('app-grid-4-cols')) {
        return getIconGridInsertBefore(container, x, y);
    }

    const children = Array.from(container.children).filter(child => child !== draggedNode && child.hasAttribute('data-iid') && !child.classList.contains('empty-slot'));
    if (container.classList.contains('page')) {
        const cols = getGridColumnCount(container);
        const rect = container.getBoundingClientRect();
        const col = clampNumber(Math.floor(((x - rect.left) / Math.max(1, rect.width)) * cols), 0, cols - 1);
        const rows = [];
        children.forEach(child => {
            const childRect = child.getBoundingClientRect();
            const centerY = childRect.top + childRect.height / 2;
            let row = rows.find(item => Math.abs(item.centerY - centerY) < 18);
            if (!row) {
                row = { centerY, children: [] };
                rows.push(row);
            }
            row.children.push({ child, rect: childRect });
        });
        rows.sort((a, b) => a.centerY - b.centerY);
        for (const row of rows) row.children.sort((a, b) => a.rect.left - b.rect.left);

        if (rows.length > 0) {
            const lastRow = rows[rows.length - 1];
            const lastBottom = Math.max(...lastRow.children.map(item => item.rect.bottom));
            if (y > lastBottom + 12) return null;
        }

        let targetRowIndex = rows.findIndex((row, idx) => {
            const next = rows[idx + 1];
            return !next || y < (row.centerY + next.centerY) / 2;
        });
        if (targetRowIndex < 0) targetRowIndex = rows.length;

        const targetRow = rows[targetRowIndex];
        if (targetRow) {
            const sameRowChild = targetRow.children[col] || targetRow.children.find(item => x < item.rect.left + item.rect.width / 2);
            if (sameRowChild) return sameRowChild.child;
            const nextRow = rows[targetRowIndex + 1];
            return nextRow?.children[0]?.child || null;
        }
        return null;
    }

    for (const child of children) {
        const rect = child.getBoundingClientRect();
        if (y < rect.top + rect.height / 2) return child;
        if (y <= rect.bottom && x < rect.left + rect.width / 2) return child;
    }
    return null;
}

function startArrangeDrag(target, point) {
    if (!target || !point) return;
    if (dragTimer) {
        clearTimeout(dragTimer);
        dragTimer = null;
    }
    if (!document.body.classList.contains('edit-mode')) {
        document.body.classList.add('edit-mode');
    }

    if (navigator.vibrate) navigator.vibrate(50); 
    isSwiping = false;
    isMouseSwiping = false;
    
    draggedNode = target;
    draggedNode.classList.add('dragging');
    const rect = target.getBoundingClientRect();
    
    ghostNode = target.cloneNode(true);
    ghostNode.style.position = 'fixed';
    ghostNode.style.left = rect.left + 'px';
    ghostNode.style.top = rect.top + 'px';
    ghostNode.style.width = rect.width + 'px';
    ghostNode.style.height = rect.height + 'px';
    ghostNode.style.margin = '0';
    ghostNode.style.zIndex = '99999';
    ghostNode.style.pointerEvents = 'none'; 
    ghostNode.style.transition = 'none';
    ghostNode.style.transform = 'scale(1.05)';
    ghostNode.style.opacity = '0.9';
    ghostNode.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
    ghostNode.style.animation = 'none';
    
    ghostNode.offsetX = point.x - rect.left;
    ghostNode.offsetY = point.y - rect.top;
    
    document.body.appendChild(ghostNode);
    // 拖动期间原节点驻留 DOM 并透明化，防止其吸附位移
    draggedNode.style.opacity = '0.3';
}

function beginArrange(e) {
    const point = getInteractionPoint(e);
    if (!point) return;
    if (document.body.classList.contains('settings-open') || document.body.classList.contains('private-open') || document.body.classList.contains('letter-open') || document.body.classList.contains('prologue-open') || document.body.classList.contains('style-open') || document.body.classList.contains('wanye-open') || document.body.classList.contains('lingguang-open') || document.body.classList.contains('guide-open') || document.body.classList.contains('phone-open') || e.target.closest('.progress-container, [contenteditable="true"], input, textarea, select, button, .settings-app, .private-app, .letter-app, .prologue-app, .style-app, .community-app, .encounter-app, .dossier-app, .wanye-app, .lingguang-app, .guide-app, .phone-app, .lock-screen:not(.unlocked)')) return;
    const target = getDesktopInteractiveTarget(e.target);
    
    // 点击空白处退出编辑模式并触发智能清理
    if (document.body.classList.contains('edit-mode')) {
        const clickedItem = getEditModeClickTarget(e.target);
        
        // 【核心逻辑修复】：如果没点到元素，或者点到了不可见的"透明空槽(empty-slot)"，都视为点击了空白处！
        if (!clickedItem || (clickedItem && clickedItem.classList.contains('empty-slot'))) {
            document.body.classList.remove('edit-mode');
            
            purgeEmptySlots();

            saveCurrentLayout();
            return;
        }
    }

    // 严禁拖拽幽灵占位符或其他非交互区
    if (!target || target.classList.contains('empty-slot')) return;

    dragStartX = point.x;
    dragStartY = point.y;
    
    clearArrangeDropTargets();

    const isEditMode = document.body.classList.contains('edit-mode');
    if (isEditMode) {
        startArrangeDrag(target, point);
    } else {
        dragTimer = setTimeout(() => startArrangeDrag(target, point), 500);
    }
}

document.addEventListener('touchstart', beginArrange, { passive: true });
document.addEventListener('mousedown', function(e) {
    if (e.button !== 0) return;
    beginArrange(e);
});

function moveArrange(e) {
    const point = getInteractionPoint(e);
    if (!point) return;
    if (dragTimer) {
        const dx = Math.abs(point.x - dragStartX);
        const dy = Math.abs(point.y - dragStartY);
        if (dx > 10 || dy > 10) {
            clearTimeout(dragTimer);
            dragTimer = null;
        }
    }

    if (ghostNode && draggedNode) {
        if (e.cancelable) e.preventDefault(); 

        const viewport = getViewportBounds();
        const screenX = clampNumber(point.x, 0, viewport.width - 1);
        const safeBottomY = getDockSafeBottomY(viewport);
        const screenY = clampNumber(point.y, 0, safeBottomY);
        const totalPages = document.querySelectorAll('.page').length;
        clearArrangeDropTargets();
        
        if (screenX < 40 && currentPage > 0 && !edgeCooldown) {
            if (!edgeTimer) edgeTimer = setTimeout(() => { performSwipe(-1); }, 500);
        } else if (screenX > viewport.width - 40 && !edgeCooldown) {
            if (currentPage < totalPages - 1) {
                if (!edgeTimer) edgeTimer = setTimeout(() => { performSwipe(1); }, 500);
            } else {
                if (!edgeTimer) edgeTimer = setTimeout(() => { 
                    const newPage = createNewPage();
                    performSwipe(1, { preserveCid: newPage?.getAttribute('data-cid') || '' }); 
                }, 500);
            }
        } else {
            if (edgeTimer) { clearTimeout(edgeTimer); edgeTimer = null; }
        }

        const maxX = Math.max(0, viewport.width - ghostNode.offsetWidth);
        const maxY = Math.max(0, Math.min(viewport.height - ghostNode.offsetHeight, safeBottomY - ghostNode.offsetHeight));
        const x = clampNumber(screenX - ghostNode.offsetX, 0, maxX);
        const y = clampNumber(screenY - ghostNode.offsetY, 0, maxY);
        ghostNode.style.left = x + 'px';
        ghostNode.style.top = y + 'px';

        ghostNode.style.display = 'none';
        const elemUnderTouch = document.elementFromPoint(screenX, screenY);
        ghostNode.style.display = 'block';

        if (!elemUnderTouch) return;

        // 核心：优先寻找网格内任意元素，只要有对象，全走 Swap(1对1互换) 流程
        const rawTargetApp = elemUnderTouch.closest('.app-wrapper');
        const targetApp = rawTargetApp && isPointInsideAppVisual(rawTargetApp, screenX, screenY) ? rawTargetApp : null;
        const targetBlock = getVisibleTargetBlock(elemUnderTouch, screenX, screenY);
        const targetIconContainer = draggedNode.classList.contains('app-wrapper') ? getIconDropContainerAt(screenX, screenY) : null;

        let nodeToSwap = null;
        if (draggedNode.classList.contains('app-wrapper')) {
            if (targetApp && targetApp !== draggedNode) {
                nodeToSwap = targetApp;
            } 
        } else {
            // 大组件互换
            if (targetBlock && targetBlock !== draggedNode && draggedNode.parentNode === targetBlock.parentNode) {
                nodeToSwap = targetBlock;
            }
        }

        if (nodeToSwap) {
            window._dropNodeToSwap = nodeToSwap;
        } else {
            const targetDock = elemUnderTouch.closest('.dock');
            const allowedDock = canDockAcceptIcon(targetDock, draggedNode) ? targetDock : null;
            const targetGrid = getPageIconGridFrom(elemUnderTouch);
            const targetPage = elemUnderTouch.closest('.page');
            const targetIsPageBlank = targetPage && !targetBlock;
            let dropParent = null;
            if (draggedNode.classList.contains('app-wrapper')) {
                dropParent = targetIconContainer || allowedDock || targetGrid;
            } else {
                dropParent = targetPage;
            }
            window._dropParentToAppend = dropParent && !draggedNode.contains(dropParent) ? dropParent : null;
            window._dropPageForFreeGrid = !window._dropParentToAppend && draggedNode.classList.contains('app-wrapper') && targetIsPageBlank ? targetPage : null;
            window._dropInsertBefore = window._dropParentToAppend
                ? getDropInsertBefore(window._dropParentToAppend, screenX, screenY)
                : window._dropPageForFreeGrid
                    ? getDropInsertBefore(window._dropPageForFreeGrid, screenX, screenY)
                    : null;
        }
    }
}

document.addEventListener('touchmove', moveArrange, { passive: false });
document.addEventListener('mousemove', moveArrange);

function endArrange(e) {
    if (dragTimer) { clearTimeout(dragTimer); dragTimer = null; }
    if (edgeTimer) { clearTimeout(edgeTimer); edgeTimer = null; }

    if (ghostNode && draggedNode) {
        // 松手执行操作：永远不引起现存元素位移！
        if (window._dropNodeToSwap) {
            const targetNode = window._dropNodeToSwap;
            const p1 = draggedNode.parentNode;
            const p2 = targetNode.parentNode;
            if (p1 && p2) {
                // 利用占位块进行无缝的 1v1 位置互换
                const ph1 = document.createElement('div');
                const ph2 = document.createElement('div');
                p1.insertBefore(ph1, draggedNode);
                p2.insertBefore(ph2, targetNode);
                p1.replaceChild(targetNode, ph1);
                p2.replaceChild(draggedNode, ph2);
            }
        } else if (window._dropParentToAppend) {
            const p1 = draggedNode.parentNode;
            const p2 = window._dropParentToAppend;
            const beforeNode = window._dropInsertBefore;
            if (p1 && p2 && !draggedNode.contains(p2) && (!p2.classList.contains('dock') || canDockAcceptIcon(p2, draggedNode))) {
                if (beforeNode && beforeNode.parentNode === p2 && beforeNode !== draggedNode) {
                    p2.insertBefore(draggedNode, beforeNode);
                } else {
                    p2.appendChild(draggedNode);
                }
            }
        } else if (window._dropPageForFreeGrid && draggedNode.classList.contains('app-wrapper')) {
            const p1 = draggedNode.parentNode;
            const freeGrid = ensureFreeIconGrid(window._dropPageForFreeGrid, window._dropInsertBefore);
            if (p1 && freeGrid && !draggedNode.contains(freeGrid)) {
                freeGrid.appendChild(draggedNode);
            }
        }

        ghostNode.remove();
        draggedNode.style.opacity = '1';
        draggedNode.classList.remove('dragging');
        ghostNode = null;
        draggedNode = null;
        clearArrangeDropTargets();
        
        checkEmptyPages();
        saveCurrentLayout();
    }
}

document.addEventListener('touchend', endArrange);
document.addEventListener('touchcancel', endArrange);
document.addEventListener('mouseup', endArrange);

function performSwipe(direction, options = {}) {
    currentPage += direction;
    syncSliderToCurrentPage();
    updatePagination();
    saveCurrentLayout(options);
    
    edgeCooldown = true;
    if (edgeTimer) { clearTimeout(edgeTimer); edgeTimer = null; }
    setTimeout(() => { edgeCooldown = false; }, 1000); 
}
