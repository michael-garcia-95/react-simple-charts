# M06-T09A — 0.1.0 post-publication record

This is the authoritative current publication record. Earlier readiness, identity,
security, transition and execution documents retain their milestone snapshots;
their unpublished/NO-GO statements are historical, not current npm status.

## Publication and registry verification (owner-reported)

The owner reports successful public npm publication on **October 13, 2026**:

| Item                    | Published identity                                                 |
| ----------------------- | ------------------------------------------------------------------ |
| Package                 | `@michael-garcia-95/react-simple-charts@0.1.0`                     |
| Dist-tag / visibility   | `latest` / public                                                  |
| Published source commit | `21eef6fc6b52e9e3f9fd70f5e08c5eac648c583d`                         |
| Archive size            | 82,958 bytes                                                       |
| Archive SHA-256         | `88c4d6319b1eb6c8567538e45766166a88ab2a6ec5cb7285e1bfb152bf346632` |

The owner performed post-publication registry verification: version, dist-tag and
downloaded archive SHA-256 matched the approved release. These npm outcomes are
owner-supplied evidence, not independently repeated registry checks by this task.
[Published package](https://www.npmjs.com/package/@michael-garcia-95/react-simple-charts/v/0.1.0).

The first publication used the planned manual owner-controlled npm/2FA path and
has no automatic GitHub OIDC build provenance. Source/digest records and passing
Actions do not substitute for an independently attested provenance statement.
No credentials or account settings were inspected or changed here.

## GitHub verification (independently checked)

GitHub's API confirmed [PR #38](https://github.com/michael-garcia-95/react-simple-charts/pull/38)
was merged and main was at the published source above. All three post-merge push
workflows at that exact SHA completed successfully; checked independently on
October 13, 2026:

- [CI](https://github.com/michael-garcia-95/react-simple-charts/actions/runs/38397220132)
  — success.
- [Browser verification](https://github.com/michael-garcia-95/react-simple-charts/actions/runs/38397220225)
  — success.
- [Exact artifact verification](https://github.com/michael-garcia-95/react-simple-charts/actions/runs/38397220008)
  — success.

These are GitHub verification outcomes, not proof of npm publication or a new
manual accessibility assessment. PR #38's pre-merge archive/source identities
remain separate historical records, even where an archive digest matches.

## Historical accessibility evidence

The October 12 owner-performed NVDA + Firefox PASS remains in
[M06_MANUAL_ACCESSIBILITY_RESULTS.md](M06_MANUAL_ACCESSIBILITY_RESULTS.md), unchanged.
Its tested source is `83b51f0b025a0135b9e074778fc1f27764340971`; its Windows archive
was 83,326 bytes, SHA-256
`4c282c257fc1e75f852c0ddc1f96d36c381b786a3508cd0e1a973fe59c56c5dc`.
It covered all five chart families and both explicit/responsive layouts.

The [canonical package transition](M06_MAIN_BRANCH_RELEASE_TRANSITION.md) records
unchanged compiled JavaScript/declarations, LF metadata/source-map normalization
and README corrections. It does not claim complete byte equality to the original
Windows archive. The PASS remains behavioral evidence for that original tested
artifact, attributed to the owner; no test identity is reassigned to the npm
archive. No NVDA test was repeated. This is not WCAG certification, a formal audit
or universal browser/screen-reader compatibility.

## GitHub Release preparation

[RELEASE_NOTES_v0.1.0.md](RELEASE_NOTES_v0.1.0.md) is a Markdown draft for review,
not a GitHub Release object. It covers features, installation, compatibility,
limitations and immutable release identity.

The intended **v0.1.0 tag must refer to
`21eef6fc6b52e9e3f9fd70f5e08c5eac648c583d`**, never this task's later documentation
commit or moving main. Tag creation and GitHub Release creation/publication require
separate authorization after Development Lead review.

## npm README correction and next decision

npm displays the README associated with the published package version. A GitHub
README commit does **not** update the existing npm 0.1.0 landing page. That archive
still contains historical candidate instructions and contradictory pending-test
wording; the corrected GitHub README should guide readers meanwhile.

Recommend a separate **documentation-focused 0.1.1 patch release** to deliver the
corrected README to npm. Review its new source/archive identity and installation
instructions separately; retain 0.1.0's historical identity and evidence. This
recommendation is not an implemented Unreleased library feature or publication
approval. No version bump, packaging-policy change or 0.1.1 artifact is prepared
by this task. Future trusted publishing remains a separate decision.

## Task boundary

M06-T09A changes documentation only. Runtime/API, dependencies, manifests/lock,
packaging scripts, CI and publishing configuration remain unchanged. No merge,
tag, GitHub Release, deployment, npm staging/publication or credential/permission
change is authorized. Stop at the focused documentation PR for Development Lead
review; local/PR checks of a newly packed README do not reverify the published
archive's exact bytes.
