# Packaged consumer integration — M01-T04

The genuine public package exports TypeScript contracts only. It has **no public
chart components**. The rendering results below concern a separately named,
disposable architecture fixture; they do not establish a final public runtime API.

## Package boundaries and test strategy

`scripts/verify-consumers.mjs` runs `npm pack` against the genuine repository.
Its prepack hook invokes the production tsdown configuration. Each independent
consumer installs that tarball with a `file:/absolute/path/package.tgz` dependency.
This is an archive installation, not a workspace link, source alias, or source
import. Node imports the installed root and asserts an empty runtime namespace;
it rejects source, dist, and internal subpaths with `ERR_PACKAGE_PATH_NOT_EXPORTED`.
The installed manifest must remain private, with React/React DOM peers and only
one export (`.`). The full existing contracts suite is copied into each consumer
and compiled against its installed package. Generated declarations are checked
with `skipLibCheck: false`, independently of framework declarations.

For runtime tests, the runner copies `src`, the production `tsdown.config.ts`,
TypeScript configuration, license, and README into ignored `work/consumers/test-package`.
The copied lockfile keeps the production tool versions; only its root package
identity changes. The package is named `rsc-rendering-test-only@0.0.0-test-only`
and remains private. Its replacement root entry exports the internal
`RenderingProbe` and its props. That is the only build-input change; the tsdown
configuration is copied unchanged: ESM, ES2022, neutral platform, declarations,
sourcemaps, React/React DOM externalization, and client banner all match production.
The generated declaration is necessarily the probe contract rather than the
public type barrel. The genuine root exports and manifest are never modified.

This copy is packed separately, installed beside the genuine tarball, and excluded
from source control. It must never become the release artifact. The current
README inside the disposable archive comes from the genuine package and describes
the genuine API; its experimental name and this document identify its test purpose.
Testing it proves the packaging approach and rendering architecture, not that
LineChart or any other production chart can be imported.

## Tested versions

| Consumer | React / React DOM | Framework       | React / DOM types | TypeScript | Node types |
| -------- | ----------------- | --------------- | ----------------- | ---------- | ---------- |
| Vite 18  | 18.2.0            | Vite 8.3.4      | 18.3.31 / 18.3.7  | 6.0.3      | 24.19.1    |
| Vite 19  | 19.3.0            | Vite 8.3.4      | 19.3.0 / 19.3.0   | 6.0.3      | 24.19.1    |
| Next 14  | 18.2.0            | Next.js 14.2.35 | 18.3.31 / 18.3.7  | 5.4.5      | 20.19.0    |
| Next 16  | 19.3.0            | Next.js 16.4.0  | 19.3.0 / 19.3.0   | 6.0.3      | 24.19.1    |

Execution uses Node 24.19.0, npm 11.9.0, tsdown 0.23.0, Playwright Core 1.64.0,
axe Playwright 4.13.0, and real Chromium 151.0.7922.173. All selected npm
framework/runtime versions are stable releases. Next controls its own vendored
App Router React implementation; the consumer's installed React peer version is
not a promise about every framework-internal renderer. Node 22 remains covered
by the unchanged foundation CI matrix, not by these local framework executions.

Next 14 initially failed with TypeScript 6/Node 24 definitions: its compiled
`Headers` adapter returns `IterableIterator`, whereas modern DOM headers expect
an iterator with `Symbol.dispose`. The selected older compiler/type combination
avoids that error. A second attempt exposed Next 14's App/Pages navigation
augmentation exported-overload conflict when all framework declarations were
checked. The Next application uses the framework's usual `skipLibCheck: true`;
a separate `tsconfig.package.json` includes only the contract suite and Sample
consumer, sets `skipLibCheck: false`, and checks the installed library declarations.
No library contract was changed, no SSR disabled, and no broad type assertion was
used to suppress a package defect. Compatibility with Next 14's entire declaration
surface under strict dependency checking remains a framework gap.

## SSR, client boundaries, and browser checks

The App Router page and Sample are Server Components. Sample imports the probe
from the installed test package root without a local `use client` wrapper.
The production banner makes that import a client boundary. Next builds and serves
its real SSR output on every request (`force-dynamic` for App Router,
`getServerSideProps` for Pages Router); no `transpilePackages`, dynamic import, source transpilation,
or client-only SSR workaround is configured. A Pages Router route exercises the
same installed component. Next 16 uses its supported Webpack production builder
(`next build --webpack`); Turbopack is not tested. The tracing root is explicitly the independent consumer directory, avoiding
Next inferring the repository root from an ancestor lockfile. Two build workers limit runner
resource usage; that setting does not alter module resolution or SSR behavior.

