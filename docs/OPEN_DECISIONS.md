# Open decisions

This page separates unresolved choices from implemented policies. The package is
`@michael-garcia-95/react-simple-charts`, `0.1.0` / `private: false` on the separate candidate branch and unpublished; main remains unchanged. All
five chart components are implemented. The website is live on GitHub Pages.

## Release and compatibility gates

- **Manual accessibility:** Windows NVDA + Firefox testing across all five
  families is pending, deferred to final pre-publication validation. Follow the [manual plan](M06_SCREEN_READER_TEST_PLAN.md),
  record human results and review material barriers before first publication.
  Automated axe and accessibility-tree results do not establish announcement
  behavior or WCAG certification. Axe's incomplete SVG contrast and empty-table
  checks also require human review.
- **Device and browser policy:** Focused Chromium 156.0.8078.4, Firefox 157.0 and
  Playwright WebKit 27.2 tests passed in GitHub Actions. That engine smoke gate is
  complete for those builds. Physical Safari/iOS, mobile/assistive devices, native
  forced colors/zoom, strict CSP and other versions/configurations remain unverified.
  Any broader claim needs an explicit scope and evidence.
- **Consumer support commitments:** Tested React, TypeScript, frameworks and Node
  environments are in [distribution compatibility](M06_DISTRIBUTION_COMPATIBILITY.md).
  No older consumer Node minimum has been verified. Broader framework/SSR policy,
  including Turbopack, remains open; removal of engines is not evidence of support.
- **Release policy approved for planning:** Initial target **0.1.0**, Semantic
  Versioning, compatible patches, additive/breaking 0.x minors with migration
  documentation, stronger stability from 1.0.0, latest-line maintenance and GitHub
  Issues support without guaranteed response times are approved by Lead/owner.
  See [release policy](RELEASE_POLICY.md) and the [unpublished changelog](../CHANGELOG.md).
  M06-T06B3 separately authorizes local manifest/candidate preparation on the feature branch only.
- **Supported contracts approved for planning:** React 18.2+ within React 18 and
  React 19 under existing peers; TypeScript minimum 5.4. Tested compilers are
  5.4.5/6.0.3, Vite 8.3.4 and Next 14.2.35/16.4.0 with tested App/Pages routing.
  Supported contracts are not proof of every individually supported configuration.
  No consumer Node minimum or universal Safari/mobile compatibility is claimed.
- **First-publication strategy approved for planning:** Manual owner-controlled
  npm publication with 2FA; no publishing token is needed. The first manual
  publication will not automatically have GitHub OIDC build provenance. Future
  trusted publishing/staging requires separate approval and configuration.
- **Owner security confirmations:** Owner confirms npm username/scope control
  `michael-garcia-95`, npm 2FA enabled, recovery codes secured, no npm access tokens
  ever created, and GitHub Private Vulnerability Reporting enabled. These are
  owner statements supplied for M06-T06B2, not independently verified account
  settings. No credentials or recovery material are collected.
- **Operational approval outstanding:** M06-T06B3 authorizes version/private/lock migration and local candidate creation on the feature branch. Candidate distribution, exact final artifact review,
  publication, tags/releases and any staging/trust/settings operation remain
  unauthorized. Manual NVDA + Firefox is deferred until final pre-publication
  validation and remains a gate, alongside final human accessibility assessment
  and owner authorization for the exact operation. The
  [verification execution guide](VERIFICATION_EXECUTION.md#release-aware-preparation--m06-t06b2)
  documents explicit policies and a read-only readiness assessment.

First publication remains blocked by manual accessibility evidence and the separate
release/security/authorization gates. The [release readiness assessment](M06_RELEASE_READINESS.md)
records the original risks; later identity and Node/map/browser decisions below
supersede its unresolved entries. Planning approval does not start M06-T07 or manual NVDA testing.

## Future design choices

These are proposals, not implemented features or delivery commitments:

- Performance budgets, dense-data decimation/virtualization and safe handling of
  numerical spans beyond the current representable geometry limits.
- A stable public theme/token API, measured label placement/collision handling,
  tooltip measurement and richer diagnostics. Current fitting/positioning is estimated;
  oversized Donut center content is clipped and host styles can affect presentation.
- Public pure helpers or a separate server-safe entry. Only the five component
  runtime exports exist today; no internal subpaths are exposed.
- Stacking, interpolation, gradients/custom Area baselines, interactive legends,
  persistent selection, zoom/pan, drilldown and richer polar layouts. Donut has
  ratio and center-content props, but no automatic totals, nested rings, angle
  controls or arc morphing.

## Settled policies and references

| Topic                  | Current decision and reason                                                                                                                                                 |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity and ownership | Personal scoped package, independently maintained; MIT copyright 2026 Michael Garcia. See [identity evidence](M06_PACKAGE_IDENTITY.md).                                     |
| Consumer Node metadata | Removed the restrictive engines field because it came from development tools. Contributor requirements remain documented separately; no untested minimum is claimed.        |
| Source maps            | Retain embedded public library sources and relative paths for debugging. Archive checks enforce the source allowlist and six-file inventory.                                |
| Exports and peers      | ESM-only root, five runtime components and type exports; React/DOM remain external with unchanged React 18.2/19 peers.                                                      |
| Data policies          | Preserve source references/order/duplicates and missing/invalid classification. Cartesian domains, gaps and zero baselines are implemented policies, not pending decisions. |
| Polar policies         | Positive source-order slices, scaled proportions and complete negative rejection. Donut defaults to ratio 0.6; unsafe geometry is unavailable rather than clamped.          |
| Interaction            | One roving entry; keyboard/pointer/touch inspection and source-scoped activation deduplication. Tables retain all source rows in every state.                               |
| SSR and motion         | Explicit dimensions support deterministic SVG; responsive/local-time modes start with placeholders. Animation is optional reduced-motion-aware opacity, not path morphing.  |
| Website hosting        | GitHub Pages at the existing project URL. This supersedes the historical Cloudflare proposal; the deployment workflow is independent of package publication.                |

Detailed policies are in [architecture](ARCHITECTURE.md),
[normalization](DATA_NORMALIZATION.md), [scales](SCALES_AND_DOMAINS.md),
[layout](LAYOUT_AND_AXES.md), [Cartesian geometry](GEOMETRY_FOUNDATIONS.md),
[polar geometry](POLAR_GEOMETRY_FOUNDATIONS.md) and the five chart guides.

## Historical record

Milestone reports and verification results in this directory retain their original
scope, observations and limitations. Earlier statements that families were deferred,
the website was undeployed, identity was undecided or Firefox/WebKit were unexecuted
are historical; the current policies above supersede them. Original local browser
download restrictions still describe that environment, even though CI later passed.

See [five-family integration](M04_INTEGRATION_HARDENING.md),
[website hardening](M05_WEBSITE_HARDENING.md),
[release assessment](M06_RELEASE_READINESS.md),
[package identity](M06_PACKAGE_IDENTITY.md) and
[distribution/browser evidence](M06_DISTRIBUTION_COMPATIBILITY.md).
The [previous decision chronology](https://github.com/michael-garcia-95/react-simple-charts/blob/261285f3a74c7eae5f34174d50f6f648af841a93/docs/OPEN_DECISIONS.md)
remains available in repository history.
