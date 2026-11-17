// The hero is drawn in production passes on first visit: pencils, inks,
// colors. DOM elements follow `data-pencils-stage` on the hero (CSS in
// PencilsHero.astro); the avatar follows a continuous progress value in a
// shader. Afterwards the caption box becomes a tag to flip between passes.

import { createPasses, type Passes } from './passes';

const KEY = 'lab-pencils-seen';
const NAMES = ['Pencils', 'Inks', 'Colors'];
const LAST = NAMES.length;
// [duration of the pass, pause after it] in ms
const TIMING: Array<[number, number]> = [
  [1300, 250],
  [1100, 200],
  [1000, 0],
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

async function setup(hero: HTMLElement) {
  const who = hero.querySelector<HTMLElement>('.who');
  const art = hero.querySelector<HTMLElement>('.art');
  const canvas = hero.querySelector<HTMLCanvasElement>('canvas.passes');
  const tag = hero.querySelector<HTMLElement>('[data-pencils-tag]');
  const now = tag?.querySelector<HTMLElement>('[data-pencils-now]');
  const skipBtn = tag?.querySelector<HTMLButtonElement>('[data-pencils-skip]');
  if (!who || !art || !canvas || !tag || !now || !skipBtn) return;
  const passBtns = [...tag.querySelectorAll<HTMLButtonElement>('[data-pencils-pass]')];
  const hint = hero.querySelector<HTMLElement>('[data-pencils-hint]');

  const play = !seen() && !reduced();
  let alive = true;
  let p = play ? 0 : LAST;
  let passes: Passes | null = null;
  let tweenRaf = 0;
  let lensOn = false;
  let artTimer = 0;

  hero.dataset.pencilsIntro = play ? 'play' : 'skip';
  if (play) hero.dataset.pencilsStage = '0';
  tag.hidden = false;
  tag.dataset.mode = 'intro';

  // When he is finished and the lens is off, show the real <img> rather
  // than the canvas, so the end frame is exactly the homepage hero.
  const syncArt = () => who.classList.toggle('pencils-art', p >= LAST && !lensOn);

  const setP = (v: number) => {
    p = v;
    passes?.set(v);
    syncArt();
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
    now.textContent = `${NAMES[i]} — ${i + 1} of ${LAST}`;
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
    setP(LAST);
    hero.dataset.pencilsStage = String(LAST);
    hero.dataset.pencilsIntro = 'played';
    showControls(LAST);
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
      hero.dataset.pencilsStage = String(stage);
      hero.dataset.pencilsIntro = 'played';
      passBtns.forEach((o, j) => o.setAttribute('aria-pressed', String(j === i)));
      tween(stage, Math.min(1400, Math.abs(stage - p) * 600));
    }),
  );

  // Lens: hover the avatar to see his pencils underneath.
  const onMove = (e: PointerEvent) => {
    if (!passes || tag.dataset.mode !== 'controls' || e.pointerType !== 'mouse') return;
    clearTimeout(artTimer);
    lensOn = true;
    syncArt();
    const r = canvas.getBoundingClientRect();
    passes.lens(((e.clientX - r.left) / r.width) * canvas.clientWidth, ((e.clientY - r.top) / r.height) * canvas.clientHeight);
  };
  const onLeave = () => {
    passes?.lensOff();
    clearTimeout(artTimer);
    // let the lens ease out on the canvas before handing back to the <img>
    artTimer = window.setTimeout(() => {
      lensOn = false;
      syncArt();
    }, 350);
  };
  art.addEventListener('pointermove', onMove);
  art.addEventListener('pointerleave', onLeave);

  cleanups.push(() => {
    alive = false;
    cancelAnimationFrame(tweenRaf);
    clearTimeout(artTimer);
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
      syncArt();
      who.classList.add('gl');
    }
  });

  if (!play) {
    await ready;
    if (alive) showControls(LAST);
    return;
  }

  markSeen();
  // Give the texture a moment so the avatar passes line up with the DOM.
  await Promise.race([ready, wait(600)]);
  for (let i = 0; i < LAST; i++) {
    if (!alive || skipped) return;
    hero.dataset.pencilsStage = String(i + 1);
    label(i);
    await tween(i + 1, TIMING[i][0]);
    if (!alive || skipped) return;
    await wait(TIMING[i][1]);
  }
  if (alive && !skipped) finish();
}

document.addEventListener('astro:page-load', () => {
  const hero = document.querySelector<HTMLElement>('[data-pencils-hero]');
  if (hero) setup(hero);
});

document.addEventListener('astro:before-swap', () => {
  cleanups.forEach((fn) => fn());
  cleanups = [];
});
