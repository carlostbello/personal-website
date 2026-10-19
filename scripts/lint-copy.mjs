#!/usr/bin/env node
// Flags copy patterns that read as machine-written, plus leftover TK
// placeholders. These are prompts to reread a sentence, not hard rules.
// Usage: npm run lint:copy [-- --strict]   (--strict exits 1 on any hit)

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOTS = ['src/content', 'src/lib/copy.ts', 'src/pages', 'src/components'];
const EXT = /\.(md|mdx|astro|ts|json)$/;

const rules = [
  ['placeholder', /\bTK\b/g],
  ['ai-vocab', /\b(delve|tapestry|leverag(e|ing)|seamless(ly)?|elevate|robust|testament|realm|landscape|navigat(e|ing) the|unlock|harness|embark|pivotal|crucial|transformative|cutting-edge|game-?changer|synerg\w*)\b/gi],
  ['stock-phrase', /(in today's fast-paced|crafting digital experiences|turning ideas into reality|passionate about|plays? a (crucial|pivotal|vital) role|stands as a testament|let's dive in|here's the thing|in conclusion|at the intersection of|coffee into code|pixel-perfect)/gi],
  ['not-x-but-y', /\bnot (just|only|merely)\b[^.!?\n]{0,80}\bbut\b/gi],
  ['its-not-x', /\b(it'?s|this is|that'?s) not\b[^.!?\n]{0,60}[.;,—-]\s*(it'?s|this is|that'?s)\b/gi],
  ['opener', /^\s*(here'?s the thing|let'?s dive in|in conclusion|imagine a world)/gim],
  ['emoji-wave', /👋|✨|🚀/g],
];

function* walk(path) {
  const s = statSync(path, { throwIfNoEntry: false });
  if (!s) return;
  if (s.isFile()) {
    if (EXT.test(path)) yield path;
    return;
  }
  for (const name of readdirSync(path)) yield* walk(join(path, name));
}

const strict = process.argv.includes('--strict');
const counts = {};
let total = 0;

for (const root of ROOTS) {
  for (const file of walk(root)) {
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      for (const [name, re] of rules) {
        re.lastIndex = 0;
        for (const m of line.matchAll(re)) {
          total++;
          counts[name] = (counts[name] ?? 0) + 1;
          if (name !== 'placeholder' || strict) {
            console.log(`${relative('.', file)}:${i + 1}  [${name}]  ${m[0]}`);
          }
        }
      }
    });
    // Em dashes: fine in moderation, suspicious in bulk.
    const dashes = lines.join('\n').match(/—/g)?.length ?? 0;
    if (dashes > 3) {
      total++;
      counts['em-dash-density'] = (counts['em-dash-density'] ?? 0) + 1;
      console.log(`${relative('.', file)}  [em-dash-density]  ${dashes} em dashes`);
    }
  }
}

const summary = Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(', ') || 'clean';
console.log(`\ncopy lint: ${summary}`);
if (strict && total > 0) process.exit(1);
