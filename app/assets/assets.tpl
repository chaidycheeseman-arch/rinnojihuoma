<section class="assets-app" id="assets-app" aria-label="资管">
    <div class="assets-shell">
        <header class="assets-top">
            <div class="assets-heading">
                <span class="assets-kicker">RINNO FINANCE</span>
                <button class="assets-title interactive" id="assets-close-title" type="button" aria-label="返回主屏">资管</button>
                <p class="assets-subtitle">理财 · 工作 · 彩票 · 资产</p>
            </div>
            <div class="assets-top-summary">
                <span class="assets-top-summary-label">总资产</span>
                <strong class="assets-top-summary-val" id="assets-header-total">¥ --</strong>
            </div>
        </header>

        <main class="assets-stage" id="assets-stage">
            <section class="assets-page active" id="assets-page-finance" data-assets-page="finance">
                <div class="assets-market-banner">
                    <div class="assets-market-chart-wrap">
                        <svg class="assets-market-svg" id="assets-market-svg" viewBox="0 0 360 80" preserveAspectRatio="none" aria-hidden="true"></svg>
                    </div>
                    <div class="assets-market-ticker-row" id="assets-market-ticker-row"></div>
                </div>
                <div class="assets-section-head">
                    <span class="assets-section-num">01</span>
                    <h2 class="assets-section-title">自选股</h2>
                    <span class="assets-section-clock" id="assets-stock-clock"></span>
                </div>
                <div class="assets-stock-list" id="assets-stock-list"></div>
            </section>

            <section class="assets-page" id="assets-page-work" data-assets-page="work" hidden>
                <div class="assets-work-hero" id="assets-work-hero"></div>
                <div class="assets-section-head">
                    <span class="assets-section-num">02</span>
                    <h2 class="assets-section-title">打卡</h2>
                </div>
                <div class="assets-punch-wrap" id="assets-punch-wrap"></div>
                <div class="assets-section-head">
                    <span class="assets-section-num">03</span>
                    <h2 class="assets-section-title">面试机会</h2>
                </div>
                <div class="assets-interview-list" id="assets-interview-list"></div>
            </section>

            <section class="assets-page" id="assets-page-lottery" data-assets-page="lottery" hidden>
                <div class="assets-section-head">
                    <span class="assets-section-num">01</span>
                    <h2 class="assets-section-title">彩票大厅</h2>
                    <span class="assets-lottery-cash-badge">余额 <strong id="assets-lottery-cash">¥0</strong></span>
                </div>
                <div class="assets-lottery-list" id="assets-lottery-list"></div>
            </section>

            <section class="assets-page" id="assets-page-wallet" data-assets-page="wallet" hidden>
                <div class="assets-balance-hero" id="assets-balance-hero"></div>
                <div class="assets-section-head">
                    <span class="assets-section-num">01</span>
                    <h2 class="assets-section-title">资产分布</h2>
                </div>
                <div class="assets-breakdown-list" id="assets-breakdown-list"></div>
                <div class="assets-section-head">
                    <span class="assets-section-num">02</span>
                    <h2 class="assets-section-title">实用工具</h2>
                </div>
                <div class="assets-payment-row" id="assets-payment-row"></div>
                <div class="assets-bankcards-wrap" id="assets-bankcards-wrap"></div>
                <div class="assets-section-head">
                    <span class="assets-section-num">03</span>
                    <h2 class="assets-section-title">账单</h2>
                    <button class="assets-section-link interactive" type="button" data-assets-open-bills>查看全部</button>
                </div>
                <div class="assets-bill-list" id="assets-bill-list"></div>
            </section>
        </main>

        <nav class="assets-tabbar" aria-label="资管导航">
            <button class="assets-tab interactive active" type="button" data-assets-tab="finance" aria-selected="true">
                <svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                <span>理财</span>
            </button>
            <button class="assets-tab interactive" type="button" data-assets-tab="work" aria-selected="false">
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
                <span>工作</span>
            </button>
            <button class="assets-tab interactive" type="button" data-assets-tab="lottery" aria-selected="false">
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 2"/></svg>
                <span>彩票</span>
            </button>
            <button class="assets-tab interactive" type="button" data-assets-tab="wallet" aria-selected="false">
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                <span>资产</span>
            </button>
        </nav>
    </div>

    <div class="assets-modal-overlay" id="assets-stock-modal" hidden>
        <div class="assets-modal-card" role="dialog" aria-modal="true">
            <div id="assets-stock-detail"></div>
        </div>
    </div>

    <div class="assets-modal-overlay" id="assets-lottery-modal" hidden>
        <div class="assets-modal-card" role="dialog" aria-modal="true">
            <button class="assets-modal-close interactive" id="assets-lottery-modal-close" type="button" aria-label="关闭">
                <svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
            <div id="assets-lottery-detail"></div>
        </div>
    </div>

    <output class="assets-toast" id="assets-toast" aria-live="polite" aria-atomic="true"></output>
</section>
