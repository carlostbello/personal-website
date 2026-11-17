// Panel index + balloon palette. Imported by both PanelIndex.astro and
// Palette.astro (Astro bundles it once); each half only wakes up if its
// component is on the page. Progressive: without JS the panels are plain
// links and the dialog never opens.
//
// Public API: any element with data-pn-open-palette opens the palette on
// click, as does window.dispatchEvent(new CustomEvent('pn:open-palette')).
// `open()` and `go(href)` are exported for other scripts.
import { navigate } from 'astro:transitions/client';
import { search, type Entry } from './search';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
let cleanups: Array<() => void> = [];

const listen = <K extends keyof DocumentEventMap>(
  target: Document | HTMLElement,
  type: K,
  fn: (e: DocumentEventMap[K]) => void,
) => {
  target.addEventListener(type, fn as EventListener);
  cleanups.push(() => target.removeEventListener(type, fn as EventListener));
};

/* ------------------------------------------------------------------
   Page turns
   ------------------------------------------------------------------ */

/** Hrefs of the tracked panels, in strip order, for turn direction. */
let order: string[] = [];
let currentPage = 0;

/** Same-page jump, played as a page turning (View Transitions API). */
function turnTo(hash: string) {
  const target = document.querySelector<HTMLElement>(hash);
  const toTop = hash === '#top';
  if (!target && !toTop) {
    // Not on this page after all: let the browser handle it.
    location.hash = hash;
    return;
  }
  const to = Math.max(0, order.indexOf(hash));
  const back = to < currentPage || (to === currentPage && toTop);
  const jump = () => {
    const y = toTop || !target ? 0 : target.getBoundingClientRect().top + scrollY - 16;
    scrollTo({ top: y, behavior: 'instant' });
    target?.focus({ preventScroll: true });
    history.replaceState(history.state, '', toTop ? location.pathname + location.search : hash);
  };

  if (reduced() || !document.startViewTransition) {
    jump();
    return;
  }
  const root = document.documentElement;
  root.classList.add('pn-turn', back ? 'pn-back' : 'pn-fwd');
  const vt = document.startViewTransition(jump);
  vt.finished.finally(() => root.classList.remove('pn-turn', 'pn-back', 'pn-fwd'));
}

/* The peel and the site's panel wipe used to play back to back. Now the
   peel *is* the transition: once it has covered the screen we navigate
   with the router, skip that navigation's view transition (so no wipe),
   and lift a plain veil of the same halftone off the new page. The veil
   is styled inline because the next page may not carry turns.css. */
let peeling = false;
let peelGuard = 0;
const VEIL_BG = 'radial-gradient(circle, var(--field, #3b5a8c) 1.5px, transparent 2px) 0 0 / 10px 10px, var(--field-deep, #2b4470)';

document.addEventListener('astro:before-swap', (e) => {
  if (!peeling) return;
  const vt = (e as Event & { viewTransition?: ViewTransition }).viewTransition;
  if (!vt) return;
  // Skipping rejects `ready`; nobody else awaits it, so keep it quiet.
  vt.ready.catch(() => {});
  vt.skipTransition();
});
document.addEventListener('astro:after-swap', () => {
  if (!peeling) return;
  peeling = false;
  clearTimeout(peelGuard);
  const veil = document.createElement('div');
  veil.setAttribute('aria-hidden', 'true');
  veil.style.cssText = `position:fixed;inset:0;z-index:200;pointer-events:none;background:${VEIL_BG}`;
  document.body.append(veil);
  veil.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: 'ease-out', fill: 'forwards' }).finished.finally(() =>
    veil.remove(),
  );
});

/** Leaving the page: peel the bottom-right corner, then navigate. */
function curlTo(href: string) {
  if (reduced()) {
    navigate(href);
    return;
  }
  const veil = document.createElement('div');
  veil.className = 'pn-curl';
  veil.setAttribute('aria-hidden', 'true');
  veil.innerHTML = '<div class="pn-curl-under"></div><div class="pn-curl-edge"><div class="pn-curl-flap"></div></div>';
  document.body.append(veil);
  const under = veil.firstElementChild as HTMLElement;
  const flap = veil.querySelector<HTMLElement>('.pn-curl-flap')!;
  const W = innerWidth;
  const H = innerHeight;
  const end = (W + H) * 1.05;
  const dur = 520;
  const t0 = performance.now();
  const ease = (t: number) => t * t * (3 - 2 * t);

  const frame = (now: number) => {
    const t = Math.min(1, (now - t0) / dur);
    const s = ease(t) * end;
    // Fold line runs from (W - s, H) to (W, H - s). The revealed corner
    // is the triangle beyond it; the flap is that triangle mirrored.
    under.style.clipPath = `polygon(${W - s}px ${H}px, ${W}px ${H - s}px, ${W}px ${H}px)`;
    flap.style.clipPath = `polygon(${W - s}px ${H}px, ${W}px ${H - s}px, ${W - s}px ${H - s}px)`;
    if (t < 1) requestAnimationFrame(frame);
    else {
      peeling = true;
      // If the navigation never swaps (error, full reload, aborted), don't
      // leave the page covered.
      peelGuard = window.setTimeout(() => {
        peeling = false;
        veil.remove();
      }, 5000);
      navigate(href);
    }
  };
  requestAnimationFrame(frame);
}

