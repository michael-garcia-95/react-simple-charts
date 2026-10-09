import type { CategoryValue } from '../../types/contracts';
import type {
  NumericalValueState,
  ValueState,
  XScaleMode,
  XValueState,
} from './types';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Mappings read own properties; inherited members are not source fields. */
export function readField(
  record: unknown,
  key: string,
): { raw: unknown; present: boolean } {
  const present =
    isRecord(record) && Object.prototype.hasOwnProperty.call(record, key);
  return { raw: present ? record[key] : undefined, present };
}
function classify<V>(
  raw: unknown,
  present: boolean,
  accepts: (value: unknown) => value is V,
): ValueState<V> {
  if (raw === null || raw === undefined)
    return { status: 'missing', raw, present };
  if (accepts(raw)) return { status: 'valid', value: raw, raw, present: true };
  return { status: 'invalid', raw, present };
}
function finiteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
function validDate(value: unknown): value is Date {
  // Native getTime also recognizes cross-realm Dates without consulting browser globals.
  if (typeof value !== 'object' || value === null) return false;
  try {
    return Number.isFinite(Date.prototype.getTime.call(value));
  } catch {
    return false;
  }
}
function category(value: unknown): value is CategoryValue {
  return typeof value === 'string' || finiteNumber(value) || validDate(value);
}
export function classifyNumber(
  raw: unknown,
  present = true,
): NumericalValueState {
  return classify(raw, present, finiteNumber);
}
export function classifyX(
  raw: unknown,
  present: boolean,
  scale: XScaleMode,
): XValueState {
  return classify(
    raw,
    present,
    scale === 'category'
      ? category
      : scale === 'linear'
        ? finiteNumber
        : validDate,
  );
}
