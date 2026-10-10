# GitHub Pages deployment runbook — prepared, inactive

The Development Lead approved GitHub Pages from the existing project repository.
Expected future address: <https://michael-garcia-95.github.io/react-simple-charts/>.
This supersedes the M05-T01 Cloudflare Pages proposal. **Nothing is deployed or
published, and no repository Pages settings have been changed.**

## Paths and reproducible builds

`site/paths.ts` resolves internal root-relative paths against Vite's `BASE_URL`.
External GitHub links and same-page fragments are unchanged. Page detection
strips only the exact base prefix; unknown or lookalike paths show a safe
not-found view. No router or history fallback is needed.

```sh
# Root-based local development and production preview
npm run dev:site
npm run build:site
node scripts/verify-site-build.mjs /
npm run preview:site

# Future GitHub Pages project-path artifact, no upload
npm run build:site:pages
node scripts/verify-site-build.mjs /react-simple-charts/
```

The Pages command uses Vite's supported `--base=/react-simple-charts/` option,
without shell-specific environment assignment. Both commands replace only
`site-dist/`, leaving the library `dist/` and technical `playground-dist/` isolated.
Build the desired mode again when switching. Expected HTML output:

- `site-dist/index.html`
- `site-dist/examples/index.html`
- `site-dist/documentation/index.html`
- `site-dist/about/index.html`
- Hashed JS, CSS and source maps under `site-dist/assets/`

Public page paths will be `/react-simple-charts/`, `/react-simple-charts/examples/`,
`/react-simple-charts/documentation/` and `/react-simple-charts/about/`.
All five existing `#chart-*` gallery anchors remain valid.

## Local subpath verification

Install the isolated browser driver in ignored `work/` as documented in
[M05 interactive examples](M05_INTERACTIVE_EXAMPLES.md). After the Pages build:

```sh
node scripts/serve-site.mjs --base=/react-simple-charts/ --port=4320
# Second terminal, while that server runs:
node scripts/verify-site.mjs --base=/react-simple-charts/
```

The static server mounts the emitted files at the actual subpath, with no SPA
fallback and no root mirror. Chromium requests the real prefixed HTML/JS/CSS,
navigates all four pages and every Home deep link, checks current-page detection,
and rejects root leakage. Requests to `/examples/` and unknown paths return 404.
For root verification use the root build and omit `--base` in both commands.
`RSC_SITE_URL` and `RSC_BROWSER_PATH` can select another QA server/browser.
Evidence remains ignored under `work/visual/site/{root,pages}/`.

CI checks both artifacts on all four existing Node 22/24 × React 18.2/19 jobs.
CI has only `contents: read`; it contains no Pages artifact upload or deployment.

## DEPLOY-T01 workflow and review boundary

The first public deployment is approved in principle. This PR prepares its
infrastructure only. Nothing is live as a result of this change: review, explicit
squash-merge approval, manual settings and an explicit dispatch remain separate.
Do not dispatch, upload an artifact or deploy during implementation or PR review.

`.github/workflows/deploy-pages.yml` has only `workflow_dispatch`. Both jobs require
`github.ref == 'refs/heads/main'`; checkout uses the immutable dispatched
`github.sha`, not a later moving main tip. The build job uses Node 24, npm caching,
`npm ci`, the approved Pages build and existing project-base verifier before
uploading only `site-dist/`. The deploy job depends on build and uses the official
Pages action with the protected `github-pages` environment and its returned URL.
The fixed `github-pages` concurrency group queues runs without cancelling an
active deployment. Failures propagate normally; no continue-on-error is used.

Permissions default to none. Build has only `contents: read`; deploy has only
`pages: write` and `id-token: write`. Checkout does not persist credentials.
`configure-pages` uses its default read-only configuration behavior; automatic
Pages enablement is not requested. No PAT, secrets, SSH keys, custom scripts,
third-party host, custom domain or npm release workflow is introduced.
CI is unchanged: all four Node 22/24 × React 18.2/19 jobs remain read-only.
The workflow uses JSON syntax, a YAML 1.2 subset accepted by GitHub, so focused
Vitest policy checks parse structure with native JSON without another dependency.
Run `npx vitest run tests/deploy-pages.test.ts`; it also runs in `npm test` in CI.

The existing inventory verifier rejects any file outside the four HTML entries
and their referenced hashed JS/CSS and JS source maps. It checks every asset
exists and uses `/react-simple-charts/`. Local evidence is written to ignored
`work/`, outside the artifact. Neither repository source directories, credentials,
node_modules, playground, library dist nor unrelated output is uploaded.
Source maps are intentional existing diagnostics and may embed bundled source;
they are public artifact content, not a promise of source confidentiality.

## First deployment procedure (after review and merge)

1. **Review and merge:** review workflow permissions, tests, inventory and runbook;
   confirm the final PR HEAD passes all four CI jobs. Obtain Development Lead
   review and explicit squash-merge approval. Merge only after that approval.
2. **Pages settings:** an authorized maintainer selects Settings > Pages > Build
   and deployment > Source > GitHub Actions. Leave custom domain empty. These
   settings are manual prerequisites; this task does not change them.
3. **Environment protection:** configure Settings > Environments > `github-pages`.
   Where supported, restrict deployment branches to the selected branch `main`
   (no tags), require a Development Lead reviewer, prevent self-review and disable
   administrator protection bypass. Confirm the repository plan supports these
   protections; document unavailable protections before proceeding. The workflow
   does not bypass protection. Keep existing safeguards enabled.
