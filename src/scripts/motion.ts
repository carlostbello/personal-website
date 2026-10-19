// Page motion. Everything here is progressive: without JS (or with
// reduced motion) the page renders complete and still.

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
let cleanups: Array<() => void> = [];

/** Strokes in [data-ink] SVGs draw themselves once they scroll into view. */
function inkIn() {
  const drawings = document.querySelectorAll<SVGSVGElement>('[data-ink]');
  if (reduced()) {
    drawings.forEach((d) => d.classList.add('inked'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('inked');
        io.unobserve(e.target);
      }
    },
    { threshold: 0.3 },
  );
  drawings.forEach((svg) => {
    const strokes = [...svg.querySelectorAll<SVGGeometryElement>('path, rect, circle, line, polyline')]
      // Dashed strokes keep their own dash pattern and just appear.
      .filter((el) => !el.hasAttribute('stroke-dasharray'));
    strokes.forEach((el, i) => {
      el.classList.add('ink');
      const len = Math.ceil(el.getTotalLength?.() ?? 1000);
      el.style.setProperty('--len', String(len));
      el.style.setProperty('--i', String(i));
    });
    io.observe(svg);
  });
  cleanups.push(() => io.disconnect());
}

/**
 * The narrator: a small avatar pinned to the corner that comments on
 * whichever section is in the middle of the screen. Lines come from
 * each section's data-say attribute; clicking him cycles data-quips.
 */
function narrator() {
  const root = document.querySelector<HTMLElement>('[data-narrator]');
  const line = root?.querySelector<HTMLElement>('[data-line]');
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  if (!root || !line) return;

  let current = '';
  const say = (text?: string) => {
    if (!text || text === current) return;
    current = text;
    line.textContent = text;
    line.classList.remove('pop');
    void line.offsetWidth; // restart the pop animation
    line.classList.add('pop');
  };

  const sections = new IntersectionObserver(
    (entries) => {
      const hit = entries.find((e) => e.isIntersecting);
      if (hit) say((hit.target as HTMLElement).dataset.say);
    },
    { rootMargin: '-45% 0px -45% 0px' },
  );
  document.querySelectorAll('[data-say]').forEach((s) => sections.observe(s));

  // He only shows up once the big hero version of him is off screen.
  const heroWatch = new IntersectionObserver(([e]) => root.toggleAttribute('data-on', !e.isIntersecting), {
    threshold: 0.15,
  });
  if (hero) heroWatch.observe(hero);

  const quips: string[] = JSON.parse(root.dataset.quips ?? '[]');
  let q = 0;
  const onClick = () => quips.length && say(quips[q++ % quips.length]);
  root.querySelector('button')?.addEventListener('click', onClick);

  cleanups.push(() => {
    sections.disconnect();
    heroWatch.disconnect();
  });
}

/** The hero avatar leans toward the pointer. */
function lean() {
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  const who = hero?.querySelector<HTMLElement>('[data-lean]');
  if (!hero || !who || reduced() || !matchMedia('(pointer: fine)').matches) return;

  let frame = 0;
  const onMove = (e: PointerEvent) => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const r = who.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / innerWidth;
      const dy = (e.clientY - (r.top + r.height / 2)) / innerHeight;
      who.style.setProperty('--lean', `${(dx * 10).toFixed(2)}deg`);
      who.style.setProperty('--shift', `${(dy * 8).toFixed(1)}px`);
    });
  };
  hero.addEventListener('pointermove', onMove);
  cleanups.push(() => hero.removeEventListener('pointermove', onMove));
}

document.addEventListener('astro:page-load', () => {
  inkIn();
  narrator();
  lean();
});

document.addEventListener('astro:before-swap', () => {
  cleanups.forEach((fn) => fn());
  cleanups = [];
});

document.addEventListener('astro:after-swap', () => {
  document.documentElement.classList.add('js');
});
