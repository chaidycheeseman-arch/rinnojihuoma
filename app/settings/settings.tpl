<section class="settings-app" id="settings-app" aria-label="设置">
    <div class="settings-top">
        <div class="settings-cover interactive" id="settings-cover" data-edit-id="settings_cover" data-edit-type="image"></div>
        <div class="settings-identity">
            <button class="settings-title" id="settings-title" type="button">SETTINGS</button>
            <div class="settings-nickname" id="settings-nickname" data-edit-id="settings_nickname" data-edit-type="text">点击编辑昵称</div>
            <div class="settings-account" id="settings-account" data-edit-id="settings_account" data-edit-type="text">@ 账号</div>
        </div>
    </div>

    <div class="settings-main-view" id="settings-main-view">
        <ol class="settings-menu">
            <li class="settings-menu-item" id="settings-security-entry" role="button" tabindex="0" aria-controls="settings-security-view"><span class="settings-index">01</span><span class="settings-copy"><span class="settings-label">安全与验证</span><span class="settings-subtitle">Sign-in guard / device access</span></span></li>
            <li class="settings-menu-item"><span class="settings-index">02</span><span class="settings-copy"><span class="settings-label">推送与通知</span><span class="settings-subtitle">Alerts rhythm / sound profile</span></span></li>
            <li class="settings-menu-item" id="settings-api-entry" role="button" tabindex="0" aria-controls="settings-api-view"><span class="settings-index">03</span><span class="settings-copy"><span class="settings-label">接口与参数</span><span class="settings-subtitle">API keys / response limits</span></span></li>
            <li class="settings-menu-item" id="settings-debug-entry" role="button" tabindex="0" aria-controls="settings-debug-view"><span class="settings-index">04</span><span class="settings-copy"><span class="settings-label">调试与控制</span><span class="settings-subtitle">Runtime logs / live monitor</span></span></li>
            <li class="settings-menu-item"><span class="settings-index">05</span><span class="settings-copy"><span class="settings-label">偏好与设置</span><span class="settings-subtitle">Language mood / interface habits</span></span></li>
            <li class="settings-menu-item" id="settings-storage-entry" role="button" tabindex="0" aria-controls="settings-storage-view"><span class="settings-index">06</span><span class="settings-copy"><span class="settings-label">储存与管理</span><span class="settings-subtitle">Cache archive / space control</span></span></li>
        </ol>
    </div>

    <div class="settings-security-view" id="settings-security-view" aria-label="安全与验证" hidden>
        <div class="settings-subpage-bar">
            <div class="settings-subpage-kicker">SECURITY</div>
            <button class="settings-subpage-title interactive" id="settings-security-title" type="button" aria-label="返回设置列表">安全与验证</button>
            <p class="settings-subpage-note">只放行属于你的 Rinno 私密入口。</p>
        </div>

        <section class="security-card security-status-card">
            <div class="security-mark">
                <svg viewBox="0 0 24 24"><path d="M12 3l7 3v5c0 4.7-2.9 8.1-7 10-4.1-1.9-7-5.3-7-10V6l7-3z"/><path d="M9.5 12.4l1.7 1.7 3.6-4"/></svg>
            </div>
            <div class="security-status-copy">
                <div class="security-status-line">
                    <span class="security-status-title" id="security-status-title">锁屏密码已开启</span>
                    <span class="security-badge" id="security-status-badge">守护中</span>
                </div>
                <p class="security-status-text" id="security-status-text">进入设备前需要输入 6 位锁屏密码。</p>
            </div>
        </section>

        <section class="security-card security-control-card">
            <div class="security-row">
                <div>
                    <span class="security-row-title" id="security-toggle-title">锁屏密码</span>
                    <span class="security-row-desc" id="security-toggle-desc">开启后，锁屏会在进入主屏前停留。</span>
                </div>
                <button class="security-switch interactive" id="security-lock-switch" type="button" aria-pressed="true" aria-labelledby="security-toggle-title">
                    <span></span>
                </button>
            </div>
            <div class="security-row">
                <div>
                    <span class="security-row-title">当前密码</span>
                    <span class="security-row-desc" id="security-passcode-desc">以 6 位数字保存，只在本机浏览器内生效。</span>
                </div>
                <div class="security-passcode-preview" id="security-passcode-preview">••••••</div>
            </div>
            <div class="security-actions">
                <button class="security-action-button primary interactive" id="security-change-passcode" type="button">修改锁屏密码</button>
                <button class="security-action-button interactive" id="security-disable-passcode" type="button">关闭锁屏密码</button>
            </div>
        </section>

        <form class="security-card security-form" id="security-passcode-form" autocomplete="off" novalidate>
            <input type="text" name="security_username_hint" autocomplete="username" value="rinno-device" hidden>
            <label class="security-field" id="security-current-field">
                <span>当前密码</span>
                <input class="security-input" id="security-current-passcode" name="security_current_passcode" type="password" inputmode="numeric" maxlength="6" pattern="[0-9]*" autocomplete="current-password">
            </label>
            <label class="security-field">
                <span>新密码</span>
                <input class="security-input" id="security-new-passcode" name="security_new_passcode" type="password" inputmode="numeric" maxlength="6" pattern="[0-9]*" autocomplete="new-password">
            </label>
            <label class="security-field">
                <span>确认新密码</span>
                <input class="security-input" id="security-confirm-passcode" name="security_confirm_passcode" type="password" inputmode="numeric" maxlength="6" pattern="[0-9]*" autocomplete="new-password">
            </label>
            <div class="security-form-actions">
                <button class="security-action-button interactive" id="security-cancel-passcode" type="button">取消</button>
                <button class="security-action-button primary interactive" type="submit">保存密码</button>
            </div>
            <p class="security-message" id="security-passcode-message" aria-live="polite"></p>
        </form>
    </div>

    <div class="settings-api-view" id="settings-api-view" aria-label="接口与参数" hidden>
        <div class="settings-subpage-bar">
            <div class="settings-subpage-kicker">API PARAMETERS</div>
            <button class="settings-subpage-title interactive" id="settings-api-title" type="button" aria-label="返回设置列表">接口与参数</button>
            <p class="settings-subpage-note">聊天与语音独立保存，互不覆盖。</p>
        </div>

        <section class="api-section" data-api-section="chat">
            <div class="api-section-head">
                <div>
                    <div class="api-section-eyebrow">
                        <span class="api-section-index">01</span>
                        <span class="api-section-badge">CHAT</span>
                    </div>
                    <h2 class="api-section-title">API 聊天</h2>
                </div>
                <button class="api-ghost-button interactive" id="api-chat-save-preset" type="button">
                    <svg viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>
                    <span>存为预设</span>
                </button>
            </div>

            <form class="api-form-grid" id="api-chat-form" autocomplete="off">
                <input type="text" name="api_chat_username_hint" autocomplete="username" value="rinno-chat-api" hidden>
                <label class="api-field api-field-wide">
                    <span class="api-label">接口网址</span>
                    <input class="api-input" id="api-chat-endpoint" name="api_chat_endpoint" type="url" inputmode="url" placeholder="https://api.example.com/v1" spellcheck="false" autocomplete="off">
                </label>

                <label class="api-field">
                    <span class="api-label">API Key</span>
                    <input class="api-input" id="api-chat-key" name="api_chat_key" type="password" spellcheck="false" autocomplete="new-password">
                </label>

                <div class="api-field">
                    <span class="api-label">模型</span>
                    <div class="api-model-row">
                        <div class="api-picker" id="api-chat-model-picker">
                            <div class="api-picker-control">
                                <input class="api-input" id="api-chat-model" name="api_chat_model" type="text" spellcheck="false" autocomplete="off" aria-controls="api-chat-model-panel" aria-expanded="false">
                                <button class="api-picker-toggle interactive" id="api-chat-model-toggle" type="button" aria-label="展开模型面板" aria-controls="api-chat-model-panel" aria-expanded="false">
                                    <svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>
                                </button>
                            </div>
                            <div class="api-popover" id="api-chat-model-panel" hidden></div>
                        </div>
                        <button class="api-icon-button interactive" id="api-chat-fetch-models" type="button" aria-label="拉取模型" title="拉取模型">
                            <svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 0 1-15.5 6.2"/><path d="M3 12A9 9 0 0 1 18.5 5.8"/><path d="M6 18H2v4"/><path d="M18 6h4V2"/></svg>
                        </button>
                    </div>
                </div>

                <label class="api-field">
                    <span class="api-label-row">
                        <span class="api-label">模型温度</span>
                        <span class="api-range-value" id="api-chat-temperature-value">0.70</span>
                    </span>
                    <input class="api-range" id="api-chat-temperature" name="api_chat_temperature" type="range" min="0" max="2" step="0.05" value="0.7">
                </label>

                <label class="api-field">
                    <span class="api-label">上下文记忆轮数</span>
                    <input class="api-input" id="api-chat-context-rounds" name="api_chat_context_rounds" type="number" min="0" step="1" value="20" inputmode="numeric">
                </label>

                <p class="api-status api-field-wide" id="api-chat-status" aria-live="polite"></p>

                <div class="api-preset-block api-field-wide">
                    <div class="api-preset-title">聊天预设</div>
                    <div class="api-preset-list" id="api-chat-preset-list"></div>
                </div>
            </form>
        </section>

        <section class="api-section" data-api-section="voice">
            <div class="api-section-head">
                <div>
                    <div class="api-section-eyebrow">
                        <span class="api-section-index">02</span>
                        <span class="api-section-badge">MINIMAX ONLY</span>
                    </div>
                    <h2 class="api-section-title">API 语音</h2>
                </div>
                <button class="api-ghost-button interactive" id="api-voice-save-preset" type="button">
                    <svg viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>
                    <span>存为预设</span>
                </button>
            </div>

            <form class="api-form-grid" id="api-voice-form" autocomplete="off">
                <input type="text" name="api_voice_username_hint" autocomplete="username" value="rinno-voice-api" hidden>
                <div class="api-field">
                    <span class="api-label">接口版本</span>
                    <div class="api-segmented" id="api-voice-version-group" aria-label="接口版本">
                        <button class="interactive" type="button" data-voice-version="official">官方版</button>
                        <button class="interactive" type="button" data-voice-version="overseas">海外版</button>
                    </div>
                </div>

                <label class="api-field">
                    <span class="api-label">API Key</span>
                    <input class="api-input" id="api-voice-key" name="api_voice_key" type="password" spellcheck="false" autocomplete="new-password">
                </label>

                <label class="api-field">
                    <span class="api-label">GROUP ID</span>
                    <input class="api-input" id="api-voice-group-id" name="api_voice_group_id" type="text" spellcheck="false" autocomplete="off">
                </label>

                <label class="api-field">
                    <span class="api-label">Voice ID</span>
                    <input class="api-input" id="api-voice-id" name="api_voice_id" type="text" spellcheck="false" autocomplete="off">
                </label>

                <label class="api-field">
                    <span class="api-label">语言</span>
                    <div class="api-picker" id="api-voice-language-picker">
                        <input id="api-voice-language" name="api_voice_language" type="hidden" value="zh">
                        <button class="api-picker-select interactive" id="api-voice-language-toggle" type="button" aria-label="展开语言面板" aria-controls="api-voice-language-panel" aria-expanded="false">
                            <span id="api-voice-language-label">中文</span>
                            <svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>
                        </button>
                        <div class="api-popover" id="api-voice-language-panel" hidden></div>
                    </div>
                </label>

                <label class="api-field">
                    <span class="api-label-row">
                        <span class="api-label">语速</span>
                        <span class="api-range-value" id="api-voice-speed-value">1.00x</span>
                    </span>
                    <input class="api-range" id="api-voice-speed" name="api_voice_speed" type="range" min="0.5" max="2" step="0.05" value="1">
                </label>

                <p class="api-status api-field-wide" id="api-voice-status" aria-live="polite"></p>

                <div class="api-preset-block api-field-wide">
                    <div class="api-preset-title">语音预设</div>
                    <div class="api-preset-list" id="api-voice-preset-list"></div>
                </div>
            </form>
        </section>
    </div>

    <div class="settings-debug-view" id="settings-debug-view" aria-label="调试与控制" hidden>
        <div class="settings-subpage-bar">
            <div class="settings-subpage-kicker">CODE CONSOLE</div>
            <button class="settings-subpage-title interactive" id="settings-debug-title" type="button" aria-label="返回设置列表">调试与控制</button>
            <p class="settings-subpage-note">Runtime error stream / API / code / plugin.</p>
        </div>

        <section class="debug-console" aria-label="报错控制台">
            <div class="debug-console-head">
                <span>rinno://runtime/error-console</span>
                <div class="debug-console-tools">
                    <button class="debug-icon-button interactive" id="debug-refresh" type="button" aria-label="刷新报错" title="刷新">
                        <svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 0 1-15.5 6.2"/><path d="M3 12A9 9 0 0 1 18.5 5.8"/><path d="M6 18H2v4"/><path d="M18 6h4V2"/></svg>
                    </button>
                    <button class="debug-icon-button interactive" id="debug-copy" type="button" aria-label="复制报错" title="复制">
                        <svg viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    </button>
                    <button class="debug-icon-button interactive" id="debug-clear" type="button" aria-label="清空控制台" title="清空">
                        <svg viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v5M14 11v5"/></svg>
                    </button>
                </div>
            </div>
            <div class="debug-output" id="debug-output" role="log" aria-live="polite"></div>
        </section>
    </div>

    <div class="settings-storage-view" id="settings-storage-view" aria-label="储存与管理" hidden>
        <div class="settings-subpage-bar">
            <div class="settings-subpage-kicker">STORAGE MANAGER</div>
            <button class="settings-subpage-title interactive" id="settings-storage-title" type="button" aria-label="返回设置列表">储存与管理</button>
            <p class="settings-subpage-note">备份、导入、压缩、重置 Rinno 的本地数据，导出文件名会按时间自动生成。</p>
        </div>

        <section class="storage-panel storage-summary-panel">
            <div class="storage-panel-head">
                <div>
                    <div class="storage-panel-kicker">SUMMARY</div>
                    <h2 class="storage-panel-title">当前存储概览</h2>
                </div>
                <button class="storage-outline-button interactive" id="storage-refresh-summary" type="button" data-storage-action>刷新统计</button>
            </div>

            <div class="storage-stat-grid">
                <article class="storage-stat-card">
                    <span class="storage-stat-label">总占用</span>
                    <strong class="storage-stat-value" id="storage-total-size">--</strong>
                    <span class="storage-stat-note" id="storage-total-meta">Dexie / Legacy localStorage</span>
                </article>
                <article class="storage-stat-card">
                    <span class="storage-stat-label">可压缩图片</span>
                    <strong class="storage-stat-value" id="storage-image-count">--</strong>
                    <span class="storage-stat-note" id="storage-image-meta">可编辑图像与封面</span>
                </article>
                <article class="storage-stat-card">
                    <span class="storage-stat-label">桌面页面</span>
                    <strong class="storage-stat-value" id="storage-page-count">--</strong>
                    <span class="storage-stat-note" id="storage-page-meta">已保存布局页数</span>
                </article>
                <article class="storage-stat-card">
                    <span class="storage-stat-label">本地键值</span>
                    <strong class="storage-stat-value" id="storage-local-key-count">--</strong>
                    <span class="storage-stat-note" id="storage-local-meta">Rinno 子页存档</span>
                </article>
            </div>

            <p class="storage-inline-status" id="storage-inline-status" aria-live="polite"></p>
        </section>

        <section class="storage-panel">
            <div class="storage-panel-head">
                <div>
                    <div class="storage-panel-kicker">IMAGE</div>
                    <h2 class="storage-panel-title">图片压缩</h2>
                </div>
            </div>
            <p class="storage-panel-note">只处理本地数据库和 Rinno 本地存档里的图片，优先转成 WebP，并且仅在体积更小时覆盖原文件。</p>
            <div class="storage-action-row">
                <button class="storage-primary-button interactive" id="storage-compress-images" type="button" data-storage-action>压缩已存图片</button>
                <span class="storage-helper-copy">压缩完成后会立即刷新统计，不会动到其他文字或布局数据。</span>
            </div>
        </section>

        <section class="storage-panel">
            <div class="storage-panel-head">
                <div>
                    <div class="storage-panel-kicker">EXPORT</div>
                    <h2 class="storage-panel-title">批量导出</h2>
                </div>
            </div>

            <div class="storage-format-group" id="storage-format-group" aria-label="导出格式">
                <button class="storage-format-button interactive active" type="button" data-storage-format="zip" aria-pressed="true">ZIP</button>
                <button class="storage-format-button interactive" type="button" data-storage-format="json" aria-pressed="false">JSON</button>
            </div>

            <div class="storage-scope-grid" id="storage-scope-grid">
                <label class="storage-scope-card">
                    <input id="storage-scope-layout" type="checkbox" value="layout" checked>
                    <span class="storage-scope-title">桌面布局</span>
                    <span class="storage-scope-note">页面、图标和组件顺序</span>
                </label>
                <label class="storage-scope-card">
                    <input id="storage-scope-edits" type="checkbox" value="edits" checked>
                    <span class="storage-scope-title">编辑内容</span>
                    <span class="storage-scope-note">文本、图片、设置编辑数据</span>
                </label>
                <label class="storage-scope-card">
                    <input id="storage-scope-local" type="checkbox" value="localStorage" checked>
                    <span class="storage-scope-title">子页存档</span>
                    <span class="storage-scope-note">旧版 Rinno localStorage 迁移残留</span>
                </label>
            </div>

            <div class="storage-action-row storage-action-row-dual">
                <button class="storage-primary-button interactive" id="storage-export-selected" type="button" data-storage-action>批量导出所选</button>
                <button class="storage-outline-button interactive" id="storage-export-all" type="button" data-storage-action>导出全部文件</button>
            </div>
            <p class="storage-helper-copy" id="storage-filename-preview">文件名示例：Rinno-2026-04-24-19-30.zip</p>
        </section>

        <section class="storage-panel">
            <div class="storage-panel-head">
                <div>
                    <div class="storage-panel-kicker">IMPORT</div>
                    <h2 class="storage-panel-title">导入文件</h2>
                </div>
            </div>

            <div class="storage-import-dropzone" id="storage-import-dropzone" tabindex="0" role="button" aria-describedby="storage-import-note">
                <div class="storage-import-copy">
                    <strong>拖拽 JSON / ZIP 到这里</strong>
                    <span id="storage-import-note">同时兼容点击选择和拖放导入，也能识别 JSON 直存备份与 ZIP 封装备份。</span>
                </div>
                <div class="storage-action-row storage-action-row-dual">
                    <button class="storage-outline-button interactive" id="storage-pick-file" type="button" data-storage-action>选择导入文件</button>
                    <button class="storage-primary-button interactive" id="storage-import-file" type="button" data-storage-action>立即导入</button>
                </div>
            </div>
            <input id="settings-storage-import-input" type="file" accept=".json,.zip,application/json,application/zip" hidden>
        </section>

        <section class="storage-panel storage-danger-panel">
            <div class="storage-panel-head">
                <div>
                    <div class="storage-panel-kicker">DANGER ZONE</div>
                    <h2 class="storage-panel-title">重置所有数据</h2>
                </div>
            </div>
            <p class="storage-panel-note">会清空 Dexie 数据库，以及检测到的旧版 localStorage 残留；刷新后恢复到初始状态。</p>
            <div class="storage-action-row">
                <button class="storage-danger-button interactive" id="storage-reset-all" type="button" data-storage-action>重置全部数据</button>
            </div>
        </section>
    </div>

    <div class="api-preset-modal" id="api-preset-modal" role="dialog" aria-modal="true" aria-labelledby="api-preset-modal-title" hidden>
        <form class="api-preset-dialog" id="api-preset-form" autocomplete="off">
            <div class="api-modal-head">
                <div>
                    <div class="api-modal-kicker" id="api-preset-modal-kicker">PRESET</div>
                    <div class="api-modal-title" id="api-preset-modal-title">存为预设</div>
                </div>
            </div>
            <label class="api-field">
                <span class="api-label">预设名称</span>
                <input class="api-preset-name-input" id="api-preset-name" name="api_preset_name" type="text" maxlength="32" autocomplete="off">
            </label>
            <div class="api-modal-actions">
                <button class="api-modal-button interactive" id="api-preset-cancel" type="button">取消</button>
                <button class="api-modal-button primary interactive" type="submit">保存</button>
            </div>
        </form>
    </div>

    <div class="api-system-toast" id="api-system-toast" role="status" aria-live="polite" hidden>
        <span class="api-system-text" id="api-system-toast-text"></span>
    </div>
</section>
