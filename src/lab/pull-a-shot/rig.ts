// Drives the "pull a shot" panel. The pressure model lives in profile.ts
// (a synthetic demo profile, not logged data); this file is input, the
// gauge and lever physics, the live chart and the comic reactions.
import { AUTO_STOP, P_MAX, SPEED, WINDOW, conductance, idealShot, step, target, type Machine } from './profile';
import { GAUGE, areaPath, cx, cy, gaugeAngle, linePath } from './geom';
import { createAudio } from './audio';

type Phase = 'idle' | 'pull' | 'dump' | 'done';
type Outcome = 'rinse' | 'sour' | 'good' | 'bitter';

const RESULTS: Record<Outcome, { stamp: string; say: string; bad: boolean }> = {
  rinse: { stamp: 'PFFT', say: 'That was a rinse, not a shot.', bad: true },
  sour: { stamp: 'SOUR!', say: 'Too early. That one is sour.', bad: true },
  good: { stamp: 'GOD SHOT', say: "That's the one. Nice pull.", bad: false },
  bitter: { stamp: 'BITTER!', say: 'You held on too long. Bitter.', bad: true },
};

const LEVER_REST = 28;
const LEVER_BREW = -55;
const CUP_BOTTOM = 426;
const CUP_SCALE = 52; // px of coffee for a full shot
const STORE = 'pull-a-shot:muted';

const store = {
  get(): boolean {
    try {
      return localStorage.getItem(STORE) === '1';
    } catch {
      return false;
    }
  },
  set(v: boolean) {
    try {
      localStorage.setItem(STORE, v ? '1' : '0');
    } catch {
      /* private mode */
    }
  },
};

