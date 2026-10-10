import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Site, pageFromPath } from '../site/Site';
import { navigation, repository } from '../site/components';
import { families } from '../site/charts';
import { allocation, revenue, trend } from '../site/data';

class Observer {
  constructor(private callback: ResizeObserverCallback) {}
  observe(target: Element) {
    this.callback(
      [{ target, contentRect: { width: 480 } } as ResizeObserverEntry],
      this as unknown as ResizeObserver,
    );
  }
  unobserve() {}
  disconnect() {}
}
beforeEach(() => vi.stubGlobal('ResizeObserver', Observer));

describe('public website foundation', () => {
  it.each(navigation)(
    'renders the $label page with shared landmarks and working navigation',
    ({ id, href }) => {
      render(<Site page={id} />);
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('main')).toHaveAttribute('id', 'main');
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
      const nav = screen.getByRole('navigation', { name: 'Main navigation' });
      expect(within(nav).getAllByRole('link')).toHaveLength(4);
      expect(nav.querySelector('[aria-current="page"]')).toHaveAttribute(
        'href',
        href,
      );
      for (const item of navigation)
        expect(
          within(nav).getByRole('link', { name: item.label }),
        ).toHaveAttribute('href', item.href);
      expect(
        screen.getByRole('link', { name: 'Skip to content' }),
      ).toHaveAttribute('href', '#main');
      for (const link of screen.getAllByRole('link')) {
        const target = link.getAttribute('href')!;
        expect(target).not.toBe('#');
        if (target.startsWith('/'))
          expect(
            navigation.some((item) => item.href === target.split('#')[0]),
          ).toBe(true);
        else if (target.startsWith('https:'))
          expect(target.startsWith(repository)).toBe(true);
      }
    },
  );
  it.each(navigation)(
    'maps $href and its static HTML path to $id',
    ({ id, href }) => {
      expect(pageFromPath(href)).toBe(id);
      expect(pageFromPath(`${href}index.html`)).toBe(id);
      expect(pageFromPath(href.replace(/\/$/, '') || '/')).toBe(id);
    },
  );
  it('renders all five genuine chart SVGs with accessible names and complete source tables', () => {
    const { container } = render(<Site page="examples" />);
    expect(container.querySelectorAll('main figure svg')).toHaveLength(5);
    expect(screen.getAllByRole('table')).toHaveLength(5);
    for (const family of families) {
      const article = container.querySelector(`#chart-${family}`)!;
      const svg = article.querySelector('figure svg')!;
      expect(svg).toHaveAttribute('viewBox', '0 0 480 240');
      expect(svg.querySelector('title')?.textContent).toMatch(
        new RegExp(`^${family}`, 'i'),
      );
      expect(
        article.querySelectorAll('svg [role="button"]').length,
      ).toBeGreaterThan(0);
      expect(article.querySelector('table')).toHaveAccessibleName(
        new RegExp(family, 'i'),
      );
      expect(article.querySelector('table')?.style.position).not.toBe(
        'absolute',
      );
    }
    const ids = [...container.querySelectorAll('[id]')].map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(
      screen.getByText(/fictional, deterministic data/),
    ).toBeInTheDocument();
  });
  it('links the homepage overview to existing gallery sections', () => {
    render(<Site page="home" />);
    for (const family of families)
      expect(
        document.querySelector(`a[href="/examples/#chart-${family}"]`),
      ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Explore examples/ }),
    ).toHaveAttribute('href', '/examples/');
    expect(screen.getAllByRole('table')).toHaveLength(1);
  });
  it('accurately describes availability and approved props without an npm installation claim', () => {
    render(<Site page="documentation" />);
    expect(screen.getByText(/not published to npm/)).toBeInTheDocument();
    expect(screen.getByText(/React 18.2.*React 19.x/)).toBeInTheDocument();
    const content = screen.getByRole('main').textContent!;
    expect(content).toContain(
      "import { LineChart } from 'react-simple-charts'",
    );
    expect(content).toContain('xKey="month"');
    expect(content).toContain("dataTable: 'visible'");
    expect(content).not.toContain('npm install react-simple-charts');
    expect(
      screen.getAllByRole('generic', {
        name: /Local repository workflow|LineChart · monthly revenue/,
      }),
    ).toHaveLength(2);
  });
  it.each(navigation)(
    'provides distinct $label HTML title and description before JavaScript runs',
    ({ id, label, href }) => {
      const html = readFileSync(
        resolve('site', id === 'home' ? 'index.html' : `${id}/index.html`),
        'utf8',
      );
      const doc = new DOMParser().parseFromString(html, 'text/html');
      expect(doc.title).toBe(`${label} | React Simple Charts`);
      expect(doc.documentElement.lang).toBe('en');
      expect(
        doc.querySelector('meta[name="description"]')?.getAttribute('content')
          ?.length,
      ).toBeGreaterThan(40);
      expect(doc.querySelector('meta[name="viewport"]')).toBeTruthy();
      expect(href).toMatch(/^\//);
    },
  );
  it('uses the built root export and keeps site files out of the library allowlist', () => {
    const chartSource = readFileSync(resolve('site/charts.tsx'), 'utf8');
    expect(chartSource).toContain("from 'react-simple-charts'");
    expect(chartSource).not.toMatch(/from ['"].*(?:src|internal|dist)/);
    const config = readFileSync(resolve('vite.site.config.ts'), 'utf8');
    expect(config).not.toMatch(/alias\s*:/);
    const manifest = JSON.parse(readFileSync(resolve('package.json'), 'utf8'));
    expect(manifest.files).toEqual(['dist', 'LICENSE']);
    expect(Object.keys(manifest.exports)).toEqual(['.']);
    expect(manifest.private).toBe(true);
    expect(manifest.version).toBe('0.0.0');
    expect(manifest.scripts['build:site']).toMatch(/^npm run build &&/);
  });
  it('keeps deterministic data, contained responsive grids, visible focus and reduced motion', () => {
    expect(revenue).toHaveLength(6);
    expect(trend.some((row) => row.change < 0)).toBe(true);
    expect(allocation.reduce((total, row) => total + row.value, 0)).toBe(100);
    const css = readFileSync(resolve('site/styles.css'), 'utf8');
    expect(css).toContain('prefers-reduced-motion: reduce');
    expect(css).toContain(':focus-visible');
    expect(css).toContain('minmax(0, 1fr)');
    expect(css).toContain('overflow-x: auto');
    expect(css).toContain('min-height: 44px');
  });
});
