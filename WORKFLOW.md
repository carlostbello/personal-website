# Development Workflow

## Branch Strategy

This project uses a three-tier branch strategy for controlled deployments:

```
feature/* → main → production
  (dev)    (staging)  (live)
```

### Branches

1. **Feature Branches** (`feature/*`, `fix/*`, etc.)
   - Created for each new feature or bug fix
   - Branch from `main`
   - Naming: `feature/your-feature-name`
   - **Deployment**: Auto-deploy to Vercel preview URL on PR creation

2. **Main Branch** (`main`)
   - Staging/testing environment
   - Features merged here after review
   - **Deployment**: Auto-deploys to Vercel preview environment
   - Used for testing before production release

3. **Production Branch** (`production`)
   - Live user-facing website
   - Only merge from `main` after thorough testing
   - **Deployment**: Auto-deploys to production domain on Vercel

### Vercel Configuration

- **Production Branch**: `production` (configured in Vercel → Settings → Git → Production Branch)
- **Preview Branches**: All other branches get preview deployments
- **Domain**: Production domain points to `production` branch

## Workflow Steps

### 1. Starting New Work

```bash
# Ensure you're on main and up to date
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name

# Start development server
npm run dev
```

### 2. During Development

```bash
# Make changes to code
# ...

# Run quality checks
npm run lint          # Check for code issues
npm run type-check    # Verify TypeScript types
npm run format:check  # Check code formatting

# Commit changes
git add .
git commit -m "feat: add your feature description"
```

### 3. Creating a Pull Request

**Option A: Automated with /pr-workflow**

```bash
# Simply run the pr-workflow command or skill
/pr-workflow

# This automation handles:
# - Pre-flight checks (branch, commits, remote)
# - Quality checks (lint, type-check, format, build)
# - PR creation with structured format
# - Error handling and validation
```

**Option B: Manual Process**

```bash
# Run all quality checks
npm run lint && npm run type-check && npm run format:check && npm run build

# Push to GitHub
git push -u origin feature/your-feature-name

# Create PR (using GitHub CLI)
gh pr create --base main --title "feat: your feature title" --body "Description of changes"
```

### 4. Code Review & Testing

- PR automatically deploys to Vercel preview URL
- Review preview deployment
- Request code review from team
- Address review feedback
- Wait for CI checks to pass

### 5. Merging to Main (Staging)

```bash
# After PR approval
gh pr merge --squash  # or use GitHub UI

# Delete local feature branch
git branch -d feature/your-feature-name

# Update local main
git checkout main
git pull origin main
```

**Result**: Changes auto-deploy to main branch preview environment

### 6. Testing on Staging (Main)

- Test all functionality on main branch deployment
- Verify mobile responsiveness
- Check performance
- Run manual QA tests
- Get stakeholder approval if needed

### 7. Promoting to Production

```bash
# Ensure main is up to date
git checkout main
git pull origin main

# Merge to production
git checkout production
git pull origin production
git merge main

# Push to production
git push origin production

# Return to main for continued development
git checkout main
```

**Result**: Changes auto-deploy to live production site

### 8. Rollback (If Needed)

If issues are found in production:

**Option 1: Vercel Dashboard Rollback**
1. Go to Vercel dashboard
2. Select deployment history
3. Click "Promote to Production" on last known good deployment

**Option 2: Git Rollback**
```bash
git checkout production
git reset --hard <last-good-commit-sha>
git push origin production --force

# Fix issue in new branch
git checkout main
git checkout -b fix/production-issue
# ... fix and test ...
```

## Git Commit Conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting, missing semicolons, etc
refactor: code restructuring
test: adding tests
chore: maintenance tasks
```

Examples:
```
feat: add blog post pagination
fix: resolve mobile navigation bug
docs: update deployment instructions
refactor: simplify contact form validation
```

## Quality Checks

**Before Every Commit:**
```bash
npm run lint          # ESLint checks
npm run type-check    # TypeScript validation
npm run format:check  # Prettier formatting
```

**Before Every PR:**
```bash
npm run build         # Ensure build succeeds
```

**Automated (CI/CD):**
- GitHub Actions runs on every push
- Checks linting, types, and build
- Blocks merge if checks fail

## Environment Variables

### Local Development
- Create `.env.local` (gitignored)
- Copy from `.env.local.example`
- Never commit real secrets

### Vercel (Production)
- Add environment variables in Vercel dashboard
- Settings → Environment Variables
- Set for Production, Preview, and Development as needed

### Required Variables
```bash
# Site Configuration
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Database Migrations (Supabase)

