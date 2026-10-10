/* global document, window, requestAnimationFrame */
// Run after verify-consumers installs the ignored browser driver; start npm run dev.
import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import os from 'node:os';
const root = resolve(import.meta.dirname, '..');
const require = createRequire(
  resolve(root, 'work/consumers/driver/package.json'),
);
const { chromium } = require('playwright-core');
const { default: AxeBuilder } = require('@axe-core/playwright');
const evidence = resolve(root, 'work/visual/five-charts');
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
const families = ['line', 'area', 'bar', 'pie', 'donut'];
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
const report = {
  browser: browser.version(),
  playwright: require('playwright-core/package.json').version,
  axeVersion: require('axe-core/package.json').version,
  node: process.version,
  context: {
    platform: os.platform(),
    arch: os.arch(),
    cpus: os.cpus().length,
    cpuModel: os.cpus()[0]?.model,
    memoryBytes: os.totalmem(),
  },
  widths: [],
  axe: [],
  gestures: [],
  performance: [],
  errors,
};
try {
  report.context.cpuQuota = (
    await readFile('/sys/fs/cgroup/cpu.max', 'utf8')
  ).trim();
} catch {
  /* Not exposed by every container. */
}
const host = (family) => page.locator(`[data-five=${family}]`);
const controls = (family) => host(family).locator('svg [role=button]');
const events = async () =>
  Number(await page.locator('#five-events').getAttribute('data-count'));
