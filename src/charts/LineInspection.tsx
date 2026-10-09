import { useEffect, useMemo, useRef, useState } from 'react';
import type { CartesianGeometryResult } from '../core/geometry/types';
import type {
  CartesianDatum,
  CartesianTooltipContext,
  LineChartProps,
  NumericFieldKey,
} from '../types/contracts';
import { LineMarks } from '../internal/svg/LineMarks';
import { SvgFrame } from '../internal/svg/SvgFrame';
import { CartesianAxes, Gridlines } from '../internal/svg/CartesianAxes';
import { display } from '../internal/svg/DataTable';
import { seriesColor, seriesLabel } from '../internal/svg/presentation';

type Ready<T> = Extract<CartesianGeometryResult<T>, { status: 'ready' }> & {
  family: 'line' | 'area';
};
export function LineInspection<T extends object>({
  props,
  geometry,
  id,
  label,
}: {
  props: LineChartProps<T>;
  geometry: Ready<T>;
  id: string;
  label: string;
}) {
  const observations = useMemo(
    () =>
      geometry.series
        .flatMap(({ points }) =>
          points
            .filter((p) => !p.outOfPlot)
            .map((point) => ({
              point,
              key: `${point.index}:${point.seriesIndex}`,
              datum: {
                record: point.record,
                index: point.index,
                value: point.value,
                category: point.category,
                seriesKey: point.seriesKey as NumericFieldKey<T>,
                seriesLabel: seriesLabel(point.series),
                color: seriesColor(point.series, props.colors),
              } satisfies CartesianDatum<T>,
            })),
        )
        .sort(
          (a, b) =>
            a.point.index - b.point.index ||
            a.point.seriesIndex - b.point.seriesIndex,
        ),
    [geometry, props.colors],
  );
  const byRow = useMemo(() => {
    const rows = new Map<number, CartesianDatum<T>[]>();
    // Include valid row values even when a configured bound clips another series.
    for (const { series, points } of geometry.series)
      for (const p of points) {
        const datum: CartesianDatum<T> = {
          record: p.record,
          index: p.index,
          value: p.value,
          category: p.category,
          seriesKey: p.seriesKey as NumericFieldKey<T>,
          seriesLabel: seriesLabel(series),
          color: seriesColor(series, props.colors),
        };
        const row = rows.get(p.index) ?? [];
        row.push(datum);
        rows.set(p.index, row);
      }
    return rows;
  }, [geometry, props.colors]);
  const [selection, setSelection] = useState<{
    key: string;
    data: readonly T[];
    seriesKey: string;
    record: T;
    value: number;
    keyboard: boolean;
    visible: boolean;
  } | null>(null);
  const byKey = useMemo(
    () => new Map(observations.map((o) => [o.key, o])),
    [observations],
  );
  const candidate =
    selection?.data === props.data ? byKey.get(selection.key) : undefined;
  const active =
    candidate &&
    candidate.datum.seriesKey === selection?.seriesKey &&
    candidate.datum.record === selection.record &&
    candidate.datum.value === selection.value
      ? candidate
      : undefined;
  const roving = active ?? observations[0];
  const controls = useRef(new Map<string, SVGCircleElement>());
  const marks = useRef<SVGGElement>(null);
  const focused = useRef(false);
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  const pointerFocus = useRef<string | null>(null);
  // Evidence belongs to one source observation and expires after its click task.
  const clickSource = useRef<{
    key: string;
    data: readonly T[];
    record: T;
    seriesKey: string;
    method: 'pointer' | 'keyboard' | 'touch';
    suppress: boolean;
  } | null>(null);
  // Native touch clicks can arrive in a later task. Match the released pointer,
  // rather than keeping a blanket suppression flag that could eat an AT click.
  const releasedTouch = useRef<number | null>(null);
  const clickExpiry = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const keyboardPress = useRef<{ key: string; button: string } | null>(null);
  const clearClickSource = () => {
    clearTimeout(clickExpiry.current);
    clickSource.current = null;
  };
  const expireClickSource = () => {
    clearTimeout(clickExpiry.current);
    clickExpiry.current = setTimeout(() => {
      clickSource.current = null;
    }, 0);
  };
  useEffect(() => () => clearTimeout(clickExpiry.current), []);
  useEffect(() => {
    if (focused.current && !active) {
      if (roving) controls.current.get(roving.key)?.focus();
    }
  }, [active, roving]);
  useEffect(() => {
    const node = marks.current;
    if (
      !props.animate ||
      !node?.animate ||
      typeof window.matchMedia !== 'function'
    )
      return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (query.matches) return;
    const animation = node.animate([{ opacity: 0.65 }, { opacity: 1 }], {
      duration: 180,
      easing: 'ease-out',
    });
    const stop = () => {
      if (query.matches) animation.cancel();
    };
    query.addEventListener?.('change', stop);
    return () => {
      animation.cancel();
      query.removeEventListener?.('change', stop);
    };
  }, [props.animate, geometry]);
  const tooltipConfig =
    typeof props.tooltip === 'object' ? props.tooltip : undefined;
  const context: CartesianTooltipContext<T> | undefined =
    active &&
    (tooltipConfig?.mode === 'item'
      ? { mode: 'item', item: active.datum }
      : {
          mode: 'shared',
          category: active.datum.category,
          items: byRow.get(active.datum.index) ?? [],
        });
  const renderer =
    typeof props.tooltip === 'function' ? props.tooltip : tooltipConfig?.render;
  const visible = props.tooltip !== false && selection?.visible && context;
  const text = (datum: CartesianDatum<T>) =>
    `${display({ status: 'valid', value: datum.category, raw: datum.category, present: true }, props.formatCategory)}, ${datum.seriesLabel}: ${display({ status: 'valid', value: datum.value, raw: datum.value, present: true }, props.formatValue)}`;
  const inspect = (key: string, keyboard: boolean) => {
    const item = byKey.get(key);
    if (item)
      setSelection({
        key,
        data: props.data,
        seriesKey: item.datum.seriesKey,
        record: item.datum.record,
        value: item.datum.value,
        keyboard,
        visible: true,
      });
  };
  const dismiss = () =>
    setSelection((s) => (s ? { ...s, visible: false } : null));
  const items =
    context?.mode === 'item' ? [context.item] : (context?.items ?? []);
  return (
    <>
      <SvgFrame
        id={id}
        width={geometry.layout.width}
        height={geometry.layout.height}
        plot={geometry.plot}
        label={label}
        description={props.accessibility?.description}
        interactive
        inspection={observations.map(({ point, datum, key }, index) => (
          <circle
            key={key}
            ref={(node) => {
              if (node) controls.current.set(key, node);
              else controls.current.delete(key);
            }}
            cx={point.x}
            cy={point.y}
            r={10}
            fill="transparent"
            stroke={
              focusedKey === key && selection?.keyboard
                ? 'var(--rsc-focus-color, #075985)'
                : 'transparent'
            }
            strokeWidth={2}
            role="button"
            tabIndex={roving?.key === key ? 0 : -1}
            aria-label={text(datum)}
            aria-describedby={
              visible && active?.key === key ? `${id}-tooltip` : undefined
            }
            onFocus={() => {
              focused.current = true;
              setFocusedKey(key);
              inspect(key, pointerFocus.current !== key);
              pointerFocus.current = null;
            }}
            onBlur={() => {
              focused.current = false;
              setFocusedKey(null);
              if (pointerFocus.current === key) pointerFocus.current = null;
              if (clickSource.current?.key === key) clearClickSource();
              if (keyboardPress.current?.key === key)
                keyboardPress.current = null;
              dismiss();
            }}
            onPointerEnter={(e) => {
              if (e.pointerType !== 'touch') inspect(key, false);
            }}
            onPointerMove={(e) => {
              if (e.pointerType !== 'touch' && active?.key !== key)
                inspect(key, false);
            }}
            onPointerLeave={(e) => {
              if (
                clickSource.current?.key === key &&
                !clickSource.current.suppress
              )
                clearClickSource();
              if (e.pointerType !== 'touch' && !focused.current) dismiss();
            }}
            onPointerDown={(e) => {
              clearClickSource();
              keyboardPress.current = null;
              releasedTouch.current = null;
              clickSource.current = {
                key,
                data: props.data,
                record: datum.record,
                seriesKey: datum.seriesKey,
                method: e.pointerType === 'touch' ? 'touch' : 'pointer',
                suppress: false,
              };
              pointerFocus.current = key;
            }}
            onPointerCancel={() => {
              clearClickSource();
              pointerFocus.current = null;
            }}
            onPointerUp={(e) => {
              const source = clickSource.current;
              if (
                source?.key !== key ||
                source.data !== props.data ||
                source.record !== datum.record ||
                source.seriesKey !== datum.seriesKey
              )
                return;
              if (e.pointerType === 'touch' && source.method === 'touch') {
                e.preventDefault();
                source.suppress = true;
                if (typeof e.pointerId === 'number')
                  releasedTouch.current = e.pointerId;
                inspect(key, false);
                props.onDataActivate?.({ ...datum, inputMethod: 'touch' });
              }
              expireClickSource();
            }}
            onClick={(e) => {
              const source = clickSource.current;
              const matches =
                source?.key === key &&
                source.data === props.data &&
                source.record === datum.record &&
                source.seriesKey === datum.seriesKey;
              const nativeType = (
                e.nativeEvent as MouseEvent & {
                  pointerType?: string;
                  pointerId?: number;
                }
              ).pointerType;
              if (
                nativeType === 'touch' &&
                releasedTouch.current !== null &&
                releasedTouch.current ===
                  (e.nativeEvent as PointerEvent).pointerId
              ) {
                releasedTouch.current = null;
                if (source?.method === 'touch') clearClickSource();
                return;
              }
              const duplicate =
                source?.key === key &&
                source.suppress &&
                (source.method === 'keyboard'
                  ? e.detail === 0
                  : nativeType === 'touch' || e.detail > 0);
              clearClickSource();
              if (duplicate) return;
              const method =
                (matches && source.method === 'pointer') ||
                nativeType === 'mouse' ||
                nativeType === 'pen'
                  ? 'pointer'
                  : nativeType === 'touch'
                    ? 'touch'
                    : 'keyboard';
              inspect(key, method === 'keyboard');
              props.onDataActivate?.({ ...datum, inputMethod: method });
            }}
            onKeyUp={(e) => {
              if (
                keyboardPress.current?.key === key &&
                keyboardPress.current.button === e.key
              ) {
                keyboardPress.current = null;
                clickSource.current = {
                  key,
                  data: props.data,
                  record: datum.record,
                  seriesKey: datum.seriesKey,
                  method: 'keyboard',
                  suppress: true,
                };
                expireClickSource();
              }
            }}
            onKeyDown={(e) => {
              pointerFocus.current = null;
              if (e.key === 'Escape') {
                clearClickSource();
                keyboardPress.current = null;
                e.preventDefault();
                dismiss();
                return;
              }
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                clearClickSource();
                keyboardPress.current = { key, button: e.key };
                clickSource.current = {
                  key,
                  data: props.data,
                  record: datum.record,
                  seriesKey: datum.seriesKey,
                  method: 'keyboard',
                  suppress: true,
                };
                expireClickSource();
                if (!e.repeat)
                  props.onDataActivate?.({ ...datum, inputMethod: 'keyboard' });
                return;
              }
              const target =
                e.key === 'Home'
                  ? 0
                  : e.key === 'End'
                    ? observations.length - 1
                    : e.key === 'ArrowRight' || e.key === 'ArrowDown'
                      ? Math.min(index + 1, observations.length - 1)
                      : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
                        ? Math.max(index - 1, 0)
                        : null;
              if (target !== null) {
                e.preventDefault();
                const next = observations[target]!;
                inspect(next.key, true);
                controls.current.get(next.key)?.focus();
              }
            }}
          />
        ))}
        grid={<Gridlines lines={geometry.layout.gridlines} />}
        axes={<CartesianAxes layout={geometry.layout} />}
      >
        <g ref={marks} aria-hidden="true" pointerEvents="none">
          <LineMarks series={geometry.series} colors={props.colors} />
        </g>
      </SvgFrame>
      {visible && active && (
        <div
          id={`${id}-tooltip`}
          role="tooltip"
          style={{
            position: 'absolute',
            left: Math.max(
              0,
              Math.min(active.point.x, geometry.layout.width - 220),
            ),
            top: Math.max(0, active.point.y - 80),
            width: 200,
            maxWidth: 'calc(100% - 20px)',
            padding: 10,
            background: 'var(--rsc-background, #fff)',
            color: 'var(--rsc-text-color, #182b38)',
            border: '1px solid #94a3b8',
            borderRadius: 6,
            boxShadow: '0 2px 8px #0002',
            pointerEvents: 'none',
          }}
        >
          {renderer ? (
            renderer(context)
          ) : (
            <>
              <strong>
                {display(
                  {
                    status: 'valid',
                    value: active.datum.category,
                    raw: active.datum.category,
                    present: true,
                  },
                  props.formatCategory,
                )}
              </strong>
              {items.map((item) => (
                <div key={item.seriesKey}>
                  <span
                    aria-hidden="true"
                    style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      background: item.color,
                      marginRight: 6,
                    }}
                  />
                  {item.seriesLabel}:{' '}
                  {display(
                    {
                      status: 'valid',
                      value: item.value,
                      raw: item.value,
                      present: true,
                    },
                    props.formatValue,
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}
      {visible && !selection?.keyboard && (
        <button
          type="button"
          onClick={dismiss}
          style={{ position: 'absolute', right: 4, top: 4 }}
        >
          Dismiss inspection
        </button>
      )}
    </>
  );
}
