// @vitest-environment node
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LinePreview } from '../src/internal/LinePreview';

describe('Line preview browser-free SSR', () => {
  it('renders deterministic explicit category SVG without DOM APIs', () => {
    expect(typeof window).toBe('undefined');
    expect(typeof ResizeObserver).toBe('undefined');
    const element = (
      <LinePreview
        data={[
          { x: 'A', y: 1 },
          { x: 'B', y: 2 },
        ]}
        xKey="x"
        yKey="y"
        width={640}
      />
    );
    const markup = renderToString(element);
    expect(renderToString(element)).toBe(markup);
    expect(markup).toContain('<path');
    expect(markup).toContain('viewBox="0 0 640 280"');
    expect(markup).toContain('<table');
  });
  it('renders linear and UTC explicit SVG', () => {
    expect(
      renderToString(
        <LinePreview
          data={[{ x: 1, y: 2 }]}
          xScale="linear"
          xKey="x"
          yKey="y"
          width={640}
        />,
      ),
    ).toContain('<svg');
    expect(
      renderToString(
        <LinePreview
          data={[{ x: new Date('2026-01-01T00:00:00Z'), y: 2 }]}
          xScale="utc"
          xKey="x"
          yKey="y"
          width={640}
        />,
      ),
    ).toContain('<svg');
  });
  it.each([undefined, '100%'])(
    'reserves height without guessing responsive width %s',
    (width) => {
      const markup = renderToString(
        <LinePreview
          data={[{ x: 'A', y: 1 }]}
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
  it('keeps local-time first render independent of server timezone and never evaluates time tick formatters', () => {
    const previous = process.env.TZ;
    let calls = 0;
    const element = (
      <LinePreview
        data={[
          { x: new Date('2026-03-07T00:00:00Z'), y: 2 },
          { x: new Date('2026-03-10T00:00:00Z'), y: 3 },
        ]}
        xScale="time"
        xKey="x"
        yKey="y"
        xAxis={{
          formatTick: (date) => {
            calls++;
            return date.toISOString();
          },
        }}
        width={640}
      />
    );
    try {
      process.env.TZ = 'UTC';
      const utc = renderToString(element);
      process.env.TZ = 'America/New_York';
      const ny = renderToString(element);
      expect(ny).toBe(utc);
      expect(utc).not.toContain('<svg');
      expect(utc).toContain('2026-03-07T00:00:00.000Z');
      expect(calls).toBe(0);
    } finally {
      if (previous === undefined) delete process.env.TZ;
      else process.env.TZ = previous;
    }
  });
});
