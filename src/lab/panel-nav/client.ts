// Panel index + balloon palette. Progressive: without JS the panels are
// plain links and the dialog never opens.
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

const ORDER = ['#top', '#projects', '#log'];
let currentPage = 0;

/** Same-page jump, played as a page turning (View Transitions API). */
function turnTo(hash: string) {
  const target = document.querySelector<HTMLElement>(hash);
  if (!target) return;
  const to = Math.max(0, ORDER.indexOf(hash));
  const back = to < currentPage || (to === currentPage && hash === '#top');
  const jump = () => {
    const y = hash === '#top' ? 0 : target.getBoundingClientRect().top + scrollY - 16;
    scrollTo({ top: y, behavior: 'instant' });
    target.focus({ preventScroll: true });
    history.replaceState(history.state, '', hash === '#top' ? location.pathname : hash);
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

/** Leaving the page: peel the bottom-right corner, then navigate. */
function curlTo(href: string) {
  if (reduced()) {
    navigate(href);
    return;
  }
  const veil = document.createElement('div');
  veil.className = 'pn-curl';
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
    else navigate(href);
  };
  requestAnimationFrame(frame);
}

function go(href: string) {
  if (href.startsWith('#')) turnTo(href);
  else curlTo(href);
}

function panelIndex(openPalette: () => void) {
  const nav = document.querySelector<HTMLElement>('[data-pn-index]');
  if (!nav) return;
  const num = nav.querySelector<HTMLElement>('[data-pn-num]')!;
  const thumbs = [...nav.querySelectorAll<HTMLAnchorElement>('[data-pn-go]')];

  const show = (n: string) => {
    if (num.textContent === n) return;
    num.textContent = n;
    num.classList.remove('flip');
    void num.offsetWidth;
    num.classList.add('flip');
  };
  const current = () => thumbs.find((t) => t.hasAttribute('aria-current'))?.dataset.pnN ?? '1';

  for (const a of thumbs) {
    listen(a, 'pointerenter', () => show(a.dataset.pnN!));
    listen(a, 'focus', () => show(a.dataset.pnN!));
    listen(a, 'click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      if (a.dataset.pnGo === 'search') openPalette();
      else go(a.getAttribute('href')!);
    });
  }
  listen(nav, 'pointerleave', () => show(current()));
  listen(nav, 'focusout', (e) => {
    if (!nav.contains(e.relatedTarget as Node)) show(current());
  });

  // The strip knows which page you're on: the section in the middle of
  // the screen is the current page.
  const sections = ORDER.map((h) => document.querySelector<HTMLElement>(h));
  const io = new IntersectionObserver(
    (entries) => {
      const hit = entries.find((e) => e.isIntersecting);
      if (!hit) return;
      const i = sections.indexOf(hit.target as HTMLElement);
      currentPage = i;
      thumbs.forEach((t, k) => (k === i ? t.setAttribute('aria-current', 'page') : t.removeAttribute('aria-current')));
      if (!nav.matches(':hover') && !nav.contains(document.activeElement)) show(String(i + 1));
    },
    { rootMargin: '-45% 0px -45% 0px' },
  );
  sections.forEach((s) => s && io.observe(s));
  cleanups.push(() => io.disconnect());

  const kbd = nav.querySelector<HTMLElement>('[data-pn-kbd]');
  if (kbd) {
    kbd.textContent = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘K' : 'Ctrl K';
    kbd.hidden = !matchMedia('(pointer: fine)').matches;
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
  if (!document.querySelector('[data-pn-index]')) return;
  const open = palette();
  panelIndex(open);
});

document.addEventListener('astro:before-swap', () => {
  cleanups.forEach((fn) => fn());
  cleanups = [];
});
