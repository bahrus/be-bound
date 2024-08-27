import { test, expect } from '@playwright/test';
test('Forms>Ratings', async ({ page }) => {
    await page.goto('./tests/PeerElementBinding/WithID/FromTextContent.html');
    // wait for 1 second
    await page.waitForTimeout(1000);
    const editor = page.locator('#target');
    await expect(editor).toHaveAttribute('mark', 'good');
});
