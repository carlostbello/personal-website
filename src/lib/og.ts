// Build-time Open Graph cards: a comic panel with the page title in
// lettering and the avatar standing on the ink floor.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const root = process.cwd();
const font = (pkg: string, file: string) =>
  readFileSync(resolve(root, 'node_modules/@fontsource', pkg, 'files', file));

const fonts = [
  { name: 'Bowlby One', data: font('bowlby-one', 'bowlby-one-latin-400-normal.woff'), weight: 400 as const },
  { name: 'Patrick Hand', data: font('patrick-hand', 'patrick-hand-latin-400-normal.woff'), weight: 400 as const },
];
const avatar = `data:image/png;base64,${readFileSync(resolve(root, 'src/assets/avatar.png')).toString('base64')}`;

const INK = '#0b0b0c';
const ACCENT = '#f3b53f';
const FIELD = '#3b5a8c';

type Node = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, children?: unknown, extra: Record<string, unknown> = {}): Node => ({
  type,
  props: { style, children, ...extra },
});

// Satori has no text-stroke, so the ink outline is eight hard shadows.
const outline = (w: number) =>
  [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]
    .map(([x, y]) => `${x * w}px ${y * w}px 0 ${INK}`)
    .join(', ');

export async function renderOg({ title, kicker }: { title: string; kicker?: string }) {
  const size = title.length <= 18 ? 120 : title.length <= 36 ? 92 : 68;
  const tree = h(
    'div',
    { width: 1200, height: 630, display: 'flex', position: 'relative', background: FIELD, fontFamily: 'Patrick Hand' },
    [
      h('div', { position: 'absolute', top: 44, left: 64, fontSize: 36, color: '#fff' }, 'carlostbello.com'),
      h(
        'div',
        { position: 'absolute', top: 120, left: 64, width: 760, display: 'flex', flexDirection: 'column', gap: 18 },
        [
          kicker
            ? h(
                'div',
                { display: 'flex', alignSelf: 'flex-start', background: ACCENT, color: INK, border: `5px solid ${INK}`, padding: '4px 16px', fontSize: 34 },
                kicker,
              )
            : null,
          h(
            'div',
            { fontFamily: 'Bowlby One', fontSize: size, lineHeight: 1.02, color: ACCENT, textShadow: outline(Math.round(size / 18)) },
            title,
          ),
        ].filter(Boolean),
      ),
      h('img', { position: 'absolute', right: 40, bottom: 34, width: 400, height: 400 }, undefined, { src: avatar }),
      h('div', { position: 'absolute', left: 0, right: 0, bottom: 30, height: 7, background: INK }),
    ],
  );

  const svg = await satori(tree as never, { width: 1200, height: 630, fonts });
  return new Resvg(svg).render().asPng();
}
