// @vitest-environment node
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { layoutCartesian } from '../../src/core/layout/cartesian';
import { input, ready, snapshot, usable } from './helpers';

describe('temporal labels, positions, and timezone context', () => {
  it('generates deterministic full ISO UTC labels and exact tick mappings', () => {
    const dates = [
      new Date('2026-01-01T00:00:00Z'),
      new Date('2026-01-03T00:00:00Z'),
    ];
    const setup = {
      ...input(
        dates.map((x, index) => ({ x, y: index })),
        'utc',
      ),
      width: 1200,
      xAxis: { tickCount: 2 },
      spacing: { maxEndpointPadding: 160 },
    };
    const result = ready(layoutCartesian(setup));
    const axis = result.axes.x;
    if (axis?.kind !== 'utc') throw new Error('Expected UTC');
    expect(axis.candidates.map((tick) => tick.label)).toEqual([
      '2026-01-01T00:00:00.000Z',
      '2026-01-02T00:00:00.000Z',
      '2026-01-03T00:00:00.000Z',
    ]);
    expect(axis.visibleTicks).toHaveLength(3);
    expect(axis.candidates[0]?.position).toBe(result.plot.left);
    expect(axis.candidates[1]?.position).toBeCloseTo(
      result.plot.left + result.plot.width / 2,
    );
    expect(axis.candidates[2]?.position).toBe(result.plot.right);
    const x = result.scales.semanticX;
    if (x.kind !== 'utc') throw new Error('Expected UTC scale');
    for (const tick of axis.candidates)
      expect(x.map(tick.value)).toEqual({
        status: 'mapped',
        position: tick.position,
      });
    expect(snapshot(layoutCartesian(setup))).toEqual(snapshot(result));
    expect(dates.map((date) => date.toISOString())).toEqual([
      '2026-01-01T00:00:00.000Z',
      '2026-01-03T00:00:00.000Z',
    ]);
  });
  it.each(['utc', 'time'])(
    '%s passes Date copies to callbacks without mutating raw ticks or Dates',
    (mode) => {
      const date = new Date('2026-01-01T00:00:00Z');
      const formatTick = vi.fn((tick: Date) => {
        const label = tick.toISOString();
        tick.setTime(0);
        return label;
      });
      const result = ready(
        layoutCartesian({
          ...input([{ x: date, y: 10 }], mode),
          xAxis: { formatTick, tickCount: 2 },
        }),
      );
      expect(formatTick.mock.calls.length).toBe(
        result.axes.x?.candidates.length,
      );
      for (const tick of result.axes.x!.candidates) {
        expect(tick.value).toBeInstanceOf(Date);
        expect(tick.label).toBe((tick.value as Date).toISOString());
      }
      expect(date.toISOString()).toBe('2026-01-01T00:00:00.000Z');
    },
  );
  it.each(['utc', 'time'])(
    '%s preserves empty scale metadata without Date ticks or mappings',
    (mode) => {
      const result = usable(
        layoutCartesian(input([{ x: new Date(NaN), y: 10 }], mode)),
      );
      expect(result.status).toBe('empty');
      expect(result.scales.semanticX).toMatchObject({
        status: 'empty',
        kind: mode,
        domain: { observed: null, origin: 'fallback' },
      });
      expect(result.scales.semanticX).not.toHaveProperty('map');
      expect(result.axes.x?.candidates).toEqual([]);
    },
  );
  it('keeps UTC layouts equal across hosts but exposes local DST tick differences', () => {
    const directory = mkdtempSync(join(tmpdir(), 'rsc-layout-timezone-'));
    const run = (timezone: string) => {
      const outputPath = join(directory, `${timezone.replace('/', '-')}.json`);
      const child = spawnSync(
        process.execPath,
        [
          fileURLToPath(new URL('./timezone-probe.mjs', import.meta.url)),
          outputPath,
        ],
        {
          env: { ...process.env, TZ: timezone },
          encoding: 'utf8',
          timeout: 30000,
        },
      );
      expect(child.status, child.stderr).toBe(0);
      return JSON.parse(readFileSync(outputPath, 'utf8'));
    };
    try {
      const ny = run('America/New_York');
      const utc = run('UTC');
      expect(ny.utc).toEqual(utc.utc);
      expect(ny.utc.labels).toEqual([
        '2026-03-07T00:00:00.000Z',
        '2026-03-08T00:00:00.000Z',
        '2026-03-09T00:00:00.000Z',
        '2026-03-10T00:00:00.000Z',
      ]);
      expect(ny.time.labels).toEqual([
        '2026-03-07T05:00:00.000Z',
        '2026-03-08T05:00:00.000Z',
        '2026-03-09T04:00:00.000Z',
      ]);
      expect(ny.time.intervals).toEqual([24, 23]);
      expect(ny.time).not.toEqual(utc.time);
      expect(utc.time.labels).toEqual(utc.utc.labels);
      const { left, width } = ny.time.plot;
      ny.time.positions.forEach((position: number, index: number) =>
        expect(position).toBeCloseTo(
          left + width * [5 / 72, 29 / 72, 52 / 72][index]!,
        ),
      );
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
