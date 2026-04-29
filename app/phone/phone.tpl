<section class="phone-app" id="phone-app" aria-label="电话">
    <div class="phone-shell">
        <header class="phone-top">
            <div class="phone-heading">
                <span class="phone-kicker">RINNO CALL</span>
                <button class="phone-title interactive" id="phone-close-title" type="button" aria-label="返回主屏">电话</button>
                <p class="phone-note" id="phone-note">最近通话、通讯录、拨号与语音箱。</p>
            </div>
            <button class="phone-icon-button interactive" id="phone-clear-number" type="button" aria-label="清空号码" title="清空号码">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><path d="M18 9l-6 6M12 9l6 6"/></svg>
            </button>
        </header>

        <main class="phone-stage" id="phone-stage">
            <section class="phone-page active" id="phone-page-recent" data-phone-page="recent" aria-label="最近通话">
                <div class="phone-list-block">
                    <div class="phone-section-head">
                        <span>01</span>
                        <h2>最近通话</h2>
                    </div>
                    <div class="phone-list" id="phone-recent-list"></div>
                </div>
            </section>

            <section class="phone-page" id="phone-page-contacts" data-phone-page="contacts" aria-label="通讯录" hidden>
                <div class="phone-list-block">
                    <div class="phone-section-head">
                        <span>02</span>
                        <h2>通讯录</h2>
                    </div>
                    <div class="phone-list" id="phone-contact-list"></div>
                </div>
            </section>

            <section class="phone-page" id="phone-page-dial" data-phone-page="dial" aria-label="拨号" hidden>
                <section class="phone-dialer" aria-label="拨号盘">
                    <output class="phone-number" id="phone-number" aria-live="polite">输入号码</output>
                    <div class="phone-keypad" id="phone-keypad" aria-label="数字键盘">
                        <button class="phone-key interactive" type="button" data-phone-key="1"><strong>1</strong><span></span></button>
                        <button class="phone-key interactive" type="button" data-phone-key="2"><strong>2</strong><span>ABC</span></button>
                        <button class="phone-key interactive" type="button" data-phone-key="3"><strong>3</strong><span>DEF</span></button>
                        <button class="phone-key interactive" type="button" data-phone-key="4"><strong>4</strong><span>GHI</span></button>
                        <button class="phone-key interactive" type="button" data-phone-key="5"><strong>5</strong><span>JKL</span></button>
                        <button class="phone-key interactive" type="button" data-phone-key="6"><strong>6</strong><span>MNO</span></button>
                        <button class="phone-key interactive" type="button" data-phone-key="7"><strong>7</strong><span>PQRS</span></button>
                        <button class="phone-key interactive" type="button" data-phone-key="8"><strong>8</strong><span>TUV</span></button>
                        <button class="phone-key interactive" type="button" data-phone-key="9"><strong>9</strong><span>WXYZ</span></button>
                        <button class="phone-key interactive" type="button" data-phone-key="*"><strong>*</strong><span></span></button>
                        <button class="phone-key interactive" type="button" data-phone-key="0"><strong>0</strong><span>+</span></button>
                        <button class="phone-key interactive" type="button" data-phone-key="#"><strong>#</strong><span></span></button>
                    </div>
                    <div class="phone-actions">
                        <button class="phone-small-action interactive" id="phone-delete-number" type="button" aria-label="删除一位">
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><path d="M18 9l-6 6M12 9l6 6"/></svg>
                        </button>
                        <button class="phone-call-button interactive" id="phone-call-button" type="button" aria-label="拨打">
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.62a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.84.29 1.72.5 2.62.62A2 2 0 0 1 22 16.92z"/></svg>
                        </button>
                        <span aria-hidden="true"></span>
                    </div>
                </section>
            </section>

            <section class="phone-page" id="phone-page-voicemail" data-phone-page="voicemail" aria-label="语音箱" hidden>
                <div class="phone-list-block">
                    <div class="phone-section-head">
                        <span>04</span>
                        <h2>语音箱</h2>
                    </div>
                    <div class="phone-list" id="phone-voicemail-list"></div>
                </div>
            </section>
        </main>

        <nav class="phone-tabs" aria-label="电话页面">
            <button class="phone-tab interactive active" type="button" data-phone-tab="recent" aria-controls="phone-page-recent" aria-selected="true">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 2"/></svg>
                <span>最近</span>
            </button>
            <button class="phone-tab interactive" type="button" data-phone-tab="contacts" aria-controls="phone-page-contacts" aria-selected="false">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M21 8v6"/><path d="M18 11h6"/></svg>
                <span>通讯录</span>
            </button>
            <button class="phone-tab interactive" type="button" data-phone-tab="dial" aria-controls="phone-page-dial" aria-selected="false">
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="7" cy="7" r="1"/><circle cx="12" cy="7" r="1"/><circle cx="17" cy="7" r="1"/><circle cx="7" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="17" cy="12" r="1"/><circle cx="7" cy="17" r="1"/><circle cx="12" cy="17" r="1"/><circle cx="17" cy="17" r="1"/></svg>
                <span>拨号</span>
            </button>
            <button class="phone-tab interactive" type="button" data-phone-tab="voicemail" aria-controls="phone-page-voicemail" aria-selected="false">
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="7.5" cy="13.5" r="4.5"/><circle cx="16.5" cy="13.5" r="4.5"/><path d="M7.5 18h9"/></svg>
                <span>语音箱</span>
            </button>
        </nav>
    </div>

    <div class="phone-call-sheet" id="phone-call-sheet" role="dialog" aria-modal="true" aria-labelledby="phone-call-name" hidden>
        <div class="phone-call-dialog">
            <div class="phone-call-avatar" aria-hidden="true"></div>
            <h2 id="phone-call-name">通话中</h2>
            <p id="phone-call-number">--</p>
            <button class="phone-end-button interactive" id="phone-end-call" type="button">挂断</button>
        </div>
    </div>
</section>
