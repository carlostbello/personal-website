// Drives the pinned comic page in ComicPage.astro.
//
// CSS does the animating. This script only:
//  - switches the page into live mode (data-live) when the screen is wide
//    and motion is allowed, so no-JS visitors get the static page;
//  - gives each drawing stroke its length and a staggered beat range;
//  - scrubs the paused animations by hand where scroll timelines are
//    missing;
//  - jumps to the finished page when keyboard focus enters it, and moves
//    the corner narrator out of the way while the page is pinned.

const LIVE = '(min-width: 900px) and (min-height: 600px) and (prefers-reduced-motion: no-preference)';
const native = typeof CSS !== 'undefined' && CSS.supports('animation-timeline: view()');

let cleanups: Array<() => void> = [];

function setup() {
  const root = document.querySelector<HTMLElement>('[data-cp]');
  const track = root?.querySelector<HTMLElement>('.cp-track');
  if (!root || !track) return;

  // Strokes ink in one after another inside their panel's ink beat.
  root.querySelectorAll<HTMLElement>('.cp-cell[data-ink-a]').forEach((cell) => {
    const a = Number(cell.dataset.inkA);
    const b = Number(cell.dataset.inkB);
    const strokes = [
      ...cell.querySelectorAll<SVGGeometryElement>('.cp-art path, .cp-art rect, .cp-art circle, .cp-art line, .cp-art polyline'),
    ].filter((el) => !el.hasAttribute('stroke-dasharray') && el.getAttribute('stroke') !== 'none');
    const span = b - a;
    const each = Math.min(span * 0.55, span / Math.max(1, strokes.length) * 2.2);
    strokes.forEach((el, i) => {
      const start = a + (strokes.length > 1 ? (i / (strokes.length - 1)) * (span - each) : 0);
      el.classList.add('cp-stroke');
      el.style.setProperty('--len', String(Math.ceil(el.getTotalLength?.() ?? 1000)));
      el.style.setProperty('--a', `${start.toFixed(2)}%`);
      el.style.setProperty('--b', `${(start + each).toFixed(2)}%`);
    });
  });

  const mq = matchMedia(LIVE);
  let live = false;
  let beats: Array<{ anim: Animation; a: number; b: number }> = [];
  let frame = 0;

  const progress = () => {
    const r = track.getBoundingClientRect();
    const run = r.height - innerHeight;
    return { p: run > 0 ? Math.min(1, Math.max(0, -r.top / run)) : 1, pinned: r.top <= 1 && r.bottom >= innerHeight - 2 };
  };

  // Fallback scrubbing: same ranges the CSS uses, applied to currentTime.
  const collect = () => {
    beats = [];
    root.querySelectorAll<HTMLElement | SVGElement>('.beat, .cp-stroke').forEach((el) => {
      const cs = getComputedStyle(el);
      const a = parseFloat(cs.getPropertyValue('--a')) || 0;
      const b = parseFloat(cs.getPropertyValue('--b')) || 100;
      el.getAnimations().forEach((anim) => beats.push({ anim, a, b }));
    });
  };

  const tick = () => {
    frame = 0;
    const { p, pinned } = progress();
    document.documentElement.toggleAttribute('data-cp-pinned', live && pinned);
    if (!live || native) return;
    const at = p * 100;
    for (const { anim, a, b } of beats) {
      const t = Math.min(1, Math.max(0, (at - a) / (b - a)));
      anim.currentTime = t * 1000;
    }
  };
  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(tick);
  };

  const apply = () => {
    live = mq.matches;
    root.toggleAttribute('data-live', live);
    if (live && !native) {
      // Styles must be in place before the animations exist to collect.
      requestAnimationFrame(() => {
        collect();
        tick();
      });
    } else {
      beats = [];
      tick();
    }
  };

  // Keyboard users skip straight to the assembled page.
  const onFocus = () => {
    if (!live) return;
    const r = track.getBoundingClientRect();
    const end = scrollY + r.top + r.height - innerHeight;
    if (Math.abs(scrollY - end) > 4) window.scrollTo({ top: end, behavior: 'instant' });
  };

  apply();
  mq.addEventListener('change', apply);
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  root.addEventListener('focusin', onFocus);

  cleanups.push(() => {
    mq.removeEventListener('change', apply);
    removeEventListener('scroll', onScroll);
    removeEventListener('resize', onScroll);
    root.removeEventListener('focusin', onFocus);
    cancelAnimationFrame(frame);
    document.documentElement.removeAttribute('data-cp-pinned');
  });
}

document.addEventListener('astro:page-load', setup);
document.addEventListener('astro:before-swap', () => {
  cleanups.forEach((fn) => fn());
  cleanups = [];
});

export {};
