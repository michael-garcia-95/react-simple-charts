# Release and maintenance policy

> **Historical preparation record.** Unpublished, NO-GO, unmerged and pending-test
> statements below describe their original milestones. For the October 13, 2026
> publication and current follow-up boundaries, see the
> [post-publication record](M06_POST_PUBLICATION.md). Original evidence identities
> and outcomes are retained; historical readiness scripts are not registry status.

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

> **M06-T06B3 candidate branch:** Local 0.1.0 / `private: false` preparation,
> lock synchronization and verification are authorized only on
> `feat/m06-t06b3-release-candidate`. Main remains unchanged; npm publication,
> staging, registry writes, tags/releases, deployment and merge are not authorized.
> Publication remains **NO-GO**. Historical records below retain their original
> outcomes and T06B2 boundaries. See the
> [candidate execution guide](VERIFICATION_EXECUTION.md#first-local-release-candidate--m06-t06b3).

**Status: local preparation approved in M06-T06B3; publication is not authorized.**
Initial public release target: **0.1.0**, unpublished. The separate candidate branch
uses `@michael-garcia-95/react-simple-charts`, version `0.1.0`, `private: false`;
main remains unchanged.
This document does not authorize publication, staging, tags, GitHub releases,
credentials, trusted publishers, publishing workflows or deployment. M06-T06
security preparation and M06-T07 publication require separate authorization.

## Decisions and versioning

Settled architecture and identity are recorded in [open decisions](OPEN_DECISIONS.md)
and [architecture](ARCHITECTURE.md). Versioning, maintenance and conservative supported-environment conventions below
are approved for planning. M06-T06B3 separately authorizes local manifest/candidate
preparation only on the feature branch. Distribution and the final publication
operation remain unapproved.

Use [Semantic Versioning](https://semver.org/). After 1.0.0, compatible fixes
increment patch, compatible additions increment minor and incompatible public
contracts increment major. Public contracts include root exports, prop/types,
callback payloads, documented data/interaction behavior and supported environments.

During 0.x, preserve compatibility within a minor line: `0.1.1` fixes a defect
without requiring consumer migration; `0.2.0` may add features or break contracts.
Every breaking minor must say **Breaking changes**, explain before/after behavior
and provide migration instructions. A change to required peers, compiler minimum,
exports or supported environment can be breaking even without a renamed prop.
Deprecate before removal where practical; do not hide breaking changes in patches.
Correcting a defect can still require a minor if users must migrate.

Release compatible bug, accessibility, security or packaging fixes as patches;
release additive APIs and deliberate behavior changes as minors. Documentation-only
edits normally need no npm release unless packaged documentation needs correction.
There is no fixed release calendar. A stable, reviewed contract and sustainable
support scope should precede a separately approved 1.0.0.

0.1.0 acknowledges early API evolution without pretending the implemented five
families are placeholders. Starting at 1.0.0 offers stronger stability expectations;
an opt-in `0.1.0-beta.1` can gather feedback but adds another release to maintain.
Both alternatives require approval. Prereleases are real publications; keep them
off `latest` under an explicitly approved opt-in dist-tag.

## Changelog, notes and source identity

Maintain [CHANGELOG.md](../CHANGELOG.md) for humans, with Unreleased and dated
published entries using Added, Changed, Deprecated, Removed, Fixed and Security
only when relevant. Summarize consumer effects and link supporting PRs/issues;
avoid a raw commit dump. Keep proposed entries explicitly unpublished and undated.
Assign an actual release date only after registry publication is verified.

For each authorized release, record the exact source SHA, package/version,
tarball integrity, tested scope, limitations and migration guidance. Proposed
immutable annotated Git tags use `v0.1.0`; tag the approved release source and
never move a published tag. GitHub release notes should reuse the changelog and
link verification evidence. Choose tag/publication ordering in the approved
runbook; a Git tag or GitHub release alone is not proof of npm publication.

## Maintenance and support

One independent maintainer triages reports, reviews contributions, updates
dependencies when justified, reproduces defects, runs release checks and keeps
docs/notes accurate. Prioritize critical regressions/security and barriers in
documented behavior, then ordinary bugs and feasible enhancements. Maintain the latest supported release line; older lines receive no automatic
backport commitment. Record any exceptional backport and support-scope change.
There is no paid support, response-time SLA or promised feature schedule.

[GitHub Issues](https://github.com/michael-garcia-95/react-simple-charts/issues)
is the primary ordinary support channel. Request the package version, exact React/
TypeScript/browser or SSR environment, minimal reproduction and expected/actual
behavior. Mark duplicates and explain scope limits. Do not ask reporters to post
credentials or sensitive exploit details publicly. The owner confirms GitHub Private Vulnerability Reporting enabled. This is an
owner confirmation, not independently verified configuration; use the repository
[private advisory route](https://github.com/michael-garcia-95/react-simple-charts/security/advisories/new)
for sensitive reports rather than public Issues.

## Supported contracts versus tested environments

Support for documented five-family contracts within the bounded evidence below
is approved for planning; broader support requires evidence and approval. Tested means
an executed configuration passed particular checks, not every configuration in a
peer range. [Distribution compatibility](M06_DISTRIBUTION_COMPATIBILITY.md) is the
evidence record; retain versions and limitations in future release notes.

- React/DOM peers remain `^18.2.0 || ^19.0.0`; installed consumers verified 18.2.0
  and 19.3.0. Existing CI exercises Node 22/24 × React 18.2/19 and reports resolved
  versions. A floating CI label does not verify every React 19 release.
- TypeScript 5.4.5 (Next 14) and 6.0.3 (other fixtures) passed strict installed
  declaration checks. `NoInfer` needs TypeScript 5.4 or newer; earlier compilers
  are unsupported by the declarations, and every newer compiler is not verified.
- Verified consumers: Vite 8.3.4 with both React versions; Next 14.2.35/React 18.2.0
  and Next 16.4.0/React 19.3.0, App and Pages Router using Webpack. Local consumer
  Node was 24.19.0. No older consumer Node minimum or Turbopack support is established.
- Focused installed-package results passed local Chromium 151.0.7922.173 and CI
  Chromium 156.0.8078.4, Firefox 157.0 and Playwright WebKit 27.2. These are engine
  checks, not physical Safari/macOS/iOS or universal browser compatibility.
- Physical devices, other browser versions/configurations, native forced colors/
  zoom and strict CSP remain unverified. Touchscreen emulation is event evidence.
  ES2022 ESM/SVG and pointer/focus APIs are required; responsive graphical mounting
  needs ResizeObserver, with explicit dimensions or accessible alternatives otherwise.
- Explicit dimensions support deterministic SVG SSR; responsive/local-time modes
  initially use placeholders/tables. Independent hydration roots need consistent
  distinct identifier prefixes. The client entry is not a public server-helper API.
- Manual Windows NVDA + Firefox across all five families is deferred to final
  pre-publication validation and remains a release gate; human accessibility
  review remains pending. Axe incomplete SVG contrast/empty-table findings require
  review. Automated results do not prove announcements or WCAG certification.

## First-publication readiness and approval

This is a future checklist, not completed release authorization:

- [x] Lead and owner approve initial 0.1.0, versioning, maintenance and bounded
      support policy **for planning only**; decisions are in OPEN_DECISIONS.
- [ ] Deferred NVDA + Firefox and final human accessibility results/material barriers
      are reviewed using the existing [manual plan](M06_SCREEN_READER_TEST_PLAN.md).
      This remains a release gate; no completion or waiver is recorded here.
- [x] Manual first-publication strategy and lack of automatic GitHub OIDC
      provenance approved for planning; owner confirms account/scope/2FA/recovery,
      no access tokens ever created and private reporting enabled. These are
      owner statements, not independently verified settings.
- [ ] Owner rechecks access/security before the separately authorized operation.
      Any subsequent trusted-publisher/staging configuration and corrective-release
      authority need separate approval; no trust is needed for manual bootstrap.
- [ ] Separately authorized release preparation updates version/lock and private
      guard coherently, with release-aware verification retaining genuine checks.
- [ ] Clean exact source SHA passes applicable CI, formatting, type/lint/tests,
      package/archive and real installed-consumer/browser checks. Inspect current
      runtime advisories, license, metadata, peer deduplication, client boundary,
      source-map allowlist and exact inventory; explain any blocked checks.
- [ ] Owner reviews exact tarball/integrity, public access, changelog, source/tag,
      dist-tag and proposed operation. Draft npm onboarding matches that artifact.
- [ ] Lead recommends readiness and owner explicitly authorizes the specific
      registry action. A stage operation, placeholder, tag or release needs its
      own applicable authorization; merging docs is insufficient.

A short review record in the release PR/runbook is sufficient. No committee or
multiple invented maintainer roles are needed; if Lead and owner are the same
person, record both decisions clearly. Each release, including an urgent fix,
needs owner authorization. M06-T06 should decide whether a narrowly bounded
standing emergency authorization is appropriate; none is granted here.

## Publication-security questions for M06-T06

Official npm guidance reviewed on **2026-10-12**:
[scoped public packages](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/),
[trusted publishing](https://docs.npmjs.com/trusted-publishers/),
[provenance](https://docs.npmjs.com/generating-provenance-statements/),
[staged publishing](https://docs.npmjs.com/staged-publishing/),
[2FA](https://docs.npmjs.com/about-two-factor-authentication/) and
[unpublish policy](https://docs.npmjs.com/policies/unpublish/).
Recheck these moving prerequisites during authorized preparation.

| Question to resolve         | Current guidance and proposed direction                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public scope and ownership  | Owner confirms michael-garcia-95 scope control; recheck actual publish permissions before the authorized operation. This is not independently verified account configuration. Scoped publication must explicitly use public access; current publishConfig already says public, but private remains true. GitHub ownership alone does not establish npm access.                                                                                     |
| First-publication bootstrap | Manual owner-controlled interactive 2FA publication is approved for planning, with no publishing token and no automatic GitHub OIDC provenance. No actual publication is authorized. Trusted publishing/staging is a later, separately approved option.                                                                                                                                                                                            |
| Staging and manual review   | Staging a new package creates a publicly available `0.0.0-stage` placeholder. Candidate contents await approval; staging is still a registry write. Current guidance requires npm >=11.15.0 and Node >=22.14.0, publish access and account 2FA; stage submission itself does not prompt for 2FA, but approval does. Resolve placeholder consent and exact candidate review before any action.                                                      |
| OIDC trust and permissions  | Prefer short-lived GitHub Actions OIDC on GitHub-hosted runners, exact owner/repository/workflow and chosen environment. npm >=11.5.1 and Node >=22.14.0 are required. Job permissions need contents:read and id-token:write; PR CI must stay separate. Decide stage-only versus direct-publish permission and independent dist-tag rights. New trust must validate its first successful publish within two days; do not configure it prematurely. |
| Toolchain                   | Installed Node 24.19.0/npm 11.9.0 meets OIDC minima but not staging's npm minimum. Select and pin a release toolchain meeting both npm guidance and stricter project contributor-tool prerequisites; these are not consumer Node guarantees.                                                                                                                                                                                                       |
| Provenance                  | Public GitHub source/public npm package through GitHub OIDC receives automatic provenance. Check canonical repository.url and actual attestation/source SHA afterward. Provenance establishes origin/build linkage, not security, accessibility or correctness. Resolve first-release provenance if bootstrap is manual.                                                                                                                           |
| Approval and recovery       | Prefer stage-only CI plus owner 2FA review if bootstrap is viable and approved. A protected manual direct-publish job is simpler but needs reliable pre-publication artifact approval. Verify GitHub plan/environment controls for one maintainer, prevent unreviewed PR publishing, pin/review actions and serialize releases. Choose recovery/2FA, token restrictions and private vulnerability intake; do not rely on permanent write tokens.   |

The manual first-publication strategy is approved for planning. Remaining automation
and operational details below are research findings/proposals, not authorizations. No account configuration,
credentials, trusted publisher, registry action or live publishing workflow is
created by M06-T05. This section does not begin M06-T06 implementation.

## Post-publication verification and corrective releases

After a separately authorized publication, independently query the registry for
name/version, public access, dist-tags and integrity; download and inspect the
published archive against the approved bytes/inventory. Verify any available
provenance and record that manual bootstrap has no automatic GitHub OIDC provenance,
then install the registry artifact in pinned consumers and repeat types, build,
SSR/hydration and focused browser checks. Record exact outcomes and actual release
date in notes; monitor Issues for installation and behavior regressions.

For a critical regression, reproduce and assess impact promptly, warn affected
users through the issue/release notes, give a last-known-good workaround where
one exists and prepare the smallest tested correction. Preserve owner approval
even under urgency. Publish a new patch for a compatible correction or a clearly
announced minor if migration is necessary. Never overwrite a published version or
move its Git tag. Deprecation and moving a registry dist-tag to a known-good
version require explicit authorization; no rollback target exists for the first
release until one has been verified. Do not assume unpublish is available or makes
a used version reusable. Prefer corrective versions; document any authorized
deprecation, incident scope, verification and prevention follow-up.

This latest-line, event-driven approach keeps maintenance feasible for one owner.
It trades long-term backport guarantees and a release calendar for clear scope,
compatible patches, visible migration notices and review of the actual artifact.

## Release-aware preparation — M06-T06B2

The actual manifest/lock remain unchanged at private `0.0.0`. Shared manifest
verification now distinguishes default `development` from explicitly selected
`release-candidate` with expected name and approved target `0.1.0`. Candidate
policy requires private false/absent and public scoped access, exact matching clean
source and unchanged archive/API/type/consumer/browser integrity checks. Pure
synthetic policy tests do not create a real candidate or prove its build origin.
The [execution guide](VERIFICATION_EXECUTION.md#release-aware-preparation--m06-t06b2)
provides non-publishing rehearsal and separately authorized future steps.

`node scripts/release-readiness.mjs` reports preparation separately from blocked
publication. It inspects metadata and check availability, not actual gate results,
registry state or live accounts. Publication stays blocked pending authorized
manifest/lock migration, genuine final artifact verification/review, deferred NVDA,
final human accessibility assessment and owner permission for the exact operation.
Post-publication byte/tag/access verification remains future required work.
