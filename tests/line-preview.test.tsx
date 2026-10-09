import { StrictMode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LinePreview } from '../src/internal/LinePreview';
import { normalizeCartesian } from '../src/core/data/cartesian';
import { buildCartesianGeometry } from '../src/core/geometry/cartesian';
import {
  installResizeObserver,
  latestObserver,
  TestResizeObserver,
} from './resize-observer';

const data = [
  { x: 'A', y: 1, other: 4 },
  { x: 'A', y: 2, other: null },
  { x: 'C', y: null, other: 6 },
  { x: 'D', y: 4, other: 7 },
  { x: 'E', y: 5, other: 8 },
];
beforeEach(installResizeObserver);
afterEach(() => vi.unstubAllGlobals());
describe('internal engine-based Line preview', () => {
  it('renders precise engine paths, separate gaps, singleton markers and original duplicate categories', () => {
    const props = { data, xKey: 'x', yKey: 'y', width: 640 } as const;
    const geometry = buildCartesianGeometry({
      normalized: normalizeCartesian(props),
      family: 'line',
      width: 640,
      height: 280,
    });
    const { container } = render(<LinePreview {...props} />);
    if (geometry.status !== 'ready' || geometry.family !== 'line')
      throw Error('Expected ready');
    expect(
      [...container.querySelectorAll('path')].map((path) =>
        path.getAttribute('d'),
      ),
    ).toEqual(
      geometry.series[0]!.runs.flatMap((run) =>
        run.path === null ? [] : [run.path],
      ),
    );
    expect(container.querySelectorAll('circle')).toHaveLength(4);
    expect(container.querySelectorAll('tbody th')[0]).toHaveTextContent('A');
    expect(container.querySelectorAll('tbody th')[1]).toHaveTextContent('A');
    expect(container.querySelector('tbody')).toHaveTextContent('Missing');
  });
  it('preserves ordered independent series, singleton points, colors and static legend', () => {
    const { container } = render(
      <LinePreview
        data={data}
        xKey="x"
        series={[
          { key: 'other', label: 'Forecast', color: '#123456' },
          { key: 'y' },
        ]}
        colors={['red', 'blue']}
        width={640}
      />,
    );
    const groups = [...container.querySelectorAll('[data-series]')];
    expect(groups.map((group) => group.getAttribute('data-series'))).toEqual([
      'other',
      'y',
    ]);
    expect(groups[0]).toHaveAttribute('fill', '#123456');
    expect(groups[1]).toHaveAttribute('stroke', 'blue');
    expect(groups[0]!.querySelectorAll('circle')).toHaveLength(4);
    expect(groups[0]!.querySelectorAll('path')).toHaveLength(1);
    expect(screen.getByRole('list')).toHaveTextContent('ForecastY');
    expect(container.querySelector('li span')).toHaveStyle({
      background: '#123456',
    });
  });
  it('renders selected tick labels exactly and does not call tick formatters again', () => {
    const formatTick = vi.fn((value: number) => `v${value}`);
    const props = {
      data,
      xKey: 'x',
      yKey: 'y',
      width: 240,
      yAxis: { formatTick },
    } as const;
    const geometry = buildCartesianGeometry({
      normalized: normalizeCartesian(props),
      family: 'line',
      width: 240,
      height: 280,
      yAxis: props.yAxis,
    });
    const calls = formatTick.mock.calls.length;
    formatTick.mockClear();
    const { container } = render(<LinePreview {...props} />);
    expect(formatTick).toHaveBeenCalledTimes(calls);
    if (geometry.status !== 'ready') throw Error('Expected ready');
    for (const axis of ['x', 'y'] as const)
      expect(
        [...container.querySelectorAll(`[data-axis="${axis}"] text`)].map(
          (text) => text.textContent,
        ),
      ).toEqual(
        geometry.layout.axes[axis]!.visibleTicks.map((tick) => tick.label),
      );
  });
  it('respects hidden axes, grid and legend', () => {
    const { container } = render(
      <LinePreview
        data={data}
        xKey="x"
        series={[{ key: 'y' }, { key: 'other' }]}
        width={640}
        xAxis={{ show: false }}
        yAxis={{ show: false }}
        showGrid={false}
        showLegend={false}
      />,
    );
    expect(container.querySelector('[data-axis]')).toBeNull();
    expect(
      container.querySelector('[data-layer="grid"]'),
    ).toBeEmptyDOMElement();
    expect(container.querySelector('ul')).toBeNull();
  });
  it('uses exact grid metadata and clips unchanged extrapolated points to plot bounds only', () => {
    const props = {
      data: [
        { x: -10, y: -10 },
        { x: 20, y: 20 },
      ],
      xKey: 'x',
      yKey: 'y',
      xScale: 'linear',
      xAxis: { min: 0, max: 10 },
      yAxis: { min: 0, max: 10 },
      width: 400,
    } as const;
    const geometry = buildCartesianGeometry({
      normalized: normalizeCartesian(props),
      family: 'line',
      width: 400,
      height: 280,
      xAxis: props.xAxis,
      yAxis: props.yAxis,
    });
    const { container } = render(<LinePreview {...props} />);
    if (geometry.status !== 'ready' || geometry.family !== 'line')
      throw Error('Expected ready');
    const clip = container.querySelector('clipPath')!;
    expect(container.querySelector('[data-layer="marks"]')).toHaveAttribute(
      'clip-path',
      `url(#${clip.id})`,
    );
    expect(clip.querySelector('rect')).toHaveAttribute(
      'x',
      String(geometry.plot.left),
    );
    expect(clip.querySelector('rect')).toHaveAttribute(
      'width',
      String(geometry.plot.width),
    );
    expect(container.querySelector('circle')).toHaveAttribute(
      'cx',
      String(geometry.series[0]!.points[0]!.x),
    );
    expect(container.querySelector('[data-layer="axes"]')).not.toHaveAttribute(
      'clip-path',
    );
    const lines = [...container.querySelectorAll('[data-layer="grid"] line')];
    expect(lines).toHaveLength(geometry.layout.gridlines.length);
    geometry.layout.gridlines.forEach((line, index) =>
      expect(lines[index]).toHaveAttribute('y1', String(line.position)),
    );
  });
  it.each([{ rows: [] }, { rows: [{ x: 'A', y: null }] }])(
    'keeps tables for empty data %j',
    ({ rows }) => {
      const { container } = render(
        <LinePreview
          data={rows as readonly { x: string; y: number | null }[]}
          xKey="x"
          yKey="y"
          width={640}
        />,
      );
      expect(screen.getByRole('img')).toHaveTextContent('No chart data');
      expect(container.querySelector('svg')).toBeNull();
      expect(screen.getByRole('table')).toBeInTheDocument();
    },
  );
  it('keeps source table for unusable geometry and honestly labels invalid entries', () => {
    render(
      <LinePreview
        data={[{ x: 'A', y: NaN }]}
        xKey="x"
        yKey="y"
        width={640}
        yAxis={{ min: 10, max: 0 }}
      />,
    );
    expect(screen.getByRole('img')).toHaveTextContent(
      'Chart rendering unavailable',
    );
    expect(screen.getByRole('table')).toHaveTextContent('Invalid');
  });
  it.each([0, -1, NaN, Infinity])(
    'rejects explicit invalid dimensions %s',
    (width) => {
      const { container } = render(
        <LinePreview
          data={data}
          xKey="x"
          yKey="y"
          width={width}
          height={width}
        />,
      );
      expect(container.querySelector('svg')).toBeNull();
      expect(screen.getByRole('img')).toHaveTextContent('unavailable');
      expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
    },
  );
  it('supports visible tables, naming, description and independent focus color', () => {
    render(
      <LinePreview
        data={data}
        xKey="x"
        yKey="y"
        width={640}
        accessibility={{
          label: 'Sales',
          description: 'Details',
          dataTable: 'visible',
        }}
      />,
    );
    const svg = screen.getByRole('img', { name: 'Sales' });
    expect(svg).toHaveAccessibleDescription('Details');
    expect(screen.getByRole('table')).not.toHaveStyle({ position: 'absolute' });
    fireEvent.focus(svg);
    expect(svg.getAttribute('style')).toContain('--rsc-focus-color');
    fireEvent.blur(svg);
    expect(svg.getAttribute('style')).not.toContain('outline:');
  });
  it('measures independent containers and ignores late Strict Mode callbacks after cleanup', () => {
    const { container, unmount } = render(
      <StrictMode>
        <LinePreview data={data} xKey="x" yKey="y" />
        <LinePreview data={data} xKey="x" yKey="y" />
      </StrictMode>,
    );
    const active = TestResizeObserver.instances.filter(
      (observer) => observer.disconnect.mock.calls.length === 0,
    );
    expect(active).toHaveLength(2);
    act(() => active[0]!.emit(450));
    expect(container.querySelectorAll('svg')).toHaveLength(1);
    act(() => active[1]!.emit(650));
    expect(
      [...container.querySelectorAll('svg')].map((svg) =>
        svg.getAttribute('width'),
      ),
    ).toEqual(['450', '650']);
    const ids = [...container.querySelectorAll('[id]')].map(
      (element) => element.id,
    );
    expect(new Set(ids).size).toBe(ids.length);
    act(() => active[0]!.emit(NaN));
    expect(container.querySelectorAll('svg')).toHaveLength(1);
    unmount();
    act(() => active.forEach((observer) => observer.emit(500)));
    expect(
      TestResizeObserver.instances.every(
        (observer) => observer.disconnect.mock.calls.length > 0,
      ),
    ).toBe(true);
  });
  it('switches widths without retaining a stale responsive measurement', () => {
    const { container, rerender } = render(
      <LinePreview data={data} xKey="x" yKey="y" />,
    );
    const old = latestObserver();
    act(() => old.emit(450));
    rerender(<LinePreview data={data} xKey="x" yKey="y" width={600} />);
    expect(old.disconnect).toHaveBeenCalled();
    rerender(<LinePreview data={data} xKey="x" yKey="y" />);
    expect(container.querySelector('svg')).toBeNull();
    act(() => old.emit(700));
    expect(container.querySelector('svg')).toBeNull();
    act(() => latestObserver().emit(500));
    expect(container.querySelector('svg')).toHaveAttribute('width', '500');
  });
  it('retains placeholder and hidden source table when ResizeObserver is absent', () => {
    vi.stubGlobal('ResizeObserver', undefined);
    render(<LinePreview data={data} xKey="x" yKey="y" />);
    expect(screen.getByRole('img')).toHaveTextContent('awaiting');
    expect(screen.getByRole('table')).toHaveStyle({ position: 'absolute' });
  });
});

