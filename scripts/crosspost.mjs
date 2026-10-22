#!/usr/bin/env node
// npm run crosspost -- <slug>
// Writes syndication copies of a log post to syndicate/<slug>/:
//   devto.md     paste into DEV (canonical_url points back here)
//   hashnode.md  paste into Hashnode, then set "Originally published at"
//   share.txt    short text for LinkedIn posts and Substack Notes
// The full post always lives on carlostbello.com; copies credit it as
// the original so search engines rank this site, not the mirror.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const SITE = 'https://carlostbello.com';
const slug = process.argv[2];
if (!slug) {
  console.error('Usage: npm run crosspost -- <slug>');
  process.exit(1);
}
const file = ['md', 'mdx'].map((ext) => `src/content/log/${slug}.${ext}`).find(existsSync);
if (!file) {
  console.error(`No post found for "${slug}" in src/content/log`);
  process.exit(1);
}

const raw = readFileSync(file, 'utf8');
const [, fm = '', body = ''] = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/) ?? [];
const meta = Object.fromEntries(
  fm
    .split('\n')
    .map((l) => l.match(/^(\w+):\s*(.*)$/))
    .filter(Boolean)
    .map(([, k, v]) => [k, v.replace(/^["']|["']$/g, '')]),
);
if (meta.draft === 'true') console.warn('Note: this post is still a draft.');

const url = `${SITE}/log/${slug}`;
const tags = (meta.tags ?? '')
  .replace(/[[\]]/g, '')
  .split(',')
  .map((t) => t.trim().toLowerCase().replace(/[^a-z0-9]/g, ''))
  .filter(Boolean);

// MDX → plain markdown: drop imports and comments, turn components into quotes.
const markdown = body
  .replace(/^import .*$/gm, '')
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
  .replace(/<Callout(?:\s+label="([^"]*)")?\s*>([\s\S]*?)<\/Callout>/g, (_, label = 'Note', text) => `> **${label}:** ${text.trim()}`)
  .replace(/<Say>([\s\S]*?)<\/Say>/g, (_, text) => `> ${text.trim()}`)
  .replace(/<Figure[\s\S]*?\/>/g, `_(Image: see the original post at ${url})_`)
  .replace(/\]\(\/(?!\/)/g, `](${SITE}/`)
  .replace(/\n{3,}/g, '\n\n')
  .trim();

const footer = `\n\n---\n\n_Originally published at [carlostbello.com](${url})._\n`;
const dir = `syndicate/${slug}`;
mkdirSync(dir, { recursive: true });

writeFileSync(
  `${dir}/devto.md`,
  `---
title: ${JSON.stringify(meta.title)}
published: false
description: ${JSON.stringify(meta.description ?? '')}
tags: ${tags.slice(0, 4).join(', ')}
canonical_url: ${url}
---

${markdown}${footer}`,
);
writeFileSync(`${dir}/hashnode.md`, `# ${meta.title}\n\n${markdown}${footer}`);
writeFileSync(
  `${dir}/share.txt`,
  `${meta.title}

${meta.description ?? ''}

${url}
`,
);

console.log(`Wrote ${dir}/devto.md, hashnode.md, share.txt
- DEV: new post > paste devto.md (canonical_url is already set).
- Hashnode: paste hashnode.md, then set "Originally published at" to ${url}
- LinkedIn / Substack Notes: start from share.txt, add a line on why it matters to that audience.`);
