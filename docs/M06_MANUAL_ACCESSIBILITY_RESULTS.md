# M06-T07A — Manual accessibility results

**Disposition: PASS — owner-reported ALL PASSED.** The owner performed the human
assessment, guided by the Development Lead, to assess the React Simple Charts
0.1.0 candidate using Windows NVDA + Firefox before release consideration.
Test date: **October 12, 2026, Trinidad and Tobago local time (America/Port_of_Spain)**.
No unresolved accessibility defects were reported.

## Tested environment

| Item             | Reported version                                                                    |
| ---------------- | ----------------------------------------------------------------------------------- |
| Operating system | Windows 11 Home Single Language, version 25H2, OS Build 26200.9457                  |
| Browser          | Firefox 157.0.1 (64-bit)                                                            |
| Screen reader    | NVDA 2026.2, Build 2026.2.0.57664                                                   |
| Node.js          | 24.18.0                                                                             |
| npm              | Preparation helper reported 11.16.0; an earlier interactive command reported 12.1.0 |

The two npm observations are distinct; no single npm version is assumed for the
entire session. Installation mode, settings changes and exact announcement timing
were not supplied and are not inferred.

## Exact tested candidate and preparation

- Package: `@michael-garcia-95/react-simple-charts`, version `0.1.0`.
- Tested source: `83b51f0b025a0135b9e074778fc1f27764340971`.
- Local archive: `michael-garcia-95-react-simple-charts-0.1.0.tgz`.
- Archive size: **83,326 bytes**.
- Archive SHA-256: `4c282c257fc1e75f852c0ddc1f96d36c381b786a3508cd0e1a973fe59c56c5dc`.
- Preparation report run ID: `2026-10-13T01-31-28.606Z-7364f7e2-5e12-4965-a098-0c688983c713`.
- Manual fixture preparation: **Passed**, confirming explicit candidate policy,
  exact archive selection, source identity, installation, production build and
  installed-byte checks. No Playwright browser downloads were required.

These identities and preparation outcomes were supplied by the owner. The UTC run
ID is compatible with the October 12 local test date. Preparation success alone
is not human testing; the owner supplied the human result separately.

## Coverage and owner-reported outcomes

| Chart      | Result |
| ---------- | ------ |
| LineChart  | PASS   |
| AreaChart  | PASS   |
| BarChart   | PASS   |
| PieChart   | PASS   |
| DonutChart | PASS   |

The owner confirmed that the remaining condensed checklist passed for **both
explicit and responsive layouts**. Coverage included chart identification and
descriptions; accessible data values; keyboard focus and navigation; arrow keys,
Home and End; Enter and Space activation; tooltip dismissal; focus retention;
Tab entry and exit; visible focus; accessible data tables; visually hidden
responsive tables; responsive resizing; Donut center-button independence;
Empty Line alternative; and Unavailable Pie alternative.

The [screen-reader plan](M06_SCREEN_READER_TEST_PLAN.md) retains detailed
expectations and a reusable checklist. This record summarizes the supplied result;
it does not invent individual measurements, screenshots or spoken transcripts.

## Resolved navigation observations

1. Browse Mode initially intercepted some chart navigation keys. Switching to
   Focus Mode allowed chart keyboard navigation.
2. Table-cell navigation required moving the NVDA reading cursor from the table
   container into a cell first.
3. The initial report of an “offscreen” focus announcement was corrected by the
   owner: NVDA actually announced “onscreen”, and visual focus was confirmed.

These observations were resolved during testing and were not reported as defects.

## Identity continuity and limitations

The tested source SHA above remains the human assessment identity. This task adds
an evidence-documentation commit on `feat/m06-t06b3-release-candidate`; its separate
SHA is recorded by Git and the PR #38 handoff, not substituted for the tested SHA.
Changes are confined to `docs/`, outside the six-file npm archive inventory:
`LICENSE`, `README.md`, `package.json`, `dist/index.js`, `dist/index.d.ts` and
`dist/index.js.map`. Any newly prepared candidate requires comparison of all six
included file contents against the tested candidate. Separately generated compressed
tarballs need not share a SHA-256. Differing packaged contents require stopping
and reporting the discrepancy rather than carrying this PASS forward automatically.

The owner's Windows archive is not present in this execution workspace. A local
reconstruction from the exact tested source can establish before/after documentation
content equality, but cannot independently establish byte equality to the owner's
archive without its retained contents. The owner-reported preparation checks above
are the supplied evidence linking that archive to the tested source.

This is an owner-performed assessment guided by the Development Lead, not an
independently witnessed Codex test, formal third-party audit, WCAG certification,
universal browser/screen-reader compatibility claim or automated substitute for
human testing. Other environments and configurations remain outside this evidence.
No manual NVDA testing was repeated by this documentation task.

## Final release disposition

The manual accessibility test gate is complete for the recorded candidate,
provided its tested package content remains unchanged. **Publication remains NO-GO**:
0.1.0 is unpublished, PR #38 is unmerged, and the exact final publication operation
is unauthorized. Development Lead evidence review, final source/package review,
release-transition/main-branch CI policy review, owner npm account readiness,
explicit merge approval, exact manual npm publication authorization and subsequent
registry/consumer verification remain required.

See [release readiness](M06_RELEASE_READINESS.md), [release policy](RELEASE_POLICY.md),
[open decisions](OPEN_DECISIONS.md), [publishing security](M06_PUBLISHING_SECURITY_PLAN.md)
and [verification execution](VERIFICATION_EXECUTION.md). Stop for Development Lead review.
