// @vitest-environment node
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { normalizeCartesian } from '../src/core/data/cartesian';
import { normalizeSegments } from '../src/core/data/segments';
import { classifyNumber, classifyX } from '../src/core/data/values';
import type {
  CartesianNormalizationInput,
  NormalizationResult,
  SegmentNormalizationInput,
} from '../src/core/data/types';

function model<D>(result: NormalizationResult<D>): D {
  expect(result.status).toBe('normalized');
  if (result.status !== 'normalized')
    throw new Error('Expected normalized data');
  return result.data;
}
// Deliberately bypass static contracts to exercise JavaScript runtime validation.
function cartesian(input: unknown) {
  return normalizeCartesian(
    input as CartesianNormalizationInput<Record<string, number>>,
  );
}
function segments(input: unknown) {
  return normalizeSegments(
    input as SegmentNormalizationInput<Record<string, number>>,
  );
}

describe('numerical classification without coercion', () => {
  it.each([150, 0, -25, 12.5])('preserves finite %s', (value) => {
    expect(classifyNumber(value)).toEqual({
      status: 'valid',
      value,
      raw: value,
      present: true,
    });
  });
  it.each([null, undefined])('preserves missing %s', (raw) => {
    expect(classifyNumber(raw)).toEqual({
      status: 'missing',
      raw,
      present: true,
    });
  });
  it.each([
    NaN,
    Infinity,
    -Infinity,
    '150',
    true,
    false,
    {},
    [],
    Symbol('value'),
    1n,
  ])('rejects %s', (raw) => {
    expect(classifyNumber(raw)).toEqual({
      status: 'invalid',
      raw,
      present: true,
    });
  });
});

describe('Cartesian rows and traceability', () => {
  it('retains source references, duplicate labels, ordering and independent series states', () => {
    const date = Object.freeze(new Date('2026-01-01T00:00:00Z'));
    const data: readonly { x: string | Date; a?: number; b: number | null }[] =
      Object.freeze([
        Object.freeze({ x: 'same', a: 0, b: null }),
        Object.freeze({ x: 'same', a: -25, b: 12.5 }),
        Object.freeze({ x: date, b: 4 }),
      ]);
    const series = Object.freeze([
      Object.freeze({ key: 'b', label: 'B', color: 'red' }),
      Object.freeze({ key: 'a' }),
    ] as const);
    const input = { data, xKey: 'x', series } as const;
    const result = normalizeCartesian(input);
    const normalized = model(result);
    expect(normalized.series).toEqual([
      { index: 0, key: 'b', label: 'B', color: 'red' },
      { index: 1, key: 'a' },
    ]);
    expect(normalized.series[0]).not.toBe(series[0]);
    expect(normalized.rows.map((row) => row.index)).toEqual([0, 1, 2]);
    normalized.rows.forEach((row, index) =>
      expect(row.record).toBe(data[index]),
    );
    expect(normalized.rows[2]?.x.raw).toBe(date);
    expect(
      normalized.rows.map((row) => row.values.map((value) => value.status)),
    ).toEqual([
      ['missing', 'valid'],
      ['valid', 'valid'],
      ['valid', 'missing'],
    ]);
    expect(normalized.rows[2]?.values[1]).toEqual({
      status: 'missing',
      raw: undefined,
      present: false,
    });
    expect(result.diagnostics).toEqual([
      {
        scope: 'data',
        severity: 'warning',
        code: 'missing-value',
        description: 'missing value for field "b".',
        rowIndex: 0,
        field: 'b',
        seriesIndex: 0,
      },
      {
        scope: 'data',
        severity: 'warning',
        code: 'missing-value',
        description: 'missing value for field "a".',
        rowIndex: 2,
        field: 'a',
        seriesIndex: 1,
      },
    ]);
    expect(normalizeCartesian(input)).toEqual(result);
    expect(date.getTime()).toBe(Date.parse('2026-01-01T00:00:00Z'));
    expect(series).toHaveLength(2);
  });
  it('represents yKey as one series and preserves absent versus explicit undefined', () => {
    const result = cartesian({
      data: [{ x: 'a' }, { x: 'a', y: undefined }, { x: 'b', y: null }],
      xKey: 'x',
      yKey: 'y',
    });
    expect(model(result).series).toEqual([{ index: 0, key: 'y' }]);
    expect(model(result).rows.map((row) => row.values[0])).toEqual([
      { status: 'missing', raw: undefined, present: false },
      { status: 'missing', raw: undefined, present: true },
      { status: 'missing', raw: null, present: true },
    ]);
  });
  it('normalizes empty datasets without requiring fields to exist', () => {
    expect(model(cartesian({ data: [], xKey: 'x', yKey: 'y' })).rows).toEqual(
      [],
    );
  });
  it('retains entirely invalid values and emits row-specific diagnostics', () => {
    const result = cartesian({
      data: [
        { x: 'a', y: NaN },
        { x: 'b', y: '1' },
      ],
      xKey: 'x',
      yKey: 'y',
    });
    expect(model(result).rows.map((row) => row.values[0]?.status)).toEqual([
      'invalid',
      'invalid',
    ]);
    expect(
      result.diagnostics.map((d) => [
        d.code,
        d.rowIndex,
        d.field,
        d.seriesIndex,
      ]),
    ).toEqual([
      ['invalid-value', 0, 'y', 0],
      ['invalid-value', 1, 'y', 0],
    ]);
  });
  it('handles sparse arrays, malformed records and inherited fields without dropping indices', () => {
    const data = new Array<unknown>(4);
    data[1] = null;
    data[2] = Object.create({ x: 'inherited', y: 3 });
    data[3] = { x: 'own', y: 0 };
    const result = model(cartesian({ data, xKey: 'x', yKey: 'y' }));
    expect(result.rows.map((row) => row.index)).toEqual([0, 1, 2, 3]);
    expect(result.rows.map((row) => row.values[0]?.status)).toEqual([
      'missing',
      'missing',
      'missing',
      'valid',
    ]);
  });
});

