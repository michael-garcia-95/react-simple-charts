import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { navigation, sitePath } from './paths';
import type { SitePage } from './paths';
export { navigation } from './paths';
export type { Page } from './paths';

export const repository =
  'https://github.com/michael-garcia-95/react-simple-charts';
export function Container({ children }: { children: ReactNode }) {
  return <div className="container">{children}</div>;
}
function Brand() {
  return (
    <a
      className="brand"
      href={sitePath('/')}
      aria-label="React Simple Charts home"
    >
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
export function Navigation({ page }: { page: SitePage }) {
  return (
    <nav aria-label="Main navigation">
      {navigation.map((item) => (
        <a
          key={item.id}
          href={sitePath(item.href)}
          aria-current={page === item.id ? 'page' : undefined}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
export function Header({ page }: { page: SitePage }) {
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
    <a
      className={`button${secondary ? ' button-secondary' : ''}`}
      href={sitePath(href)}
    >
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
  language = 'Code',
  copyable = false,
}: {
  children: string;
  label: string;
  language?: string;
  copyable?: boolean;
}) {
  const [status, setStatus] = useState<{ source: string; message: string }>();
  const request = useRef(0);
  async function copy() {
    const currentRequest = ++request.current;
    const source = children;
    setStatus(undefined);
    let message: string;
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(source);
      message = 'Code copied.';
    } catch {
      message = 'Could not copy code. Select the code and copy it manually.';
    }
    if (request.current === currentRequest) setStatus({ source, message });
  }
  return (
    <div className="code-preview">
      <div className="code-toolbar">
        <p className="code-label">
          {label}
          <span className="code-language">{language}</span>
        </p>
        {copyable && (
          <button
            type="button"
            className="copy-code"
            onClick={() => void copy()}
            aria-label={`Copy code: ${label}`}
          >
            Copy code
          </button>
        )}
      </div>
      <pre tabIndex={0} aria-label={label}>
        <code>{children}</code>
      </pre>
      {copyable && (
        <p
          className="copy-status"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {status?.source === children ? status.message : ''}
        </p>
      )}
    </div>
  );
}
