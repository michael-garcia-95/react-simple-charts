// Compile-only assertions checked by the regular typecheck, never rendered.
import { LinePreview } from '../src/internal/LinePreview';
const data = [{ x: 'A', y: 1, date: new Date(), flag: true }];
export const valid = <LinePreview data={data} xKey="x" yKey="y" />;
// @ts-expect-error Tooltip behavior is not accepted by the internal preview.
export const tooltip = <LinePreview data={data} xKey="x" yKey="y" tooltip />;
// @ts-expect-error Animation is not implemented.
export const animate = <LinePreview data={data} xKey="x" yKey="y" animate />;
export const activation = (
  // @ts-expect-error Activation is not implemented.
  <LinePreview data={data} xKey="x" yKey="y" onDataActivate={() => {}} />
);
export const exclusive = (
  // @ts-expect-error Value mappings are exclusive.
  <LinePreview data={data} xKey="x" yKey="y" series={[{ key: 'y' }]} />
);
export const linear = (
  // @ts-expect-error Linear X requires a numerical field.
  <LinePreview data={data} xScale="linear" xKey="x" yKey="y" />
);
// @ts-expect-error Dates are required for time X.
export const time = <LinePreview data={data} xScale="time" xKey="y" yKey="y" />;
// @ts-expect-error Boolean fields cannot map values.
export const boolean = <LinePreview data={data} xKey="x" yKey="flag" />;
