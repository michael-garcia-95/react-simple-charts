import {
  ActionLink,
  ChartCard,
  CodePreview,
  Container,
  Footer,
  Header,
  navigation,
  repository,
  SectionHeading,
} from './components';
import type { Page } from './components';
import { chartDescriptions, families, ShowcaseChart } from './charts';

export function pageFromPath(path: string): Page {
  const normalized =
    path.replace(/\/index\.html$/, '/').replace(/\/$/, '') || '/';
  return (
    navigation.find(
      (item) => (item.href.replace(/\/$/, '') || '/') === normalized,
    )?.id ?? 'home'
  );
}
const example = `import { LineChart } from 'react-simple-charts';

const revenue = [
  { month: 'Jan', revenue: 24 },
  { month: 'Feb', revenue: 32 },
  { month: 'Mar', revenue: 29 },
];

export function RevenueChart() {
  return (
    <LineChart
      data={revenue}
      xKey="month"
      yKey="revenue"
      formatValue={(value) => \`$\${value}k\`}
      accessibility={{
        label: 'Monthly revenue in thousands of dollars',
        dataTable: 'visible',
      }}
    />
  );
}`;
function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">React + TypeScript · Open source</p>
          <h1>
            Beautifully simple
            <br />
            charts for React.
          </h1>
          <p className="lead">
            Five interactive chart components with a focused API. Explore real
            examples, inspect the data, and make the presentation your own.
          </p>
          <div className="actions">
            <ActionLink href="/examples/">
              Explore examples <span aria-hidden="true">→</span>
            </ActionLink>
            <ActionLink href={repository} secondary>
              View on GitHub <span aria-hidden="true">→</span>
            </ActionLink>
          </div>
          <p className="hero-note">
            Built with SVG. Designed to fit your React application.
          </p>
        </div>
        <div className="hero-chart">
          <div className="hero-chart-heading">
            <div>
              <p className="eyebrow">A little perspective</p>
              <h2>Revenue over time</h2>
            </div>
            <span className="sample-label">Fictional data</span>
          </div>
          <ShowcaseChart family="line" visible={false} hero />
          <p className="chart-note">January–June · USD, thousands</p>
        </div>
      </section>
      <section className="overview">
        <SectionHeading
          eyebrow="Five ways to tell your story"
          title="The right shape for your data."
        >
          From trends over time to parts of a whole, start with one consistent
          set of components.
        </SectionHeading>
        <div className="family-grid">
          {families.map((family, index) => (
            <a
              className="family-link"
              href={`/examples/#chart-${family}`}
              key={family}
            >
              <span className="family-number">0{index + 1}</span>
              <h3>{family.charAt(0).toUpperCase() + family.slice(1)}</h3>
              <p>
                {family === 'line'
                  ? 'Follow a trend'
                  : family === 'area'
                    ? 'Give change context'
                    : family === 'bar'
                      ? 'Compare values'
                      : family === 'pie'
                        ? 'Show the parts'
                        : 'Frame the whole'}
              </p>
              <span aria-hidden="true">→</span>
            </a>
          ))}
        </div>
      </section>
      <section className="home-details">
        <div>
          <SectionHeading
            eyebrow="A focused foundation"
            title="Your data. A familiar React API."
          >
            Pass your records, choose their keys, and render a chart. TypeScript
            checks the mapping while the components handle responsive SVG and
            source-data alternatives.
          </SectionHeading>
          <a className="text-link" href="/documentation/">
            Get to know the API <span aria-hidden="true">→</span>
          </a>
        </div>
        <CodePreview label="A first chart">{`<LineChart\n  data={revenue}\n  xKey="month"\n  yKey="revenue"\n  accessibility={{ label: 'Monthly revenue' }}\n/>`}</CodePreview>
      </section>
    </>
  );
}
function Examples() {
  return (
    <>
      <div className="page-intro">
        <p className="eyebrow">The components, in action</p>
        <h1>
          Small examples.
          <br />
          Clear possibilities.
        </h1>
        <p className="lead">
          Five chart families, rendered by the real library. Every example uses
          fictional, deterministic data with a visible source table.
        </p>
        <p>
          Tab into a chart and use the arrow keys to inspect values. You can
          also hover or touch a mark.
        </p>
      </div>
      <div className="examples-grid">
        {families.map((family) => (
          <ChartCard
            key={family}
            id={`chart-${family}`}
            {...chartDescriptions[family]}
          >
            <ShowcaseChart family={family} />
          </ChartCard>
        ))}
      </div>
      <p className="afterword">
        Looking for the component API?{' '}
        <a href="/documentation/">Read the documentation introduction.</a>
      </p>
    </>
  );
}
function Documentation() {
  return (
    <>
      <div className="page-intro">
        <p className="eyebrow">Start with the essentials</p>
        <h1>
          A small API.
          <br />
          Room for your data.
        </h1>
        <p className="lead">
          React Simple Charts provides five SVG chart components with typed data
          mappings, tooltips, keyboard inspection, and accessible source-data
          alternatives.
        </p>
      </div>
      <div className="docs-layout">
        <div className="prose">
          <section>
            <h2>Five named components</h2>
            <p>
              Import LineChart, AreaChart, BarChart, PieChart and DonutChart
              from the package root. Cartesian charts use <code>xKey</code> with{' '}
              <code>yKey</code> or <code>series</code>; Pie and Donut use{' '}
              <code>nameKey</code> and <code>valueKey</code>.
            </p>
            <p>
              The TypeScript-first API infers your record type from{' '}
              <code>data</code> and checks field mappings. Use a string field
              for monthly categories and a numeric field for revenue, as in this
              example.
            </p>
          </section>
          <section>
            <h2>React compatibility</h2>
            <p>
              React and React DOM are peer dependencies. The supported range is
              React 18.2+ within React 18, and React 19.x. Compatibility is
              tested with React 18.2 and React 19 on Node 22 and 24.
            </p>
          </section>
          <section>
            <h2>Package availability</h2>
            <p>
              The package is private at version <code>0.0.0</code> and is not
              published to npm. Public installation instructions will follow an
              approved release.
            </p>
            <p>
              For local development, clone the repository and run the commands
              below. The website consumes the built package root; it does not
              import chart source files.
            </p>
            <CodePreview label="Local repository workflow">{`git clone ${repository}.git\ncd react-simple-charts\nnpm ci\nnpm run dev:site\n\n# Build the static website\nnpm run build:site`}</CodePreview>
            <p>
              For another local application, run <code>npm pack</code> in the
              repository and install the resulting local tarball. Provide a
              compatible React and React DOM in that application.
            </p>
          </section>
          <section>
            <h2>Explore the source</h2>
            <p>
              Detailed component contracts and implementation notes live in the
              repository’s{' '}
              <a href={`${repository}/tree/main/docs`}>
                developer documentation
              </a>
              . Browse the <a href="/examples/">examples gallery</a> to see each
              family.
            </p>
          </section>
        </div>
        <div className="docs-example">
          <CodePreview label="TypeScript / React · approved public API">
            {example}
          </CodePreview>
          <p className="chart-note">
            Responsive width is the default. The source-data alternative remains
            available for every chart.
          </p>
        </div>
      </div>
    </>
  );
}
function About() {
  return (
    <>
      <div className="page-intro">
        <p className="eyebrow">Focused by design</p>
        <h1>
          Good charts.
          <br />
          Less ceremony.
        </h1>
        <p className="lead">
          An independent open-source project for developers who want an
          approachable chart library with a small, consistent React component
          API.
        </p>
      </div>
      <div className="about-layout">
        <div className="prose">
          <section>
            <h2>Keep the essentials close</h2>
            <p>
              The project brings five familiar chart families together without
              asking you to adopt a dashboard framework. Your records stay your
              records: choose field mappings, adjust presentation, and inspect
              the underlying values.
            </p>
          </section>
          <section>
            <h2>Built on familiar tools</h2>
            <p>
              TypeScript defines the public API. SVG renders the graphics.
              Components respond to their own container dimensions and provide
              keyboard inspection alongside pointer and touch interaction.
            </p>
            <p>
              React 18.2 and React 19 compatibility is tested. Every chart
              retains a source-data table, with visible and visually hidden
              presentation options. These alternatives support access to the
              values behind the graphic.
            </p>
          </section>
          <section>
            <h2>Open source, with clear boundaries</h2>
            <p>
              React Simple Charts is MIT-licensed. The source, tests, and
              technical decisions are available on GitHub. The package has not
              yet been published to npm.
            </p>
            <p>
              Automated accessibility checks help guide development; they do not
              establish full WCAG certification. Wider browser testing, manual
              assistive-technology review, and production performance evaluation
              remain ongoing work.
            </p>
            <ActionLink href={repository}>
              Explore the repository <span aria-hidden="true">→</span>
            </ActionLink>
          </section>
        </div>
        <aside className="about-aside">
          <p className="eyebrow">At a glance</p>
          <ul>
            <li>Five chart families</li>
            <li>TypeScript-first API</li>
            <li>Responsive SVG</li>
            <li>React 18 / 19</li>
            <li>Source-data alternatives</li>
            <li>MIT-licensed</li>
          </ul>
          <ShowcaseChart family="donut" visible={false} />
          <p className="chart-note">Fictional revenue allocation</p>
        </aside>
      </div>
    </>
  );
}
export function Site({
  page = pageFromPath(window.location.pathname),
}: {
  page?: Page;
}) {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header page={page} />
      <main id="main" tabIndex={-1}>
        <Container>
          {page === 'home' ? (
            <Home />
          ) : page === 'examples' ? (
            <Examples />
          ) : page === 'documentation' ? (
            <Documentation />
          ) : (
            <About />
          )}
        </Container>
      </main>
      <Footer />
    </>
  );
}
