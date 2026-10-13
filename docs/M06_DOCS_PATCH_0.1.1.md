# M06-T10A — documentation patch preparation

Base main: `dd3e4ff0d3c4f4138d80909b38933985b84327b5`, independently verified
through GitHub and `git ls-remote`. Published 0.1.0 history remains unchanged.
Publication: **NO-GO**; date and outcome pending.

The patch changes the package/lock root version and README, plus verification
policy, regression tests and draft release documentation. No chart source, public
types, dependency versions, build configuration or lifecycle scripts change.

## Controlled version selection

Manifest policy requires explicit expected name and version and allows only the
reviewed `0.1.0` and `0.1.1` release identities. Each identity is exact, never a
range; selecting one does not accept the other. Historical development `0.0.0`
remains private. Unknown versions and missing expected identities fail closed.

CI uses the event's immutable main base SHA for PRs, fetching and validating its
full manifest. Ordinary and fork PRs use that base policy, regardless of their head
manifest or version environment variables. Only the owner's exact
`feat/m06-t10a-docs-patch-0.1.1` branch can select 0.1.1 over a validated public
0.1.0 base. The historical owner candidate branch retains its original private
main transition exception, but cannot downgrade a public main base. Push/dispatch
on main selects fixed 0.1.1 after this reviewed transition; the historical candidate
branch selects fixed 0.1.0. Unknown repository/event/ref contexts are rejected.

This explicit allowlist preserves historical artifact verification at the cost of
requiring another reviewed policy update for a future version. Full manifest
validation prevents a version-only match from accepting a changed package name,
access, exports or dependency contract. Tests cover spoofed fork/branch contexts,
wrong immutable bases, exact-version mismatches and post-transition main.

All three PR workflows remain `contents: read`, with no publishing credentials,
registry-write commands, `id-token`, `pull_request_target` or deployment changes.
The six-file inventory, LF/source-map checks, immutable source SHA, genuine
consumer/API/declaration checks and all three browser engines remain required.
Packing happens once with `--ignore-scripts`; exact gates cannot rebuild/repack as
fallbacks and verify the same compressed archive digest before and after gates.

## Evidence and review

The preparation PR delivery report records the final candidate source commit,
archive size/digest, every member digest, environment, local test outcomes and
three final-head Actions links. It also compares the rebuilt distribution with
the approved 0.1.0 JavaScript, declarations and map digests. Recording final source
identity outside this commit avoids a self-referential commit SHA.

Draft notes: [RELEASE_NOTES_v0.1.1.md](RELEASE_NOTES_v0.1.1.md).
Development Lead review and explicit owner authorization remain outstanding, as
do final source/artifact and accessibility evidence review and account readiness.
The owner-reported NVDA PASS belongs to its original tested artifact; unchanged
compiled bytes do not create a new manual test result. A later merge changes the
source identity and must be verified independently. Do not merge or publish.
