// Boots each signal path panel: only with WebGL and full motion, and only
// once it gets close to the viewport. three.js is loaded lazily. Without
// that, the panel keeps its static ink drawing.

const cleanups: Array<() => void> = [];

function webgl() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

function mountOne(root: HTMLElement) {
  root.classList.add('sigpath-live');
  let cancelled = false;
  let dispose: (() => void) | null = null;
  const watcher = new IntersectionObserver(
    async ([e]) => {
      if (!e.isIntersecting) return;
      watcher.disconnect();
      try {
        const { createSignalPath } = await import('./scene');
        if (cancelled) return;
        dispose = createSignalPath(root);
      } catch (err) {
        console.error(err);
        root.classList.remove('sigpath-live');
      }
    },
    { rootMargin: '400px 0px' },
  );
  watcher.observe(root);
  cleanups.push(() => {
    cancelled = true;
    watcher.disconnect();
    dispose?.();
    root.classList.remove('sigpath-live');
  });
}

function mount() {
  unmount();
  const roots = document.querySelectorAll<HTMLElement>('[data-sigpath]');
  if (!roots.length) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !webgl()) return;
  roots.forEach(mountOne);
}

function unmount() {
  while (cleanups.length) cleanups.pop()!();
}

document.addEventListener('astro:page-load', mount);
document.addEventListener('astro:before-swap', unmount);

export {};
