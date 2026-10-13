# M06-T06A: publishing security architecture and runbook

> **M06-T06B3 candidate branch:** Local 0.1.0 / `private: false` preparation,
> lock synchronization and verification are authorized only on
> `feat/m06-t06b3-release-candidate`. Main remains unchanged; npm publication,
> staging, registry writes, tags/releases, deployment and merge are not authorized.
> Publication remains **NO-GO**. Historical records below retain their original
> outcomes and T06B2 boundaries. See the
> [candidate execution guide](VERIFICATION_EXECUTION.md#first-local-release-candidate--m06-t06b3).

**Proposal for Development Lead and owner review; no operational approval.**
Official documentation reviewed **2026-10-12**. Recommendations below are future
controls, not assertions about configured accounts. Documentation acceptance does
not authorize configuration, staging, placeholders, publication, tags, releases,
deployment, merging or M06-T07. No credentials are requested or recorded.

## M06-T06B2 historical planning approval and boundary

Lead/owner now approve **manual, owner-controlled first publication with npm 2FA**
for planning. No publishing token is needed; the first manual publication does not
receive automatic GitHub OIDC build provenance. Future trusted publishing and
controlled staging remain options requiring later approval. This selects original
option A for planning, without authorizing its execution or replacing its risks.

Initial target 0.1.0, Semantic Versioning, latest-line maintenance/GitHub Issues
support without response guarantees, and conservative React/TypeScript/framework/
focused-engine support are approved for planning in [release policy](RELEASE_POLICY.md).
The owner confirms npm michael-garcia-95 control, 2FA enabled, recovery codes secured,
no npm access tokens ever created and GitHub Private Vulnerability Reporting enabled.
These confirmations are supplied by the owner, **not independently verified account
settings**. No credentials or recovery material are requested or recorded.

The actual package stays private at 0.0.0. Version/private/lock changes, creation or
distribution of a genuine candidate, registry operations, tags/releases, automation,
trust/settings changes and the exact publication operation remain unapproved.
Manual NVDA + Firefox is deferred to final pre-publication validation and still
required; final human accessibility and exact artifact/operation review remain
outstanding. [Release-aware verification](VERIFICATION_EXECUTION.md#release-aware-preparation--m06-t06b2)
implements policies/readiness only. It adds no publisher or account operation.

The original baseline, alternatives, official-doc review and validation below are
historical/proposed architecture. Subsequent OIDC/staging permissions, toolchain,
trust window, retention and incident/recovery details are still proposals.

## Baseline and recommendation

Fetched `origin/main` and started this branch with a clean worktree at exactly
`7d6265c7e6fdc6c394d10b5b948830e23b898139`. Read AGENTS.md,
[release policy](RELEASE_POLICY.md), [open decisions](OPEN_DECISIONS.md),
[draft changelog](../CHANGELOG.md), [readiness assessment](M06_RELEASE_READINESS.md),
[identity](M06_PACKAGE_IDENTITY.md), [distribution evidence](M06_DISTRIBUTION_COMPATIBILITY.md)
and [architecture](ARCHITECTURE.md). Historical readiness findings are superseded
only by the explicitly settled later decisions. The package remains
`@michael-garcia-95/react-simple-charts`, `0.0.0`, `private: true`, with public
publishConfig. Manual accessibility and final operational approval remain gates; policy planning
approval is recorded above.

Recommend **A: one owner-interactive, 2FA-authorized first real release**, then
**GitHub Actions stage-only OIDC and owner npm 2FA approval** for subsequent releases.
This avoids an unnecessary public placeholder and permanent automation credentials.
The tradeoff is no automatic GitHub build provenance for the local first release.
If first-release provenance is mandatory, do not silently use A: review B's
placeholder and CI restaging prerequisites first. A single owner can review and
approve without inventing a second maintainer or buying environment features.

## First-publication decision matrix

The [staging guide](https://docs.npmjs.com/staged-publishing/) confirms that a new
package's first staging operation creates public `0.0.0-stage`; candidate contents
remain nonpublic until approval. This is a registry write, not a private reservation.

| Dimension                 | A: interactive first real release                                                                                                 | B: initial staged bootstrap                                                                                                                   | C: other supported approach                                                                                           |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Public visibility         | Actual approved tarball, manifest and README become public at publication; no placeholder                                         | Name and placeholder version are public immediately on staging; candidate bytes become public on approval                                     | Owner-interactive staging and 2FA approval of the real candidate also creates the same placeholder; it is a B variant |
| Ownership                 | Owner must control actual npm personal scope and be authorized to publish; GitHub identity is insufficient                        | Same scope control, publish access and account 2FA; package administration needed for subsequent trust setup                                  | No documented package-free pending-publisher registration was established in the reviewed npm guidance                |
| 2FA                       | Owner authenticates and completes publication challenge; no bypass token                                                          | Account 2FA enabled; staging itself has no challenge; approval requires 2FA                                                                   | Same as B variant; token-based CI bootstrap increases credential exposure                                             |
| First-release provenance  | Local interactive publish has no automatic GitHub provenance; never claim otherwise                                               | Local bootstrap candidate has no automatic CI provenance; a later OIDC-built/staged candidate can receive provenance, subject to verification | Supported CI token plus provenance exists, but adds sensitive publishing credentials and is not recommended           |
| Versions and registry     | Real version becomes immutable; initial version and dist-tag require approval                                                     | Public placeholder consumes `0.0.0-stage`; pending candidate reserves its version; reject before restaging the same version                   | No zero-write bootstrap shortcut is assumed; an unrelated dummy release consumes another permanent version            |
| Risks and recovery        | Owner workstation/session compromise; review exact bytes before approval, revoke sessions on incident, correct with a new version | Placeholder is publicly observable/installable; rejection does not erase it; accidental approval exposes real contents                        | Additional tokens, dummy versions and cleanup add risk without a useful release                                       |
| One-maintainer complexity | Lowest bootstrap complexity; accept and document first-release provenance exception                                               | More operations, placeholder consent, stage-ID tracking and possible rejection/restaging                                                      | No better officially documented risk-free alternative found; retain A unless owner requirements justify B             |

### Proposed bootstrap sequence (future authorization required)

1. Owner privately verifies scope control, account 2FA/recovery and authorized
   package administrator. Record only confirmation and date, never credentials.
2. Complete deferred NVDA/human accessibility review, resolve final release evidence, initial
   version (0.1.0 is approved for planning only), public access and exact dist-tag. A later
   authorized preparation PR updates version/lock/private guards coherently.
3. Verify the approved immutable source and real tarball through the artifact gate
   below. Lead recommends readiness; owner records permission for this exact first
   publication, digest, version and tag, including the provenance exception.
4. Owner uses their own trusted workstation and interactive npm session, submits
   the reviewed tarball with explicit public access and approved tag, and completes
   npm's 2FA challenge privately. No automation token or OTP enters Actions/chat.
5. Verify registry bytes, consumers and tags; record actual release outcome.
   The first release is public and irreversible in the version-reuse sense.
6. Prepare a genuine subsequent release before owner creates trust. Configure only
   the approved stage identity, complete its validation in the two-day window,
   verify provenance and restrict token publishing. Do not invent a release simply
   to beat the expiry; expired trust can be recreated when genuinely ready.

For B, separately authorize the **public placeholder** and candidate staging;
inspect its actual registry metadata and tags rather than assuming the placeholder
is hidden or harmless. Once the package exists, owner may configure trust. To obtain
CI provenance for the first real release, reject the local pending candidate with
2FA, confirm it is absent, then rebuild/check and stage the real candidate through
OIDC before owner approval. Do not approve the local candidate while claiming CI
provenance. Whether this exact bootstrap/restaging path meets trust validation and
retains attestations through approval needs resolution before use; no registry
experiment is authorized here. Deleting the placeholder is a separate operation
subject to npm policy, not automatic cleanup.

## Intended trust and permission model

Confirmed current prerequisites from [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/):
GitHub-hosted runners, Node >=22.14.0 and npm >=11.5.1; staging additionally needs
npm >=11.15.0. Proposed exact identities and restrictions:

| Boundary                | Proposed configuration                                                                                                                   |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub owner/repository | `michael-garcia-95` / `react-simple-charts`                                                                                              |
| Workflow identity       | `.github/workflows/npm-stage.yml`; enter `npm-stage.yml` in npm, including extension; file does not exist in this task                   |
| Environment identity    | `npm-staging`, exact case, if owner adopts it; must match job and npm trust                                                              |
| Runner/toolchain        | GitHub-hosted `ubuntu-24.04`; propose exact Node 24.19.0 and npm 11.21.0, subject to approved-toolchain compatibility validation in T06B |
| GitHub job permissions  | `contents: read` and `id-token: write` only on staging job; other permissions absent; verification jobs have no OIDC                     |
| npm allowed actions     | Stage only; direct `npm publish` disabled; independent `npm dist-tag` permission disabled                                                |
| Human operations        | Owner's authorized npm session reviews/downloads, approves/rejects with 2FA, and separately authorizes tag corrections/settings          |
| Existing workflows      | CI, browser verification and Pages remain independent and unchanged; no reusable publishing call or new release credential               |

[GitHub OIDC](https://docs.github.com/en/actions/concepts/security/openid-connect)
lets a job request a signed identity JWT. npm verifies the configured workflow
identity and exchanges it for a short-lived restricted credential. It authenticates
the job, not the safety of its scripts or output. Never log, save or forward these
credentials; compromised code in the authorized job can exercise its authority.
No fallback npm write token, NODE_AUTH_TOKEN secret, login step or token bypass is
allowed in the proposed release job. Public dependencies need no private read token.

New trust must complete a successful publish within **two days** to bind immutable
repository identity; saving settings does not validate trust. npm's wording does not
clearly establish whether stage submission alone satisfies this requirement. Plan
conservatively for OIDC staging **and owner-approved live publication** within the
window; obtain authoritative clarification of stage-only validation in T06B before
configuration. Expiry requires deletion/recreation; no direct-publish fallback.

Recommended workflow safeguards: owner manual dispatch from main only, validated
full SHA equal to the approved source, serialized release concurrency, timeout,
reviewed actions pinned to full commit SHAs, checkout without persisted credentials,
no untrusted PR events or input interpolation into shell, no release-build caches.
Restrict dispatch/ref and checkout separately: an environment rule checks the run
ref and does not prove a user-supplied checkout SHA is approved. Refuse forks,
non-main workflows, changed manifest/digest, failed checks or unapproved artifacts.
Keep build/test dependencies out of the OIDC job where practical; stage only the
verified artifact from the same approved run, with no rebuilding or lifecycle hooks.
T06B must ensure attestation source SHA describes the actual checked-out source;
do not dispatch at one commit and attest a different input checkout.

### GitHub environments for one maintainer

[Official environment restrictions](https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments)
allow public-repository branch restrictions and required reviewers on GitHub Free;
private-repository reviewer/wait-timer availability differs. No paid feature is
assumed. Owner must confirm actual visibility, plan and enabled controls; public
source is also necessary for automatic npm provenance.

Recommend selected branch `main`, owner reviewer and disabled administrator bypass
where supported. Prevent-self-review blocks the sole owner from approving their own
dispatch: use self-review only as an extra owner checkpoint, or require a separately
available reviewer if the owner chooses separation of duties. Do not assert that a
single person provides two-person control. If environment approval is unavailable,
manual dispatch plus npm stage-only permissions and owner 2FA still enforce the
publication boundary; document that staging lacks the extra GitHub review gate.
No environment, branch protection or repository setting is changed here.

## Artifact security and approval evidence

This is a proposed release procedure, not a claim that baseline evidence authorizes
new bytes. T06B must adapt the current verifier's `0.0.0`/private assertions to an
explicit approved release manifest without removing inventory/API/security checks.
M06-T06B1 implemented the explicit same-archive path; M06-T06B2 adds candidate
manifest policy without creating a candidate. Development runners still pack by
default. Future authorized candidate checks must explicitly select the same archive
and candidate policy, never certify a different rebuild or mixed-policy result.

1. Record source SHA, reviewed PR, clean status, lockfile hash, workflow/action
   SHAs, run ID/attempt and exact Node/npm/OS/tool versions. Fetch/check the approved
   main commit; refuse dirty/untracked source that could enter the archive. Pin
   dependencies through `npm ci`, not an unrecorded update. Review lifecycle scripts
   and dependency changes; isolate any required installation/build scripts.
2. Run `npm run typecheck`, `npm run test:types`, `npm run lint`,
   `npm run format:check`, `npm test`, both existing Node script test suites and
   `npm run verify:package`. Retain the four Node/React CI results, site snippet and
   local site/build checks required by CI. Site builds do not authorize deployment.
3. Build once under the approved toolchain, then use real `npm pack --json
--ignore-scripts` into an isolated artifact directory. Record pack JSON,
   compressed SHA-256 and SHA-512 SRI, size and per-file hashes. A dry run is an
   inventory aid, never proof of archive bytes. Check expected public name/version,
   public access, canonical repository, license, metadata and approved tag.
4. List gzip/tar entries before extracting in a disposable directory. Reject
   traversal, absolute paths, duplicate entries, symlinks/hardlinks, unexpected
   permissions or extra payloads. Exact inventory: `package/LICENSE`,
   `package/README.md`, `package/package.json`, `package/dist/index.js`,
   `package/dist/index.d.ts`, `package/dist/index.js.map`. Compare each byte with the
   approved build. Preserve five root named exports, declaration/source contract
   parity, no internal subpaths/CommonJS/default export, `use client` and external
   React/DOM/d3 imports. Maps must contain only approved tracked public sources,
   relative paths and matching embedded content; inspect all packed files for
   accidental secrets. Pattern scans cannot guarantee absence of secrets.
5. Review runtime/transitive dependency inventory, peer deduplication, licenses,
   `npm ls --all`, `npm audit --omit=dev --json` and full `npm audit --json`.
   Advisory exceptions require documented owner review, not silent suppression.
   No bundled dependencies are expected. Locking the build does not lock downstream
   consumers' transitive resolution; test the declared ranges and record resolutions.
6. Install that tarball into disposable genuine Vite/React 18.2.0 and 19.3.0 and
   Next 14.2.35/React 18.2.0 and Next 16.4.0/React 19.3.0 consumers. Run strict
   declarations, production builds, SSR/hydration/client-reference, interaction and
   axe checks. Run focused Chromium/Firefox/WebKit production-fixture checks and
   record versions. Blocked mandatory checks block release; historical passes or
   automated checks cannot replace pending human accessibility evidence.
7. Freeze the verified tarball and evidence manifest. Owner staging authorization
   names commit, run, package/version, access, tag and digest. The staging job checks
   the digest again and submits this tarball, never a source directory repack.
   Record the returned stage ID. Do not overwrite evidence on retries.

Local verification is useful but cannot approve a rebuilt CI artifact by implication.
Use two clean builds to compare archive and per-file hashes; investigate timestamp,
path or toolchain differences rather than claim bit reproducibility without evidence.
If bytes differ, reverify and explicitly approve the CI tarball. Prefer the CI-built
candidate as canonical for OIDC provenance. Transport artifacts only from the exact
approved workflow run/attempt, verify digest at each boundary, and protect approval
records from subsequent edits. Any source/tool/action/artifact change invalidates
approval. A digest proves identity, not that the artifact is safe.

## Owner approval and failure runbook for future staged releases

After staging authorization, the owner uses `npm stage list`, `npm stage view
<stage-id>` and `npm stage download <stage-id>` in their own session. Match the
stage ID to the recorded run/source, name/version/access/tag and digest; inspect the
**downloaded staged contents**, not only a screenshot or CI summary. Record final
explicit publication approval only after matching bytes and checks. Owner then
uses `npm stage approve <stage-id>` or npm's web approval, completing 2FA privately.
CI never approves. GitHub review approval cannot substitute for npm approval.

The [npm stage CLI reference](https://docs.npmjs.com/cli/v11/commands/npm-stage/)
confirms rejection also needs 2FA, pending versions conflict with published versions,
and a staged tag cannot be changed without rejection/restaging.

| Event                                   | Safe response                                                                                                                                                                                                   |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Owner rejects contents or tag           | Do not approve. Owner rejects exact stage ID with 2FA; confirm absence, retain audit evidence, correct and reverify. Placeholder cleanup is separate                                                            |
| Staging fails or times out              | Query owner-visible staged list/details and registry before retry; recover existing ID if bytes match. Never assume no write occurred                                                                           |
| Approval/publication fails or times out | Check stage and public version/integrity/tags. If published and matching, record success without republishing; if pending, owner may retry approval of the same verified ID                                     |
| Authentication/trust expiry             | Stop, inspect exact identities/toolchain/runner and validation deadline; owner recreates trust only under separate permission. Never widen permissions or add a bypass token                                    |
| Same pending version needs correction   | Reject and confirm removal first; stage tag changes require this. Reuse only an unpublished version proven available; new bytes need new approval                                                               |
| Version already public                  | Never overwrite or reuse, even after unpublish. Prepare a new reviewed patch/minor according to release policy; no movable source tags                                                                          |
| Wrong public dist-tag                   | Owner explicitly authorizes moving/removing tag, checks target is a verified published version and verifies afterward. CI has no tag permission; a tag correction does not revoke installed bytes               |
| Bad first release/security incident     | No known-good rollback may exist. Stop staging/approval, owner revokes trust/sessions/tokens as needed, privately assesses impact, authorizes warning/deprecation and new corrective release; preserve evidence |

After approval, independently read registry version, dist-tags, tarball integrity and
access, download the public archive and compare approved bytes. Inspect npm
provenance/attestation subject digest, repository, source SHA, workflow and run;
verify signatures/attestations with `npm audit signatures` in a clean installed
consumer as described by [npm provenance verification](https://docs.npmjs.com/generating-provenance-statements/).
Re-run genuine installed registry consumers; record actual date/outcome and any
first-release provenance exception. Stop promotion if evidence mismatches.

[npm unpublish policy](https://docs.npmjs.com/policies/unpublish/) does not guarantee
rollback: reuse of a published name/version is forbidden even after removal;
eligibility depends on time/dependents and other conditions, and full removal can
impose a 24-hour republishing delay. Prefer a separately authorized corrective
release/deprecation; unpublish does not erase caches or transparency records.
No standing emergency publication authority is granted by this proposal.

## Owner account checklist (private confirmation only)

- [ ] Confirm actual npm personal scope ownership and package publish/admin access;
      list authorized maintainers privately. Public GitHub ownership proves neither.
- [ ] Enable and verify [npm account 2FA](https://docs.npmjs.com/about-two-factor-authentication/),
      preferably with more than one securely held supported security key/passkey;
      secure GitHub and recovery email too. Do not put OTPs in logs or command flags.
- [ ] Privately store recovery material safely and confirm backup access. Follow
      [npm recovery guidance](https://docs.npmjs.com/recovering-your-2fa-enabled-account/):
      recovery-code login imposes a 72-hour security hold preventing publication
      and sensitive changes. Plan for owner unavailability; never bypass a hold.
- [ ] After validated trust, adopt [require 2FA and disallow tokens](https://docs.npmjs.com/requiring-2fa-for-package-publishing-and-settings-modification/).
      Confirm stage-only and no independent dist-tag privilege for every trust;
      remove unused publishers and tokens. OIDC does not need a stored write token.
- [ ] Select private vulnerability intake. Recommend
      [GitHub private vulnerability reporting](https://docs.github.com/en/code-security/how-tos/report-and-fix-vulnerabilities/configure-vulnerability-reporting/configure-for-a-repository)
      for this public repository; owner now confirms it enabled, without independent
      settings verification. Do not solicit sensitive exploit details in Issues.
- [ ] Monitor npm publication/settings notifications, unexpected staged versions,
      maintainers, trust entries, dist-tags, Actions activity and vulnerability
      reports. Review before each release and on notification; record an incident
      contact route and recovery process, not secrets. Suspected compromise pauses
      approval and triggers owner containment, support contact and reviewed fixes.

## Outstanding decisions and separate M06-T06B

Planning decisions above are approved; remaining operational items are **unapproved**:

1. A is selected for planning with no automatic first-release GitHub OIDC
   provenance. No placeholder or B operation is authorized. Future OIDC/staging
   remains separate work: resolve staging trust-validation
   semantics and attestation persistence with current authoritative guidance.
2. Scope/2FA/recovery/no-token/private-intake confirmations are recorded above.
   Recheck actual access before an authorized operation; monitoring, incident,
   owner-unavailability and any future trust/token restrictions need review.
3. Approve exact workflow/environment identity, stage-only/no-tag permissions,
   GitHub feature availability and self-review/bypass tradeoff. No two-person claim.
4. Approve and validate pinned Node/npm/actions, archive identity retention, evidence
   retention duration (recommend at least one year for release records), canonical
   artifact transfer/distribution and final operational check policy. Exact-tarball
   consumer integration is already implemented; it grants no operation approval.
5. Version/maintenance/support planning is settled. Exact dist-tag, deferred NVDA
   results, final human accessibility review, first-release timing and corrective-release
   authority remain outstanding. Every registry action still needs specific owner
   authorization.

M06-T06B1/B2 implement exact-artifact inputs and release-aware verification. Later
separately authorized operational preparation must validate the pinned
staging-capable toolchain; design/test fail-closed SHA/digest/ref gates without
registry writes; resolve official documentation ambiguities; prepare a separately
reviewable workflow implementation and account setup checklist. Creation/activation
of that workflow, trust/settings changes, bootstrap and publication each require
explicit scope/authorization. T06A creates none of them and does not begin T07 or
manual NVDA work.

## Documentation validation

This task validates documentation and unchanged repository safeguards, not live
OIDC, staging, 2FA, account settings or release readiness. Exact executed checks and
final-head CI status are reported in the PR and handoff. No dedicated Markdown lint
or link-check command exists in package scripts; use existing Prettier plus a
bounded local link/anchor check and official-page retrieval, recording limitations.
No runtime/API, lockfile, package metadata or executable workflow change is intended.

Local results on Node 24.19.0 / npm 11.9.0:

| Exact command/check                       | Result                                                                                   |
| ----------------------------------------- | ---------------------------------------------------------------------------------------- |
| `npm run format:check`                    | Pass, repository-wide Prettier Markdown/code formatting                                  |
| `npm run lint`                            | Pass, ESLint with zero warnings                                                          |
| `npm run typecheck`                       | Pass                                                                                     |
| `npm run test:types`                      | Pass                                                                                     |
| `npm run verify:package`                  | Pass on permitted rerun: real archive, six files, 82,388 packed / 354,734 unpacked bytes |
| `python work/m06-t06a/check-doc-links.py` | Pass: 26 local links/anchors across the two changed documents                            |
| `git diff --check`                        | Pass                                                                                     |
| Baseline byte/scope assertions            | Pass: only two documentation files; package 0.0.0/private=true; manifest/lock unchanged  |

The initial sandboxed archive verifier failed parsing empty `npm pack` stdout;
the permitted rerun passed without any repository/script change. Official linked
pages were retrieved through the web tool; this is a bounded documentation review,
not an exhaustive HTTP/redirect/anchor crawler. No dedicated Markdown semantic
linter is configured. Local unit, full consumer and three-engine suites were not
rerun for documentation-only changes; final-head existing PR CI/browser runs are
reported separately and must not be inferred from historical evidence. The local
npm version is below staging's minimum, so no staging capability is claimed.
Lock SHA-256 remains
`45c64ef2c602a4a4a5e90a2f0bb7e0f319ee6b47fbe24341695f2c356880f84e`.
No registry writes, repository/npm settings changes, executable publication workflow,
CI permission escalation, runtime/API changes, tags, releases or deployment occurred.
