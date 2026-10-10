/* global document */
// Optional real Chromium audit of public Pie playground fixtures.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const require = createRequire(
  resolve(root, 'work/consumers/driver/package.json'),
);
const { chromium } = require('playwright-core');
const { default: AxeBuilder } = require('@axe-core/playwright');
const evidence = resolve(root, 'work/visual/pie');
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.RSC_BROWSER_PATH ?? '/usr/bin/chromium',
  args: ['--no-sandbox'],
});
const context = await browser.newContext({
  viewport: { width: 1200, height: 900 },
  hasTouch: true,
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
const report = { browser: browser.version(), widths: [], axe: [], errors };
try {
  await page.goto(process.env.RSC_SMOKE_URL ?? 'http://127.0.0.1:5173');
  await page.locator('[data-pie=narrow] svg').waitFor();
  for (const width of [320, 480, 1200]) {
    await page.setViewportSize({ width, height: 900 });
    for (const fixture of [
      'ordinary',
      'single',
      'duplicates',
      'excluded',
      'negative',
      'custom',
      'narrow',
      'many',
      'empty',
    ]) {
      const el = page.locator(`[data-pie=${fixture}]`);
      await el.scrollIntoViewIfNeeded();
      const dimensions = await el.evaluate((node) => ({
        client: node.clientWidth,
        scroll: node.scrollWidth,
        table: !!node.querySelector('table'),
      }));
      assert(dimensions.table);
      assert(dimensions.scroll <= dimensions.client + 1, fixture + ' overflow');
      await el.screenshot({
        path: resolve(evidence, `${fixture}-${width}.png`),
      });
    }
    const narrow = page.locator('[data-pie=narrow]');
    const target = narrow.locator('[role=button]').last();
    await target.focus();
    assert.equal(await narrow.locator('[role=tooltip]').count(), 1);
    assert.equal(
      await target.getAttribute('stroke'),
      'var(--rsc-focus-color, #075985)',
    );
    await narrow.screenshot({
      path: resolve(evidence, `focus-tooltip-${width}.png`),
    });
    const axe = await new AxeBuilder({ page })
      .include('#pie-examples')
      .analyze();
    assert.deepEqual(axe.violations, []);
    report.axe.push({ width, violations: 0 });
    await page.keyboard.press('Escape');
    assert.equal(await narrow.locator('[role=tooltip]').count(), 0);
    await page.keyboard.press('Tab');
    assert.equal(
      await target.evaluate((el) => el === document.activeElement),
      false,
    );
    report.widths.push(width);
  }
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.locator('[data-pie=ordinary] [role=button]').first().focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  assert(
    (await page.locator('#pie-examples > output').textContent()).includes(
      '(keyboard)',
    ),
  );
  await page.keyboard.press('Escape');
  const target = page.locator('[data-pie=ordinary] [role=button]').last();
  await target.scrollIntoViewIfNeeded();
  // Use the actual engine-coordinate bisector inside Support's 20% sector.
  const point = await target.evaluate((el) => {
    const svg = el.ownerSVGElement;
    const matrix = svg.getScreenCTM();
    const angle = 2 * Math.PI * 0.9;
    const x = 240 + Math.sin(angle) * 80;
    const y = 140 - Math.cos(angle) * 80;
    return { x: matrix.a * x + matrix.e, y: matrix.d * y + matrix.f };
  });
  await page.touchscreen.tap(point.x, point.y);
  assert(
    (await page.locator('#pie-examples > output').textContent()).includes(
      'Support: 20 (touch)',
    ),
  );
  await page.waitForTimeout(350);
  assert(
    (await page.locator('#pie-examples > output').textContent()).includes(
      '(touch)',
    ),
  );
  await page.screenshot({
    path: resolve(evidence, 'several-charts.png'),
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  await writeFile(
    resolve(evidence, 'results.json'),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await context.close();
  await browser.close();
}
