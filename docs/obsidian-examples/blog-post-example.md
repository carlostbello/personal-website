---
title: "Getting Started with Next.js 16"
slug: "getting-started-nextjs-16"
excerpt: "Learn the fundamentals of Next.js 16 and build your first application"
published: true
published_at: "2024-01-15T10:00:00Z"
author: "Carlos Bello"
tags:
  - nextjs
  - typescript
  - tutorial
---

# Getting Started with Next.js 16

Next.js 16 brings exciting new features and improvements to the framework. In this post, we'll explore the key changes and build a simple application.

## What's New in Next.js 16

The latest version includes:

- **Improved Performance**: Faster page loads with optimized bundling
- **Better Developer Experience**: Enhanced error messages and debugging tools
- **Server Components**: More powerful server-side rendering capabilities

## Building Your First App

Let's start by creating a new Next.js project:

```bash
npx create-next-app@latest my-app
cd my-app
npm run dev
```

### Project Structure

Your new project will have this structure:

```
my-app/
├── app/
│   ├── layout.tsx
│   └── page.tsx
├── public/
└── package.json
```

## Creating Your First Component

Here's a simple component example:

```typescript
export default function Hero() {
  return (
    <div className="hero">
      <h1>Welcome to Next.js 16!</h1>
      <p>Build amazing web applications</p>
    </div>
  )
}
```

## Adding Images

You can reference images in your markdown like this:

![Next.js Logo](./images/nextjs-logo.png)

The sync script will upload this image to Supabase Storage and replace the path with the public URL.

## Conclusion

Next.js 16 makes it easier than ever to build fast, modern web applications. Start exploring today!

---

**Related Posts:**
- Advanced Next.js Patterns
- Server Components Deep Dive
