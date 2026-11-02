// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://carlostbello.com',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [react(), mdx(), sitemap({ filter: (page) => !page.includes('/search') })],
  markdown: {
    shikiConfig: { theme: 'github-light' },
  },
});