describe('X scale classification', () => {
  const date = new Date('2026-01-01T00:00:00Z');
  it.each(['label', 0, -3, date])('preserves categorical %s', (raw) => {
    expect(classifyX(raw, true, 'category')).toEqual({
      status: 'valid',
      raw,
      value: raw,
      present: true,
    });
  });
  it.each([new Date(NaN), NaN, Infinity, true, {}])(
    'rejects invalid categorical %s',
    (raw) => {
      expect(classifyX(raw, true, 'category').status).toBe('invalid');
    },
  );
  it.each(['utc', 'time'] as const)(
    'preserves %s mode and unsorted/repeated Dates',
    (xScale) => {
      const earlier = new Date('2025-01-01T00:00:00Z');
      const data = [
        { x: date, y: 1 },
        { x: earlier, y: 2 },
        { x: date, y: 3 },
      ];
      const result = model(
        normalizeCartesian({ data, xKey: 'x', yKey: 'y', xScale }),
      );
      expect(result.xScale).toBe(xScale);
      expect(result.rows.map((row) => row.x.raw)).toEqual([
        date,
        earlier,
        date,
      ]);
      expect(result.rows[0]?.x.raw).toBe(date);
      expect(classifyX('2026-01-01', true, xScale).status).toBe('invalid');
      expect(classifyX(new Date(NaN), true, xScale).status).toBe('invalid');
    },
  );
  it('recognizes a genuine Date from another realm', () => {
    const date: unknown = runInNewContext('new Date(0)');
    expect(classifyX(date, true, 'utc')).toEqual({
      status: 'valid',
      raw: date,
      value: date,
      present: true,
    });
  });
  it('retains repeated, out-of-order linear numbers and rejects strings', () => {
    const result = model(
      cartesian({
        data: [4, -2, 4, '4', Infinity].map((x) => ({ x, y: 1 })),
        xKey: 'x',
        yKey: 'y',
        xScale: 'linear',
      }),
    );
    expect(result.rows.map((row) => row.x.raw)).toEqual([
      4,
      -2,
      4,
      '4',
      Infinity,
    ]);
    expect(result.rows.map((row) => row.x.status)).toEqual([
      'valid',
      'valid',
      'valid',
      'invalid',
      'invalid',
    ]);
  });
  it('distinguishes missing X from invalid X', () => {
    expect(classifyX(undefined, false, 'linear')).toEqual({
      status: 'missing',
      raw: undefined,
      present: false,
    });
    expect(classifyX(null, true, 'utc')).toEqual({
      status: 'missing',
      raw: null,
      present: true,
    });
  });
});

