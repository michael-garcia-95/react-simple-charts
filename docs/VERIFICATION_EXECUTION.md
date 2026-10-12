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
does not claim success. It is claimed only at startup so an older concurrent run
cannot replace a newer current run when it finishes. Report writes use a temporary
file and rename. `running`, missing, malformed or mismatched reports are never
acceptable release evidence. The browser workflow checks pointer identity, normal
run name, complete outcome and all three engines before accepting the report.

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
