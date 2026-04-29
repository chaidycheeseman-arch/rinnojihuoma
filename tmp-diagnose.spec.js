const { test } = require('playwright/test');

test('diagnose rinno runtime and private layout', async ({ page }) => {
  const events = [];
  page.on('console', msg => {
    if (['error', 'warning'].includes(msg.type())) {
      events.push({ kind: 'console', type: msg.type(), text: msg.text() });
    }
  });
  page.on('pageerror', error => {
    events.push({ kind: 'pageerror', text: error.message, stack: error.stack });
  });
  page.on('requestfailed', request => {
    events.push({ kind: 'requestfailed', url: request.url(), failure: request.failure()?.errorText || '' });
  });

  await page.goto('http://127.0.0.1:4173/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const diagnostics = await page.evaluate(async () => {
    const result = {
      ready: typeof window.openStyleApp === 'function' && typeof window.openPrivateApp === 'function',
      styleUploadClicks: -1,
      styleCover: null,
      privateDisplays: null,
      privatePanels: null,
      appHeight: getComputedStyle(document.documentElement).getPropertyValue('--app-height').trim(),
      bodyClasses: document.body.className,
      currentTab: null
    };

    if (typeof window.openStyleApp === 'function') {
      window.openStyleApp();
      const input = document.getElementById('style-desktop-wallpaper-input');
      const cover = document.querySelector('#style-app .style-cover');
      let clicks = 0;
      input?.addEventListener('click', () => {
        clicks += 1;
      });
      cover?.click();
      await new Promise(resolve => setTimeout(resolve, 200));
      result.styleUploadClicks = clicks;
      result.styleCover = cover ? {
        className: cover.className,
        dataStyleUpload: cover.getAttribute('data-style-upload'),
        role: cover.getAttribute('role'),
        tabindex: cover.getAttribute('tabindex'),
        ariaLabel: cover.getAttribute('aria-label'),
        ariaHidden: cover.getAttribute('aria-hidden')
      } : null;
      if (typeof window.closeStyleApp === 'function') window.closeStyleApp(true);
    }

    if (typeof window.openPrivateApp === 'function' && typeof window.showPrivateScreen === 'function') {
      await window.openPrivateApp();
      window.showPrivateScreen('register');
      const chatScreen = document.querySelector('[data-private-screen="chat"]');
      const registerScreen = document.querySelector('[data-private-screen="register"]');
      const whisperPane = document.querySelector('[data-private-panel="whisper"]');
      const contactsPane = document.querySelector('[data-private-panel="contacts"]');
      result.currentTab = chatScreen?.getAttribute('data-private-current-tab') || null;
      result.privateDisplays = {
        registerHiddenAttr: registerScreen?.hidden ?? null,
        registerDisplay: registerScreen ? getComputedStyle(registerScreen).display : null,
        chatHiddenAttr: chatScreen?.hidden ?? null,
        chatDisplay: chatScreen ? getComputedStyle(chatScreen).display : null,
        chatVisibility: chatScreen ? getComputedStyle(chatScreen).visibility : null,
        chatHeight: chatScreen ? getComputedStyle(chatScreen).height : null
      };
      result.privatePanels = {
        whisperDisplay: whisperPane ? getComputedStyle(whisperPane).display : null,
        whisperHiddenAttr: whisperPane?.hidden ?? null,
        contactsDisplay: contactsPane ? getComputedStyle(contactsPane).display : null,
        contactsHiddenAttr: contactsPane?.hidden ?? null
      };
      if (typeof window.closePrivateApp === 'function') window.closePrivateApp(true);
    }

    return result;
  });

  console.log('---DIAGNOSTICS---');
  console.log(JSON.stringify({ diagnostics, events }, null, 2));
});
