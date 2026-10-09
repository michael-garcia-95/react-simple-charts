// @vitest-environment node
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { RenderingProbe } from '../src/internal/RenderingProbe';

describe('rendering proof in a browser-free Node environment', () => {
  it('imports and renders a complete deterministic SVG without browser globals', () => {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
    expect(typeof ResizeObserver).toBe('undefined');
    const element = (
      <RenderingProbe
        width={640}
        height={280}
        accessibility={{ label: 'Sales', description: 'Quarterly values' }}
      />
    );
    const markup = renderToString(element);
    expect(renderToString(element)).toBe(markup);
    expect(markup).toContain('viewBox="0 0 640 280"');
    expect(markup).toContain('<polyline');
    expect(markup).toContain('<title');
    expect(markup).toContain('Sales</title>');
    expect(markup).toContain('Quarterly values</desc>');
    expect(markup).toContain('<table');
    expect(markup).toContain('scope="row">Q4</th><td>32</td>');
    expect(markup).not.toContain('<style');
  });

  it('reserves default height and preserves data without speculative SVG', () => {
    const element = (
      <RenderingProbe
        accessibility={{ label: 'Sales', description: 'Quarterly values' }}
      />
    );
    const markup = renderToString(element);
    expect(renderToString(element)).toBe(markup);
    expect(markup).not.toContain('<svg');
    expect(markup).toContain('height:280px');
    expect(markup.replaceAll('<!-- -->', '')).toContain(
      'Sales — awaiting container measurement.',
    );
    expect(markup).toContain('Quarterly values');
    expect(markup.replaceAll('<!-- -->', '')).toMatch(
      /<caption[^>]*>Sales — data<\/caption>/,
    );
    expect(markup).toContain('<table');
  });

  it.each([0, -10, NaN, Infinity])(
    'treats invalid dimension %s safely',
    (dimension) => {
      const markup = renderToString(
        <RenderingProbe width={dimension} height={dimension} />,
      );
      expect(markup).not.toContain('<svg');
      expect(markup).toContain('height:280px');
      expect(markup).not.toMatch(/NaN|Infinity/);
    },
  );

  it('treats CSS widths as responsive and respects a valid intended height', () => {
    const markup = renderToString(<RenderingProbe width="80%" height={320} />);
    expect(markup).not.toContain('<svg');
    expect(markup).toContain('width:80%');
    expect(markup).toContain('height:320px');
  });

  it('assigns unique identifiers to sibling instances', () => {
    const markup = renderToString(
      <>
        <RenderingProbe width={600} />
        <RenderingProbe />
        <RenderingProbe width={600} />
      </>,
    );
    const ids = [...markup.matchAll(/\sid="([^"]+)"/g)].map(
      (match) => match[1],
    );
    expect(ids.length).toBe(3);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
