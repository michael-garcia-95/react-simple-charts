/* global document, window, getComputedStyle, requestAnimationFrame */
// Additional production integration checks; invoked by verify-site.mjs in both modes.
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(
  resolve(import.meta.dirname, '../work/consumers/driver/package.json'),
);
const { default: AxeBuilder } = require('@axe-core/playwright');
const families = ['line', 'area', 'bar', 'pie', 'donut'];
const routes = ['/', '/examples/', '/documentation/', '/about/'];

async function ready(page, count) {
  await page.waitForFunction(
    (count) => document.querySelectorAll('main figure svg').length === count,
    count,
  );
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
}
async function scan(page, report, route, width) {
  const result = await new AxeBuilder({ page }).analyze();
  report.axe.push({ width, route, violations: result.violations });
  assert.deepEqual(result.violations, [], route);
}
async function targetPoint(page, family) {
  const svg = page.locator(`#chart-${family} svg`);
  await svg.scrollIntoViewIfNeeded();
  const point = await svg.evaluate((svg, family) => {
    const matrix = svg.getScreenCTM();
    const v = svg.viewBox.baseVal;
    let x, y;
    if (family === 'pie' || family === 'donut') {
      // Mid-angle of the first primary sector (48% Pie, 60% Donut).
      const angle = Math.PI * (family === 'pie' ? 0.48 : 0.6);
      const radius =
        (Math.min(v.width, v.height) / 2 - 8) *
        (family === 'donut' ? 0.8 : 0.6);
      x = v.width / 2 + Math.sin(angle) * radius;
      y = v.height / 2 - Math.cos(angle) * radius;
    } else {
      const target = svg.querySelector('[role="button"]');
      if (target.tagName.toLowerCase() === 'circle') {
        x = Number(target.getAttribute('cx'));
        y = Number(target.getAttribute('cy'));
      } else {
        x =
          Number(target.getAttribute('x')) +
          Number(target.getAttribute('width')) / 2;
        y =
          Number(target.getAttribute('y')) +
          Number(target.getAttribute('height')) / 2;
      }
    }
    return {
      x: matrix.a * x + matrix.c * y + matrix.e,
      y: matrix.b * x + matrix.d * y + matrix.f,
    };
  }, family);
  assert.equal(
    await page.evaluate(
      ({ x, y }) => document.elementFromPoint(x, y)?.getAttribute('role'),
      point,
    ),
    'button',
  );
  return point;
}

