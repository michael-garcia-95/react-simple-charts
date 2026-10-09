import { act, fireEvent, render, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { AreaChart, BarChart, LineChart } from '../src';
import { installResizeObserver, TestResizeObserver } from './resize-observer';

const charts = [LineChart, AreaChart, BarChart] as const;
const data = [
  { x: 'NorthAmericaEnterpriseSubscriptions', y: -2 },
  { x: 'Repeated', y: 0 },
  { x: 'Repeated', y: 3 },
];
afterEach(() => vi.unstubAllGlobals());

it('keeps sibling IDs, tooltips, roving focus and activation independent through parent rerenders', () => {
  const activate = vi.fn();
  const page = (records = data) => (
    <>
      {charts.map((Chart, i) => (
        <Chart
          key={i}
          data={records}
          xKey="x"
          yKey="y"
          width={320}
          onDataActivate={activate}
        />
      ))}
    </>
  );
  const { container, rerender } = render(page());
  const ids = [...container.querySelectorAll('[id]')].map((el) => el.id);
  expect(new Set(ids).size).toBe(ids.length);
  const figures = [...container.querySelectorAll('figure')];
  for (const figure of figures) {
    const controls = within(figure).getAllByRole('button');
    expect(controls.filter((el) => el.tabIndex === 0)).toHaveLength(1);
    fireEvent.focus(controls[0]!);
    expect(within(figure).getByRole('tooltip')).toHaveTextContent(data[0]!.x);
    fireEvent.keyDown(controls[0]!, { key: 'End' });
    expect(controls.at(-1)).toHaveAttribute('tabindex', '0');
    fireEvent.keyDown(controls.at(-1)!, { key: 'Enter' });
    fireEvent.keyUp(controls.at(-1)!, { key: 'Enter' });
    fireEvent.click(controls.at(-1)!, { detail: 0 });
    fireEvent.keyDown(controls.at(-1)!, { key: 'Escape' });
    expect(within(figure).queryByRole('tooltip')).toBeNull();
  }
  expect(activate).toHaveBeenCalledTimes(3);
  for (const [payload] of activate.mock.calls) {
    expect(payload.record).toBe(data[2]);
    expect(payload.inputMethod).toBe('keyboard');
  }
  rerender(page());
  expect(
    [...container.querySelectorAll('clipPath')].map((el) => el.id),
  ).toEqual(ids.filter((id) => id.endsWith('-plot')));
  rerender(page(data.map((row) => ({ ...row, y: row.y + 1 }))));
  // Actual focused chart restores focus to the first new record, never the old selection.
  for (const tooltip of container.querySelectorAll('[role=tooltip]')) {
    expect(tooltip).toHaveTextContent('Y: -1');
    expect(tooltip).not.toHaveTextContent('Y: 3');
  }
  for (const figure of figures)
    expect(
      within(figure)
        .getAllByRole('button')
        .filter((el) => el.tabIndex === 0),
    ).toHaveLength(1);
});

it('measures five containers independently, preserves tables, handles invalid widths and disconnects every observer', () => {
  installResizeObserver();
  const { container, unmount } = render(
    <>
      {charts.map((Chart, i) => (
        <Chart key={i} data={data} xKey="x" yKey="y" />
      ))}
      <BarChart data={data} xKey="x" yKey="y" orientation="horizontal" />
      <BarChart data={data} xKey="x" series={[{ key: 'y' }]} />
    </>,
  );
  const figures = [...container.querySelectorAll('figure')];
  const tables = figures.map((el) => within(el).getByRole('table'));
  expect(TestResizeObserver.instances).toHaveLength(5);
  for (const width of [320, 480, 768, 1200, 320]) {
    for (const [index, observer] of TestResizeObserver.instances.entries()) {
      act(() => observer.emit(width + index));
      expect(figures[index]!.querySelector('svg')).toHaveAttribute(
        'width',
        String(width + index),
      );
      expect(within(figures[index]!).getByRole('table')).toBe(tables[index]);
    }
  }
  for (const observer of TestResizeObserver.instances)
    act(() => observer.emit(NaN));
  expect(container.querySelector('svg')).toBeNull();
  expect(container.querySelectorAll('table')).toHaveLength(5);
  unmount();
  for (const observer of TestResizeObserver.instances) {
    expect(observer.disconnect).toHaveBeenCalledOnce();
    act(() => observer.emit(640));
  }
});

it.each(charts)(
  'retains semantic source alternatives through empty, ready, unusable and replacement states',
  (Chart) => {
    const chart = (records = data, height = 280) => (
      <Chart
        data={records}
        xKey="x"
        yKey="y"
        width={320}
        height={height}
        accessibility={{ dataTable: 'visible' }}
      />
    );
    const { container, rerender } = render(chart([]));
    expect(within(container).getByRole('img')).toHaveTextContent(
      'No chart data',
    );
    expect(within(container).getByRole('table')).toBeInTheDocument();
    rerender(chart());
    fireEvent.focus(within(container).getAllByRole('button')[0]!);
    const tooltip = within(container).getByRole('tooltip');
    expect(tooltip).toHaveStyle({
      overflowWrap: 'anywhere',
      boxSizing: 'border-box',
    });
    const table = within(container).getByRole('table');
    expect(table).toHaveStyle({ overflowWrap: 'anywhere' });
    expect(
      within(table)
        .getAllByRole('rowheader')
        .map((el) => el.textContent),
    ).toEqual(data.map((row) => row.x));
    expect(
      within(table)
        .getAllByRole('cell')
        .map((el) => el.textContent),
    ).toEqual(['-2', '0', '3']);
    rerender(chart(data, 0));
    expect(within(container).getByRole('img')).toHaveTextContent('unavailable');
    expect(within(container).queryByRole('tooltip')).toBeNull();
    expect(within(container).getByRole('table')).toBe(table);
    rerender(chart([{ x: 'Replacement', y: 4 }]));
    expect(within(container).queryByRole('tooltip')).toBeNull();
    expect(within(container).getByRole('table')).toHaveTextContent(
      'Replacement',
    );
  },
);

it.each(charts)(
  'preserves a raw visible table on mapping failure with long source fields',
  (Chart) => {
    const { container } = render(
      <Chart
        data={data}
        xKey="x"
        series={[]}
        width={320}
        accessibility={{ dataTable: 'visible' }}
      />,
    );
    expect(within(container).getByRole('table')).toHaveStyle({
      overflowWrap: 'anywhere',
    });
    expect(within(container).getByRole('table')).toHaveTextContent(data[0]!.x);
    expect(within(container).queryByRole('button')).toBeNull();
  },
);