/** Go anywhere: hash links on this page turn it, everything else peels. */
export function go(href: string) {
  if (href.startsWith('#')) turnTo(href);
  else curlTo(href);
}

/* ------------------------------------------------------------------
   Opening the palette from anywhere
   ------------------------------------------------------------------ */

let openPalette: (() => void) | null = null;

/** Opens the palette if one is on the page. Returns false if not. */
export function open(): boolean {
  if (!openPalette) return false;
  openPalette();
  return true;
}

document.addEventListener('click', (e) => {
  const el = (e.target as Element | null)?.closest?.('[data-pn-open-palette]');
  if (!el || !openPalette) return;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
  e.preventDefault();
  openPalette();
  // Capture phase: the router's own link handler on document would
  // otherwise navigate first.
}, true);
window.addEventListener('pn:open-palette', () => openPalette?.());

/* ------------------------------------------------------------------
   The panel index
   ------------------------------------------------------------------ */

function panelIndex(nav: HTMLElement) {
  const num = nav.querySelector<HTMLElement>('[data-pn-num]')!;
  const thumbs = [...nav.querySelectorAll<HTMLAnchorElement>('a[data-pn-n]')];

  const show = (n: string) => {
    if (num.textContent === n) return;
    num.textContent = n;
    num.classList.remove('flip');
    void num.offsetWidth;
    num.classList.add('flip');
  };
  const current = () => thumbs.find((t) => t.hasAttribute('aria-current'))?.dataset.pnN ?? num.textContent ?? '1';

  for (const a of thumbs) {
    listen(a, 'pointerenter', () => show(a.dataset.pnN!));
    listen(a, 'focus', () => show(a.dataset.pnN!));
    if (!a.hasAttribute('data-pn-go')) continue;
    listen(a, 'click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      go(a.getAttribute('href')!);
    });
  }
  listen(nav, 'pointerleave', () => show(current()));
  listen(nav, 'focusout', (e) => {
    if (!nav.contains(e.relatedTarget as Node)) show(current());
  });

  // The strip knows which page you're on: the last tracked section whose
  // top has passed the middle of the screen (so sections in between keep
  // the one before them lit). '#top' with no element is the page top.
  const tracked = thumbs
    .filter((t) => t.dataset.pnTrack)
    .map((t) => ({ thumb: t, sel: t.dataset.pnTrack!, el: document.querySelector<HTMLElement>(t.dataset.pnTrack!) }))
    .filter((t) => t.el || t.sel === '#top');
  order = tracked.map((t) => t.sel);

  const update = () => {
    const mid = innerHeight / 2;
    let hit = 0;
    tracked.forEach((t, i) => {
      const top = t.el ? t.el.getBoundingClientRect().top : -scrollY;
      if (top <= mid) hit = i;
    });
    currentPage = hit;
    const cur = tracked[hit].thumb;
    thumbs.forEach((t) => (t === cur ? t.setAttribute('aria-current', 'page') : t.removeAttribute('aria-current')));
    if (!nav.matches(':hover') && !nav.contains(document.activeElement)) show(cur.dataset.pnN!);
  };
  let raf = 0;
  const onScroll = () => {
    if (!raf) raf = requestAnimationFrame(() => ((raf = 0), update()));
  };
  if (tracked.length) {
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    cleanups.push(() => {
      removeEventListener('scroll', onScroll);
      removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    });
    update();
  }

  const kbd = nav.querySelector<HTMLElement>('[data-pn-kbd]');
  if (kbd) {
    kbd.textContent = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘K' : 'Ctrl K';
    kbd.hidden = !matchMedia('(pointer: fine)').matches || !openPalette;
  }
}

/* ------------------------------------------------------------------
   The balloon palette
   ------------------------------------------------------------------ */

type State = 'idle' | 'thinking' | 'found' | 'empty' | 'go';

const LINES = {
  idle: 'Where to?',
  thinking: 'Hmm...',
  found: (n: number) => (n === 1 ? 'Got one.' : `Got ${n}.`),
  empty: 'Nothing here. Try the full search?',
};

