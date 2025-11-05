---
name: create-nextjs-page
description: Create a new Next.js app router page with proper structure (project, gitignored)
---

Create a new Next.js page following the App Router conventions and project standards.

## Steps

1. **Ask for page details**:
   - What is the route path? (e.g., `/about`, `/blog/[slug]`, `/projects`)
   - What route group should it be in? (marketing), (blog), (portfolio), or none?
   - Does it need dynamic segments?
   - Should it be a Server or Client Component?

2. **Create the page structure**:
   - Create `page.tsx` with proper TypeScript types
   - Add `loading.tsx` for loading state
   - Add `error.tsx` for error handling
   - Create `layout.tsx` if it needs a specific layout
   - Export metadata for SEO

3. **Implement the page** following these patterns:

```tsx
// Example: src/app/(marketing)/about/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About | Your Name',
  description: 'Learn more about...',
  openGraph: {
    title: 'About | Your Name',
    description: 'Learn more about...',
    url: 'https://yourdomain.com/about',
    siteName: 'Your Name',
    type: 'website',
  },
}

export default function AboutPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">About</h1>
      {/* Content */}
    </main>
  )
}
```

```tsx
// Example: src/app/(marketing)/about/loading.tsx
export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    </div>
  )
}
```

```tsx
// Example: src/app/(marketing)/about/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Try again
      </button>
    </div>
  )
}
```

4. **For dynamic routes**, add proper TypeScript types:

```tsx
// Example: src/app/(blog)/blog/[slug]/page.tsx
import { Metadata } from 'next'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return {
    title: `${slug} | Blog`,
  }
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params

  return (
    <article className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">{slug}</h1>
      {/* Content */}
    </article>
  )
}
```

5. **Add to navigation** (if applicable):
   - Update header navigation in `src/components/custom/Header.tsx`
   - Add link to footer if needed

6. **Test the new page**:
   - Run `npm run dev`
   - Visit the new route
   - Check loading state works
   - Test error boundary (simulate error)
   - Verify metadata appears correctly
   - Check mobile responsiveness
   - Test accessibility (keyboard navigation)

7. **Run quality checks**:
   ```bash
   npm run lint
   npm run type-check
   npm run format
   ```

## Checklist

Before completing:
- [ ] Page created in correct directory
- [ ] Proper TypeScript types
- [ ] Metadata export included
- [ ] Loading state implemented
- [ ] Error boundary implemented
- [ ] Mobile responsive
- [ ] Accessibility considered
- [ ] Navigation updated (if needed)
- [ ] Tested locally
- [ ] All checks pass

## Notes

- Use Server Components by default
- Only add `'use client'` if interactivity needed
- Follow semantic HTML structure
- Add proper heading hierarchy (h1 → h6)
- Use Tailwind CSS for styling
- Consider SEO from the start