### Creating Migrations

```bash
# Create new migration file
npx supabase migration new migration_name

# Edit the migration file in supabase/migrations/

# Push to remote database
npx supabase db push
```

### Best Practices

1. **All schema changes as migrations**: Never use Supabase UI for schema changes
2. **Test locally first**: Use local Supabase instance if possible
3. **Descriptive names**: `add_user_preferences_table` not `migration_1`
4. **One purpose per migration**: Don't combine unrelated changes
5. **Version control**: Migrations are committed to Git

### Migration Workflow

```bash
# 1. Create migration
npx supabase migration new add_comments_table

# 2. Edit SQL file
# supabase/migrations/XXXXXX_add_comments_table.sql

# 3. Test SQL syntax
npx supabase db push

# 4. Commit migration file
git add supabase/migrations/
git commit -m "feat: add comments table schema"

# 5. Push to GitHub
git push origin feature/comments

# 6. Migrations auto-apply on deployment
```

## Deployment Checklist

### Before Merging to Production

- [ ] All tests pass locally
- [ ] Build succeeds (`npm run build`)
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Code formatted with Prettier
- [ ] Environment variables documented
- [ ] Database migrations tested
- [ ] Preview deployment tested
- [ ] Mobile/tablet responsive tested
- [ ] Accessibility checked
- [ ] Performance acceptable (Lighthouse)

### After Deploying to Production

- [ ] Verify production URL loads
- [ ] Test critical user flows
- [ ] Check browser console for errors
- [ ] Verify analytics tracking (if enabled)
- [ ] Monitor error tracking (if enabled)
- [ ] Update stakeholders

## Common Commands

```bash
# Development
npm run dev               # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run type-check       # Check TypeScript types
npm run format           # Format code with Prettier
npm run format:check     # Check formatting without changing

# Supabase
npx supabase init        # Initialize Supabase project
npx supabase login       # Authenticate with Supabase
npx supabase link        # Link to remote project
npx supabase migration new <name>  # Create migration
npx supabase db push     # Push migrations to remote
npx supabase db reset    # Reset local DB (runs all migrations)

# Git
git checkout -b feature/name    # Create feature branch
git add .                       # Stage changes
git commit -m "message"         # Commit changes
git push -u origin branch-name  # Push new branch
git push                        # Push to existing branch

# GitHub CLI
gh pr create      # Create pull request
gh pr merge       # Merge pull request
gh pr list        # List pull requests
gh pr view        # View PR details

# Vercel CLI (optional)
vercel            # Deploy to preview
vercel --prod     # Deploy to production (not recommended, use Git)
vercel logs       # View deployment logs
```

## Troubleshooting

### Build Fails

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Try build again
npm run build
```

### TypeScript Errors

```bash
# Check specific file
npx tsc --noEmit path/to/file.ts

# Generate types from Supabase
npx supabase gen types typescript --project-id <your-project-id>
```

### Supabase Connection Issues

```bash
# Check authentication
npx supabase status

# Re-link project
npx supabase link --project-ref <your-project-ref>

# Verify environment variables
cat .env.local
```

### Deployment Issues

1. Check Vercel deployment logs
2. Verify environment variables in Vercel
3. Check GitHub Actions status
4. Ensure all migrations ran successfully

## Getting Help

1. Check this documentation first
2. Review [Next.js documentation](https://nextjs.org/docs)
3. Check [Supabase documentation](https://supabase.com/docs)
4. Search existing GitHub issues
5. Create new issue with details

---

**Last Updated**: 2025-11-08
**Maintained By**: Development Team