function palette() {
  const dialog = document.querySelector<HTMLDialogElement>('[data-pn-dialog]');
  if (!dialog) return () => {};
  const input = dialog.querySelector<HTMLInputElement>('[data-pn-input]')!;
  const list = dialog.querySelector<HTMLOListElement>('[data-pn-results]')!;
  const say = dialog.querySelector<HTMLElement>('[data-pn-say]')!;
  const guy = dialog.querySelector<HTMLElement>('[data-pn-guy]')!;
  const index: Entry[] = JSON.parse(dialog.querySelector('[data-pn-data]')?.textContent ?? '[]');

  let items: Entry[] = [];
  let active = 0;
  let timer = 0;
  let closing = false;

  const setState = (s: State, line: string) => {
    // Restart one-shot animations (hop, shrug) even if the state repeats.
    if (dialog.dataset.state === s && (s === 'found' || s === 'empty')) {
      dialog.dataset.state = 'idle';
      void guy.offsetWidth;
    }
    dialog.dataset.state = s;
    if (say.textContent !== line) {
      say.textContent = line;
      say.classList.remove('pop');
      void say.offsetWidth;
      say.classList.add('pop');
    }
  };

  const render = (entries: Entry[], marks: Array<Array<[number, number]>> = []) => {
    items = entries;
    active = 0;
    list.replaceChildren(
      ...entries.map((e, i) => {
        const li = document.createElement('li');
        li.id = `pn-opt-${i}`;
        li.setAttribute('role', 'option');
        li.style.setProperty('--i', String(i));
        const n = document.createElement('span');
        n.className = 'pn-n';
        n.textContent = String(i + 1);
        const body = document.createElement('span');
        body.style.minWidth = '0';
        const t = document.createElement('span');
        t.className = 'pn-t';
        let at = 0;
        for (const [a, b] of marks[i] ?? []) {
          t.append(e.title.slice(at, a));
          const m = document.createElement('mark');
          m.textContent = e.title.slice(a, b);
          t.append(m);
          at = b;
        }
        t.append(e.title.slice(at));
        const sub = document.createElement('span');
        sub.className = 'pn-sub';
        sub.textContent = e.sub;
        body.append(t, sub);
        const enter = document.createElement('kbd');
        enter.className = 'pn-enter';
        enter.textContent = '↵ Enter';
        enter.setAttribute('aria-hidden', 'true');
        li.append(n, body, enter);
        li.addEventListener('pointermove', () => select(i, false));
        li.addEventListener('click', () => choose(i));
        return li;
      }),
    );
    select(0);
  };

  const select = (i: number, scroll = true) => {
    if (!items.length) {
      input.removeAttribute('aria-activedescendant');
      return;
    }
    active = (i + items.length) % items.length;
    [...list.children].forEach((li, k) => li.setAttribute('aria-selected', String(k === active)));
    input.setAttribute('aria-activedescendant', `pn-opt-${active}`);
    if (scroll) list.children[active]?.scrollIntoView({ block: 'nearest' });
  };

  const suggestions = () => {
    render(index.filter((e) => e.suggest));
    setState('idle', LINES.idle);
  };

  const fullSearch = (q: string): Entry => ({
    title: `Search every word for "${q}"`,
    sub: 'Full text, all posts',
    href: `/search?q=${encodeURIComponent(q)}`,
    terms: '',
  });

  const run = () => {
    const q = input.value.trim();
    if (!q) return suggestions();
    const hits = search(index, q);
    render(
      [...hits.map((h) => h.entry), fullSearch(q)],
      hits.map((h) => h.marks),
    );
    if (hits.length) setState('found', LINES.found(hits.length));
    else setState('empty', LINES.empty);
  };

  const onInput = () => {
    clearTimeout(timer);
    if (!input.value.trim()) return run();
    setState('thinking', LINES.thinking);
    timer = window.setTimeout(run, reduced() ? 0 : 240);
  };

  const shut = (then?: () => void) => {
    if (!dialog.open || closing) return;
    clearTimeout(timer);
    if (reduced()) {
      dialog.close();
      then?.();
      return;
    }
    closing = true;
    dialog.setAttribute('data-closing', '');
    setTimeout(() => {
      dialog.close();
      dialog.removeAttribute('data-closing');
      closing = false;
      then?.();
    }, 190);
  };

  const choose = (i: number) => {
    const e = items[i];
    if (!e) return;
    setState('go', 'Off we go.');
    // Hash links on this page turn the page; everything else peels away.
    shut(() => go(e.href));
  };

  const open = () => {
    if (dialog.open) return;
    input.value = '';
    suggestions();
    dialog.showModal();
    input.focus();
  };

  input.addEventListener('input', onInput);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') select(active + 1);
    else if (e.key === 'ArrowUp') select(active - 1);
    else if (e.key === 'Home' && items.length && !input.value) select(0);
    else if (e.key === 'Enter') {
      clearTimeout(timer);
      if (dialog.dataset.state === 'thinking') run();
      choose(active);
    } else return;
    e.preventDefault();
  });
  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    shut();
  });
  // Clicking the dimmed page (outside the balloon and Carlos) closes it.
  dialog.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t === dialog || t.classList.contains('pn-stage')) shut();
  });

  listen(document, 'keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (dialog.open) shut();
      else open();
    }
  });
  cleanups.push(() => {
    clearTimeout(timer);
    if (dialog.open) dialog.close();
  });
  return open;
}

document.addEventListener('astro:page-load', () => {
  openPalette = document.querySelector('[data-pn-dialog]') ? palette() : null;
  document.querySelectorAll<HTMLElement>('[data-pn-index]').forEach(panelIndex);
});

document.addEventListener('astro:before-swap', () => {
  cleanups.forEach((fn) => fn());
  cleanups = [];
  openPalette = null;
  order = [];
  currentPage = 0;
});
