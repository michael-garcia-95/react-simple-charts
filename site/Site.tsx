import {
  ActionLink,
  CodePreview,
  Container,
  Footer,
  Header,
  repository,
  SectionHeading,
} from './components';
import { pageFromPath, sitePath } from './paths';
import type { SitePage } from './paths';
import { Documentation } from './Documentation';
import { InteractiveExample } from './InteractiveExample';
export { pageFromPath } from './paths';
import { families, ShowcaseChart } from './charts';

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
              href={sitePath(`/examples/#chart-${family}`)}
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
          <a className="text-link" href={sitePath('/documentation/')}>
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
          fictional, deterministic data. Try a dataset, adjust the settings, and
          copy the matching React example.
        </p>
        <p>
          Tab into a chart and use the arrow keys to inspect values. You can
          also hover or touch a mark.
        </p>
      </div>
      <nav className="example-jumps" aria-label="Chart families">
        {families.map((family) => (
          <a key={family} href={`#chart-${family}`}>
            {family.charAt(0).toUpperCase() + family.slice(1)}
          </a>
        ))}
      </nav>
      <div className="examples-grid">
        {families.map((family) => (
          <InteractiveExample key={family} family={family} />
        ))}
      </div>
      <p className="afterword">
        Looking for the component API?{' '}
        <a href={sitePath('/documentation/')}>
          Read the developer documentation.
        </a>
      </p>
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
  page?: SitePage;
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
          ) : page === 'about' ? (
            <About />
          ) : (
            <div className="page-intro">
              <h1>Page not found</h1>
              <p>This address does not match a website page.</p>
              <a href={sitePath('/')}>Return home</a>
            </div>
          )}
        </Container>
      </main>
      <Footer />
    </>
  );
}
