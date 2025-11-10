# Obsidian Integration Documentation

## Overview

This document outlines the planned integration between your self-hosted Obsidian vault and the website's blog/projects system. The integration will allow you to write content in Obsidian and automatically publish it to your website.

## Architecture

```
┌─────────────────┐
│  Obsidian Vault │ (Self-hosted in Homelab)
│   (Markdown)    │
└────────┬────────┘
         │ Git Sync (Obsidian Git Plugin)
         ↓
┌─────────────────┐
│  GitHub Repo    │ (Private content repo or webhook)
│  (Optional)     │
└────────┬────────┘
         │ Webhook / GitHub Action
         ↓
┌─────────────────┐
│  Parser Script  │ (Extracts frontmatter + content)
│  (Node.js/Deno) │
└────────┬────────┘
         │ API Call
         ↓
┌─────────────────┐
│    Supabase     │ (Database + Storage)
│   PostgreSQL    │
└────────┬────────┘
         │ Query
         ↓
┌─────────────────┐
│  Next.js Site   │ (Public website)
│   (Vercel)      │
└─────────────────┘
```

## Obsidian File Format

### Blog Post Example

```markdown
---
title: "My First Blog Post"
slug: "my-first-blog-post"
excerpt: "A brief introduction to this post"
published: true
published_at: "2024-01-15T10:00:00Z"
author: "Carlos Bello"
tags:
  - typescript
  - nextjs
  - tutorial
---

# My First Blog Post

Your markdown content here...

## Section 1

Content with **bold** and *italic* text.

\`\`\`typescript
// Code blocks are supported
const hello = "world"
\`\`\`
```

### Project Example

```markdown
---
title: "E-Commerce Platform"
slug: "e-commerce-platform"
description: "A full-stack e-commerce solution"
long_description: "Detailed description here..."
category: "web"
tech:
  - Next.js
  - TypeScript
  - PostgreSQL
  - Stripe
github_url: "https://github.com/username/repo"
demo_url: "https://demo.example.com"
website_url: "https://example.com"
featured: true
published: true
image: "project-image.jpg"
---

# E-Commerce Platform

Project documentation in markdown format...
```

## Database Schema Compatibility

### Blog Posts Table

The `blog_posts` table is designed to work seamlessly with Obsidian:

```sql
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,              -- From frontmatter: title
  slug TEXT UNIQUE NOT NULL,        -- From frontmatter: slug
  content TEXT NOT NULL,            -- Full markdown/MDX content
  excerpt TEXT,                     -- From frontmatter: excerpt
  author TEXT,                      -- From frontmatter: author
  published BOOLEAN,                -- From frontmatter: published
  published_at TIMESTAMP,           -- From frontmatter: published_at
  source_path TEXT UNIQUE,          -- Path in Obsidian vault (e.g., "blog/my-post.md")
  last_synced_at TIMESTAMP,         -- Last sync timestamp
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Projects Table

The `projects` table supports project documentation from Obsidian:

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,              -- From frontmatter: title
  slug TEXT UNIQUE NOT NULL,        -- From frontmatter: slug
  description TEXT,                 -- From frontmatter: description
  long_description TEXT,            -- From frontmatter: long_description or markdown content
  image_url TEXT,                   -- URL after uploading image to Supabase Storage
  tech TEXT[] NOT NULL,             -- From frontmatter: tech (array)
  category TEXT,                    -- From frontmatter: category
  github_url TEXT,                  -- From frontmatter: github_url
  demo_url TEXT,                    -- From frontmatter: demo_url
  website_url TEXT,                 -- From frontmatter: website_url
  featured BOOLEAN,                 -- From frontmatter: featured
  published BOOLEAN,                -- From frontmatter: published
  source_path TEXT UNIQUE,          -- Path in Obsidian vault
  last_synced_at TIMESTAMP,         -- Last sync timestamp
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## Sync Workflow

### Option 1: GitHub Actions (Recommended)

1. **Obsidian Vault** → Git sync to private GitHub repo
2. **GitHub Action** triggers on push to main branch
3. **Parser script** reads changed files
4. **Script** extracts frontmatter and content
5. **Script** uploads images to Supabase Storage
6. **Script** upserts data to Supabase database using `source_path` as unique key

### Option 2: Webhook + Custom Server

1. **Obsidian Vault** → Git sync to private repo
2. **Webhook** triggers custom endpoint (Supabase Edge Function or Vercel API route)
3. **Function** fetches changed files from repo
4. **Function** parses and syncs to database

### Option 3: Direct API (No Git)

1. **Obsidian Plugin** → Direct API calls to Supabase
2. Custom Obsidian plugin watches for file changes
3. Plugin syncs directly to Supabase (requires authentication)

## Implementation Steps (Future Phase 14)

### 14.1 Homelab Obsidian Setup
- [ ] Install Obsidian in homelab
- [ ] Create vault structure:
  ```
  obsidian-vault/
  ├── blog/
  │   ├── my-first-post.md
  │   └── another-post.md
  ├── projects/
  │   ├── e-commerce.md
  │   └── task-manager.md
  └── images/
      ├── blog/
      └── projects/
  ```
- [ ] Install Obsidian Git plugin
- [ ] Configure Git sync to private repo

### 14.2 Parser Script Development
- [ ] Create Node.js/Deno script to:
  - [ ] Read markdown files
  - [ ] Parse frontmatter (using `gray-matter`)
  - [ ] Extract content
  - [ ] Validate required fields
  - [ ] Upload images to Supabase Storage
  - [ ] Upsert to Supabase database

### 14.3 GitHub Action Setup
- [ ] Create `.github/workflows/sync-obsidian.yml`
- [ ] Configure secrets (Supabase URL, Service Role Key)
- [ ] Test sync workflow
- [ ] Add error notifications

### 14.4 Image Handling
- [ ] Parse markdown for image references
- [ ] Upload images to appropriate bucket (blog-images/project-images)
- [ ] Replace local image paths with Supabase URLs in content
- [ ] Handle image updates (check if already exists)

## Sample Parser Script (Pseudocode)

```typescript
// scripts/sync-obsidian.ts

