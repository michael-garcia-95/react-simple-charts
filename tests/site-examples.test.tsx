import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Site } from '../site/Site';
import { families } from '../site/charts';
import type { Family } from '../site/charts';
import { InteractiveExample, LiveExample } from '../site/InteractiveExample';
import { CodePreview } from '../site/components';
import {
  defaultSettings,
  exampleCode,
  examplePreset,
} from '../site/example-code';
import { installResizeObserver, TestResizeObserver } from './resize-observer';

beforeEach(() => {
  installResizeObserver();
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
function measured() {
  // The repository observer fixture notifies each chart separately.
  for (const observer of TestResizeObserver.instances) observer.emit(480);
}
function setup(family: Family) {
  const result = render(<InteractiveExample family={family} />);
  act(measured);
  const article = result.container.querySelector('article')!;
  return {
    ...result,
    article,
    ui: within(article),
    source: () => article.querySelector('pre code')!.textContent!,
    figure: () => article.querySelector('figure')!,
  };
}

describe.each(families)('%s interactive example', (family) => {
  it('starts with a real named chart, complete source, correct import and deterministic preset', () => {
    const { ui, article, source } = setup(family);
    expect(ui.getByLabelText('Dataset')).toHaveValue('primary');
    expect(ui.getByLabelText('Show source table')).toBeChecked();
    expect(ui.getByLabelText('Enable animation')).not.toBeChecked();
    expect(article.querySelector('figure svg')).toHaveAttribute(
      'viewBox',
      '0 0 480 240',
    );
    expect(article.querySelector('figure svg title')?.textContent).toContain(
      examplePreset(family, 'primary').label,
    );
    expect(ui.getByRole('table').querySelectorAll('tbody tr')).toHaveLength(
      examplePreset(family, 'primary').data.length,
    );
    expect(source()).toBe(exampleCode(family, defaultSettings()));
    expect(source()).toContain("from 'react-simple-charts'");
    const rows = source()
      .split('const data = [')[1]!
      .split('];')[0]!
      .trim()
      .split('\n');
    expect(rows).toHaveLength(examplePreset(family, 'primary').data.length);
  });
  it('switches presets, mappings, table, labels and code; reset restores all defaults', () => {
    const { ui, article, source } = setup(family);
    const initial = source();
    fireEvent.change(ui.getByLabelText('Dataset'), {
      target: { value: 'alternative' },
    });
    expect(ui.getByLabelText('Dataset')).toHaveValue('alternative');
    expect(source()).toBe(
      exampleCode(family, { ...defaultSettings(), dataset: 'alternative' }),
    );
    expect(ui.getByRole('table').querySelectorAll('tbody tr')).toHaveLength(
      examplePreset(family, 'alternative').data.length,
    );
    expect(article.querySelector('svg title')?.textContent).toContain(
      examplePreset(family, 'alternative').label,
    );
    expect(
      article.querySelectorAll('svg [role="button"]').length,
    ).toBeGreaterThan(0);
    for (const label of [
      'Show legend',
      'Show source table',
      'Show tooltip',
      'Enable animation',
    ])
      fireEvent.click(ui.getByLabelText(label));
    if (family === 'line' || family === 'area' || family === 'bar')
      fireEvent.click(ui.getByLabelText('Show grid'));
    if (family === 'line' || family === 'area')
      fireEvent.click(ui.getByLabelText('Compare two series'));
    if (family === 'bar')
      fireEvent.change(ui.getByLabelText('Orientation'), {
        target: { value: 'horizontal' },
      });
    if (family === 'pie' || family === 'donut')
      fireEvent.click(ui.getByLabelText('Show slice labels'));
    if (family === 'donut')
      fireEvent.change(ui.getByLabelText('Inner-radius ratio'), {
        target: { value: '0.8' },
      });
    expect(source()).toBe(
      exampleCode(family, {
        ...defaultSettings(),
        dataset: 'alternative',
        showLegend: false,
        dataTable: 'visually-hidden',
        animate: true,
        tooltip: false,
        showGrid: !['line', 'area', 'bar'].includes(family),
        multiple: family === 'line' || family === 'area',
        orientation: family === 'bar' ? 'horizontal' : 'vertical',
        showLabels: family === 'pie' || family === 'donut',
        innerRadiusRatio: family === 'donut' ? 0.8 : 0.6,
      }),
    );
    fireEvent.click(ui.getByRole('button', { name: 'Reset' }));
    expect(source()).toBe(initial);
    expect(ui.getByLabelText('Dataset')).toHaveValue('primary');
    expect(ui.getByLabelText('Show legend')).toBeChecked();
    expect(ui.getByLabelText('Show source table')).toBeChecked();
    expect(ui.getByLabelText('Show tooltip')).toBeChecked();
    expect(ui.getByLabelText('Enable animation')).not.toBeChecked();
  });
  it('retains the semantic table and turns tooltip presentation off without disabling inspection', () => {
    const { ui, article, source } = setup(family);
    const table = ui.getByRole('table');
    fireEvent.click(ui.getByLabelText('Show source table'));
    expect(ui.getByRole('table')).toBe(table);
    expect(source()).toContain("dataTable: 'visually-hidden'");
    expect([
      table.style.position,
      table.parentElement?.style.position,
    ]).toContain('absolute');
    const entry = article.querySelector<SVGElement>(
      'svg [role="button"][tabindex="0"]',
    )!;
    fireEvent.focus(entry);
    expect(ui.getByRole('tooltip')).toBeInTheDocument();
    fireEvent.click(ui.getByLabelText('Show tooltip'));
    expect(ui.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(source()).toContain('tooltip={false}');
    expect(
      article.querySelectorAll('svg [role="button"]').length,
    ).toBeGreaterThan(0);
    fireEvent.click(ui.getByLabelText('Show tooltip'));
    expect(ui.getByRole('tooltip')).toBeInTheDocument();
  });
  it('routes animation to the real chart and cancels it when disabled', () => {
    const animate = vi.fn(() => ({ cancel: vi.fn() }));
    const descriptor = Object.getOwnPropertyDescriptor(
      SVGElement.prototype,
      'animate',
    );
    Object.defineProperty(SVGElement.prototype, 'animate', {
      configurable: true,
      value: animate,
    });
    try {
      const { ui, source } = setup(family);
      expect(animate).not.toHaveBeenCalled();
      fireEvent.click(ui.getByLabelText('Enable animation'));
      expect(animate).toHaveBeenCalledWith(
        [{ opacity: 0.65 }, { opacity: 1 }],
        { duration: 180, easing: 'ease-out' },
      );
      expect(source()).toContain('animate={true}');
      const cancel = animate.mock.results[0]!.value.cancel;
      fireEvent.click(ui.getByLabelText('Enable animation'));
      expect(cancel).toHaveBeenCalled();
    } finally {
      if (descriptor)
        Object.defineProperty(SVGElement.prototype, 'animate', descriptor);
      else Reflect.deleteProperty(SVGElement.prototype, 'animate');
    }
  });
  it('copies the currently visible source with polite feedback and no focus move', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const { ui, source } = setup(family);
    fireEvent.change(ui.getByLabelText('Dataset'), {
      target: { value: 'alternative' },
    });
    const copy = ui.getByRole('button', { name: /^Copy code:/ });
    copy.focus();
    fireEvent.click(copy);
    expect(writeText).toHaveBeenCalledWith(source());
    expect(await ui.findByRole('status')).toHaveTextContent('Code copied.');
    expect(ui.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    expect(copy).toHaveFocus();
    fireEvent.click(ui.getByLabelText('Show legend'));
    expect(ui.getByRole('status')).toBeEmptyDOMElement();
  });
});

it('keeps all five states, chart identities and source snippets independent during rerenders', () => {
  const { container, rerender } = render(<Site page="examples" />);
  act(measured);
  const snapshots = families.map(
    (family) => container.querySelector(`#chart-${family} pre`)!.textContent,
  );
  const line = within(container.querySelector('#chart-line')!);
  fireEvent.change(line.getByLabelText('Dataset'), {
    target: { value: 'alternative' },
  });
  fireEvent.click(line.getByLabelText('Compare two series'));
  rerender(<Site page="examples" />);
  families
    .slice(1)
    .forEach((family, index) =>
      expect(container.querySelector(`#chart-${family} pre`)!.textContent).toBe(
        snapshots[index + 1],
      ),
    );
  expect(line.getByLabelText('Dataset')).toHaveValue('alternative');
  const ids = [...container.querySelectorAll('[id]')].map((node) => node.id);
  expect(new Set(ids).size).toBe(ids.length);
});
it.each(['line', 'area', 'bar'] as const)(
  '%s grid changes the actual SVG and code',
  (family) => {
    const { ui, article, source } = setup(family);
    const grids = () =>
      article.querySelectorAll('line[stroke="var(--rsc-grid-color, #e5e7eb)"]');
    expect(grids().length).toBeGreaterThan(0);
    fireEvent.click(ui.getByLabelText('Show grid'));
    expect(grids()).toHaveLength(0);
    expect(source()).toContain('showGrid={false}');
  },
);
it.each(['line', 'area'] as const)(
  '%s series selection adds real series controls, complete table columns and a meaningful legend',
  (family) => {
    const { ui, article, source } = setup(family);
    expect(article.querySelectorAll('svg [role="button"]')).toHaveLength(6);
    expect(
      ui.queryByRole('list', { name: 'Chart series' }),
    ).not.toBeInTheDocument();
    fireEvent.click(ui.getByLabelText('Compare two series'));
    expect(article.querySelectorAll('svg [role="button"]')).toHaveLength(12);
    expect(ui.getByRole('table')).toHaveTextContent(
      family === 'area' ? 'Target' : 'Forecast',
    );
    expect(source()).toContain('series={');
    expect(source()).not.toContain('yKey=');
    expect(ui.getByRole('list', { name: 'Chart series' })).toBeInTheDocument();
    fireEvent.click(ui.getByLabelText('Show legend'));
    expect(
      ui.queryByRole('list', { name: 'Chart series' }),
    ).not.toBeInTheDocument();
  },
);
it.each(['bar', 'pie', 'donut'] as const)(
  '%s legend toggle updates the actual chart',
  (family) => {
    const { ui, figure } = setup(family);
    expect(figure().querySelector('ul')).toBeInTheDocument();
    fireEvent.click(ui.getByLabelText('Show legend'));
    expect(figure().querySelector('ul')).not.toBeInTheDocument();
  },
);
it('Bar orientation changes geometry while preserving source and matching code', () => {
  const { ui, article, source } = setup('bar');
  const initial = article.querySelector('[data-layer="marks"] rect')?.outerHTML;
  fireEvent.change(ui.getByLabelText('Orientation'), {
    target: { value: 'horizontal' },
  });
  expect(
    article.querySelector('[data-layer="marks"] rect')?.outerHTML,
  ).not.toBe(initial);
  expect(source()).toContain('orientation="horizontal"');
  expect(ui.getByRole('table')).toHaveTextContent('Actual');
  expect(ui.getByRole('table')).toHaveTextContent('Forecast');
});
it.each(['pie', 'donut'] as const)(
  '%s labels update actual decorative text and source',
  (family) => {
    const { ui, article, source } = setup(family);
    const labels = () => article.querySelectorAll('[data-layer="marks"] text');
    expect(labels()).toHaveLength(0);
    if (family === 'donut')
      fireEvent.change(ui.getByLabelText('Inner-radius ratio'), {
        target: { value: '0.4' },
      });
    fireEvent.click(ui.getByLabelText('Show slice labels'));
    expect(labels().length).toBeGreaterThan(0);
    expect(source()).toContain('showLabels={true}');
  },
);
it.each([0.4, 0.6, 0.8])(
  'Donut ratio %s changes actual ring paths and source',
  (ratio) => {
    const { ui, article, source } = setup('donut');
    fireEvent.change(ui.getByLabelText('Inner-radius ratio'), {
      target: { value: String(ratio) },
    });
    expect(source()).toContain(`innerRadiusRatio={${ratio}}`);
    expect(
      article.querySelector('[data-donut-center]')?.getAttribute('style'),
    ).toContain('width:');
    expect(
      article.querySelector('[data-layer="marks"] path')?.getAttribute('d'),
    ).toContain(`A${112 * ratio},${112 * ratio}`);
  },
);
it('retains educational zero and missing values in complete tables', () => {
  const { ui } = setup('bar');
  fireEvent.change(ui.getByLabelText('Dataset'), {
    target: { value: 'alternative' },
  });
  const table = ui.getByRole('table');
  expect(table).toHaveTextContent('Music');
  expect(table).toHaveTextContent('0 orders');
  expect(table).toHaveTextContent('Missing');
  expect(document.querySelector('pre code')!.textContent).toContain(
    'category: "Music", orders: 0',
  );
  expect(document.querySelector('pre code')!.textContent).toContain(
    'category: "Art", orders: null',
  );
});
it.each(['unsupported', 'denied'])(
  'clipboard %s reports manual copying accessibly without claiming success',
  async (mode) => {
    vi.stubGlobal(
      'navigator',
      mode === 'unsupported'
        ? {}
        : {
            clipboard: {
              writeText: vi.fn().mockRejectedValue(new Error('Denied')),
            },
          },
    );
    render(
      <CodePreview label="Example" copyable>
        selectable source
      </CodePreview>,
    );
    const button = screen.getByRole('button', { name: /Copy code/ });
    button.focus();
    fireEvent.click(button);
    expect(await screen.findByText(/Could not copy code/)).toHaveAttribute(
      'role',
      'status',
    );
    expect(screen.queryByText('Code copied.')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Example')).toHaveAttribute('tabindex', '0');
    expect(button).toHaveFocus();
  },
);
it('does not announce stale copy success when code changes during clipboard resolution', async () => {
  let finish: (() => void) | undefined;
  vi.stubGlobal('navigator', {
    clipboard: {
      writeText: () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    },
  });
  const { rerender } = render(
    <CodePreview label="Example" copyable>
      old source
    </CodePreview>,
  );
  fireEvent.click(screen.getByRole('button', { name: /Copy code/ }));
  rerender(
    <CodePreview label="Example" copyable>
      new source
    </CodePreview>,
  );
  await act(async () => {
    finish?.();
  });
  expect(screen.getByRole('status')).toBeEmptyDOMElement();
});
it.each(families)(
  '%s keeps keyboard chart access, focus and independent data replacement',
  (family) => {
    const { container, rerender } = render(
      <LiveExample family={family} state={defaultSettings()} />,
    );
    act(measured);
    const entry = container.querySelector<SVGElement>(
      'svg [role="button"][tabindex="0"]',
    )!;
    act(() => entry.focus());
    fireEvent.keyDown(entry, { key: 'ArrowRight' });
    expect(document.activeElement).not.toBe(entry);
    expect(document.activeElement?.getAttribute('aria-label')).toBeTruthy();
    rerender(
      <LiveExample
        family={family}
        state={{ ...defaultSettings(), showLegend: false }}
      />,
    );
    expect(document.activeElement?.getAttribute('role')).toBe('button');
    rerender(
      <LiveExample
        family={family}
        state={{ ...defaultSettings(), dataset: 'alternative' }}
      />,
    );
    expect(container.querySelector('svg title')?.textContent).toContain(
      examplePreset(family, 'alternative').label,
    );
    const tooltip = container.querySelector('[role="tooltip"]');
    if (tooltip) {
      expect(family).toBe('bar');
      expect(tooltip.textContent).toContain('orders');
      expect(tooltip.textContent).not.toContain('$');
    }
  },
);

it.each(families)(
  '%s respects reduced motion when animation is requested',
  (family) => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    const animate = vi.fn();
    const descriptor = Object.getOwnPropertyDescriptor(
      SVGElement.prototype,
      'animate',
    );
    Object.defineProperty(SVGElement.prototype, 'animate', {
      configurable: true,
      value: animate,
    });
    try {
      const { ui, article } = setup(family);
      fireEvent.click(ui.getByLabelText('Enable animation'));
      expect(animate).not.toHaveBeenCalled();
      expect(article.querySelector('figure svg')).toBeInTheDocument();
    } finally {
      if (descriptor)
        Object.defineProperty(SVGElement.prototype, 'animate', descriptor);
      else Reflect.deleteProperty(SVGElement.prototype, 'animate');
    }
  },
);
