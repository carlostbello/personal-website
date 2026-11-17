// Build-time index for the balloon palette, read straight from the content
// collections. Server-only (uses astro:content); the client ranker lives in
// search.ts.
import { getCollection } from 'astro:content';
import { getPosts, dateFmt } from '../../lib/posts';
import type { Entry } from './search';

/** Pages listed first; `suggest` ones show when the box is empty. */
export const defaultPages: Entry[] = [
  { title: 'Home', sub: 'Back to the top of this page', href: '#top', terms: 'start top hello', suggest: true },
  { title: 'Projects', sub: 'Every project', href: '/projects', terms: 'work built things', suggest: true },
  { title: 'The log', sub: 'Every post', href: '/log', terms: 'blog posts writing notes', suggest: true },
  { title: 'Talks', sub: 'Conference talks', href: '/talks', terms: 'speaking stage slides video', suggest: true },
  { title: 'Search', sub: 'Full text, all posts', href: '/search', terms: 'find', suggest: false },
];

export async function buildIndex(pages: Entry[] = defaultPages): Promise<Entry[]> {
  const projects = (await getCollection('projects')).sort((a, b) => a.data.order - b.data.order);
  const posts = await getPosts();
  const talks = (await getCollection('talks')).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  return [
    ...pages,
    ...projects.map((p) => ({
      title: p.data.title,
      sub: `Project, ${p.data.year}`,
      href: `/projects/${p.id}`,
      terms: p.data.blurb,
      suggest: p.data.size === 'wide',
    })),
    ...posts.map((p) => ({
      title: p.data.title,
      sub: `Log, ${dateFmt.short.format(p.data.date)}`,
      href: `/log/${p.id}`,
      terms: `${p.data.description} ${p.data.tags.join(' ')}`,
    })),
    ...talks.map((t) => ({
      title: t.data.title,
      sub: `Talk, ${t.data.event}`,
      href: '/talks',
      terms: `${t.data.event} ${t.data.city ?? ''}`,
    })),
  ];
}
