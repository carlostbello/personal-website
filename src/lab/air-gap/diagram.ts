// The air gap diagram, inked onto a canvas at runtime so it can be used as
// the paper's texture. Two layouts: a wide one (outside on the left) and a
// tall one for phones (outside on top). Coordinates are logical units; the
// packet simulation reads the same layout so packets ride the drawn tracks.

export type Pt = { x: number; y: number };

/** Every word drawn into the canvas. WorkSection passes these in as JSON. */
export interface Labels {
  boundary: string;
  docs: string;
  index: string;
  model: string;
  servers: string;
  internet: string;
  gap: string;
  thunk: string;
  blocked: string;
}

export const defaultLabels: Labels = {
  boundary: 'the network that stays offline',
  docs: 'your docs',
  index: 'index',
  model: 'model',
  servers: 'servers',
  internet: 'the internet',
  gap: 'AIR GAP',
  thunk: 'THUNK!',
  blocked: 'BLOCKED!',
};

export interface Layout {
  kind: 'wide' | 'tall';
  w: number;
  h: number;
  /** Number of accordion panels the paper folds into (along x for wide, y for tall). */
  panels: number;
  /** The air gap band: the two thick ink lines sit at `from` and `to`. */
  gap: { from: number; to: number };
  outside: { x: number; y: number; w: number; h: number };
  cloud: Pt;
  boundary: { x: number; y: number; w: number; h: number };
  boundaryLabel: Pt;
  nodes: { docs: Pt; index: Pt; model: Pt; servers: Pt };
  labels: { text: string; at: Pt }[];
  /** Widest a node label may be before its lettering shrinks. */
  labelMax: number;
  /** Closed loop the packets travel inside the network. */
  loop: Pt[];
  /** Places packets try to leave from. */
  exits: Pt[];
}

export function layoutFor(kind: 'wide' | 'tall', t: Labels = defaultLabels): Layout {
  if (kind === 'wide') {
    const docs = { x: 545, y: 215 };
    const index = { x: 800, y: 215 };
    const model = { x: 1050, y: 215 };
    const servers = { x: 800, y: 405 };
    return {
      kind,
      w: 1200,
      h: 520,
      panels: 4,
      gap: { from: 336, to: 392 },
      outside: { x: 12, y: 12, w: 324, h: 496 },
      cloud: { x: 174, y: 230 },
      boundary: { x: 430, y: 74, w: 738, h: 418 },
      boundaryLabel: { x: 452, y: 58 },
      nodes: { docs, index, model, servers },
      labels: [
        { text: t.docs, at: { x: docs.x, y: 128 } },
        { text: t.index, at: { x: index.x, y: 128 } },
        { text: t.model, at: { x: model.x, y: 128 } },
        { text: t.servers, at: { x: servers.x, y: 474 } },
        { text: t.internet, at: { x: 174, y: 336 } },
      ],
      labelMax: 230,
      loop: [docs, index, model, { x: model.x, y: servers.y }, servers, { x: docs.x, y: servers.y }],
      exits: [docs, { x: docs.x, y: servers.y }],
    };
  }
  const docs = { x: 170, y: 500 };
  const index = { x: 430, y: 500 };
  const model = { x: 430, y: 790 };
  const servers = { x: 170, y: 790 };
  return {
    kind,
    w: 600,
    h: 1000,
    panels: 4,
    gap: { from: 232, to: 288 },
    outside: { x: 12, y: 12, w: 576, h: 220 },
    cloud: { x: 300, y: 100 },
    boundary: { x: 28, y: 356, w: 544, h: 616 },
    boundaryLabel: { x: 46, y: 338 },
    nodes: { docs, index, model, servers },
    labels: [
      { text: t.docs, at: { x: docs.x, y: 414 } },
      { text: t.index, at: { x: index.x, y: 414 } },
      { text: t.servers, at: { x: servers.x, y: 880 } },
      { text: t.model, at: { x: model.x, y: 880 } },
      { text: t.internet, at: { x: 300, y: 196 } },
    ],
    labelMax: 240,
    loop: [docs, index, model, servers],
    exits: [docs, index],
  };
}

export interface Palette {
  ink: string;
  accent: string;
  page: string;
  field: string;
  fieldDeep: string;
}

