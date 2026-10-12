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
