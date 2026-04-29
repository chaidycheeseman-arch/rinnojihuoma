const { test } = require('playwright/test');

test('dump cached script bundle', async ({ page }) => {
  await page.goto('http://127.0.0.1:5500/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  const result = await page.evaluate(async () => {
    const cacheKeys = await caches.keys();
    const urls = [];
    for (const key of cacheKeys) {
      const cache = await caches.open(key);
      const requests = await cache.keys();
      urls.push(...requests.map(request => request.url));
      const match = requests.find(request => /script\.js\?v=20260427-[^/?#]+$/i.test(request.url));
      if (!match) continue;
      const response = await cache.match(match);
      if (!response) continue;
      return {
        cacheKeys,
        urls,
        scriptText: await response.text()
      };
    }
    return { cacheKeys, urls, scriptText: '' };
  });

  console.log(JSON.stringify({
    cacheKeys: result.cacheKeys,
    urlCount: result.urls.length,
    scriptLength: result.scriptText.length
  }, null, 2));

  if (result.scriptText) {
    console.log('---SCRIPT-START---');
    console.log(result.scriptText);
    console.log('---SCRIPT-END---');
  } else {
    console.log(JSON.stringify(result.urls, null, 2));
  }
});
