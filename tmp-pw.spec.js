const { test, expect } = require('@playwright/test'); test('smoke', async ({ page }) => { await page.goto('http://127.0.0.1:4173/index.html'); expect(await page.title()).toContain('Rinno'); });
