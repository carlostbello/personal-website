#!/usr/bin/env node
// npm run new -- "Post title"   → src/content/log/<slug>.md as a draft
import { existsSync, writeFileSync } from 'node:fs';

const title = process.argv.slice(2).join(' ').trim();
if (!title) {
  console.error('Usage: npm run new -- "Post title"');
  process.exit(1);
}
const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const file = `src/content/log/${slug}.md`;
if (existsSync(file)) {
  console.error(`${file} already exists`);
  process.exit(1);
}
const today = new Date().toISOString().slice(0, 10);
writeFileSync(
  file,
  `---
title: ${JSON.stringify(title)}
description: ""
date: ${today}
tags: []
draft: true
---

`,
);
console.log(`Created ${file}
- Write it, then set draft: false (or a future date to schedule it).
- Rename to .mdx if you want components (see templates/post.mdx).
- Preview: npm run dev, then open /log/${slug}`);
