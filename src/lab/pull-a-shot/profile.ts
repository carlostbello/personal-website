// SYNTHETIC DEMO PROFILE. Nothing here comes from the Gaggiuino's logs:
// it is a hand-tuned model of a Gaggiuino-style profile (pre-infusion at
// ~3 bar, a ~9 bar plateau, then a decline as the puck erodes) so the
// section has something to draw. Swap in logged shots once they exist.

/** Shot seconds per real second. A full shot takes ~9s of holding. */
export const SPEED = 3.2;
/** Chart x range, in shot seconds. */
export const S_MAX = 42;
/** Chart y range, in bar. */
export const P_MAX = 12;
/** Let go inside this window (shot seconds) for a good shot. */
export const WINDOW = [24, 34] as const;
/** The pump gives up here no matter what. */
export const AUTO_STOP = 40;

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Where the pump is pushing at shot time s (bar). */
export function target(s: number, peak = 9) {
  const pre = 3 * smooth(0, 1.6, s); // fill the headspace, soak the puck
  const ramp = (peak - 3) * smooth(7, 11, s); // then up to the plateau
  const erode = s > 11 ? 0.09 * (s - 11) + 0.006 * Math.max(0, s - 24) ** 2 : 0;
  return pre + ramp - erode;
}

/** How easily water gets through the puck: dry until saturated, then slowly eroding. */
export function conductance(s: number) {
  return smooth(5, 9, s) * (1 + 0.025 * Math.max(0, s - 9));
}

export interface Machine {
  p: number; // pressure, bar
  v: number; // dp/ds
}

/**
 * One integration step of the pressure, a slightly underdamped spring
 * toward the target so the ramp overshoots a touch like a real pump.
 * ds is in shot seconds. Released machines dump pressure through the
 * three-way valve, which is fast and critically damped.
 */
export function step(m: Machine, goal: number, ds: number, released: boolean) {
  const w = released ? 5.5 : 2.6;
  const z = released ? 1 : 0.55;
  const n = Math.max(1, Math.ceil(ds / 0.02));
  const h = ds / n;
  for (let i = 0; i < n; i++) {
    const a = w * w * (goal - m.p) - 2 * z * w * m.v;
    m.v += a * h;
    m.p = Math.max(0, m.p + m.v * h);
  }
}

/** The reference shot, released at 29s. Used for the static frame and cup scale. */
export function idealShot() {
  const m: Machine = { p: 0, v: 0 };
  const pts: Array<[number, number]> = [[0, 0]];
  let yieldSum = 0;
  const ds = 0.1;
  for (let s = ds; s <= 29 + 1e-9; s += ds) {
    step(m, target(s), ds, false);
    yieldSum += m.p * conductance(s) * ds;
    pts.push([s, m.p]);
  }
  return { pts, yieldSum };
}

/** Phase spans on the chart (shot seconds), matching target() above. */
export const PHASES = [
  { label: 'pre-infusion', from: 0, to: 7.5 },
  { label: '9 bar', from: 9.5, to: 17 },
  { label: 'decline', from: 17.5, to: 23.5 },
] as const;
