import type { ReactNode } from 'react';
import { CodePreview, repository } from './components';
import { sitePath } from './paths';
import { documentationCode } from './documentation-code';
import type { DocumentationExample } from './documentation-code';

export const documentationSections = [
  { id: 'introduction', title: 'Introduction' },
  { id: 'getting-started', title: 'Getting started' },
  { id: 'choose-a-chart', title: 'Choose a chart' },
  { id: 'data-mapping', title: 'Data mapping' },
  { id: 'line-chart', title: 'LineChart' },
  { id: 'area-chart', title: 'AreaChart' },
  { id: 'bar-chart', title: 'BarChart' },
  { id: 'pie-chart', title: 'PieChart' },
  { id: 'donut-chart', title: 'DonutChart' },
  { id: 'common-configuration', title: 'Common configuration' },
  { id: 'tooltips-and-interactions', title: 'Tooltips and interactions' },
  { id: 'accessibility', title: 'Accessibility' },
  {
    id: 'responsive-and-server-rendering',
    title: 'Responsive and server rendering',
  },
  {
    id: 'limitations-and-troubleshooting',
    title: 'Limitations and troubleshooting',
  },
] as const;
type SectionId = (typeof documentationSections)[number]['id'];

function Sample({ example }: { example: DocumentationExample }) {
  const sample = documentationCode[example];
  return (
    <CodePreview label={sample.label} language="TypeScript / React" copyable>
      {sample.source}
    </CodePreview>
  );
}
function ReferenceTable({
  caption,
  columns,
  rows,
}: {
  caption: string;
  columns: readonly string[];
  rows: readonly (readonly ReactNode[])[];
}) {
  return (
    <div
      className="docs-table-scroll"
      role="region"
      aria-label={caption}
      tabIndex={0}
    >
      <table className="docs-table">
        <caption>{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, column) =>
                column === 0 ? (
                  <th key={column} scope="row">
                    {cell}
                  </th>
                ) : (
                  <td key={column}>{cell}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function GalleryLink({
  family,
}: {
  family: 'line' | 'area' | 'bar' | 'pie' | 'donut';
}) {
  return (
    <p>
      <a href={sitePath(`/examples/#chart-${family}`)}>
        Try the {family} interactive example →
      </a>
    </p>
  );
}

function DocSection({
  id,
  idPrefix,
  children,
}: {
  id: SectionId;
  idPrefix: string;
  children: ReactNode;
}) {
  const title = documentationSections.find(
    (section) => section.id === id,
  )!.title;
  const headingId = `${idPrefix}-${id}`;
  return (
    <section className="docs-section" aria-labelledby={headingId}>
      <h2 id={headingId} tabIndex={-1}>
        {title}
      </h2>
      {children}
    </section>
  );
}

// Stable public fragments by default; a prefix also supports isolated embedded instances.
export function Documentation({ idPrefix = 'docs' }: { idPrefix?: string }) {
  const anchor = (id: SectionId) => `${idPrefix}-${id}`;
  return (
    <>
      <div className="page-intro">
        <p className="eyebrow">A practical developer reference</p>
        <h1>
          A small API.
          <br />
          Room for your data.
        </h1>
        <p className="lead">
          Choose a chart, map your records, and make the result useful to
          everyone. Start locally, then explore the typed API one family at a
          time.
        </p>
        <p>React + TypeScript · SVG · MIT licensed</p>
      </div>
      <div className="docs-layout">
        <nav className="docs-toc" aria-label="Documentation sections">
          <p className="eyebrow">On this page</p>
          <ol>
            {documentationSections.map(({ id, title }) => (
              <li key={id}>
                <a href={`#${anchor(id)}`}>{title}</a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="prose docs-content">
          <DocSection idPrefix={idPrefix} id="introduction">
            <p>
              React Simple Charts provides five SVG chart components with typed
              data mappings, tooltips, keyboard inspection, and accessible
              source-data alternatives. Import <code>LineChart</code>,{' '}
              <code>AreaChart</code>, <code>BarChart</code>,{' '}
              <code>PieChart</code> and <code>DonutChart</code> from the package
              root.
            </p>
            <p>
              You supply the source records and field mappings. The components
              handle rendering, container measurement and inspection. No chart
              provider or external stylesheet is required. The API is intended
              for TypeScript/React consumers; each family has its own mapping
              and configuration options.
            </p>
            <p>
              Browse the{' '}
              <a href={sitePath('/examples/')}>interactive examples gallery</a>{' '}
              alongside this reference. All samples below use fictional,
              deterministic data and are complete TSX you can copy into a local
              application with the built package installed.
            </p>
          </DocSection>
          <DocSection idPrefix={idPrefix} id="getting-started">
            <h3>Build and explore locally</h3>
            <p>
              The MIT-licensed package is private at version <code>0.0.0</code>{' '}
              and is not published to npm. The website is not deployed. Public
              installation instructions will follow a separately approved
              release.
            </p>
            <p>
              The package is ESM only with a single root entry; internal and
              source subpaths are unavailable. React and React DOM are
              consumer-owned peer dependencies. The supported range is React
              18.2+ within React 18, and React 19.x. Use compatible versions of
              both peers and their TypeScript definitions.
            </p>
            <CodePreview
              label="Local repository workflow"
              language="Shell"
              copyable
            >{`git clone ${repository}.git
cd react-simple-charts
npm ci
npm run build
npm run dev:site

# Build the four static website pages locally
npm run build:site`}</CodePreview>
            <p>
              Use Node 22.22.2+, Node 24.15.0+ within those majors, or Node 26+
              as declared by the repository. <code>npm ci</code> installs the
              locked development dependencies. <code>npm run build</code>{' '}
              creates the ESM and declarations in <code>dist/</code>;{' '}
              <code>dev:site</code> also builds the package before starting
              Vite.
            </p>
            <h3>Try the package in another local app</h3>
            <p>
              Build a fresh archive in this checkout, then install its generated
              tarball in your existing React/TypeScript application. Replace the
              absolute path below with your checkout path. The filename reflects
              the current private version; this is local installation, not
              public npm availability.
            </p>
            <CodePreview
              label="Local tarball workflow"
              language="Shell"
              copyable
            >{`# In the library checkout
npm run build
npm pack --cache work/npm-cache

# In another local React application
npm install /absolute/path/react-simple-charts/react-simple-charts-0.0.0.tgz`}</CodePreview>
            <p>
              Keep React and React DOM installed in that application within the
              supported peer range. Import only from{' '}
              <code>react-simple-charts</code>. After library changes, rebuild
              and repack a fresh archive before reinstalling it.
            </p>
          </DocSection>
          <DocSection idPrefix={idPrefix} id="choose-a-chart">
            <ReferenceTable
              caption="Chart selection guide"
              columns={['Family', 'Useful for', 'A simple question']}
              rows={[
                [
                  'Line',
                  'Trends and changes across an ordered sequence.',
                  'How did revenue change each month?',
                ],
                [
                  'Area',
                  'Magnitude from the physical zero baseline; independent, unstacked series.',
                  'How far above or below zero was activity?',
                ],
                [
                  'Bar',
                  'Category comparison, vertical or horizontal; grouped series.',
                  'Which department has the largest balance?',
                ],
                [
                  'Pie',
                  'Composition of a whole from nonnegative source values.',
                  'What share belongs to each category?',
                ],
                [
                  'Donut',
                  'Composition with an optional center-content region.',
                  'How is the budget allocated?',
                ],
              ]}
            />
            <p>
              Use an ordered sequence for Line and Area; the library does not
              sort it for you. Use Bar when comparing categories matters more
              than connecting them. Pie and Donut need a meaningful total of
              nonnegative values. Their props and tooltip contexts differ from
              Cartesian charts.
            </p>
          </DocSection>
          <DocSection idPrefix={idPrefix} id="data-mapping">
            <p>
              TypeScript infers your record type from <code>data</code>. No
              string index signature or special record wrapper is needed. An
              explicit interface is helpful for nullable or optional fields, as
              in the examples below.
            </p>
            <ReferenceTable
              caption="Family-specific source mappings"
              columns={['Mapping', 'Required fields']}
              rows={[
                [
                  <code>yKey</code>,
                  'Line, Area and Bar: xKey identifies X/categories; yKey selects one numeric field.',
                ],
                [
                  <code>series</code>,
                  'Line, Area and Bar: xKey plus an ordered array of numeric keys, optional labels and colors.',
                ],
                [
                  <code>nameKey / valueKey</code>,
                  'Pie and Donut: a categorical label field and a numeric value field.',
                ],
              ]}
            />
            <p>
              <code>yKey</code> and <code>series</code> are mutually exclusive.
              For one Cartesian series use <code>yKey</code>; for multiple
              series use <code>series</code> without <code>yKey</code>. Compare
              the{' '}
              <a href={`#${anchor('line-chart')}`}>
                single-series Line example
              </a>{' '}
              and{' '}
              <a href={`#${anchor('area-chart')}`}>multi-series Area example</a>
              .
            </p>
            <p>
              Numeric keys accept number fields, including{' '}
              <code>number | null</code> and optional numbers. Categorical
              fields accept strings, finite numbers and valid Dates. Linear X
              requires numbers; UTC/local-time X requires Date objects. Numeric
              strings are not coerced, and date strings are not parsed.
              Null-only fields are not valid numeric mappings.
            </p>
            <p>
              Missing is not zero: <code>null</code> and <code>undefined</code>{' '}
              identify unreported observations, while a finite <code>0</code>{' '}
              remains a real value. Invalid values do not fabricate data marks.
              Original source objects and indices are retained in activation and
              tooltip payloads.
            </p>
            <p>
              Repeated category labels remain distinct rows and categorical
              positions; repeated continuous X values remain distinct
              observations. Shared tooltips group by original source row, never
              by matching label text. Supply your records in the order you want
              to inspect and connect them.
            </p>
          </DocSection>
          <DocSection idPrefix={idPrefix} id="line-chart">
            <p>
              Use <code>xKey</code> for X and <code>yKey</code> for one numeric
              series. Category X is the default: each source row gets its own
              categorical position, including repeated labels. Missing X or Y
              ends a run instead of joining across the gap; an isolated valid
              observation still has a marker.
            </p>
            <Sample example="line" />
            <p>
              For multiple series replace <code>yKey</code> with{' '}
              <code>series</code>, as in Area below. Each numeric series has its
              own gaps. Paths follow source order even with unsorted or repeated
              continuous X values; sort your source deliberately when
              chronological order is required.
            </p>
            <h3>Choose an X scale explicitly</h3>
            <p>
              Continuous X requires the appropriate <code>xScale</code>{' '}
              discriminant. <code>linear</code> maps a numeric key by distance;{' '}
              <code>utc</code> maps a Date key in UTC; <code>time</code> uses
              local-time dates. A numeric or Date field with the default{' '}
              <code>category</code> scale still occupies separate category
              positions.
            </p>
            <Sample example="linear" />
            <Sample example="utc" />
            <p>
              UTC is the predictable choice for complete temporal SSR.
              Local-time geometry starts with a stable server/initial hydration
              placeholder and uses the client timezone after mounting. The same
              instant can have a different calendar date for different users.
            </p>
            <Sample example="time" />
            <p>
              Line defaults to shared tooltips;{' '}
              <code>{"tooltip={{ mode: 'item' }}"}</code> inspects only one
              datum. <code>xAxis</code> ticks follow the X scale type, and{' '}
              <code>yAxis</code> ticks are numeric. Configure <code>show</code>,{' '}
              <code>label</code>, <code>tickCount</code> or{' '}
              <code>formatTick</code>; numeric axes additionally accept{' '}
              <code>min</code>/<code>max</code>. <code>showGrid</code> controls
              value gridlines independently of axis visibility.
            </p>
            <GalleryLink family="line" />
          </DocSection>
          <DocSection idPrefix={idPrefix} id="area-chart">
            <p>
              Area uses the same X scales and typed mappings as Line, with fills
              extending to the physical zero baseline. Positive values fill
              upward, negative values downward, and mixed signs cross zero. A
              configured numeric Y domain must accommodate zero; bounds
              excluding zero make rendering unavailable.
            </p>
            <Sample example="area" />
            <p>
              Areas are not stacked. Each series fills independently; values are
              not summed, and overlapping fills can obscure one another. Missing
              or invalid observations split only the affected series into
              separate runs. Singleton observations keep a marker and
              inspection, with no fill or boundary path.
            </p>
            <p>
              Boundary lines follow actual data runs; the fill’s closing walls
              and baseline are not observed boundaries. Shared tooltips are the
              default, with optional item mode. There are no public
              fill-opacity, stacking, gradient or custom-baseline props.
            </p>
            <GalleryLink family="area" />
          </DocSection>
          <DocSection idPrefix={idPrefix} id="bar-chart">
            <p>
              Bar defaults to vertical orientation, with categorical X and
              numerical Y. Use <code>yKey</code> for one series or{' '}
              <code>series</code> for grouped bars. Positive and negative values
              extend in opposite directions from zero; real zeros retain
              inspection targets even though they have no visible bar length.
            </p>
            <p>
              In horizontal mode, <code>xKey</code> still identifies the source
              category. The physical horizontal axis (<code>xAxis</code>)
              becomes numerical and the physical vertical axis (
              <code>yAxis</code>) becomes categorical. The typed example below
              places numeric bounds and a numeric formatter on{' '}
              <code>xAxis</code>.
            </p>
            <Sample example="bar" />
            <p>
              Remove <code>orientation="horizontal"</code> for vertical bars and
              move numerical bounds/formatting to <code>yAxis</code>. Missing
              grouped values keep their conceptual series slots without drawing
              rectangles, so neighboring bars do not shift to fill them.
              Categories and configured series keep source order. Numerical
              bounds must include zero.
            </p>
            <p>
              Bar defaults to item tooltips. The example overrides that with
              shared mode for valid values from the same source row. There are
              no stacking or public gap props, and Bar does not accept an{' '}
              <code>xScale</code> option.
            </p>
            <GalleryLink family="bar" />
          </DocSection>
          <DocSection idPrefix={idPrefix} id="pie-chart">
            <p>
              Map a categorical field with <code>nameKey</code> and a numeric
              field with <code>valueKey</code>. Finite positive values with
              valid labels create source-ordered slices. Zero-value records
              remain in the source table even when they create no drawable
              slice; missing or invalid rows are excluded from geometry and
              totals.
            </p>
            <Sample example="pie" />
            <p>
              Any finite negative value rejects the entire chart, even when its
              label is invalid. Negatives are never converted to absolute
              values. If there are no eligible positive values, the chart shows
              “No chart data” with its source table; it does not invent a
              full-circle placeholder.
            </p>
            <p>
              <code>showLabels</code> defaults to false; enabling it requests
              conservatively fitted interior labels. Small sectors or long
              labels may omit text. The default static legend includes drawable
              positive segments; the complete table also includes zero, missing
              and invalid rows. <code>showLegend</code> only controls the
              legend.
            </p>
            <p>
              Hover, focus or touch inspects a segment; clicks, touch release
              and Enter/Space activate the original record. Pie uses{' '}
              <code>SegmentTooltipContext</code>, not a Cartesian context.
              Default tooltips show the value and percentage with one decimal.
              Payload <code>percentage</code> is on a 0–100 scale, computed from
              eligible positive values; tiny shares may display 0.0% without
              becoming zero.
            </p>
            <GalleryLink family="pie" />
          </DocSection>
          <DocSection idPrefix={idPrefix} id="donut-chart">
            <p>
              Donut uses the same <code>nameKey</code>/<code>valueKey</code>{' '}
              source mappings, complete table and polar interaction semantics as
              Pie. Its ring has a default <code>innerRadiusRatio</code> of{' '}
              <code>0.6</code>: inner radius divided by outer radius.
            </p>
            <Sample example="donut" />
            <p>
              The ratio must be a finite number strictly between 0 and 1. Zero,
              one, negative, nonfinite or out-of-range values make rendering
              unavailable; they are not clamped or replaced by the default.
              Extreme ratios also need representable radii and safe paths.
            </p>
            <p>
              <code>centerContent</code> is optional React content in a
              contained region inside the hole. No total is generated
              automatically. Keep content concise: large text or controls may be
              constrained or clipped, especially in small holes. Put essential
              information outside the chart too. Center content appears only
              when geometry is ready and does not replace the source table.
            </p>
            <p>
              Optional <code>showLabels</code> requests ring-interior labels;
              thin rings and small sectors may omit them. Donut shares Pie’s
              tooltip, activation, zero/missing handling and negative rejection.
              Nested rings and percentage stacking are unsupported.
            </p>
            <GalleryLink family="donut" />
          </DocSection>
          <DocSection idPrefix={idPrefix} id="common-configuration">
            <ReferenceTable
              caption="Shared public properties"
              columns={['Prop', 'Behavior']}
              rows={[
                [
                  <code>data</code>,
                  'Required readonly source records; records are not mutated.',
                ],
                [
                  <code>width</code>,
                  'Omitted means responsive 100%. A CSS string sizes the container and waits for measurement. A positive finite number supplies explicit pixel geometry; CSS may scale the SVG to fit.',
                ],
                [
                  <code>height</code>,
                  'Positive finite pixel height; default 280px. Invalid dimensions make rendering unavailable.',
                ],
                [
                  <code>className / style</code>,
                  'Applied to the outer figure. Dimension props control chart sizing; arbitrary host styles may affect presentation.',
                ],
                [
                  <code>colors</code>,
                  'Readonly cycling palette. Cartesian colors use configured series order; polar colors use original row index, so excluded rows do not shift later colors.',
                ],
                [
                  <code>animate</code>,
                  'Default false. Optional brief client opacity animation of decorative marks; paths and axes do not move. Reduced motion disables or cancels it.',
                ],
                [
                  <code>formatValue</code>,
                  'Number-to-string formatter for value text in tables, controls and default tooltips; also numerical Cartesian ticks unless an axis formatter overrides it.',
                ],
                [
                  <code>accessibility</code>,
                  'label, description and dataTable: visible or visually-hidden. No option removes the source table.',
                ],
                [
                  <code>showLegend</code>,
                  'Default true. Cartesian legends appear for multiple series; polar legends list drawable positive slices. Static, with no filtering interaction.',
                ],
              ]}
            />
            <p>
              Color precedence is explicit Cartesian <code>series.color</code>,
              supplied <code>colors</code>, then existing CSS-variable fallbacks
              and the default palette. Pie/Donut have no{' '}
              <code>series.color</code> mapping. Marks, legends and tooltip
              payloads share the resolved color.
            </p>
            <p>
              Cartesian-only options include <code>showGrid</code> (default
              true), <code>formatCategory</code>, axes, <code>yKey</code>/
              <code>series</code> and their tooltip context. Explicit axis{' '}
              <code>formatTick</code> takes precedence over general formatters.
              Line/Area accept <code>xScale</code>; Bar accepts{' '}
              <code>orientation</code>. Polar-only mappings and labels, and
              Donut’s ratio/center content, stay family-specific.
            </p>
          </DocSection>
          <DocSection idPrefix={idPrefix} id="tooltips-and-interactions">
            <ReferenceTable
              caption="Tooltip choices"
              columns={['Setting', 'Result']}
              rows={[
                [
                  'Omitted or true',
                  'Default content: shared mode for Line/Area, item mode for Bar; segment content for Pie/Donut.',
                ],
                [
                  <code>{'tooltip={false}'}</code>,
                  'Hides tooltip presentation without disabling inspection or activation.',
                ],
                [
                  <code>{"tooltip={{ mode: 'item' }}"}</code>,
                  'Cartesian: one inspected datum.',
                ],
                [
                  <code>{"tooltip={{ mode: 'shared' }}"}</code>,
                  'Cartesian: valid values from the same original row in configured series order, including values clipped by bounds.',
                ],
                [
                  'Function or { render }',
                  'Custom content inside the positioned tooltip; may return null. A function retains the chart’s default Cartesian mode. Polar config has no mode.',
                ],
              ]}
            />
            <p>
              Narrow the approved <code>CartesianTooltipContext&lt;T&gt;</code>{' '}
              by <code>mode</code> before reading <code>items</code> or{' '}
              <code>item</code>. Keep tooltip content noninteractive; it has no
              focus entry and uses approximate contained positioning.
            </p>
            <Sample example="cartesianTooltip" />
            <p>
              Pie/Donut renderers instead receive{' '}
              <code>SegmentTooltipContext&lt;T&gt;</code> with a single{' '}
              <code>segment</code>. This context includes original record,
              index, segmentId, label, raw value, color and percentage.
            </p>
            <Sample example="segmentTooltip" />
            <h3>Inspect and activate</h3>
            <p>
              Hover and keyboard focus inspect without activation. Touch release
              inspects persistently and activates once; use the local Dismiss
              inspection button or Escape to dismiss. Mouse/pen clicks and
              Enter/Space activate too. These behaviors come from the real
              library components shown in the gallery.
            </p>
            <ReferenceTable
              caption="Keyboard inspection"
              columns={['Key', 'Behavior']}
              rows={[
                [
                  'Tab / Shift+Tab',
                  'Enter through one roving eligible mark, or leave the chart normally.',
                ],
                [
                  'ArrowRight / ArrowDown',
                  'Move forward in source-row/series order, or source-segment order.',
                ],
                [
                  'ArrowLeft / ArrowUp',
                  'Move backward; traversal clamps at endpoints.',
                ],
                [
                  'Home / End',
                  'Inspect the first or last eligible observation.',
                ],
                [
                  'Enter / Space',
                  'Activate once; held-key repeats do not reactivate.',
                ],
                ['Escape', 'Dismiss inspection and its tooltip.'],
              ]}
            />
            <p>
              <code>onDataActivate</code> receives the original record and raw
              value, with source index and resolved color. Cartesian payloads
              also include category, seriesKey and seriesLabel; polar payloads
              include segmentId, label and percentage. <code>inputMethod</code>{' '}
              is <code>pointer</code> for mouse/pen, <code>touch</code> for
              touch release, or <code>keyboard</code> for Enter/Space and
              standalone assistive-technology clicks without pointer evidence.
              Hover, focus and resizing never activate.
            </p>
          </DocSection>
          <DocSection idPrefix={idPrefix} id="accessibility">
            <p>
              Give each chart a meaningful name: “Monthly revenue” helps more
              than “Chart”. Add a description for units, purpose or known gaps.
              The Line example uses{' '}
              <code>
                {
                  "accessibility={{ label: 'Monthly revenue', description: 'Fictional revenue; March is unreported.', dataTable: 'visible' }}"
                }
              </code>
              .
            </p>
            <p>
              Every chart state retains a semantic source-data table.{' '}
              <code>dataTable: 'visible'</code> displays it beside the graphic;{' '}
              <code>'visually-hidden'</code> is the default and keeps it
              available to assistive technologies. There is no table-removal
              mode. Tables preserve source order, repeated labels, real zeros
              and Missing/Invalid classifications; invalid mappings fall back to
              raw source fields.
            </p>
            <p>
              Eligible marks are keyboard controls with an independent visible
              focus outline. Arrow keys inspect; Tab leaves normally. Stable
              title/description references name the graphic, and a visible
              tooltip is connected to the inspected control through{' '}
              <code>aria-describedby</code>. Decorative layers are hidden from
              redundant navigation. Missing and clipped observations remain
              available in the table even if there is no eligible graphical
              control.
            </p>
            <p>
              Do not rely on color alone; use labels, units and the source
              table. Automated axe scans help catch defects, but do not replace
              manual assistive-technology review or establish automatic WCAG
              certification. Choose accessible colors and review the chart in
              your application context.
            </p>
          </DocSection>
          <DocSection idPrefix={idPrefix} id="responsive-and-server-rendering">
            <p>
              Width is responsive by default. Each chart measures its own
              container using <code>ResizeObserver</code> after mounting. Until
              a usable positive width is reported, a stable accessible
              placeholder reserves the requested height (280px by default) and
              the source table remains available. There is no server width
              guess. Without ResizeObserver support the placeholder remains.
            </p>
            <p>
              Positive finite numeric dimensions allow deterministic server SVG
              for category, linear and UTC Line/Area, categorical Bar, and
              Pie/Donut, with valid data/configuration. Invalid or too-small
              dimensions can make geometry unavailable; polar dimensions must
              exceed 16px, and all dimensions must be no greater than{' '}
              <code>Number.MAX_SAFE_INTEGER</code>. Explicit SVG can scale to a
              narrower CSS container without changing source coordinates.
            </p>
            <p>
              Local-time <code>xScale="time"</code> always starts with a
              matching server/initial hydration placeholder, then computes
              client-local geometry. Prefer UTC for cross-timezone SSR. Custom
              locale-sensitive formatters must produce consistent server/client
              text; do not assume host locale agreement. Independent hydrated
              React roots need distinct, matching server/client{' '}
              <code>identifierPrefix</code> values for IDs.
            </p>
            <p>
              React 18.2+ within 18 and React 19 are supported. The built ESM
              root retains its <code>"use client"</code> boundary for Next.js
              App Router. In a Server Component pass serializable data/props;
              define formatter, tooltip and activation functions inside a client
              component. Earlier packaged consumer checks covered Vite 8.3.4,
              Next 14.2.35 and Next 16.4.0 with Webpack, including App/Pages
              Router; that evidence does not validate arbitrary framework or
              browser versions. Read the{' '}
              <a
                href={`${repository}/blob/main/docs/CONSUMER_COMPATIBILITY.md`}
              >
                tested consumer versions and limits
              </a>
              .
            </p>
            <p>
              Rendering is static by default. Optional animation runs after
              mounting only when animation APIs and a non-reduced-motion
              preference are available; reduced motion disables/cancels it. SSR
              stays fully visible and meaningful. Host CSS and strict CSP must
              accommodate the library’s inline styles.
            </p>
          </DocSection>
          <DocSection idPrefix={idPrefix} id="limitations-and-troubleshooting">
            <p>
              The library intentionally does not aggregate records, sort source
              data, stack series, decimate or virtualize large datasets,
              zoom/pan, filter through interactive legends, or provide arbitrary
              geometry styling controls. It renders your records through a
              focused SVG API.
            </p>
            <ReferenceTable
              caption="Troubleshooting guide"
              columns={['Symptom', 'What to check']}
              rows={[
                [
                  'Chart shows no data',
                  'Check the source array and eligible values. An empty input, all missing/invalid observations or a polar total with no positive values produces No chart data.',
                ],
                [
                  'Invalid field mappings',
                  'Use actual string-named keys with compatible types and exactly yKey or series for Cartesian charts. Numeric strings are invalid; temporal X needs valid Date objects.',
                ],
                [
                  'Missing values or gaps',
                  'Null/undefined is missing, not zero. Line/Area break runs; grouped Bar reserves missing slots. Check the source table before changing data.',
                ],
                [
                  'Hidden or clipped observations',
                  'Explicit bounds clip marks without rewriting values. Widen or remove bounds if appropriate. Narrow layouts may omit axis titles/ticks or polar labels; source data remains available.',
                ],
                [
                  'Responsive chart awaits measurement',
                  'Check that the container has a usable positive width and ResizeObserver is available. Explicit positive numeric width can render without container measurement.',
                ],
                [
                  'Invalid numerical bounds',
                  'Use finite min/max with a usable ordered domain. Area and Bar numerical domains must include zero. Extreme arithmetic can make rendering unavailable.',
                ],
                [
                  'Pie/Donut unavailable',
                  'Check for any finite negative value, safe dimensions and proportions, and a Donut ratio strictly between 0 and 1. Negatives reject the entire chart.',
                ],
                [
                  'Small Pie/Donut sectors',
                  'Tiny positive sectors retain exact proportions and may be difficult pointer targets; use keyboard inspection and the complete source table. Labels use conservative fitting.',
                ],
                [
                  'Tooltip position constraints',
                  'Keep custom content short and noninteractive. Positioning is bounded approximately without portals or measurement of arbitrary content; tall output may overflow vertically.',
                ],
                [
                  'Dense datasets',
                  'Every eligible observation adds SVG/control cost. Choose a smaller meaningful dataset in your app; no performance budget, automatic aggregation or decimation is promised.',
                ],
                [
                  'React / peer setup',
                  'Install compatible React and React DOM with matching definitions. Use the ESM package root and a fresh local tarball, not an internal/source subpath.',
                ],
                [
                  'SSR / local-time differences',
                  'Use UTC for predictable full temporal SSR; time mode waits for the client timezone. Keep custom formatting deterministic and coordinate independent root identifier prefixes.',
                ],
              ]}
            />
            <p>
              For the authoritative contracts and behavioral detail, browse{' '}
              <a href={`${repository}/blob/main/docs/API_TYPE_CONTRACTS.md`}>
                API type contracts
              </a>{' '}
              and the{' '}
              <a href={`${repository}/tree/main/docs`}>
                chart documentation in the repository
              </a>
              . Wider browser, manual screen-reader and production performance
              review remain future work. Package publication and GitHub Pages
              deployment require separate authorization.
            </p>
            <p>
              <a href={`#${anchor('introduction')}`}>Back to introduction ↑</a>
            </p>
          </DocSection>
        </div>
      </div>
    </>
  );
}
