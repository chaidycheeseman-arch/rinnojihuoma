const fs = require('fs');
const path = 'C:/Users/1/Desktop/Rinno/app/private/private.css';
let text = fs.readFileSync(path, 'utf8');
const replacements = [
  ['.private-register-screen {\n    min-height: 100dvh;', '.private-register-screen {\n    min-height: 100%;'],
  ['#private-app .private-chat-screen[data-private-current-tab="contact-chat"],\n#private-app .private-chat-screen[data-private-current-tab="contact-chat-settings"] {', '#private-app .private-chat-screen.active[data-private-current-tab="contact-chat"],\n#private-app .private-chat-screen.active[data-private-current-tab="contact-chat-settings"] {'],
  ['#private-app .private-chat-screen[data-private-current-tab="contact-chat"] .private-chat-top,', '#private-app .private-chat-screen.active[data-private-current-tab="contact-chat"] .private-chat-top,'],
  ['#private-app .private-chat-screen[data-private-current-tab="contact-chat"] .private-tabbar,', '#private-app .private-chat-screen.active[data-private-current-tab="contact-chat"] .private-tabbar,'],
  ['#private-app .private-chat-screen[data-private-current-tab="contact-chat-settings"] .private-chat-top,', '#private-app .private-chat-screen.active[data-private-current-tab="contact-chat-settings"] .private-chat-top,'],
  ['#private-app .private-chat-screen[data-private-current-tab="contact-chat-settings"] .private-tabbar {', '#private-app .private-chat-screen.active[data-private-current-tab="contact-chat-settings"] .private-tabbar {'],
  ['#private-app .private-chat-screen[data-private-current-tab="contact-chat"] .private-chat-shell,', '#private-app .private-chat-screen.active[data-private-current-tab="contact-chat"] .private-chat-shell,'],
  ['#private-app .private-chat-screen[data-private-current-tab="contact-chat-settings"] .private-chat-shell {', '#private-app .private-chat-screen.active[data-private-current-tab="contact-chat-settings"] .private-chat-shell {'],
  ['#private-app .private-chat-screen[data-private-current-tab="contact-chat"] .private-panel-wrap,', '#private-app .private-chat-screen.active[data-private-current-tab="contact-chat"] .private-panel-wrap,'],
  ['#private-app .private-chat-screen[data-private-current-tab="contact-chat-settings"] .private-panel-wrap {', '#private-app .private-chat-screen.active[data-private-current-tab="contact-chat-settings"] .private-panel-wrap {'],
  ['#private-app .private-chat-screen[data-private-current-tab="contact-chat"] .private-pane,', '#private-app .private-chat-screen.active[data-private-current-tab="contact-chat"] .private-pane,'],
  ['#private-app .private-chat-screen[data-private-current-tab="contact-chat-settings"] .private-pane {', '#private-app .private-chat-screen.active[data-private-current-tab="contact-chat-settings"] .private-pane {'],
  ['#private-app .private-chat-screen[data-private-current-tab="contact-chat-settings"] .private-contact-chat-settings-pane.active {', '#private-app .private-chat-screen.active[data-private-current-tab="contact-chat-settings"] .private-contact-chat-settings-pane.active {'],
  ['    height: 100dvh !important;\n    min-height: 100dvh !important;', '    height: 100% !important;\n    min-height: 100% !important;'],
  ['    display: block !important;\n    width: 100% !important;\n    height: 100dvh !important;', '    display: block !important;\n    width: 100% !important;\n    height: 100% !important;'],
  ['.private-register-screen,\n.private-login-screen {\n    min-height: 100dvh !important;', '.private-register-screen,\n.private-login-screen {\n    min-height: 100% !important;'],
  ['#private-app .private-chat-screen[data-private-current-tab="sticker-library"] .private-chat-shell {\n    height: 100dvh !important;', '#private-app .private-chat-screen.active[data-private-current-tab="sticker-library"] .private-chat-shell {\n    height: 100% !important;']
];
for (const [from, to] of replacements) {
  text = text.replace(from, to);
}
fs.writeFileSync(path, text, 'utf8');