HTTP response HTML is saved before opening Chromium. A JavaScript-disabled
Chromium page verifies that explicit width 640 yields SVG with viewBox
`0 0 640 280`, accessible title/description references, and table markup.
Responsive server markup has no SVG, reserves 280px graphical height, and
contains the named placeholder and structured data table. Server rendering
therefore does not require browser layout or ResizeObserver.

The hydration page wraps native ResizeObserver solely to delay delivery. Native
measurements still supply every width. This exposes the initial hydrated DOM
before measurement: the explicit SVG's entire serialized structure must equal
the server DOM, and responsive placeholders and tables must remain present.
Releasing observations replaces placeholders with SVG. Shrinking the viewport
changes the 80%-width chart while a separately observed 320px container retains
its width. Tables remain available. All IDs are unique, and every label/description
reference resolves. Console and uncaught page errors fail the run, including
React hydration/recoverable errors reported by the framework.

Vite also tests unmount observer disconnection. A separate served `roots.html`
contains two `renderToString` roots, each hydrated with its matching distinct
`identifierPrefix` (`alpha-`, `beta-`). Initial body markup must remain identical,
IDs must be unique, and `onRecoverableError` explicitly reports failures.
No global ID registry is required. This is real Chromium hydration of React SSR,
separate from the Next framework checks and earlier jsdom tests.

## Accessibility and styling

Installed probe checks cover names/descriptions, column and row headers, visible
and clipped tables, native Tab focus with a 3px outline, and resolved CSS variable
series color. Chromium accessibility snapshots expose the visually hidden table
and Q4 row header. Focused axe checks include `main` and require zero violations.
No application stylesheet or mandatory package CSS import is supplied.
These checks do not certify complete WCAG 2.2 AA compliance.

Manual screen-reader table navigation/announcements, forced colors, browser zoom,
strict CSP, custom theme contrast, Firefox/WebKit, and aggressive host CSS remain
release risks. The fixture has no production interaction or tooltip behavior.
Inline styling needs explicit evaluation under the eventual consumer CSP policy.

## Artifact and bundle evidence

Measurements are bytes, with gzip calculated using Node's gzipSync. Tarball sizes
include metadata/docs and can change with README edits. The public JavaScript
entry is only a client directive and empty module; genuine type-only imports
are erased and contribute no chart runtime. Its approved d3 dependencies are
still installed transitively but are unused and absent from Vite bundle sources.
The temporary probe bundles no React implementation and needs no CSS file.

The runner records tarball, ESM and gzip sizes separately for the genuine and
test-only packages. Vite measurements sum all generated JavaScript assets for
both its main and separate-root test pages, including React and test application
code. They are total consumer sizes, **not isolated package contribution**.
Sourcemap source lists identify the installed probe and exclude development React
and d3 modules. `npm ls react react-dom` shows deduplicated installed peers.
Next naturally includes its own framework runtime; its client reference manifests
and server/client bundles must be interpreted in that context rather than treating
all repeated React strings across server and browser targets as duplicate runtimes.
No final production chart size is inferred from this experimental fixture.

## Reproduction and release gate

```sh
npm ci
# Install Chromium separately using your platform's supported mechanism.
# Driver and axe install automatically into ignored work/, not library dependencies.
RSC_BROWSER_PATH=/usr/bin/chromium node scripts/verify-consumers.mjs
```

Use a writable npm cache in restricted environments. The integration runner sets
its cache to `work/consumers/npm-cache`. It generates and installs four independent
applications, builds each, serves production HTTP, runs browser checks, and shuts
down servers/browser. Ports 4318 and 4319 must be available. To force a clean
repeat, remove only generated `work/consumers` first. Do not run simultaneous
copies. Each consumer uses its own node_modules and has no repository aliases.

Evidence lives under ignored `work/consumers/<consumer>/evidence`: HTTP response,
server DOM, hydrated pre-measurement DOM, measured DOM, screenshot, accessibility
snapshot, and Vite bundle source list. Separate-root evidence is saved for Vite.
`work/consumers/results.json` records completed checks and measurements; the runner
exits nonzero on failure. A missing browser or failed build is not silently skipped.
Consumer installation lockfiles are generated in ignored work; exact direct
versions are pinned, but future transitive dependency resolution can differ.