// Small seeded random so the hand wobble is the same on every draw.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** A hand-inked straight line: slight bow and jitter, round caps. */
function inkLine(ctx: CanvasRenderingContext2D, a: Pt, b: Pt, r: () => number, wobble = 1.6) {
  const mx = (a.x + b.x) / 2 + (r() - 0.5) * wobble * 2;
  const my = (a.y + b.y) / 2 + (r() - 0.5) * wobble * 2;
  ctx.beginPath();
  ctx.moveTo(a.x + (r() - 0.5) * wobble, a.y + (r() - 0.5) * wobble);
  ctx.quadraticCurveTo(mx, my, b.x + (r() - 0.5) * wobble, b.y + (r() - 0.5) * wobble);
  ctx.stroke();
}

function inkRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: () => number, fill?: string) {
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
  }
  inkLine(ctx, { x, y }, { x: x + w, y }, r);
  inkLine(ctx, { x: x + w, y }, { x: x + w, y: y + h }, r);
  inkLine(ctx, { x: x + w, y: y + h }, { x, y: y + h }, r);
  inkLine(ctx, { x, y: y + h }, { x, y }, r);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, rad: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, rad);
}

function arrowHead(ctx: CanvasRenderingContext2D, at: Pt, dir: Pt, size = 13) {
  const len = Math.hypot(dir.x, dir.y) || 1;
  const ux = dir.x / len;
  const uy = dir.y / len;
  ctx.beginPath();
  ctx.moveTo(at.x - ux * size - uy * size * 0.7, at.y - uy * size + ux * size * 0.7);
  ctx.lineTo(at.x, at.y);
  ctx.lineTo(at.x - ux * size + uy * size * 0.7, at.y - uy * size - ux * size * 0.7);
  ctx.stroke();
}

/** Largest font size (down to 40% of `size`) at which `text` fits in `max`. */
function fitFont(ctx: CanvasRenderingContext2D, text: string, size: number, max: number, family: string) {
  let s = size;
  ctx.font = `${s}px ${family}`;
  while (s > size * 0.4 && ctx.measureText(text).width > max) {
    s -= 1;
    ctx.font = `${s}px ${family}`;
  }
  return s;
}

const HAND = '"Patrick Hand", "Comic Sans MS", cursive';
const LETTER = '"Bowlby One", "Arial Black", sans-serif';

function handText(ctx: CanvasRenderingContext2D, text: string, at: Pt, size: number, c: Palette, align: CanvasTextAlign = 'center', max = Infinity) {
  ctx.save();
  fitFont(ctx, text, size, max, HAND);
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = c.page;
  ctx.lineWidth = 9;
  ctx.strokeText(text, at.x, at.y);
  ctx.fillStyle = c.ink;
  ctx.fillText(text, at.x, at.y);
  ctx.restore();
}