export function mountRig(root: HTMLElement): () => void {
  const $ = <T extends Element>(sel: string) => root.querySelector<T>(sel)!;
  const pull = $<HTMLButtonElement>('[data-pull]');
  const soundBtn = $<HTMLButtonElement>('[data-sound]');
  const machine = $<HTMLElement>('[data-machine]');
  const sfxLayer = $<HTMLElement>('[data-sfx]');
  const needleEl = $<SVGGElement>('[data-needle]');
  const leverEl = $<SVGGElement>('[data-lever]');
  const coffee = $<SVGRectElement>('[data-coffee]');
  const crema = $<SVGRectElement>('[data-crema]');
  const streams = [...root.querySelectorAll<SVGPathElement>('[data-stream]')];
  const steam = $<SVGGElement>('[data-steam]');
  const ghost = $<SVGPathElement>('[data-ghost]');
  const area = $<SVGPathElement>('[data-area]');
  const lineInk = $<SVGPathElement>('[data-line-ink]');
  const line = $<SVGPathElement>('[data-line]');
  const head = $<SVGCircleElement>('[data-head]');
  const barOut = $<HTMLElement>('[data-bar]');
  const secOut = $<HTMLElement>('[data-sec]');
  const phaseOut = $<HTMLElement>('[data-phase]');
  const stamp = $<HTMLElement>('[data-stamp]');
  const resultRow = $<HTMLElement>('[data-result-row]');
  const resultLine = $<HTMLElement>('[data-result]');

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ideal = idealShot();
  const audio = createAudio(store.get());

  // ---- state ----
  let phase: Phase = 'idle';
  let held = false;
  const m: Machine = { p: 0, v: 0 };
  let s = 0;
  let peak = 9;
  let fill = 0;
  let flow = 0;
  let pts: Array<[number, number]> = [];
  let lastPt = -1;
  let fired = new Set<string>();
  let outcome: Outcome = 'good';
  let finishAt = 0;
  let needle = 0;
  let needleV = 0;
  let lever = LEVER_REST;
  let leverV = 0;
  let dash = 0;
  let clock = 0;
  let raf = 0;
  let drawn = 0;
  let last = 0;
  let onScreen = true;
  const timers: number[] = [];

  // ---- the resting frame (the server rendered a frozen mid-shot) ----
  function rest() {
    ghost.setAttribute('d', linePath(ideal.pts));
    for (const el of [area, lineInk, line]) el.setAttribute('d', '');
    head.style.display = 'none';
    barOut.textContent = '0.0';
    secOut.textContent = '0';
    setPhase('Ready');
    render();
  }

  function setPhase(text: string) {
    if (phaseOut.textContent === text) return;
    phaseOut.textContent = text;
    phaseOut.classList.remove('flash');
    void phaseOut.offsetWidth;
    phaseOut.classList.add('flash');
  }

  function sfx(word: string, x: number, y: number, rot = -8, small = false) {
    const el = document.createElement('span');
    el.className = small ? 'sfx small' : 'sfx';
    el.textContent = word;
    el.style.left = `${x}%`;
    el.style.top = `${y}%`;
    el.style.setProperty('--r', `${rot}deg`);
    sfxLayer.append(el);
    timers.push(window.setTimeout(() => el.remove(), 1300));
  }

  function once(key: string, fn: () => void) {
    if (fired.has(key)) return;
    fired.add(key);
    fn();
  }

  // ---- input ----
  function start() {
    if (held || phase === 'pull' || phase === 'dump') return;
    held = true;
    ghost.setAttribute('d', linePath(pts.length > 2 ? pts : ideal.pts));
    for (const el of [area, lineInk, line]) el.setAttribute('d', '');
    pts = [[0, 0]];
    drawn = 0;
    lastPt = 0;
    s = 0;
    m.p = 0;
    m.v = 0;
    fill = 0;
    flow = 0;
    peak = 8.7 + Math.random() * 0.6;
    fired = new Set();
    stamp.textContent = '';
    stamp.classList.remove('hit');
    resultRow.removeAttribute('data-show');
    steam.removeAttribute('data-on');
    head.style.display = '';
    phase = 'pull';
    pull.setAttribute('data-held', '');
    machine.setAttribute('data-running', '');
    audio.start();
    sfx('HSSSS', 2, 47, -10);
    setPhase('Pre-infusion');
    kick();
  }

  function end() {
    if (!held) return;
    held = false;
    pull.removeAttribute('data-held');
    if (phase === 'pull') release();
  }

  function release() {
    phase = 'dump';
    pull.removeAttribute('data-held');
    machine.removeAttribute('data-running');
    held = false;
    outcome = s < 5 ? 'rinse' : s < WINDOW[0] ? 'sour' : s <= WINDOW[1] ? 'good' : 'bitter';
    audio.dump();
    sfx('PSSHT', 56, 50, 9);
    setPhase('Valve open');
    finishAt = s + 1.6;
  }

  function finish() {
    phase = 'done';
    const r = RESULTS[outcome];
    setPhase(outcome === 'good' ? 'Done' : 'Ruined');
    stamp.textContent = r.stamp;
    if (r.bad) stamp.setAttribute('data-tone', 'bad');
    else stamp.removeAttribute('data-tone');
    stamp.classList.remove('hit');
    void stamp.offsetWidth;
    stamp.classList.add('hit');
    if (outcome === 'good') {
      steam.setAttribute('data-on', '');
      sfx('drip', 64, 74, 6, true);
    }
    say(r.say);
  }

  /** Desktop: the corner narrator reacts. Phones (no narrator): a balloon in the panel. */
  function say(text: string) {
    const nar = document.querySelector<HTMLElement>('[data-narrator]');
    const nline = nar?.querySelector<HTMLElement>('[data-line]');
    if (nar && nline && nar.hasAttribute('data-on') && getComputedStyle(nar).display !== 'none') {
      nline.textContent = text;
      nline.classList.remove('pop');
      void nline.offsetWidth;
      nline.classList.add('pop');
      return;
    }
    resultLine.textContent = text;
    resultRow.setAttribute('data-show', '');
  }

  // ---- simulation ----
  function simulate(dt: number) {
    clock += dt;
    if (phase === 'pull' || phase === 'dump') {
      const ds = dt * SPEED;
      s += ds;
      const released = phase === 'dump';
      step(m, released ? 0 : target(s, peak), ds, released);
      flow = m.p * conductance(s);
      fill += (flow * ds) / ideal.yieldSum;

      if (s - lastPt >= 0.08) {
        pts.push([s, m.p]);
        lastPt = s;
      }

      if (phase === 'pull') {
        if (s > 5.6) once('drip', () => sfx('drip', 64, 72, 6, true));
        if (s > 7) once('ramp', () => setPhase('Ramping up'));
        if (m.p > 8.4) once('peak', () => (sfx('9 BAR!', 60, 2, 7), setPhase('Holding 9 bar')));
        if (s > 17) once('taper', () => setPhase('Tapering'));
        if (s > WINDOW[0]) once('window', () => setPhase('Let go!'));
        if (s > WINDOW[1]) once('late', () => setPhase('Too long!'));
        if (s >= AUTO_STOP) release();
      } else if (s >= finishAt && m.p < 0.15) {
        pts.push([s, m.p]);
        finish();
      }
      audio.update(m.p, flow);
    } else {
      // A few last drops after the shot ends.
      flow *= Math.exp(-dt * 2.5);
      if (flow < 0.05) {
        flow = 0;
        audio.stop();
      } else {
        audio.update(0, flow);
      }
    }

    // Gauge needle: a light, underdamped spring chasing the pressure,
    // with a hard peg at zero it bounces off. The pump buzz shakes it.
    const buzz = phase === 'pull' && !reduced ? 0.09 * Math.sin(clock * 83) + 0.05 * Math.sin(clock * 151) : 0;
    const goal = m.p + buzz;
    const wn = reduced ? 40 : 15;
    const z = reduced ? 1 : 0.2;
    const lw = reduced ? 50 : 26;
    const lz = reduced ? 1 : 0.32;
    const leverGoal = phase === 'pull' ? LEVER_BREW : LEVER_REST;
    const n = Math.ceil(dt / 0.004);
    const h = dt / n;
    for (let i = 0; i < n; i++) {
      needleV += (wn * wn * (goal - needle) - 2 * z * wn * needleV) * h;
      needle += needleV * h;
      if (needle < 0) {
        needle = 0;
        needleV = Math.abs(needleV) < 0.6 ? 0 : -needleV * 0.45;
      } else if (needle > P_MAX + 0.6) {
        needle = P_MAX + 0.6;
        needleV = -needleV * 0.4;
      }
      // The lever swings to its stop, clacks and settles.
      leverV += (lw * lw * (leverGoal - lever) - 2 * lz * lw * leverV) * h;
      lever += leverV * h;
      if (lever < LEVER_BREW) {
        lever = LEVER_BREW;
        leverV = -leverV * 0.35;
      } else if (lever > LEVER_REST) {
        lever = LEVER_REST;
        leverV = -leverV * 0.35;
      }
    }
    dash -= dt * 140;
  }

  function settled() {
    return (
      phase !== 'pull' &&
      phase !== 'dump' &&
      flow === 0 &&
      Math.abs(needle) < 0.01 &&
      Math.abs(needleV) < 0.01 &&
      Math.abs(lever - LEVER_REST) < 0.05 &&
      Math.abs(leverV) < 0.05
    );
  }

  // ---- drawing ----
  function render() {
    needleEl.setAttribute('transform', `rotate(${gaugeAngle(needle).toFixed(2)} ${GAUGE.x} ${GAUGE.y})`);
    leverEl.setAttribute('transform', `rotate(${lever.toFixed(2)} 240 248)`);

    const level = Math.min(60, fill * CUP_SCALE);
    const top = CUP_BOTTOM - level;
    coffee.setAttribute('y', top.toFixed(1));
    coffee.setAttribute('height', (level + 4).toFixed(1));
    crema.setAttribute('y', top.toFixed(1));
    crema.style.display = level > 1 ? '' : 'none';

    const f = Math.min(1, flow / 8);
    streams.forEach((el, i) => {
      if (f < 0.01) {
        el.style.display = 'none';
        return;
      }
      el.style.display = '';
      el.setAttribute('d', i ? `M212 316L208 ${top.toFixed(1)}` : `M188 316L192 ${top.toFixed(1)}`);
      el.setAttribute('stroke-width', (1.5 + 3 * f).toFixed(2));
      // Thin flow breaks into drops; full flow is one solid rope.
      el.setAttribute('stroke-dasharray', f > 0.35 ? '400 0' : `${(3 + 30 * f).toFixed(1)} ${(16 - 30 * f).toFixed(1)}`);
      el.setAttribute('stroke-dashoffset', (dash + i * 7).toFixed(1));
    });

    if (pts.length !== drawn && pts.length > 1) {
      drawn = pts.length;
      const d = linePath(pts);
      line.setAttribute('d', d);
      lineInk.setAttribute('d', d);
      area.setAttribute('d', areaPath(pts));
    }
    if (pts.length) {
      const tip = pts[pts.length - 1];
      head.setAttribute('cx', cx(s > tip[0] ? s : tip[0]).toFixed(1));
      head.setAttribute('cy', cy(m.p).toFixed(1));
      barOut.textContent = m.p.toFixed(1);
      secOut.textContent = String(Math.floor(s));
    }
  }

  function frame(now: number) {
    raf = 0;
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    last = now;
    simulate(dt);
    render();
    if (!settled() && onScreen && !document.hidden) raf = requestAnimationFrame(frame);
  }

  function kick() {
    // Nothing moves until the first pull (keeps the reduced-motion frame intact).
    if (raf || !onScreen || document.hidden || phase === 'idle') return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  // ---- wiring ----
  const down = (e: PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    if (e.currentTarget === pull) pull.focus({ preventScroll: true });
    start();
  };
  const up = () => end();
  const isKey = (e: KeyboardEvent) => e.key === ' ' || e.key === 'Enter';
  const keyDown = (e: KeyboardEvent) => {
    if (!isKey(e)) return;
    e.preventDefault();
    if (!e.repeat) start();
  };
  const keyUp = (e: KeyboardEvent) => {
    if (!isKey(e)) return;
    e.preventDefault();
    end();
  };
  const noMenu = (e: Event) => e.preventDefault();
  const onSound = () => {
    const muted = soundBtn.getAttribute('aria-pressed') === 'true';
    soundBtn.setAttribute('aria-pressed', String(!muted));
    soundBtn.textContent = muted ? 'Sound off' : 'Sound on';
    audio.setMuted(muted);
    store.set(muted);
  };
  const onVisibility = () => {
    if (document.hidden) end();
    else kick();
  };

  const muted = store.get();
  soundBtn.setAttribute('aria-pressed', String(!muted));
  soundBtn.textContent = muted ? 'Sound off' : 'Sound on';

  for (const el of [pull, machine]) {
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('lostpointercapture', up);
    el.addEventListener('contextmenu', noMenu);
  }
  pull.addEventListener('keydown', keyDown);
  pull.addEventListener('keyup', keyUp);
  pull.addEventListener('blur', up);
  soundBtn.addEventListener('click', onSound);
  document.addEventListener('visibilitychange', onVisibility);

  const io = new IntersectionObserver(([e]) => {
    onScreen = e.isIntersecting;
    if (onScreen) kick();
    else end();
  });
  io.observe(root);

  // With reduced motion, keep the server's complete mid-shot frame until
  // someone actually pulls; otherwise start from a cold machine.
  if (reduced) {
    needle = 8.9;
    lever = LEVER_BREW;
  } else {
    rest();
  }

  return () => {
    cancelAnimationFrame(raf);
    raf = 0;
    io.disconnect();
    timers.forEach(clearTimeout);
    for (const el of [pull, machine]) {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('lostpointercapture', up);
      el.removeEventListener('contextmenu', noMenu);
    }
    pull.removeEventListener('keydown', keyDown);
    pull.removeEventListener('keyup', keyUp);
    pull.removeEventListener('blur', up);
    soundBtn.removeEventListener('click', onSound);
    document.removeEventListener('visibilitychange', onVisibility);
    audio.dispose();
  };
}
