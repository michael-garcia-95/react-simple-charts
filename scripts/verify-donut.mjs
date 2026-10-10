/* global document, window */
// Real Chromium audit of the public Donut playground; artifacts remain ignored.
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
const evidence = resolve(root, 'work/visual/donut');
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
const report = {
  browser: browser.version(),
  widths: [],
  alignment: [],
  axe: [],
  gestures: [],
  errors,
};
const fixture = (name) => page.locator(`[data-donut="${name}"]`);
async function coordinates(name, angle, radius) {
  await fixture(name).scrollIntoViewIfNeeded();
  return fixture(name)
    .locator('svg')
    .evaluate(
      (el, { angle, radius }) => {
        const m = el.getScreenCTM(),
          v = el.viewBox.baseVal;
        const x = v.width / 2 + Math.sin(angle) * radius,
          y = v.height / 2 - Math.cos(angle) * radius;
        return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f };
      },
      { angle, radius },
    );
}
try {
  await page.goto(process.env.RSC_SMOKE_URL ?? 'http://127.0.0.1:5173');
  await fixture('narrow').locator('svg').waitFor();
  for (const width of [320, 480, 1200]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(100);
    for (const name of [
      'ordinary',
      'single',
      'custom',
      'thin',
      'duplicates',
      'excluded',
      'negative',
      'empty',
      'narrow',
      'rectangle',
      'tiny',
      'paired',
      'all',
    ]) {
      const el = fixture(name);
      await el.scrollIntoViewIfNeeded();
      const bounds = await el.evaluate((node) => ({
        client: node.clientWidth,
        scroll: node.scrollWidth,
        tables: node.querySelectorAll('table').length,
      }));
      assert(bounds.tables > 0);
      assert(bounds.scroll <= bounds.client + 1, name + ' overflow');
      if (
        ['ordinary', 'custom', 'thin', 'narrow', 'rectangle', 'tiny'].includes(
          name,
        )
      ) {
        const alignment = await el.evaluate((node) => {
          const svg = node.querySelector('svg'),
            center = node.querySelector('[data-donut-center]');
          const a = svg.getBoundingClientRect(),
            b = center.getBoundingClientRect(),
            v = svg.viewBox.baseVal;
          const factor = a.width / v.width;
          return {
            dx: Math.abs(a.x + a.width / 2 - b.x - b.width / 2),
            dy: Math.abs(a.y + a.height / 2 - b.y - b.height / 2),
            diameter: Math.hypot(b.width, b.height),
            outer: (Math.min(v.width, v.height) / 2 - 8) * factor,
            displayedWidth: a.width,
            displayedHeight: a.height,
            ratio: v.width / v.height,
          };
        });
        assert(alignment.dx < 1 && alignment.dy < 1, name + ' alignment');
        const ratio = {
          ordinary: 0.6,
          custom: 0.4,
          thin: 0.8,
          narrow: 0.6,
          rectangle: 0.6,
          tiny: 0.01,
        }[name];
        assert(
          Math.abs(alignment.diameter - 2 * alignment.outer * ratio) < 1,
          name + ' contained center region',
        );
        assert(
          Math.abs(
            alignment.displayedWidth / alignment.displayedHeight -
              alignment.ratio,
          ) < 0.01,
          name + ' SVG aspect ratio',
        );
        report.alignment.push({ width, name, ...alignment });
      }
      await el.screenshot({ path: resolve(evidence, `${name}-${width}.png`) });
    }
    assert.equal(
      await fixture('single').locator('[data-layer=marks] path').count(),
      1,
    );
    const full = await fixture('single')
      .locator('[data-layer=marks] path')
      .getAttribute('d');
    assert.equal((full.match(/A/g) ?? []).length, 4);
    assert.equal(
      await fixture('negative').locator('[data-donut-center]').count(),
      0,
    );
    assert.equal(await fixture('empty').locator('svg').count(), 0);
    const target = fixture('ordinary').locator('[role=button]').last();
    await target.focus();
    assert.equal(
      await fixture('ordinary').locator('[role=tooltip]').count(),
      1,
    );
    assert.equal(
      await target.getAttribute('stroke'),
      'var(--rsc-focus-color, #075985)',
    );
    await fixture('ordinary').screenshot({
      path: resolve(evidence, `focus-tooltip-${width}.png`),
    });
    await page.keyboard.press('Escape');
    await page.keyboard.press('Tab');
    assert.equal(
      await target.evaluate((el) => el === document.activeElement),
      false,
    );
    const axe = await new AxeBuilder({ page })
      .include('#donut-examples')
      .analyze();
    assert.deepEqual(axe.violations, []);
    report.axe.push({ width, violations: 0 });
    report.widths.push(width);
  }
  await page.setViewportSize({ width: 1200, height: 900 });
  await fixture('ordinary').locator('[role=button]').first().focus();
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  assert(
    (await page.locator('#donut-examples > output').textContent()).includes(
      '(keyboard) · 1',
    ),
  );
  await page.keyboard.press('Escape');
  const hole = await coordinates('ordinary', 0, 0);
  await page.mouse.click(hole.x, hole.y);
  assert(
    (await page.locator('#donut-examples > output').textContent()).endsWith(
      '· 1',
    ),
  );
  const ring = await coordinates('ordinary', Math.PI * 1.8, 105.6);
  assert.equal(
    await page.evaluate(
      ({ x, y }) => document.elementFromPoint(x, y)?.getAttribute('role'),
      ring,
    ),
    'button',
  );
  await page.mouse.click(ring.x, ring.y);
  assert(
    (await page.locator('#donut-examples > output').textContent()).includes(
      'Support: 20 (pointer) · 2',
    ),
  );
  await page.touchscreen.tap(ring.x, ring.y);
  await page.waitForTimeout(350);
  assert(
    (await page.locator('#donut-examples > output').textContent()).includes(
      'Support: 20 (touch) · 3',
    ),
  );
  const control = fixture('ordinary').locator('[role=button]').last();
  await control.evaluate((el) => {
    for (const type of ['pointerdown', 'pointerup', 'click'])
      el.dispatchEvent(
        new window.PointerEvent(type, {
          bubbles: true,
          pointerType: 'pen',
          pointerId: 22,
          detail: 1,
        }),
      );
  });
  assert(
    (await page.locator('#donut-examples > output').textContent()).includes(
      '(pointer) · 4',
    ),
  );
  await control.evaluate((el) =>
    el.dispatchEvent(
      new window.MouseEvent('click', { bubbles: true, detail: 0 }),
    ),
  );
  assert(
    (await page.locator('#donut-examples > output').textContent()).includes(
      '(keyboard) · 5',
    ),
  );
  await fixture('custom').getByRole('button', { name: 'Details 0' }).click();
  assert.equal(
    await fixture('custom').getByRole('button', { name: 'Details 1' }).count(),
    1,
  );
  assert(
    (await page.locator('#donut-examples > output').textContent()).endsWith(
      '· 5',
    ),
  );
  await fixture('custom').getByRole('button', { name: 'Details 1' }).focus();
  await page.keyboard.press('Shift+Tab');
  assert.equal(
    await page.evaluate(() => document.activeElement?.tagName),
    'path',
  );
  await page.keyboard.press('Tab');
  assert.equal(
    await page.evaluate(() =>
      document.activeElement?.getAttribute('aria-label'),
    ),
    'Details 1',
  );
  report.gestures = [
    'keyboard',
    'empty-hole nonactivation',
    'mouse ring',
    'native Chromium touch exactly once',
    'synthetic pen',
    'standalone accessibility click',
    'center button',
    'Tab and Shift+Tab',
  ];
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
