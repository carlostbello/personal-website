-- Replace sample project data with real projects
-- This migration removes placeholder data and adds the actual Personal Website project

-- First, clear existing sample data
DELETE FROM project_tags;
DELETE FROM projects;

-- Insert real project: Personal Website
INSERT INTO projects (
  title,
  slug,
  description,
  long_description,
  image_url,
  github_url,
  demo_url,
  website_url,
  featured,
  published,
  category
) VALUES (
  'Personal Website',
  'personal-website',
  'Multi-purpose personal website featuring portfolio showcase, SEO-optimized blog, and contact form with email integration.',
  E'A modern personal website built from scratch using Next.js 16 with App Router, TypeScript, and Tailwind CSS v4. Features include:\n\n• **Portfolio Showcase**: Dynamic project display with Supabase backend\n• **Blog System**: MDX-powered blog with syntax highlighting and SEO optimization\n• **Contact Form**: Integrated with Resend for reliable email delivery\n• **Modern Stack**: Server Components, streaming SSR, and edge-ready architecture\n• **Infrastructure as Code**: Database migrations, CI/CD with GitHub Actions, and Vercel deployment\n\nThis project demonstrates full-stack development capabilities from database design to production deployment.',
  NULL,
  'https://github.com/carlostbello/personal-website',
  'https://carlostbello.com',
  'https://carlostbello.com',
  true,
  true,
  'web'
);

-- Ensure we have the necessary tags
INSERT INTO tags (name, slug) VALUES
  ('Next.js', 'nextjs'),
  ('TypeScript', 'typescript'),
  ('Tailwind CSS', 'tailwindcss'),
  ('Supabase', 'supabase'),
  ('Vercel', 'vercel'),
  ('React', 'react'),
  ('MDX', 'mdx')
ON CONFLICT (slug) DO NOTHING;

-- Link tags to the Personal Website project
INSERT INTO project_tags (project_id, tag_id)
SELECT p.id, t.id
FROM projects p, tags t
WHERE p.slug = 'personal-website'
  AND t.slug IN ('nextjs', 'typescript', 'tailwindcss', 'supabase', 'vercel', 'react');
