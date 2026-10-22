import rss from '@astrojs/rss';
import { getPosts } from '../lib/posts';
import type { APIContext } from 'astro';
import { site } from '../lib/site';

export async function GET(context: APIContext) {
  const posts = await getPosts();
  return rss({
    title: `${site.name} · Log`,
    description: site.description,
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/log/${post.id}`,
      categories: post.data.tags,
    })),
  });
}
