// Boots the signal path scene: only with WebGL and full motion, and only
// once the section gets close to the viewport. three.js is loaded lazily.

let cleanup: (() => void) | null = null;
let watcher: IntersectionObserver | null = null;

function webgl() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

function mount() {
  const root = document.querySelector<HTMLElement>('[data-sp]');
  if (!root) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !webgl()) return;
  root.classList.add('sp-live');

  let cancelled = false;
  watcher = new IntersectionObserver(
    async ([e]) => {
      if (!e.isIntersecting) return;
      watcher?.disconnect();
      watcher = null;
      try {
        const { createSignalPath } = await import('./scene');
        if (cancelled) return;
        cleanup = createSignalPath(root);
      } catch (err) {
        console.error(err);
        root.classList.remove('sp-live');
      }
    },
    { rootMargin: '400px 0px' },
  );
  watcher.observe(root);
  const prev = cleanup;
  cleanup = () => {
    cancelled = true;
    prev?.();
  };
}

function unmount() {
  watcher?.disconnect();
  watcher = null;
  cleanup?.();
  cleanup = null;
}

document.addEventListener('astro:page-load', mount);
document.addEventListener('astro:before-swap', unmount);