function cloud(ctx: CanvasRenderingContext2D, at: Pt, s: number, c: Palette) {
  // The same cloud silhouette as the site's AirGap drawing, scaled up.
  ctx.save();
  ctx.translate(at.x, at.y);
  ctx.scale(s, s);
  ctx.translate(-72, -66);
  const p = new Path2D('M40 92c-18 0-26-22-8-30 0-22 30-28 40-12 12-16 42-10 40 12 18 4 14 30-4 30z');
  ctx.fillStyle = c.page;
  ctx.fill(p);
  ctx.lineWidth = 4.5 / s;
  ctx.strokeStyle = c.ink;
  ctx.stroke(p);
  // little signal arcs: the internet, always talking
  ctx.lineWidth = 3.5 / s;
  ctx.beginPath();
  ctx.arc(72, 70, 9, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(72, 70, 16, Math.PI * 1.2, Math.PI * 1.8);
  ctx.stroke();
  ctx.fillStyle = c.ink;
  ctx.beginPath();
  ctx.arc(72, 72, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function docsIcon(ctx: CanvasRenderingContext2D, at: Pt, r: () => number, c: Palette) {
  for (let k = 2; k >= 0; k--) {
    const x = at.x - 34 + k * 9;
    const y = at.y - 46 + k * -7;
    inkRect(ctx, x, y + 14, 62, 78, r, c.page);
  }
  const x = at.x - 34;
  const y = at.y - 32;
  ctx.lineWidth = 3;
  for (let i = 0; i < 4; i++) {
    inkLine(ctx, { x: x + 10, y: y + 16 + i * 13 }, { x: x + (i === 3 ? 36 : 50), y: y + 16 + i * 13 }, r, 1);
  }
  ctx.lineWidth = 4;
}

function indexIcon(ctx: CanvasRenderingContext2D, at: Pt, r: () => number, c: Palette) {
  ctx.beginPath();
  ctx.arc(at.x, at.y, 46, 0, Math.PI * 2);
  ctx.fillStyle = c.page;
  ctx.fill();
  ctx.stroke();
  // a card drawer of vectors: little rows of dots
  ctx.fillStyle = c.ink;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 5; col++) {
      const big = (row * 5 + col) % 4 === 1;
      ctx.beginPath();
      ctx.arc(at.x - 24 + col * 12, at.y - 14 + row * 14, big ? 4 : 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  void r;
}

function modelIcon(ctx: CanvasRenderingContext2D, at: Pt, r: () => number, c: Palette) {
  roundRect(ctx, at.x - 58, at.y - 40, 116, 80, 34);
  ctx.fillStyle = c.page;
  ctx.fill();
  ctx.stroke();
  // three layers of neurons, wired together
  const cols = [-30, 0, 30];
  const rows = [[-14, 14], [-20, 0, 20], [-8, 8]];
  ctx.lineWidth = 2;
  for (let i = 0; i < 2; i++) {
    for (const a of rows[i]) for (const b of rows[i + 1]) inkLine(ctx, { x: at.x + cols[i], y: at.y + a }, { x: at.x + cols[i + 1], y: at.y + b }, r, 0.6);
  }
  ctx.lineWidth = 4;
  cols.forEach((cx, i) =>
    rows[i].forEach((cy) => {
      ctx.beginPath();
      ctx.arc(at.x + cx, at.y + cy, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = i === 1 ? c.accent : c.page;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.lineWidth = 4;
    }),
  );
}

function serversIcon(ctx: CanvasRenderingContext2D, at: Pt, r: () => number, c: Palette) {
  const w = 132;
  const h = 26;
  for (let i = 0; i < 2; i++) {
    const x = at.x - w / 2 + (i ? 6 : 0);
    const y = at.y - h - 2 + i * (h + 4);
    inkRect(ctx, x, y, w - (i ? 12 : 0), h, r, c.page);
    ctx.lineWidth = 3;
    for (let k = 0; k < 4; k++) inkLine(ctx, { x: x + 54 + k * 9, y: y + 6 }, { x: x + 54 + k * 9, y: y + h - 6 }, r, 0.6);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x + 16, y + h / 2, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = c.accent;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.lineWidth = 4;
  }
  inkLine(ctx, { x: at.x - w / 2 - 10, y: at.y + h + 6 }, { x: at.x + w / 2 + 10, y: at.y + h + 6 }, r);
}

/** Paint the whole diagram into `canvas` at `scale` pixels per logical unit. */
export function drawDiagram(canvas: HTMLCanvasElement, L: Layout, c: Palette, scale: number, t: Labels = defaultLabels) {
  canvas.width = Math.round(L.w * scale);
  canvas.height = Math.round(L.h * scale);
  const ctx = canvas.getContext('2d')!;
  const r = rng(L.kind === 'wide' ? 7 : 11);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.fillStyle = c.page;
  ctx.fillRect(0, 0, L.w, L.h);

  // Outside: a halftone screen, the busy grey world.
  const o = L.outside;
  ctx.save();
  ctx.beginPath();
  ctx.rect(o.x, o.y, o.w, o.h);
  ctx.clip();
  ctx.fillStyle = c.fieldDeep;
  const step = 11;
  for (let y = o.y; y < o.y + o.h + step; y += step) {
    const odd = Math.round((y - o.y) / step) % 2;
    for (let x = o.x + (odd ? step / 2 : 0); x < o.x + o.w + step; x += step) {
      ctx.beginPath();
      ctx.arc(x, y, 2.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  ctx.strokeStyle = c.ink;
  ctx.lineWidth = 4;
  cloud(ctx, L.cloud, L.kind === 'wide' ? 1.9 : 1.55, c);

  // The track packets ride, with arrowheads midway along each leg.
  const n = L.nodes;
  ctx.lineWidth = 3.5;
  for (let i = 0; i < L.loop.length; i++) {
    const a = L.loop[i];
    const b = L.loop[(i + 1) % L.loop.length];
    inkLine(ctx, a, b, r, 1.2);
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    if (Math.hypot(b.x - a.x, b.y - a.y) > 120) arrowHead(ctx, mid, { x: b.x - a.x, y: b.y - a.y });
  }

  // Network boundary.
  ctx.lineWidth = 4.5;
  const B = L.boundary;
  roundRect(ctx, B.x, B.y, B.w, B.h, 22);
  ctx.stroke();
  handText(ctx, t.boundary, L.boundaryLabel, L.kind === 'wide' ? 30 : 27, c, 'left', B.w - 40);

  ctx.lineWidth = 4;
  docsIcon(ctx, n.docs, r, c);
  indexIcon(ctx, n.index, r, c);
  modelIcon(ctx, n.model, r, c);
  serversIcon(ctx, n.servers, r, c);

  for (const l of L.labels) handText(ctx, l.text, l.at, 28, c, 'center', l.text === t.internet ? L.outside.w - 30 : L.labelMax);

  // The air gap: two heavy ink rules with lettering between them.
  ctx.lineWidth = 10;
  const g = L.gap;
  if (L.kind === 'wide') {
    inkLine(ctx, { x: g.from, y: 10 }, { x: g.from, y: L.h - 10 }, r, 2);
    inkLine(ctx, { x: g.to, y: 10 }, { x: g.to, y: L.h - 10 }, r, 2);
  } else {
    inkLine(ctx, { x: 10, y: g.from }, { x: L.w - 10, y: g.from }, r, 2);
    inkLine(ctx, { x: 10, y: g.to }, { x: L.w - 10, y: g.to }, r, 2);
  }
  ctx.save();
  const mid = (g.from + g.to) / 2;
  if (L.kind === 'wide') {
    ctx.translate(mid, L.h / 2);
    ctx.rotate(-Math.PI / 2);
  } else {
    ctx.translate(L.w / 2, mid);
  }
  const label = t.gap;
  fitFont(ctx, label, 34, (L.kind === 'wide' ? L.h : L.w) - 60, LETTER);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 7;
  ctx.strokeStyle = c.ink;
  ctx.strokeText(label, 0, 2);
  ctx.fillStyle = c.accent;
  ctx.fillText(label, 0, 2);
  ctx.restore();

  // Paper edge.
  ctx.strokeStyle = c.ink;
  ctx.lineWidth = 6;
  inkRect(ctx, 6, 6, L.w - 12, L.h - 12, r);
}

/** A comic burst with a sound effect in it, for the THUNK sprites. */
export function drawBurst(canvas: HTMLCanvasElement, word: string, c: Palette, seed: number) {
  const W = 560;
  const H = 340;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const r = rng(seed);
  ctx.clearRect(0, 0, W, H);
  ctx.translate(W / 2, H / 2);
  const spikes = 13;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const a = (i / (spikes * 2)) * Math.PI * 2;
    const outer = i % 2 === 0;
    const rx = (outer ? 262 : 190) * (outer ? 0.9 + r() * 0.12 : 1);
    const ry = (outer ? 160 : 112) * (outer ? 0.9 + r() * 0.12 : 1);
    const x = Math.cos(a) * rx;
    const y = Math.sin(a) * ry;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = c.page;
  ctx.fill();
  ctx.lineJoin = 'round';
  ctx.lineWidth = 11;
  ctx.strokeStyle = c.ink;
  ctx.stroke();
  ctx.rotate(-0.06);
  fitFont(ctx, word, 96, 400, LETTER);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 18;
  ctx.strokeText(word, 0, 6);
  ctx.fillStyle = c.accent;
  ctx.fillText(word, 0, 6);
}

/** A marigold data packet: a little sealed envelope. */
export function drawPacket(canvas: HTMLCanvasElement, c: Palette) {
  const S = 96;
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, S, S);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.roundRect(12, 22, 72, 52, 8);
  ctx.fillStyle = c.accent;
  ctx.fill();
  ctx.lineWidth = 7;
  ctx.strokeStyle = c.ink;
  ctx.stroke();
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(16, 28);
  ctx.lineTo(48, 52);
  ctx.lineTo(80, 28);
  ctx.stroke();
}
