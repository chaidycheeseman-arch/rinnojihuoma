<section class="zhenxuan-app" id="zhenxuan-app" aria-label="甄选">
    <div class="zhenxuan-shell">
        <header class="zhenxuan-top">
            <div class="zhenxuan-heading">
                <span class="zhenxuan-kicker">ZHENXUAN SELECT</span>
                <button class="zhenxuan-title interactive" id="zhenxuan-close-title" type="button" aria-label="返回主屏">甄选</button>
                <p class="zhenxuan-note" id="zhenxuan-note">会随主题色流动的轻奢买手杂志。</p>
            </div>
            <div class="zhenxuan-top-badge" id="zhenxuan-top-badge" aria-hidden="true">ISSUE 05</div>
        </header>

        <main class="zhenxuan-stage" id="zhenxuan-stage">
            <section class="zhenxuan-page active" id="zhenxuan-page-home" data-zhenxuan-page="home" aria-label="首页">
                <div class="zhenxuan-home">
                    <div class="zhenxuan-search-row">
                        <label class="zhenxuan-search-shell" for="zhenxuan-search-input" aria-label="搜索商品和店铺">
                            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.4-3.4"></path></svg>
                            <input id="zhenxuan-search-input" name="zhenxuan_search" type="search" placeholder="输入关键词后点搜索生成商品" autocomplete="off" enterkeyhint="search">
                        </label>
                        <button class="zhenxuan-action-button interactive" id="zhenxuan-search-submit" type="button" aria-label="搜索">
                            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.4-3.4"></path></svg>
                        </button>
                        <button class="zhenxuan-action-button interactive" id="zhenxuan-refresh-feed" type="button" aria-label="刷新精选">
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0 2 5.3"></path><path d="M20 4v7h-7"></path></svg>
                        </button>
                    </div>
                    <div class="zhenxuan-category-strip" id="zhenxuan-category-strip" aria-label="首页分类"></div>
                    <section class="zhenxuan-hero-card" id="zhenxuan-hero-card" aria-live="polite"></section>
                    <section class="zhenxuan-home-section">
                        <div class="zhenxuan-section-title">
                            <span>CURATED SHELF</span>
                            <h2 id="zhenxuan-section-heading">今日精选</h2>
                        </div>
                        <div class="zhenxuan-product-grid" id="zhenxuan-product-grid"></div>
                    </section>
                </div>
            </section>

            <section class="zhenxuan-page" id="zhenxuan-page-messages" data-zhenxuan-page="messages" aria-label="消息" hidden>
                <div class="zhenxuan-empty-card zhenxuan-empty-page">
                    <div class="zhenxuan-empty-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24"><path d="M4 5h16a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"></path></svg>
                    </div>
                    <span class="zhenxuan-empty-kicker">MESSAGES</span>
                    <h2>这里还没有任何消息</h2>
                    <p>消息页初始为空，后续会用于和商家聊天。</p>
                </div>
            </section>

            <section class="zhenxuan-page" id="zhenxuan-page-cart" data-zhenxuan-page="cart" aria-label="购物车" hidden>
                <div class="zhenxuan-empty-card zhenxuan-empty-page">
                    <div class="zhenxuan-empty-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24"><path d="M6 7h13l-1.3 7.2a2 2 0 0 1-2 1.6H9.1a2 2 0 0 1-2-1.6L5.6 4H3"></path><circle cx="10" cy="20" r="1.4"></circle><circle cx="17" cy="20" r="1.4"></circle></svg>
                    </div>
                    <span class="zhenxuan-empty-kicker">CART</span>
                    <h2>购物车目前是空的</h2>
                    <p>购物车页初始为空，后续会用于结算和送礼物。</p>
                </div>
            </section>

            <section class="zhenxuan-page" id="zhenxuan-page-profile" data-zhenxuan-page="profile" aria-label="我的甄选" hidden>
                <div class="zhenxuan-profile-stack">
                    <section class="zhenxuan-profile-card">
                        <div class="zhenxuan-profile-top">
                            <div class="zhenxuan-profile-identity">
                                <div class="zhenxuan-profile-avatar" aria-hidden="true">甄</div>
                                <div class="zhenxuan-profile-copy">
                                    <strong>Rinno Atelier</strong>
                                    <span>RinnoMuse</span>
                                    <em>甄选号 5201314</em>
                                </div>
                            </div>
                            <div class="zhenxuan-profile-actions">
                                <button class="zhenxuan-profile-action interactive" type="button" data-zhenxuan-profile-action="address" aria-label="定位">
                                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6-5.2-6-11a6 6 0 1 1 12 0c0 5.8-6 11-6 11z"></path><circle cx="12" cy="10" r="2.3"></circle></svg>
                                    <span>定位</span>
                                </button>
                                <button class="zhenxuan-profile-action interactive" type="button" data-zhenxuan-profile-action="service" aria-label="官方客服">
                                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14v-2a8 8 0 1 1 16 0v2"></path><path d="M4 14a2 2 0 0 0 2 2h1v-6H6a2 2 0 0 0-2 2v2z"></path><path d="M20 14a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2v2z"></path><path d="M12 18a2 2 0 0 1-2 2h2.5"></path></svg>
                                    <span>官方客服</span>
                                </button>
                                <button class="zhenxuan-profile-action interactive" type="button" data-zhenxuan-profile-action="settings" aria-label="设置">
                                    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3h.1a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5h.1a1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"></path></svg>
                                    <span>设置</span>
                                </button>
                            </div>
                        </div>
                    </section>

                    <section class="zhenxuan-panel">
                        <div class="zhenxuan-panel-head">
                            <span>MY ORDERS</span>
                            <h2>我的订单</h2>
                        </div>
                        <div class="zhenxuan-order-row">
                            <button class="zhenxuan-mini-entry interactive" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16v10H4z"></path><path d="M4 10h16"></path><path d="M8 15h4"></path></svg><span>待付款</span></button>
                            <button class="zhenxuan-mini-entry interactive" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h10v8H4z"></path><path d="M14 11h3l3 3v2h-6z"></path><circle cx="8" cy="18" r="1.4"></circle><circle cx="17" cy="18" r="1.4"></circle></svg><span>待发货</span></button>
                            <button class="zhenxuan-mini-entry interactive" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12l4-4 5 5 9-9"></path><path d="M21 9v6h-6"></path></svg><span>待收货</span></button>
                            <button class="zhenxuan-mini-entry interactive" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.9z"></path></svg><span>待评价</span></button>
                            <button class="zhenxuan-mini-entry interactive" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"></path><path d="M3 4v5h5"></path><path d="M8 12h8"></path></svg><span>退款/售后</span></button>
                        </div>
                    </section>

                    <section class="zhenxuan-panel">
                        <div class="zhenxuan-panel-head">
                            <span>TOOLS</span>
                            <h2>常用入口</h2>
                        </div>
                        <div class="zhenxuan-shortcut-row">
                            <button class="zhenxuan-shortcut interactive" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h10v8H4z"></path><path d="M14 11h3l3 3v2h-6z"></path><circle cx="8" cy="18" r="1.4"></circle><circle cx="17" cy="18" r="1.4"></circle></svg><span>快递</span></button>
                            <button class="zhenxuan-shortcut interactive" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5 5.6 17V6.8L12 3.5l6.4 3.3V17z"></path><path d="M12 3.5v17"></path><path d="M5.6 6.8 12 10l6.4-3.2"></path></svg><span>收藏</span></button>
                            <button class="zhenxuan-shortcut interactive" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19V6a2 2 0 0 1 2-2h8l4 4v11"></path><path d="M15 4v4h4"></path><path d="M8 13h8"></path><path d="M8 17h5"></path></svg><span>关注店铺</span></button>
                            <button class="zhenxuan-shortcut interactive" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6-5.2-6-11a6 6 0 1 1 12 0c0 5.8-6 11-6 11z"></path><circle cx="12" cy="10" r="2.3"></circle></svg><span>足迹</span></button>
                        </div>
                    </section>
                </div>
            </section>
        </main>

        <nav class="zhenxuan-tabs" aria-label="甄选页面">
            <button class="zhenxuan-tab interactive active" type="button" data-zhenxuan-tab="home" aria-controls="zhenxuan-page-home" aria-selected="true">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"></path><path d="M5 9.5V21h14V9.5"></path></svg>
                <span>首页</span>
            </button>
            <button class="zhenxuan-tab interactive" type="button" data-zhenxuan-tab="messages" aria-controls="zhenxuan-page-messages" aria-selected="false">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"></path></svg>
                <span>消息</span>
            </button>
            <button class="zhenxuan-tab interactive" type="button" data-zhenxuan-tab="cart" aria-controls="zhenxuan-page-cart" aria-selected="false">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 7h13l-1.3 7.2a2 2 0 0 1-2 1.6H9.1a2 2 0 0 1-2-1.6L5.6 4H3"></path><circle cx="10" cy="20" r="1.4"></circle><circle cx="17" cy="20" r="1.4"></circle></svg>
                <span>购物车</span>
            </button>
            <button class="zhenxuan-tab interactive" type="button" data-zhenxuan-tab="profile" aria-controls="zhenxuan-page-profile" aria-selected="false">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 21v-1.5a4.5 4.5 0 0 0-4.5-4.5h-7A4.5 4.5 0 0 0 4 19.5V21"></path><circle cx="12" cy="8" r="4"></circle></svg>
                <span>我的甄选</span>
            </button>
        </nav>
    </div>

    <div class="zhenxuan-sheet zhenxuan-sheet-centered" id="zhenxuan-refresh-sheet" role="dialog" aria-modal="true" aria-labelledby="zhenxuan-refresh-title" hidden>
        <form class="zhenxuan-sheet-dialog zhenxuan-refresh-dialog" id="zhenxuan-refresh-form" autocomplete="off">
            <div class="zhenxuan-sheet-head">
                <div>
                    <span class="zhenxuan-sheet-kicker">REFRESH PAGE</span>
                    <h2 id="zhenxuan-refresh-title">重刷这一页</h2>
                </div>
                <button class="zhenxuan-sheet-close interactive" id="zhenxuan-refresh-cancel" type="button" aria-label="关闭">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12"></path><path d="M18 6 6 18"></path></svg>
                </button>
            </div>
            <p class="zhenxuan-refresh-copy">输入一个关键词，我会把当前标签页的甄选商品整页重新排版，不只刷新下面几张卡。</p>
            <label class="zhenxuan-sheet-field" for="zhenxuan-refresh-input">
                <span>刷新关键词</span>
                <input id="zhenxuan-refresh-input" name="zhenxuan_refresh_keyword" type="text" maxlength="32" placeholder="例如：黑金手袋 / 月光礼赠 / 丝缎玫瑰">
            </label>
            <div class="zhenxuan-refresh-suggestions" id="zhenxuan-refresh-suggestions" aria-label="关键词建议"></div>
            <p class="zhenxuan-sheet-message" id="zhenxuan-refresh-message" aria-live="polite"></p>
            <div class="zhenxuan-sheet-actions">
                <button class="zhenxuan-sheet-button interactive" id="zhenxuan-refresh-dismiss" type="button">取消</button>
                <button class="zhenxuan-sheet-button interactive is-primary" type="submit">生成这一页</button>
            </div>
        </form>
    </div>

    <div class="zhenxuan-sheet" id="zhenxuan-group-sheet" role="dialog" aria-modal="true" aria-labelledby="zhenxuan-group-title" hidden>
        <form class="zhenxuan-sheet-dialog" id="zhenxuan-group-form" autocomplete="off">
            <div class="zhenxuan-sheet-head">
                <div>
                    <span class="zhenxuan-sheet-kicker">NEW GROUP</span>
                    <h2 id="zhenxuan-group-title">添加分组</h2>
                </div>
                <button class="zhenxuan-sheet-close interactive" id="zhenxuan-group-cancel" type="button" aria-label="关闭">
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12"></path><path d="M18 6 6 18"></path></svg>
                </button>
            </div>
            <label class="zhenxuan-sheet-field" for="zhenxuan-group-input">
                <span>分组名称</span>
                <input id="zhenxuan-group-input" name="zhenxuan_group_name" type="text" maxlength="8" placeholder="例如：家居">
            </label>
            <p class="zhenxuan-sheet-message" id="zhenxuan-group-message" aria-live="polite"></p>
            <div class="zhenxuan-sheet-actions">
                <button class="zhenxuan-sheet-button interactive" id="zhenxuan-group-dismiss" type="button">取消</button>
                <button class="zhenxuan-sheet-button interactive is-primary" type="submit">添加</button>
            </div>
        </form>
    </div>

    <div class="zhenxuan-toast" id="zhenxuan-toast" hidden></div>
</section>
