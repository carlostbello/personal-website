// Shared geometry for the chart and gauge, used by the server-rendered
// static frame and by the live script so both draw the same thing.
import { P_MAX, S_MAX } from './profile';

export const CHART = { w: 600, h: 340, x0: 58, x1: 584, y0: 18, y1: 296 };
export const cx = (s: number) => CHART.x0 + (s / S_MAX) * (CHART.x1 - CHART.x0);
export const cy = (p: number) => CHART.y1 - (Math.min(p, P_MAX + 0.6) / P_MAX) * (CHART.y1 - CHART.y0);

export function linePath(pts: ReadonlyArray<readonly [number, number]>) {
  let d = '';
  for (let i = 0; i < pts.length; i++) d += `${i ? 'L' : 'M'}${cx(pts[i][0]).toFixed(1)} ${cy(pts[i][1]).toFixed(1)}`;
  return d;
}

export function areaPath(pts: ReadonlyArray<readonly [number, number]>) {
  if (pts.length < 2) return '';
  const last = pts[pts.length - 1];
  return `${linePath(pts)}L${cx(last[0]).toFixed(1)} ${CHART.y1}L${cx(pts[0][0]).toFixed(1)} ${CHART.y1}Z`;
}

/** Gauge: 0 bar sits at -120deg, 12 bar at +120deg (0deg = straight up). */
export const GAUGE = { x: 200, y: 128, r: 58 };
export const gaugeAngle = (bar: number) => -120 + (bar * 240) / P_MAX;
export function polar(deg: number, r: number) {
  const a = (deg * Math.PI) / 180;
  return [GAUGE.x + r * Math.sin(a), GAUGE.y - r * Math.cos(a)] as const;
}
