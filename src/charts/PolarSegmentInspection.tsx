import { useEffect, useMemo, useRef, useState } from 'react';
import type { PolarGeometryResult } from '../core/geometry/polar-types';
import type {
  PieChartProps,
  SegmentDatum,
  SegmentTooltipContext,
} from '../types/contracts';
import { display } from '../internal/svg/DataTable';
import { indexedColor } from '../internal/svg/presentation';
import {
  PolarMarks,
  segmentLabel,
  labelPosition,
} from '../internal/svg/PolarMarks';
type Ready<T> = Extract<PolarGeometryResult<T>, { status: 'ready' }>;
export function PolarSegmentInspection<T extends object>({
  props,
  geometry,
  id,
  label,
}: {
  props: PieChartProps<T>;
  geometry: Ready<T>;
  id: string;
  label: string;
}) {
  const observations = useMemo(
    () =>
      geometry.slices.map((point) => ({
        point,
        key: point.segmentId,
        datum: {
          record: point.record,
          index: point.index,
          segmentId: point.segmentId,
          label: point.label,
          value: point.value,
          percentage: point.percentage,
          color: indexedColor(point.index, props.colors),
        } satisfies SegmentDatum<T>,
      })),
    [geometry, props.colors],
  );
  const [selection, setSelection] = useState<{
    key: number;
    data: readonly T[];
    segmentId: number;
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
    candidate.datum.segmentId === selection?.segmentId &&
    candidate.datum.record === selection.record &&
    candidate.datum.value === selection.value
      ? candidate
      : undefined;
  const controls = useRef(new Map<number, SVGElement>());
  const marks = useRef<SVGGElement>(null);
  const focused = useRef(false);
  const [focusedKey, setFocusedKey] = useState<number | null>(null);
  // Hover inspection must not move the Tab entry away from the focused control.
  const roving =
    (focusedKey === null ? undefined : byKey.get(focusedKey)) ??
    active ??
    observations[0];
  const pointerFocus = useRef<number | null>(null);
  // The Cartesian gesture model is retained deliberately: source-scoped evidence
  // expires after its click task; native touch release additionally matches pointer
  // ID across tasks. Polar identity substitutes segmentId for seriesKey. Selection
  // and focus remain separate so hover never activates or hides the focus ring.
  // No Cartesian layout or point eligibility enters this component.
  // Evidence belongs to one source observation and expires after its click task.
  const clickSource = useRef<{
    key: number;
    data: readonly T[];
    record: T;
    segmentId: number;
    method: 'pointer' | 'keyboard' | 'touch';
    suppress: boolean;
  } | null>(null);
  // Native touch clicks can arrive in a later task. Match the released pointer,
  // rather than keeping a blanket suppression flag that could eat an AT click.
  const releasedTouch = useRef<number | null>(null);
  const clickExpiry = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const keyboardPress = useRef<{ key: number; button: string } | null>(null);
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
  const context: SegmentTooltipContext<T> | undefined = active
    ? { segment: active.datum }
    : undefined;
  const renderer =
    typeof props.tooltip === 'function' ? props.tooltip : tooltipConfig?.render;
  const visible = props.tooltip !== false && selection?.visible && context;
  const valueText = (value: number) =>
    display(
      { status: 'valid', value, raw: value, present: true },
      props.formatValue,
    );
  const text = (datum: SegmentDatum<T>) =>
    `${segmentLabel(datum.label)}: ${valueText(datum.value)} (${datum.percentage.toFixed(1)}%)`;
  const inspect = (key: number, keyboard: boolean) => {
    const item = byKey.get(key);
    if (item)
      setSelection({
        key,
        data: props.data,
        segmentId: item.datum.segmentId,
        record: item.datum.record,
        value: item.datum.value,
        keyboard,
        visible: true,
      });
  };
  const dismiss = () =>
    setSelection((s) => (s ? { ...s, visible: false } : null));
  return (
    <>
      <svg
        role="group"
        width={geometry.viewport.width}
        height={geometry.viewport.height}
        viewBox={`0 0 ${geometry.viewport.width} ${geometry.viewport.height}`}
        aria-labelledby={`${id}-title`}
        aria-describedby={
          props.accessibility?.description ? `${id}-description` : undefined
        }
        style={{
          display: 'block',
          maxWidth: '100%',
          outline:
            focusedKey !== null
              ? '3px solid var(--rsc-focus-color, #075985)'
              : undefined,
          outlineOffset: 3,
        }}
      >
        <title id={`${id}-title`}>{label}</title>
        {props.accessibility?.description && (
          <desc id={`${id}-description`}>
            {props.accessibility.description}
          </desc>
        )}
        <g
          ref={marks}
          aria-hidden="true"
          pointerEvents="none"
          data-layer="marks"
        >
          <PolarMarks
            slices={geometry.slices}
            colors={props.colors}
            showLabels={props.showLabels === true}
          />
        </g>
        <g data-layer="inspection">
          {observations.map(({ point, datum, key }, index) => (
            <path
              key={key}
              ref={(node) => {
                if (node) controls.current.set(key, node);
                else controls.current.delete(key);
              }}
              d={point.path}
              transform={`translate(${point.centerX} ${point.centerY})`}
              fill="transparent"
              pointerEvents="fill"
              stroke={
                focusedKey === key
                  ? 'var(--rsc-focus-color, #075985)'
                  : 'transparent'
              }
              strokeWidth={3}
              style={{ outline: 'none' }}
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
                  segmentId: datum.segmentId,
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
                  source.segmentId !== datum.segmentId
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
                  source.segmentId === datum.segmentId;
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
                    segmentId: datum.segmentId,
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
                    segmentId: datum.segmentId,
                    method: 'keyboard',
                    suppress: true,
                  };
                  expireClickSource();
                  if (!e.repeat)
                    props.onDataActivate?.({
                      ...datum,
                      inputMethod: 'keyboard',
                    });
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
        </g>
      </svg>
      {visible && active && (
        <div
          id={`${id}-tooltip`}
          role="tooltip"
          style={{
            position: 'absolute',
            // CSS bounds use the actual figure width even when a fixed SVG is scaled.
            left: `clamp(0px, ${active.point.centerX + labelPosition(active.point).x}px, max(0px, calc(100% - 220px)))`,
            top: Math.max(
              0,
              active.point.centerY + labelPosition(active.point).y - 80,
            ),
            width: 220,
            boxSizing: 'border-box',
            overflowWrap: 'anywhere',
            maxWidth: 'calc(100% - 20px)',
            padding: 10,
            background: 'var(--rsc-background, #fff)',
            color: 'var(--rsc-text-color, #182b38)',
            border: '1px solid #94a3b8',
            borderRadius: 6,
            pointerEvents: 'none',
          }}
        >
          {renderer ? (
            renderer(context)
          ) : (
            <>
              <strong>{segmentLabel(active.datum.label)}</strong>
              <div>
                <span
                  aria-hidden="true"
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    background: active.datum.color,
                    marginRight: 6,
                  }}
                />
                {valueText(active.datum.value)} (
                {active.datum.percentage.toFixed(1)}%)
              </div>
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
