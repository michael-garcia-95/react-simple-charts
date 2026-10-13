# Verification execution and isolated browser prerequisites

> **Historical preparation record.** Unpublished, NO-GO, unmerged and pending-test
> statements below describe their original milestones. For the October 13, 2026
> publication and current follow-up boundaries, see the
> [post-publication record](M06_POST_PUBLICATION.md). Original evidence identities
> and outcomes are retained; historical readiness scripts are not registry status.

## M06-T07C — canonical package correction completed

Scoped LF attributes and packaged README corrections are implemented. Both clean
LF and controlled Windows-style checkouts produced identical six-file contents;
only README differs from the previous Linux payload. Runtime/declarations remain
identical to the owner-tested implementation. See the
[canonical package baseline](M06_MAIN_BRANCH_RELEASE_TRANSITION.md#m06-t07c--completed-canonical-package-baseline)
for exact inventories, archive identities, method and accessibility-continuity limits.
Earlier proposed normalization/README items are now completed pending Lead review.
Publication remains **NO-GO**; merge and the exact npm publication operation remain
unauthorized. All other final review/account/authorization gates remain required.

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

Owner-performed Windows NVDA + Firefox assessment: **PASS / ALL PASSED** on
October 12, 2026 (Trinidad and Tobago local time), for tested source
`83b51f0b025a0135b9e074778fc1f27764340971`. See the
[manual evidence](M06_MANUAL_ACCESSIBILITY_RESULTS.md) for exact archive identity,
coverage and limitations. Manual accessibility is complete for that candidate if
its six packaged file contents remain unchanged; historical pending-test statements
below retain earlier milestone context. Previously passed automated GitHub Actions
checks are separate evidence, linked in the [current readiness update](M06_RELEASE_READINESS.md#m06-t07a--current-readiness-update).

**Publication remains NO-GO**: 0.1.0 unpublished, PR #38 unmerged, exact publication
operation unauthorized. All remaining review, account, merge/publication approval
and post-publication gates are listed in the current readiness update above.
The read-only readiness script does not ingest human evidence; its conservative
pending markers confer no publication approval. Final documentation-head CI must
be checked separately in PR #38.

Node/npm verification subprocesses use `scripts/verification-command.mjs`.
Node runs through `process.execPath`; npm uses the existing `npm-command.mjs`
resolver (PATH on Linux, Node plus `npm-cli.js` on Windows). Argument arrays,
working directories and environments are passed without a shell. Consumer and
browser smoke commands inherit output; package archive verification captures
stdout/stderr so npm's JSON remains parseable. Completion waits for `close`;
spawn failures, nonzero exits and signals have contextual diagnostics.

Browser packages remain isolated from root dependencies and the npm archive.
Both directories pin `playwright-core` **1.64.0** and `@axe-core/playwright`
**4.13.0** using the same installer and loader:

- `work/consumers/driver`: installed consumers, historical playground audits and
  full production website verification.
- `work/browser-smoke/driver`: independently executable installed-archive browser
  smoke and its existing CI installation commands.

Prepare the consumer driver without running consumer fixtures:

```sh
node scripts/browser-driver.mjs --install
node work/consumers/driver/node_modules/playwright-core/cli.js install chromium
```

For browser smoke, use `--install --smoke` or the existing
`node scripts/verify-browser-smoke.mjs --install-driver-only`, then install its
requested engines:

```sh
node work/browser-smoke/driver/node_modules/playwright-core/cli.js install chromium firefox webkit
```

On Linux, browser system libraries may additionally require Playwright's
`install --with-deps` command. Browser scripts use Playwright's installed binary
by default. Set `RSC_BROWSER_PATH` to explicitly select an existing Chromium;
browser smoke also retains its per-engine executable overrides. Missing binaries
produce Playwright's installation diagnostic. Missing/mismatched driver packages
produce the exact driver directory and preparation command.

The loader validates both manifest pins and installed versions and rejects
packages resolved outside the selected isolated installation. Historical
`work/browser-smoke/node_modules` is no longer used; no compatibility symlink is
required. The two active driver directories are deliberately retained to avoid
coupling independently executable runners. Top-level package versions are pinned;
the installer retains each driver's ignored lockfile, rather than providing a new
transitive-dependency lock/evidence architecture.

Focused infrastructure tests:

```sh
node --test scripts/tests/npm-command.test.mjs scripts/tests/verification-server.test.mjs scripts/tests/verification-command.test.mjs scripts/tests/browser-driver.test.mjs
```

Windows CLI discovery and argument handling can be simulated on Linux; this does
not establish native Windows execution. Native Windows still needs validation of
Node/npm launch, browser installation, framework builds and server cleanup. POSIX
signal tests are explicitly skipped there. Other executables (such as package
verification's `git` and `tar`) and historical fixture correctness are outside
this targeted Node/npm and driver change.

## Current execution evidence

Installed consumers, browser smoke, full website QA and RenderingProbe/LinePreview
smoke now start a unique evidence run before package/driver/browser operations.
Each creates `runs/<timestamp>-<uuid>/results.json` under its existing ignored work
area. Reports include run ID, timestamps, Node/platform/architecture, phase history,
outcome and separate original, diagnostic and cleanup errors. Configuration/engine
entries begin as `unexecuted`; partial execution does not imply a complete pass.
Browser smoke's existing per-engine `pass`/`fail` labels remain compatible; the
complete run uses `running`/`passed`/`failed`.

`current.json` is a pointer containing the run ID, directory and start timestamp.
Read the pointed-to `results.json` to determine its outcome; the pointer itself
does not claim success. Pointer claims use an exclusive `.current-claim` directory
created with non-recursive `mkdir`. An overlapping initializer on the same base
is rejected and must retry; IDs and timestamps are assigned after acquiring the
guard. Admission order is guard acquisition order, not invocation arrival time or
wall-clock comparison. Initialized runs may execute concurrently, but completion
never updates the pointer. Thus a delayed older claim cannot finish after a newer
accepted claim and replace it. Report writes use a temporary file and rename.
`running`, missing, malformed or mismatched reports are never
acceptable release evidence. The browser workflow checks pointer identity, normal
run name, complete outcome and all three engines before accepting the report.

The guard's `owner.json` records run ID, host and PID. Its owner checks the run ID
before releasing it. Handled initialization failure releases its own guard and
rejects; release/ownership failure also rejects. A changed or unreleased guard
remains blocked.
Interruption can leave the guard without metadata or with an incomplete pointer
claim. There is no expiry, PID-based takeover or automatic stale-guard deletion.
Confirm that no initializer is active on any host using that evidence base before
manually removing only `.current-claim`, then retry. Never remove an active guard;
the guarantee assumes participating runs obey this ownership protocol. Reports and
prior evidence do not need removal. Rejection avoids a platform-specific locking
dependency or a waiting queue, at the cost of manual interrupted-start recovery.

Old fixed-path `results.json` files are historical evidence, not current results.
They are deliberately preserved. Full website QA uses
`work/visual/site/{root,pages}/runs/`; rendering smoke uses
`work/rendering-smoke/runs/`. Browser smoke and installed consumers use their
respective `work/.../runs/` paths. Screenshots, HTML, axe results and compact
diagnostics are retained there without overwriting older runs.

Normal consumer/browser-smoke fixture installations and builds live in task-owned
`temporary-*` scratch directories, removed at cleanup even on failure. Drivers
and npm caches remain shared, bounded in number. `--prepare-only` intentionally
retains its explicitly requested manual fixture and prints its location; the
owner should remove that specific generated directory after manual use. No old
evidence or pre-existing fixture directory is automatically deleted. Evidence
retention is manual: inspect run IDs and remove only explicitly selected evidence
when no longer needed. Interrupted runs or cleanup failures may leave their own scratch directories;
inspect ownership before manual removal. No per-run dependency tree or browser
binary is retained by normal successful/failing runs.

## Bounded lifetime and failure semantics

Node/npm commands keep shell-free execution and output modes. The command helper
supports `timeoutMs`, `signal` and `shutdownMs`. Active builds/installs/pack commands
use a ten-minute deadline; driver installs use five minutes and package archive
creation uses two. A command failure distinguishes spawn, exit, signal, timeout,
cancellation and cleanup. POSIX commands/servers own detached process groups;
cleanup sends SIGTERM then SIGKILL to that group, including descendants. Windows
uses bounded `taskkill.exe /PID <owned pid> /T /F` while the parent is alive. It
cannot guarantee containment of detached descendants, or Windows descendants whose
parent exited before tree termination; native Windows validation remains required.
No processes are searched for or killed by name or port.

Server startup retains port-ownership and fixture-identity checks. Verification
callbacks have a five-minute deadline, receive `signal` and register resource
closure with `onCancel`. Server death, timeout or external cancellation aborts
browser work, waits up to twenty seconds for each registered cancellation cleanup,
and separately bounds callback settlement to twenty seconds before bounded server
shutdown. Active callbacks close owned browsers so Playwright operations reject
before returning. Run-level SIGINT/SIGTERM similarly request command/browser
cancellation. Browser launches have a fifteen-second limit. Required cleanup
failure turns the complete run into failure; secondary errors cannot replace the
original assertion failure. Finalized evidence rejects subsequent report writes.
Final outcome is reconciled after cleanup against every required phase and the
cleanup/diagnostic error arrays. A cleanup callback that records an error and
returns normally still produces a failed cleanup phase, failed overall outcome
and caller rejection. An existing primary error remains the caller's error.

Arbitrary JavaScript callbacks cannot be forcibly terminated in the same process.
An unsupported callback that ignores cancellation is reported as nonsettling;
resource closures and the server are still stopped, and evidence is sealed. Such
callbacks must not launch detached resources or perform independent late writes.
SIGKILL, power loss, escaped process groups and indefinitely stalled filesystem
operations are outside cooperative cancellation guarantees. A hard interruption
leaves a `running` report, never a new pass. Failure to create/write evidence is a
fatal command error; persistent filesystem failure can prevent a durable final
report, which must be treated as unavailable evidence. Compact unique directories
limit any late diagnostic writes to that failed run, rather than current/old reports.

The historical `verify-pie.mjs`, `verify-donut.mjs`, `verify-integration.mjs` and
`verify-five-charts.mjs` still write fixed `work/visual/<name>/` outputs and do not
guarantee an early/final outcome. They are optional legacy audits: archive their
existing evidence before explicit reuse. Their reporting migration is deferred;
no scenario was removed. Site-build/package/snippet checks primarily report to
stdout and are not persistent browser-evidence gates.

All focused infrastructure suites, including evidence failures:

```sh
node --test scripts/tests/*.test.mjs
```

Linux regression tests exercise real child termination, descendant listeners,
server death and cancellation. Windows npm resolution remains simulated; a green
Ubuntu CI matrix does not establish native Windows process-tree behavior.

## Installed-consumer module boundaries — M06-T06B0D

`node scripts/verify-consumers.mjs` remains the development-mode entry point.
It owns the evidence run, isolated scratch directory, browser, phase sequence,
configuration iteration, completeness checks and final resource cleanup.
Four cohesive modules under `scripts/consumers/` take explicit arguments:

| Module                  | Responsibility                                                                                                                                                                               |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fixtures.mjs`          | Frozen four-row version matrix; manifests, strict/app TypeScript configuration, public declaration probe, chart fixtures, both Next routing models and independent Vite SSR/hydration roots. |
| `installed-package.mjs` | Separate development archive preparation; genuine installed-byte comparison, root API/export probe execution, peer resolution, strict compilation and production builds.                     |
| `browser.mjs`           | Owned fixture-server lifetime and the existing native browser, SSR/hydration, geometry, interaction, accessibility and resize scenarios.                                                     |
| `evidence.mjs`          | Existing report schema and phase-aware IO adapters; Next client-reference evidence, Vite source maps, bundle metrics and explicit row completeness.                                          |

Data flow is archive preparation → per-row fixture generation → installation and
type/build verification → production evidence/metrics → owned-server browser
verification → row completion. Vite independent-root files are prepared after
installation, retaining their SSR command order. Browser contexts close per row;
the orchestrator owns final browser and scratch cleanup. The existing evidence,
command, driver and server utilities retain ownership, atomic reporting,
cancellation, deadlines and original/secondary-error semantics. There is no
second reporting system or mutable module-global report.

The matrix remains Vite 8.3.4 with React 18.2.0/19.3.0 and Next
14.2.35/16.4.0 with the corresponding React versions. All existing compiler and
type-package pins remain in `consumerConfigurations`, in the original execution
order: Vite 18, Next 18, Vite 19, Next 19. Next application configuration retains
its standard `skipLibCheck`; the separate public-package contract compilation
retains `skipLibCheck: false`. Both App and Pages routes remain required.

The pre-refactor scenario inventory is preserved:

| Layer             | Required coverage retained                                                                                                                                                                                                                           |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Archive/package   | Real npm pack/install; client directive and React externalization; installed ESM equality; exactly five root exports, strict public contracts and rejected internal subpaths; peer resolution.                                                       |
| Shared browser    | Deferred ResizeObserver and hydration equality; explicit/responsive sizing; accessible tables/names/row headers, IDs/relationships, focus outlines and axe; source-table retention and native observer behavior.                                     |
| Cartesian         | Line/Area/Bar focus and tooltip behavior; vertical/horizontal Bar; signed/clipped/missing data, independent Area gaps and time scales; keyboard, mouse/touch activation and deduplication; narrow, empty/replaced/unusable data.                     |
| Polar             | Pie and Donut arcs, full circles/rings, labels, ratios, source tables and invalid data; responsive sizing; keyboard/pointer/touch; center content; same-target Donut empty-hole rejection, ring positive control and sibling isolation at 700/480px. |
| Framework         | Next App/Pages SSR and hydration plus genuine client references; Vite seven independently prefixed StrictMode hydration roots; production source maps and bundle measurements.                                                                       |
| Lifetime/evidence | Fixture identity and incumbent-port safeguards, bounded owned processes, unexecuted rows, original errors, cleanup and retained unique evidence.                                                                                                     |

Decomposition preserves the 102 original direct assertion call sites and generated
fixture/probe contents. Three additional completeness guards require exact,
nonduplicated configuration/check row identities and successful browser results.
Focused Node tests protect pins, fixture wiring, command ordering, strictness,
independent roots, missing/duplicate/failed rows, evidence routing and failure
propagation; they do not simulate the full browser suite.

`prepareDevelopmentArchive` returns the locally built archive, its current build
bytes and existing size metadata before consumer installation begins. This is a
distinct future artifact boundary. The separate exact-artifact input described below bypasses development packing.
Current default development guards and npm archive construction remain strict;
the explicit future candidate policy is described in M06-T06B2 below.

## Exact local development artifact gate — M06-T06B1

This gate verifies **one supplied archive**, without publication, staging or release
approval. The development package stays private at `0.0.0`. M06-T06B2 below adds explicit
future candidate-policy validation; candidate creation/publication is not approved.

Prepare one ignored candidate from the intended clean source checkout:

```sh
mkdir -p work/candidate
npm run build
npm pack --ignore-scripts --pack-destination work/candidate
node --input-type=module -e "import {readFileSync} from 'node:fs'; import {createHash} from 'node:crypto'; console.log(createHash('sha256').update(readFileSync(process.argv[1])).digest('hex'))" work/candidate/michael-garcia-95-react-simple-charts-0.0.0.tgz
git rev-parse HEAD
```

Copy the printed digest and full checkout SHA into the explicit arguments below.
Do not pack again between gates. Prepare the isolated drivers and all three browser
binaries using the commands above, then run:

```sh
node scripts/verify-exact-artifact.mjs \
  --artifact work/candidate/michael-garcia-95-react-simple-charts-0.0.0.tgz \
  --sha256 <64-character-sha256> \
  --source-sha <40-character-checkout-sha>
```

`work/exact-artifact/current.json` points to a unique retained `results.json`.
The pointer is not a success claim: require finalized `status: passed`, successful
package results, both complete child gates, all four consumer rows and all three
engine outcomes. Chromium, Firefox and WebKit are mandatory for consolidated
success. Missing engines produce failure, even if available engines passed. A
standalone smoke run can still request a subset through `RSC_SMOKE_BROWSERS`;
that report cannot satisfy the consolidated gate.

The same flags work with `node scripts/verify-exact-package.mjs`,
`node scripts/verify-consumers.mjs` and `node scripts/verify-browser-smoke.mjs`.
For exact package validation invoke the separate Node entry: the legacy
`verify-package.mjs` rejects exact arguments rather than repacking.
`npm run verify:package` builds
and verifies development packing by design. No arguments means the existing
consumer/smoke development behavior, including packing, remains intact. Partial
exact arguments fail; there is no fallback. Exact smoke rejects preparation-only
and driver-only modes. The coordinator invokes its children in newly owned evidence
bases, passes a unique parent run ID, and accepts only reports finalized inside
that invocation window. It never imports unrelated historical success reports.

Responsibilities:

- `artifact/archive.mjs`: bounded gzip/ustar parsing, six regular-file allowlist,
  safe paths, header checksums, unique entries, complete installed inventory/bytes.
  It rejects links, directories, extended/PAX headers, malformed padding and
  unexpected names before writing any extracted file. The supported npm archive
  format deliberately fails closed on future format changes. Limits are 2 MiB
  compressed, 8 MiB inflated and 4 MiB per file.
- `artifact/selection.mjs`: explicit digest and checkout claim, explicitly selected
  manifest policy (development by default), six-file checkout comparison, tracked embedded source-map
  comparison, known credential signatures, externalization and client boundary.
  A run copies validated bytes into its exclusively created scratch file, checks
  its digest and marks it read-only. Original and copy digests plus source identity
  and relevant checkout bytes are checked at install/build/browser/final-cleanup
  boundaries. A privileged host attacker is outside this cooperative integrity
  contract; permissions alone do not make a file universally immutable.
- `artifact/package.mjs`: extract only allowlisted buffers into owned scratch;
  inspect five runtime exports/SSR and compile archived declarations plus source
  public contracts strictly. Dependencies/tooling here resolve from the development
  checkout; the four real consumers separately install the archive's dependencies
  and use their pinned independent compilers.
- `artifact/results.mjs`: reject stale, malformed, running, failed, wrong-digest,
  incomplete or cleanup-failed child evidence; check exact pinned consumer matrix
  and all three engines, 15 scenarios each.
- `verify-exact-artifact.mjs`: small sequential coordinator using existing evidence,
  process and cleanup utilities. It records archive/file digests, actual manifest,
  checkout/claim, package results, child run IDs/report digests, four configurations,
  browser versions/outcomes and limitations. Compact child screenshots, snapshots,
  manifests and logs remain in retained evidence. Owned installations/copies are
  removed; shared caches/drivers and all previous evidence remain.

SHA-256 establishes byte identity, not safe behavior or independently attested
build provenance. Git HEAD validates the explicit claim and clean relevant tracked
source; the report also records verification-infrastructure worktree changes.
Archive files must match the current distribution/README/license/manifest, and
embedded sources must match tracked source. This deterministic content boundary
requires an already built matching distribution, not reproducible gzip timestamps
or a new pack. Two independently packed archives cannot be treated as identical
merely because name/version or ESM bytes match.

Unit tests, source typecheck, website builds/snippets and ordinary CI still operate
on source. The existing three-engine CI smoke workflow uses its own development
pack, **not** this externally selected archive. Its success is separate evidence.
The exact gate covers archive/API/declarations and real installed builds, consumer
SSR/hydration/native Chromium assertions plus independent three-engine smoke.
It does not authorize publication, satisfy manual NVDA/human accessibility review,
prove native Windows/physical Safari support or resolve version, release-policy,
account/security/bootstrap, provenance and owner-operation approvals in
[release policy](RELEASE_POLICY.md) and
[publishing security plan](M06_PUBLISHING_SECURITY_PLAN.md).

The separate `Exact artifact verification` PR workflow prepares one private local
archive on its actual checked-out head, computes its digest once and passes that
archive to the coordinator for all four consumers and all three engines. It keeps
`contents: read`, uses no publication permission and uploads compact JSON reports,
archive/file SHA-256 digests, source identity, verification logs, browser diagnostics
and driver manifests/locks. The raw npm archive is not uploaded while publication
remains unauthorized. CI still generates and verifies that single archive internally;
the upload paths omit the candidate directory and explicitly exclude `work/**/*.tgz`,
including copies left inside evidence directories after interrupted cleanup. This
retains an auditable verification decision without distributing the development
package. Downloadable evidence cannot supply the original archive for independent
installation; any future archive distribution needs separate authorization. It does
not consume a workstation-selected archive; compare reported digests before making
any identity claim. Existing PR CI, development browser verification and Pages deployment remain
independent. The CI Node suite includes the focused archive/evidence regressions.

## Release-aware preparation — M06-T06B2

Planning approvals now cover initial 0.1.0, Semantic Versioning/maintenance,
conservative support and manual owner-controlled first publication with npm 2FA.
No publishing token is needed and automatic GitHub OIDC first-release provenance
is not promised. Account/security statements are owner confirmations, not live
configuration checks. The actual manifest/lock stay unchanged at **0.0.0/private**.
No real candidate creation/distribution or registry operation is authorized.

`scripts/artifact/manifest-policy.mjs` centralizes identity/state and metadata
checks. Default `development` requires approved name, 0.0.0 and private true.
Explicit `release-candidate` requires expected name and the approved planning
version 0.1.0, private false or absence, and scoped public access. Other target
versions need separate approval and a reviewed policy update. Policy selection
never follows manifest values automatically. Root-only ESM/declaration entries,
React peers, D3 dependencies and canonical metadata stay mandatory in both modes.

Candidate flags require exact artifact/digest/source arguments; no development
packing fallback is possible. Selection still checks actual clean relevant source,
complete manifest equality, all six file bytes/maps, bounded safe tar structures
and digest-preserving copies. Both policies execute the same package/API/strict
contracts, installed inventory, four pinned consumers, SSR/hydration and all
three engine smoke checks. The consumer probe imports the shared verification
policy by an explicit file URL; chart imports remain from the genuinely installed
package. Policy identity/expected version are in reports and archive identity;
the coordinator forwards them and rejects missing, mixed-policy or mixed-version
children alongside existing digest, freshness, outcome and cleanup guards.
Source/content linkage remains distinct from independently attested provenance.
Old reports missing policy identity cannot satisfy this new gate.

Safe current rehearsal (no registry submission):

```sh
mkdir -p work
node scripts/release-readiness.mjs
node scripts/release-readiness.mjs --json > work/readiness.json
npm pack --dry-run --ignore-scripts
npm run verify:package
node --test scripts/tests/*.test.mjs
```

Create `work/` before redirecting JSON in a fresh checkout. The readiness command
itself writes no file, requests no credentials and makes no network call. It
inspects current manifest/metadata/check availability, records checkout SHA and
lists required source checks; it does not claim to execute them or inspect an
archive, account or registry. Passing preparation exits zero so development CI
stays green. It reports `publication.status: blocked`, `eligible: false`; missing
NVDA, final human accessibility, authorized manifest/candidate preparation, exact
artifact review and final owner operation authorization remain pending. A
hypothetical public manifest alone cannot turn that assessment release-ready.

Use the earlier **development** exact-archive commands to rehearse real installed
verification without changing the package. All old evidence remains retained;
no raw archive is uploaded to public workflow artifacts. Candidate-positive
regressions are isolated, explicitly synthetic manifest/fixture objects in tests,
not real source-verified release artifacts or manufactured Git provenance.

Future procedure requires a separately authorized preparation PR:

1. Owner/Lead explicitly authorize coherent version/private/lock migration and
   creation of an actual local 0.1.0 candidate. This task grants neither.
2. Update actual manifest/lock, review release notes/onboarding/metadata, and commit
   the approved changes with clean relevant source. Keep final publication blocked.
   Deliberately review CI/test policy expectations for that new baseline; current
   default development guards must not be silently disabled.
3. Run source unit/type/lint/format/infrastructure and website checks. Build once
   and locally pack into owned scratch with scripts disabled after the build;
   record the actual digest. Do not upload/install from an invented synthetic
   manifest or use source SHA as proof of independently attested build provenance.
4. On that authorized clean source only, use explicit candidate verification:

   ```sh
   node scripts/verify-exact-artifact.mjs \
     --policy release-candidate \
     --expected-name @michael-garcia-95/react-simple-charts \
     --expected-version 0.1.0 \
     --artifact path-to-approved-local-0.1.0.tgz \
     --sha256 <64-character-archive-sha256> \
     --source-sha <40-character-clean-checkout-sha>
   ```

   The same policy flags work with exact-package, consumer and browser-smoke
   entry points. They reject today's development package. Legacy
   `npm run verify:package` deliberately remains development-only; use the exact
   package gate for the approved candidate rather than repacking through it.

5. Complete deferred NVDA + Firefox and final human accessibility assessment.
   Owner reviews exact source/artifact, digests, public access, version, changelog,
   dist-tag, account readiness and limitations. Obtain authorization for the exact
   manual 2FA operation in separate work. There is no executable publication
   command, publisher workflow or registry-write capability here.
6. Perform post-publication registry-byte/tag/access and consumer verification only
   after a separately authorized publication actually occurs. Assign the changelog
   date afterward. Tags/releases and subsequent staging/OIDC need their own scope.

Ordinary CI adds only the lightweight read-only readiness command and policy tests;
its matrix/permissions are unchanged. Existing development browser and exact
workflows stay in development policy, retain archive exclusions, and cannot publish.
CI success is preparation evidence, never release authorization.

## First local release candidate — M06-T06B3

Only `feat/m06-t06b3-release-candidate` is authorized to prepare the actual
`@michael-garcia-95/react-simple-charts` manifest at `0.1.0`, `private: false`,
with public scoped access and matching root lockfile versions. Main is unchanged.
The public API, ESM-only root, peers, dependencies, MIT license, client banner,
embedded maps and six-file allowlist are unchanged. npm has no published package.
A publishable manifest does not grant permission to publish or merge it.

Defaults remain development-only (`0.0.0`, private true). Candidate mode is never
inferred from manifest values. CI selects it only for this repository's exact
candidate branch (including same-repository PR heads), using GitHub event context;
other branches and fork PRs retain development selection. The Node 22/24 × React
18.2/19 matrix and read-only verification permissions remain intact. The existing
manually dispatched Pages workflow is unchanged and must not be invoked here.

For source checks on this branch, explicitly set `RSC_VERIFICATION_POLICY=release-candidate`
for `npm test` and `node --test scripts/tests/*.test.mjs`. Independent synthetic
fixtures still test strict development behavior. Run all source/type/lint/format,
site snippet, playground and both production site/base-path checks. Commit the
approved source and ensure relevant source is clean before selecting an archive:

```sh
node scripts/prepare-verification-artifact.mjs \
  --policy release-candidate \
  --expected-name @michael-garcia-95/react-simple-charts \
  --expected-version 0.1.0
```

The helper validates explicit policy and committed clean source, builds once,
and packs with `--ignore-scripts` into a unique ignored `work/candidate/run-*`
directory. It runs the existing strict archive selector, records `identity.json`
and `work/candidate/current.json` with the source SHA, actual filename, SHA-256,
byte size, per-file inventory/digests, Node/npm/platform and blocked publication.
No raw archive is committed or uploaded. Source/content comparison does not
establish independently attested build provenance.

Use that one archive, digest and full source SHA with the existing
`verify-exact-package.mjs` and `verify-exact-artifact.mjs` entry points and the
explicit candidate flags shown above in T06B2. Do not rebuild or repack between
gates. CI's `verify-prepared-artifact.mjs package|browsers|all` wrapper requires
its explicitly selected environment policy to match the retained identity;
it forwards the exact path/digest/source and policy flags without packing.
The candidate package gate also preserves the React/DOM subpath externalization
probe from the legacy development gate. `npm run verify:package` remains strictly
development-only and is expected to reject this branch, not count as a passed check.

The coordinator uses strict six-file inspection, exact checkout bytes and tracked
embedded maps, credential checks, archived API/declarations/SSR, all four genuine
Vite/Next × React 18/19 installed consumers and 15 scenarios in each of Chromium,
Firefox and WebKit. Parent/child identities, digests, policy/version, freshness,
complete outcomes and cleanup stay mandatory. A local unavailable engine is a
failed/blocked consolidated gate. Final-head GitHub Actions browser and exact
artifact success is required before claiming full candidate verification.

Read-only candidate assessment:

```sh
node scripts/release-readiness.mjs --json \
  --policy release-candidate \
  --expected-name @michael-garcia-95/react-simple-charts \
  --expected-version 0.1.0
```

It checks selected manifest, lockfile and metadata/entry-point availability and
reports the expected inventory. It does **not** ingest archive evidence or execute
source gates: inspect completed CI/JSON evidence separately. Manifest preparation
can pass while `publication.status` remains `blocked` and `eligible` remains false.
No option can confer publication authorization.

Remaining gates: Development Lead PR review; Windows NVDA + Firefox across all
five charts; final human accessibility assessment and resolution of material
barriers; final source/artifact digest and package review; owner npm-account
readiness; explicit authorization for the exact manual-first 2FA publication;
and post-publication registry-byte/tag/access and consumer verification. No manual
NVDA/native Windows result is claimed. The planned first manual publication does
not automatically have GitHub OIDC provenance. No publication-capable workflow,
credentials, new release permissions, tags, releases or deployment are introduced.
The 0.1.0 changelog remains unpublished and undated. Existing compatibility limits
remain: no verified older Node minimum, universal Safari/mobile/device support,
Turbopack, strict-CSP guarantee or accessibility certification.
