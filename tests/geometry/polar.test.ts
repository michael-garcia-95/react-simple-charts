// @vitest-environment node
import { runInNewContext } from 'node:vm';
import { arc } from 'd3-shape';
import { describe, expect, it } from 'vitest';
import { normalizeSegments } from '../../src/core/data/segments';
import { buildPolarGeometry } from '../../src/core/geometry/polar';
import { validPolarPath } from '../../src/core/geometry/polar-arcs';
import type { CategoryValue } from '../../src/types/contracts';

interface Row {
  name?: CategoryValue | null;
  value?: number | null;
}
const normalize = (data: readonly Row[]) =>
  normalizeSegments({ data, nameKey: 'name', valueKey: 'value' });
function geometry(data: readonly Row[], family: 'pie' | 'donut' = 'pie') {
  return buildPolarGeometry({
    normalized: normalize(data),
    family,
    width: 216,
    height: 116,
  });
}
function ready(data: readonly Row[], family: 'pie' | 'donut' = 'pie') {
  const result = geometry(data, family);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready')
    throw new Error(JSON.stringify(result.diagnostics));
  return result;
}
const rows = (values: readonly number[]): Row[] =>
  values.map((value) => ({ name: 'duplicate', value }));

describe('pure polar geometry', () => {
  it.each(['pie', 'donut'] as const)(
    'generates an actual full-circle %s',
    (family) => {
      const result = ready(rows([7]), family);
      const slice = result.slices[0]!;
      expect(slice).toMatchObject({
        startAngle: 0,
        endAngle: 2 * Math.PI,
        percentage: 100,
        outerRadius: 50,
        innerRadius: family === 'pie' ? 0 : 30,
      });
      expect(slice.path).toBe(arc().digits(null)({ ...slice, padAngle: 0 }));
      expect(slice.path.match(/A/g)).toHaveLength(family === 'pie' ? 2 : 4);
      expect(result.total).toEqual({ status: 'finite', value: 7 });
    },
  );
  it.each(
    [
      [1, 3],
      [1, 1, 1],
      [9, 1, 5, 2],
      [0.1, 0.2, 0.3],
      [1e-300, 2e-300],
      [Number.MIN_VALUE, Number.MIN_VALUE],
      [Number.MAX_VALUE, Number.MAX_VALUE],
      [1e300, 1e295],
      [1, 1e-5],
    ].map((values) => [values] as const),
  )('retains finite proportions and angles for %j', (values) => {
    const result = ready(rows(values));
    expect(result.slices.map((slice) => slice.value)).toEqual(values);
    expect(
      result.slices.reduce((sum, slice) => sum + slice.percentage, 0),
    ).toBeCloseTo(100, 10);
    expect(
      result.slices.reduce((sum, slice) => sum + slice.angularSpan, 0),
    ).toBeCloseTo(2 * Math.PI, 12);
    for (const [index, slice] of result.slices.entries()) {
      expect(slice.startAngle).toBe(
        index ? result.slices[index - 1]!.endAngle : 0,
      );
      expect(slice.endAngle).toBeGreaterThan(slice.startAngle);
      expect(validPolarPath(slice.path)).toBe(true);
      expect(slice.path).not.toMatch(/NaN|Infinity/);
    }
  });
  it('starts at twelve o’clock and progresses clockwise with unequal proportions', () => {
    const result = ready(rows([1, 3]));
    expect(result.slices.map((slice) => slice.percentage)).toEqual([25, 75]);
    expect(result.slices[0]!.path).toMatch(/^M[^,]+,-50A50,50,0,0,1,/);
    expect(result.slices[0]!.endAngle).toBe(Math.PI / 2);
    expect(result.slices[1]!.angularSpan).toBe(1.5 * Math.PI);
  });
  it('preserves duplicate labels, original order, row IDs and record references', () => {
    const data = rows([2, 9, 1]);
    const result = ready(data);
    expect(result.slices.map((slice) => slice.segmentId)).toEqual([0, 1, 2]);
    result.slices.forEach((slice, index) => {
      expect(slice.record).toBe(data[index]);
      expect(slice.index).toBe(index);
      expect(slice.label).toBe('duplicate');
    });
  });
  it('retains ordinary and cross-realm Date references without mutation', () => {
    const dates = [
      new Date('2024-01-01'),
      runInNewContext('new Date(0)') as Date,
    ];
    const data = dates.map((name) => Object.freeze({ name, value: 1 }));
    const result = ready(Object.freeze(data));
    result.slices.forEach((slice, index) =>
      expect(slice.label).toBe(dates[index]),
    );
    expect(dates.map((date) => Date.prototype.getTime.call(date))).toEqual([
      1704067200000, 0,
    ]);
  });
  it('uses a centered circle in rectangular dimensions with an eight-pixel margin', () => {
    const result = ready(rows([1]));
    expect(result.viewport).toEqual({
      width: 216,
      height: 116,
      centerX: 108,
      centerY: 58,
      margin: 8,
      outerRadius: 50,
      innerRadius: 0,
    });
  });
  it.each([
    [[], 'no-source'],
    [rows([0, 0]), 'all-zero'],
    [[{ name: 'A', value: null }], 'no-eligible-positive'],
    [[{ value: 0 }], 'no-eligible-positive'],
  ] as const)('distinguishes empty state %j', (data, reason) => {
    const result = geometry(data);
    expect(result).toMatchObject({
      status: 'empty',
      reason,
      slices: [],
      total: { status: 'finite', value: 0 },
    });
    expect(result.normalized).toEqual(normalize(data));
  });
  it('excludes zero, missing and invalid fields without changing eligible totals or provenance', () => {
    const data = [
      { name: 'A', value: 2 },
      { name: 'zero', value: 0 },
      { value: 10 },
      { name: null, value: 20 },
      { name: 'missing' },
      { name: 'null', value: null },
      { name: 'string', value: '5' },
      { name: {}, value: 3 },
      { name: 'nan', value: NaN },
      { name: 'infinity', value: Infinity },
      { name: 'B', value: 6 },
    ] as unknown as Row[];
    const normalized = normalize(data);
    const result = buildPolarGeometry({
      normalized,
      family: 'pie',
      width: 116,
      height: 116,
    });
    expect(result.normalized).toBe(normalized);
    expect(result.normalizationDiagnostics).toBe(normalized.diagnostics);
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') return;
    expect(result.total).toEqual({ status: 'finite', value: 8 });
    expect(
      result.slices.map((slice) => [slice.index, slice.percentage]),
    ).toEqual([
      [0, 25],
      [10, 75],
    ]);
  });
  it.each(
    [rows([-1]), rows([1, -1]), [{ value: -1 }, { name: 'A', value: 4 }]].map(
      (data) => [data] as const,
    ),
  )('rejects every negative even with invalid labels: %j', (data) => {
    const result = geometry(data);
    expect(result).toMatchObject({
      status: 'unusable',
      diagnostics: [{ code: 'unsupported-negative' }],
    });
    expect(result.diagnostics[0]).toHaveProperty('rowIndex');
    expect(result).not.toHaveProperty('slices');
    expect(
      result.normalizationDiagnostics.some(
        (diagnostic) => diagnostic.code === 'unsupported-value',
      ),
    ).toBe(true);
  });
  it('reports raw-total overflow explicitly while preserving meaningful geometry', () => {
    const result = ready(rows([Number.MAX_VALUE, Number.MAX_VALUE]));
    expect(result.total).toEqual({ status: 'overflow' });
    expect(result.slices.map((slice) => slice.percentage)).toEqual([50, 50]);
  });
  it.each(
    [
      [Number.MAX_VALUE, Number.MIN_VALUE],
      [1, 1e-17],
      [1, 1e-13],
      [1, 1e-10],
    ].map((values) => [values] as const),
  )(
    'rejects lost positive angular precision without partial slices: %j',
    (values) => {
      const result = geometry(rows(values));
      expect(result.status).toBe('unusable');
      expect(result.diagnostics[0]!.code).toMatch(
        /unsafe-proportions|path-failed/,
      );
      expect(result.diagnostics[0]).toMatchObject({
        rowIndex: 1,
        segmentId: 1,
      });
      expect(result).not.toHaveProperty('slices');
    },
  );
  it.each([0, -1, NaN, Infinity, Number.MAX_VALUE, '116', null])(
    'rejects unsafe dimensions %j',
    (dimension) => {
      for (const axis of ['width', 'height']) {
        const result = buildPolarGeometry({
          normalized: normalize(rows([1])),
          family: 'pie',
          width: 116,
          height: 116,
          [axis]: dimension,
        } as Parameters<typeof buildPolarGeometry<Row>>[0]);
        expect(result).toMatchObject({
          status: 'unusable',
          diagnostics: [{ code: 'invalid-dimensions' }],
        });
      }
    },
  );
  it.each([16, 1, Number.MIN_VALUE])(
    'rejects dimensions without usable radius: %j',
    (width) => {
      expect(
        buildPolarGeometry({
          normalized: normalize(rows([1])),
          family: 'pie',
          width,
          height: 116,
        }),
      ).toMatchObject({
        status: 'unusable',
        diagnostics: [{ code: 'invalid-radius' }],
      });
    },
  );
  it.each([0, 1, -0.1, 1.1, NaN, Infinity, null, '0.6'])(
    'rejects invalid Donut ratio %j',
    (ratio) => {
      expect(
        buildPolarGeometry({
          normalized: normalize(rows([1])),
          family: 'donut',
          width: 116,
          height: 116,
          innerRadiusRatio: ratio as number,
        }),
      ).toMatchObject({
        status: 'unusable',
        diagnostics: [{ code: 'invalid-radius' }],
      });
    },
  );
  it('uses a custom ratio and shares all proportions and angles between families', () => {
    const normalized = normalize(rows([2, 3]));
    const donut = buildPolarGeometry({
      normalized,
      family: 'donut',
      width: 116,
      height: 116,
      innerRadiusRatio: 0.25,
    });
    const pie = ready(rows([2, 3]));
    expect(donut.status).toBe('ready');
    if (donut.status !== 'ready') return;
    expect(donut.viewport.innerRadius).toBe(12.5);
    expect(
      donut.slices.map(({ startAngle, endAngle, percentage }) => [
        startAngle,
        endAngle,
        percentage,
      ]),
    ).toEqual(
      pie.slices.map(({ startAngle, endAngle, percentage }) => [
        startAngle,
        endAngle,
        percentage,
      ]),
    );
  });
  it.each([1, 2])(
    'rejects a Donut hole lost by D3 path tolerances with %i slices',
    (count) => {
      const result = buildPolarGeometry({
        normalized: normalize(rows(Array.from({ length: count }, () => 1))),
        family: 'donut',
        width: 116,
        height: 116,
        innerRadiusRatio: 1e-20,
      });
      expect(result).toMatchObject({
        status: 'unusable',
        diagnostics: [{ code: 'path-failed' }],
      });
      expect(result).not.toHaveProperty('slices');
    },
  );
  it('rejects an underflowing Donut hole', () => {
    expect(
      buildPolarGeometry({
        normalized: normalize(rows([1])),
        family: 'donut',
        width: 16.000000000000004,
        height: 116,
        innerRadiusRatio: Number.MIN_VALUE,
      }),
    ).toMatchObject({
      status: 'unusable',
      diagnostics: [{ code: 'invalid-radius' }],
    });
  });
  it('rejects Pie ratio and invalid families at runtime', () => {
    for (const extra of [
      { family: 'pie', innerRadiusRatio: 0.6 },
      { family: 'other' },
    ]) {
      expect(
        buildPolarGeometry({
          normalized: normalize(rows([1])),
          width: 116,
          height: 116,
          ...extra,
        } as Parameters<typeof buildPolarGeometry<Row>>[0]),
      ).toMatchObject({
        status: 'unusable',
        diagnostics: [{ code: 'invalid-configuration' }],
      });
    }
  });
  it('preserves invalid normalization diagnostics', () => {
    const normalized = normalizeSegments({
      data: [],
      nameKey: 5,
      valueKey: 'value',
    } as never);
    const result = buildPolarGeometry({
      normalized,
      family: 'pie',
      width: 116,
      height: 116,
    });
    expect(result).toMatchObject({
      status: 'unusable',
      diagnostics: [{ code: 'normalization-unusable' }],
    });
    expect(result.normalizationDiagnostics).toBe(normalized.diagnostics);
  });
  it('is deterministic with deeply frozen normalization and source records', () => {
    const data = Object.freeze(
      rows([2, 0, 3]).map((row) => Object.freeze(row)),
    );
    const normalized = normalize(data);
    if (normalized.status !== 'normalized')
      throw new Error('Unexpected normalization');
    normalized.data.segments.forEach((segment) => {
      Object.freeze(segment.label);
      Object.freeze(segment.value);
      Object.freeze(segment);
    });
    Object.freeze(normalized.data.segments);
    Object.freeze(normalized.data);
    Object.freeze(normalized.diagnostics);
    Object.freeze(normalized);
    const input = Object.freeze({
      normalized,
      family: 'pie' as const,
      width: 116,
      height: 116,
    });
    expect(buildPolarGeometry(input)).toEqual(buildPolarGeometry(input));
    expect(data).toEqual(rows([2, 0, 3]));
  });
  it.each([
    'MNaN,0A1,1,0,0,1,2,2Z',
    'M0,0AInfinity,1,0,0,1,2,2Z',
    'M0,0A-1,1,0,0,1,2,2Z',
    'M0,0A1,1,0,2,1,2,2Z',
    'M0,0L1,1Z',
    'M0,0A1,1,0,0,1,2Z',
    null,
  ])('rejects malformed circular paths %j', (path) =>
    expect(validPolarPath(path)).toBe(false),
  );
});
