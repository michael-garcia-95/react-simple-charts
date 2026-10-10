import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Documentation, documentationSections } from '../site/Documentation';
import { documentationCode } from '../site/documentation-code';
import { Site } from '../site/Site';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

it.each(documentationSections)(
  'provides the $title section with a stable named anchor',
  ({ id, title }) => {
    render(<Documentation />);
    const heading = screen.getByRole('heading', { name: title, level: 2 });
    expect(heading).toHaveAttribute('id', `docs-${id}`);
    expect(heading).toHaveAttribute('tabindex', '-1');
    expect(heading.parentElement).toHaveAttribute(
      'aria-labelledby',
      heading.id,
    );
    expect(
      within(
        screen.getByRole('navigation', { name: 'Documentation sections' }),
      ).getByRole('link', { name: title }),
    ).toHaveAttribute('href', `#docs-${id}`);
  },
);
it('keeps every local fragment valid and unique, with a complete native table of contents', () => {
  const { container } = render(<Site page="documentation" />);
  const toc = screen.getByRole('navigation', {
    name: 'Documentation sections',
  });
  expect(within(toc).getAllByRole('link')).toHaveLength(14);
  const ids = [...container.querySelectorAll('[id]')].map((node) => node.id);
  expect(new Set(ids).size).toBe(ids.length);
  for (const link of container.querySelectorAll('a[href^="#"]')) {
    const id = link.getAttribute('href')!.slice(1);
    expect(ids.filter((candidate) => candidate === id)).toHaveLength(1);
  }
});
describe.each(['/', '/react-simple-charts/'])(
  'documentation base %s',
  (base) => {
    it('keeps page navigation and approved gallery deep links in the actual base', () => {
      vi.stubEnv('BASE_URL', base);
      const { container } = render(<Site page="documentation" />);
      for (const family of ['line', 'area', 'bar', 'pie', 'donut'])
        expect(
          screen.getByRole('link', {
            name: `Try the ${family} interactive example →`,
          }),
        ).toHaveAttribute('href', `${base}examples/#chart-${family}`);
      for (const link of container.querySelectorAll('a[href^="/"]'))
        expect(link.getAttribute('href')).toMatch(new RegExp(`^${base}`));
      expect(
        screen.getByRole('link', { name: 'Introduction' }),
      ).toHaveAttribute('href', '#docs-introduction');
      expect(
        screen.getByRole('link', { name: 'Source on GitHub' }),
      ).toHaveAttribute(
        'href',
        'https://github.com/michael-garcia-95/react-simple-charts',
      );
    });
  },
);
it.each(Object.entries(documentationCode))(
  'displays the authoritative %s TSX with a labeled scroll panel and copy action',
  (_, sample) => {
    render(<Documentation />);
    const panel = screen.getByLabelText(sample.label, { selector: 'pre' });
    expect(panel).toHaveAttribute('tabindex', '0');
    expect(panel.querySelector('code')!.textContent).toBe(sample.source);
    expect(sample.source).toContain("from 'react-simple-charts'");
    expect(sample.source).toContain('export function');
    expect(sample.source).toContain('accessibility={{');
    expect(
      screen.getByRole('button', { name: `Copy code: ${sample.label}` }),
    ).toBeInTheDocument();
  },
);
it('includes all five complete public imports and distinguishes source mappings', () => {
  render(<Documentation />);
  for (const name of [
    'LineChart',
    'AreaChart',
    'BarChart',
    'PieChart',
    'DonutChart',
  ])
    expect(screen.getByRole('heading', { name })).toBeInTheDocument();
  const mapping = document.querySelector('#docs-data-mapping')!.parentElement!;
  expect(mapping.textContent).toContain('mutually exclusive');
  expect(mapping.textContent).toContain('Missing is not zero');
  expect(mapping.textContent).toContain('Original source objects and indices');
  expect(mapping.textContent).toContain(
    'Repeated category labels remain distinct',
  );
  expect(documentationCode.line.source).toContain('revenue: number | null');
  expect(documentationCode.line.source).toContain('yKey="revenue"');
  expect(documentationCode.area.source).toContain('series={');
  expect(documentationCode.area.source).not.toContain('yKey=');
  for (const sample of [documentationCode.pie, documentationCode.donut]) {
    expect(sample.source).toContain('nameKey=');
    expect(sample.source).toContain('valueKey=');
    expect(sample.source).not.toContain('xKey=');
  }
});
it.each([
  [
    'line-chart',
    [
      'xScale',
      'linear',
      'utc',
      'time',
      'source order',
      'shared tooltips',
      'showGrid',
    ],
  ],
  [
    'area-chart',
    [
      'not stacked',
      'zero',
      'Singleton',
      'Boundary lines',
      'Missing',
      'Shared tooltips',
    ],
  ],
  [
    'bar-chart',
    [
      'defaults to vertical',
      'xKey',
      'physical horizontal axis',
      'physical vertical axis',
      'missing',
      'item tooltips',
    ],
  ],
  [
    'pie-chart',
    [
      'Zero-value records remain',
      'Any finite negative value rejects the entire chart',
      'never converted to absolute values',
      '0–100',
      'one decimal',
    ],
  ],
  [
    'donut-chart',
    [
      '0.6',
      'strictly between 0 and 1',
      'not clamped',
      'centerContent',
      'clipped',
      'Nested rings',
    ],
  ],
  [
    'common-configuration',
    [
      '280px',
      'Color precedence',
      'series.color',
      'original row index',
      'showLegend',
    ],
  ],
  [
    'tooltips-and-interactions',
    [
      'CartesianTooltipContext',
      'SegmentTooltipContext',
      'context.mode',
      'Home / End',
      'Enter / Space',
      'Escape',
      'pointer',
      'keyboard',
      'touch',
    ],
  ],
  [
    'accessibility',
    [
      'visually-hidden',
      'source order',
      'aria-describedby',
      'manual assistive-technology review',
      'WCAG',
    ],
  ],
  [
    'responsive-and-server-rendering',
    [
      'ResizeObserver',
      'placeholder',
      'UTC',
      'identifierPrefix',
      'use client',
      'reduced-motion',
      'Next',
    ],
  ],
  [
    'limitations-and-troubleshooting',
    [
      'Invalid field mappings',
      'Dense datasets',
      'Tooltip position constraints',
      'React / peer setup',
      'SSR / local-time',
    ],
  ],
])('documents verified behavior in %s', (id, phrases) => {
  render(<Documentation />);
  const text = document.querySelector(`#docs-${id}`)!.parentElement!
    .textContent!;
  for (const phrase of phrases)
    expect(text.toLowerCase()).toContain(phrase.toLowerCase());
});
it('separates current local availability from future public release installation', () => {
  render(<Documentation />);
  const text = document.querySelector('#docs-getting-started')!.parentElement!
    .textContent!;
  for (const phrase of [
    'MIT-licensed',
    'private',
    '0.0.0',
    'not published to npm',
    'not deployed',
    'ESM only',
    'single root entry',
    'React 18.2+',
    'React 19.x',
    'npm ci',
    'npm run build',
    'npm run dev:site',
    'npm pack',
    'react-simple-charts-0.0.0.tgz',
  ])
    expect(text).toContain(phrase);
  expect(text).not.toContain('npm install react-simple-charts');
  expect(
    screen.getByLabelText('Local tarball workflow', { selector: 'pre' }),
  ).toHaveAttribute('tabindex', '0');
});
it('keeps reference tables named, semantic and keyboard scrollable', () => {
  render(<Documentation />);
  const tables = screen.getAllByRole('table');
  expect(tables).toHaveLength(6);
  for (const table of tables) {
    expect(table).toHaveAccessibleName();
    expect(table.parentElement).toHaveAttribute('role', 'region');
    expect(table.parentElement).toHaveAttribute('tabindex', '0');
    expect(table.querySelector('th[scope="col"]')).toBeTruthy();
    expect(table.querySelector('th[scope="row"]')).toBeTruthy();
  }
});
it('supports isolated documentation instances and preserves copy focus through rerender', async () => {
  vi.stubGlobal('navigator', {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
  const pair = (
    <>
      <Documentation idPrefix="first" />
      <Documentation idPrefix="second" />
    </>
  );
  const { container, rerender } = render(pair);
  const ids = [...container.querySelectorAll('[id]')].map((node) => node.id);
  expect(new Set(ids).size).toBe(ids.length);
  const buttons = screen.getAllByRole('button', {
    name: `Copy code: ${documentationCode.line.label}`,
  });
  const button = buttons[0]!;
  button.focus();
  fireEvent.click(button);
  expect(await screen.findByText('Code copied.')).toBeInTheDocument();
  rerender(
    <>
      <Documentation idPrefix="first" />
      <Documentation idPrefix="second" />
    </>,
  );
  expect(button).toHaveFocus();
  expect(screen.getByText('Code copied.')).toBeInTheDocument();
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
    documentationCode.line.source,
  );
});
it('announces documentation copy success only after the Clipboard promise resolves', async () => {
  let finish: (() => void) | undefined;
  vi.stubGlobal('navigator', {
    clipboard: {
      writeText: () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    },
  });
  render(<Documentation />);
  fireEvent.click(
    screen.getByRole('button', {
      name: `Copy code: ${documentationCode.donut.label}`,
    }),
  );
  expect(screen.queryByText('Code copied.')).not.toBeInTheDocument();
  await act(async () => {
    finish?.();
  });
  expect(screen.getByText('Code copied.')).toHaveAttribute(
    'aria-live',
    'polite',
  );
});
it.each(['unsupported', 'denied'])(
  'retains selectable documentation source and manual-copy guidance when Clipboard is %s',
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
    render(<Documentation />);
    const button = screen.getByRole('button', {
      name: `Copy code: ${documentationCode.pie.label}`,
    });
    button.focus();
    fireEvent.click(button);
    expect(await screen.findByText(/Could not copy code/)).toHaveAttribute(
      'role',
      'status',
    );
    expect(screen.queryByText('Code copied.')).not.toBeInTheDocument();
    expect(
      screen.getByLabelText(documentationCode.pie.label, { selector: 'pre' })
        .textContent,
    ).toBe(documentationCode.pie.source);
    expect(button).toHaveFocus();
  },
);
