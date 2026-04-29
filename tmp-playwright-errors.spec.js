const { test } = require('playwright/test');

test('capture console and network errors', async ({ page }) => {
  const events = [];
  page.on('console', msg => {
    if (['error', 'warning'].includes(msg.type())) {
      events.push({ kind: 'console', type: msg.type(), text: msg.text() });
    }
  });
  page.on('pageerror', error => {
    events.push({ kind: 'pageerror', text: error.message });
  });
  page.on('requestfailed', request => {
    events.push({ kind: 'requestfailed', url: request.url(), failure: request.failure()?.errorText || '' });
  });
  page.on('response', response => {
    if (response.status() >= 400) {
      events.push({ kind: 'response', status: response.status(), url: response.url() });
    }
  });

  await page.goto('http://127.0.0.1:5500/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  console.log(JSON.stringify(events, null, 2));
});
