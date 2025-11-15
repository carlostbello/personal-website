-- Seed data for initial projects
-- This file contains sample projects to populate the database
-- Note: source_path is NULL for manually created entries
-- When Obsidian integration is active, source_path will track the vault file

-- Insert sample projects
INSERT INTO projects (title, slug, description, long_description, tech, category, github_url, demo_url, featured, published, created_at, source_path)
VALUES
  (
    'E-Commerce Platform',
    'e-commerce-platform',
    'A full-stack e-commerce solution with real-time inventory management.',
    'Built a complete e-commerce platform from scratch with features including user authentication, product catalog, shopping cart, payment processing with Stripe, and admin dashboard for inventory management.',
    ARRAY['Next.js', 'TypeScript', 'PostgreSQL', 'Stripe', 'Tailwind CSS'],
    'web',
    'https://github.com/carlostbello',
    'https://example.com',
    true,
    true,
    '2024-01-15T00:00:00Z',
    NULL  -- Manually created, not from Obsidian
  ),
  (
    'Task Management App',
    'task-management-app',
    'A collaborative task management tool with real-time updates.',
    'Developed a task management application that allows teams to collaborate in real-time, assign tasks, set deadlines, and track progress with visual boards and analytics.',
    ARRAY['React', 'Node.js', 'Socket.io', 'MongoDB', 'Express'],
    'web',
    'https://github.com/carlostbello',
    NULL,
    true,
    true,
    '2023-11-20T00:00:00Z',
    NULL  -- Manually created, not from Obsidian
  ),
  (
    'CLI Developer Tool',
    'cli-developer-tool',
    'A command-line tool for automating common development workflows.',
    'Created a CLI tool that helps developers automate repetitive tasks, manage project templates, and streamline their development workflow with customizable scripts.',
    ARRAY['Node.js', 'TypeScript', 'Commander.js', 'Inquirer'],
    'tool',
    'https://github.com/carlostbello',
    NULL,
    false,
    true,
    '2023-09-10T00:00:00Z',
    NULL  -- Manually created, not from Obsidian
  );

-- Note: This seed data can be run with:
-- npx supabase db reset (resets database and runs all migrations + seed)
-- Or manually run this SQL in the Supabase SQL Editor
