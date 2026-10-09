/* global document, window, getComputedStyle, requestAnimationFrame */
/** Optional Chromium audit of the real playground; driver lives in ignored work/. */
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
const evidence = resolve(root, 'work/visual/integration');
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.RSC_BROWSER_PATH ?? '/usr/bin/chromium',
  args: ['--no-sandbox'],
});
const context = await browser.newContext({
  viewport: { width: 1600, height: 1000 },
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
  axe: [],
  performance: [],
  techniques: {
    forcedColors: 'Chromium forced-colors: active emulation',
    textScale:
      'CSS font-size 200% on integration fixture; not native browser zoom',
  },
  errors,
};
try {
  await page.goto(process.env.RSC_SMOKE_URL ?? 'http://127.0.0.1:5173');
  // Remove only playground page maximum, so requested container widths can be exercised.
  await page.addStyleTag({ content: 'main {max-width:none}' });
  const families = ['line', 'area', 'vertical', 'horizontal', 'grouped'];
  const figure = (f) => page.locator(`[data-integration=${f}] figure`);
  for (const width of [320, 480, 768, 1200, 320]) {
    await page.locator('#integration-width').selectOption(String(width));
    for (const family of families) {
      await page.waitForFunction(
        ({ family, width }) =>
          Number(
            document
              .querySelector(`[data-integration=${family}] svg`)
              ?.getAttribute('width'),
          ) === width,
        { family, width },
      );
      const chart = figure(family);
      await chart.locator('[role=button]').first().focus();
      const dimensions = await chart.evaluate((el) => {
        const t = el.querySelector('[role=tooltip]');
        const table = el.querySelector('table');
        return {
          tooltipClient: t.clientWidth,
          tooltipScroll: t.scrollWidth,
          tableClient: table.clientWidth,
          tableScroll: table.scrollWidth,
          tableWidth: table.getBoundingClientRect().width,
          width: el.getBoundingClientRect().width,
          stroke: document.activeElement.getAttribute('stroke'),
        };
      });
      assert(
        dimensions.tooltipScroll <= dimensions.tooltipClient + 1,
        `${family} tooltip text overflow`,
      );
      assert(
        dimensions.tableScroll <= dimensions.tableClient + 1,
        `${family} source text overflow`,
      );
      assert(
        dimensions.tableWidth <= dimensions.width + 1,
        `${family} table overflow`,
      );
      assert.notEqual(dimensions.stroke, 'transparent');
      await chart.screenshot({
        path: resolve(evidence, `${family}-${width}-focus-tooltip.png`),
      });
      await page.keyboard.press('Escape');
    }
    report.widths.push(width);
  }
  // Actual keyboard order: one chart entry, ordinary controls before/after, no activation on focus.
  assert.equal(
    await page.locator('#integration-activations').textContent(),
    '0',
  );
  for (const [index, family] of families.entries()) {
    const chart = figure(family);
    const first = chart.locator('[role=button]').first();
    await first.focus();
    await page.keyboard.press('End');
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    assert.equal(
      await page.locator('#integration-activations').textContent(),
      String((index + 1) * 2),
    );
    await page.keyboard.press('Escape');
    assert.equal(await chart.locator('[role=tooltip]').count(), 0);
    await page.keyboard.press('Tab');
    if (index < families.length - 1)
      assert(
        await figure(families[index + 1])
          .locator('[role=button]')
          .first()
          .evaluate((el) => el === document.activeElement),
      );
    else
      assert(
        await page
          .locator('#integration-after')
          .evaluate((el) => el === document.activeElement),
      );
    await first.focus();
    await page.keyboard.press('Shift+Tab');
    assert(
      !(await chart.evaluate((el) => el.contains(document.activeElement))),
    );
  }
  // Native mouse/touch and browser-dispatched pen, cancellation and delayed clicks.
  let activations = 10;
  const checkActivation = async (method, increment = true) => {
    if (increment) activations++;
    assert.equal(
      await page.locator('#integration-activations').textContent(),
      String(activations),
    );
    assert.equal(
      await page.locator('#integration-method').textContent(),
      method,
    );
  };
  for (const family of families) {
    const first = figure(family).locator('[role=button]').first();
    await first.hover();
    assert.equal(
      await page.locator('#integration-activations').textContent(),
      String(activations),
    );
    await first.click();
    await checkActivation('pointer');
    await first.evaluate((el) => {
      for (const type of ['pointerdown', 'pointerup', 'click'])
        el.dispatchEvent(
          new window.PointerEvent(type, {
            bubbles: true,
            pointerType: 'pen',
            pointerId: 42,
            detail: 0,
          }),
        );
    });
    await checkActivation('pointer');
    await first.scrollIntoViewIfNeeded();
    const box = await first.boundingBox();
    assert(box);
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    await checkActivation('touch');
    await first.evaluate((el) => {
      for (const type of ['pointerdown', 'pointerup'])
        el.dispatchEvent(
          new window.PointerEvent(type, {
            bubbles: true,
            pointerType: 'touch',
            pointerId: 99,
          }),
        );
    });
    await checkActivation('touch');
    // A separate browser task after click evidence expiry.
    await first.evaluate(
      (el) =>
        new Promise((resolve) =>
          setTimeout(() => {
            el.dispatchEvent(
              new window.PointerEvent('click', {
                bubbles: true,
                pointerType: 'touch',
                pointerId: 99,
                detail: 1,
              }),
            );
            resolve();
          }, 30),
        ),
    );
    await checkActivation('touch', false);
    await first.evaluate((el) =>
      el.dispatchEvent(
        new window.MouseEvent('click', { bubbles: true, detail: 0 }),
      ),
    );
    await checkActivation('keyboard');
    await first.evaluate((el) => {
      el.dispatchEvent(
        new window.PointerEvent('pointerdown', {
          bubbles: true,
          pointerType: 'pen',
          pointerId: 43,
        }),
      );
      el.dispatchEvent(
        new window.PointerEvent('pointercancel', {
          bubbles: true,
          pointerType: 'pen',
          pointerId: 43,
        }),
      );
      el.dispatchEvent(
        new window.MouseEvent('click', { bubbles: true, detail: 0 }),
      );
    });
    await checkActivation('keyboard');
    await page.keyboard.press('Escape');
  }
  for (const state of ['empty', 'unusable', 'ready']) {
    await page.locator('#integration-state').selectOption(state);
    await page.waitForFunction(
      (state) =>
        document.querySelectorAll('#integration svg').length ===
        (state === 'ready' ? 5 : 0),
      state,
    );
    assert.equal(await page.locator('#integration table').count(), 5);
    const axe = await new AxeBuilder({ page })
      .include('#integration')
      .analyze();
    assert.deepEqual(axe.violations, []);
    report.axe.push({ state, violations: 0 });
    await page
      .locator('#integration')
      .screenshot({ path: resolve(evidence, `state-${state}.png`) });
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('#integration-width').selectOption('480');
  await page.waitForFunction(
    () =>
      Number(
        document.querySelector('#integration svg')?.getAttribute('width'),
      ) === 480,
  );
  assert.equal(
    await page
      .locator('#integration')
      .evaluate((el) => el.getAnimations({ subtree: true }).length),
    0,
  );
  await page.emulateMedia({ forcedColors: 'active' });
  await figure('horizontal').locator('[role=button]').first().focus();
  await page
    .locator('#integration')
    .screenshot({ path: resolve(evidence, 'forced-colors.png') });
  report.forcedColors = await figure('horizontal').evaluate((el) => ({
    outline: getComputedStyle(el.querySelector('svg')).outlineColor,
    text: getComputedStyle(el.querySelector('[role=tooltip]')).color,
    background: getComputedStyle(el.querySelector('[role=tooltip]'))
      .backgroundColor,
    table: !!el.querySelector('table'),
  }));
  await page.emulateMedia({ forcedColors: 'none' });
  await page.addStyleTag({ content: '#integration {font-size:200%}' });
  await figure('line').locator('[role=button]').first().focus();
  await page
    .locator('#integration')
    .screenshot({ path: resolve(evidence, 'text-200-percent.png') });
  report.textScale = await figure('line').evaluate((el) => ({
    font: getComputedStyle(el.querySelector('table')).fontSize,
    tooltipWidth: el.querySelector('[role=tooltip]').getBoundingClientRect()
      .width,
    chartWidth: el.getBoundingClientRect().width,
  }));
  await page.addStyleTag({ content: '#integration {font-size:100%}' });
  await page.keyboard.press('Escape');
  for (const rows of [10, 100, 1000]) {
    const measurements = [];
    for (let repeat = 0; repeat < 3; repeat++) {
      await page.locator('#integration-rows').selectOption('0');
      measurements.push(
        await page.evaluate(async (rows) => {
          const select = document.querySelector('#integration-rows');
          const start = performance.now();
          select.value = String(rows);
          select.dispatchEvent(new Event('change', { bubbles: true }));
          await new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          );
          const renderMs = performance.now() - start;
          const width = document.querySelector('#integration-width');
          const resizeStart = performance.now();
          width.value = width.value === '480' ? '768' : '480';
          width.dispatchEvent(new Event('change', { bubbles: true }));
          await new Promise((resolve) =>
            requestAnimationFrame(() =>
              requestAnimationFrame(() => requestAnimationFrame(resolve)),
            ),
          );
          return {
            renderMs,
            resizeMs: performance.now() - resizeStart,
            charts: [...document.querySelectorAll('[data-integration]')].map(
              (el) => ({
                family: el.getAttribute('data-integration'),
                marks: el.querySelectorAll(
                  '[data-layer=marks] circle,[data-layer=marks] path,[data-layer=marks] rect',
                ).length,
                controls: el.querySelectorAll(
                  '[data-layer=inspection] [role=button]',
                ).length,
              }),
            ),
          };
        }, rows),
      );
    }
    report.performance.push({ rows, measurements });
  }
  assert.deepEqual(errors, []);
} finally {
  await writeFile(
    resolve(evidence, 'results.json'),
    JSON.stringify(report, null, 2),
  );
  await browser.close();
}
console.log(JSON.stringify(report, null, 2));
