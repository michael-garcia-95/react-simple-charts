# M06-T01 — npm release readiness assessment

## M06-T07B — transition preparation (pre-merge snapshot)

Current main remains private 0.0.0; the candidate remains unpublished 0.1.0.
A future separately approved merge would move main to 0.1.0/private false.
[Transition policy and cross-platform diagnosis](M06_MAIN_BRANCH_RELEASE_TRANSITION.md)
record pre/post-merge CI selection, identical runtime/types, confirmed line-ending
payload differences, and proposed canonical packaging/README corrections requiring
Lead review. This update supersedes earlier branch-only CI-selection descriptions;
historical milestone outcomes and the original owner manual PASS are retained.
Publication remains **NO-GO**; no merge or exact publication operation is approved.

## M06-T07A — current readiness update

The owner completed the Windows NVDA + Firefox human accessibility assessment on
**October 12, 2026 (Trinidad and Tobago local time)**: **PASS / ALL PASSED**, with
no unresolved accessibility defects reported. See the
[manual accessibility evidence](M06_MANUAL_ACCESSIBILITY_RESULTS.md) for the exact
tested source, archive, environment, coverage and resolved navigation observations.
The manual test gate is complete for that candidate, provided its six packaged
file contents remain unchanged. Historical pending-test statements below describe
earlier milestones; they do not supersede this update.

