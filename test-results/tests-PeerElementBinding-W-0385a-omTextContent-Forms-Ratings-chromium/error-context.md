# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\PeerElementBinding\WithID\FromTextContent.spec.mjs >> Forms>Ratings
- Location: tests\PeerElementBinding\WithID\FromTextContent.spec.mjs:2:1

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator:  locator('#target')
Expected: "good"
Received: ""
Timeout:  5000ms

Call log:
  - Expect "toHaveAttribute" with timeout 5000ms
  - waiting for locator('#target')
    14 × locator resolved to <div id="target"></div>
       - unexpected value "null"

```

```yaml
- textbox
- text: hello
```

# Test source

```ts
  1 | import { test, expect } from '@playwright/test';
  2 | test('Forms>Ratings', async ({ page }) => {
  3 |     await page.goto('./tests/PeerElementBinding/WithID/FromTextContent.html');
  4 |     // wait for 1 second
  5 |     await page.waitForTimeout(3000);
  6 |     const editor = page.locator('#target');
> 7 |     await expect(editor).toHaveAttribute('mark', 'good');
    |                          ^ Error: expect(locator).toHaveAttribute(expected) failed
  8 | });
  9 | 
```