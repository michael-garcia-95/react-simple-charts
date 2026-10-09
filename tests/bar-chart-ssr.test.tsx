// @vitest-environment node
import { renderToString } from 'react-dom/server';
import { expect, it } from 'vitest';
import { BarChart } from '../src';
it.each(['vertical', 'horizontal'] as const)(
  'renders deterministic browser-free %s SVG and complete tables',
  (orientation) => {
    expect(typeof window).toBe('undefined');
    const element = (
      <BarChart
        width={640}
        orientation={orientation}
        data={[
          { x: new Date('2026-01-01'), y: -2 },
          { x: 3, y: 0 },
        ]}
        xKey="x"
        yKey="y"
        animate
      />
    );
    const markup = renderToString(element);
    expect(renderToString(element)).toBe(markup);
    expect(markup).toContain('data-bar');
    expect(markup).toContain('<table');
    expect(markup).not.toMatch(/NaN|Infinity|opacity:0/);
  },
);
it.each([undefined, '100%'])(
  'keeps stable responsive placeholder for %s',
  (width) => {
    const markup = renderToString(
      <BarChart
        data={[{ x: 'A', y: 0 }]}
        xKey="x"
        yKey="y"
        {...(width === undefined ? {} : { width })}
      />,
    );
    expect(markup).not.toContain('<svg');
    expect(markup).toContain('height:280px');
    expect(markup).toContain('<table');
  },
);
