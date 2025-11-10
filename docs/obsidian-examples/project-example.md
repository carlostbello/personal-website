---
title: "Personal Portfolio Website"
slug: "personal-portfolio-website"
description: "A modern portfolio website built with Next.js 16 and Supabase"
long_description: "This project showcases a complete personal website with blog, project portfolio, and contact form. Built with the latest web technologies for optimal performance and user experience."
category: "web"
tech:
  - Next.js 16
  - TypeScript
  - Supabase
  - Tailwind CSS
  - Vercel
github_url: "https://github.com/carlostbello/personal-website"
website_url: "https://carlosbello.dev"
featured: true
published: true
image: "portfolio-screenshot.png"
---

# Personal Portfolio Website

A modern, performant personal website showcasing projects, blog posts, and professional experience.

## Overview

This project demonstrates full-stack web development skills using cutting-edge technologies. The site features:

- **Fast Performance**: Built with Next.js 16 App Router for optimal loading speeds
- **Dynamic Content**: Blog posts and projects managed through Supabase
- **Obsidian Integration**: Content synced directly from Obsidian vault
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Type Safety**: Full TypeScript coverage for reliability

## Technical Architecture

```
┌─────────────┐
│   Next.js   │ (Frontend + SSR)
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  Supabase   │ (Database + Storage)
└──────┬──────┘
       │
       ↓
┌─────────────┐
│   Vercel    │ (Hosting)
└─────────────┘
```

## Key Features

### 1. Content Management

Content is written in Obsidian and automatically synced to the database:

- Markdown files with frontmatter
- Image uploads to Supabase Storage
- Version control with Git
- Automated deployment pipeline

### 2. Performance Optimizations

- Server Components for reduced JavaScript
- Image optimization with next/image
- Route-based code splitting
- Streaming with Suspense boundaries

### 3. Developer Experience

- TypeScript for type safety
- ESLint and Prettier for code quality
- Automated testing pipeline
- Infrastructure as Code (IaC)

## Screenshots

![Homepage](./images/homepage.png)
*The hero section with animated terminal effect*

![Blog](./images/blog.png)
*Blog listing with tag filtering*

![Projects](./images/projects.png)
*Project showcase with category filters*

## Lessons Learned

Building this project taught me:

1. **Supabase Integration**: How to effectively use Supabase for both data and storage
2. **Next.js 16**: Leveraging the latest App Router patterns
3. **CI/CD**: Setting up automated workflows with GitHub Actions
4. **Infrastructure as Code**: Managing database schema with migrations

## Future Improvements

- [ ] Add search functionality for blog posts
- [ ] Implement view count tracking
- [ ] Add comment system
- [ ] Create admin dashboard for content management
- [ ] Add analytics integration

## Links

- **Live Site**: [carlosbello.dev](https://carlosbello.dev)
- **GitHub**: [View Source Code](https://github.com/carlostbello/personal-website)

---

**Tech Stack**: Next.js 16, TypeScript, Supabase, Tailwind CSS, Vercel
