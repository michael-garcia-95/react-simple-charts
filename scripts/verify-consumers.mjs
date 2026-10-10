// Optional release gate: disposable packages and independent applications only.
/* global document, window, getComputedStyle */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import {
  cp,
  mkdir,
  readFile,
  writeFile,
  readdir,
  stat,
  rm,
} from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve, join } from 'node:path';
import { gzipSync } from 'node:zlib';

const root = resolve(import.meta.dirname, '..');
const work = join(root, 'work/consumers');
const env = {
  ...process.env,
  npm_config_cache: join(work, 'npm-cache'),
  NEXT_TELEMETRY_DISABLED: '1',
};
async function run(cmd, args, cwd = root) {
  console.log(cwd, cmd, ...args);
  const child = spawn(cmd, args, { cwd, env, stdio: 'inherit' });
  await new Promise((res, rej) => {
    child.on('error', rej);
    child.on('exit', (code) =>
      code === 0 ? res() : rej(new Error(`${cmd} exited ${code}`)),
    );
  });
}
async function file(dir, name, content) {
  const path = join(dir, name);
  await mkdir(resolve(path, '..'), { recursive: true });
  await writeFile(path, content);
}
async function json(dir, name, value) {
  await file(dir, name, JSON.stringify(value, null, 2));
}
async function pack(dir) {
  await run('npm', ['pack', '--pack-destination', work], dir);
  const p = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8'));
  return join(work, `${p.name}-${p.version}.tgz`);
}
const report = {
  node: process.version,
  versions: [],
  artifacts: {},
  checks: [],
};
await mkdir(work, { recursive: true });
const genuine = await pack(root);
const js = await readFile(join(root, 'dist/index.js'));
assert(js.toString().startsWith('"use client";'));
assert(!/react.production|react.development|\.css["']/.test(js.toString()));
report.artifacts.genuine = {
  tarballBytes: (await stat(genuine)).size,
  esmBytes: js.length,
  esmGzipBytes: gzipSync(js).length,
};
const driver = join(work, 'driver');
await json(driver, 'package.json', {
  private: true,
  type: 'module',
  dependencies: {
    'playwright-core': '1.64.0',
    '@axe-core/playwright': '4.13.0',
  },
});
await run('npm', ['install', '--no-audit', '--no-fund'], driver);
const require = createRequire(join(driver, 'package.json'));
const { chromium } = require('playwright-core');
const { default: AxeBuilder } = require('@axe-core/playwright');
const browser = await chromium.launch({
  executablePath: process.env.RSC_BROWSER_PATH ?? '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox'],
});
report.browser = browser.version();
const sample = `import { LineChart, AreaChart, BarChart, PieChart } from 'react-simple-charts';
const data = [{quarter:'Q1',value:12},{quarter:'Q2',value:24},{quarter:'Q3',value:18},{quarter:'Q4',value:32}];
export default function Sample() {return <main><h1>Packaged public LineChart</h1>
<section id="explicit"><LineChart data={data} xKey="quarter" yKey="value" width={640} accessibility={{label:'Explicit',description:'Quarterly values',dataTable:'visible'}} /></section>
<section id="responsive" style={{width:'80%','--rsc-series-color':'#086b62'} as import('react').CSSProperties}><LineChart data={data} xKey="quarter" yKey="value" accessibility={{label:'Responsive'}} /></section>
<section id="independent" style={{width:320}}><LineChart data={data} xKey="quarter" yKey="value" accessibility={{label:'Independent'}} /></section>
<section id="local-time"><LineChart width={640} data={[{date:new Date('2026-03-07T00:00:00Z'),value:2}]} xScale="time" xKey="date" yKey="value" accessibility={{label:'Local time'}}/></section>
<section id="area-explicit"><AreaChart data={data} xKey="quarter" yKey="value" width={640} accessibility={{label:'Positive Area',dataTable:'visible'}} /></section>
<section id="area-negative"><AreaChart data={[{x:'A',y:-2},{x:'B',y:-5},{x:'C',y:-1}]} xKey="x" yKey="y" width={640} accessibility={{label:'Negative Area'}} /></section>
<section id="area-mixed"><AreaChart data={[{x:'A',y:-2},{x:'B',y:5},{x:'C',y:-1}]} xKey="x" yKey="y" width={640} yAxis={{min:-3,max:3}} accessibility={{label:'Mixed clipped Area'}} /></section>
<section id="area-gaps"><AreaChart data={[{x:'A',a:1,b:-1},{x:'A',a:2,b:-2},{x:'C',a:null,b:-3},{x:'D',a:4,b:null}]} xKey="x" series={[{key:'a',color:'#2563eb'},{key:'b',color:'#0d9488'}]} width={640} accessibility={{label:'Independent Area gaps'}} /></section>
<section id="area-responsive"><AreaChart data={data} xKey="quarter" yKey="value" accessibility={{label:'Responsive Area'}} /></section>
<section id="area-time"><AreaChart data={[{x:new Date('2026-01-01'),y:1}]} xKey="x" xScale="time" yKey="y" width={640} accessibility={{label:'Local time Area'}} /></section>
<section id="bar-vertical"><BarChart width={640} data={[{x:'A',a:-2,b:2},{x:'A',a:3,b:-3},{x:'C',a:0,b:null}]} xKey="x" series={[{key:'a'},{key:'b'}]} accessibility={{label:'Vertical Bar',dataTable:'visible'}} /></section>
<section id="bar-horizontal"><BarChart width={640} orientation="horizontal" data={[{x:'A',a:-2,b:2},{x:'A',a:3,b:-3},{x:'C',a:0,b:null}]} xKey="x" series={[{key:'a'},{key:'b'}]} tooltip={{mode:'shared'}} accessibility={{label:'Horizontal Bar'}} /></section>
<section id="bar-clipped"><BarChart width={640} data={[{x:'A',a:5,b:-1},{x:'B',a:-5,b:null}]} xKey="x" series={[{key:'a'},{key:'b'}]} yAxis={{min:0,max:4}} accessibility={{label:'Clipped Bar'}} /></section>
<section id="bar-responsive"><BarChart data={data} xKey="quarter" yKey="value" accessibility={{label:'Responsive Bar'}} /></section>
<section id="pie-explicit"><PieChart width={480} data={[{name:'Same',value:1},{name:'Zero',value:0},{name:'Missing',value:null},{name:'Same',value:3}]} nameKey="name" valueKey="value" showLabels accessibility={{label:'Explicit Pie',dataTable:'visible'}}/></section>
<section id="pie-single"><PieChart width={480} data={[{name:'Complete',value:1}]} nameKey="name" valueKey="value" accessibility={{label:'Single Pie'}}/></section>
<section id="pie-negative"><PieChart width={480} data={[{name:'Positive',value:1},{name:'Negative',value:-2}]} nameKey="name" valueKey="value" accessibility={{label:'Unavailable Pie',dataTable:'visible'}}/></section>
<section id="pie-responsive" style={{width:'80%'}}><PieChart data={data} nameKey="quarter" valueKey="value" accessibility={{label:'Responsive Pie'}}/></section>
<Interactive/></main>;}
import Interactive from './Interactive';`;
const interactive = `'use client';
import {useState} from 'react'; import {LineChart, AreaChart, BarChart, PieChart} from 'react-simple-charts';
function Inspection({area=false}:{area?:boolean}){const Chart=area?AreaChart:LineChart;const [result,setResult]=useState(''); const [count,setCount]=useState(0);return <section id={area?'area-interactive':'interactive'}><Chart width={640} data={[{x:'A',y:1},{x:'A',y:2}]} xKey="x" yKey="y" onDataActivate={p=>{setCount(n=>n+1);setResult(p.index+':'+p.inputMethod);}} accessibility={{label:area?'Interactive Area':'Interactive'}}/><output>{result}:{count}</output></section>;}
const pieData=[{name:'Same',value:1},{name:'Same',value:1}];
function PieInspection(){const [result,setResult]=useState('');const [count,setCount]=useState(0);return <section id="pie-interactive"><PieChart width={480} data={pieData} nameKey="name" valueKey="value" onDataActivate={p=>{setCount(n=>n+1);setResult(p.index+':'+p.inputMethod);}} accessibility={{label:'Interactive Pie'}}/><output>{result}:{count}</output></section>;}
function BarInspection({horizontal=false}:{horizontal?:boolean}){const [result,setResult]=useState('');const [count,setCount]=useState(0);return <section id={horizontal?'bar-horizontal-interactive':'bar-interactive'}><BarChart width={640} orientation={horizontal?'horizontal':'vertical'} data={[{x:'A',y:-2},{x:'A',y:0}]} xKey="x" yKey="y" onDataActivate={p=>{setCount(n=>n+1);setResult(p.index+':'+p.inputMethod);}} accessibility={{label:'Interactive Bar'}}/><output>{result}:{count}</output></section>;}
export default function Interactive(){return <><Inspection/><Inspection area/><BarInspection/><BarInspection horizontal/><PieInspection/><Narrow/></>;}
function Narrow(){const [state,setState]=useState('ready');const data=state==='empty'?[]:[{x:state==='replacement'?'Replacement':'NorthAmericaEnterpriseSubscriptions',y:-2},{x:'Repeated',y:0}];return <section id="integrated-narrow"><button onClick={()=>setState('empty')}>Empty integrated charts</button><button onClick={()=>setState('replacement')}>Replace integrated data</button>{[LineChart,AreaChart,BarChart].map((Chart,i)=><div key={i} data-narrow={i} style={{width:320}}><Chart data={data} xKey="x" yKey="y" height={state==='unusable'?0:280} accessibility={{label:'Narrow '+i,dataTable:'visible'}}/></div>)}<button onClick={()=>setState('unusable')}>Unusable integrated charts</button></section>;}`;
const tsconfig = {
  compilerOptions: {
    target: 'ES2022',
    lib: ['DOM', 'ES2022'],
    module: 'ESNext',
    moduleResolution: 'Bundler',
    jsx: 'react-jsx',
    strict: true,
    noEmit: true,
    skipLibCheck: false,
    esModuleInterop: true,
    types: ['node'],
  },
  include: ['**/*.ts', '**/*.tsx'],
  exclude: ['node_modules'],
};
async function start(dir, kind, port, major) {
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
  const child = spawn(
    process.execPath,
    [
      join(
        dir,
        'node_modules',
        kind === 'vite' ? 'vite/bin/vite.js' : 'next/dist/bin/next',
      ),
      ...args.slice(1),
    ],
    { cwd: dir, env, stdio: 'inherit' },
  );
  try {
    const url = `http://127.0.0.1:${port}`;
    let response;
    for (let i = 0; i < 120; i++) {
      try {
        response = await fetch(url);
        if (response.ok) break;
      } catch {
        /* server starting */
      }
      await new Promise((res) => setTimeout(res, 250));
    }
    assert(response?.ok, 'Production server startup');
    const html = await response.text();
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
    let pieBefore;
    let pieResponsiveBefore;
    let barBefore;
    let barResponsiveBefore;
    let before;
    let responsiveBefore;
    let areaBefore;
    let areaResponsiveBefore;
    if (kind === 'next') {
      const staticPage = await browser.newPage({ javaScriptEnabled: false });
      await staticPage.goto(url);
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
      assert.equal(await staticPage.getByRole('table').count(), 26);
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
    assert.equal(await page.getByRole('table').count(), 26);
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
    ]) {
      await page.locator(`${section} [role=button]`).first().focus();
      if (section === '#pie-interactive') {
        await page.locator(`${section} [role=button]`).last().hover();
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
      await page.locator(`${section} [role=button]`).first().click();
      assert.equal(
        await page.locator(`${section} output`).textContent(),
        '0:pointer:2',
      );
      await page
        .locator(`${section} [role=button]`)
        .last()
        .scrollIntoViewIfNeeded();
      const hit = await page
        .locator(`${section} [role=button]`)
        .last()
        .boundingBox();
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
      await page.locator(`${section} [role=button]`).first().click();
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
      path: join(dir, 'evidence/pie-focus.png'),
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
      await page
        .locator(`#${section}`)
        .screenshot({ path: join(dir, `evidence/${section}.png`) });
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
      path: join(dir, 'evidence/after.png'),
      fullPage: true,
    });
    assert.deepEqual(errors, []);
    if (kind === 'next') {
      await page.goto(`${url}/pages-check`);
      await page.waitForFunction(() => window.__observers.length >= 2);
      await page.evaluate(() => window.__release());
      await page.locator('#responsive svg').waitFor();
      assert.equal(await page.getByRole('table').count(), 26);
      assert.deepEqual(errors, []);
    } else {
      await page.evaluate(() => window.__unmount());
      assert(
        await page.evaluate(() =>
          window.__observers.every((o) => o.disconnected),
        ),
      );
      assert.equal(await page.locator('figure').count(), 0);
      const staticRoots = await browser.newPage({ javaScriptEnabled: false });
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
      assert.equal(await page.locator('table').count(), 5);
      await page.evaluate(() => window.__release());
      await page.locator('#root4 svg').waitFor();
      assert.equal(await page.locator('svg').count(), 5);
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
    });
  } finally {
    child.kill();
  }
}
try {
  for (const [major, react, types, domTypes, next] of [
    [18, '18.2.0', '18.3.31', '18.3.7', '14.2.35'],
    [19, '19.3.0', '19.3.0', '19.3.0', '16.4.0'],
  ]) {
    for (const kind of ['vite', 'next']) {
      const dir = join(work, `${kind}-${major}`);
      // Same-version tarballs must never reuse a prior installation/lockfile.
      await rm(dir, { recursive: true, force: true });
      const compiler = kind === 'next' && major === 18 ? '5.4.5' : '6.0.3';
      const nodeTypes = kind === 'next' && major === 18 ? '20.19.0' : '24.19.1';
      const deps = {
        react,
        'react-dom': react,
        '@types/react': types,
        '@types/react-dom': domTypes,
        '@types/node': nodeTypes,
        typescript: compiler,
        'react-simple-charts': `file:${genuine}`,
        ...(kind === 'vite' ? { vite: '8.3.4' } : { next }),
      };
      await json(dir, 'package.json', {
        name: `consumer-${kind}-${major}`,
        private: true,
        type: 'module',
        dependencies: deps,
      });
      await json(dir, 'tsconfig.json', {
        ...tsconfig,
        compilerOptions: {
          ...tsconfig.compilerOptions,
          skipLibCheck: kind === 'next',
        },
      });
      await json(dir, 'tsconfig.package.json', {
        compilerOptions: tsconfig.compilerOptions,
        files: ['contracts.tsx', 'Sample.tsx', 'Interactive.tsx'],
      });
      await file(dir, 'Sample.tsx', sample);
      await file(dir, 'Interactive.tsx', interactive);
      await cp(
        join(root, 'tests/types/contracts.tsx'),
        join(dir, 'contracts.tsx'),
      );
      await file(
        dir,
        'package-check.mjs',
        `import assert from 'node:assert/strict';
import * as api from 'react-simple-charts';
import {readFileSync} from 'node:fs';
assert.deepEqual(Object.keys(api).sort(), ['AreaChart','BarChart','LineChart','PieChart']); assert.equal(typeof api.LineChart,'function'); assert.equal(typeof api.AreaChart,'function'); assert.equal(typeof api.BarChart,'function'); assert.equal(typeof api.PieChart,'function');
const p=JSON.parse(readFileSync('node_modules/react-simple-charts/package.json'));
assert.equal(p.private,true); assert.deepEqual(Object.keys(p.exports),['.']);
assert(p.peerDependencies.react && p.peerDependencies['react-dom']);
for(const path of ['src/internal/RenderingProbe','dist/index.js','internal']) { await assert.rejects(import('react-simple-charts/'+path), {code:'ERR_PACKAGE_PATH_NOT_EXPORTED'}); }
`,
      );
      if (kind === 'vite') {
        await file(
          dir,
          'index.html',
          '<!doctype html><html lang="en"><head><title>Consumer proof</title><link rel="icon" href="data:,"></head><body><div id="root"></div><script type="module" src="/main.tsx"></script></body></html>',
        );
        await file(
          dir,
          'main.tsx',
          `import {createRoot} from 'react-dom/client'; import Sample from './Sample'; const root=createRoot(document.getElementById('root')!); root.render(<Sample/>); (window as unknown as {__unmount:()=>void}).__unmount=()=>root.unmount();`,
        );
        await file(
          dir,
          'vite.config.ts',
          `import {defineConfig} from 'vite'; export default defineConfig({build:{sourcemap:true}});`,
        );
      } else {
        await file(
          dir,
          'app/page.tsx',
          `export const dynamic = 'force-dynamic'; export {default} from '../Sample';`,
        );
        await file(
          dir,
          'app/layout.tsx',
          `export default function Layout({children}:{children:import('react').ReactNode}) {return <html lang="en"><head><title>Consumer proof</title><link rel="icon" href="data:,"/></head><body>{children}</body></html>}`,
        );
        await file(
          dir,
          'pages/pages-check.tsx',
          `import Head from 'next/head'; import Sample from '../Sample'; export default function Page() {return <><Head><title>Pages consumer proof</title><link rel="icon" href="data:,"/></Head><Sample/></>} export async function getServerSideProps() { return {props:{}}; }`,
        );
        await file(
          dir,
          'next.config.mjs',
          `export default {outputFileTracingRoot:process.cwd(),experimental:{cpus:2}};`,
        );
      }
      await run('npm', ['install', '--no-audit', '--no-fund'], dir);
      assert.deepEqual(
        await readFile(
          join(dir, 'node_modules/react-simple-charts/dist/index.js'),
        ),
        js,
        'Installed genuine ESM must match the packed build',
      );
      await run('node', ['package-check.mjs'], dir);
      await run('npm', ['ls', 'react', 'react-dom'], dir);
      if (kind === 'vite') {
        await file(
          dir,
          'roots-server.mjs',
          `import {createElement,StrictMode} from 'react';
import {renderToString} from 'react-dom/server';
import {LineChart,AreaChart,BarChart,PieChart} from 'react-simple-charts';
import {writeFileSync} from 'node:fs';
const parts=['alpha-','beta-','gamma-','pie-explicit-','pie-responsive-'].map((prefix,i)=>'<div id="root'+i+'">'+renderToString(createElement(StrictMode,null,createElement([LineChart,AreaChart,BarChart,PieChart,PieChart][i],{...(i===4?{}:{width:640}),data:[{x:new Date('2026-01-01T00:00:00Z'),y:1}],...(i<3?{xKey:'x',yKey:'y'}:{nameKey:'x',valueKey:'y'})})),{identifierPrefix:prefix})+'</div>');
writeFileSync('roots.html','<!doctype html><html lang="en"><head><title>Separate roots</title><link rel="icon" href="data:,"></head><body>'+parts.join('')+'<script type="module" src="/roots.tsx"></script></body></html>');`,
        );
        await run('node', ['roots-server.mjs'], dir);
        await file(
          dir,
          'roots.tsx',
          `import {StrictMode} from 'react'; import {hydrateRoot} from 'react-dom/client';
import {LineChart,AreaChart,BarChart,PieChart} from 'react-simple-charts';
['alpha-','beta-','gamma-','pie-explicit-','pie-responsive-'].forEach((identifierPrefix,i)=>{const Chart=[LineChart,AreaChart,BarChart][i];hydrateRoot(document.getElementById('root'+i)!,<StrictMode>{i<3 && Chart ? <Chart width={640} data={[{x:new Date('2026-01-01T00:00:00Z'),y:1}]} xKey="x" yKey="y"/> : <PieChart {...(i===4?{}:{width:640})} data={[{x:new Date('2026-01-01T00:00:00Z'),y:1}]} nameKey="x" valueKey="y"/>}</StrictMode>,{identifierPrefix,onRecoverableError: error=>console.error(error)});});`,
        );
        await file(
          dir,
          'vite.config.ts',
          `import {defineConfig} from 'vite'; export default defineConfig({build:{sourcemap:true,rolldownOptions:{input:['index.html','roots.html']}}});`,
        );
      }

      await run(
        'node',
        [
          'node_modules/typescript/bin/tsc',
          '--project',
          'tsconfig.package.json',
        ],
        dir,
      );
      if (kind === 'vite')
        await run('node', ['node_modules/typescript/bin/tsc', '--noEmit'], dir);
      await run(
        'node',
        kind === 'vite'
          ? ['node_modules/vite/bin/vite.js', 'build']
          : [
              'node_modules/next/dist/bin/next',
              'build',
              ...(major === 19 ? ['--webpack'] : []),
            ],
        dir,
      );
      if (kind === 'next') {
        const clientManifest = await readFile(
          join(dir, '.next/server/app/page_client-reference-manifest.js'),
          'utf8',
        );
        assert(
          clientManifest.includes(
            'node_modules/react-simple-charts/dist/index.js',
          ),
        );
        // Next manifests register the package namespace (*), not export names.
        // The compiled Server Component must reference the named client export.
        const appServer = await readFile(
          join(dir, '.next/server/app/page.js'),
          'utf8',
        );
        assert(
          appServer.includes('dist/index.js#PieChart') ||
            /dist\/index\.js["'],["']PieChart/.test(appServer),
        );
        await file(
          dir,
          'evidence/client-reference-manifest.js',
          clientManifest,
        );
        let bytes = 0;
        let gzip = 0;
        async function measure(directory) {
          for (const entry of await readdir(directory, {
            withFileTypes: true,
          })) {
            const path = join(directory, entry.name);
            if (entry.isDirectory()) await measure(path);
            else if (entry.name.endsWith('.js')) {
              const data = await readFile(path);
              bytes += data.length;
              gzip += gzipSync(data).length;
              assert(!data.toString().includes('react.development.js'));
            }
          }
        }
        await measure(join(dir, '.next/static'));
        report.artifacts[`next${major}`] = {
          staticJsBytes: bytes,
          staticJsGzipBytes: gzip,
        };
      }
      report.versions.push({
        kind,
        react,
        types,
        domTypes,
        framework: kind === 'vite' ? '8.3.4' : next,
        typescript: compiler,
        nodeTypes,
      });
      if (kind === 'vite') {
        const assets = await readdir(join(dir, 'dist/assets'));
        let total = 0;
        let gzip = 0;
        const sources = [];
        for (const name of assets.filter((name) => name.endsWith('.js'))) {
          const js = await readFile(join(dir, 'dist/assets', name));
          total += js.length;
          gzip += gzipSync(js).length;
          const map = JSON.parse(
            await readFile(join(dir, 'dist/assets', `${name}.map`), 'utf8'),
          );
          sources.push(...map.sources);
        }
        report.artifacts[`vite${major}`] = { jsBytes: total, gzipBytes: gzip };
        await json(dir, 'evidence/bundle-sources.json', sources);
        assert(!sources.some((name) => /react\.development/.test(name)));
        assert(sources.some((name) => /react-simple-charts/.test(name)));
      }
      await start(dir, kind, major === 18 ? 4318 : 4319, major);
      await json(work, 'results.json', report);
    }
  }
} finally {
  await browser.close();
  await json(work, 'results.json', report);
}
console.log(JSON.stringify(report, null, 2));
