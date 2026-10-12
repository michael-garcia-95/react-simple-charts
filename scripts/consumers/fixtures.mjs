// Pinned compatibility matrix and generated application/type/SSR fixtures.
import { cp } from 'node:fs/promises';
import { join } from 'node:path';
import { fixtureMeta } from '../verification-server.mjs';

export const consumerConfigurations = Object.freeze(
  [
    [18, '18.2.0', '18.3.31', '18.3.7', '14.2.35'],
    [19, '19.3.0', '19.3.0', '19.3.0', '16.4.0'],
  ].flatMap(([major, react, types, domTypes, next]) =>
    ['vite', 'next'].map((kind) =>
      Object.freeze({
        kind,
        major,
        react,
        types,
        domTypes,
        next,
        compiler: kind === 'next' && major === 18 ? '5.4.5' : '6.0.3',
        nodeTypes: kind === 'next' && major === 18 ? '20.19.0' : '24.19.1',
        framework: kind === 'vite' ? '8.3.4' : next,
        port: major === 18 ? 4318 : 4319,
      }),
    ),
  ),
);

export async function createConsumerFixture({
  root,
  dir,
  pkg,
  genuine,
  identity,
  configuration,
  file,
  json,
}) {
  const { kind, major, react, types, domTypes, next, compiler, nodeTypes } =
    configuration;
  const packageName = pkg.name;
  const sample = `import { LineChart, AreaChart, BarChart, PieChart, DonutChart } from '${packageName}';
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
<section id="donut-explicit"><DonutChart width={480} data={[{name:'Same',value:1},{name:'Zero',value:0},{name:'Missing',value:null},{name:'Same',value:3}]} nameKey="name" valueKey="value" centerContent={<span>Allocation</span>} showLabels accessibility={{label:'Explicit Donut',dataTable:'visible'}}/></section>
<SingleDonutInspection/>
<section id="donut-negative"><DonutChart width={480} data={[{name:'Negative',value:-2}]} nameKey="name" valueKey="value" centerContent="Must not appear" accessibility={{label:'Unavailable Donut',dataTable:'visible'}}/></section>
<section id="donut-responsive" style={{width:'80%'}}><DonutChart data={data} nameKey="quarter" valueKey="value" innerRadiusRatio={0.4} centerContent={<strong>Responsive allocation</strong>} accessibility={{label:'Responsive Donut'}}/></section>
<Interactive/></main>;}
import Interactive, {SingleDonutInspection} from './Interactive';`;
  const interactive = `'use client';
import {useState} from 'react'; import {LineChart, AreaChart, BarChart, PieChart, DonutChart} from '${packageName}';
function Inspection({area=false}:{area?:boolean}){const Chart=area?AreaChart:LineChart;const [result,setResult]=useState(''); const [count,setCount]=useState(0);return <section id={area?'area-interactive':'interactive'}><Chart width={640} data={[{x:'A',y:1},{x:'A',y:2}]} xKey="x" yKey="y" onDataActivate={p=>{setCount(n=>n+1);setResult(p.index+':'+p.inputMethod);}} accessibility={{label:area?'Interactive Area':'Interactive'}}/><output>{result}:{count}</output></section>;}
const pieData=[{name:'Same',value:1},{name:'Same',value:1}];
function PieInspection(){const [result,setResult]=useState('');const [count,setCount]=useState(0);return <section id="pie-interactive"><PieChart width={480} data={pieData} nameKey="name" valueKey="value" onDataActivate={p=>{setCount(n=>n+1);setResult(p.index+':'+p.inputMethod);}} accessibility={{label:'Interactive Pie'}}/><output>{result}:{count}</output></section>;}
const singleDonutData=[{name:'Complete',value:1}];
export function SingleDonutInspection(){const [result,setResult]=useState('None');const [count,setCount]=useState(0);return <section id="donut-single"><DonutChart width={480} data={singleDonutData} nameKey="name" valueKey="value" innerRadiusRatio={0.8} centerContent={0} onDataActivate={p=>{setResult(p.index+':'+p.label+':'+p.value+':'+p.inputMethod);setCount(n=>n+1);}} accessibility={{label:'Single Donut'}}/><output aria-label="Single Donut activation">{result}:{count}</output></section>;}
function DonutInspection(){const [result,setResult]=useState('');const [count,setCount]=useState(0);const [center,setCenter]=useState(0);return <section id="donut-interactive"><DonutChart width={480} data={pieData} nameKey="name" valueKey="value" centerContent={<button onClick={()=>setCenter(n=>n+1)}>Details {center}</button>} onDataActivate={p=>{setCount(n=>n+1);setResult(p.index+':'+p.inputMethod);}} accessibility={{label:'Interactive Donut'}}/><output>{result}:{count}</output></section>;}
function BarInspection({horizontal=false}:{horizontal?:boolean}){const [result,setResult]=useState('');const [count,setCount]=useState(0);return <section id={horizontal?'bar-horizontal-interactive':'bar-interactive'}><BarChart width={640} orientation={horizontal?'horizontal':'vertical'} data={[{x:'A',y:-2},{x:'A',y:0}]} xKey="x" yKey="y" onDataActivate={p=>{setCount(n=>n+1);setResult(p.index+':'+p.inputMethod);}} accessibility={{label:'Interactive Bar'}}/><output>{result}:{count}</output></section>;}
export default function Interactive(){return <><Inspection/><Inspection area/><BarInspection/><BarInspection horizontal/><PieInspection/><DonutInspection/><Narrow/></>;}
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
  const deps = {
    react,
    'react-dom': react,
    '@types/react': types,
    '@types/react-dom': domTypes,
    '@types/node': nodeTypes,
    typescript: compiler,
    [packageName]: `file:${genuine}`,
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
  await cp(join(root, 'tests/types/contracts.tsx'), join(dir, 'contracts.tsx'));
  await file(
    dir,
    'package-check.mjs',
    `import assert from 'node:assert/strict';
import * as api from '${packageName}';
import {readFileSync} from 'node:fs';
assert.deepEqual(Object.keys(api).sort(), ['AreaChart','BarChart','DonutChart','LineChart','PieChart']); assert.equal(typeof api.LineChart,'function'); assert.equal(typeof api.AreaChart,'function'); assert.equal(typeof api.BarChart,'function'); assert.equal(typeof api.PieChart,'function'); assert.equal(typeof api.DonutChart,'function');
const p=JSON.parse(readFileSync('node_modules/${packageName}/package.json'));
assert.equal(p.name,${JSON.stringify(packageName)}); assert.equal(p.version,${JSON.stringify(pkg.version)}); assert.equal(p.private,true); assert.deepEqual(Object.keys(p.exports),['.']);
assert(p.peerDependencies.react && p.peerDependencies['react-dom']);
for(const path of ['src/internal/RenderingProbe','dist/index.js','internal']) { await assert.rejects(import('${packageName}/'+path), {code:'ERR_PACKAGE_PATH_NOT_EXPORTED'}); }
`,
  );
  if (kind === 'vite') {
    await file(
      dir,
      'index.html',
      `<!doctype html><html lang="en"><head>${fixtureMeta(identity)}<title>Consumer proof</title><link rel="icon" href="data:,"></head><body><div id="root"></div><script type="module" src="/main.tsx"></script></body></html>`,
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
      `export default function Layout({children}:{children:import('react').ReactNode}) {return <html lang="en"><head><meta name="rsc-verification" content="${identity}"/><title>Consumer proof</title><link rel="icon" href="data:,"/></head><body>{children}</body></html>}`,
    );
    await file(
      dir,
      'pages/pages-check.tsx',
      `import Head from 'next/head'; import Sample from '../Sample'; export default function Page() {return <><Head><meta name="rsc-verification" content="${identity}"/><title>Pages consumer proof</title><link rel="icon" href="data:,"/></Head><Sample/></>} export async function getServerSideProps() { return {props:{}}; }`,
    );
    await file(
      dir,
      'next.config.mjs',
      `export default {outputFileTracingRoot:process.cwd(),experimental:{cpus:2}};`,
    );
  }
}

export async function prepareIndependentRoots({
  dir,
  kind,
  packageName,
  file,
  run,
}) {
  if (kind === 'vite') {
    await file(
      dir,
      'roots-server.mjs',
      `import {createElement,StrictMode} from 'react';
import {renderToString} from 'react-dom/server';
import {LineChart,AreaChart,BarChart,PieChart,DonutChart} from '${packageName}';
import {writeFileSync} from 'node:fs';
const parts=['alpha-','beta-','gamma-','pie-explicit-','pie-responsive-','donut-explicit-','donut-responsive-'].map((prefix,i)=>'<div id="root'+i+'">'+renderToString(createElement(StrictMode,null,createElement([LineChart,AreaChart,BarChart,PieChart,PieChart,DonutChart,DonutChart][i],{...([4,6].includes(i)?{}:{width:640}),...(i>=5?{centerContent:createElement("span",null,"Allocation")}: {}),data:[{x:new Date('2026-01-01T00:00:00Z'),y:1}],...(i<3?{xKey:'x',yKey:'y'}:{nameKey:'x',valueKey:'y'})})),{identifierPrefix:prefix})+'</div>');
writeFileSync('roots.html','<!doctype html><html lang="en"><head><title>Separate roots</title><link rel="icon" href="data:,"></head><body>'+parts.join('')+'<script type="module" src="/roots.tsx"></script></body></html>');`,
    );
    await run('node', ['roots-server.mjs'], dir);
    await file(
      dir,
      'roots.tsx',
      `import {StrictMode} from 'react'; import {hydrateRoot} from 'react-dom/client';
import {LineChart,AreaChart,BarChart,PieChart,DonutChart} from '${packageName}';
['alpha-','beta-','gamma-','pie-explicit-','pie-responsive-','donut-explicit-','donut-responsive-'].forEach((identifierPrefix,i)=>{const Chart=[LineChart,AreaChart,BarChart][i];hydrateRoot(document.getElementById('root'+i)!,<StrictMode>{i<3 && Chart ? <Chart width={640} data={[{x:new Date('2026-01-01T00:00:00Z'),y:1}]} xKey="x" yKey="y"/> : i>=5 ? <DonutChart {...(i===6?{}:{width:640})} centerContent={<span>Allocation</span>} data={[{x:new Date('2026-01-01T00:00:00Z'),y:1}]} nameKey="x" valueKey="y"/> : <PieChart {...(i===4?{}:{width:640})} data={[{x:new Date('2026-01-01T00:00:00Z'),y:1}]} nameKey="x" valueKey="y"/>}</StrictMode>,{identifierPrefix,onRecoverableError: error=>console.error(error)});});`,
    );
    await file(
      dir,
      'vite.config.ts',
      `import {defineConfig} from 'vite'; export default defineConfig({build:{sourcemap:true,rolldownOptions:{input:['index.html','roots.html']}}});`,
    );
  }
}