it('preserves raw source data when chart mapping configuration is invalid', () => {
  render(<LinePreview data={data} xKey="x" series={[]} width={640} />);
  expect(screen.getByRole('img')).toHaveTextContent('unavailable');
  expect(screen.getByRole('table')).toHaveTextContent(
    'source data (chart mapping unavailable)',
  );
  expect(screen.getByRole('table')).toHaveTextContent('Other');
  expect(screen.getAllByRole('row')).toHaveLength(6);
});
it('renders fitting axis titles and conservatively omits oversized titles', () => {
  const { container, rerender } = render(
    <LinePreview
      data={data}
      xKey="x"
      yKey="y"
      width={640}
      xAxis={{ label: 'Month' }}
      yAxis={{ label: 'Revenue' }}
    />,
  );
  expect(container.querySelector('[data-axis="x"]')).toHaveTextContent('Month');
  expect(
    container.querySelector('[data-axis="y"] text[transform]'),
  ).toHaveTextContent('Revenue');
  rerender(
    <LinePreview
      data={data}
      xKey="x"
      yKey="y"
      width={640}
      xAxis={{ label: 'X'.repeat(100) }}
    />,
  );
  expect(container.querySelector('[data-axis="x"]')).not.toHaveTextContent(
    'X'.repeat(100),
  );
});
it('uses deterministic CSS token fallbacks with an empty explicit palette', () => {
  const { container } = render(
    <LinePreview
      data={data}
      xKey="x"
      series={[{ key: 'y' }, { key: 'other' }]}
      width={640}
      colors={[]}
    />,
  );
  expect(container.querySelector('[data-series="y"]')).toHaveAttribute(
    'stroke',
    'var(--rsc-series-1-color, var(--rsc-series-color, #2563eb))',
  );
  expect(container.querySelector('[data-series="other"]')).toHaveAttribute(
    'stroke',
    'var(--rsc-series-2-color, var(--rsc-series-color, #0d9488))',
  );
});
