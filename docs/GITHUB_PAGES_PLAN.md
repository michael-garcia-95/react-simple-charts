# GitHub Pages plan — proposed deployment, inactive

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

## Future deployment prerequisites and workflow

**Proposed and inactive; separate approval required.** After Development Lead
review and explicit deployment authorization:

1. Configure this repository's Pages source to GitHub Actions, if permitted by
   the repository's GitHub plan and settings. Do not assume it is already enabled.
2. Add a separate deployment workflow, initially manually dispatched. Build the
   approved SHA with `npm ci` and `npm run build:site:pages`, verify the output,
   and upload only `site-dist/` using the supported Pages artifact action.
3. Use a separate deployment job/environment (`github-pages`), protected approval
   and deployment concurrency. Grant `pages: write` and `id-token: write` only to
   that future deployment job; retain minimal permissions on build/CI jobs.
4. Deploy with GitHub's supported Pages action and check all routes/assets at the
   actual project URL. A push-to-main trigger is a future policy decision.

No such workflow, permission grant, Pages setting, artifact upload, release,
domain purchase or npm publication is part of M05-T02.

A future custom domain may host the project at `/` instead. Rebuild with the
approved base and review canonical/social metadata, DNS, HTTPS and redirects.
Do not mechanically retain the project prefix or change external repository URLs.
No CNAME or canonical URL is introduced before that decision.

## M05-T03 documentation navigation

The developer reference stays on the existing Documentation page. Native
`#docs-*` links target stable focusable section headings within the current
static document; gallery cross-links use `sitePath` and the approved `#chart-*`
anchors. Both root and project-base artifacts are checked by the extended
Chromium audit. No routing fallback, fifth page, Pages setting or active
deployment workflow is introduced. See [M05-T03 verification](M05_DEVELOPER_DOCUMENTATION.md).
