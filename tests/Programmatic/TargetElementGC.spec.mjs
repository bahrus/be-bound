import { test, expect } from '@playwright/test';

// Needs gc() exposed, which forces its own worker -- hence a separate file.
test.use({ launchOptions: { args: ['--js-flags=--expose-gc'] } });

test('Programmatic>TargetElementGC: a removed target is not kept alive', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('./tests/Programmatic/TargetElementGC.html');
    await page.waitForTimeout(2000);
    // The test's own WeakRef lets it observe collection without keeping the element alive.
    await page.evaluate(() => {
        const kitchen = document.querySelector('#kitchen');
        globalThis.__kitchenRef = new WeakRef(kitchen);
        kitchen.remove();
    });
    // WeakRef targets survive until the current job ends, so collect across several turns.
    const collected = await page.evaluate(async () => {
        const ref = globalThis.__kitchenRef;
        for(let i = 0; i < 20 && ref.deref() !== undefined; i++){
            await new Promise(r => setTimeout(r, 50));
            globalThis.gc();
        }
        return ref.deref() === undefined;
    });
    expect(collected, 'the removed #kitchen was garbage collected, so the enhancement held no strong reference to it').toBe(true);
    // Afterwards, the enhancement keeps working for the live target, without errors.
    await page.evaluate(async () => {
        const porch = document.querySelector('#porch');
        porch.value = 'patio';
        porch.dispatchEvent(new Event('input'));
        const span1 = document.querySelector('#span1');
        span1.textContent = 'galley';
        span1.dispatchEvent(new Event('input'));
    });
    await page.waitForTimeout(300);
    expect(errors).toEqual([]);
    expect(await page.evaluate(() => document.querySelector('#span2').textContent === 'patio'), 'the other (live) target still works').toBe(true);
});
