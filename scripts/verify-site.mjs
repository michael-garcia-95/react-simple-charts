/* global document, getComputedStyle, window, Element, matchMedia */
// Production browser QA. Install the existing isolated driver in work/consumers/driver.
// Start node scripts/serve-site.mjs with the same --base before running.
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
const base =
  process.argv.find((arg) => arg.startsWith('--base='))?.slice(7) ?? '/';
assert.match(base, /^\/(?:[a-z0-9-]+\/)*$/);
const pathFor = (route) => base + route.slice(1);
const evidence = resolve(
  root,
  'work/visual/site',
  base === '/' ? 'root' : 'pages',
);
await mkdir(evidence, { recursive: true });
const origin = process.env.RSC_SITE_URL ?? 'http://127.0.0.1:4320';
const browser = await chromium.launch({
  executablePath: process.env.RSC_BROWSER_PATH ?? '/usr/bin/chromium',
  args: ['--no-sandbox'],
});
const context = await browser.newContext({
  viewport: { width: 1200, height: 900 },
});
await context.grantPermissions(['clipboard-read', 'clipboard-write']);
await context.addInitScript(() => {
  window.__chartAnimations = [];
  const original = Element.prototype.animate;
  Element.prototype.animate = function (...args) {
    window.__chartAnimations.push({
      reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
      duration: args[1]?.duration,
    });
    return original.apply(this, args);
  };
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
  base,
  interactions: [],
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
      const response = await page.goto(origin + pathFor(route));
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
        pathFor(route),
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
          if (href.startsWith('/'))
            assert.ok(href.startsWith(base), `Link escaped base: ${href}`);
          const url = new URL(href, page.url());
          assert.equal((await context.request.get(url.href)).status(), 200);
          if (url.hash && url.pathname === pathFor(route))
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
  // Exercise every family and current-code synchronization at each required width.
  for (const width of [320, 480, 768, 1200]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(origin + pathFor('/examples/'));
    await page.waitForFunction(
      () => document.querySelectorAll('main figure svg').length === 5,
    );
    for (const family of ['line', 'area', 'bar', 'pie', 'donut']) {
      const card = page.locator(`#chart-${family}`);
      const initial = await card.locator('pre code').textContent();
      const otherSources = await page
        .locator(`article:not(#chart-${family}) pre code`)
        .allTextContents();
      const dataset = card.getByRole('combobox', {
        name: 'Dataset',
        exact: true,
      });
      await dataset.focus();
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      assert.equal(await dataset.inputValue(), 'alternative');
      const alternative = await card.locator('pre code').textContent();
      assert.notEqual(alternative, initial);
      assert.ok(alternative.includes('const data = ['));
      assert.notEqual(await card.locator('table tbody').textContent(), '');
      const svgTitle = await card.locator('svg title').textContent();
      const presetLabel = await dataset.locator('option:checked').textContent();
      assert.ok(svgTitle.includes(presetLabel));
      assert.ok(alternative.includes(presetLabel));
      await card.getByLabel('Show source table', { exact: true }).uncheck();
      assert.equal(await card.locator('table').count(), 1);
      assert.ok(
        (await card.locator('pre code').textContent()).includes(
          "dataTable: 'visually-hidden'",
        ),
      );
      await card.getByLabel('Show legend', { exact: true }).uncheck();
      assert.equal(await card.locator('figure ul').count(), 0);
      const entry = card.locator('svg [role="button"][tabindex="0"]').first();
      await entry.focus();
      await page.keyboard.press('ArrowRight');
      assert.equal(await card.getByRole('tooltip').count(), 1);
      await card.getByLabel('Show tooltip', { exact: true }).focus();
      await page.keyboard.press('Space');
      await entry.focus();
      assert.equal(await card.getByRole('tooltip').count(), 0);
      const checkbox = card.getByLabel('Enable animation', { exact: true });
      await checkbox.check();
      assert.ok(
        (await card.locator('pre code').textContent()).includes(
          'animate={true}',
        ),
      );
      assert.ok(
        (await page.evaluate(() => window.__chartAnimations.length)) > 0,
      );
      if (['line', 'area', 'bar'].includes(family)) {
        await card.getByLabel('Show grid', { exact: true }).uncheck();
        assert.equal(
          await card
            .locator('line[stroke="var(--rsc-grid-color, #e5e7eb)"]')
            .count(),
          0,
        );
        assert.ok(
          (await card.locator('pre code').textContent()).includes(
            'showGrid={false}',
          ),
        );
      }
      if (family === 'line' || family === 'area') {
        await card.getByLabel('Compare two series', { exact: true }).check();
        assert.ok(
          (await card.locator('pre code').textContent()).includes('series={'),
        );
        await card.getByLabel('Show legend', { exact: true }).check();
        assert.equal(
          await card.getByRole('list', { name: 'Chart series' }).count(),
          1,
        );
      }
      if (family === 'bar') {
        const mark = card.locator('[data-layer="marks"] rect').first();
        const before = await mark.getAttribute('width');
        await card
          .getByRole('combobox', { name: 'Orientation', exact: true })
          .selectOption('horizontal');
        assert.notEqual(await mark.getAttribute('width'), before);
        assert.ok(
          (await card.locator('pre code').textContent()).includes(
            'orientation="horizontal"',
          ),
        );
      }
      if (['pie', 'donut'].includes(family)) {
        await card.getByLabel('Show slice labels', { exact: true }).check();
        assert.ok(
          (await card.locator('pre code').textContent()).includes(
            'showLabels={true}',
          ),
        );
      }
      if (family === 'donut') {
        const mark = card.locator('[data-layer="marks"] path').first();
        const before = await mark.getAttribute('d');
        for (const ratio of ['0.4', '0.6', '0.8']) {
          await card
            .getByRole('combobox', { name: 'Inner-radius ratio', exact: true })
            .selectOption(ratio);
          assert.ok(
            (await card.locator('pre code').textContent()).includes(
              `innerRadiusRatio={${ratio}}`,
            ),
          );
        }
        assert.notEqual(await mark.getAttribute('d'), before);
      }
      const copy = card.getByRole('button', { name: /^Copy code:/ });
      const currentCode = await card.locator('pre code').textContent();
      await copy.click();
      await card
        .getByRole('status')
        .filter({ hasText: 'Code copied.' })
        .waitFor();
      assert.equal(
        await page.evaluate(() => navigator.clipboard.readText()),
        currentCode,
      );
      assert.equal(
        await copy.evaluate((node) => node === document.activeElement),
        true,
      );
      await card.getByRole('button', { name: 'Reset', exact: true }).click();
      assert.equal(await card.locator('pre code').textContent(), initial);
      assert.equal(await dataset.inputValue(), 'primary');
      assert.deepEqual(
        await page
          .locator(`article:not(#chart-${family}) pre code`)
          .allTextContents(),
        otherSources,
      );
      const measured = await bounds();
      assert.ok(
        measured.scrollWidth <= measured.pageWidth + 1,
        `Interaction overflow ${family} at ${width}`,
      );
      report.interactions.push({
        width,
        family,
        preset: 'alternative',
        reset: true,
        nativeClipboard: true,
      });
    }
    // Scan representative changed control states, in addition to all default page scans.
    await page
      .locator('#chart-line')
      .getByLabel('Compare two series', { exact: true })
      .check();
    await page
      .locator('#chart-bar')
      .getByRole('combobox', { name: 'Orientation', exact: true })
      .selectOption('horizontal');
    await page
      .locator('#chart-donut')
      .getByRole('combobox', { name: 'Inner-radius ratio', exact: true })
      .selectOption('0.8');
    await page
      .locator('#chart-pie')
      .getByLabel('Show slice labels', { exact: true })
      .check();
    const scan = await new AxeBuilder({ page }).analyze();
    report.axe.push({
      width,
      route: 'examples changed settings',
      violations: scan.violations,
    });
    assert.deepEqual(scan.violations, []);
    await page.screenshot({
      path: resolve(evidence, `examples-interactive-${width}.png`),
      fullPage: true,
    });
    await page
      .locator('#chart-line')
      .screenshot({ path: resolve(evidence, `line-card-${width}.png`) });
    if (width === 1200)
      for (const family of ['area', 'bar', 'pie', 'donut'])
        await page.locator(`#chart-${family}`).screenshot({
          path: resolve(evidence, `${family}-card-${width}.png`),
        });
    console.log(`Interactive ${base}: ${width}px passed`);
  }
  // Clipboard absence and permission rejection do not claim success or move focus.
  for (const mode of ['unsupported', 'denied']) {
    await page.goto(origin + pathFor('/examples/'));
    await page.evaluate((mode) => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value:
          mode === 'unsupported'
            ? undefined
            : {
                writeText: async () => {
                  throw new Error('Denied');
                },
              },
      });
    }, mode);
    const copy = page
      .locator('#chart-line')
      .getByRole('button', { name: /^Copy code:/ });
    await copy.click();
    await page
      .locator('#chart-line [role="status"]')
      .filter({ hasText: 'Could not copy code.' })
      .waitFor();
    assert.equal(
      await copy.evaluate((node) => node === document.activeElement),
      true,
    );
    assert.equal(
      await page.getByText('Code copied.', { exact: true }).count(),
      0,
    );
  }
  report.clipboardFallback =
    'Unsupported and denied: polite manual-copy feedback, focus retained';
  // Real native page navigation and every Home deep link remain under the mount.
  for (const family of ['line', 'area', 'bar', 'pie', 'donut']) {
    await page.goto(origin + base);
    await page
      .locator(`a[href="${pathFor('/examples/')}#chart-${family}"]`)
      .click();
    await page.waitForURL(`${origin}${pathFor('/examples/')}#chart-${family}`);
    assert.equal(await page.locator(`#chart-${family}`).count(), 1);
    assert.equal(
      await page.locator('nav a[aria-current="page"]').getAttribute('href'),
      pathFor('/examples/'),
    );
  }
  for (const route of routes) {
    await page
      .locator(`nav[aria-label="Main navigation"] a[href="${pathFor(route)}"]`)
      .click();
    await page.waitForURL(origin + pathFor(route));
  }
  assert.equal(
    (await context.request.get(origin + pathFor('/unknown/'))).status(),
    404,
  );
  if (base !== '/')
    assert.equal(
      (await context.request.get(origin + '/examples/')).status(),
      404,
    );
  report.navigation =
    'All pages, Home family deep links, correct prefix, no root leakage, unknown static paths return 404';
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto(origin + base);
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
  await page.goto(origin + base);
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
  await page.goto(origin + pathFor('/examples/'));
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
  await page.goto(origin + base);
  const transition = await page
    .locator('.button')
    .first()
    .evaluate((el) => getComputedStyle(el).transitionDuration);
  assert.equal(transition, '0s');
  await page.goto(origin + pathFor('/examples/'));
  for (const family of ['line', 'area', 'bar', 'pie', 'donut'])
    await page
      .locator(`#chart-${family}`)
      .getByLabel('Enable animation', { exact: true })
      .check();
  assert.equal(await page.evaluate(() => window.__chartAnimations.length), 0);
  report.reducedMotion =
    'Site transitions removed; all-five chart animation requests suppressed';
  for (const route of routes) {
    await page.goto(origin + pathFor(route));
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
        interactions: report.interactions.length,
        base,
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
