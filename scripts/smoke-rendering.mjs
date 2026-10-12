import { loadBrowserDriver } from './browser-driver.mjs';
// Optional one-time smoke test. Driver is installed into ignored work/, not peers.
/* global document, window, getComputedStyle -- callbacks execute inside Chromium */
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const {
  engines: { chromium },
} = loadBrowserDriver();
const browser = await chromium.launch({
  executablePath: process.env.RSC_BROWSER_PATH,
  headless: true,
  args: ['--no-sandbox'],
});
function fixtureScopes(page) {
  return {
    explicit: page.locator('section[aria-labelledby="explicit-heading"]'),
    responsive: page.locator('section[aria-labelledby="responsive-heading"]'),
    previews: page.locator('section[aria-labelledby="line-heading"]'),
  };
}
async function verifyFixtureTables(page) {
  const scopes = fixtureScopes(page);
  for (const [scope, label] of [
    [scopes.explicit, 'Explicit quarterly sample'],
    [scopes.responsive, 'Responsive quarterly sample'],
  ]) {
    assert.equal(await scope.count(), 1, label + ' fixture');
    const table = scope.getByRole('table', {
      name: label + ' — data',
      exact: true,
    });
    assert.equal(await table.count(), 1, label + ' source table');
    assert.deepEqual(await table.getByRole('columnheader').allTextContents(), [
      'Quarter',
      'Value',
    ]);
    assert.deepEqual(await table.getByRole('rowheader').allTextContents(), [
      'Q1',
      'Q2',
      'Q3',
      'Q4',
    ]);
    assert.equal(await table.locator('tbody tr').count(), 4);
    assert.equal(await table.getAttribute('aria-hidden'), null);
  }
  assert.equal(
    await scopes.previews.count(),
    1,
    'Internal Line preview fixture',
  );
  for (const [label, rows] of [
    ['Monthly revenue', 3],
    ['Actual and forecast', 4],
    ['Linear measurements', 3],
    ['UTC observations', 3],
    ['Local-time observations', 3],
    ['Responsive engine preview', 3],
    ['Empty observations', 0],
    ['Unavailable observations', 1],
  ]) {
    const table = scopes.previews.getByRole('table', {
      name: label + ' — data',
      exact: true,
    });
    assert.equal(await table.count(), 1, label + ' source table');
    assert.equal(
      await table.locator('tbody tr').count(),
      rows,
      label + ' source rows',
    );
    assert.equal(
      await table.getAttribute('aria-hidden'),
      null,
      label + ' exposed semantics',
    );
  }
}
async function waitForWidth(page, graphic, previous, direction, label) {
  const svg = await graphic.elementHandle();
  try {
    await page.waitForFunction(
      ({ svg, previous, direction }) => {
        const width = Number(svg.getAttribute('width'));
        return (
          svg.isConnected &&
          width > 0 &&
          (direction === 'shrink' ? width < previous : width > previous)
        );
      },
      { svg, previous, direction },
      { timeout: 10000 },
    );
  } catch (error) {
    throw new Error(label + ' must ' + direction + ' after viewport resize', {
      cause: error,
    });
  } finally {
    await svg.dispose();
  }
}
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
  const scopes = fixtureScopes(page);
  const explicit = scopes.explicit.getByRole('img', {
    name: 'Explicit quarterly sample',
    exact: true,
  });
  const responsive = scopes.responsive.getByRole('img', {
    name: 'Responsive quarterly sample',
    exact: true,
  });
  await explicit.waitFor({ state: 'visible' });
  await responsive.waitFor({ state: 'visible' });
  assert.equal(await explicit.getAttribute('viewBox'), '0 0 640 280');
  await verifyFixtureTables(page);
  checks.push(
    'Initial explicit and measured responsive SVG; both probe and all eight internal preview source tables',
  );

  const initialWidth = Number(await responsive.getAttribute('width'));
  await page.setViewportSize({ width: 650, height: 1200 });
  await waitForWidth(
    page,
    responsive,
    initialWidth,
    'shrink',
    'Responsive quarterly sample',
  );
  const smallerWidth = Number(await responsive.getAttribute('width'));
  assert(smallerWidth > 0 && smallerWidth < initialWidth);
  await page.setViewportSize({ width: 1100, height: 1200 });
  await waitForWidth(
    page,
    responsive,
    smallerWidth,
    'grow',
    'Responsive quarterly sample',
  );
  checks.push(
    'Native ResizeObserver follows shrinking and growing viewport widths',
  );

  // Unrelated playground controls precede these fixtures. Start deliberately
  // at the explicit probe, then exercise native Tab to the responsive probe.
  await explicit.focus();
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
  const snapshot =
    (await scopes.explicit.ariaSnapshot()) +
    (await scopes.responsive.ariaSnapshot());
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
  const hidden = scopes.responsive.getByRole('table', {
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
  const fallbackScopes = fixtureScopes(fallbackPage);
  assert.equal(
    await fallbackScopes.explicit.locator('svg').count(),
    1,
    'Explicit probe still renders without ResizeObserver',
  );
  assert.equal(
    await fallbackScopes.responsive.locator('svg').count(),
    0,
    'Responsive probe must retain its pending fallback',
  );
  await verifyFixtureTables(fallbackPage);
  checks.push(
    'Missing ResizeObserver keeps the intended probe placeholder, explicit probe SVG and all intended source tables',
  );

  const engine = scopes.previews.getByRole('img', {
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
  const clipped = scopes.previews.getByRole('img', {
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
  const responsiveEngine = scopes.previews.getByRole('img', {
    name: 'Responsive engine preview',
    exact: true,
  });
  const engineWidth = Number(await responsiveEngine.getAttribute('width'));
  await page.setViewportSize({ width: 650, height: 1200 });
  await waitForWidth(
    page,
    responsiveEngine,
    engineWidth,
    'shrink',
    'Responsive engine preview',
  );
  assert(Number(await responsiveEngine.getAttribute('width')) < engineWidth);
  const smallerEngineWidth = Number(
    await responsiveEngine.getAttribute('width'),
  );
  await page.setViewportSize({ width: 1100, height: 1200 });
  await waitForWidth(
    page,
    responsiveEngine,
    smallerEngineWidth,
    'grow',
    'Responsive engine preview',
  );
  const engineSnapshot = await scopes.previews.ariaSnapshot();
  assert(engineSnapshot.includes('Monthly revenue — data'));
  assert(engineSnapshot.includes('Responsive engine preview — data'));
  await fallbackScopes.previews
    .getByRole('img', { name: /Responsive engine preview — awaiting/ })
    .waitFor();
  assert.equal(
    await fallbackScopes.previews
      .getByRole('img', { name: /Responsive engine preview — awaiting/ })
      .evaluate(
        (element) => element.closest('figure').querySelectorAll('svg').length,
      ),
    0,
    'Internal responsive preview must retain its pending fallback without SVG',
  );
  checks.push(
    'Engine paths and markers, visible selected category labels, plot clip references/rectangle, responsive shrink/grow and source tables in the accessibility snapshot',
  );

  assert.deepEqual(errors, []);
  checks.push('No browser console errors or uncaught page errors');
  console.log(JSON.stringify({ browser: browser.version(), checks }, null, 2));
} finally {
  await browser.close();
}
