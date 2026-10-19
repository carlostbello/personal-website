# carlostbello.com

Astro, static output, served from Cloudflare Workers Static Assets.

```sh
npm install
npm run dev          # http://localhost:4321
npm run build        # type-check + build to dist/
npm run preview      # serve dist/ through wrangler, like production
npm run lint:copy    # flag AI-sounding copy and TK placeholders
npm run deploy       # strict copy lint, build, wrangler deploy
```

## Writing

- **Log post**: add `src/content/log/<slug>.md` (or `.mdx`) with `title`, `description`, `date`. Set `draft: true` to keep it off the site. Push to publish.
- **Project**: add `src/content/projects/<slug>.md`. `size: wide | tall | regular` sets its panel size; `order` sets position.
- **Talk**: add an entry to `src/content/talks.json`.
- **Homepage copy** lives in `src/lib/copy.ts`.

Read `DESIGN.md` before changing anything visual.
