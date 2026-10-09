// @vitest-environment node
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { createXScale } from '../../src/core/scales/cartesian';
import { createTemporalScale } from '../../src/core/scales/temporal';
import { model, normalized, ready } from './helpers';

describe('UTC and local-time scales', () => {
  it.each(['utc', 'time'])(
    '%s handles unsorted/repeated Dates with exact references',
    (mode) => {
      const later = new Date('2026-01-03T00:00:00Z');
      const earlier = new Date('2026-01-01T00:00:00Z');
      const repeated = new Date(later.getTime());
      const data = [later, earlier, repeated].map((x) => ({ x, y: 1 }));
      const result = normalized(data, mode);
      const scale = ready(createTemporalScale(model(result), [0, 200]));
      expect(scale.domain.observed).toEqual([earlier, later]);
      expect(scale.domain.observed?.[0]).toBe(earlier);
      expect(scale.domain.observed?.[1]).toBe(later);
      expect(scale.domain.domain).toEqual([earlier, later]);
      expect(scale.map(earlier)).toEqual({ status: 'mapped', position: 0 });
      expect(scale.map(new Date('2026-01-02T00:00:00Z'))).toEqual({
        status: 'mapped',
        position: 100,
      });
      expect(scale.map(later)).toEqual({ status: 'mapped', position: 200 });
      expect(model(result).rows.map((row) => row.x.raw)).toEqual([
        later,
        earlier,
        repeated,
      ]);
      scale.ticks.forEach((tick) => {
        expect(tick.value).toBeInstanceOf(Date);
        expect(scale.map(tick.value)).toEqual({
          status: 'mapped',
          position: tick.position,
        });
      });
      expect(createXScale(result, [0, 100])).toMatchObject({
        status: 'ready',
        kind: mode,
      });
    },
  );
  it.each(['utc', 'time'])(
    '%s ignores invalid/missing dates and never parses strings',
    (mode) => {
      const scale = ready(
        createTemporalScale(
          model(
            normalized(
              [
                { x: new Date(0) },
                { x: '2026-01-01' },
                { x: new Date(NaN) },
                {},
                { x: null },
                { x: new Date(1000) },
              ],
              mode,
            ),
          ),
          [0, 100],
        ),
      );
      expect(scale.domain.observed).toEqual([new Date(0), new Date(1000)]);
      expect(scale.map(new Date(NaN)).status).toBe('unusable');
      expect(scale.map('2026-01-01' as unknown as Date)).toEqual({
        status: 'unusable',
        reason: 'invalid-value',
      });
    },
  );
  it('accepts cross-realm Dates without calling custom valueOf', () => {
    const foreign = runInNewContext('new Date(0)') as Date;
    const date = new Date(1000);
    date.valueOf = () => {
      throw new Error('Do not call user valueOf');
    };
    const scale = ready(
      createTemporalScale(
        model(normalized([{ x: date }, { x: foreign }], 'utc')),
        [0, 100],
      ),
    );
    expect(scale.map(foreign)).toEqual({ status: 'mapped', position: 0 });
    expect(scale.map(date)).toEqual({ status: 'mapped', position: 100 });
  });
  it.each(['utc', 'time'])(
    '%s expands a single timestamp by one millisecond per side',
    (mode) => {
      const date = new Date(1000);
      const scale = ready(
        createTemporalScale(
          model(normalized([{ x: date }, { x: date }], mode)),
          [100, 0],
        ),
      );
      expect(scale.domain).toMatchObject({
        observed: [date, date],
        domain: [new Date(999), new Date(1001)],
        expanded: true,
        origin: 'data',
      });
      expect(scale.map(date)).toEqual({ status: 'mapped', position: 50 });
      expect(date.getTime()).toBe(1000);
    },
  );
  it.each(['utc', 'time'])(
    '%s returns fallback metadata without mapping empty temporal data',
    (mode) => {
      for (const data of [[], [{ x: null }], [{ x: '2026-01-01' }]]) {
        const scale = createTemporalScale(
          model(normalized(data, mode)),
          [0, 100],
        );
        expect(scale).toMatchObject({
          status: 'empty',
          domain: {
            observed: null,
            domain: [new Date(0), new Date(86_400_000)],
            origin: 'fallback',
          },
          ticks: [],
        });
        expect(scale).not.toHaveProperty('map');
      }
    },
  );
  it.each([-8_640_000_000_000_000, 8_640_000_000_000_000])(
    'expands boundary timestamp %s inward',
    (time) => {
      const date = new Date(time);
      const scale = ready(
        createTemporalScale(model(normalized([{ x: date }], 'utc')), [0, 100]),
      );
      const expected =
        time < 0 ? [date, new Date(time + 1)] : [new Date(time - 1), date];
      expect(scale.domain.domain).toEqual(expected);
      expect(scale.map(date)).toEqual({
        status: 'mapped',
        position: time < 0 ? 0 : 100,
      });
      expect(scale.ticks.length).toBeGreaterThan(0);
      scale.ticks.forEach((tick) =>
        expect(Number.isFinite(tick.value.getTime())).toBe(true),
      );
    },
  );
  it('maps the complete JavaScript Date interval', () => {
    const min = new Date(-8_640_000_000_000_000);
    const max = new Date(8_640_000_000_000_000);
    const scale = ready(
      createTemporalScale(
        model(normalized([{ x: max }, { x: min }], 'utc')),
        [0, 100],
      ),
    );
    expect(scale.map(new Date(0))).toEqual({ status: 'mapped', position: 50 });
    expect(scale.map(max)).toEqual({ status: 'mapped', position: 100 });
  });
  it('rejects a non-temporal normalized mode', () => {
    expect(createTemporalScale(model(normalized([])), [0, 100])).toMatchObject({
      status: 'unusable',
      diagnostics: [{ code: 'incompatible-x-scale' }],
    });
  });
  it('generates deterministic UTC ticks and coordinates', () => {
    const scale = ready(
      createTemporalScale(
        model(
          normalized(
            [
              { x: new Date('2026-01-01T00:00:00Z') },
              { x: new Date('2026-01-03T00:00:00Z') },
            ],
            'utc',
          ),
        ),
        [0, 200],
        { tickCount: 2 },
      ),
    );
    expect(scale.ticks).toEqual(
      [1, 2, 3].map((day, index) => ({
        value: new Date(`2026-01-0${day}T00:00:00Z`),
        position: index * 100,
      })),
    );
  });
  it('distinguishes local midnight ticks and UTC across DST in a timezone-controlled child', () => {
    const directory = mkdtempSync(join(tmpdir(), 'rsc-timezone-'));
    const outputPath = join(directory, 'ticks.json');
    const child = spawnSync(
      process.execPath,
      [
        fileURLToPath(new URL('./timezone-probe.mjs', import.meta.url)),
        outputPath,
      ],
      {
        env: { ...process.env, TZ: 'America/New_York' },
        encoding: 'utf8',
        timeout: 30_000,
      },
    );
    expect(child.status, child.stderr).toBe(0);
    let output;
    try {
      output = JSON.parse(readFileSync(outputPath, 'utf8'));
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
    expect(output.utc).toEqual([
      '2026-03-07T00:00:00.000Z',
      '2026-03-08T00:00:00.000Z',
      '2026-03-09T00:00:00.000Z',
      '2026-03-10T00:00:00.000Z',
    ]);
    expect(output.time).toEqual([
      '2026-03-07T05:00:00.000Z',
      '2026-03-08T05:00:00.000Z',
      '2026-03-09T04:00:00.000Z',
    ]);
    expect(output.intervals).toEqual([24, 23]);
    output.positions.forEach((position: number, index: number) =>
      expect(position).toBeCloseTo([500 / 72, 2900 / 72, 5200 / 72][index]!),
    );
  });
});
