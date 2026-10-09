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
const sample = `import { LineChart } from 'react-simple-charts';
const data = [{quarter:'Q1',value:12},{quarter:'Q2',value:24},{quarter:'Q3',value:18},{quarter:'Q4',value:32}];
export default function Sample() {return <main><h1>Packaged public LineChart</h1>
<section id="explicit"><LineChart data={data} xKey="quarter" yKey="value" width={640} accessibility={{label:'Explicit',description:'Quarterly values',dataTable:'visible'}} /></section>
<section id="responsive" style={{width:'80%','--rsc-series-color':'#086b62'} as import('react').CSSProperties}><LineChart data={data} xKey="quarter" yKey="value" accessibility={{label:'Responsive'}} /></section>
<section id="independent" style={{width:320}}><LineChart data={data} xKey="quarter" yKey="value" accessibility={{label:'Independent'}} /></section>
<section id="local-time"><LineChart width={640} data={[{date:new Date('2026-03-07T00:00:00Z'),value:2}]} xScale="time" xKey="date" yKey="value" accessibility={{label:'Local time'}}/></section><Interactive/></main>;}
import Interactive from './Interactive';`;
const interactive = `'use client';
import {useState} from 'react'; import {LineChart} from 'react-simple-charts';
export default function Interactive(){const [result,setResult]=useState(''); const [count,setCount]=useState(0);return <section id="interactive"><LineChart width={640} data={[{x:'A',y:1},{x:'A',y:2}]} xKey="x" yKey="y" onDataActivate={p=>{setCount(n=>n+1);setResult(p.index+':'+p.inputMethod);}} accessibility={{label:'Interactive'}}/><output>{result}:{count}</output></section>;}`;
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
    let before;
    let responsiveBefore;
    if (kind === 'next') {
      const staticPage = await browser.newPage({ javaScriptEnabled: false });
      await staticPage.goto(url);
      responsiveBefore = await staticPage.locator('#responsive').innerHTML();
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
      assert.equal(await staticPage.getByRole('table').count(), 5);
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
    assert.equal(await page.getByRole('table').count(), 5);
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
    await file(
      dir,
      'evidence/hydrated-before-measurement.html',
      await page.locator('main').innerHTML(),
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
    await page.locator('#interactive [role=button]').first().focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('output').textContent(), '1:keyboard:1');
    await page.locator('#interactive [role=button]').first().click();
    assert.equal(await page.locator('output').textContent(), '0:pointer:2');
    await page
      .locator('#interactive [role=button]')
      .last()
      .scrollIntoViewIfNeeded();
    const hit = await page
      .locator('#interactive [role=button]')
      .last()
      .boundingBox();
    assert(hit);
    await page.touchscreen.tap(hit.x + hit.width / 2, hit.y + hit.height / 2);
    await page.waitForFunction(
      () => document.querySelector('output')?.textContent === '1:touch:3',
    );
    assert.equal(await page.locator('output').textContent(), '1:touch:3');
    assert.equal(await page.getByRole('tooltip').count(), 1);
    await page.getByRole('button', { name: 'Dismiss inspection' }).click();
    assert.equal(await page.getByRole('tooltip').count(), 0);
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
      assert.equal(await page.getByRole('table').count(), 5);
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
assert.deepEqual(Object.keys(api), ['LineChart']); assert.equal(typeof api.LineChart,'function');
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
          `import {createElement} from 'react';
import {renderToString} from 'react-dom/server';
import {LineChart} from 'react-simple-charts';
import {writeFileSync} from 'node:fs';
const parts=['alpha-','beta-'].map((prefix,i)=>'<div id="root'+i+'">'+renderToString(createElement(LineChart,{width:640,data:[{x:'A',y:1}],xKey:'x',yKey:'y'}),{identifierPrefix:prefix})+'</div>');
writeFileSync('roots.html','<!doctype html><html lang="en"><head><title>Separate roots</title><link rel="icon" href="data:,"></head><body>'+parts.join('')+'<script type="module" src="/roots.tsx"></script></body></html>');`,
        );
        await run('node', ['roots-server.mjs'], dir);
        await file(
          dir,
          'roots.tsx',
          `import {hydrateRoot} from 'react-dom/client';
import {LineChart} from 'react-simple-charts';
['alpha-','beta-'].forEach((identifierPrefix,i)=>hydrateRoot(document.getElementById('root'+i)!,<LineChart width={640} data={[{x:'A',y:1}]} xKey="x" yKey="y"/>,{identifierPrefix,onRecoverableError: error=>console.error(error)}));`,
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
