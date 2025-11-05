# Project Guidelines - Personal Website

## Project Overview
Multi-purpose personal website featuring:
- Portfolio/project showcase
- SEO-optimized blog with native MDX
- Contact form
- Analytics integration

## Tech Stack
- **Framework**: Next.js 16+ with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Content**: MDX for blog posts
- **Hosting**: Vercel
- **CI/CD**: GitHub Actions
- **Package Manager**: npm

## Code Style & Conventions

### Component Guidelines
- **Default to Server Components**: Use Server Components unless interactivity is needed
- **Client Components**: Only add `'use client'` when necessary (forms, animations, browser APIs)
- **Composition over inheritance**: Build reusable, composable components
- **TypeScript**: All components must have proper type definitions
- **Naming**: Use PascalCase for components, camelCase for functions/variables
- **File organization**: One component per file, colocate related files

### Next.js Specific
- Use App Router patterns (not Pages Router)
- Implement proper loading.tsx and error.tsx boundaries
- Export metadata for SEO on all pages
- Use next/image for all images
- Implement proper route groups: (marketing), (blog), (portfolio)
- Use parallel routes and intercepting routes where appropriate
- Leverage streaming and suspense for better UX

### Styling
- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Use shadcn/ui components for consistent UI
- Create custom components in `components/custom/`
- Avoid inline styles unless absolutely necessary
- Use CSS variables for theming (defined in globals.css)

## File Structure
```
personal-website/
├── src/
│   ├── app/
│   │   ├── (marketing)/        # Marketing pages
│   │   │   ├── page.tsx
│   │   │   └── about/
│   │   ├── (blog)/             # Blog section
│   │   │   ├── blog/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx
│   │   ├── (portfolio)/        # Portfolio section
│   │   │   └── projects/
│   │   ├── api/                # API routes
│   │   │   └── contact/
│   │   ├── layout.tsx
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   ├── not-found.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   └── custom/             # Custom components
│   │       ├── Header.tsx
│   │       ├── Footer.tsx
│   │       └── ContactForm.tsx
│   ├── lib/
│   │   ├── utils.ts
│   │   ├── mdx.ts
│   │   └── validations.ts
│   └── content/
│       └── blog/               # MDX blog posts
├── public/
│   ├── images/
│   └── fonts/
├── .claude/                    # Claude Code config (gitignored)
├── .github/
│   └── workflows/
├── CLAUDE.md                   # This file (committed)
└── package.json
```

## Development Workflow

### Before Starting Work
1. Pull latest changes: `git pull origin main`
2. Create feature branch: `git checkout -b feature/your-feature`
3. Start dev server: `npm run dev`

### During Development
1. Follow TypeScript strict mode
2. Run linting: `npm run lint`
3. Format code: `npm run format`
4. Check types: `npm run type-check`
5. Write tests for new features
6. Test locally before pushing

### Before Committing
1. **REQUIRED**: Run all checks:
   ```bash
   npm run lint
   npm run type-check
   npm run format:check
   npm run build
   ```
2. All checks must pass before commit
3. Write descriptive commit messages following conventional commits:
   - `feat: add blog post listing page`
   - `fix: resolve mobile navigation bug`
   - `docs: update README`
   - `refactor: simplify contact form validation`

### Git Practices
- Create feature branches from `main`
- Keep commits atomic and focused
- Rebase on main before creating PR
- Squash commits if requested
- Delete branches after merge
- **Never commit**:
  - `.env` files
  - `node_modules/`
  - `.next/` build output
  - IDE-specific files
  - `.claude/settings.local.json`

## Testing Strategy

### Required Tests
- Unit tests for utility functions
- Integration tests for API routes
- Component tests for complex interactions
- E2E tests for critical user flows

### Testing Tools
- React Testing Library for components
- Vitest or Jest for unit tests
- Playwright for E2E tests (optional)

### Coverage Goals
- Aim for >80% overall coverage
- 100% coverage for utility functions
- Focus on critical paths

## Deployment

### Preview Deployments
- All PRs automatically deploy to Vercel preview
- Review preview URL before requesting review
- Test all functionality on preview
- Check mobile responsiveness

### Production Deployment
- Only merge to `main` after:
  - All CI checks pass
  - Code review approved
  - Preview deployment tested
  - Security scan passed
- `main` branch auto-deploys to production
- Monitor deployment in Vercel dashboard
- Verify production after deployment

### Rollback Procedure
1. Identify issue in production
2. Use Vercel dashboard to rollback to last good deployment
3. Fix issue in new PR
4. Deploy fix after testing

## Security Guidelines

