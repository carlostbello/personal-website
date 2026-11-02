# carlostbello.com

Astro, fully static, served from Cloudflare Workers Static Assets. No
database, no server code. Read `DESIGN.md` before changing anything visual.

## Commands

```sh
npm install
npm run dev                  # http://localhost:4321, shows drafts and scheduled posts
npm run build                # type-check, build to dist/, build the search index
npm run preview              # serve dist/ through wrangler, exactly like production
npm run new -- "Post title"  # start a draft post
npm run crosspost -- <slug>  # DEV / Hashnode / LinkedIn copies of a post
npm run lint:copy            # flag AI-sounding copy and TK placeholders
npm run deploy               # strict copy lint + build + deploy (CI normally does this)
```

## Publishing a post

1. `npm run new -- "My post"` creates `src/content/log/my-post.md` as a draft.
2. Write it. Rename to `.mdx` to use components; `templates/post.mdx` shows them
   (`<Callout>`, `<Figure>`, `<Say>`). Put images next to the post and import them.
3. Set `draft: false`. To schedule, give it a future `date` instead; the daily
   deploy publishes it on that day.
4. Push to `main`. GitHub Actions lints, builds and deploys.

You can also write straight in GitHub's web editor or point an Obsidian vault
at `src/content/log/`. Anything that ends in a push works.

## Syndication (own site first)

Full posts only live here; everything else links back so search engines rank
this site.

- **RSS** at `/rss.xml`.
- **DEV / Hashnode**: `npm run crosspost -- <slug>` writes copies with the
  canonical URL set to this site.
- **LinkedIn / Substack Notes**: start from the generated `share.txt`. Post an
  excerpt and link, not the full text.
- **Newsletter**: set `newsletter.buttondown` in `src/lib/site.ts` to show the
  signup form. Buttondown can email new posts from the RSS feed automatically.

## Other content

- **Projects**: `src/content/projects/<slug>.md`. `size: wide | tall | regular`, `order` for position, `demo` for an animated Stageshow demo (see `DESIGN.md`).
- **Talks**: `src/content/talks.json`.
- **Homepage copy**: `src/lib/copy.ts`.
- **Site settings** (email, socials, analytics, newsletter, Substack): `src/lib/site.ts`.

## Deploy setup (one time)

1. Cloudflare: create an API token with the "Edit Cloudflare Workers" template.
2. GitHub repo secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
3. Push to `main`. The worker is named `carlostbello-com` (`wrangler.jsonc`).
4. In Cloudflare, add `carlostbello.com` as a custom domain on the worker.
5. Optional: enable Web Analytics and paste the token into `site.ts`.

Deploys stop while `TK` placeholders remain (`lint:copy --strict`). That is on
purpose.
