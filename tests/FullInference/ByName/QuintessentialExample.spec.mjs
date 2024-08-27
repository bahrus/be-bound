import { test, expect } from '@playwright/test';
test('Quintessential Example', async ({ page }) => {
    await page.goto('./tests/FullInference/ByName/QuintessentialExample.html');
    // wait for 1 second
    await page.waitForTimeout(1000);
    const editor = page.locator('#target');
    await expect(editor).toHaveAttribute('mark', 'good');
});
