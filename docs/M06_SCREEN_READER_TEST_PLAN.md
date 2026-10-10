# M06-T03 — Windows screen-reader test plan

**Status: awaiting human execution.** No NVDA test has been performed by Codex.
Automated DOM, keyboard, accessibility-tree and axe evidence is recorded separately
in [distribution compatibility](M06_DISTRIBUTION_COMPATIBILITY.md). Passing those
checks is neither screen-reader approval nor WCAG certification.

## Setup on Windows 10/11

1. Use a reviewed checkout of `chore/m06-t03-distribution-hardening`; record its
   `git rev-parse HEAD`. Install a contributor-compatible Node environment (see
   the compatibility report), then run `npm ci`. The package remains private,
   unpublished at 0.0.0; never install it by name from the public registry.
2. In PowerShell at the repository root run:

   ```powershell
   node scripts/verify-browser-smoke.mjs --prepare-only
   Set-Location work/browser-smoke/app
   node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4323 --strictPort
   ```

   Leave the server running. This preparation packs the library, creates a fresh
   independent Vite application, installs the actual tarball and builds it. It
   does not install any browser driver/binary in prepare-only mode. Reprepare
   from the repository root after source changes; record the new commit.

3. Install current Firefox from <https://www.mozilla.org/firefox/> and NVDA from
   <https://www.nvaccess.org/download/> using their normal Windows installers.
   Start NVDA from the Start menu (or its configured desktop shortcut). The
   portable NVDA option is acceptable; record which mode and exact versions.
4. Open <http://127.0.0.1:4323/> in Firefox. Optional secondary run: repeat the
   same checklist in Chrome, recording its version separately. A comparison is
   not a substitute for the primary NVDA + Firefox run.
5. Use NVDA's default desktop keyboard layout. `NVDA` below means Insert, or
   Caps Lock if configured as the modifier. No special add-on is required.
   Ensure document descriptions and table row/column headers are reported under
   NVDA Settings → Document Formatting. Enable reporting object descriptions in
   Object Presentation. Record any changes. Do not disable speech to hide issues.
   Optional Tools → Speech Viewer captures the spoken output for defect reports.
   Avoid submitting unrelated screen content or private information.

## Navigation procedure

Use only the keyboard. `NVDA+Space` switches between browse and focus modes;
NVDA announces the mode. In browse mode, arrows read content, `H`/`Shift+H`
move through headings, `B` moves to buttons, and `T`/`Shift+T` move to tables.
`Ctrl+Alt+Arrow` moves through table cells. `NVDA+Tab` reports current focus;
`NVDA+Up Arrow` reads the current line in the desktop layout. `NVDA+F7` opens
an elements list if needed. Read the fixture's main heading first.

For each family, test both its **explicit** and **responsive** section:

1. Find the section heading using `H`. Read through the chart region in browse
   mode. Expected chart name: e.g. `Line explicit` or `Line responsive`;
   description: `Alpha 12, Beta 24, Gamma 18.` The graphic is a named group with
   three exposed data buttons. Decorative marks/axes should not create a second
   competing stream of unlabeled data controls. Exact NVDA wording may differ.
2. Focus the section's `Before …` button (browse navigation or Tab), then press
   Tab. Expected: one data entry at Alpha; NVDA should identify its data name and
   button role. Confirm the actual focused control using `NVDA+Tab`.
3. Switch to focus mode if NVDA consumes chart arrow keys. Right/Down advances
   Alpha → Beta → Gamma; Left/Up reverses. Home selects Alpha, End selects Gamma.
   Ends clamp without wrapping. Navigation updates inspection without activation.
   Check spoken data against the table rather than requiring exact punctuation.
4. Inspect the tooltip with focused data. The visible tooltip must correspond to
   the selected record, and the selected control references it as a description.
   Record whether NVDA announces it automatically, on `NVDA+Tab`, or only during
   explicit browse reading. There is no promised live-region announcement.
   Failure to announce changing descriptions automatically needs review; inability
   to discover values through focused controls **and** the table is a blocker.
5. Press Enter once and Space once on Alpha. The following activation output
   should become `0:keyboard:1`, then `0:keyboard:2` in a fresh section. Read it
   in browse mode after the chart; it is an observable output, not a guaranteed
   live announcement. No duplicate callback should occur. Reload to reset if
   previous testing changed counts.
6. Press Escape. Expected: tooltip disappears, description relationship to that
   tooltip is removed, and focus stays on the data control. Press Tab to leave.
   No trap, unexpected activation or cross-chart tooltip should occur. Shift+Tab
   can return; chart siblings must remain independent.
7. Switch back to browse mode and use `T` to find `Family sizing — data`. Explicit
   tables are visible; responsive tables are visually hidden but available to
   NVDA. Confirm caption, headers and all three source rows: Alpha 12, Beta 24,
   Gamma 18. Read with `Ctrl+Alt+Arrow`; the complete alternative must be usable
   independently of graphical focus. Tables are not extra Tab stops.
