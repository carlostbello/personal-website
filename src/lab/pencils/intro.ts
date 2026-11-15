// The hero is drawn in production passes on first load: pencils, inks,
// flats, print. DOM elements follow `data-stage` on the hero (CSS in the
// page); the avatar follows a continuous progress value in a shader.
// Afterwards the caption box becomes a tag to flip between passes.

import { createPasses, type Passes } from './passes';

const KEY = 'lab-pencils-seen';
const NAMES = ['Pencils', 'Inks', 'Flats', 'Print'];
// [duration of the pass, pause after it] in ms
const TIMING: Array<[number, number]> = [
  [1300, 250],
  [1100, 200],
  [950, 150],
  [850, 600],
];

let cleanups: Array<() => void> = [];

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const seen = () => {
  try {
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
};
const markSeen = () => {
  try {
    sessionStorage.setItem(KEY, '1');
  } catch {
    /* private mode: just replays next time */
  }
};

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

async function setup() {
  const hero = document.querySelector<HTMLElement>('[data-pencils]');
  if (!hero) return;
  const art = hero.querySelector<HTMLElement>('.art')!;
  const canvas = hero.querySelector<HTMLCanvasElement>('canvas.passes')!;
  const tag = hero.querySelector<HTMLElement>('[data-tag]')!;
  const now = tag.querySelector<HTMLElement>('[data-now]')!;
  const skipBtn = tag.querySelector<HTMLButtonElement>('[data-skip]')!;
  const passBtns = [...tag.querySelectorAll<HTMLButtonElement>('[data-pass]')];
  const hint = hero.querySelector<HTMLElement>('[data-hint]');

  const play = !seen() && !reduced();
  let alive = true;
  let p = play ? 0 : 4;
  let passes: Passes | null = null;
  let tweenRaf = 0;

  hero.dataset.intro = play ? 'play' : 'skip';
  if (play) hero.dataset.stage = '0';
  tag.hidden = false;
  tag.dataset.mode = 'intro';

  const setP = (v: number) => {
    p = v;
    passes?.set(v);
  };

  /** Animate the shader progress; resolves when done or cancelled. */
  const tween = (to: number, ms: number) =>
    new Promise<void>((resolve) => {
      cancelAnimationFrame(tweenRaf);
      const from = p;
      if (reduced() || ms <= 0 || from === to) {
        setP(to);
        return resolve();
      }
      const t0 = performance.now();
      const step = (t: number) => {
        if (!alive) return resolve();
        const k = Math.min(1, (t - t0) / ms);
        setP(from + (to - from) * ease(k));
        if (k < 1) tweenRaf = requestAnimationFrame(step);
        else resolve();
      };
      tweenRaf = requestAnimationFrame(step);
    });

  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const label = (i: number) => {
    now.textContent = `${NAMES[i]} — ${i + 1} of 4`;
    now.classList.remove('pop');
    void now.offsetWidth;
    now.classList.add('pop');
  };

  const showControls = (stage: number) => {
    tag.dataset.mode = 'controls';
    passBtns.forEach((b, i) => b.setAttribute('aria-pressed', String(i + 1 === stage)));
    if (hint && matchMedia('(pointer: fine)').matches && passes) hint.hidden = false;
  };

  let skipped = false;
  const finish = () => {
    cancelAnimationFrame(tweenRaf);
    setP(4);
    hero.dataset.stage = '4';
    hero.dataset.intro = 'played';
    showControls(4);
  };
  const skip = () => {
    if (skipped) return;
    skipped = true;
    finish();
  };
  skipBtn.addEventListener('click', skip);
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && tag.dataset.mode === 'intro') skip();
  };
  document.addEventListener('keydown', onKey);

  // Pass buttons: flip the whole hero to that stage of production.
  passBtns.forEach((b, i) =>
    b.addEventListener('click', () => {
      const stage = i + 1;
      hero.dataset.stage = String(stage);
      passBtns.forEach((o, j) => o.setAttribute('aria-pressed', String(j === i)));
      tween(stage, Math.min(1400, Math.abs(stage - p) * 600));
    }),
  );

  // Lens: hover the finished avatar to see his pencils underneath.
  const onMove = (e: PointerEvent) => {
    if (!passes || tag.dataset.mode !== 'controls' || e.pointerType !== 'mouse') return;
    const r = canvas.getBoundingClientRect();
    passes.lens(((e.clientX - r.left) / r.width) * canvas.clientWidth, ((e.clientY - r.top) / r.height) * canvas.clientHeight);
  };
  const onLeave = () => passes?.lensOff();
  art.addEventListener('pointermove', onMove);
  art.addEventListener('pointerleave', onLeave);

  cleanups.push(() => {
    alive = false;
    cancelAnimationFrame(tweenRaf);
    document.removeEventListener('keydown', onKey);
    art.removeEventListener('pointermove', onMove);
    art.removeEventListener('pointerleave', onLeave);
    passes?.dispose();
  });

  // Start the renderer; the intro can run its DOM passes while it loads.
  const ready = createPasses(canvas, canvas.dataset.src!, p).then((ps) => {
    if (!alive) {
      ps?.dispose();
      return;
    }
    passes = ps;
    if (ps) {
      ps.set(p);
      hero.querySelector('.who')?.classList.add('gl');
    }
  });

  if (!play) {
    await ready;
    if (alive) showControls(4);
    return;
  }

  markSeen();
  // Give the texture a moment so the avatar passes line up with the DOM.
  await Promise.race([ready, wait(600)]);
  for (let i = 0; i < 4; i++) {
    if (!alive || skipped) return;
    hero.dataset.stage = String(i + 1);
    label(i);
    await tween(i + 1, TIMING[i][0]);
    if (!alive || skipped) return;
    await wait(TIMING[i][1]);
  }
  if (alive && !skipped) finish();
}

/** The rest of the page: panel borders ink over a pencil rough as they arrive. */
function inkPanels() {
  if (reduced()) return;
  const panels = [...document.querySelectorAll<HTMLElement>('[data-say] .panel')];
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('drawn');
        io.unobserve(e.target);
      }
    },
    { threshold: 0.2 },
  );
  panels.forEach((p) => {
    p.dataset.rough = '';
    io.observe(p);
  });
  cleanups.push(() => io.disconnect());
}

document.addEventListener('astro:page-load', () => {
  if (!document.querySelector('[data-pencils]')) return;
  setup();
  inkPanels();
});

document.addEventListener('astro:before-swap', () => {
  cleanups.forEach((fn) => fn());
  cleanups = [];
});
