import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

const log = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/log' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    blurb: z.string(),
    year: z.number(),
    // Panel size on the projects page: the one you care about most gets "wide".
    size: z.enum(['wide', 'tall', 'regular']).default('regular'),
    order: z.number().default(99),
    links: z
      .array(z.object({ label: z.string(), href: z.string().url() }))
      .default([]),
  }),
});

const talks = defineCollection({
  loader: file('./src/content/talks.json'),
  schema: z.object({
    title: z.string(),
    event: z.string(),
    date: z.coerce.date(),
    city: z.string().optional(),
    slides: z.string().url().optional(),
    video: z.string().url().optional(),
  }),
});

export const collections = { log, projects, talks };