Underlying commands per consumer are `npm install --no-audit --no-fund`,
`node package-check.mjs`, `npm ls react react-dom`, and
`node node_modules/typescript/bin/tsc --project tsconfig.package.json`.
Vite also compiles its complete app with `tsc --noEmit`.
Vite uses `node node_modules/vite/bin/vite.js build` and `vite preview`.
Next uses `node node_modules/next/dist/bin/next build` (plus `--webpack` for 16),
then `next start`; the script includes all HTTP/Chromium assertions.

This heavier optional suite is a **release gate** for packaging/client-boundary
changes. It is deliberately separate from the Node 22/24 × React 18/19 CI matrix:
four framework installations, production builds, browser provisioning, and axe
would multiply costs in every matrix job. Permanent CI and library dependencies
are unchanged. Run the gate on a browser-capable release runner before accepting
future runtime packaging changes.

## Local outcomes

All four consumers passed installation, installed-root ESM/export checks,
full public contract compilation, production build, and Chromium smoke checks.
Both Next App and Pages routes passed; App routes additionally passed initial
SSR/hydration structural comparisons. Both Vite consumers passed two-root
hydration and observer unmount cleanup. Focused axe returned zero violations in
each main page. No console errors, page errors, unresolved ID references, duplicate
IDs, hydration errors, or duplicate-instance failures occurred in the final run.
Both complete Vite app typechecks also passed.

| Package                   | npm tarball |   ESM | ESM gzip |
| ------------------------- | ----------: | ----: | -------: |
| Genuine contracts-only    |       4,633 |    28 |       37 |
| Temporary rendering probe |       8,765 | 6,995 |    2,346 |

| Consumer (all static JS assets) |   Bytes | Sum of per-file gzip bytes |
| ------------------------------- | ------: | -------------------------: |
| Vite / React 18                 | 145,556 |                     47,384 |
| Vite / React 19                 | 225,038 |                     70,222 |
| Next 14                         | 682,434 |                    211,797 |
| Next 16                         | 932,342 |                    288,461 |

The genuine archive has five files (LICENSE, README, package.json, index.js,
index.d.ts); the test archive has six (adding index.js.map). Package sizes were
measured with this task's updated README. Next totals include both routers and
all emitted framework chunks, including build-generated fallback routes; they
are not transfer sizes for a single page. No isolated consumer-bundle contribution
measurement was made. Neither package measurement estimates final chart size.

The client-reference manifests for both Next versions name the installed
`node_modules/rsc-rendering-test-only/dist/index.js` as a client module.
Next 14's entry CSS lists are empty; neither fixture supplies a stylesheet.
Vite sourcemaps identify one installed React family per consumer and the installed
probe. Framework-owned server/browser React modules are expected in Next; the
package adds no bundled React and npm shows deduplicated peer instances.

The following required local checks all passed on Node 24.19.0 with the foundation
React 19.3.0 dependencies:

```sh
npm run typecheck
npm run test:types
npm run lint
npm run format:check
npm test                         # 28 tests, 5 files
npm run verify:package
npm run build:playground
npm_config_cache=/workspace/work/npm-cache npm pack --dry-run
git diff --check
RSC_BROWSER_PATH=/usr/bin/chromium node scripts/verify-consumers.mjs
```

The default-cache pack attempt was corrected to use a writable cache. Initial
network-denied shell attempts were rerun with command network access, preserving
the configured proxy. The first axe attempt needed an explicit Playwright browser
context; the runner now supplies one. A Pages measurement-gate timeout and a
Next 16 Pages favicon 404 were fixture issues, corrected and rerun. None is
silently treated as a passing check. The existing Rolldown directive warnings
remain, but assertions and Next client manifests prove the installed boundary.

No public M01-T02 type changes, production source changes, new library dependencies,
or CI matrix changes were required. This task does not establish unrestricted
Next 14 declaration checking, Next 16 Turbopack, other browsers, manual accessibility
compliance, or production chart integration. Those limits do not invalidate the
verified package/probe paths.

For `next-18`, captured DOM evidence shows explicit server/hydrated viewBox
`0 0 640 280`, no responsive server SVG, and measured/resized responsive
viewBox `0 0 547.1875 280`. The server and initially hydrated responsive
section serializations are equal; the table remains after measurement.

For `next-19`, captured DOM evidence shows explicit server/hydrated viewBox
`0 0 640 280`, no responsive server SVG, and measured/resized responsive
viewBox `0 0 547.1875 280`. The server and initially hydrated responsive
section serializations are equal; the table remains after measurement.
