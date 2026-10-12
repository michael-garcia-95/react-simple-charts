# Verification execution and isolated browser prerequisites

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
Current development guards and npm archive construction remain unchanged; no
public-release manifest mode is implemented.

## Exact local development artifact gate — M06-T06B1

This gate verifies **one supplied archive**, without publication, staging or release
approval. The development package stays private at `0.0.0`. Public-version policy
is a future separately approved extension; none is implemented here.

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
- `artifact/selection.mjs`: explicit digest and checkout claim, unchanged private
  development manifest, six-file checkout comparison, tracked embedded source-map
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