describe('atomic runtime configuration validation', () => {
  it.each([
    [{}, 'exclusive-values'],
    [{ yKey: 'y', series: [{ key: 'y' }] }, 'exclusive-values'],
    [{ series: [] }, 'empty-series'],
    [{ series: null }, 'invalid-series'],
    [{ series: [null] }, 'invalid-series'],
    [{ series: [1] }, 'invalid-series'],
    [{ series: [{}] }, 'invalid-key'],
    [{ series: [{ key: 1 }] }, 'invalid-key'],
    [{ series: [{ key: 'y', label: 2 }] }, 'invalid-series'],
    [{ series: [{ key: 'y', color: null }] }, 'invalid-series'],
    [{ series: [{ key: 'y' }, { key: 'y' }] }, 'duplicate-series-key'],
    [{ yKey: null }, 'invalid-key'],
    [{ yKey: Symbol('y') }, 'invalid-key'],
    [{ yKey: 'y', xKey: 1 }, 'invalid-key'],
    [{ yKey: 'y', xScale: 'log' }, 'invalid-scale'],
    [{ yKey: 'y', data: {} }, 'invalid-data'],
  ])('rejects configuration %j', (overrides, code) => {
    const result = cartesian({ data: [], xKey: 'x', ...overrides });
    expect(result.status).toBe('invalid-configuration');
    expect(result).not.toHaveProperty('data');
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        scope: 'configuration',
        severity: 'error',
        code,
      }),
    );
  });
  it.each([null, undefined, 3, []])(
    'rejects non-object %s in both paths',
    (input) => {
      for (const result of [cartesian(input), segments(input)]) {
        expect(result).toEqual({
          status: 'invalid-configuration',
          diagnostics: [
            {
              scope: 'configuration',
              severity: 'error',
              code: 'invalid-config',
              description: 'Configuration must be an object.',
            },
          ],
        });
      }
    },
  );
  it('accepts ordinary readonly series and legal empty-string field names', () => {
    const data: readonly { '': number; x: string }[] = [{ '': 3, x: 'a' }];
    const series: readonly { key: '' }[] = [{ key: '' }];
    expect(
      model(normalizeCartesian({ data, xKey: 'x', series })).rows[0]?.values[0],
    ).toEqual({ status: 'valid', raw: 3, value: 3, present: true });
  });
  it('rejects a hole in a series configuration rather than repairing it', () => {
    expect(
      cartesian({ data: [], xKey: 'x', series: new Array(1) }).diagnostics,
    ).toContainEqual(
      expect.objectContaining({ code: 'invalid-series', seriesIndex: 0 }),
    );
  });
  it.each([{ nameKey: 1 }, { valueKey: null }, { data: null }])(
    'validates segment configuration %j',
    (overrides) => {
      expect(
        segments({ data: [], nameKey: 'name', valueKey: 'value', ...overrides })
          .status,
      ).toBe('invalid-configuration');
    },
  );
});

describe('shared Pie/Donut segment model', () => {
  it('retains duplicate labels, raw values, identities and all unsupported records', () => {
    const values = [
      2,
      0,
      -1,
      null,
      undefined,
      NaN,
      Infinity,
      -Infinity,
      '2',
      true,
    ];
    const data = Object.freeze(
      values.map((value) => Object.freeze({ name: 'same', value })),
    );
    const input = { data, nameKey: 'name', valueKey: 'value' };
    const result = segments(input);
    const normalized = model(result);
    expect(normalized.segments.map((segment) => segment.value.status)).toEqual([
      'valid',
      'valid',
      'unsupported',
      'missing',
      'missing',
      'invalid',
      'invalid',
      'invalid',
      'invalid',
      'invalid',
    ]);
    normalized.segments.forEach((segment, index) => {
      expect(segment.record).toBe(data[index]);
      expect(segment.index).toBe(index);
      expect(segment.segmentId).toBe(index);
      expect(segment.label.raw).toBe('same');
      expect(segment.value.raw).toBe(values[index]);
      expect(segment).not.toHaveProperty('percentage');
    });
    expect(normalized.segments[2]?.value).toEqual({
      status: 'unsupported',
      reason: 'negative',
      raw: -1,
      present: true,
    });
    expect(result.diagnostics[0]).toEqual({
      scope: 'data',
      severity: 'warning',
      code: 'unsupported-value',
      description: 'unsupported value for field "value".',
      rowIndex: 2,
      field: 'value',
    });
    expect(segments(input)).toEqual(result);
  });
  it('keeps zero-total and empty datasets without invented percentages', () => {
    expect(
      model(
        normalizeSegments({
          data: [],
          nameKey: 'name',
          valueKey: 'value',
        } as SegmentNormalizationInput<{ name: string; value: number }>),
      ).segments,
    ).toEqual([]);
    const result = model(
      normalizeSegments({
        data: [
          { name: 'a', value: 0 },
          { name: 'b', value: 0 },
        ],
        nameKey: 'name',
        valueKey: 'value',
      }),
    );
    expect(result.segments.map((segment) => segment.value.status)).toEqual([
      'valid',
      'valid',
    ]);
    expect(result.segments.every((segment) => !('percentage' in segment))).toBe(
      true,
    );
  });
  it('classifies labels separately and retains absent fields', () => {
    const result = model(
      segments({
        data: [{}, { name: new Date(NaN), value: 1 }, { name: 42, value: 3 }],
        nameKey: 'name',
        valueKey: 'value',
      }),
    );
    expect(result.segments.map((segment) => segment.label.status)).toEqual([
      'missing',
      'invalid',
      'valid',
    ]);
    expect(result.segments[0]?.value).toEqual({
      status: 'missing',
      raw: undefined,
      present: false,
    });
  });
});

it('imports and executes in Node with no browser globals', () => {
  expect(typeof window).toBe('undefined');
  expect(typeof document).toBe('undefined');
  expect(typeof ResizeObserver).toBe('undefined');
  expect(
    model(
      normalizeCartesian({ data: [{ x: 'a', y: 1 }], xKey: 'x', yKey: 'y' }),
    ).rows,
  ).toHaveLength(1);
  expect(
    model(
      normalizeSegments({
        data: [{ name: 'a', value: 1 }],
        nameKey: 'name',
        valueKey: 'value',
      }),
    ).segments,
  ).toHaveLength(1);
});
