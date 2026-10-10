/* global document, getComputedStyle */
// Production browser QA. Install the existing isolated driver in work/consumers/driver.
// Start npm run preview:site -- --host 127.0.0.1 --port 4320 before running.
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const require = createRequire(
  resolve(root, 'work/consumers/driver/package.json'),
);
const { chromium } = require('playwright-core');
const { default: AxeBuilder } = require('@axe-core/playwright');
const evidence = resolve(root, 'work/visual/site');
await mkdir(evidence, { recursive: true });
const origin = process.env.RSC_SITE_URL ?? 'http://127.0.0.1:4320';
const browser = await chromium.launch({
  executablePath: process.env.RSC_BROWSER_PATH ?? '/usr/bin/chromium',
  args: ['--no-sandbox'],
});
const context = await browser.newContext({
  viewport: { width: 1200, height: 900 },
});
const page = await context.newPage();
const errors = [];
page.on('response', (response) => {
  if (response.status() >= 400)
    errors.push(`${response.status()} ${response.url()}`);
});
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
const report = {
  browser: browser.version(),
  widths: [],
  axe: [],
  keyboard: [],
  errors,
};
const routes = ['/', '/examples/', '/documentation/', '/about/'];
async function bounds() {
  return page.evaluate(() => ({
    pageWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    charts: [...document.querySelectorAll('main figure svg')].map((svg) => {
      const rect = svg.getBoundingClientRect();
      const figure = svg.closest('figure').getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
        left: rect.left,
        right: rect.right,
        figureWidth: figure.width,
        viewBox: svg.getAttribute('viewBox'),
      };
    }),
  }));
}
try {
  for (const width of [320, 480, 768, 1200]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      const response = await page.goto(origin + route);
      assert.equal(response.status(), 200);
      const count =
        route === '/examples/' ? 5 : route === '/documentation/' ? 0 : 1;
      await page.waitForFunction(
        (expected) =>
          document.querySelectorAll('main figure svg').length === expected,
        count,
      );
      assert.equal(await page.locator('h1').count(), 1);
      assert.equal(await page.locator('nav a[aria-current="page"]').count(), 1);
      assert.equal(
        await page.locator('nav a[aria-current="page"]').getAttribute('href'),
        route,
      );
      const label =
        route === '/'
          ? 'Home'
          : route.slice(1, -1).replace(/^./, (c) => c.toUpperCase());
      assert.equal(await page.title(), `${label} | React Simple Charts`);
      assert.ok(
        (await page.locator('meta[name="description"]').getAttribute('content'))
          .length > 40,
      );
      const measured = await bounds();
      assert.ok(
        measured.scrollWidth <= measured.pageWidth + 1,
        `${route} overflow at ${width}: ${JSON.stringify(measured)}`,
      );
      for (const chart of measured.charts) {
        assert.ok(chart.width > 0 && chart.height > 0);
        assert.ok(chart.left >= -1 && chart.right <= width + 1);
        assert.ok(Math.abs(chart.width - chart.figureWidth) < 2);
      }
      assert.equal(await page.locator('main table').count(), count);
      if (count)
        assert.match(await page.locator('main').ariaSnapshot(), /table/);
      const footerBottom = await page
        .locator('footer')
        .evaluate(
          (el) =>
            el.getBoundingClientRect().bottom +
            document.documentElement.scrollTop,
        );
      const documentHeight = await page.evaluate(
        () => document.documentElement.scrollHeight,
      );
      assert.ok(
        documentHeight <= Math.max(900, footerBottom) + 1,
        `${route} has unintended trailing scroll space`,
      );
      for (const link of await page.locator('a').all()) {
        const href = await link.getAttribute('href');
        if (href.startsWith('/') || href.startsWith('#')) {
          const url = new URL(href, page.url());
          assert.equal((await context.request.get(url.href)).status(), 200);
          if (url.hash && url.pathname === route)
            assert.equal(await page.locator(url.hash).count(), 1);
        }
      }
      const scan = await new AxeBuilder({ page }).analyze();
      report.axe.push({ width, route, violations: scan.violations });
      assert.deepEqual(
        scan.violations,
        [],
        `${route} axe at ${width}: ${JSON.stringify(scan.violations)}`,
      );
      report.widths.push({ width, route, ...measured });
      if (route === '/' || route === '/examples/')
        await page.screenshot({
          path: resolve(
            evidence,
            `${route === '/' ? 'home' : 'examples'}-${width}.png`,
          ),
          fullPage: true,
        });
    }
  }
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto(origin);
  await page.keyboard.press('Tab');
  assert.equal(await page.locator(':focus').textContent(), 'Skip to content');
  assert.equal(
    await page
      .locator(':focus')
      .evaluate((el) => getComputedStyle(el).outlineStyle),
    'solid',
  );
  await page.keyboard.press('Enter');
  assert.equal(await page.locator(':focus').getAttribute('id'), 'main');
  // All mobile links are native, visible and keyboard reachable without a menu.
  await page.goto(origin);
  await page.locator('.skip-link').focus(); // Reset the navigation start after browser focus restoration.
  await page.keyboard.press('Tab'); // brand
  for (const label of ['Home', 'Examples', 'Documentation', 'About']) {
    await page.keyboard.press('Tab');
    assert.equal((await page.locator(':focus').textContent()).trim(), label);
  }
  await page.keyboard.press('Enter');
  await page.waitForURL('**/about/');
  report.keyboard.push(
    'Skip link, visible focus, all mobile navigation links and Enter navigation',
  );
  await page.goto(origin + '/examples/');
  await page.waitForFunction(
    () => document.querySelectorAll('main figure svg').length === 5,
  );
  for (const family of ['line', 'area', 'bar', 'pie', 'donut']) {
    const entry = page
      .locator(`#chart-${family} svg [role="button"][tabindex="0"]`)
      .first();
    await entry.focus();
    await page.keyboard.press('ArrowRight');
    assert.ok(
      (await page.locator(':focus').getAttribute('aria-label')).length > 0,
    );
    await page.keyboard.press('Escape');
  }
  report.keyboard.push('All five built charts support keyboard inspection');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await page.locator('.family-link').count(), 0);
  await page.goto(origin);
  const transition = await page
    .locator('.button')
    .first()
    .evaluate((el) => getComputedStyle(el).transitionDuration);
  assert.equal(transition, '0s');
  report.reducedMotion = 'Site transitions removed';
  for (const route of routes) {
    await page.goto(origin + route);
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    await page.waitForTimeout(100);
    const measured = await bounds();
    assert.ok(
      measured.scrollWidth <= measured.pageWidth + 1,
      `${route} enlarged text overflow`,
    );
  }
  report.enlargedText =
    'All four pages at 320px / 200% root font size, no document overflow';
  const manifest = JSON.parse(
    await readFile(resolve(root, 'package.json'), 'utf8'),
  );
  assert.deepEqual(manifest.files, ['dist', 'LICENSE']);
  assert.deepEqual(errors, []);
  await writeFile(
    resolve(evidence, 'results.json'),
    JSON.stringify(report, null, 2),
  );
  console.log(
    JSON.stringify(
      {
        browser: report.browser,
        layouts: report.widths.length,
        axeScans: report.axe.length,
        errors,
        evidence,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
