import { describe, expect, it, vi } from 'vitest';
import { navigation, pageFromPath, sitePath } from '../site/paths';
import { render, screen, within } from '@testing-library/react';
import { createElement } from 'react';
import { Site } from '../site/Site';

describe.each(['/', '/react-simple-charts/'])('site base %s', (base) => {
  it.each(navigation)(
    'resolves $id directory, index and slashless pages',
    ({ id, href }) => {
      const path = sitePath(href, base);
      expect(pageFromPath(path, base)).toBe(id);
      expect(pageFromPath(`${path}index.html`, base)).toBe(id);
      expect(pageFromPath(path.replace(/\/$/, '') || '/', base)).toBe(id);
    },
  );
  it('preserves external URLs, protocol-relative links and fragment-only links', () => {
    for (const path of [
      'https://github.com/a/b',
      '//example.com/a',
      '#chart-line',
    ])
      expect(sitePath(path, base)).toBe(path);
    expect(sitePath('/examples/#chart-donut', base)).toBe(
      `${base}examples/#chart-donut`,
    );
  });
  it('fails safely on unknown, nested and lookalike paths', () => {
    for (const path of [
      '/unknown/',
      '/react-simple-charts-evil/examples/',
      `${base}examples/other/`,
      `${base}examples//`,
      `${base}../about/`,
      `${base}index.html/`,
    ])
      expect(pageFromPath(path, base)).toBe('not-found');
    if (base !== '/')
      expect(pageFromPath('/examples/', base)).toBe('not-found');
  });
});
it('uses Vite base for all rendered internal links and safely displays unknown pages', () => {
  vi.stubEnv('BASE_URL', '/react-simple-charts/');
  try {
    const { rerender } = render(createElement(Site, { page: 'home' }));
    for (const link of screen.getAllByRole('link')) {
      const href = link.getAttribute('href')!;
      if (href.startsWith('/'))
        expect(href).toMatch(/^\/react-simple-charts\//);
    }
    expect(
      screen.getByRole('link', { name: /Explore examples/ }),
    ).toHaveAttribute('href', '/react-simple-charts/examples/');
    for (const family of ['line', 'area', 'bar', 'pie', 'donut'])
      expect(
        document.querySelector(
          `a[href="/react-simple-charts/examples/#chart-${family}"]`,
        ),
      ).toBeInTheDocument();
    rerender(createElement(Site, { page: 'not-found' }));
    expect(
      screen.getByRole('heading', { name: 'Page not found' }),
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByRole('navigation', { name: 'Main navigation' }),
      ).queryByRole('link', { current: 'page' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Return home' })).toHaveAttribute(
      'href',
      '/react-simple-charts/',
    );
  } finally {
    vi.unstubAllEnvs();
  }
});
