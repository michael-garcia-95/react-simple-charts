# M06-T07B — Main-branch release transition preparation

**Publication: NO-GO.** This task prepares verification for a future separately
approved merge of PR #38. It grants no merge, publication, staging, tag, GitHub
release, deployment, credentials or publishing-permission approval.

## Actual state and intended transition

At task start, the clean candidate branch `feat/m06-t06b3-release-candidate` was
`23cf0ddc23087f995401d9daf906a8aaa835f614`, with package
`@michael-garcia-95/react-simple-charts`, `0.1.0` / `private: false`. Fetched main
was `c8ccce8d9fa8873df56dcb03bddf95ad3a9f13e4`, `0.0.0` / `private: true`.
These are pre-merge snapshots, not permanent assertions about main.

After a separately approved merge, main would contain `0.1.0` / `private: false`.
A technically publishable manifest and passing CI do not authorize publication.
The version, private flag, package payload, dependencies, runtime and API are
unchanged by T07B. Historical milestone records and the original
[owner manual accessibility PASS](M06_MANUAL_ACCESSIBILITY_RESULTS.md) are preserved.

## Constrained read-only CI policy

`scripts/ci-verification-policy.mjs` fixes the repository, package name and
candidate version; it does not select policy from the PR head's package.json.

| Event context in this repository                                                                   | Selected policy                                       |
| -------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Push or workflow dispatch on the approved candidate branch                                         | Fixed release-candidate 0.1.0                         |
| Push or workflow dispatch on main after the transition                                             | Fixed release-candidate 0.1.0                         |
| Same-repository candidate-branch PR targeting main                                                 | Fixed release-candidate 0.1.0, including before merge |
| Ordinary PR targeting main, including a fork, with exact private 0.0.0 main base                   | Strict development 0.0.0                              |
| Ordinary PR targeting main, including a fork, with exact 0.1.0 main base                           | Fixed release-candidate 0.1.0                         |
| Wrong repository/base, unsupported event/ref, missing context or unsupported base manifest/version | Rejected                                              |

For PRs, the workflow passes the GitHub event's base repository and full base SHA.
The selector validates repository/event/main target/PR merge-ref context, fetches
only that immutable base commit with `git fetch --no-tags --depth=1 origin <SHA>`,
and reads its committed package.json with `git show <SHA>:package.json`. It
validates the complete base manifest against one of the two fixed policies.
It does not read moving main, infer from a contributor's manifest, or accept unknown
future versions. Missing/unfetchable base evidence fails the job; there is no fallback.
The verified PR checkout remains the exact head SHA, not the merge preview.

The approved same-repository candidate branch retains its pre-merge exception;
a fork using the same branch name cannot override a development main base.
Once main transitions, ordinary fork heads inherit candidate verification from
that main base without trusted events, secrets or publishing permissions.
Head manifest/lock mismatches still fail their actual verification gates.

All three verification workflows now support push on main/the candidate branch,
PRs targeting main, and workflow dispatch. Ordinary feature-branch pushes are
excluded; their PRs run verification. This avoids applying private development
checks to future 0.1.0 feature pushes. The old main workflows remain unchanged
until a merge installs this selector and trigger policy; no live main run or merge
is simulated as genuine execution evidence.

Default/local `manifestPolicy()` remains strict private 0.0.0 and independently
tested. Candidate commands still require explicit fixed name/version. Unknown
versions require a future reviewed policy change, not an automatic bump.

The Node 22/24 × React 18.2/19 matrix, strict type/lint/format/full unit and Node
infrastructure suites, exact package/API/declaration checks, six-file inspection,
source/digest identity, installed bytes, four genuine Vite/Next consumers,
SSR/hydration, 15 scenarios per Chromium/Firefox/WebKit, parent/child consistency,
cleanup and raw-archive upload exclusions remain intact. Permissions stay
`contents: read`. The separate manual Pages deployment workflow is untouched.
The readiness assessment remains read-only, blocked and `eligible: false`.

