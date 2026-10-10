import type { ReactNode } from 'react';

export const repository =
  'https://github.com/michael-garcia-95/react-simple-charts';
export const navigation = [
  { id: 'home', label: 'Home', href: '/' },
  { id: 'examples', label: 'Examples', href: '/examples/' },
  { id: 'documentation', label: 'Documentation', href: '/documentation/' },
  { id: 'about', label: 'About', href: '/about/' },
] as const;
export type Page = (typeof navigation)[number]['id'];
export function Container({ children }: { children: ReactNode }) {
  return <div className="container">{children}</div>;
}
function Brand() {
  return (
    <a className="brand" href="/" aria-label="React Simple Charts home">
      <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
        <path
          d="M4 25L12 16L19 20L28 7"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="16" r="3" fill="var(--secondary)" />
        <circle cx="28" cy="7" r="3" fill="var(--secondary)" />
      </svg>
      <span>React Simple Charts</span>
    </a>
  );
}
export function Navigation({ page }: { page: Page }) {
  return (
    <nav aria-label="Main navigation">
      {navigation.map((item) => (
        <a
          key={item.id}
          href={item.href}
          aria-current={page === item.id ? 'page' : undefined}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
export function Header({ page }: { page: Page }) {
  return (
    <header className="site-header">
      <Container>
        <div className="header-content">
          <Brand />
          <Navigation page={page} />
        </div>
      </Container>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <Container>
        <div className="footer-content">
          <p>
            React Simple Charts <span>· MIT-licensed open source</span>
          </p>
          <a href={repository}>
            Source on GitHub <span aria-hidden="true">→</span>
          </a>
        </div>
      </Container>
    </footer>
  );
}
export function ActionLink({
  href,
  secondary = false,
  children,
}: {
  href: string;
  secondary?: boolean;
  children: ReactNode;
}) {
  return (
    <a className={`button${secondary ? ' button-secondary' : ''}`} href={href}>
      {children}
    </a>
  );
}
export function SectionHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {children && <p>{children}</p>}
    </div>
  );
}
export function ChartCard({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <article className="chart-card" id={id} aria-labelledby={`${id}-title`}>
      <div className="card-heading">
        <p className="eyebrow">{id.replace('chart-', '')} chart</p>
        <h2 id={`${id}-title`}>{title}</h2>
        <p>{description}</p>
      </div>
      {children}
    </article>
  );
}
export function CodePreview({
  children,
  label,
}: {
  children: string;
  label: string;
}) {
  return (
    <div className="code-preview">
      <p className="code-label">{label}</p>
      <pre tabIndex={0} aria-label={label}>
        <code>{children}</code>
      </pre>
    </div>
  );
}
