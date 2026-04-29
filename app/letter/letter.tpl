<section class="letter-app" id="letter-app" aria-label="信笺">
    <div class="letter-top">
        <div class="letter-cover-strip" aria-hidden="true"></div>
        <div class="letter-issue-mark" aria-hidden="true">RINNO</div>
        <div class="letter-identity">
            <div class="letter-kicker">PRIVATE LETTERS</div>
            <button class="letter-title interactive" id="letter-title" type="button" aria-label="返回主屏">LETTER</button>
            <p class="letter-subtitle">玫瑰灰信笺，慢慢写给你。</p>
        </div>
    </div>

    <main class="letter-main">
        <section class="letter-compose-panel" aria-label="当前信笺">
            <div class="letter-compose-head">
                <div class="letter-meta">
                    <div>
                        <span class="letter-field-label">TO</span>
                        <div class="letter-field-value" data-edit-id="letter_to" data-edit-type="text">NianGao_</div>
                    </div>
                    <div>
                        <span class="letter-field-label">DATE</span>
                        <div class="letter-field-value">APR 22</div>
                    </div>
                </div>
                <div class="letter-stamp" aria-hidden="true">R</div>
            </div>

            <h2 class="letter-subject" data-edit-id="letter_subject" data-edit-type="text">写给暮色里的 Rinno</h2>
            <div class="letter-body" data-edit-id="letter_body" data-edit-type="text">今天把纸面留白一些，只留下柔白、玫瑰灰和墨色。想把琐碎的话写得慢一点，让每一个字都像被灯光温过。</div>
            <div class="letter-signature" data-edit-id="letter_signature" data-edit-type="text">Lies7core</div>

            <div class="letter-action-row" aria-label="信笺工具">
                <button class="letter-icon-button interactive" type="button" aria-label="珍藏" title="珍藏">
                    <svg viewBox="0 0 24 24"><path d="M12 3l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5-4.7-4.6 6.5-.9L12 3z"/></svg>
                </button>
                <button class="letter-icon-button interactive" type="button" aria-label="归档" title="归档">
                    <svg viewBox="0 0 24 24"><path d="M4 7h16v13H4z"/><path d="M4 7l2-3h12l2 3"/><path d="M9 12h6"/></svg>
                </button>
                <button class="letter-icon-button interactive" id="letter-send-button" type="button" aria-label="寄出" title="寄出">
                    <svg viewBox="0 0 24 24"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                </button>
            </div>
        </section>

        <section class="letter-editorial-note" aria-label="信笺摘记">
            <div class="letter-editorial-num">01</div>
            <p class="letter-editorial-copy">纸张不抢话，排版要有呼吸。这里保留细线、大片留白和轻微玫瑰灰，让文字像杂志内页一样安静展开。</p>
        </section>

        <section class="letter-template-grid" aria-label="信笺纸样">
            <div class="letter-section-head">
                <span class="letter-section-label">PAPER</span>
                <span>03 sheets</span>
            </div>
            <div class="letter-template-list">
                <article class="letter-template">
                    <span class="letter-card-index">A01</span>
                    <div class="letter-template-name">已发送</div>
                    <div class="letter-template-line"></div>
                </article>
                <article class="letter-template">
                    <span class="letter-card-index">A02</span>
                    <div class="letter-template-name">草稿</div>
                    <div class="letter-template-line"></div>
                </article>
                <article class="letter-template">
                    <span class="letter-card-index">A03</span>
                    <div class="letter-template-name">收信箱</div>
                    <div class="letter-template-line"></div>
                </article>
            </div>
        </section>

        <section class="letter-draft-stack" aria-label="信笺草稿">
            <div class="letter-section-head">
                <span class="letter-section-label">DRAFTS</span>
                <span>recent</span>
            </div>
            <article class="letter-draft-card">
                <span class="letter-card-index">02</span>
                <div>
                    <div class="letter-draft-title">夜灯时</div>
                    <div class="letter-draft-sub">Notes before sleep</div>
                </div>
                <div class="letter-draft-date">21</div>
            </article>
            <article class="letter-draft-card">
                <span class="letter-card-index">03</span>
                <div>
                    <div class="letter-draft-title">未寄出的花</div>
                    <div class="letter-draft-sub">A softer archive</div>
                </div>
                <div class="letter-draft-date">19</div>
            </article>
            <article class="letter-draft-card letter-auth-sent-card" id="letter-auth-sent-card" hidden>
                <span class="letter-card-index">01</span>
                <div>
                    <div class="letter-draft-title">Private conversation@520.com</div>
                    <div class="letter-draft-sub" id="letter-auth-sent-sub">注册私叙 · 已寄出</div>
                </div>
                <div class="letter-draft-date" id="letter-auth-sent-date">--</div>
            </article>
        </section>
    </main>
</section>