import matter from 'gray-matter'
import { createClient } from '@supabase/supabase-js'
import { readFile, readdir } from 'fs/promises'
import path from 'path'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Service role key for admin access
)

async function syncBlogPost(filePath: string) {
  const content = await readFile(filePath, 'utf-8')
  const { data: frontmatter, content: markdown } = matter(content)

  // Upload images if any
  const processedContent = await processImages(markdown, 'blog-images')

  // Upsert to database (using source_path as unique key)
  const { error } = await supabase
    .from('blog_posts')
    .upsert({
      title: frontmatter.title,
      slug: frontmatter.slug,
      content: processedContent,
      excerpt: frontmatter.excerpt,
      author: frontmatter.author || 'Carlos Bello',
      published: frontmatter.published || false,
      published_at: frontmatter.published_at,
      source_path: path.relative(process.cwd(), filePath),
      last_synced_at: new Date().toISOString(),
    }, {
      onConflict: 'source_path' // Update if exists
    })

  if (error) throw error
}

async function processImages(content: string, bucket: string): Promise<string> {
  // Find all image references: ![alt](path)
  // Upload to Supabase Storage
  // Replace paths with public URLs
  // Return updated content
}

async function syncProjects(filePath: string) {
  // Similar to syncBlogPost but for projects table
}

// Main sync function
async function main() {
  const blogFiles = await readdir('./obsidian-vault/blog')
  for (const file of blogFiles) {
    if (file.endsWith('.md')) {
      await syncBlogPost(path.join('./obsidian-vault/blog', file))
    }
  }

  const projectFiles = await readdir('./obsidian-vault/projects')
  for (const file of projectFiles) {
    if (file.endsWith('.md')) {
      await syncProjects(path.join('./obsidian-vault/projects', file))
    }
  }
}

main()
```

## Sample GitHub Action

```yaml
# .github/workflows/sync-obsidian.yml
name: Sync Obsidian to Supabase

on:
  push:
    branches:
      - main
    paths:
      - 'blog/**'
      - 'projects/**'

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install gray-matter @supabase/supabase-js

      - name: Sync to Supabase
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
        run: node scripts/sync-obsidian.js
```

## Security Considerations

1. **Service Role Key**: Store Supabase service role key in GitHub Secrets
2. **Private Repo**: Keep Obsidian vault in private repo
3. **Validation**: Validate all frontmatter fields before inserting
4. **RLS Bypass**: Service role key bypasses RLS - only use in trusted environments
5. **Image Sanitization**: Sanitize image filenames before uploading

## Testing Strategy

1. **Local Testing**: Test parser script with sample markdown files
2. **Staging Environment**: Test GitHub Action in staging first
3. **Dry Run Mode**: Add `--dry-run` flag to preview changes without syncing
4. **Rollback**: Keep old content in database until new sync succeeds

## Frontmatter Validation

Required fields for blog posts:
- `title` (string)
- `slug` (string, URL-friendly)
- `published` (boolean)

Optional fields:
- `excerpt` (string)
- `author` (string, defaults to "Carlos Bello")
- `published_at` (ISO 8601 timestamp)
- `tags` (array of strings)

Required fields for projects:
- `title` (string)
- `slug` (string, URL-friendly)
- `description` (string)
- `category` (enum: 'web' | 'mobile' | 'tool' | 'other')
- `tech` (array of strings)

## Migration Path

Since the database schema already has `source_path` and `last_synced_at` fields, you can start the integration anytime by:

1. Setting up Obsidian vault
2. Creating the parser script
3. Testing locally with a few files
4. Deploying GitHub Action when ready

The existing manually-created content will coexist with Obsidian-synced content. You can optionally add `source_path` to existing entries later if you want to manage them via Obsidian.

---

**Status**: Documentation complete. Schema is Obsidian-ready. Implementation pending Phase 14.
