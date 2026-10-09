// @vitest-environment node
import { runInNewContext } from 'node:vm';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { normalizeCartesian } from '../src/core/data/cartesian';
import { DataTable, SourceDataTable } from '../src/internal/svg/DataTable';
import type { CategoryFormatter } from '../src/types/contracts';

const iso = '2026-03-07T12:34:56.000Z';
const factories = [
  {
    name: 'ordinary',
    create: (timestamp: number): Date => new Date(timestamp),
  },
  {
    name: 'cross-realm',
    create: (timestamp: number): Date =>
      runInNewContext('new Date(timestamp)', { timestamp }) as Date,
  },
];
function table(date: Date, formatCategory?: CategoryFormatter) {
  const record = Object.freeze({ date, value: 7 });
  const normalized = normalizeCartesian({
    data: [record],
    xKey: 'date',
    xScale: 'utc',
    yKey: 'value',
  });
  if (normalized.status !== 'normalized')
    throw Error('Expected normalized data');
  const markup = renderToStaticMarkup(
    <DataTable
      model={normalized.data}
      label="Dates"
      visible
      formatCategory={formatCategory}
      formatValue={undefined}
    />,
  );
  return { record, normalized, markup };
}
describe.each(factories)('$name table Dates', ({ name, create }) => {
  it('uses real Date objects accepted by normalization', () => {
    const date = create(Date.parse(iso));
    expect(date instanceof Date).toBe(name === 'ordinary');
    const { normalized } = table(date);
    expect(normalized.data.rows[0]!.x).toMatchObject({
      status: 'valid',
      value: date,
    });
    expect(Date.prototype.getTime.call(date)).toBe(Date.parse(iso));
  });
  it('defaults to deterministic ISO in normalized and raw source tables', () => {
    const date = create(Date.parse(iso));
    expect(table(date).markup).toContain(`<th scope="row">${iso}</th>`);
    expect(
      renderToStaticMarkup(
        <SourceDataTable data={[{ date }]} label="Dates" visible />,
      ),
    ).toContain(`<td>${iso}</td>`);
  });
  it('passes a protective Date copy to a mutating custom formatter', () => {
    const date = create(Date.parse(iso));
    const formatter = vi.fn((value) => {
      expect(value).toBeInstanceOf(Date);
      expect(value).not.toBe(date);
      (value as Date).setUTCFullYear(2000);
      return 'Formatted copy';
    });
    const { record, markup } = table(date, formatter);
    expect(formatter).toHaveBeenCalledOnce();
    expect(markup).toContain('Formatted copy');
    expect(record.date).toBe(date);
    expect(Date.prototype.getTime.call(record.date)).toBe(Date.parse(iso));
  });
  it('keeps invalid Dates safe in normalization and both tables', () => {
    const date = create(NaN);
    const formatter = vi.fn(() => 'Incorrect');
    const { normalized, markup } = table(date, formatter);
    expect(normalized.data.rows[0]!.x.status).toBe('invalid');
    expect(markup).toContain('<th scope="row">Invalid</th>');
    expect(formatter).not.toHaveBeenCalled();
    expect(
      renderToStaticMarkup(
        <SourceDataTable data={[{ date }]} label="Dates" visible />,
      ),
    ).toContain('<td>Invalid</td>');
  });
  it('falls back to original ISO when a formatter mutates its copy then throws', () => {
    const date = create(Date.parse(iso));
    const { markup } = table(date, (value) => {
      (value as Date).setTime(NaN);
      throw Error('Formatting failed');
    });
    expect(markup).toContain(iso);
    expect(Date.prototype.getTime.call(date)).toBe(Date.parse(iso));
  });
});
