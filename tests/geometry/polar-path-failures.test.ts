// @vitest-environment node
import { expect, it, vi } from 'vitest';
import { normalizeSegments } from '../../src/core/data/segments';
import { buildPolarGeometry } from '../../src/core/geometry/polar';
const control = vi.hoisted(() => ({
  output: null as string | null,
  throws: false,
  calls: 0,
}));
vi.mock('d3-shape', async (importOriginal) => {
  const original = await importOriginal<typeof import('d3-shape')>();
  const factory = () =>
    Object.assign(
      () => {
        control.calls++;
        if (control.calls === 1) return 'M0,-50A50,50,0,0,1,50,0L0,0Z';
        if (control.throws) throw new Error('Arc failed');
        return control.output;
      },
      { digits: () => factory() },
    );
  return { ...original, arc: factory };
});
it.each([null, 'MNaN,0A50,50,0,0,1,1,1Z', 'M0,0A-1,1,0,0,1,1,1Z', 'throws'])(
  'rejects a failed later arc without exposing partial paths: %j',
  (output) => {
    control.calls = 0;
    control.throws = output === 'throws';
    control.output = output;
    const normalized = normalizeSegments({
      data: [
        { name: 'A', value: 1 },
        { name: 'B', value: 1 },
      ],
      nameKey: 'name',
      valueKey: 'value',
    });
    const result = buildPolarGeometry({
      normalized,
      family: 'pie',
      width: 116,
      height: 116,
    });
    expect(result).toMatchObject({
      status: 'unusable',
      diagnostics: [{ code: 'path-failed', rowIndex: 1, segmentId: 1 }],
    });
    expect(result).not.toHaveProperty('slices');
    expect(result).not.toHaveProperty('viewport');
    expect(result.normalized).toBe(normalized);
  },
);
