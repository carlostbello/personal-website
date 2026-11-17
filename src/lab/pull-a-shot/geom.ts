// Shared geometry for the big chart and the Gaggiuino screen's mini graph,
// used by the server-rendered static frame and by the live script so both
// draw the same thing.
import { P_MAX, S_MAX } from './profile';

type Pts = ReadonlyArray<readonly [number, number]>;

export const CHART = { w: 600, h: 340, x0: 58, x1: 584, y0: 18, y1: 296 };
export const cx = (s: number) => CHART.x0 + (s / S_MAX) * (CHART.x1 - CHART.x0);
export const cy = (p: number) => CHART.y1 - (Math.min(p, P_MAX + 0.6) / P_MAX) * (CHART.y1 - CHART.y0);

export function linePath(pts: Pts) {
  let d = '';
  for (let i = 0; i < pts.length; i++) d += `${i ? 'L' : 'M'}${cx(pts[i][0]).toFixed(1)} ${cy(pts[i][1]).toFixed(1)}`;
  return d;
}

export function areaPath(pts: Pts) {
  if (pts.length < 2) return '';
  const last = pts[pts.length - 1];
  return `${linePath(pts)}L${cx(last[0]).toFixed(1)} ${CHART.y1}L${cx(pts[0][0]).toFixed(1)} ${CHART.y1}Z`;
}

/** The tiny live graph on the Gaggiuino screen (machine viewBox units). */
export const MINI = { x0: 137, x1: 263, y0: 108, y1: 130 };
export const mx = (s: number) => MINI.x0 + (s / S_MAX) * (MINI.x1 - MINI.x0);
export const my = (p: number) => MINI.y1 - (Math.min(p, P_MAX + 0.6) / P_MAX) * (MINI.y1 - MINI.y0);

/** Mini graph path, thinned to every few points: the screen is ~130 units wide. */
export function miniPath(pts: Pts) {
  let d = '';
  const stride = Math.max(1, Math.floor(pts.length / 90));
  for (let i = 0; i < pts.length; i += stride) d += `${d ? 'L' : 'M'}${mx(pts[i][0]).toFixed(1)} ${my(pts[i][1]).toFixed(1)}`;
  const last = pts[pts.length - 1];
  if (last && (pts.length - 1) % stride) d += `L${mx(last[0]).toFixed(1)} ${my(last[1]).toFixed(1)}`;
  return d;
}

/** Machine viewBox (the Gaggia drawing). */
export const MACHINE = { x: 36, y: 0, w: 352, h: 476 };
/** Where the cup's floor sits, and where the two spouts end. */
export const CUP_BOTTOM = 418;
export const SPOUTS = [
  [190, 279, 192],
  [210, 279, 208],
] as const; // [x at spout, y at spout, x where it lands]
export const streamPath = (i: number, top: number) => {
  const [x, y, x2] = SPOUTS[i];
  return `M${x} ${y}L${x2} ${top.toFixed(1)}`;
};
