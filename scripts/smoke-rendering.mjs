// Optional one-time smoke test. Driver is installed into ignored work/, not peers.
/* global document, window, getComputedStyle -- callbacks execute inside Chromium */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';

const require = createRequire(
  new URL('../work/browser-smoke/package.json', import.meta.url),
);
const { chromium } = require('playwright-core');
const browser = await chromium.launch({
  executablePath: process.env.RSC_BROWSER_PATH ?? '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox'],
});
const errors = [];
const checks = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1100, height: 1200 },
  });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  const url = process.env.RSC_SMOKE_URL ?? 'http://127.0.0.1:5173';
  await page.goto(url);
  const explicit = page.getByRole('img', {
    name: 'Explicit quarterly sample',
    exact: true,
  });
  const responsive = page.getByRole('img', {
    name: 'Responsive quarterly sample',
    exact: true,
  });
  await explicit.waitFor({ state: 'visible' });
  await responsive.waitFor({ state: 'visible' });
  assert.equal(await explicit.getAttribute('viewBox'), '0 0 640 280');
  assert.equal(await page.getByRole('table').count(), 13);
  checks.push(
    'Initial explicit and measured responsive SVG; thirteen semantic data tables',
  );

  const initialWidth = Number(await responsive.getAttribute('width'));
  await page.setViewportSize({ width: 650, height: 1200 });
  await page.waitForFunction(
    (previous) =>
      Number(document.querySelectorAll('svg')[1]?.getAttribute('width')) <
      previous,
    initialWidth,
  );
  const smallerWidth = Number(await responsive.getAttribute('width'));
  assert(smallerWidth > 0 && smallerWidth < initialWidth);
  await page.setViewportSize({ width: 1100, height: 1200 });
  await page.waitForFunction(
    (previous) =>
      Number(document.querySelectorAll('svg')[1]?.getAttribute('width')) >
      previous,
    smallerWidth,
  );
  checks.push(
    'Native ResizeObserver follows shrinking and growing viewport widths',
  );

  await page.keyboard.press('Tab');
  assert(
    await explicit.evaluate((element) => element === document.activeElement),
  );
  assert.equal(
    await explicit.evaluate(
      (element) => getComputedStyle(element).outlineWidth,
    ),
    '3px',
  );
  await page.keyboard.press('Tab');
  assert(
    await responsive.evaluate((element) => element === document.activeElement),
  );
  assert.equal(
    await responsive.evaluate(
      (element) => getComputedStyle(element).outlineColor,
    ),
    'rgb(157, 23, 77)',
  );
  assert.equal(
    await responsive
      .locator('polyline')
      .evaluate((element) => getComputedStyle(element).stroke),
    'rgb(8, 107, 98)',
  );
  checks.push(
    'Keyboard Tab focus has a 3px indicator and customized outline/series colors resolve',
  );

  const ids = await page
    .locator('[id]')
    .evaluateAll((elements) => elements.map((element) => element.id));
  assert.equal(new Set(ids).size, ids.length);
  const snapshot = await page.locator('main').ariaSnapshot();
  assert(snapshot.includes('Explicit quarterly sample'));
  assert(snapshot.includes('Responsive quarterly sample — data'));
  assert(snapshot.includes('rowheader "Q4"'));
  checks.push(
    'Chromium accessible names and hidden table/row headers remain in the accessibility snapshot; IDs are unique',
  );

  await mkdir(new URL('../work/', import.meta.url), { recursive: true });
  await page.screenshot({
    path: new URL('../work/rendering-smoke.png', import.meta.url).pathname,
    fullPage: true,
  });

  await page.evaluate(() =>
    document
      .querySelectorAll('style, link[rel="stylesheet"]')
      .forEach((element) => element.remove()),
  );
  assert.equal(
    await explicit
      .locator('polyline')
      .evaluate((element) => getComputedStyle(element).stroke),
    'rgb(37, 99, 235)',
  );
  const hidden = page.getByRole('table', {
    name: 'Responsive quarterly sample — data',
  });
  assert.equal(
    await hidden.evaluate((element) => getComputedStyle(element).clipPath),
    'inset(50%)',
  );
  assert.equal(
    await hidden.evaluate((element) => getComputedStyle(element).display),
    'table',
  );
  assert.equal(
    await responsive.evaluate(
      (element) => getComputedStyle(element).outlineWidth,
    ),
    '3px',
  );
  checks.push(
    'Defaults, focus outline, and clipped accessible table work after all playground styles are removed',
  );

  // Override only for this check: a literal setting wins over an inherited token.
  await responsive
    .locator('polyline')
    .evaluate((element) => element.setAttribute('stroke', '#a21caf'));
  assert.equal(
    await responsive
      .locator('polyline')
      .evaluate((element) => getComputedStyle(element).stroke),
    'rgb(162, 28, 175)',
  );
  checks.push(
    'Explicit SVG color wins over the CSS custom property (component prop also covered by Vitest)',
  );

  await mkdir(new URL('../work/', import.meta.url), { recursive: true });
  await page.screenshot({
    path: new URL('../work/rendering-smoke-without-css.png', import.meta.url)
      .pathname,
    fullPage: true,
  });

  const fallbackPage = await browser.newPage();
  fallbackPage.on('pageerror', (error) => errors.push(error.message));
  fallbackPage.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await fallbackPage.addInitScript(() => {
    window.ResizeObserver = undefined;
  });
  await fallbackPage.goto(url);
  await fallbackPage
    .getByRole('img', {
      name: /Responsive quarterly sample — awaiting container measurement/,
    })
    .waitFor();
  assert.equal(await fallbackPage.locator('svg').count(), 8);
  assert.equal(await fallbackPage.getByRole('table').count(), 13);
  checks.push(
    'Missing ResizeObserver keeps the accessible placeholder and all tables',
  );

  const engine = page.getByRole('img', {
    name: 'Monthly revenue',
    exact: true,
  });
  assert.equal(await engine.locator('path').count(), 1);
  assert.equal(await engine.locator('circle').count(), 3);
  assert(
    (await engine.locator('[data-axis="x"] text').allTextContents()).includes(
      'Jan',
    ),
  );
  const clipped = page.getByRole('img', {
    name: 'Linear measurements',
    exact: true,
  });
  const clipId = await clipped.locator('clipPath').getAttribute('id');
  assert.equal(
    await clipped.locator('[data-layer="marks"]').getAttribute('clip-path'),
    `url(#${clipId})`,
  );
  const plotWidth = Number(
    await clipped.locator('clipPath rect').getAttribute('width'),
  );
  assert(plotWidth > 0 && plotWidth < 640);
  const responsiveEngine = page.getByRole('img', {
    name: 'Responsive engine preview',
    exact: true,
  });
  const engineWidth = Number(await responsiveEngine.getAttribute('width'));
  await page.setViewportSize({ width: 650, height: 1200 });
  await page.waitForFunction(
    (previous) =>
      Number(
        document
          .querySelector('svg[aria-labelledby] title')
          ?.parentElement?.getAttribute('width'),
      ) > 0 &&
      [...document.querySelectorAll('svg')].some(
        (svg) =>
          svg.querySelector('title')?.textContent ===
            'Responsive engine preview' &&
          Number(svg.getAttribute('width')) < previous,
      ),
    engineWidth,
  );
  assert(Number(await responsiveEngine.getAttribute('width')) < engineWidth);
  const engineSnapshot = await page.locator('main').ariaSnapshot();
  assert(engineSnapshot.includes('Monthly revenue — data'));
  assert(engineSnapshot.includes('Responsive engine preview — data'));
  await fallbackPage
    .getByRole('img', { name: /Responsive engine preview — awaiting/ })
    .waitFor();
  checks.push(
    'Engine paths and markers, visible selected category labels, plot clip references/rectangle, responsive width change and source tables in the accessibility snapshot',
  );

  assert.deepEqual(errors, []);
  checks.push('No browser console errors or uncaught page errors');
  console.log(JSON.stringify({ browser: browser.version(), checks }, null, 2));
} finally {
  await browser.close();
}