### OWASP Top 10 Prevention
1. **Injection**: Validate and sanitize all inputs
2. **Broken Authentication**: Use proven auth libraries
3. **Sensitive Data Exposure**: Never commit secrets
4. **XSS**: Sanitize user content, use CSP headers
5. **CSRF**: Implement CSRF tokens for forms
6. **Security Misconfiguration**: Review security headers
7. **Insecure Deserialization**: Validate all data
8. **Using Components with Known Vulnerabilities**: Keep deps updated
9. **Insufficient Logging**: Log security events
10. **Insufficient Attack Protection**: Rate limit APIs

### Environment Variables
- Store in `.env.local` (gitignored)
- Never expose secrets to client
- Use `NEXT_PUBLIC_` prefix only for public values
- Document all required env vars in `.env.example`

### API Security
- Validate all inputs
- Rate limit endpoints
- Use HTTPS only
- Implement proper CORS
- Add authentication where needed

## Performance Optimization

### Core Web Vitals
- Target LCP < 2.5s
- Target FID < 100ms
- Target CLS < 0.1

### Optimization Techniques
- Use next/image for automatic optimization
- Implement lazy loading
- Use dynamic imports for heavy components
- Optimize fonts with next/font
- Minimize JavaScript bundle size
- Use streaming SSR where possible
- Implement proper caching strategies

## SEO Best Practices

### Required for All Pages
- Proper metadata export
- Semantic HTML structure
- Open Graph tags
- Twitter Card tags
- Canonical URLs
- Sitemap.xml
- Robots.txt

### Blog Posts
- Structured data (JSON-LD)
- Reading time estimation
- Publication dates
- Author information
- Tags/categories

## Accessibility (a11y)

### Requirements
- Semantic HTML elements
- Proper heading hierarchy (h1 → h6)
- Alt text for all images
- ARIA labels where needed
- Keyboard navigation support
- Focus indicators
- Sufficient color contrast (WCAG AA)
- Screen reader testing

### Testing
- Use axe DevTools
- Test with keyboard only
- Test with screen reader
- Validate HTML

## AI Assistant (Claude Code) Guidelines

### Before Making Changes
1. Read and understand CLAUDE.md (this file)
2. Check existing patterns in codebase
3. Review Next.js 16 documentation if unsure
4. Consider performance and security implications

### When Implementing Features
1. Use Server Components by default
2. Implement proper error boundaries
3. Add loading states
4. Include TypeScript types
5. Follow existing naming conventions
6. Add comments for complex logic
7. Consider mobile experience
8. Test accessibility

### Before Committing Code
1. **ALWAYS** run: `npm run lint && npm run type-check && npm run build`
2. Fix all errors and warnings
3. Format code with Prettier
4. Review changes in git diff
5. Write descriptive commit message
6. **CRITICAL**: Check for sensitive data (API keys, tokens, secrets)
7. **DO NOT** include "Generated with Claude Code" or similar AI attribution in commits
8. **DO NOT** include "Co-Authored-By: Claude" in commit messages

### Code Review Checklist
- [ ] TypeScript types are correct
- [ ] No console.log statements
- [ ] Proper error handling
- [ ] Loading and error states
- [ ] Mobile responsive
- [ ] Accessible (a11y)
- [ ] SEO metadata included
- [ ] No hardcoded values (use constants/env vars)
- [ ] Tests added/updated
- [ ] Documentation updated if needed

### Deployment Checklist
- [ ] All tests pass
- [ ] Build succeeds locally
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Environment variables documented
- [ ] Security scan passed
- [ ] Preview deployment tested
- [ ] Mobile/tablet tested

## Common Patterns

### Creating a New Page
```tsx
// src/app/(marketing)/about/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About | Your Name',
  description: 'Learn more about...',
}

export default function AboutPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1>About</h1>
      {/* Content */}
    </main>
  )
}
```

### Creating a Server Action
```tsx
// src/app/actions.ts
'use server'

import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
})

export async function submitContact(formData: FormData) {
  const validated = schema.parse({
    email: formData.get('email'),
  })

  // Process...
  return { success: true }
}
```

### Using Environment Variables
```tsx
// Public (client-side)
const apiUrl = process.env.NEXT_PUBLIC_API_URL

// Private (server-side only)
const secretKey = process.env.SECRET_KEY
```

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [MDX Documentation](https://mdxjs.com)
- [Vercel Documentation](https://vercel.com/docs)

## Support

For questions or issues:
1. Check this documentation first
2. Review Next.js documentation
3. Search existing issues/PRs
4. Ask in PR comments if stuck

---

**Note**: This is a living document. Update as project evolves.
