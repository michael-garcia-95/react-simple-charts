# M06-T02 — Package identity and metadata

## Scope and baseline

Fetched `origin/main` and verified baseline
`84c77d8f9f849fe4a05d98554262c35d9d731bb9`. The worktree was clean before
creating `chore/m06-t02-package-identity`. Read AGENTS.md, architecture, release
readiness, manifest, package/consumer verification, site generators and current
usage documentation. This task implements the approved personal scope only;
publication, release and deployment remain separate actions.

## Identity and metadata

The npm identifier is `@michael-garcia-95/react-simple-charts`. The user confirmed
registration of the npm username and enabled 2FA. React Simple Charts remains
an independent, personally maintained React/TypeScript library. Repository name,
public branding, GitHub Pages URL and `/react-simple-charts/` base are unchanged.

The factual description names React, TypeScript, SVG and the five chart families;
it makes no relative size or performance claim. Standard Git repository metadata
uses the canonical HTTPS repository with npm's `git+` prefix. Homepage and bugs
point to the existing Pages site and GitHub issue tracker. Keywords describe the
implemented technology and families. `publishConfig.access: public` records the
approved future scoped-package access, while `private: true` and `0.0.0` remain
release guards. npm tooling synchronized the lockfile without dependency changes.

Runtime dependencies, React 18/19 peers, ESM-only root exports, declarations,
file allowlist, client boundary and build tool configuration are preserved.
Node engines are unchanged; deciding consumer SSR Node policy separately from
development-tool minimums remains open. Initial 0.1.0 still awaits approval.

## Atomic migration and verification

Active site imports, all generated interactive/documentation TSX, current chart
usage/API documentation, README, TypeScript fixtures and site assertions use the
scoped identifier. Public playground imports now use the built package root;
playground dev/build commands build the library first. Historical internal probes
remain source-only. No export subpaths or CommonJS entry were added.

Package verification asserts the approved identity, private version and existing
ESM/declaration/client/external React contracts. The verifier packs the already
built output with a disposable npm cache and inspects it using system tar; the
separate normal pack and consumer commands still exercise the prepack build. Dynamic self-imports derive their
name from the manifest. Consumer fixture dependencies, generated imports,
node_modules paths and Next client-manifest checks also derive identity from the
manifest. Scoped archive naming removes the initial @ and replaces / with -, as
npm pack does. Every consumer is freshly installed from the actual local archive;
no source aliases or reused same-version installations are permitted.

The local-tarball website instructions use the scoped archive filename and root
specifier, while continuing to state that the package is unavailable on npm.
All 22 interactive variants and 10 documentation samples are retained.

Historical M01–M05 integration reports and M06-T01 registry conflict evidence are
unchanged: their unscoped identifiers describe earlier artifacts or the unrelated
registry package. Repository URLs, checkout folder names and Pages paths also
legitimately retain react-simple-charts. Current chart/API guides are migrated.

## Validation

Local validation uses Node 24.19.0 and npm 11.9.0. `npm ci` installed 274
packages. The complete test run passed **1,115 tests across 52 files**; a final
rerun after assertion updates passed the same counts. All commands below passed:

- `npm ci --fetch-retries=0 --cache /workspace/work/npm-cache`
- `npm run typecheck`
- `npm run test:types`
- `npm run lint`
- `npm run format:check`
- `npm test`
- `npm run verify:package`
- `npm run verify:site:snippets` (32 samples: 22 interactive + 10 documentation)
- `npm run build:site`
- `node scripts/verify-site-build.mjs /`
- `npm run build:site:pages`
- `node scripts/verify-site-build.mjs /react-simple-charts/`
- `npm run build:playground`
- `npm pack --dry-run`
- `git diff --check`

The initial pack attempts hit the sandbox's unwritable default npm cache.
Successful reruns used `npm_config_cache=/workspace/work/npm-cache`; the archive
verifier now uses its own disposable cache. Initial fetch also required the
supported command-level network permission, without changing proxy settings.
No assertions were relaxed to resolve these environment issues.

## Actual distribution inventory

The consumer runner's actual `michael-garcia-95-react-simple-charts-0.0.0.tgz`
was extracted and inspected. It is **81,896 packed bytes**, **353,352 unpacked
bytes**, SHA-1 `3cf6d8ac9cc720cef5748371a808b935f0c02118`, with no bundled
dependencies and exactly these files:

| File              |   Bytes |
| ----------------- | ------: |
| LICENSE           |   1,071 |
| README.md         |   7,851 |
| package.json      |   3,059 |
| dist/index.js     | 106,382 |
| dist/index.d.ts   |   6,855 |
| dist/index.js.map | 228,134 |

The manifest is private 0.0.0 with the approved scoped identity and only root
`types`/`import` exports. JavaScript retains the client directive, external React
imports and exactly five runtime exports. Runtime/declaration bytes and sizes
are unaffected by the name migration. The existing source map embeds 50 relative
library source entries; no site/work entries or absolute paths were found.
No website build, playground, tests, node_modules, lockfile or private work
artifacts are packed. Source-map exposure remains an existing release decision.

## Installed compatibility and handoff

`RSC_BROWSER_PATH=/usr/bin/chromium node scripts/verify-consumers.mjs` passed
all four freshly installed consumers on Chromium **151.0.7922.173**:

| Framework             | React / DOM | TypeScript | Result |
| --------------------- | ----------- | ---------- | ------ |
| Vite 8.3.4            | 18.2.0      | 6.0.3      | Pass   |
| Vite 8.3.4            | 19.3.0      | 6.0.3      | Pass   |
| Next 14.2.35, Webpack | 18.2.0      | 5.4.5      | Pass   |
| Next 16.4.0, Webpack  | 19.3.0      | 6.0.3      | Pass   |

Each row passed scoped root imports, installed ESM byte comparisons, strict
package declarations (`skipLibCheck: false`), peer deduplication, forbidden
subpaths, production builds, browser interactions and representative axe scans
with **zero violations** and no runner-reported page/console/hydration errors.
Vite exercises explicit SSR markup and separate hydration roots; its report's
`ssr: false` distinguishes the non-Next fixture. Both Next routers and genuine
App client-reference manifests passed with the scoped node_modules path. Next
whole-app compilation retains its established `skipLibCheck: true` policy.

Existing build directive warnings and Next 14's outputFileTracingRoot option
warning remain nonfatal; distributed directives and actual Next client manifests
are verified independently. Wider browsers/devices, manual screen-reader review,
source-map policy and the consumer engine decision remain later release gates.
Logs and fixtures are ignored under work/m06-t02 and work/consumers.

All runtime/declaration output remains unchanged; the compatibility impact is
the longer root import specifier and npm's scoped archive/node_modules paths.
No npm publication, release/tag creation or Pages deployment occurred.
CI results are reported in the task handoff for the final pushed commit.
No release approval is implied by passing checks.
