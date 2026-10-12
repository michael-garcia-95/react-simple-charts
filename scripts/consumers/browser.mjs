// Real browser scenarios, SSR/hydration observations, and owned fixture server.
/* global document, window, getComputedStyle, DOMPoint */
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { withVerificationServer } from '../verification-server.mjs';

export async function verifyConsumerBrowser({
  dir,
  kind,
  port,
  major,
  identity,
  browser,
  AxeBuilder,
  env,
  evidenceRun,
  report,
  file,
}) {
  const args =
    kind === 'vite'
      ? [
          'vite',
          'preview',
          '--host',
          '127.0.0.1',
          '--port',
          String(port),
          '--strictPort',
        ]
      : ['next', 'start', '--hostname', '127.0.0.1', '--port', String(port)];
  const url = `http://127.0.0.1:${port}`;
  const serverReport = {
    kind,
    react: major,
    url,
    identity,
    status: 'starting',
  };
  report.servers.push(serverReport);
  async function verifyFixture({ html, signal, onCancel }) {
    onCancel(() => browser.close());
    signal.throwIfAborted();
    serverReport.status = 'ready';
    await file(dir, 'evidence/response.html', html);
    const errors = [];
    const context = await browser.newContext({
      viewport: { width: 1100, height: 1200 },
      hasTouch: true,
    });
    const page = await context.newPage();
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('response', (response) => {
      if (response.status() >= 400)
        errors.push(`${response.status()} ${response.url()}`);
    });
    page.on('pageerror', (error) => errors.push(error.message));
    // Gate native observer delivery so pre-measurement hydration can be inspected.
    await page.addInitScript(() => {
      window.__observers = [];
      const Native = window.ResizeObserver;
      window.ResizeObserver = class {
        constructor(callback) {
          this.native = new Native((entries, observer) => {
            this.entries = entries;
            if (window.__measure) callback(entries, observer);
          });
          this.callback = callback;
          window.__observers.push(this);
        }
        observe(element) {
          this.native.observe(element);
        }
        disconnect() {
          this.disconnected = true;
          this.native.disconnect();
        }
      };
      window.__release = () => {
        window.__measure = true;
        window.__observers.forEach((o) => {
          if (o.entries) o.callback(o.entries, o.native);
        });
      };
    });
    let donutBefore;
    let donutResponsiveBefore;
    let pieBefore;
    let pieResponsiveBefore;
    let barBefore;
    let barResponsiveBefore;
    let before;
    let responsiveBefore;
    let areaBefore;
    let areaResponsiveBefore;
    if (kind === 'next') {
      const staticPage = await browser.newPage({
        javaScriptEnabled: false,
      });
      await staticPage.goto(url);
      donutBefore = await staticPage.locator('#donut-explicit').innerHTML();
      donutResponsiveBefore = await staticPage
        .locator('#donut-responsive')
        .innerHTML();
      assert.equal(
        await staticPage.locator('#donut-negative [data-donut-center]').count(),
        0,
      );
      assert.equal(
        await staticPage
          .locator('#donut-single [data-donut-center]')
          .textContent(),
        '0',
      );
      pieBefore = await staticPage
        .locator('#pie-explicit svg')
        .evaluate((el) => el.outerHTML);
      pieResponsiveBefore = await staticPage
        .locator('#pie-responsive')
        .innerHTML();
      assert.equal(
        await staticPage.locator('#pie-single [data-layer=marks] path').count(),
        1,
      );
      assert.equal(await staticPage.locator('#pie-negative svg').count(), 0);
      barBefore = await staticPage
        .locator('#bar-horizontal svg')
        .evaluate((el) => el.outerHTML);
      barResponsiveBefore = await staticPage
        .locator('#bar-responsive')
        .innerHTML();
      responsiveBefore = await staticPage.locator('#responsive').innerHTML();
      areaBefore = await staticPage
        .locator('#area-explicit svg')
        .evaluate((el) => el.outerHTML);
      areaResponsiveBefore = await staticPage
        .locator('#area-responsive')
        .innerHTML();
      assert.equal(await staticPage.locator('#area-responsive svg').count(), 0);
      assert.equal(await staticPage.locator('#area-time svg').count(), 0);
      before = await staticPage
        .locator('#explicit svg')
        .evaluate((el) => el.outerHTML);
      assert.equal(
        await staticPage.locator('#explicit svg').getAttribute('viewBox'),
        '0 0 640 280',
      );
      assert.equal(await staticPage.locator('#responsive svg').count(), 0);
      assert.equal(await staticPage.locator('#local-time svg').count(), 0);
      assert.equal(await staticPage.locator('[role=tooltip]').count(), 0);
      assert.equal(
        await staticPage
          .locator('#responsive [role=img]')
          .evaluate((el) => getComputedStyle(el).height),
        '280px',
      );
      assert.equal(await staticPage.getByRole('table').count(), 31);
      await file(
        dir,
        'evidence/before.html',
        await staticPage.locator('main').innerHTML(),
      );
      await staticPage.close();
    }
    await page.goto(url);
    await page.waitForFunction(() => window.__observers.length >= 2);
    assert.equal(await page.locator('#responsive svg').count(), 0);
    assert.equal(await page.getByRole('table').count(), 31);
    if (donutBefore)
      assert.equal(
        await page.locator('#donut-explicit').innerHTML(),
        donutBefore,
      );
    if (donutResponsiveBefore)
      assert.equal(
        await page.locator('#donut-responsive').innerHTML(),
        donutResponsiveBefore,
      );
    if (pieBefore)
      assert.equal(
        await page.locator('#pie-explicit svg').evaluate((el) => el.outerHTML),
        pieBefore,
      );
    if (pieResponsiveBefore)
      assert.equal(
        await page.locator('#pie-responsive').innerHTML(),
        pieResponsiveBefore,
      );
    if (responsiveBefore)
      assert.equal(
        await page.locator('#responsive').innerHTML(),
        responsiveBefore,
      );
    if (before)
      assert.equal(
        await page.locator('#explicit svg').evaluate((el) => el.outerHTML),
        before,
      );
    if (areaBefore)
      assert.equal(
        await page.locator('#area-explicit svg').evaluate((el) => el.outerHTML),
        areaBefore,
      );
    if (areaResponsiveBefore)
      assert.equal(
        await page.locator('#area-responsive').innerHTML(),
        areaResponsiveBefore,
      );
    await file(
      dir,
      'evidence/hydrated-before-measurement.html',
      await page.locator('main').innerHTML(),
    );
    if (barBefore)
      assert.equal(
        await page
          .locator('#bar-horizontal svg')
          .evaluate((el) => el.outerHTML),
        barBefore,
      );
    if (barResponsiveBefore)
      assert.equal(
        await page.locator('#bar-responsive').innerHTML(),
        barResponsiveBefore,
      );
    await page.evaluate(() => window.__release());
    await page.locator('#responsive svg').waitFor();
    assert.equal(
      await page.locator('#independent svg').getAttribute('width'),
      '320',
    );
    const width = Number(
      await page.locator('#responsive svg').getAttribute('width'),
    );
    await page.locator('#bar-responsive svg').waitFor();
    const barWidth = Number(
      await page.locator('#bar-responsive svg').getAttribute('width'),
    );
    await page.setViewportSize({ width: 700, height: 1200 });
    await page.waitForFunction(
      (previous) =>
        Number(
          document.querySelector('#responsive svg')?.getAttribute('width'),
        ) < previous,
      width,
    );
    assert.equal(
      await page.locator('#independent svg').getAttribute('width'),
      '320',
    );
    await page.waitForFunction(
      (previous) =>
        Number(
          document.querySelector('#bar-responsive svg')?.getAttribute('width'),
        ) < previous,
      barWidth,
    );
    const ids = await page
      .locator('[id]')
      .evaluateAll((elements) => elements.map((el) => el.id));
    assert.equal(new Set(ids).size, ids.length);
    assert(
      await page
        .locator('[aria-labelledby],[aria-describedby]')
        .evaluateAll((elements) =>
          elements.every((el) =>
            ['aria-labelledby', 'aria-describedby'].every((attr) =>
              (el.getAttribute(attr) ?? '')
                .split(' ')
                .filter(Boolean)
                .every((id) => document.getElementById(id)),
            ),
          ),
        ),
    );
    await page.locator('#explicit [role=button]').first().focus();
    await page.keyboard.press('End');
    assert.equal(
      await page
        .locator('#explicit [role=button]')
        .last()
        .getAttribute('tabindex'),
      '0',
    );
    assert.equal(await page.getByRole('tooltip').count(), 1);
    await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('tooltip').count(), 0);
    for (const section of [
      '#interactive',
      '#area-interactive',
      '#bar-interactive',
      '#bar-horizontal-interactive',
      '#pie-interactive',
      '#donut-interactive',
    ]) {
      const ringPoint = async (side) => {
        await page.locator(`${section} svg`).scrollIntoViewIfNeeded();
        return page.locator(`${section} svg`).evaluate((el, side) => {
          const m = el.getScreenCTM();
          return {
            x: m.a * (240 + side * 105.6) + m.e,
            y: m.d * 140 + m.f,
          };
        }, side);
      };
      const clickFirst = async () => {
        if (section === '#donut-interactive') {
          const p = await ringPoint(1);
          await page.mouse.click(p.x, p.y);
        } else await page.locator(`${section} [role=button]`).first().click();
      };
      await page.locator(`${section} [role=button]`).first().focus();
      {
        if (section === '#donut-interactive') {
          const p = await ringPoint(-1);
          await page.mouse.move(p.x, p.y);
        } else await page.locator(`${section} [role=button]`).last().hover();
        assert.equal(
          await page
            .locator(`${section} [role=button]`)
            .first()
            .getAttribute('tabindex'),
          '0',
        );
        assert.equal(
          await page
            .locator(`${section} [role=button]`)
            .last()
            .getAttribute('tabindex'),
          '-1',
        );
      }
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('Enter');
      assert.equal(
        await page.locator(`${section} output`).textContent(),
        '1:keyboard:1',
      );
      await clickFirst();
      assert.equal(
        await page.locator(`${section} output`).textContent(),
        '0:pointer:2',
      );
      await page
        .locator(`${section} [role=button]`)
        .last()
        .scrollIntoViewIfNeeded();
      let hit = await page
        .locator(`${section} [role=button]`)
        .last()
        .boundingBox();
      if (section === '#donut-interactive') {
        const p = await page.locator(`${section} svg`).evaluate((el) => {
          const m = el.getScreenCTM();
          return { x: m.a * (240 - 105.6) + m.e, y: m.d * 140 + m.f };
        });
        hit = { x: p.x, y: p.y, width: 0, height: 0 };
      }
      assert(hit);
      await page.touchscreen.tap(hit.x + hit.width / 2, hit.y + hit.height / 2);
      await page.waitForFunction(
        ({ selector, expected }) =>
          document.querySelector(selector)?.textContent === expected,
        { selector: `${section} output`, expected: '1:touch:3' },
      );
      assert.equal(
        await page.locator(`${section} output`).textContent(),
        '1:touch:3',
      );
      assert.equal(await page.getByRole('tooltip').count(), 1);
      await page.getByRole('button', { name: 'Dismiss inspection' }).click();
      assert.equal(await page.getByRole('tooltip').count(), 0);
      await page
        .locator(`${section} [role=button]`)
        .last()
        .evaluate((el) =>
          el.dispatchEvent(
            new window.MouseEvent('click', { bubbles: true, detail: 0 }),
          ),
        );
      await page.waitForFunction(
        ({ selector, expected }) =>
          document.querySelector(selector)?.textContent === expected,
        { selector: `${section} output`, expected: '1:keyboard:4' },
      );
      await clickFirst();
      await page.waitForFunction(
        ({ selector, expected }) =>
          document.querySelector(selector)?.textContent === expected,
        { selector: `${section} output`, expected: '0:pointer:5' },
      );
      await page
        .locator(`${section} [role=button]`)
        .first()
        .evaluate((el) => {
          el.dispatchEvent(
            new window.KeyboardEvent('keydown', {
              key: 'Enter',
              bubbles: true,
              cancelable: true,
            }),
          );
          el.dispatchEvent(
            new window.KeyboardEvent('keyup', {
              key: 'Enter',
              bubbles: true,
              cancelable: true,
            }),
          );
          el.dispatchEvent(
            new window.MouseEvent('click', { bubbles: true, detail: 0 }),
          );
        });
      await page.waitForFunction(
        ({ selector, expected }) =>
          document.querySelector(selector)?.textContent === expected,
        { selector: `${section} output`, expected: '0:keyboard:6' },
      );

      await page.keyboard.press('Escape');
    }
    await page.keyboard.press('Escape');
    assert.equal(
      await page
        .locator('#responsive path')
        .evaluate((el) => getComputedStyle(el).stroke),
      'rgb(8, 107, 98)',
    );
    assert.equal(
      await page
        .locator('#responsive table')
        .evaluate((el) => getComputedStyle(el).clipPath),
      'inset(50%)',
    );
    await page.locator('#pie-responsive svg').waitFor();
    const pieWidth = Number(
      await page.locator('#pie-responsive svg').getAttribute('width'),
    );
    await page.setViewportSize({ width: 480, height: 1200 });
    await page.waitForFunction(
      (previous) =>
        Number(
          document.querySelector('#pie-responsive svg')?.getAttribute('width'),
        ) < previous,
      pieWidth,
    );
    assert.equal(
      await page.locator('#pie-explicit [data-layer=marks] path').count(),
      2,
    );
    assert.equal(await page.locator('#pie-explicit table tbody tr').count(), 4);
    assert.equal(await page.locator('#pie-explicit li').count(), 2);
    assert.equal(await page.locator('#pie-explicit text').count(), 2);
    await page.locator('#pie-explicit [role=button]').first().focus();
    assert(
      (
        await page.locator('#pie-explicit [role=tooltip]').textContent()
      ).includes('25.0%'),
    );
    await page.screenshot({
      path: join(evidenceRun.directory, `${kind}-${major}`, 'pie-focus.png'),
      fullPage: true,
    });
    await page.keyboard.press('Escape');
    await page.setViewportSize({ width: 700, height: 1200 });
    await page.locator('#area-responsive svg').waitFor();
    await page.locator('#area-time svg').waitFor();
    for (const section of [
      'area-explicit',
      'area-negative',
      'area-mixed',
      'area-gaps',
    ]) {
      assert((await page.locator(`#${section} [data-area-fill]`).count()) > 0);
      assert(
        await page
          .locator(`#${section} [data-area-fill]`)
          .evaluateAll((nodes) =>
            nodes.every(
              (n) =>
                n.getAttribute('stroke') === 'none' &&
                n.getAttribute('fill-opacity') === '0.2' &&
                !/NaN|Infinity/.test(n.getAttribute('d')),
            ),
          ),
      );
      assert(
        await page
          .locator(`#${section} [data-area-boundary]`)
          .evaluateAll((nodes) =>
            nodes.every(
              (n) =>
                n.getAttribute('fill') === 'none' &&
                !n.getAttribute('d').includes('Z'),
            ),
          ),
      );
      assert(
        await page
          .locator(`#${section} [data-layer="marks"]`)
          .getAttribute('clip-path'),
      );
    }
    assert.equal(
      await page
        .locator('#area-gaps [data-series="a"] [data-area-fill]')
        .count(),
      1,
    );
    assert.equal(
      await page.locator('#area-gaps [data-series="a"] circle').count(),
      3,
    );
    for (const [section, sign] of [
      ['area-explicit', 1],
      ['area-negative', -1],
    ]) {
      assert(
        await page
          .locator(`#${section} [data-area-fill]`)
          .evaluate((node, sign) => {
            const coords = [
              ...node.getAttribute('d').matchAll(/[ML]([^,]+),([^MLZ]+)/g),
            ].map((m) => [Number(m[1]), Number(m[2])]);
            const baseline = coords.at(-1)[1];
            return coords
              .slice(0, coords.length / 2)
              .every((p) => (sign > 0 ? p[1] < baseline : p[1] > baseline));
          }, sign),
      );
    }
    await page.locator('#bar-responsive svg').waitFor();
    for (const [section, horizontal] of [
      ['bar-vertical', false],
      ['bar-horizontal', true],
    ]) {
      assert.equal(await page.locator(`#${section} [data-bar]`).count(), 5);
      assert.equal(await page.locator(`#${section} [role=button]`).count(), 5);
      assert(
        await page
          .locator(`#${section} [data-bar]`)
          .evaluateAll((nodes, horizontal) => {
            const start = horizontal ? 'x' : 'y',
              extent = horizontal ? 'width' : 'height';
            const n = (el, attr) => Number(el.getAttribute(attr));
            const zero = nodes.find(
              (el) => el.getAttribute('data-source-index') === '2',
            );
            const baseline = n(zero, start);
            return (
              n(zero, extent) === 0 &&
              nodes.every((el) => {
                const row = Number(el.getAttribute('data-source-index'));
                const key = el.getAttribute('data-series');
                const value = key === 'a' ? [-2, 3, 0][row] : [2, -3][row];
                const positive = horizontal ? value < 0 : value > 0;
                return (
                  value === 0 ||
                  (positive
                    ? n(el, start) < baseline &&
                      Math.abs(n(el, start) + n(el, extent) - baseline) < 1e-8
                    : Math.abs(n(el, start) - baseline) < 1e-8)
                );
              })
            );
          }, horizontal),
      );
      assert(
        (
          await page
            .locator(`#${section} [data-axis="${horizontal ? 'x' : 'y'}"]`)
            .textContent()
        ).includes('0'),
      );
      assert(
        (
          await page
            .locator(`#${section} [data-axis="${horizontal ? 'y' : 'x'}"]`)
            .textContent()
        ).includes('C'),
      );
      await page.locator(`#${section} [role=button]`).first().focus();
      const tooltip = await page.getByRole('tooltip').textContent();
      assert(tooltip.includes('A: -2'));
      assert.equal(tooltip.includes('B: 2'), horizontal);
      await page.keyboard.press('Escape');
      await page.locator(`#${section}`).screenshot({
        path: join(evidenceRun.directory, `${kind}-${major}`, `${section}.png`),
      });
    }
    assert.equal(await page.locator('#bar-clipped [data-bar]').count(), 3);
    assert.equal(await page.locator('#bar-clipped [role=button]').count(), 1);
    for (const chart of await page.locator('[data-narrow]').all()) {
      await chart.locator('svg').waitFor();
      await chart.locator('[role=button]').first().focus();
      assert(
        await chart.evaluate((el) => {
          const t = el.querySelector('[role=tooltip]');
          const table = el.querySelector('table');
          return (
            t.scrollWidth <= t.clientWidth + 1 &&
            table.getBoundingClientRect().width <= 321
          );
        }),
        'Installed package wraps long tooltip and table values',
      );
      await page.keyboard.press('Escape');
    }
    for (const [button, state] of [
      ['Empty integrated charts', 'empty'],
      ['Unusable integrated charts', 'unusable'],
      ['Replace integrated data', 'replacement'],
    ]) {
      await page.getByRole('button', { name: button, exact: true }).click();
      assert.equal(await page.locator('#integrated-narrow table').count(), 3);
      assert.equal(
        await page.locator('#integrated-narrow svg').count(),
        state === 'replacement' ? 3 : 0,
      );
      if (state === 'replacement')
        assert(
          (await page.locator('#integrated-narrow').textContent()).includes(
            'Replacement',
          ),
        );
    }
    await page.locator('#donut-responsive svg').waitFor();
    for (const section of [
      '#donut-explicit',
      '#donut-single',
      '#donut-responsive',
      '#donut-interactive',
    ]) {
      const bounds = await page.locator(section).evaluate((el) => {
        const svg = el.querySelector('svg'),
          center = el.querySelector('[data-donut-center]');
        const a = svg.getBoundingClientRect(),
          b = center.getBoundingClientRect();
        return {
          dx: Math.abs(a.x + a.width / 2 - b.x - b.width / 2),
          dy: Math.abs(a.y + a.height / 2 - b.y - b.height / 2),
        };
      });
      assert(bounds.dx < 1 && bounds.dy < 1, section + ' center alignment');
    }
    const interactiveDonut = page.locator('#donut-interactive');
    const previous = await interactiveDonut.locator('output').textContent();
    await interactiveDonut.getByRole('button', { name: 'Details 0' }).click();
    assert.equal(
      await interactiveDonut.locator('output').textContent(),
      previous,
    );
    await interactiveDonut.getByRole('button', { name: 'Details 1' }).focus();
    await page.keyboard.press('Shift+Tab');
    assert.equal(
      await page.evaluate(() => document.activeElement?.tagName),
      'path',
    );
    await page.keyboard.press('Tab');
    assert.equal(
      await page.evaluate(() => document.activeElement?.textContent),
      'Details 1',
    );
    const singleDonut = page.locator('#donut-single');
    const singleOutput = singleDonut.getByRole('status', {
      name: 'Single Donut activation',
    });
    const singleControl = singleDonut.locator('svg [role=button]');
    assert.equal(
      await singleControl.count(),
      1,
      'Single Donut has one segment',
    );
    assert.equal(await singleOutput.textContent(), 'None:0');
    // Read the full ring's actual arc radii and current SVG screen transform.
    // The off-center hole point avoids the inscribed center-content overlay.
    async function singleDonutPoint(kind) {
      await singleControl.scrollIntoViewIfNeeded();
      return singleControl.evaluate((path, kind) => {
        const svg = path.ownerSVGElement;
        const radii = [
          ...path.getAttribute('d').matchAll(/A([\d.eE+-]+),([\d.eE+-]+)/g),
        ].map((match) => {
          if (Number(match[1]) !== Number(match[2]))
            throw new Error('Single Donut must have circular arcs');
          return Number(match[1]);
        });
        if (
          radii.length !== 4 ||
          radii.some((r) => !Number.isFinite(r) || r <= 0)
        )
          throw new Error(
            'Single Donut full ring must expose four finite arcs',
          );
        const inner = Math.min(...radii),
          outer = Math.max(...radii);
        if (!(inner < outer))
          throw new Error('Single Donut needs an empty hole');
        const box = path.getBBox();
        const point = new DOMPoint(
          box.x + box.width / 2,
          box.y +
            box.height / 2 -
            (kind === 'hole' ? inner * 0.9 : (inner + outer) / 2),
        );
        if (path.isPointInFill(point) !== (kind === 'ring'))
          throw new Error(
            'Single Donut ' + kind + ' point contradicts rendered fill',
          );
        const matrix = path.getScreenCTM();
        if (!matrix) throw new Error('Single Donut has no screen transform');
        const screen = point.matrixTransform(matrix);
        const hit = document.elementFromPoint(screen.x, screen.y);
        if (hit !== (kind === 'hole' ? svg : path))
          throw new Error(
            'Single Donut ' +
              kind +
              ' must hit ' +
              (kind === 'hole' ? 'uncovered SVG' : 'its segment'),
          );
        return { x: screen.x, y: screen.y };
      }, kind);
    }
    let singleActivations = 0;
    for (const viewport of [700, 480]) {
      await page.setViewportSize({ width: viewport, height: 1200 });
      const label = `Single Donut at ${viewport}px (${kind}, React ${major})`;
      const beforeHole = await singleOutput.textContent();
      const hole = await singleDonutPoint('hole');
      await page.mouse.click(hole.x, hole.y);
      assert.equal(
        await singleOutput.textContent(),
        beforeHole,
        label + ': hole must not activate its segment',
      );
      assert.equal(
        await interactiveDonut.locator('output').textContent(),
        previous,
        label + ': hole must not affect sibling Donut',
      );
      const ring = await singleDonutPoint('ring');
      await page.mouse.click(ring.x, ring.y);
      singleActivations++;
      assert.equal(
        await singleOutput.textContent(),
        `0:Complete:1:pointer:${singleActivations}`,
        label + ': ring must activate the intended source segment exactly once',
      );
      assert.equal(
        await interactiveDonut.locator('output').textContent(),
        previous,
        label + ': ring must not affect sibling Donut',
      );
      const afterRing = await singleOutput.textContent();
      const holeAfterRing = await singleDonutPoint('hole');
      await page.mouse.click(holeAfterRing.x, holeAfterRing.y);
      assert.equal(
        await singleOutput.textContent(),
        afterRing,
        label + ': hole after ring activation must remain inert',
      );
      assert.equal(
        await interactiveDonut.locator('output').textContent(),
        previous,
        label + ': later hole must not affect sibling Donut',
      );
    }
    await page.setViewportSize({ width: 650, height: 1200 });
    await page.waitForTimeout(100);
    const resized = await page.locator('#donut-responsive').evaluate((el) => {
      const svg = el.querySelector('svg').getBoundingClientRect(),
        center = el
          .querySelector('[data-donut-center]')
          .getBoundingClientRect();
      return (
        Math.abs(svg.x + svg.width / 2 - center.x - center.width / 2) +
        Math.abs(svg.y + svg.height / 2 - center.y - center.height / 2)
      );
    });
    assert(resized < 1);
    await page.locator('#donut-explicit').screenshot({
      path: join(evidenceRun.directory, `${kind}-${major}`, 'donut-center.png'),
    });
    const ax = await page.locator('main').ariaSnapshot();
    assert(ax.includes('rowheader "Q4"') && ax.includes('Responsive — data'));
    await file(dir, 'evidence/accessibility.txt', ax);
    const axe = await new AxeBuilder({ page }).include('main').analyze();
    assert.deepEqual(axe.violations, []);
    await file(
      dir,
      'evidence/after.html',
      await page.locator('main').innerHTML(),
    );
    await page.screenshot({
      path: join(evidenceRun.directory, `${kind}-${major}`, 'after.png'),
      fullPage: true,
    });
    assert.deepEqual(errors, []);
    if (kind === 'next') {
      await page.goto(`${url}/pages-check`);
      await page.waitForFunction(() => window.__observers.length >= 2);
      await page.evaluate(() => window.__release());
      await page.locator('#responsive svg').waitFor();
      assert.equal(await page.getByRole('table').count(), 31);
      assert.deepEqual(errors, []);
    } else {
      await page.evaluate(() => window.__unmount());
      assert(
        await page.evaluate(() =>
          window.__observers.every((o) => o.disconnected),
        ),
      );
      assert.equal(await page.locator('figure').count(), 0);
      const staticRoots = await browser.newPage({
        javaScriptEnabled: false,
      });
      await staticRoots.goto(`${url}/roots.html`);
      const rootsBefore = await staticRoots.locator('body').innerHTML();
      await staticRoots.close();
      await page.goto(`${url}/roots.html`);
      await page.waitForTimeout(500);
      assert.equal(await page.locator('body').innerHTML(), rootsBefore);
      const rootIds = await page
        .locator('[id]')
        .evaluateAll((elements) => elements.map((el) => el.id));
      assert.equal(new Set(rootIds).size, rootIds.length);
      assert.equal(await page.locator('table').count(), 7);
      await page.evaluate(() => window.__release());
      await page.locator('#root4 svg').waitFor();
      await page.locator('#root6 svg').waitFor();
      assert.equal(await page.locator('svg').count(), 7);
      assert.deepEqual(errors, []);
      await file(dir, 'evidence/separate-roots.html', rootsBefore);
    }
    await context.close();
    report.checks.push({
      kind,
      react: major,
      status: 'pass',
      ssr: kind === 'next',
      browser: true,
      axeViolations: 0,
      donutHole:
        'same-chart hole/ring positive control and sibling isolation at 700/480px',
    });
  }
  try {
    await withVerificationServer(
      {
        args: [
          join(
            dir,
            'node_modules',
            kind === 'vite' ? 'vite/bin/vite.js' : 'next/dist/bin/next',
          ),
          ...args.slice(1),
        ],
        cwd: dir,
        env,
        url,
        identity,
        signal: evidenceRun.signal,
      },
      verifyFixture,
    );
    serverReport.status = 'stopped';
  } catch (error) {
    serverReport.status = 'fail';
    serverReport.error = String(error.stack ?? error);
    throw error;
  }
}