This design uses immutable base identity to bridge the two main states. Selecting
from the head manifest would let unexpected versions define their own policy;
selecting candidate for every PR today would break ordinary pre-merge private
contributions. A general release manager is unnecessary. The tradeoff is a small
extra base-object fetch and explicit rejection when it is unavailable.

## Cross-platform package-byte diagnosis

Reviewed source: `83b51f0b025a0135b9e074778fc1f27764340971`.
Owner's Windows-tested archive: `michael-garcia-95-react-simple-charts-0.1.0.tgz`,
83,326 bytes, SHA-256
`4c282c257fc1e75f852c0ddc1f96d36c381b786a3508cd0e1a973fe59c56c5dc`.
[Linux exact-artifact Actions run 38331086668](https://github.com/michael-garcia-95/react-simple-charts/actions/runs/38331086668)
selected SHA-256
`6d8feb6979f6f430021c79c9f17df59dae521f5c697c2c48472b44a571232fff`.
The raw owner archive was not requested or transferred.

The Actions job log (job 115080737557) independently records exact source,
six-file inventory digests, Node 24.19.0/npm 11.17.0, and successful genuine gates.
Its inventory matches the local LF reconstruction exactly. Downloading the
retained evidence zip returned HTTP 403; the accessible job log provided the
inventory instead. No raw CI archive is uploaded by the workflows.

The owner supplied all six Windows inventory digests during T07B. The following
comparison distinguishes those supplied values from independently reconstructed
bytes; **every Windows digest matches the controlled CRLF reconstruction**.

| Included file     | Linux Actions / LF SHA-256                                         | Owner Windows / CRLF reconstruction SHA-256                        |
| ----------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| LICENSE           | `c438c0cd89f4c4f69f79c40056c1f57ec2f9da213a38e99a474885ff15fe31bb` | `eb1cb0e5687475e4ef50985c0f69783a88dc64516f1500276db2438a7611aa7a` |
| README.md         | `42b5bb1e9463cb8f4a78430a2c559e3b90c573a8bfcae7385084d23ab77b828a` | `14cdca019deb5348e4b07a7de16a9a80729cd4c0e0fa92c47f0e7e024658a575` |
| package.json      | `e50269294e7dbd7ab07a4f1322682d066389ad9e3dbe6985f3f2b561f59ceba1` | `694659f24b9567454865d8b9da2c82b172925bf4917fa699e3a1297365768722` |
| dist/index.js     | `1eab157b241fc17dfa356ebb1cfc5ef1cce6151016d39000d9a8f9aa35f71426` | `1eab157b241fc17dfa356ebb1cfc5ef1cce6151016d39000d9a8f9aa35f71426` |
| dist/index.d.ts   | `7e0ce3f48ad8f2d870f5fb65e3e06c2d44830412ad1f6c9d86899bdff72dbc24` | `7e0ce3f48ad8f2d870f5fb65e3e06c2d44830412ad1f6c9d86899bdff72dbc24` |
| dist/index.js.map | `5a7d53774cf48a24b56f35ccb1a436859f32b2452ceaad7ccb48271cef6fd608` | `d17462c2ed079e36a9f9dc15b86cd8a192fcb4f2ea02ac3a8b25030a6ade26e8` |

### Mechanism and evidence

- No committed .gitattributes exists. `git ls-files --eol` shows index/working LF
  for the Linux payload text and sources. `git check-attr text eol` reports
  unspecified; `git config --show-origin --get-regexp 'core\.(autocrlf|eol|safecrlf)'`
  finds no override in the primary Linux checkout. The owner subsequently supplied
  Windows evidence: system Git config has `core.autocrlf=true`, `core.eol` returns
  no output, and all displayed tracked files (payload text, source, scripts, tests
  and docs) show `i/lf w/crlf attr/`. These Windows observations are owner-reported,
  not commands independently executed by Codex on their machine.
- A separate ignored local clone of the exact tested source was checked out with
  **clone-local** `core.autocrlf=true`. Its index remains LF and working files
  become CRLF; the primary/global Git configuration is unchanged. The clone reused
  the same installed locked dependencies, Node 24.19.0/npm 11.9.0, built with the
  unchanged tsdown configuration, then packed locally with lifecycle scripts off.
- The reconstructed LICENSE, README and package.json match committed blobs after
  CRLF-to-LF normalization and have no other differences. npm packing preserves
  their checkout bytes; JSON values, package metadata and license/documentation
  text are unchanged. Their LF/CRLF sizes are 1,071/1,092, 9,984/10,170 and
  3,057/3,155 bytes respectively.
- Runtime JavaScript (106,382 bytes) and declarations (6,855 bytes) are identical.
  Both rebuilt variants also match the supplied Windows and Actions digests.
- Parsed source maps match in every property except `sourcesContent`. All 50
  embedded source entries differ only by CRLF/LF; normalizing those string values
  makes them identical. Sources, names and mappings are unchanged. The JSON map's
  escaped `\r content requires parsing; replacing physical CRLF in the map file
  alone is not enough. Map sizes are 228,134/237,768 bytes.

Thus checkout line-ending conversion is a demonstrated cause reproducing **all
reported payload differences**, corroborated by the owner's Windows Git settings,
not just a size-based guess. Runtime, type contracts, parsed manifest and source-map
mappings show no consumer-behavior change from these differences; docs text and
embedded source formatting differ at the byte level.

The controlled CRLF tarball was 83,322 bytes, SHA-256
`44846888b0a49c75d2a19a72679f2bb92ef28c135bf03a0733a6cae1afaa4abb`;
the local LF tarball was 82,747 bytes, SHA-256
`44a8aa804c08791f4926b4dcdfa71bd6e63470077dc52cf2ffdaf1a48bb4714e`.
Neither is claimed to be the complete owner/CI archive. Equal six-file contents
do not establish equal tar headers/compression; the remaining compressed-byte
variation was not isolated and does not invalidate the payload diagnosis.

### Proposed remedy and review boundary

Recommend requiring a canonical six-file content inventory for the first approved
release, including maps and textual metadata, across Windows/Linux preparation.
Complete compressed-tarball reproducibility need not be a gate; exact digest
selection/copy/installation for each approved archive remains mandatory.

The smallest prospective build-only remedy is preparing the selected release
archive from a fresh LF checkout using command-local Git configuration. A durable
repository remedy would be a separately approved .gitattributes policy enforcing
LF for packaged text and all TypeScript inputs embedded in source maps, followed
by clean-checkout Windows/Linux comparisons. Existing committed blobs are already
LF; no blind renormalization is needed. No remedy is applied by T07B.

Switching a Windows-prepared release to LF changes four payload digests, even
though runtime/types are identical. Lead must approve canonical packaging and
review the exact resulting archive; this task cannot silently replace the
Windows-tested artifact or claim complete archive equality. The original human
PASS remains attached to that original Windows artifact. This CI/documentation
task alone requires no repeated NVDA session; further package changes need their
own identity and impact review.

## Documentation corrections requiring separate payload approval

README is packaged and unchanged. Its Current availability statement that changes
are not merged into main would become false after merge, and its publication-gates
paragraph still lists manual testing as pending. Its branch-specific clone guidance
also needs a post-transition review. A prospective correction should describe
0.1.0 as unpublished and publication as unauthorized until approval, reference
completed owner evidence, and use reviewed post-merge checkout guidance.

That README correction changes one of the six included files and requires new
Lead approval and an exact new package inventory. It is a pre-publication review
item, not an excuse to alter the historical manual record. CHANGELOG is outside
the inventory; its current text now describes the conditional transition and
completed manual assessment while retaining the historical milestone entries.

## Remaining release gates

Development Lead review of T07B and T07A evidence; final source/package review;
approval of the main transition/CI policy; canonical packaging and README correction
review; owner confirmation of npm account readiness; explicit merge approval;
explicit authorization for the exact manual npm publication operation; then
post-publication registry and consumer verification. **Publication remains NO-GO.**

Validation commands, actual final commit identity and final-head Actions links are
recorded in the PR #38 handoff. Simulation tests establish selector behavior, not
proof of a merge, native Windows execution or new human accessibility testing.
