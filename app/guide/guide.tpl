<section class="guide-app" id="guide-app" aria-label="指南">
    <div class="guide-shell">
        <header class="guide-top">
            <div class="guide-heading">
                <span class="guide-kicker">RINNO GUIDE</span>
                <button class="guide-title interactive" id="guide-close-title" type="button" aria-label="返回主屏">指南</button>
                <p class="guide-note">桌面、组件、封面和私密入口备忘。</p>
            </div>
            <button class="guide-icon-button interactive" id="guide-reset-progress" type="button" aria-label="重置进度" title="重置进度">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 0 1 15.5-6.2"/><path d="M18 6h3V3"/><path d="M21 12a9 9 0 0 1-15.5 6.2"/><path d="M6 18H3v3"/></svg>
            </button>
        </header>

        <nav class="guide-tabs" aria-label="指南分类">
            <button class="guide-tab interactive active" type="button" data-guide-tab="desktop">桌面</button>
            <button class="guide-tab interactive" type="button" data-guide-tab="style">风格</button>
            <button class="guide-tab interactive" type="button" data-guide-tab="privacy">私密</button>
        </nav>

        <main class="guide-stage">
            <section class="guide-panel active" data-guide-panel="desktop" aria-label="桌面指南">
                <article class="guide-card" data-guide-item="drag">
                    <button class="guide-check interactive" type="button" aria-label="标记完成"></button>
                    <div>
                        <h2>拖动整理</h2>
                        <p>长按图标或组件进入编辑状态；拖到空白处会自动生成可收纳的小图标区。</p>
                    </div>
                </article>
                <article class="guide-card" data-guide-item="components">
                    <button class="guide-check interactive" type="button" aria-label="标记完成"></button>
                    <div>
                        <h2>组件抽屉</h2>
                        <p>点底部搜索胶囊打开组件抽屉，添加资料卡、便签、画廊和更多桌面组件。</p>
                    </div>
                </article>
            </section>

            <section class="guide-panel" data-guide-panel="style" aria-label="风格指南" hidden>
                <article class="guide-card" data-guide-item="covers">
                    <button class="guide-check interactive" type="button" aria-label="标记完成"></button>
                    <div>
                        <h2>桌面封面</h2>
                        <p>风格应用里的图标与组件页可以批量更换桌面图片，也可以逐个更换或重置。</p>
                    </div>
                </article>
                <article class="guide-card" data-guide-item="radius">
                    <button class="guide-check interactive" type="button" aria-label="标记完成"></button>
                    <div>
                        <h2>圆角控制</h2>
                        <p>组件圆角和应用图标圆角分开调节，适合在硬朗和柔和之间快速切换。</p>
                    </div>
                </article>
            </section>

            <section class="guide-panel" data-guide-panel="privacy" aria-label="私密指南" hidden>
                <article class="guide-card" data-guide-item="wanye">
                    <button class="guide-check interactive" type="button" aria-label="标记完成"></button>
                    <div>
                        <h2>晚契记录</h2>
                        <p>晚契只在本机浏览器保存，适合记录同意、保护措施、照护和下次沟通点。</p>
                    </div>
                </article>
                <article class="guide-card" data-guide-item="phone">
                    <button class="guide-check interactive" type="button" aria-label="标记完成"></button>
                    <div>
                        <h2>甄选入口</h2>
                        <p>甄选放在桌面应用区，用轻杂志风收纳首页、消息、购物车和我的甄选，也会随主题色一起变化。</p>
                    </div>
                </article>
            </section>
        </main>
    </div>
</section>