async function settled() {
  await page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      ),
  );
}
async function bounds() {
  return page.evaluate(() =>
    [...document.querySelectorAll('[data-five]')].map((el) => {
      const svg = el.querySelector('svg'),
        figure = el.querySelector('figure'),
        rect = figure.getBoundingClientRect();
      return {
        family: el.getAttribute('data-five'),
        svgWidth: Number(svg?.getAttribute('width')),
        width: rect.width,
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        scroll: el.scrollWidth,
        client: el.clientWidth,
      };
    }),
  );
}
async function noOverflow() {
  if (
    !(await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ))
  ) {
    console.log(
      'Overflow detail',
      await page.evaluate(() =>
        [...document.querySelectorAll('body *')]
          .filter((el) => el.getBoundingClientRect().right > window.innerWidth)
          .map((el) => ({
            tag: el.tagName,
            id: el.id,
            text: el.textContent.slice(0, 40),
            right: el.getBoundingClientRect().right,
          }))
          .slice(0, 25),
      ),
    );
  }
  assert(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
    'horizontal page overflow',
  );
  const rows = await bounds();
  for (const row of rows)
    assert(row.scroll <= row.client + 1, `${row.family} overflow`);
  for (let i = 0; i < rows.length; i++)
    for (let j = i + 1; j < rows.length; j++) {
      const a = rows[i],
        b = rows[j];
      assert(
        a.right <= b.left + 1 ||
          b.right <= a.left + 1 ||
          a.bottom <= b.top + 1 ||
          b.bottom <= a.top + 1,
        'overlapping figures',
      );
    }
  return rows;
}
async function axe(label) {
  const result = await new AxeBuilder({ page }).analyze();
  report.axe.push({
    label,
    violations: result.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.length,
    })),
  });
  assert.equal(result.violations.length, 0, `${label} axe violations`);
}
async function point(family, center = false) {
  await host(family).locator('svg').scrollIntoViewIfNeeded();
  return host(family)
    .locator('svg')
    .evaluate(
      (svg, { family, center }) => {
        const matrix = svg.getScreenCTM(),
          v = svg.viewBox.baseVal;
        let x, y;
        if (family === 'pie' || family === 'donut') {
          const radius = center
            ? family === 'donut'
              ? (Math.min(v.width, v.height) / 2 - 8) * 0.5
              : 0
            : (Math.min(v.width, v.height) / 2 - 8) *
              (family === 'donut' ? 0.8 : 0.6);
          x = v.width / 2 + Math.sin(Math.PI * 0.48) * radius;
          y = v.height / 2 - Math.cos(Math.PI * 0.48) * radius;
        } else {
          const target = svg.querySelector('[role=button]');
          if (target.tagName.toLowerCase() === 'circle') {
            x = Number(target.getAttribute('cx'));
            y = Number(target.getAttribute('cy'));
          } else {
            x =
              Number(target.getAttribute('x')) +
              Number(target.getAttribute('width')) / 2;
            y =
              Number(target.getAttribute('y')) +
              Math.max(1, Number(target.getAttribute('height')) / 2);
          }
        }
        return {
          x: matrix.a * x + matrix.c * y + matrix.e,
          y: matrix.b * x + matrix.d * y + matrix.f,
        };
      },
      { family, center },
    );
}
try {
  await page.goto(
    `${process.env.RSC_SMOKE_URL ?? 'http://127.0.0.1:5173'}/?five-charts`,
  );
  await host('donut').locator('svg').waitFor();
  await page.locator('#five-long').check();
  // Verify library legend wrapping without inheriting the fixture's wrapping.
  await page.addStyleTag({
    content: '[data-five] ul { overflow-wrap:normal }',
  });
  for (const width of [320, 480, 768, 1200, 320, 1200, 480]) {
    await page.setViewportSize({ width, height: 900 });
    await settled();
    report.widths.push({ viewport: width, charts: await noOverflow() });
    const centerDelta = await host('donut').evaluate((el) => {
      const a = el.querySelector('svg').getBoundingClientRect(),
        b = el.querySelector('button').getBoundingClientRect();
      return Math.abs(a.left + a.width / 2 - b.left - b.width / 2);
    });
    assert(centerDelta < 1, 'responsive Donut center alignment');
    for (const family of families) {
      const rows = await host(family).locator('tbody tr').count();
      assert.equal(rows, ['pie', 'donut'].includes(family) ? 3 : 4);
      await controls(family).last().focus();
      const contained = await host(family).evaluate((el) => {
        const a = el.querySelector('figure').getBoundingClientRect(),
          b = el.querySelector('[role=tooltip]').getBoundingClientRect();
        return b.left >= a.left - 1 && b.right <= a.right + 1;
      });
      assert(contained, `${family} tooltip outside figure`);
    }
    if ([320, 768, 1200].includes(width)) {
      await axe(`ready-${width}`);
      await page.screenshot({
        path: resolve(evidence, `ready-${width}.png`),
        fullPage: true,
      });
    }
  }
  await page.setViewportSize({ width: 1200, height: 1600 });
  await page.locator('#five-visible').uncheck();
  for (const family of families)
    await page.locator(`#five-width-${family}`).selectOption('200');
  await settled();
  await page.evaluate(() => window.scrollTo(0, 0));
  assert(
    await page.evaluate(() =>
      [...document.querySelectorAll('[data-five] svg')].every(
        (el) => el.getBoundingClientRect().bottom <= window.innerHeight,
      ),
    ),
    'all five graphics in one viewport',
  );
  await page.screenshot({ path: resolve(evidence, 'all-five-viewport.png') });
  await page.locator('#five-visible').check();
  for (const family of families)
    await page.locator(`#five-width-${family}`).selectOption('320');
  await page.setViewportSize({ width: 1200, height: 900 });
  await settled();
  const before = await bounds();
  await page.locator('#five-width-area').selectOption('200');
  await settled();
  const after = await bounds();
  for (let i = 0; i < families.length; i++)
    assert.equal(
      after[i].svgWidth,
      families[i] === 'area' ? 200 : before[i].svgWidth,
    );
  await page.locator('#five-width-area').selectOption('320');
  await settled();
  await page.locator('#five-mounted').uncheck();
  await page.locator('#five-mounted').check();
  await host('donut').locator('svg').waitFor();
  // Actual browser Tab traversal: one entry per chart, plus caller's center button.
  await page.locator('#five-before').focus();
  for (const family of families) {
    await page.keyboard.press('Tab');
    assert(
      await controls(family)
        .first()
        .evaluate((el) => el === document.activeElement),
    );
  }
  await page.keyboard.press('Tab');
  assert(
    await host('donut')
      .getByRole('button', { name: 'Allocation details' })
      .evaluate((el) => el === document.activeElement),
  );
  await page.keyboard.press('Tab');
  assert(
    await page
      .locator('#five-after')
      .evaluate((el) => el === document.activeElement),
  );
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Shift+Tab');
  assert(
    await controls('donut')
      .first()
      .evaluate((el) => el === document.activeElement),
  );
  for (const family of families) {
    console.log('Gestures', family);
    await controls(family).first().focus();
    const count = await events();
    for (const key of [
      'ArrowRight',
      'ArrowDown',
      'ArrowLeft',
      'ArrowUp',
      'End',
      'Home',
    ])
      await page.keyboard.press(key);
    assert.equal(await events(), count);
    await controls(family).last().hover();
    assert.equal(await controls(family).first().getAttribute('tabindex'), '0');
    assert.notEqual(
      await controls(family).first().getAttribute('stroke'),
      'transparent',
    );
    await page.keyboard.press('Enter');
    await page.keyboard.press('Space');
    assert.equal(await events(), count + 2);
    await page.keyboard.press('Escape');
    assert.equal(await host(family).getByRole('tooltip').count(), 0);
    for (const type of ['mouse', 'touch', 'pen', 'assistive']) {
      const start = await events();
      if (type === 'mouse' || type === 'touch') {
        const p = await point(family);
        if (type === 'touch') await page.touchscreen.tap(p.x, p.y);
        else await page.mouse.click(p.x, p.y);
      } else
        await controls(family)
          .first()
          .evaluate((el, type) => {
            if (type === 'pen') {
              el.dispatchEvent(
                new window.PointerEvent('pointerdown', {
                  bubbles: true,
                  pointerType: 'pen',
                  pointerId: 91,
                }),
              );
              el.dispatchEvent(
                new window.PointerEvent('pointerup', {
                  bubbles: true,
                  pointerType: 'pen',
                  pointerId: 91,
                }),
              );
            }
            el.dispatchEvent(
              new window.MouseEvent('click', {
                bubbles: true,
                detail: type === 'assistive' ? 0 : 1,
              }),
            );
          }, type);
      await page.waitForTimeout(40);
      assert.equal(await events(), start + 1, `${family} ${type} exactly once`);
      const payload = JSON.parse(
        await page.locator('#five-events').textContent(),
      );
      assert.equal(payload.family, family);
      assert.equal(payload.index, 0);
      assert.equal(
        payload.method,
        type === 'mouse' || type === 'pen'
          ? 'pointer'
          : type === 'assistive'
            ? 'keyboard'
            : 'touch',
      );
      report.gestures.push({ family, type, count: 1, payload });
    }
  }
  const count = await events();
  await host('donut')
    .getByRole('button', { name: 'Allocation details' })
    .click();
  assert.equal(await events(), count);
  const center = await point('donut', true);
  report.hole = await page.evaluate((p) => {
    const el = document.elementFromPoint(p.x, p.y);
    return {
      tag: el.tagName.toLowerCase(),
      centerContent: !!el.closest('[data-donut-center]'),
      inspectionControl: !!el.closest('[role=button]'),
    };
  }, center);
  assert.deepEqual(
    report.hole,
    { tag: 'svg', centerContent: false, inspectionControl: false },
    'exposed ring hole must hit SVG, not the center button or sector',
  );
  await page.mouse.click(center.x, center.y);
  assert.equal(await events(), count);
  const pieCenter = await point('pie', true);
  await page.mouse.click(pieCenter.x, pieCenter.y);
  assert.equal(await events(), count + 1);
  await page.locator('#five-state-line').selectOption('replacement');
  await settled();
  assert(
    await host('line')
      .locator('table')
      .textContent()
      .then((t) => t.includes('Replacement')),
  );
  assert(
    !(await host('area').locator('table').textContent()).includes(
      'Replacement',
    ),
  );
  await controls('line').first().focus();
  assert(
    (await host('line').getByRole('tooltip').textContent()).includes(
      'Replacement',
    ),
  );
  await page.locator('#five-reset').click();
  for (const state of ['empty', 'unusable']) {
    for (const family of families)
      await page.locator(`#five-state-${family}`).selectOption(state);
    assert.equal(await page.locator('[data-five] svg').count(), 0);
    assert.equal(await page.locator('[data-five] table').count(), 5);
    await axe(state);
    await page.screenshot({
      path: resolve(evidence, `${state}.png`),
      fullPage: true,
    });
  }
  await page.locator('#five-reset').click();
  for (const family of families)
    await page.locator(`#five-state-${family}`).selectOption('ready');
  await host('donut').locator('svg').waitFor();
  await page.locator('#five-explicit').check();
  await page.setViewportSize({ width: 320, height: 900 });
  await settled();
  for (const family of families) {
    await controls(family).last().focus();
    const box = await host(family).evaluate((el) => {
      const a = el.querySelector('figure').getBoundingClientRect(),
        b = el.querySelector('[role=tooltip]').getBoundingClientRect();
      return {
        a: a.toJSON(),
        b: b.toJSON(),
        matrix: el.querySelector('svg').getScreenCTM().toString(),
      };
    });
    assert(
      box.b.left >= box.a.left - 1 && box.b.right <= box.a.right + 1,
      `${family} constrained fixed tooltip`,
    );
  }
  const alignment = await host('donut').evaluate((el) => {
    const svg = el.querySelector('svg'),
      button = el.querySelector('button'),
      a = svg.getBoundingClientRect(),
      b = button.getBoundingClientRect();
    const m = svg.getScreenCTM();
    return {
      centerDelta: Math.abs(a.left + a.width / 2 - (b.left + b.width / 2)),
      scaleX: m.a,
      scaleY: m.d,
    };
  });
  assert(alignment.centerDelta < 1);
  assert.equal(alignment.scaleX, alignment.scaleY);
  report.center = alignment;
  await noOverflow();
  await page.screenshot({
    path: resolve(evidence, 'fixed-constrained.png'),
    fullPage: true,
  });
  await page.locator('#five-explicit').uncheck();
  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  await page.locator('#five-animate').check();
  await settled();
  await axe('forced-colors-reduced-motion');
  await page.screenshot({
    path: resolve(evidence, 'forced-colors.png'),
    fullPage: true,
  });
  await page.emulateMedia({
    reducedMotion: 'no-preference',
    forcedColors: 'none',
  });
  await page.addStyleTag({ content: 'html { font-size:200% }' });
  await settled();
  await noOverflow();
  await page.screenshot({
    path: resolve(evidence, 'enlarged-text.png'),
    fullPage: true,
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: resolve(evidence, 'enlarged-text-viewport.png'),
  });
  // Reload resets text emulation before bounded development-mode measurements.
  await page.goto(
    `${process.env.RSC_SMOKE_URL ?? 'http://127.0.0.1:5173'}/?five-charts`,
  );
  await host('donut').locator('svg').waitFor();
  await page.setViewportSize({ width: 1200, height: 900 });
  for (const rows of [100, 1000]) {
    for (const measuredFamily of ['all', ...families]) {
      console.log('Performance', rows, measuredFamily);
      for (const family of families)
        await page
          .locator(`#five-state-${family}`)
          .selectOption(
            measuredFamily === 'all' || measuredFamily === family
              ? 'ready'
              : 'empty',
          );
      await page.locator('#five-rows').selectOption(String(rows));
      await settled();
      const samples = [];
      for (let repeat = 0; repeat < 3; repeat++) {
        const sample = {};
        for (const operation of ['mount', 'update', 'resize']) {
          if (operation === 'mount')
            await page.locator('#five-mounted').uncheck();
          sample[operation] = await page.evaluate(
            async ({ operation, measuredFamily }) => {
              const start = performance.now();
              if (operation === 'mount')
                document.querySelector('#five-mounted').click();
              else if (operation === 'update')
                document.querySelector('#five-update').click();
              else {
                for (const select of document.querySelectorAll(
                  measuredFamily === 'all'
                    ? '[id^=five-width-]'
                    : `#five-width-${measuredFamily}`,
                )) {
                  select.value = select.value === '200' ? '320' : '200';
                  select.dispatchEvent(
                    new window.Event('change', { bubbles: true }),
                  );
                }
              }
              await new Promise((resolve) =>
                requestAnimationFrame(() => requestAnimationFrame(resolve)),
              );
              const ready = () => {
                const graphics = [
                  ...document.querySelectorAll('[data-five] svg'),
                ];
                return (
                  graphics.length === (measuredFamily === 'all' ? 5 : 1) &&
                  graphics.every(
                    (svg) =>
                      Math.abs(
                        Number(svg.getAttribute('width')) -
                          svg.closest('figure').getBoundingClientRect().width,
                      ) < 1,
                  )
                );
              };
              for (let frames = 0; frames < 20 && !ready(); frames++)
                await new Promise((resolve) => requestAnimationFrame(resolve));
              if (!ready())
                throw new Error('measurement ended before ready, resized SVGs');
              return performance.now() - start;
            },
            { operation, repeat, measuredFamily },
          );
        }
        samples.push(sample);
      }
      const counts = await page.evaluate(() =>
        [...document.querySelectorAll('[data-five]')].map((el) => ({
          family: el.getAttribute('data-five'),
          controls: el.querySelectorAll('svg [role=button]').length,
          marks: el.querySelectorAll(
            '[data-layer=marks] path,[data-layer=marks] circle,[data-layer=marks] rect',
          ).length,
          tableRows: el.querySelectorAll('tbody tr').length,
        })),
      );
      for (const count of counts)
        assert.equal(
          count.tableRows,
          measuredFamily === 'all' || measuredFamily === count.family
            ? rows
            : 0,
          'performance dataset must retain its requested size',
        );
      const timings = Object.fromEntries(
        ['mount', 'update', 'resize'].map((key) => {
          const values = samples.map((s) => s[key]).sort((a, b) => a - b);
          return [key, { median: values[1], min: values[0], max: values[2] }];
        }),
      );
      report.performance.push({
        family: measuredFamily,
        rows,
        repeats: 3,
        samples,
        timings,
        counts,
      });
    }
  }
  assert.deepEqual(errors, []);
  await writeFile(
    resolve(evidence, 'report.json'),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await context.close();
  await browser.close();
}
