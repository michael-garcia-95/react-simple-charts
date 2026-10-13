import {
  manifestPolicy,
  validateManifest,
} from './artifact/manifest-policy.mjs';
import {
  artifactOptions,
  selectArtifact,
  forbidExactRepack,
} from './artifact/selection.mjs';
import { verifyInstalledInventory } from './artifact/archive.mjs';
import { createEvidenceRun, errorDetails } from './verification-evidence.mjs';
import { runVerificationCommand } from './verification-command.mjs';
import { installBrowserDriver, loadBrowserDriver } from './browser-driver.mjs';
// Focused installed-tarball browser gate; fixtures and drivers stay in ignored work/.
/* global document, getComputedStyle */
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import {
  fixtureIdentity,
  fixtureMeta,
  withVerificationServer,
} from './verification-server.mjs';

const root = resolve(import.meta.dirname, '..');
const exact = artifactOptions();
const policy = manifestPolicy(exact ?? {});
const base = exact?.['evidence-base']
  ? resolve(exact['evidence-base'])
  : join(root, 'work/browser-smoke');
const setupOnly = process.argv.includes('--install-driver-only');
const prepareOnly = process.argv.includes('--prepare-only');
const requested = (
  process.env.RSC_SMOKE_BROWSERS ?? 'chromium,firefox,webkit'
).split(',');
const evidenceRun = await createEvidenceRun(
  base,
  setupOnly
    ? 'browser-driver-setup'
    : prepareOnly
      ? 'browser-fixture-preparation'
      : 'browser-smoke',
  {
    react: '19.3.0',
    vite: '8.3.4',
    playwright: '1.64.0',
    browsers: requested.map((engine) => ({
      engine,
      status: 'unexecuted',
      checks: [],
    })),
  },
);
const report = evidenceRun.report;
report.policy = policy;
report.mode = exact ? 'exact-artifact' : 'development';
report.parentRunId = exact?.['parent-run'];
if (exact) report.selectionRequest = exact;
const driver = join(root, 'work/browser-smoke/driver');
let scratch;
let artifact;
let activeBrowser;
let launching;
evidenceRun.onCancel(async () => {
  if (launching) await launching.catch(() => {});
  await activeBrowser?.close();
});
await evidenceRun.execute(
  async () => {
    assert(
      !(exact && (setupOnly || prepareOnly)),
      'Exact mode requires complete browser execution',
    );
    const work = evidenceRun.directory;
    const env = {
      ...process.env,
      npm_config_cache: join(root, 'work/browser-smoke/npm-cache'),
    };
    for (const name of requested)
      assert.ok(['chromium', 'firefox', 'webkit'].includes(name));
    if (setupOnly) {
      await evidenceRun.phase('driver preparation', () =>
        installBrowserDriver(driver, { env, signal: evidenceRun.signal }),
      );
      return;
    }
    scratch = await mkdtemp(join(base, 'temporary-'));
    const app = join(scratch, 'app');
    const identity = fixtureIdentity('browser-smoke');
    const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
    validateManifest(pkg, policy);
    async function run(cmd, args, cwd = root) {
      forbidExactRepack(exact, cmd, args);
      return evidenceRun.phase(
        cmd === 'npm' && args[0] === 'pack'
          ? 'package creation'
          : cmd === 'npm' && args[0] === 'install'
            ? 'consumer installation'
            : 'build/type verification',
        () =>
          runVerificationCommand(cmd, args, {
            cwd,
            env,
            timeoutMs: 600000,
            signal: evidenceRun.signal,
          }),
      );
    }

    async function file(dir, name, content) {
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, name), content);
    }
    async function installDriver() {
      await evidenceRun.phase('driver preparation', () =>
        installBrowserDriver(driver, { env, signal: evidenceRun.signal }),
      );
    }
    await mkdir(work, { recursive: true });
    let archive;
    if (exact) {
      artifact = await evidenceRun.phase('exact archive selection', () =>
        selectArtifact({ root, work: scratch, options: exact }),
      );
      archive = artifact.genuine;
      report.artifact = artifact.identity;
    } else {
      await run('npm', ['pack', '--pack-destination', scratch]);
      archive = join(
        scratch,
        `${pkg.name.replace(/^@/, '').replaceAll('/', '-')}-${pkg.version}.tgz`,
      );
    }
    await rm(app, { recursive: true, force: true });
    await file(
      app,
      'package.json',
      JSON.stringify(
        {
          private: true,
          type: 'module',
          dependencies: {
            [pkg.name]: `file:${archive}`,
            react: '19.3.0',
            'react-dom': '19.3.0',
            vite: '8.3.4',
          },
        },
        null,
        2,
      ),
    );
    await file(
      app,
      'index.html',
      `<!doctype html><html lang="en"><head>${fixtureMeta(identity)}<title>Installed chart compatibility</title><link rel="icon" href="data:,"></head><body><div id="root"></div><script type="module" src="/main.jsx"></script></body></html>`,
    );
    await file(
      app,
      'main.jsx',
      `import {createElement as h, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {LineChart, AreaChart, BarChart, PieChart, DonutChart} from '${pkg.name}';
const charts={Line:LineChart,Area:AreaChart,Bar:BarChart,Pie:PieChart,Donut:DonutChart};
const data=Object.freeze([{name:'Alpha',value:12},{name:'Beta',value:24},{name:'Gamma',value:18}].map(Object.freeze));
function Example({family,responsive=false}) {
 const [activation,setActivation]=useState('None'); const [count,setCount]=useState(0); const [center,setCenter]=useState(0);
 const polar=family==='Pie'||family==='Donut'; const label=family+(responsive?' responsive':' explicit');
 return h('section',{id:family+(responsive?'-responsive':'-explicit'),style:responsive?{width:'80%'}:{}},
 h('h2',null,label),h('button',{'data-before':true},'Before '+label),
 h(charts[family],{data,...(polar?{nameKey:'name',valueKey:'value'}:{xKey:'name',yKey:'value'}),
 ...(responsive?{}:{width:640}),height:280,accessibility:{label,description:'Alpha 12, Beta 24, Gamma 18.',dataTable:responsive?'visually-hidden':'visible'},
 onDataActivate:p=>{setActivation(p.index+':'+p.inputMethod);setCount(n=>n+1)},
 ...(family==='Donut'?{centerContent:h('button',{onClick:()=>setCenter(n=>n+1)},'Details '+center)}:{})}),
 h('output',{'aria-label':label+' activation'},activation+':'+count),h('button',{'data-after':true},'After '+label));
}
function App(){return h('main',null,h('h1',null,'Installed five-family compatibility'),
 ...Object.keys(charts).flatMap(family=>[false,true].map(responsive=>h(Example,{key:family+responsive,family,responsive}))),
 h('section',{id:'empty'},h('h2',null,'Empty Line'),h(LineChart,{data:[],xKey:'name',yKey:'value',width:640,accessibility:{label:'Empty Line',dataTable:'visible'}})),
 h('section',{id:'unavailable'},h('h2',null,'Unavailable Pie'),h(PieChart,{data:[{name:'Rejected',value:-1}],nameKey:'name',valueKey:'value',width:640,accessibility:{label:'Unavailable Pie',dataTable:'visible'}})));
}
createRoot(document.getElementById('root')).render(h(App));`,
    );
    await artifact?.verify();
    await run('npm', ['install', '--no-audit', '--no-fund'], app);
    if (exact) {
      await artifact.verify();
      await verifyInstalledInventory(
        join(app, 'node_modules', pkg.name),
        artifact.files,
      );
    }
    assert.deepEqual(
      await readFile(join(app, `node_modules/${pkg.name}/dist/index.js`)),
      exact ? artifact.js : await readFile(join(root, 'dist/index.js')),
    );
    const installed = JSON.parse(
      await readFile(
        join(app, `node_modules/${pkg.name}/package.json`),
        'utf8',
      ),
    );
    assert.equal(installed.engines, undefined);
    validateManifest(installed, policy);
    await run('npm', ['ls', 'react', 'react-dom'], app);
    await run('node', ['node_modules/vite/bin/vite.js', 'build'], app);
    if (prepareOnly) {
      console.log(
        `Manual fixture directory: ${app}\nFrom that directory: node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4323 --strictPort`,
      );
      report.preparedFixture = app;
      return;
    }
    await installDriver();
    const { engines, AxeBuilder } = loadBrowserDriver(driver);
    const url = 'http://127.0.0.1:4323';
    report.server = { url, identity, status: 'starting' };
    let failed = false;
    let originalFailure;
    async function verifyBrowsers({ assertRunning, signal, onCancel }) {
      onCancel(async () => {
        if (launching) await launching.catch(() => {});
        await activeBrowser?.close();
      });
      report.server.status = 'ready';
      for (const name of requested) {
        assertRunning();
        if (exact) {
          await artifact.verify();
          await verifyInstalledInventory(
            join(app, 'node_modules', pkg.name),
            artifact.files,
          );
        }
        let browser;
        let page;
        const errors = [];
        const result = report.browsers.find((item) => item.engine === name);
        result.status = 'running';
        if (exact) result.artifactSha256 = artifact.identity.sha256;
        await evidenceRun.persist();
        try {
          const executablePath =
            process.env[`RSC_${name.toUpperCase()}_PATH`] ??
            (name === 'chromium' ? process.env.RSC_BROWSER_PATH : undefined);
          launching = evidenceRun.phase('browser launch', () =>
            engines[name].launch({
              headless: true,
              timeout: 15000,
              ...(executablePath ? { executablePath } : {}),
              ...(name === 'chromium' ? { args: ['--no-sandbox'] } : {}),
            }),
          );
          browser = await launching;
          activeBrowser = browser;
          launching = undefined;
          signal.throwIfAborted();
          report.phase = 'browser assertions';
          await evidenceRun.persist();
          result.version = browser.version();
          await evidenceRun.phase('browser assertions', async () => {
            const context = await browser.newContext({
              viewport: { width: 1100, height: 900 },
            });
            page = await context.newPage();
            page.setDefaultTimeout(10000);
            page.setDefaultNavigationTimeout(15000);
            page.on('console', (m) => {
              if (m.type() === 'error') errors.push(m.text());
            });
            page.on('pageerror', (e) => errors.push(e.message));
            page.on('response', (r) => {
              if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
            });
            await page.goto(url);
            for (const family of ['Line', 'Area', 'Bar', 'Pie', 'Donut']) {
              for (const sizing of ['explicit', 'responsive']) {
                const label = `${family} ${sizing}`;
                const section = page.locator(`#${family}-${sizing}`);
                const svg = section.getByRole('group', {
                  name: label,
                  exact: true,
                });
                await svg.waitFor();
                assert.equal(await svg.getAttribute('height'), '280');
                if (sizing === 'explicit')
                  assert.equal(await svg.getAttribute('width'), '640');
                assert.ok(
                  await svg.evaluate(
                    (el) => el.getBoundingClientRect().width > 0,
                  ),
                );
                assert.equal(
                  await svg.evaluate(
                    (el) =>
                      document.getElementById(
                        el.getAttribute('aria-describedby'),
                      )?.textContent,
                  ),
                  'Alpha 12, Beta 24, Gamma 18.',
                );
                assert.ok(
                  await svg.evaluate((el) =>
                    Array.from(el.querySelectorAll('path,rect,circle')).every(
                      (mark) => {
                        const box = mark.getBBox();
                        return (
                          [box.x, box.y, box.width, box.height].every(
                            Number.isFinite,
                          ) &&
                          !/NaN|Infinity/.test(mark.getAttribute('d') ?? '')
                        );
                      },
                    ),
                  ),
                  'Finite SVG geometry',
                );
                const controls = svg.getByRole('button');
                assert.equal(await controls.count(), 3);
                assert.equal(await svg.locator('[tabindex="0"]').count(), 1);
                const table = section.getByRole('table', {
                  name: `${label} — data`,
                  exact: true,
                });
                assert.equal(await table.locator('tbody tr').count(), 3);
                for (const value of [
                  'Alpha',
                  '12',
                  'Beta',
                  '24',
                  'Gamma',
                  '18',
                ])
                  assert.ok((await table.textContent()).includes(value));
                assert.equal(await table.getAttribute('aria-hidden'), null);
                await section.locator('[data-before]').focus();
                await page.keyboard.press('Tab');
                assert.ok(
                  await controls
                    .nth(0)
                    .evaluate((el) => el === document.activeElement),
                  'Tab enters first data control',
                );
                assert.notEqual(
                  await svg.evaluate((el) => getComputedStyle(el).outlineStyle),
                  'none',
                );
                assert.ok(await section.getByRole('tooltip').isVisible());
                assert.equal(
                  await controls.nth(0).getAttribute('aria-describedby'),
                  await section.getByRole('tooltip').getAttribute('id'),
                );
                for (const [key, index] of [
                  ['ArrowRight', 1],
                  ['ArrowDown', 2],
                  ['ArrowLeft', 1],
                  ['ArrowUp', 0],
                  ['End', 2],
                  ['Home', 0],
                ]) {
                  await page.keyboard.press(key);
                  assert.ok(
                    await controls
                      .nth(index)
                      .evaluate((el) => el === document.activeElement),
                    `${label} ${key}`,
                  );
                }
                await page.keyboard.press('Enter');
                assert.equal(
                  await section.locator('output').textContent(),
                  '0:keyboard:1',
                );
                await page.keyboard.press('Space');
                assert.equal(
                  await section.locator('output').textContent(),
                  '0:keyboard:2',
                );
                await page.keyboard.press('Escape');
                assert.equal(await section.getByRole('tooltip').count(), 0);
                assert.equal(
                  await controls.nth(0).getAttribute('aria-describedby'),
                  null,
                );
                await page.keyboard.press('Tab');
                if (family === 'Donut') {
                  const center = section.getByRole('button', {
                    name: 'Details 0',
                    exact: true,
                  });
                  assert.ok(
                    await center.evaluate(
                      (el) => el === document.activeElement,
                    ),
                  );
                  await page.keyboard.press('Enter');
                  assert.ok(
                    await section
                      .getByRole('button', { name: 'Details 1', exact: true })
                      .isVisible(),
                  );
                  assert.equal(
                    await section.locator('output').textContent(),
                    '0:keyboard:2',
                  );
                  await page.keyboard.press('Tab');
                }
                assert.ok(
                  await section
                    .locator('[data-after]')
                    .evaluate((el) => el === document.activeElement),
                  'Tab exits chart',
                );
                // Sector bounding-box centers can lie in a Donut hole. Hit-test a
                // deterministic interior sector point, never force a synthetic click.
                let pointer;
                if (family === 'Pie' || family === 'Donut') {
                  await svg.scrollIntoViewIfNeeded();
                  // Use current screen coordinates after scrolling.
                  pointer = await controls.nth(1).evaluate(
                    (el, pointer) => {
                      const svg = el.ownerSVGElement;
                      const box = svg.getBoundingClientRect();
                      const width = Number(svg.getAttribute('width'));
                      const height = Number(svg.getAttribute('height'));
                      const r =
                        (Math.min(width, height) / 2 - 8) *
                        (pointer.family === 'Donut' ? 0.8 : 0.6);
                      const a = (2 * Math.PI * (12 + 24 / 2)) / 54;
                      const x =
                        box.x +
                        ((width / 2 + Math.sin(a) * r) * box.width) / width;
                      const y =
                        box.y +
                        ((height / 2 - Math.cos(a) * r) * box.height) / height;
                      if (document.elementFromPoint(x, y) !== el)
                        throw new Error('Sector interior must be hit-testable');
                      return { x, y };
                    },
                    { family },
                  );
                  await page.mouse.move(pointer.x, pointer.y);
                } else await controls.nth(1).hover();
                assert.ok(await section.getByRole('tooltip').isVisible());
                if (pointer) await page.mouse.click(pointer.x, pointer.y);
                else await controls.nth(1).click();
                assert.equal(
                  await section.locator('output').textContent(),
                  '1:pointer:3',
                );
                await page.mouse.move(0, 0);
                await page.keyboard.press('Escape');
                assert.equal(await section.getByRole('tooltip').count(), 0);
                result.checks.push(label);
              }
            }
            for (const [id, state] of [
              ['empty', 'No chart data'],
              ['unavailable', 'Chart rendering unavailable'],
            ]) {
              const section = page.locator('#' + id);
              assert.ok(
                (await section.getByRole('img').textContent()).includes(state),
              );
              assert.equal(
                await section.locator('svg,[role=button]').count(),
                0,
              );
              assert.equal(await section.getByRole('table').count(), 1);
            }
            const widths = await page
              .locator('section[id$="-responsive"] svg')
              .evaluateAll((nodes) =>
                nodes.map((el) => Number(el.getAttribute('width'))),
              );
            await page.setViewportSize({ width: 700, height: 900 });
            await page.waitForFunction(
              (before) =>
                Array.from(
                  document.querySelectorAll('section[id$="-responsive"] svg'),
                ).every(
                  (el, i) => Number(el.getAttribute('width')) < before[i],
                ),
              widths,
            );
            const ids = await page
              .locator('[id]')
              .evaluateAll((nodes) => nodes.map((el) => el.id));
            assert.equal(new Set(ids).size, ids.length);
            const snapshot = await page.locator('main').ariaSnapshot();
            for (const family of ['Line', 'Area', 'Bar', 'Pie', 'Donut'])
              assert.ok(
                snapshot.includes(`${family} responsive — data`),
                'Hidden tables in accessibility tree',
              );
            const axe = await new AxeBuilder({ page })
              .include('main')
              .analyze();
            result.axeViolations = axe.violations.length;
            await file(
              work,
              `${name}-axe.json`,
              JSON.stringify(axe, null, 2) + '\n',
            );
            assert.deepEqual(axe.violations, []);
            await file(work, `${name}-accessibility.txt`, snapshot);
            await page.screenshot({
              path: join(work, `${name}.png`),
              fullPage: true,
            });
            assert.deepEqual(errors, []);
            result.checks.push(
              'empty/unavailable',
              'multiple charts/unique IDs',
              'native resize',
              'axe/accessibility tree',
              'no console/page exceptions',
            );
            result.status = 'pass';
          });
        } catch (error) {
          result.status = browser ? 'fail' : 'unexecuted';
          originalFailure ??= error;
          report.failingPhase ??= report.phase;
          result.error = String(error.stack ?? error);
          console.error(result.error);
          // Diagnostics never replace or retry the failed assertion.
          if (page) {
            const diagnostics = await Promise.allSettled([
              page.screenshot({
                path: join(work, `${name}-failure.png`),
                fullPage: true,
              }),
              page
                .locator('main')
                .ariaSnapshot()
                .then((snapshot) =>
                  file(work, `${name}-failure-accessibility.txt`, snapshot),
                ),
            ]);
            result.diagnosticErrors = diagnostics
              .filter((item) => item.status === 'rejected')
              .map((item) => String(item.reason));
            report.diagnosticErrors.push(
              ...diagnostics
                .filter((item) => item.status === 'rejected')
                .map((item) => errorDetails(item.reason)),
            );
          }
          failed = true;
        } finally {
          result.pageErrors = errors;
          try {
            await browser?.close();
            activeBrowser = undefined;
          } catch (error) {
            report.cleanupErrors.push(errorDetails(error));
            originalFailure ??= error;
            failed = true;
            result.status = 'fail';
          }
        }
        await evidenceRun.persist();
        if (activeBrowser) throw originalFailure;
      }
    }
    try {
      await withVerificationServer(
        {
          args: [
            'node_modules/vite/bin/vite.js',
            'preview',
            '--host',
            '127.0.0.1',
            '--port',
            '4323',
            '--strictPort',
          ],
          cwd: app,
          env,
          url,
          identity,
          signal: evidenceRun.signal,
        },
        verifyBrowsers,
      );
      report.server.status = 'stopped';
    } catch (error) {
      report.server.status = 'fail';
      originalFailure ??= error;
      report.server.error = String(error.stack ?? error);
      console.error(report.server.error);
      failed = true;
    }
    if (exact) {
      await artifact.verify();
      await verifyInstalledInventory(
        join(app, 'node_modules', pkg.name),
        artifact.files,
      );
    }
    if (failed) throw originalFailure;
    assert.ok(
      report.browsers.every((item) => item.status === 'pass'),
      'All requested engines must execute',
    );
  },
  async () => {
    const integrity = await Promise.allSettled([
      exact && artifact ? artifact.verify() : Promise.resolve(),
    ]);
    const cleanup = await Promise.allSettled([
      activeBrowser?.close(),
      scratch && !report.preparedFixture
        ? rm(scratch, { recursive: true, force: true })
        : Promise.resolve(),
    ]);
    const errors = [...integrity, ...cleanup]
      .filter((item) => item.status === 'rejected')
      .map((item) => item.reason);
    if (errors.length)
      throw new AggregateError(errors, 'Browser smoke cleanup failed');
  },
);
console.log(JSON.stringify(report, null, 2));
