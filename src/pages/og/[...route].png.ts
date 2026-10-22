import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { getPosts, tagSlug } from '../../lib/posts';
import { renderOg } from '../../lib/og';
import { site } from '../../lib/site';

type Card = { title: string; kicker?: string };

export const getStaticPaths = (async () => {
  const posts = await getPosts();
  const projects = await getCollection('projects');
  const tags = [...new Set(posts.flatMap((p) => p.data.tags))];

  const cards: Record<string, Card> = {
    index: { title: site.name },
    log: { title: 'The log', kicker: 'Writing' },
    projects: { title: 'Projects', kicker: 'Things I built' },
    talks: { title: 'Talks', kicker: 'On stage' },
    search: { title: 'Search', kicker: 'The log' },
  };
  for (const p of posts) cards[`log/${p.id}`] = { title: p.data.title, kicker: 'The log' };
  for (const p of projects) cards[`projects/${p.id}`] = { title: p.data.title, kicker: 'Project' };
  for (const t of tags) cards[`log/tags/${tagSlug(t)}`] = { title: `#${t}`, kicker: 'The log' };

  return Object.entries(cards).map(([route, card]) => ({ params: { route }, props: card }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOg(props as Card);
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