8. Resize the Firefox window using Windows keyboard controls (for example
   Alt+Space → Size, arrow keys, Enter), or maximize/restore it. Responsive
   graphics should remeasure, keep readable values/tables and avoid focus loss
   or stale inspection. Explicit geometry keeps width 640 and may scale visually.

If keys are intercepted, record browse/focus mode and retest in focus mode before
reporting a library defect. Screen-reader browse reading of a table intentionally
uses different keys from focus-mode chart navigation.

## Family-specific expected outcomes

| Family | Expected focus/inspection behavior and source alternative                                                                                                                                                                                                                      |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Line   | Three source-ordered observations; tooltip identifies Alpha/Beta/Gamma and 12/24/18. One roving entry; table preserves every row.                                                                                                                                              |
| Area   | Same point navigation and activation as Line; fills add no duplicate stops. Source table gives exact values independently of area shape.                                                                                                                                       |
| Bar    | Three bar controls in source order; item tooltip identifies each value. Rectangles add no extra stops; complete source table remains available.                                                                                                                                |
| Pie    | Three positive segments, source order; tooltip reports label, value and proportion (approximately 22.2%, 44.4%, 33.3%). Navigation/activation acts on segments, not legend items.                                                                                              |
| Donut  | Same segment behavior as Pie. After the ring's roving entry, Tab reaches `Details 0` in the center. Enter changes it to `Details 1` without activating a segment; Tab then leaves for `After …`. Shift+Tab returns through center to the ring. The wrapper adds no extra stop. |

At the end, read **Empty Line**: named `No chart data` alternative, no data buttons
or SVG, retained captioned table with no invented rows. Read **Unavailable Pie**:
named `Chart rendering unavailable` alternative, no segments, and a table retaining
`Rejected` and `-1`. Neither state should leave stale tooltips or inaccessible
focus targets. The fixture deliberately shows two different meaningful states;
existing automated family suites cover the remaining family's state transitions.

## Compact result checklist

Use Pass / Fail / Not run, not an unchecked assumption. Record both sizing modes
per row. Attach notes for every Fail or Not run.

| Check                                           | Line    | Area    | Bar     | Pie     | Donut   |
| ----------------------------------------------- | ------- | ------- | ------- | ------- | ------- |
| Name, description and exposed data buttons      | Pending | Pending | Pending | Pending | Pending |
| Tab entry/exit; visible focus; no trap          | Pending | Pending | Pending | Pending | Pending |
| Arrows/Home/End and source order                | Pending | Pending | Pending | Pending | Pending |
| Enter/Space: once per activation                | Pending | Pending | Pending | Pending | Pending |
| Tooltip values/description discoverable         | Pending | Pending | Pending | Pending | Pending |
| Escape dismisses, retains focus                 | Pending | Pending | Pending | Pending | Pending |
| Visible/hidden table caption, headers, all rows | Pending | Pending | Pending | Pending | Pending |
| Resize and independent siblings                 | Pending | Pending | Pending | Pending | Pending |
| Center button independent and reachable         | N/A     | N/A     | N/A     | N/A     | Pending |

Additional checks: Empty Line ___; Unavailable Pie ___; secondary Chrome ___
(optional). Tester/date ___; commit ___; Windows version ___; NVDA version/mode ___;
Firefox version ___; Node/npm ___; settings changes ___; overall result ___ .

## Defect report template and disposition

```text
Title:
Tester/date and commit:
Windows / NVDA / Firefox versions:
NVDA layout, browse/focus mode, modified settings:
Fixture section (family, explicit/responsive), initial data/state:
Exact keyboard sequence from reload:
Expected result:
Actual spoken output and focus/visible result:
Activation output before/after (if relevant):
Repeatable? Frequency:
Speech Viewer excerpt or recording (optional, redact private information):
Does the source table provide a usable alternative?
Severity and proposed release impact:
```

Potential first-release blockers: missing/unusable source alternatives, unreachable
chart data or Donut center controls, keyboard traps, wrong values/relationships,
duplicate activation, or a persistent inability to understand current data.
Unexpected announcement timing, focus-mode requirements and redundant group
wording need evidence and Lead assessment, not automatic dismissal.

Known acceptable scope limits: tooltip panels are noninteractive, static legends
are not buttons, exact announcement timing is controlled by NVDA/browser settings,
there is no live-region contract, and caller-provided center/tooltip content owns
its semantics and fit. Tiny slices may be difficult to hit with a pointer but must
remain keyboard/table reachable. Manual NVDA results remain a release gate until
a human supplies evidence and defects are triaged. This plan does not certify
WCAG or authorize a release, browser-policy deferral or publication.
