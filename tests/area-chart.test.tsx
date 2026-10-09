import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { AreaChart } from '../src';
import { normalizeCartesian } from '../src/core/data/cartesian';
import { buildCartesianGeometry } from '../src/core/geometry/cartesian';
import { linePath } from '../src/core/geometry/line';

it.each([
  [1, 3, 2],
  [-1, -3, -2],
  [-2, 3, -1],
  [0, 0, 0],
  [-2, 0, 3],
])(
  'renders exact area geometry and pure data boundaries for %j',
  (...values) => {
    const data = values.map((y, i) => ({ x: String(i), y }));
    const props = { data, xKey: 'x', yKey: 'y', width: 640 } as const;
    const geometry = buildCartesianGeometry({
      normalized: normalizeCartesian(props),
      family: 'area',
      width: 640,
      height: 280,
    });
    if (geometry.status !== 'ready' || geometry.family !== 'area')
      throw Error('Expected area');
    const { container } = render(<AreaChart {...props} />);
    const run = geometry.series[0]!.runs[0]!;
    expect(container.querySelector('[data-area-fill]')).toHaveAttribute(
      'd',
      run.path,
    );
    expect(container.querySelector('[data-area-fill]')).toHaveAttribute(
      'stroke',
      'none',
    );
    expect(container.querySelector('[data-area-fill]')).toHaveAttribute(
      'fill-opacity',
      '0.2',
    );
    const boundary = linePath(run.points);
    if (boundary.status !== 'ready') throw Error('Expected boundary');
    expect(run.outlinePath).toBe(boundary.data);
    expect(container.querySelector('[data-area-boundary]')).toHaveAttribute(
      'd',
      boundary.data,
    );
    expect(boundary.data).not.toContain('Z');
    const baseline = geometry.zeroBaseline!.position;
    for (const point of run.points) {
      expect(point.record).toBe(data[point.index]);
      expect(Math.sign(point.y - baseline)).toBe(-Math.sign(point.value) || 0);
    }
    const rect = container.querySelector('clipPath rect')!;
    for (const [attr, value] of Object.entries({
      x: geometry.plot.left,
      y: geometry.plot.top,
      width: geometry.plot.width,
      height: geometry.plot.height,
    }))
      expect(rect).toHaveAttribute(attr, String(value));
  },
);
it('keeps independent unstacked fills, gaps, singleton markers, source and series order and colors', () => {
  const data = [null, 2, 4, null, null, 3, null, 1, 5, null].map((a, i) => ({
    x: 'Repeated',
    a,
    b: i === 2 ? null : -2,
  }));
  const props = {
    data,
    xKey: 'x',
    series: [
      { key: 'b', label: 'Below', color: '#654321' },
      { key: 'a', label: 'Above', color: '#123456' },
    ],
    width: 640,
  } as const;
  const geometry = buildCartesianGeometry({
    normalized: normalizeCartesian(props),
    family: 'area',
    width: 640,
    height: 280,
  });
  if (geometry.status !== 'ready' || geometry.family !== 'area')
    throw Error('Expected area');
  const { container } = render(<AreaChart {...props} />);
  expect(
    [...container.querySelectorAll('[data-series]')].map((n) =>
      n.getAttribute('data-series'),
    ),
  ).toEqual(['b', 'a']);
  for (const result of geometry.series) {
    const group = container.querySelector(
      `[data-series="${result.series.key}"]`,
    )!;
    expect(
      [...group.querySelectorAll('[data-area-fill]')].map((n) =>
        n.getAttribute('d'),
      ),
    ).toEqual(result.runs.filter((r) => r.path !== null).map((r) => r.path));
    expect(
      [...group.querySelectorAll('circle')].map((n) =>
        Number(n.getAttribute('data-source-index')),
      ),
    ).toEqual(result.points.map((p) => p.index));
    expect(group).toHaveAttribute('fill', result.series.color);
    for (const run of result.runs)
      if (run.points.length === 1) {
        expect(run.path).toBeNull();
        expect(run.outlinePath).toBeNull();
      }
    for (const p of result.points)
      expect(p.value).toBe(data[p.index]![result.series.key as 'a' | 'b']);
  }
  expect(screen.getByRole('list')).toHaveTextContent('BelowAbove');
  expect(screen.getAllByRole('row')).toHaveLength(data.length + 1);
});
it('clips finite original out-of-bounds geometry and keeps complete source table', () => {
  const data = [
    { x: -2, y: -20 },
    { x: 4, y: 3 },
    { x: 12, y: 20 },
  ];
  const props = {
    data,
    xKey: 'x',
    yKey: 'y',
    xScale: 'linear',
    xAxis: { min: 0, max: 10 },
    yAxis: { min: -5, max: 5 },
    width: 640,
  } as const;
  const geometry = buildCartesianGeometry({
    normalized: normalizeCartesian(props),
    family: 'area',
    width: 640,
    height: 280,
    xAxis: props.xAxis,
    yAxis: props.yAxis,
  });
  if (geometry.status !== 'ready' || geometry.family !== 'area')
    throw Error('Expected area');
  const { container } = render(<AreaChart {...props} />);
  expect(geometry.requiresClipping).toBe(true);
  expect(container.querySelector('[data-area-fill]')).toHaveAttribute(
    'd',
    geometry.series[0]!.runs[0]!.path,
  );
  expect(container.querySelector('[data-layer="marks"]')).toHaveAttribute(
    'clip-path',
    `url(#${container.querySelector('clipPath')!.id})`,
  );
  expect(screen.getAllByRole('button')).toHaveLength(1);
  expect(screen.getAllByRole('row')).toHaveLength(4);
  expect(container.innerHTML).not.toMatch(/NaN|Infinity/);
});
it.each(['empty', 'unusable', 'pending'] as const)(
  'retains tables without phantom marks in %s',
  (state) => {
    const { container } = render(
      <AreaChart<{ x: string; y: number }>
        data={state === 'empty' ? [] : [{ x: 'A', y: 2 }]}
        xKey="x"
        yKey="y"
        {...(state === 'pending' ? {} : { width: 640 })}
        {...(state === 'unusable' ? { yAxis: { min: 2, max: 1 } } : {})}
      />,
    );
    expect(container.querySelector('svg')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveTextContent(
      state === 'empty'
        ? 'No chart data'
        : state === 'unusable'
          ? 'unavailable'
          : 'awaiting',
    );
  },
);
it('reuses axes, grid metadata, palette precedence and legend visibility', () => {
  const props = {
    data: [
      { x: 'A', a: 1, b: 2 },
      { x: 'B', a: 3, b: 4 },
    ],
    xKey: 'x',
    series: [{ key: 'a', color: '#123456' }, { key: 'b' }],
    colors: ['red', 'blue'],
    width: 640,
  } as const;
  const geometry = buildCartesianGeometry({
    normalized: normalizeCartesian(props),
    family: 'area',
    width: 640,
    height: 280,
  });
  if (geometry.status !== 'ready') throw Error('Expected geometry');
  const { container, rerender } = render(<AreaChart {...props} />);
  for (const axis of ['x', 'y'] as const)
    expect(
      [...container.querySelectorAll(`[data-axis="${axis}"] text`)].map(
        (n) => n.textContent,
      ),
    ).toEqual(geometry.layout.axes[axis]!.visibleTicks.map((t) => t.label));
  expect(container.querySelectorAll('[data-layer="grid"] line')).toHaveLength(
    geometry.layout.gridlines.length,
  );
  expect(container.querySelector('[data-series="a"]')).toHaveAttribute(
    'fill',
    '#123456',
  );
  expect(container.querySelector('[data-series="b"]')).toHaveAttribute(
    'stroke',
    'blue',
  );
  expect(container.querySelectorAll('li span')[1]).toHaveStyle({
    background: 'blue',
  });
  rerender(
    <AreaChart
      {...props}
      showGrid={false}
      showLegend={false}
      xAxis={{ show: false }}
      yAxis={{ show: false }}
    />,
  );
  expect(container.querySelector('[data-axis]')).toBeNull();
  expect(container.querySelector('[data-layer="grid"]')).toBeEmptyDOMElement();
  expect(screen.queryByRole('list')).toBeNull();
});
it('invalid X and Y end runs without bridging or fabricated values', () => {
  const data = [
    { x: 'A', y: 1 },
    { x: 'B', y: 2 },
    { x: null, y: 5 },
    { x: 'D', y: 3 },
    { x: 'E', y: Infinity },
    { x: 'F', y: 4 },
    { x: 'G', y: 5 },
  ];
  const { container } = render(
    <AreaChart data={data} xKey="x" yKey="y" width={640} />,
  );
  expect(container.querySelectorAll('[data-area-fill]')).toHaveLength(2);
  expect(container.querySelectorAll('[data-series] circle')).toHaveLength(5);
  expect(screen.getByRole('table')).toHaveTextContent('Missing');
  expect(screen.getByRole('table')).toHaveTextContent('Invalid');
  expect(screen.getAllByRole('row')).toHaveLength(8);
  for (const path of container.querySelectorAll('path'))
    expect(path.getAttribute('d')).not.toMatch(/NaN|Infinity/);
});
it('invalid mapping retains raw source fields without interactive observations', () => {
  render(
    <AreaChart data={[{ x: 'A', y: 4 }]} xKey="x" series={[]} width={640} />,
  );
  expect(screen.getByRole('img')).toHaveTextContent('unavailable');
  expect(screen.getByRole('table')).toHaveTextContent(
    'source data (chart mapping unavailable)',
  );
  expect(screen.getByRole('table')).toHaveTextContent('4');
  expect(screen.queryByRole('button')).toBeNull();
});
