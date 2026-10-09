import type {
  NormalizedCartesianData,
  NormalizedSegmentData,
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
          ? {
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              overflowWrap: 'anywhere',
            }
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
  const records: readonly object[] = Array.isArray(data) ? data : [];
  const fields = [
    ...new Set(
      records.flatMap((record) =>
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
      style={
        visible
          ? { width: '100%', textAlign: 'left', overflowWrap: 'anywhere' }
          : visuallyHidden
      }
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
        {Array.from(records, (record, index) => (
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

/** All normalized source rows, including unsupported negatives, remain available. */
export function SegmentDataTable<T>({
  model,
  label,
  visible,
  formatValue,
}: {
  model: NormalizedSegmentData<T>;
  label: string;
  visible: boolean;
  formatValue: ValueFormatter | undefined;
}) {
  return (
    <div style={visible ? undefined : visuallyHidden}>
      <table
        style={
          visible
            ? {
                width: '100%',
                tableLayout: 'fixed',
                textAlign: 'left',
                borderCollapse: 'collapse',
                overflowWrap: 'anywhere',
              }
            : visuallyHidden
        }
      >
        <caption style={{ textAlign: 'left', paddingBlock: 8 }}>
          {label} — data
        </caption>
        <colgroup>
          <col style={{ width: '65%' }} />
          <col style={{ width: '35%' }} />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">{readableKey(model.nameKey)}</th>
            <th scope="col">{readableKey(model.valueKey)}</th>
          </tr>
        </thead>
        <tbody>
          {model.segments.map((segment) => (
            <tr key={segment.segmentId}>
              <th scope="row">{display(segment.label)}</th>
              <td>
                {segment.value.status === 'unsupported'
                  ? display(
                      {
                        status: 'valid',
                        value: segment.value.raw,
                        raw: segment.value.raw,
                        present: true,
                      },
                      formatValue,
                    )
                  : display(segment.value, formatValue)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
