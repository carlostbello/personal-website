// Optional, page-level: panel borders ink over a pencil rough as they
// scroll in. Not used by PencilsHero. Import it from a page and pass a
// selector; the page supplies the CSS (see src/pages/lab/pencils.astro,
// `.panel[data-pencils-rough]`).

let cleanups: Array<() => void> = [];

export function inkPanels(selector = '[data-say] .panel') {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const panels = [...document.querySelectorAll<HTMLElement>(selector)];
  if (!panels.length) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('pencils-drawn');
        io.unobserve(e.target);
      }
    },
    { threshold: 0.2 },
  );
  panels.forEach((p) => {
    p.dataset.pencilsRough = '';
    io.observe(p);
  });
  cleanups.push(() => io.disconnect());
}

document.addEventListener('astro:before-swap', () => {
  cleanups.forEach((fn) => fn());
  cleanups = [];
});