Automated GitHub Actions verification previously passed at tested source
`83b51f0b025a0135b9e074778fc1f27764340971`: [CI](https://github.com/michael-garcia-95/react-simple-charts/actions/runs/38331086672),
[browser verification](https://github.com/michael-garcia-95/react-simple-charts/actions/runs/38331086639)
and [exact-artifact verification](https://github.com/michael-garcia-95/react-simple-charts/actions/runs/38331086668).
These automated checks are separate from the owner-reported human assessment.
Final documentation-head CI must be checked separately in PR #38.

**Publication: NO-GO.** The 0.1.0 package remains unpublished, PR #38 remains
unmerged, and the final publication operation remains unauthorized. Outstanding:

- Development Lead review of these final evidence changes.
- Final source and package review, including retained packaged-content identity.
- Review of the release transition and main-branch CI policy.
- Owner confirmation of npm account readiness before the operation.
- Explicit approval for merging the publishable candidate.
- Explicit authorization for the exact manual npm publication operation.
- Post-publication registry and consumer verification after authorized publication.

No publishing permission, registry write, staging, tag, release, deployment or merge
is authorized by this update. The read-only readiness script does not ingest human
evidence; its conservative pending markers do not invalidate this documented PASS
and cannot grant publication approval. See [release readiness](M06_RELEASE_READINESS.md),
[release policy](RELEASE_POLICY.md), [open decisions](OPEN_DECISIONS.md),
[publishing safeguards](M06_PUBLISHING_SECURITY_PLAN.md) and
[verification execution](VERIFICATION_EXECUTION.md).

> **M06-T06B3 candidate branch:** Local 0.1.0 / `private: false` preparation,
> lock synchronization and verification are authorized only on
> `feat/m06-t06b3-release-candidate`. Main remains unchanged; npm publication,
> staging, registry writes, tags/releases, deployment and merge are not authorized.
> Publication remains **NO-GO**. Historical records below retain their original
> outcomes and T06B2 boundaries. See the
> [candidate execution guide](VERIFICATION_EXECUTION.md#first-local-release-candidate--m06-t06b3).

> Historical M06-T01 audit: the baseline, observations and results below are
> preserved. Current identity and packaging decisions supersede earlier blockers.
> M06-T06B2 approves 0.1.0/versioning/maintenance/support and manual first publication
> for planning, with owner security confirmations. The actual package remains
> private 0.0.0; manifest changes, a genuine candidate and publication remain
> unauthorized. Deferred NVDA + Firefox, final human accessibility/artifact review
> and exact owner publication authorization remain gates. See
> [current decisions](OPEN_DECISIONS.md) and
> [release-aware preparation](VERIFICATION_EXECUTION.md#release-aware-preparation--m06-t06b2).

## Executive assessment

**Release NO-GO; proceed with release planning only.** Five public chart families,
strict declarations, ESM packaging and prior genuine installed-consumer evidence
provide a credible foundation. Publication is blocked by package identity,
release-policy approval, public metadata/documentation and secure release setup.
The current name belongs to another publisher. This project's library remains
private and unpublished; its website is live at
<https://michael-garcia-95.github.io/react-simple-charts/> (deployment status supplied
by the user). Website availability does not establish npm availability.

This is an audit, not a release commit. No runtime, package identity, version,
contracts, workflow, Pages settings or deployed-site imports are changed.
Recommendations below require Development Lead review and the indicated user
approval. Future features are not release gates merely because they remain open.

## Baseline and evidence method

Repository: `michael-garcia-95/react-simple-charts`. Fresh `git fetch origin main`
resolved required main to `84aa31bfcc3e8a71ce0b4d215ef4216b95f1db38`.
The worktree was clean before branching from `origin/main` to
`chore/m06-t01-release-readiness`. Node `24.19.0`, npm `11.9.0`.
Expected baseline: **1,115 tests / 52 files**; executed results are recorded below.
The initially provisioned checkout was older and was not used as the audit base.

Read AGENTS.md, package.json/lock, README, LICENSE, src/index.ts,
src/types/contracts.ts, tsdown config, package/consumer verification scripts,
CI and Pages workflows; reviewed ARCHITECTURE, API_TYPE_CONTRACTS,
CONSUMER_COMPATIBILITY, RENDERING_COMPATIBILITY, M04_INTEGRATION_HARDENING,
M05_WEBSITE_HARDENING, GITHUB_PAGES_PLAN and OPEN_DECISIONS. Inspected actual
Cartesian/polar renderers, sizing observer, geometry, inspection handlers,
source tables, generated declarations/ESM and website authored/generated examples.
Historical reports are corroborating evidence, not substitutes for current code.
Ignored `work/m06/` holds command logs and registry responses; it is not packed.

Network commands required explicit command-level network permission. Initial
sandbox-only fetch/registry/install attempts failed connecting to the inherited
proxy; subsequent authorized fetch, registry and npm install/audit succeeded.
No proxy bypass or credential inspection was used. Direct docs.npmjs.com requests
returned HTTP 403; official npm documentation was instead read from its public
source repository, `npm/documentation`, at
`dc67d85185f219427a92f709d385be254c6c39ba` on 2026-10-10.

## Critical package-name decision

Read-only verification at **2026-10-10T19:33:30Z** (15:33:30 America/Port_of_Spain):

```sh
npm view react-simple-charts name version maintainers dist-tags time repository --json --registry=https://registry.npmjs.org --cache=/workspace/work/npm-cache
curl -sS -D work/m06/registry-headers.txt https://registry.npmjs.org/react-simple-charts -o work/m06/registry-full.json
```

Official registry response: **HTTP 200**, existing name `react-simple-charts`,
latest tag/version **0.0.19**, maintainer
`samueldelesque <hello@samueldelesque.me>`, repository
`git+https://github.com/samueldelesque/react-simple-charts.git`.
Version 0.0.19 was published 2016-04-27T21:44:01.345Z; registry metadata modified
2022-06-26T08:13:40.608Z. These timestamps do not establish abandonment.
Public maintainers are available ownership information, not a complete private
permissions audit. An unrelated npm account cannot publish this existing name
without owner-granted access or an authorized transfer. No access was tested,
requested or assumed; inactivity does not make a name available for takeover.

**Recommendation: use `@<verified-user-or-org-scope>/react-simple-charts`.** This
is a placeholder strategy, not an approved name or install instruction. The user
must identify a namespace they control; GitHub login is not evidence of npm login.

| Strategy                               | Benefits                                                                                                    | Tradeoffs and implementation impact                                                                                                                                                                                                                                                  |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A. User-controlled scope (recommended) | Keeps React Simple Charts branding; explicit ownership; organization scope can support multiple maintainers | Longer install/import specifier; scope ownership and public access must be verified; root TypeScript imports, generators and tests must all change together. GitHub repository and Pages project path need not change. Search keywords, README and website improve discovery.        |
| B. Distinctive unscoped name           | Short install/import syntax; potentially clearer unique search identity                                     | Requires a new registry availability check at approval and immediately before first publication; availability is not reservation. Brand migration and discoverability work; same root-import/code-generation/test changes; repository rename is optional, not technically necessary. |
| C. Explicit transfer of existing name  | Preserves shortest current syntax                                                                           | Only justified if current owner voluntarily agrees through npm's supported process. No assumption of takeover; inherits user confusion and name history. Not recommended as a dependency for first release.                                                                          |

Final name, namespace ownership, maintenance roles and migration are approval
items. No candidate was reserved, account created, package renamed or owner contacted.

## Manifest review and import contract

| Field                | Actual state                                                           | Assessment / proposed follow-up                                                                                                                                                                                                        |
| -------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| name                 | react-simple-charts                                                    | Blocked by unrelated existing publisher; approve a replacement before changing it.                                                                                                                                                     |
| version / private    | 0.0.0 / true                                                           | Correct safety boundary now. Approve first version; remove private only in separately authorized publication preparation.                                                                                                              |
| description          | Lightweight, customizable React charting library built with TypeScript | Present; “lightweight” has no comparative benchmark. Prefer factual SVG/TypeScript/five-family wording or measured claim.                                                                                                              |
| license              | MIT                                                                    | Valid standard LICENSE with approved Michael Garcia copyright. Preserve.                                                                                                                                                               |
| repository           | absent                                                                 | Required before trusted publication/provenance; exact canonical GitHub git URL.                                                                                                                                                        |
| homepage             | absent                                                                 | Add current Pages URL after metadata approval.                                                                                                                                                                                         |
| bugs                 | absent                                                                 | Add canonical repository issues URL and README support guidance.                                                                                                                                                                       |
| keywords             | absent                                                                 | Recommended chart/SVG/React/TypeScript/family terms; no misleading capability claims.                                                                                                                                                  |
| type / exports       | module; only root types/import conditions                              | Appropriate ESM-only named-root contract. No require/default/internal subpaths.                                                                                                                                                        |
| types / main         | dist/index.d.ts / no main                                              | Types and conditional import entry work. Main is unnecessary for supported modern resolvers; adding CJS fallback would misrepresent output.                                                                                            |
| files                | dist, LICENSE                                                          | README/package.json automatically included. Six-file inventory is bounded; verify exact allowlist after every future build.                                                                                                            |
| sideEffects          | false                                                                  | Consistent with no imported global stylesheet or top-level global mutations. Allows tree shaking; does not prove measured consumer savings.                                                                                            |
| engines              | ^22.22.2 or ^24.15.0 or >=26                                           | Development-tool minimums unnecessarily appear as package installation constraints. Review/remove or separate from actual supported SSR Node policy. Browser consumers do not run Node; ES2022, React and ResizeObserver matter there. |
| dependencies         | d3-scale ^4.0.2; d3-shape ^3.2.0                                       | Both actually external ESM references; retain rather than remove as “bundled.”                                                                                                                                                         |
| peerDependencies     | React / React DOM ^18.2.0 or ^19.0.0                                   | Matches intended matrix. React JSX runtime stays external; peers must be supplied/deduplicated.                                                                                                                                        |
| peerDependenciesMeta | absent                                                                 | Required peers are intentional; do not make optional without evidence. React DOM relationship can be reassessed separately, not silently relaxed.                                                                                      |
| publishConfig        | absent                                                                 | Explicit public access and official registry recommended after scope approval; provenance/permissions must match approved process.                                                                                                     |
| scripts              | build/prepack and validation; no publishing script                     | prepack rebuilds artifact. verify-package currently asserts private=true and imports current name; consumer/snippet fixtures also hard-code it. Deliberately adapt these guards with approved release work, not simply bypass them.    |

Public runtime is exactly LineChart, AreaChart, BarChart, PieChart, DonutChart.
Declarations additionally expose approved types from the root; no default export
or server-safe pure-helper entry is promised. Consumers need a modern ESM resolver
and **TypeScript 5.4+ for built-in NoInfer**, subject to actual tested compiler
versions below; older TypeScript compatibility is not established. Declarations
reference React types, not internal source paths or D3 types. Package-lock root
identity must stay synchronized with an approved future manifest migration.

## Real distribution inspection

The genuine locally packed archive contains exactly:

| Path                   | Bytes at baseline |
| ---------------------- | ----------------: |
| LICENSE                |             1,071 |
| README.md              |             7,271 |
| package.json           |             2,513 |
| dist/index.js          |           106,382 |
| dist/index.d.ts        |             6,855 |
| dist/index.js.map      |           228,134 |
| Total unpacked         |           352,226 |
| Compressed npm tarball |            81,526 |
| ESM gzip               |            23,258 |

These baseline bytes were inspected from the consumer runner's actual tarball,
not inferred from source files. README corrections change subsequent pack bytes;
final audit-head measurements are recorded under validation. JS starts with
`"use client"` (twice, source plus banner; harmless duplication). It is ESM,
imports React/JSX runtime and d3-scale/d3-shape externally, and exports only the
five charts. Declarations preserve generic contracts and root type exports.
React DOM subpath externalization is also checked by the disposable build probe.

No site-dist, playground, tests, work evidence, node_modules, lockfile, .env,
Git metadata or separate source tree is present. README and standard MIT LICENSE
are included. The map contains 50 relative library source paths and embedded
sourcesContent; it intentionally makes implementation source public. It contains
no site/private-evidence source entries or absolute local paths. This is an
inventory/source review, not a claim of a universal secret scanner certification.
Source maps aid debugging but dominate unpacked size. Approve retaining them or
omit them in a future reviewed packaging task; do not promise source confidentiality.

**Six files are an appropriate lean public archive**, provided metadata, README,
version, identity and license obligations are resolved. More files are not
inherently needed. D3 remains external, with its ISC notices in dependency
packages; assess notice inventory again if future bundling includes dependency code.
Rolldown emits directive warnings, but actual banner/consumer manifest checks,
not warning suppression, establish the distributed client boundary.

## Public API stability and intentional limits

Actual contracts anchor T inference to readonly data and use NoInfer for mappings,
series and callbacks. Key filters admit compatible nullable/optional fields and
exclude null-only/never/incompatible fields. yKey and series are exclusive;
continuous X scales use discriminants; horizontal Bar axis types follow physical
axes while xKey keeps category meaning. Root compile tests cover actual JSX and
invalid combinations. Empty data requires a useful caller type if inference lacks
records; it is not a reason to expand public props.

Shared Line/Area tooltip contexts are discriminated shared/item unions; Bar
defaults to item. Polar context contains a segment, original record/index,
percentage on a 0–100 scale and source identity. Activation adds pointer/keyboard/
touch input method and keeps raw values, not formatted labels. Renumbering source
identity, changing callback timing, tooltip defaults, percentage units or field
eligibility would be behavioral breaking changes even if TypeScript still compiles.

Common optional sizing/styles/colors/animation/accessibility remain intentional.
Area is unstacked, linear and zero-baseline; Bar is grouped; polar negative values
reject the whole chart. Missing observations/gaps, zero-total empty states and
invalid/unrepresentable geometry are explicit. There is no public diagnostics
object or promise to recover extreme arithmetic. Error/unavailable presentation
keeps a source-table alternative; caller custom renderer exceptions are not a
promise of a universal error boundary.

Explicit finite dimensions render SVG in SSR. Responsive width and Cartesian
local-time mode use stable accessible initial placeholders, then client
measurement/timezone; absent ResizeObserver leaves responsive charts pending.
useId, per-container observer cleanup and instance-local selection support
hydration/multiple charts. This client-marked package is not a server-only math
library; Next App Router props crossing a server/client boundary must obey Next
serialization rules (callbacks/custom content may need a caller client component).

Named groups, descriptive relationships, semantic complete source tables, one
roving target, arrows/Home/End, Enter/Space activation and Escape dismissal are
implemented. Hover inspection does not itself activate. Reduced-motion-aware
180ms opacity is opt-in; default output is static. No accidental runtime helper
exports or public internal subpaths were found. Public type exports themselves
are contractual and must be versioned. Conservative label estimates, tiny-sector
pointer targets, overlapped-point selection, approximate/custom tooltip bounds,
clipped oversized Donut center content, inline-style CSP and arbitrary host CSS
are documented limits, not demands for new chart families before release.

## Installed consumer compatibility

Historical M04-T04 evidence is genuine five-family tarball installation, not a
workspace/source alias. Its matrix is preserved in the current reproduction:

| Consumer     | React / DOM | Compiler | Framework mode        |
| ------------ | ----------- | -------- | --------------------- |
| Vite 8.3.4   | 18.2.0      | TS 6.0.3 | Production ESM        |
| Vite 8.3.4   | 19.3.0      | TS 6.0.3 | Production ESM        |
| Next 14.2.35 | 18.2.0      | TS 5.4.5 | Webpack App and Pages |
| Next 16.4.0  | 19.3.0      | TS 6.0.3 | Webpack App and Pages |

Runner independently installs the real archive, compares installed JS bytes,
rejects source/dist/internal subpaths, compiles package declarations with strict
skipLibCheck=false, checks peer deduplication and production bundling. Next app
compilation retains framework-standard skipLibCheck=true; strict checking of the
entire Next 14 declaration surface is not claimed. Browser checks cover App Router
client manifests, explicit SSR/initial hydration, responsive/local-time pending
markup, observer mounting/cleanup, tooltip/keyboard/pointer/touch interactions,
source tables and representative axe scans. Current execution outcome appears below.
No Turbopack, other framework versions, CommonJS or physical devices are claimed.

## Accessibility and browser policy

Existing source/unit/hydration and Chromium evidence covers semantics, names,
keyboard, focus, pointer/touch event paths, tooltip description relationships,
reduced motion and responsive measurements. M05 website hardening additionally
covers 200% root text enlargement at narrow widths; that is website/Chromium CSS
emulation, not native browser zoom or every host integration. Tooltip role and
aria-describedby do not establish reliable screen-reader announcements.

| Unverified area                                                         | Category                          | Reason / required scope                                                                                                                                                                                                   |
| ----------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Manual screen-reader navigation and tooltip announcements               | Required before first publication | Accessibility is a central contract. Exercise at least one desktop screen reader/browser with all five families, source table, activation and center controls; fix material barriers or narrow claims with Lead approval. |
| Firefox and WebKit library smoke                                        | Recommended before publication    | Existing evidence is Chromium only. Validate SSR/hydration, SVG focus, keyboard, resize and tooltip behavior; if deferred, publish an explicit tested-browser policy rather than imply broad support.                     |
| Native high contrast/forced colors and browser zoom                     | Recommended before publication    | Media emulation does not prove system rendering/focus distinguishability. Native checks reduce visual accessibility risk.                                                                                                 |
| Physical touchscreen/assistive mobile devices                           | Recommended before publication    | Chromium touch input is event coverage, not hardware or mobile screen-reader coverage.                                                                                                                                    |
| Strict CSP / arbitrary host styles                                      | Acceptable documented limitation  | Essential inline styles and consumer CSS interaction are current design choices; state integration needs without promising strict style CSP support.                                                                      |
| Tiny sectors, estimated labels, oversized center/custom tooltip content | Acceptable documented limitation  | Keyboard/table alternatives exist; explain clipping/selection limits. Material manual accessibility defects remain gates if found.                                                                                        |
| Broader assistive-tech/device matrix, measured label placement          | Future enhancement                | Useful expansion beyond a bounded first-release policy; no certification claim.                                                                                                                                           |

Approve supported-browser policy and the minimum manual accessibility gate.
Zero automated axe violations is not WCAG certification. Chromium media/touch/text
emulation is not Firefox, WebKit, native zoom or a physical-device test.

## Performance, dependencies and advisories

Two direct runtime dependencies resolve to ten non-peer D3/internmap packages:
d3-array 3.2.4, d3-color 3.1.0, d3-format 3.1.2, d3-interpolate 3.0.1,
d3-path 3.1.0, d3-scale 4.0.2, d3-shape 3.2.0, d3-time 3.1.0,
d3-time-format 4.1.0, internmap 2.0.3. Lock metadata licenses are **ISC**;
React/react-dom are separate MIT peers. Dependency versions remain unmodified.

Read-only `npm audit --omit=dev --json --cache=/workspace/work/npm-cache` and
`npm audit --json --cache=/workspace/work/npm-cache` returned **zero known
advisories** on 2026-10-10. This is a time-bound registry result, not proof of no
vulnerabilities. Runtime and full development graphs were assessed separately;
install deprecation warnings for old yuku bindings concern development tooling,
not chart runtime. Full audit metadata totals include optional/peer/tooling nodes
and are not the library runtime-dependency count.

Raw ESM/gzip/packed sizes above exclude downstream D3/React transfer costs.
Framework application asset totals in older reports include React/framework/routes
and must not be advertised as isolated library sizes. Pure calculation separation
and sideEffects=false are favorable to bundlers, but per-export tree-shaking
savings have not been measured; no quantitative claim is approved.
M04 timing evidence is development-mode/local Chromium samples, not production
budgets or supported data limits. Per-record SVG controls/tables, geometry and
rerenders cost more for large data; no decimation/virtualization is present.
Document that limit; a production benchmark with representative datasets is
recommended, while rendering refactors and large-data features are post-release.

## README and website implementation inventory

README has a useful typed example, root exports, peer target and development
commands, but its milestone chronology is not a public npm onboarding guide.
Minimal status corrections in this audit acknowledge the live site and distinguish
the unpublished library. Existing imports remain unchanged until name approval.
Website currently retains stale “not deployed” wording; historical milestone
reports describe their original task states and must not be treated as current
release claims.

| Future update location                                                     | Implementation required after approval                                                                                                                                                                              |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| package.json / package-lock.json                                           | Approved name/version, repository/homepage/bugs/public access, consumer engine policy; retain root ESM/type contract.                                                                                               |
| README.md                                                                  | Public install only for approved published identity; full minimal example and link to five-family docs, tested React/TS/framework/browser policy, limitations, issues/support, release notes/version and live site. |
| site/Documentation.tsx                                                     | Correct deployment/package status, approved installation/tarball syntax, compatibility/version references and limitations.                                                                                          |
| site/documentation-code.ts                                                 | Update ten authored root-import examples and tooltip type imports.                                                                                                                                                  |
| site/example-code.ts                                                       | Update interactive generator's package specifier; preserve 22 synchronized variants.                                                                                                                                |
| site/Site.tsx and site/components.tsx                                      | Review Home example/status, live site/support/npm links and version presentation. Add npm link only after the correct release exists.                                                                               |
| site/charts.tsx, site/example-data.ts, site/InteractiveExample.tsx         | Update internal site consumption of approved package root without source aliases.                                                                                                                                   |
| scripts/verify-package.mjs, scripts/verify-consumers.mjs, snippet verifier | Approved name lookup/imports, archive filename and installed-node_modules paths, release-aware private guard; keep real-byte/type/client checks.                                                                    |
| tests/, playground/, docs/ chart/API examples, config/self-imports         | Search every current package specifier, update contracts/expected snippets together; regenerate and compile samples, rerun full four-consumer matrix.                                                               |
| GITHUB_PAGES_PLAN / OPEN_DECISIONS / milestone context                     | Add current-status context without rewriting historical evidence as newly tested.                                                                                                                                   |

Keep repository name, Pages URL/base path and manual main-only deployment workflow
operational unless a separate repository migration is explicitly approved.
Website updates require later reviewed implementation and separately authorized
deployment. No npm installation instructions for an unapproved identity are added.

## Version and release policy recommendation

Recommend **0.1.0**, subject to approval. The five-family scope is implemented and
well tested, but first external use, browser policy and manual accessibility still
need validation. 1.0.0 is defensible only if the Lead accepts all documented public
contracts/defaults as a stable maintenance promise; test count alone is insufficient.

Use Semantic Versioning: after 1.0, compatible fixes are patch, additive compatible
features minor, breaking contracts/behavior major. During 0.x, explicitly announce
breaking changes in minor releases (0.1 to 0.2); preserve compatibility within patch
releases. Deprecate before removing where practical. Optional 0.1.0-beta.1 under
an opt-in prerelease dist-tag can gather consumer feedback, but is itself public
publication requiring approval; it does not bypass gates. Avoid prereleases on latest.

Propose CHANGELOG entries grouped Added/Changed/Fixed/Deprecated/Removed/Security,
with migration instructions and tested versions/limits. Release notes should name
approved package identity, five-family scope, browser/SSR policy and artifact
checks. Approved immutable Git tags such as v0.1.0 must match the released source;
create none in this audit. Patch maintenance must rebuild/retest/reverify the real
package and disclose advisory fixes. Publish a new patch for corrections rather
than overwrite: npm name@version is immutable even after unpublish.

Official unpublish policy permits new packages within 72 hours only when no other
registry packages depend on them; older removal requires no dependents, fewer
than 300 weekly downloads and a single owner. It is not a reliable rollback plan.
Prefer corrective versions and, if needed, deprecation and authorized dist-tag
movement; preserve historical artifacts. Entire unpublish also imposes a 24-hour
republish delay, and cannot make a used version reusable.

## Secure publication strategy (proposal only)

Official sources consulted from npm/documentation at the snapshot above:
[trusted publishers](https://docs.npmjs.com/trusted-publishers/),
[provenance](https://docs.npmjs.com/generating-provenance-statements/),
[staged publishing](https://docs.npmjs.com/staged-publishing/),
[2FA](https://docs.npmjs.com/about-two-factor-authentication/),
[unpublish policy](https://docs.npmjs.com/policies/unpublish/), and scoped/unscoped
public-package documentation. Recheck policies immediately before authorized release.

1. User confirms npm account/namespace ownership and authorized maintainers,
   enables security-key/appropriate npm 2FA and recovery procedures personally.
   No credentials are requested, read, stored or logged by this audit. Ordinary
   publishing requires 2FA or a granular bypass-2FA token; prefer 2FA, not a
   permanent write token. Verify organization package permissions separately.
2. First publication needs an explicit bootstrap decision: trusted-publisher
   configuration is attached to package settings, so do not assume OIDC can
   create an entirely absent package. An authorized owner can bootstrap via
   interactive 2FA publication of the approved audited release, then configure
   OIDC; this first manual path must not be described as automatically provenanced.
   Current official docs also allow staging a new package, creating a **public
   0.0.0-stage placeholder**. That is a real public namespace/package action,
   not a harmless test/reservation; it requires explicit approval. Stage-only
   bootstrap followed by trusted CI must be validated in release planning, not
   tried during this audit. Do not publish a dummy package to solve setup.
3. Later releases should use GitHub-hosted Actions with short-lived OIDC,
   npm CLI >=11.5.1 and Node >=22.14.0 (current library tool minimums are higher).
   Staged publishing requires npm >=11.15.0; installed npm 11.9.0 cannot be assumed
   to support it. Bind exact repository owner/name, workflow filename and protected
   release environment; allow only needed operations. Current docs offer multiple
   publishers and stage-only permissions; distinguish this from legacy single-
   publisher configuration. New configuration must validate with its first publish
   within two days or be recreated. No configuration is created now.
4. Prefer stage-only OIDC plus maintainer 2FA approval when technically supported
   and approved, or a protected manual direct-publish job with Lead review.
   Scope contents:read and id-token:write to the release job, restrict approved
   main/tag provenance, protect tag creation and environment reviewers, prevent
   self-review/bypass where supported, serialize releases, pin/review actions and
   validate immutable source and exact pack inventory. Keep PR CI read-only;
   separate npm release permissions from existing Pages deployment permissions.
5. Exact repository.url matching the public GitHub repository is currently missing
   and required. GitHub OIDC automatically generates provenance for public source
   repositories/public packages; provenance authenticates origin/build, not safety.
   After trust works, npm recommends require-2FA-and-disallow-tokens. Do not enable
   unsupported protections or assert repository-plan support without verification.
6. Before final owner approval inspect the exact tarball, name/version/access,
   changelog/tag/source SHA, all four CI jobs and genuine consumers. Afterwards
   independently query registry dist-tags/version/integrity, download the public
   archive for inventory/byte verification, inspect provenance and install the
   published artifact in pinned consumers. Record release evidence and monitor
   issues; publication/deprecation/tag changes need their own authorization.

No publishing workflow, npm login, token, staged package, reservation, release,
tag or package is created. Proposed authentication is not exercised by npm whoami
or a test publish; public read-only registry queries establish only registry facts.

## Prioritized readiness matrix

| ID / category           | Finding and evidence                                                                                | Severity / release impact                                            | Proposed resolution                                                                           | User approval                                                       | Follow-up                               |
| ----------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------- |
| G1 BLOCKER              | Registry 200; current name owned elsewhere at 0.0.19                                                | Critical: unrelated account cannot publish this name                 | Approve controlled scope; verify namespace and maintainers                                    | Yes, identity/ownership                                             | M06-T02 naming/metadata                 |
| G2 BLOCKER              | private=true, version=0.0.0; no approved release process                                            | High: intentional publishing guard and no version/security authority | Approve version, gates, bootstrap and publication separately; keep private until then         | Yes                                                                 | M06-T05 policy, T06 security            |
| G3 REQUIRED PRE-RELEASE | Missing repository/homepage/bugs; development engines affect consumers                              | High: trust metadata missing, misleading install restriction         | Add canonical metadata and approved consumer Node/TS policy                                   | Yes for engine/support policy; routine metadata under approved task | M06-T02                                 |
| G4 REQUIRED PRE-RELEASE | Verifier asserts private and hard-coded old name throughout consumers/site                          | High: approved migration must retain genuine verification            | Adapt guard/imports/archive paths as one bounded change, rerun all checks                     | Yes for migration scope                                             | M06-T03 distribution/consumer hardening |
| G5 REQUIRED PRE-RELEASE | README milestone status and website undeployed wording; no public release onboarding                | High: future users could install unrelated package                   | Approved-identity docs, version/install/issues/limits; retain unpublished state until release | Yes for identity and later deployment                               | M06-T04 documentation                   |
| G6 REQUIRED PRE-RELEASE | Manual screen-reader/tooltip announcement evidence absent                                           | High: central accessibility promise unverified                       | Bounded five-family desktop screen-reader review; fix material barriers                       | Yes for gate/support claims                                         | M06-T03 compatibility/accessibility     |
| G7 REQUIRED PRE-RELEASE | No configured npm trusted publisher/protected release process                                       | High: unreviewed credential/publication risk                         | Approve bootstrap and OIDC/manual approval runbook, exact repository metadata                 | Yes                                                                 | M06-T06 secure preparation              |
| G8 RECOMMENDED          | Firefox/WebKit, native zoom/forced colors/physical devices unverified                               | Medium: limited tested-browser scope                                 | Reproduce smoke or explicitly approve bounded tested-browser policy                           | Yes for deferral/support policy                                     | M06-T03                                 |
| G9 RECOMMENDED          | sideEffects flag without isolated tree-shaking benchmark; local dev timings only                    | Medium: unsupported performance marketing                            | Production benchmark and factual claims; document dense SVG cost                              | Lead policy approval                                                | Optional measurement task               |
| G10 RECOMMENDED         | Source map 228,134 bytes embeds source; description says lightweight                                | Low: size/source disclosure and marketing clarity                    | Approve maps, keep accurate size/debug guidance; factual description                          | Yes for map policy                                                  | M06-T02/T03                             |
| G11 POST-RELEASE        | Decimation, measured labels, interactive legends, CJS/server-helper API and strict CSP enhancements | Low: intentional scope limits                                        | Separate feature design, no promise at initial release                                        | Yes before new scope                                                | Future milestones                       |

Minimum practical proposed sequence (not approval to implement):

1. **M06-T02:** approve identity/namespace, 0.1.0 recommendation and consumer
   policy; implement canonical metadata/name migration with lock synchronization.
2. **M06-T03:** distribution/consumer hardening and bounded manual accessibility;
   preserve four pinned Vite/Next consumers, decide maps/browser scope, adapt
   release-aware verification without widening public API.
3. **M06-T04:** synchronize README/website/import generators/snippets/tests and
   accurate version/install/limits/support copy; validate both Pages bases.
   Deployed-site changes require separate deployment authorization.
4. **M06-T05/T06:** approve changelog/version/breaking policy and prepare restricted
   publication runbook/workflow, OIDC/bootstrap/2FA/provenance and approval gates.
   No credentials in implementation; no publication as a side effect.
5. **M06-T07:** only after explicit release approval, verify immutable approved
   artifact and final CI, perform approved first-publication procedure and post-
   registry consumer checks. Never conflate this with website deployment.

## Explicit decisions required

Development Lead review and user approval are needed for the final npm name and
verified namespace; authorized npm maintainers; initial version (recommended
0.1.0, alternative 1.0.0/prerelease); breaking-change/maintenance policy; supported
Node/TypeScript/browser scope; minimum manual accessibility gate and deferrals;
source-map policy; first-publication bootstrap (manual 2FA versus approved staged
placeholder), trusted-publisher permissions/approvers and publication timing.
Follow-up implementation, merging, website deployment and public npm release
remain separate actions. This assessment does not authorize them.

## Validation and conclusion

All commands below passed (exit 0) on Node 24.19.0 / npm 11.9.0. Baseline source
validation was completed before the bounded Markdown/status edits; final formatting
and pack checks were rerun after them. No test count is inferred from old reports.

| Exact command                                                                   | Result                                                                                |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `npm ci --fetch-retries=0 --cache=/workspace/work/npm-cache`                    | 274 packages installed; development-only yuku deprecation warnings                    |
| `npm run typecheck`                                                             | Pass                                                                                  |
| `npm run test:types`                                                            | Pass                                                                                  |
| `npm run lint`                                                                  | Pass                                                                                  |
| `npm run format:check`                                                          | Pass, including final report/status edits                                             |
| `npm test`                                                                      | **1,115 passed across 52 files**, 102.60 seconds                                      |
| `npm run verify:package`                                                        | Root exports, declarations, SSR probe, client boundary and React externalization pass |
| `npm run verify:site:snippets`                                                  | **32 TSX examples: 22 interactive + 10 documentation**, pass                          |
| `npm run build:site`                                                            | Pass                                                                                  |
| `node scripts/verify-site-build.mjs /`                                          | Root HTML/assets/full inventory pass                                                  |
| `npm run build:site:pages`                                                      | Pass                                                                                  |
| `node scripts/verify-site-build.mjs /react-simple-charts/`                      | Project-base HTML/assets/full inventory pass                                          |
| `npm run build:playground`                                                      | Pass                                                                                  |
| `npm pack --dry-run --json --cache=/workspace/work/npm-cache`                   | Pass; six files, no bundled dependencies                                              |
| `npm pack --json --pack-destination work/m06 --cache=/workspace/work/npm-cache` | Local actual archive, pass; no publication                                            |
| `RSC_BROWSER_PATH=/usr/bin/chromium node scripts/verify-consumers.mjs`          | **All four genuine installed consumers pass**                                         |
| `npm audit --omit=dev --json --cache=/workspace/work/npm-cache`                 | Zero known runtime advisories                                                         |
| `npm audit --json --cache=/workspace/work/npm-cache`                            | Zero known advisories across full graph                                               |
| `git diff --check`                                                              | Pass                                                                                  |

Final audit-head dry-run and real pack both report **81,729 packed bytes**,
**352,698 unpacked bytes**, **six files**, `bundled: []`; SHA-1
`0ab53006c3e256ff67c088e21248426f1e885ed5`, integrity
`sha512-61uqXQmsI3OfMKto7wx5FyUoTfNAUHiMgQjt9sHBnyGn4p/46d9i1KCiPgCkBo3Kkyv8KdpN1hp/XiykuD7YvQ==`.
Final README is 7,743 bytes; all other packed file sizes remain as above.
Runtime ESM is unchanged at **106,382 bytes**, gzip **23,382 bytes** using
Node zlib default (gzip sizes can vary with compressor implementation/settings).
The actual final archive was opened and its files/maps checked. The audit report
and OPEN_DECISIONS are intentionally excluded by the package allowlist; README
relative documentation links need canonical public repository/website URLs for npm
onboarding in follow-up work. No credential-like private-key/npm/GitHub token
markers or absolute source-map paths were found in a bounded map scan; this is
not a comprehensive secret-detection guarantee.

Current installed-consumer reproduction used the baseline six-file archive
(81,526 bytes) before README status corrections. Installed runtime/declarations
match the final archive byte-for-byte; the only archive difference is README.
All four pinned rows above passed real Chromium **151.0.7922.173**, package strict
types, production builds, peer deduplication and interaction/accessibility checks
with **zero representative axe violations** and no runner-reported page/console/
hydration errors. Both Next routers and genuine App client-reference manifests
passed. Vite's report `ssr: false` identifies its non-Next fixture, not a claim
that no hydration roots were exercised: the runner executes separate Vite
SSR-root markup/hydration and observer checks. No tested version was broadened.
Results and artifacts are ignored in `work/consumers/results.json`.

| Consumer whole-app assets (not library transfer size) | Raw JS bytes | Sum of per-file gzip bytes |
| ----------------------------------------------------- | -----------: | -------------------------: |
| Vite / React 18.2.0                                   |      253,030 |                     79,814 |
| Vite / React 19.3.0                                   |      332,653 |                    102,588 |
| Next 14.2.35 / React 18.2.0                           |      896,921 |                    278,065 |
| Next 16.4.0 / React 19.3.0                            |    1,142,537 |                    353,752 |

GitHub CLI API calls were forbidden in this environment; the authorized GitHub
connector is used for PR creation and final-head CI evidence instead. Remote
Node 22/24 × React 18.2/19 results are reported in the PR/task handoff after
the final commit; local checks do not substitute for those four jobs.
Release remains **NO-GO** until G1–G7 are resolved or explicitly reviewed with a
justified scope adjustment. The release-readiness assessment itself can be complete
while the project is not ready to publish. Await Development Lead review and user
approval of release decisions; stop after M06-T01.