export async function verifySiteHardening({
  browser,
  page,
  context,
  base,
  origin,
  evidence,
  report,
}) {
  const url = (route) => origin + base + route.slice(1);
  const checks = {
    navigation: [],
    keyboard: [],
    pointer: [],
    touch: [],
    copy: [],
    enlargedText: [],
    resize: [],
    performance: [],
  };
  report.hardening = checks;
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1200, height: 900 });

  // Real history traversal and nested-page reload, with native links and emitted HTML.
  for (const route of routes) {
    await page.goto(url('/'));
    const link = page
      .getByRole('navigation', { name: 'Main navigation' })
      .locator(`a[href="${base + route.slice(1)}"]`);
    await link.click();
    await page.waitForURL(url(route));
    assert.equal((await page.reload()).status(), 200);
    await page.locator('main h1').waitFor();
    assert.equal(
      await page.locator('[aria-current="page"]').getAttribute('href'),
      base + route.slice(1),
    );
    if (route !== '/') {
      await page.goBack();
      await page.waitForURL(url('/'));
      await page.goForward();
      await page.waitForURL(url(route));
      await page.locator('main h1').waitFor();
    }
    checks.navigation.push({ route, refresh: true, history: route !== '/' });
  }
  for (const route of routes) {
    await page.goto(url(route));
    const count =
      route === '/examples/' ? 5 : route === '/documentation/' ? 0 : 1;
    await ready(page, count);
    assert.equal(await page.locator('header').count(), 1);
    assert.equal(await page.locator('main').count(), 1);
    assert.equal(await page.locator('footer').count(), 1);
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    assert.match(
      await page.locator('meta[name="viewport"]').getAttribute('content'),
      /width=device-width/,
    );
    assert.match(
      await page.locator('link[rel="icon"]').getAttribute('href'),
      /^data:image\/svg\+xml/,
    );
    const ids = await page
      .locator('[id]')
      .evaluateAll((nodes) => nodes.map((n) => n.id));
    assert.equal(new Set(ids).size, ids.length);
    const external = await page
      .locator('a[href^="https:"]')
      .evaluateAll((nodes) => nodes.map((n) => n.href));
    for (const href of external)
      assert.ok(
        href.startsWith(
          'https://github.com/michael-garcia-95/react-simple-charts',
        ),
      );
  }

  await page.goto(url('/examples/'));
  await ready(page, 5);
  const originalSources = await page
    .locator('article pre code')
    .allTextContents();
  for (const family of families) {
    const card = page.locator(`#chart-${family}`);
    const controls = card.locator('svg [role="button"]');
    const entry = controls.first();
    await entry.focus();
    await page.keyboard.press('Home');
    assert.ok(await entry.evaluate((n) => n === document.activeElement));
    await page.keyboard.press('ArrowLeft');
    assert.ok(await entry.evaluate((n) => n === document.activeElement));
    for (const key of [
      'ArrowRight',
      'ArrowDown',
      'ArrowLeft',
      'ArrowUp',
      'End',
    ])
      await page.keyboard.press(key);
    assert.ok(
      await controls.last().evaluate((n) => n === document.activeElement),
    );
    await page.keyboard.press('ArrowRight');
    assert.ok(
      await controls.last().evaluate((n) => n === document.activeElement),
    );
    await page.keyboard.press('Home');
    assert.equal(await card.locator('svg [tabindex="0"]').count(), 1);
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    await page.keyboard.press('Escape');
    assert.equal(await card.getByRole('tooltip').count(), 0);
    await page.keyboard.press('ArrowRight');
    assert.equal(await card.getByRole('tooltip').count(), 1);
    const focus = await card.locator('svg').evaluate((svg) => {
      const s = getComputedStyle(svg);
      return {
        outline: s.outlineStyle,
        width: parseFloat(s.outlineWidth),
        offset: parseFloat(s.outlineOffset),
      };
    });
    assert.equal(focus.outline, 'solid');
    assert.ok(focus.offset <= -focus.width, `${family} frame focus is clipped`);
    await scan(page, report, `${family} visible keyboard tooltip`, 1200);
    await card
      .getByLabel('Show legend', { exact: true })
      .evaluate((n) => n.click());
    assert.equal(await page.locator(':focus').getAttribute('role'), 'button');
    await page.keyboard.press('Tab');
    assert.equal(
      await page.locator(':focus').getAttribute('aria-label'),
      `${family.charAt(0).toUpperCase() + family.slice(1)} example source`.replace(
        /^/,
        'Copy code: ',
      ),
    );
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.locator(':focus').getAttribute('role'), 'button');
    await card.getByRole('button', { name: 'Reset', exact: true }).click();
    checks.keyboard.push({
      family,
      arrows: true,
      endpoints: true,
      enterSpace: true,
      escape: true,
      tabExit: true,
      focusDuringUpdate: true,
    });
    const point = await targetPoint(page, family);
    await page.mouse.move(point.x, point.y);
    assert.equal(await card.getByRole('tooltip').count(), 1);
    await page.mouse.click(point.x, point.y);
    assert.equal(await card.getByRole('tooltip').count(), 1);
    await card.getByLabel('Show tooltip', { exact: true }).uncheck();
    await page.mouse.move(0, 0);
    const disabledPoint = await targetPoint(page, family);
    await page.mouse.move(disabledPoint.x, disabledPoint.y);
    assert.equal(await card.getByRole('tooltip').count(), 0);
    await card.getByRole('button', { name: 'Reset', exact: true }).click();
    checks.pointer.push({
      family,
      hitTested: true,
      hover: true,
      click: true,
      disabledTooltip: true,
    });
  }
  assert.deepEqual(
    await page.locator('article pre code').allTextContents(),
    originalSources,
  );
  await page.locator('#chart-line svg [tabindex="0"]').focus();
  await page.locator('#chart-pie svg [role="button"]').first().hover();
  assert.equal(await page.locator('#chart-line svg [tabindex="0"]').count(), 1);
  assert.equal(await page.locator('#chart-line [role="tooltip"]').count(), 1);
  assert.equal(await page.locator('#chart-pie [role="tooltip"]').count(), 1);
  await page
    .locator('#chart-line .example-preview')
    .screenshot({ path: resolve(evidence, 'chart-focus.png') });

  // Promise settlement is controlled only for QA; no arbitrary code execution in the product.
  await page.goto(url('/examples/'));
  await page.evaluate(() => {
    window.__copies = [];
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: (source) =>
          new Promise((resolve, reject) =>
            window.__copies.push({ source, resolve, reject }),
          ),
      },
    });
  });
  const card = page.locator('#chart-line');
  const copy = card.getByRole('button', { name: /^Copy code:/ });
  await copy.click();
  assert.equal(await card.getByRole('status').textContent(), '');
  await card
    .getByRole('combobox', { name: 'Dataset', exact: true })
    .selectOption('alternative');
  await card.getByRole('button', { name: 'Reset', exact: true }).click();
  await page.evaluate(() => window.__copies[0].resolve());
  assert.equal(await card.getByRole('status').textContent(), '');
  await copy.click();
  await page.evaluate(() => window.__copies[1].resolve());
  await card.getByRole('status').filter({ hasText: 'Code copied.' }).waitFor();
  await card
    .getByRole('combobox', { name: 'Dataset', exact: true })
    .selectOption('alternative');
  await card.getByRole('button', { name: 'Reset', exact: true }).click();
  assert.equal(await card.getByRole('status').textContent(), '');
  await copy.click();
  await copy.click();
  await page.evaluate(() => window.__copies[3].reject(new Error('Denied')));
  await card
    .getByRole('status')
    .filter({ hasText: 'Could not copy code.' })
    .waitFor();
  await page.evaluate(() => window.__copies[2].resolve());
  assert.match(
    await card.getByRole('status').textContent(),
    /Could not copy code/,
  );
  assert.ok(await copy.evaluate((n) => n === document.activeElement));
  await scan(page, report, 'latest copy denied / manual copy status', 1200);
  const panel = card.locator('pre');
  await panel.focus();
  await page.keyboard.press('ArrowRight');
  await panel.screenshot({ path: resolve(evidence, 'code-focus.png') });
  checks.copy.push(
    'Pending/source change/reset, completed/source change/reset, repeated requests out of order, manual-copy focus',
  );

  const touchContext = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 375, height: 900 },
  });
  try {
    const touch = await touchContext.newPage();
    touch.on('pageerror', (e) => report.errors.push(e.message));
    touch.on('console', (m) => {
      if (m.type() === 'error') report.errors.push(m.text());
    });
    touch.on('requestfailed', (r) =>
      report.errors.push(`${r.url()} ${r.failure()?.errorText}`),
    );
    await touch.goto(url('/examples/'));
    await ready(touch, 5);
    for (const family of families) {
      const point = await targetPoint(touch, family);
      await touch.touchscreen.tap(point.x, point.y);
      const article = touch.locator(`#chart-${family}`);
      assert.equal(await article.getByRole('tooltip').count(), 1);
      await article
        .getByRole('button', { name: 'Dismiss inspection', exact: true })
        .click();
      assert.equal(await article.getByRole('tooltip').count(), 0);
      await article.getByLabel('Show tooltip', { exact: true }).uncheck();
      const disabledPoint = await targetPoint(touch, family);
      await touch.touchscreen.tap(disabledPoint.x, disabledPoint.y);
      assert.equal(await article.getByRole('tooltip').count(), 0);
      checks.touch.push({
        family,
        emulated: true,
        persistentInspection: true,
        dismiss: true,
        disabledTooltip: true,
      });
    }
  } finally {
    await touchContext.close();
  }

  for (const width of [320, 375, 480]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      await page.goto(url(route));
      await page.locator('main h1').waitFor();
      await page.evaluate(
        () => (document.documentElement.style.fontSize = '200%'),
      );
      await ready(
        page,
        route === '/examples/' ? 5 : route === '/documentation/' ? 0 : 1,
      );
      assert.ok(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth + 1,
        ),
        `${route} enlarged at ${width}`,
      );
      for (const control of await page
        .locator(
          '.example-controls input,.example-controls select,.example-controls button,header a,footer a',
        )
        .all()) {
        assert.ok(
          await control.evaluate((n) => {
            const a = n.getBoundingClientRect();
            return (
              a.width > 0 && a.left >= 0 && a.right <= window.innerWidth + 1
            );
          }),
        );
      }
      await scan(page, report, `${route} 200% root text`, width);
      checks.enlargedText.push({ width, route });
    }
  }
  await page.goto(url('/examples/'));
  for (const width of [1440, 320, 900, 375, 1200]) {
    const start = performance.now();
    await page.setViewportSize({ width, height: 900 });
    await page.waitForFunction(
      () =>
        [...document.querySelectorAll('main figure svg')].length === 5 &&
        [...document.querySelectorAll('main figure svg')].every(
          (svg) =>
            Math.abs(
              Number(svg.getAttribute('width')) -
                svg.closest('figure').getBoundingClientRect().width,
            ) < 2,
        ),
    );
    await ready(page, 5);
    checks.resize.push({
      width,
      readyMs: Math.round((performance.now() - start) * 10) / 10,
    });
  }
  await page.setViewportSize({ width: 1200, height: 900 });
  for (const route of routes) {
    const samples = [];
    for (let repeat = 0; repeat < 3; repeat++) {
      await page.goto(url(route), { waitUntil: 'domcontentloaded' });
      await page.locator('main h1').waitFor();
      await ready(
        page,
        route === '/examples/' ? 5 : route === '/documentation/' ? 0 : 1,
      );
      samples.push(
        await page.evaluate(() => {
          const nav = performance.getEntriesByType('navigation')[0];
          return {
            readyMs: Math.round(performance.now() * 10) / 10,
            domContentLoadedMs:
              Math.round(nav.domContentLoadedEventEnd * 10) / 10,
            domNodes: document.querySelectorAll('*').length,
            charts: document.querySelectorAll('main figure svg').length,
            controls: document.querySelectorAll('main svg [role="button"]')
              .length,
            resources: performance.getEntriesByType('resource').map((r) => ({
              name: r.name.split('/').pop(),
              durationMs: Math.round(r.duration * 10) / 10,
              bytes: r.encodedBodySize,
            })),
          };
        }),
      );
    }
    checks.performance.push({ route, samples });
  }
  // Explicit 404s are tested by API requests so expected failures do not pollute page errors.
  for (const route of ['/unknown/', '/examples/unknown/'])
    assert.equal((await context.request.get(url(route))).status(), 404);
  console.log(
    `Hardening ${base}: navigation, five-family keyboard/pointer/emulated touch, copy races, enlarged text, resize and local timing passed`,
  );
}
