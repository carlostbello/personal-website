# Project Guidelines

## Stack
- Next.js 15+ with App Router
- TypeScript (strict mode)
- Tailwind CSS
- Vercel hosting

## Code Style
- Use Server Components by default
- Prefer composition over inheritance
- Write descriptive commit messages
- All components must be typed
- Use 'use client' directive only when necessary

## Testing
- Write tests for all business logic
- Use React Testing Library
- Aim for >80% coverage

## Deployment
- All PRs get preview deployments
- Main branch auto-deploys to production
- Run security scans before merge

## File Structure
```
app/
├── (routes)/
│   ├── page.tsx
│   ├── layout.tsx
│   ├── loading.tsx
│   └── error.tsx
components/
├── ui/          # shadcn components
└── custom/      # custom components
lib/
└── utils.ts
```

## Security
- Never commit secrets
- Use environment variables
- Validate all inputs
- Follow OWASP guidelines

## AI Assistant Guidelines
- Always run type checking before committing
- Run linting and fix any issues
- Ensure all tests pass before deployment
- Use descriptive variable and function names
- Add comments for complex logic
- Follow Next.js best practices and conventions