4. **Manual start:** after explicit dispatch authorization, open Actions > Deploy
   GitHub Pages > Run workflow and select **main**. Record the run URL and
   dispatched commit SHA; confirm it is the approved merged version. A feature
   branch dispatch skips both jobs and cannot publish. Merge/push alone does not
   start this workflow.
5. **Build and deploy:** inspect Node version, npm ci, build and verifier results.
   Confirm only site-dist is uploaded. Approve the environment gate as required,
   then inspect the deployment job. Both jobs must succeed; a skipped or failed
   job is not a successful deployment. Record the environment's deployment URL.
6. **Public validation:** confirm the returned URL is
   <https://michael-garcia-95.github.io/react-simple-charts/> and complete the
   checklist below. Record commit/run, browser/version, viewport, date, actual
   asset URLs and findings. Do not mark the website live before these checks.
7. **Failures:** inspect the failed step and logs. Check Pages source, environment
   branch/reviewer protection, main ref, minimal token permissions, artifact
   inventory and official action status. For 404s check the base prefix and actual
   emitted file paths. For asset failures inspect Network status/MIME and console.
   Fix through a reviewed PR; do not weaken protection or silently ignore errors.
8. **Redeploy/rollback:** for a transient failure, rerun the approved main run only
   after confirming its SHA and authorization; record the new attempt. To restore
   an older approved version, revert the offending change through a reviewed PR
   on main, validate all four CI jobs, obtain merge/dispatch authorization, then
   manually run main again. Do not dispatch an old tag or feature branch to bypass
   the main-only policy. A failed deployment may leave the previous site active;
   check the environment and live content rather than assuming rollback occurred.
9. **Package boundary:** confirm package.json still has `private: true`, version
   `0.0.0`, MIT licensing and exactly five runtime exports. Review Actions to
   confirm no release/publication operation was added or run. `npm pack --dry-run`
   is local inspection; no `npm publish`, release or tag is part of this procedure.

## Reproducible first-live validation checklist

Live validation is a separate task after reviewed merge and explicit dispatch.
Use the actual production origin and project prefix, without a local root mirror.

- [ ] Home `/react-simple-charts/` returns 200 and renders.
- [ ] Examples `/react-simple-charts/examples/` returns 200 and renders.
- [ ] Documentation `/react-simple-charts/documentation/` returns 200 and renders.
- [ ] About `/react-simple-charts/about/` returns 200 and renders.
- [ ] Refresh each nested URL directly; verify native back/forward and navigation.
- [ ] All five actual chart examples render; change shared and family controls,
      reset each family, and verify generated TSX matches the selected values.
- [ ] Copy code and compare clipboard text where browser permission allows it;
      verify the manual-copy fallback when unavailable or denied.
- [ ] Follow every Home-to-gallery link and all five `#chart-*` gallery anchors.
- [ ] Follow all fourteen Documentation table-of-contents links; confirm each
      distinct `#docs-*` fragment targets its named heading. Check documentation
      links back to the gallery. Record the fourteen actual IDs in evidence.
- [ ] Test mobile (375px) and desktop (1440px) navigation, keyboard focus and chart
      controls; inspect layout overflow and current-page navigation state.
- [ ] With DevTools Network cache disabled, reload all four pages; actual JS/CSS
      requests return 200 with correct MIME types under
      `/react-simple-charts/assets/`. Open each referenced asset URL directly.
- [ ] Confirm no incorrect `/assets/`, `/src/` or unprefixed page requests; inspect
      console and page exceptions, with zero unexplained errors.
- [ ] Compare public files with the verified build inventory; probe `.git/config`,
      `.env`, `package.json`, `src/index.ts`, `node_modules/` and playground paths
      under the project prefix. No private/repository files should be served.
      Account for the intentional public source maps described above.
- [ ] Confirm npm remains unpublished by this task; no npm release job or publish
      command ran. Store validation evidence outside site-dist.

For a repeatable Chromium audit, use the isolated driver documented above:

```sh
RSC_SITE_URL=https://michael-garcia-95.github.io node scripts/verify-site.mjs --base=/react-simple-charts/
```

The existing runner checks layouts, controls, generated code, anchors, history,
clipboard and resource/console errors against the chosen origin. Run it only in
that separately authorized live-validation task; retain its ignored work evidence
and complete the manual Network/private-file/package checks as well.

## M05-T03 documentation navigation

The developer reference stays on the existing Documentation page. Native
`#docs-*` links target stable focusable section headings within the current
static document; gallery cross-links use `sitePath` and the approved `#chart-*`
anchors. Both root and project-base artifacts are checked by the extended
Chromium audit. No routing fallback, fifth page, Pages setting or active
deployment workflow is introduced. See [M05-T03 verification](M05_DEVELOPER_DOCUMENTATION.md).

## M05-T04 readiness handoff

The hardening audit expands both emitted-artifact checks and the optional local
Chromium runner to seven widths, nested-page refresh/history, clipboard races,
keyboard/pointer/emulated-touch inspection and local size/readiness measurements.
See [website hardening](M05_WEBSITE_HARDENING.md) for exact evidence and remaining
review blockers. The actual project artifact is served only under the project
prefix; a root mirror is never used to validate it. The four CI jobs retain
read-only repository permissions and both build checks.

The M05-T04 handoff did not activate deployment. DEPLOY-T01 prepares the workflow
above. Confirm the final PR HEAD's four CI results and obtain Development Lead review, explicit
squash-merge approval and subsequent deployment approval before hosting changes.
