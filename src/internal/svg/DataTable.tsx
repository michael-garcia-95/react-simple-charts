import type {
  NormalizedCartesianData,
  ValueState,
} from '../../core/data/types';
import type {
  CategoryFormatter,
  CategoryValue,
  ValueFormatter,
} from '../../types/contracts';
import { dateTimestamp } from './date-value';
import { readableKey, seriesLabel, visuallyHidden } from './presentation';

export function display<V extends CategoryValue>(
  state: ValueState<V>,
  formatter?: (value: V) => string,
) {
  if (state.status !== 'valid')
    return state.status === 'missing' ? 'Missing' : 'Invalid';
  const value = state.value;
  const timestamp = dateTimestamp(value);
  if (timestamp !== null && !Number.isFinite(timestamp)) return 'Invalid';
  try {
    const text = formatter?.(
      timestamp !== null ? (new Date(timestamp) as V) : value,
    );
    if (typeof text === 'string') return text;
  } catch {
    /* Keep the source data alternative available after formatter failures. */
  }
  return timestamp !== null ? new Date(timestamp).toISOString() : String(value);
}
export function DataTable<T>({
  model,
  label,
  visible,
  formatCategory,
  formatValue,
}: {
  model: NormalizedCartesianData<T>;
  label: string;
  visible: boolean;
  formatCategory: CategoryFormatter | undefined;
  formatValue: ValueFormatter | undefined;
}) {
  return (
    <table
      style={
        visible
          ? { width: '100%', borderCollapse: 'collapse', textAlign: 'left' }
          : visuallyHidden
      }
    >
      <caption style={{ textAlign: 'left', paddingBlock: 8 }}>
        {label} — data
      </caption>
      <thead>
        <tr>
          <th scope="col">{readableKey(model.xKey)}</th>
          {model.series.map((series) => (
            <th scope="col" key={series.key}>
              {seriesLabel(series)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {model.rows.map((row) => (
          <tr key={row.index}>
            <th scope="row">{display(row.x, formatCategory)}</th>
            {row.values.map((value, index) => (
              <td key={model.series[index]!.key}>
                {display(value, formatValue)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Configuration failures cannot identify trustworthy mapped series. Preserve raw fields. */
export function SourceDataTable({
  data,
  label,
  visible,
}: {
  data: readonly object[];
  label: string;
  visible: boolean;
}) {
  if (!Array.isArray(data)) return null;
  const fields = [
    ...new Set(
      data.flatMap((record) =>
        record && typeof record === 'object' ? Object.keys(record) : [],
      ),
    ),
  ];
  const rawText = (value: unknown): string => {
    if (value === null || value === undefined) return 'Missing';
    const timestamp = dateTimestamp(value);
    if (timestamp !== null)
      return Number.isFinite(timestamp)
        ? new Date(timestamp).toISOString()
        : 'Invalid';
    if (typeof value === 'number')
      return Number.isFinite(value) ? String(value) : 'Invalid';
    if (typeof value === 'string' || typeof value === 'boolean')
      return String(value);
    return 'Unsupported';
  };
  return (
    <table
      style={visible ? { width: '100%', textAlign: 'left' } : visuallyHidden}
    >
      <caption>{label} — source data (chart mapping unavailable)</caption>
      <thead>
        <tr>
          <th scope="col">Source row</th>
          {fields.map((field) => (
            <th key={field} scope="col">
              {readableKey(field)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from(data, (record, index) => (
          <tr key={index}>
            <th scope="row">{index + 1}</th>
            {fields.map((field) => (
              <td key={field}>
                {record &&
                typeof record === 'object' &&
                Object.hasOwn(record, field)
                  ? rawText((record as Record<string, unknown>)[field])
                  : 'Missing'}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
