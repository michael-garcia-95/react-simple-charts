import type { Interval, UnusableScale } from './types';
import { unusable } from './types';

/** D3 counts are hints; bound the request, not the exact resulting tick length. */
export function tickCount(
  requested: number | undefined,
): { status: 'ready'; count: number } | UnusableScale {
  if (requested === undefined) return { status: 'ready', count: 10 };
  if (!Number.isInteger(requested) || requested < 1 || requested > 100)
    return unusable(
      'invalid-tick-count',
      'tickCount must be an integer from 1 through 100.',
    );
  return { status: 'ready', count: requested };
}

export function validateRange(range: Interval<number>): UnusableScale | null {
  if (
    !Number.isFinite(range[0]) ||
    !Number.isFinite(range[1]) ||
    range[0] === range[1] ||
    !Number.isFinite(range[1] - range[0])
  )
    return unusable(
      'invalid-range',
      'Output range requires distinct finite endpoints and a finite span.',
    );
  return null;
}

/** D3 may have no finite ticks at floating-point or Date boundaries. */
export function numericTicks(
  generate: () => readonly number[],
  domain: Interval<number>,
): readonly number[] {
  let generated: readonly number[];
  try {
    generated = generate();
  } catch (error) {
    // D3's reciprocal tick step overflows for subnormal spans (Array(NaN)).
    if (!(error instanceof RangeError)) throw error;
    return [...domain];
  }
  const finite = generated.filter(
    (value) =>
      Number.isFinite(value) && value >= domain[0] && value <= domain[1],
  );
  return finite.length ? finite : [...domain];
}
