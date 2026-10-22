import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'log'>;

/**
 * Published posts, newest first. In dev, drafts and future-dated posts
 * show up too so you can preview them. In production a future-dated post
 * stays hidden until a build runs on or after its date (the deploy
 * workflow rebuilds daily, which is what makes scheduling work).
 */
export async function getPosts(): Promise<Post[]> {
  const now = Date.now();
  const posts = await getCollection('log', ({ data }) =>
    import.meta.env.DEV ? true : !data.draft && data.date.valueOf() <= now,
  );
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function readingMinutes(post: Post) {
  return Math.max(1, Math.round((post.body ?? '').split(/\s+/).length / 230));
}

export function tagSlug(tag: string) {
  return tag.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export const dateFmt = {
  long: new Intl.DateTimeFormat('en', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }),
  short: new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }),
  monthDay: new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
  monthYear: new Intl.DateTimeFormat('en', { year: 'numeric', month: 'short', timeZone: 'UTC' }),
};
