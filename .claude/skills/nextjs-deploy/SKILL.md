---
name: nextjs-deploy
description: Complete Next.js deployment workflow to Vercel (project, gitignored)
---

# Next.js Deployment Workflow

This skill guides you through the complete deployment process for this Next.js application to Vercel.

## Prerequisites Check

Before deploying, verify all the following:

### 1. Local Build Success
```bash
npm run build
```
- Ensure the build completes without errors
- Check for any warnings that should be addressed
- Verify all pages compile successfully

### 2. Type Safety
```bash
npm run type-check
```
- Ensure no TypeScript errors
- Fix any type issues before proceeding

### 3. Code Quality
```bash
npm run lint
```
- Ensure no ESLint errors
- Address any warnings
- Check code style compliance

### 4. Code Formatting
```bash
npm run format:check
```
- Ensure all code is properly formatted
- Run `npm run format` if needed

### 5. Tests (if available)
```bash
npm test
```
- Ensure all tests pass
- Check test coverage

## Environment Variables

### Required Environment Variables
Document all required environment variables in `.env.example`:

```bash
# Example .env.example
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
# Add other required vars...
```

### Vercel Environment Variable Setup
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add all required variables for:
   - Production
   - Preview
   - Development (if needed)
3. Never commit actual values to git

## Deployment Steps

### Step 1: Prepare for Deployment
- [ ] All checks pass (build, lint, type-check)
- [ ] Environment variables documented
- [ ] Changes committed to git
- [ ] Branch up to date with main

### Step 2: Create Pull Request (if feature branch)
```bash
git push origin feature/your-feature
```
- Create PR on GitHub
- Wait for preview deployment
- Review preview URL
- Test thoroughly on preview

### Step 3: Review Preview Deployment
- Check Vercel bot comment for preview URL
- Test all functionality
- Verify environment variables loaded
- Check mobile responsiveness
- Test all critical user flows
- Verify SEO metadata

### Step 4: Merge to Main (Production Deployment)
- Ensure PR approved
- All CI checks pass
- Merge to main branch
- Auto-deployment to production triggers

### Step 5: Monitor Production Deployment
1. Watch deployment progress in Vercel dashboard
2. Check deployment logs for errors
3. Verify deployment completes successfully
4. Get production URL

### Step 6: Post-Deployment Verification
- [ ] Visit production URL
- [ ] Test critical functionality
- [ ] Verify analytics tracking (if configured)
- [ ] Check all pages load correctly
- [ ] Test contact form (if applicable)
- [ ] Verify blog posts display (if applicable)
- [ ] Check mobile/tablet views
- [ ] Test performance with Lighthouse

## Rollback Procedure

If issues are detected in production:

### Immediate Rollback
1. Go to Vercel Dashboard
2. Navigate to Deployments
3. Find last known good deployment
4. Click "..." menu → "Promote to Production"
5. Confirm rollback

### Fix and Redeploy
1. Create hotfix branch from main
2. Fix the issue
3. Test locally thoroughly
4. Create PR for review
5. Deploy after approval

## Vercel Configuration

### vercel.json (if needed)
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": ".next",
  "regions": ["iad1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

## Common Deployment Issues

### Build Failures
- **Issue**: TypeScript errors
  - **Fix**: Run `npm run type-check` locally and fix
- **Issue**: Missing dependencies
  - **Fix**: Ensure all deps in package.json
- **Issue**: Environment variables missing
  - **Fix**: Add to Vercel dashboard

### Runtime Errors
- **Issue**: 500 errors on certain pages
  - **Fix**: Check function logs in Vercel
- **Issue**: API routes failing
  - **Fix**: Verify environment variables set
- **Issue**: Images not loading
  - **Fix**: Check next.config.ts image domains

### Performance Issues
- **Issue**: Slow page loads
  - **Fix**: Check bundle size, optimize images
- **Issue**: High Cold Start times
  - **Fix**: Reduce function size, use edge runtime

## Deployment Checklist

Use this before every production deployment:

- [ ] Code review completed
- [ ] All tests pass
- [ ] Type checking passes
- [ ] Linting passes
- [ ] Build succeeds locally
- [ ] Environment variables documented
- [ ] Security scan completed
- [ ] Preview deployment tested
- [ ] Mobile responsiveness verified
- [ ] Performance acceptable (Lighthouse score)
- [ ] SEO metadata verified
- [ ] Analytics configured (if applicable)
- [ ] Error monitoring setup (if applicable)
- [ ] Rollback plan ready

## Best Practices

1. **Always use preview deployments** - Test before production
2. **Monitor deployments** - Watch for errors
3. **Keep environment variables secure** - Never commit secrets
4. **Document required env vars** - Update .env.example
5. **Use semantic versioning** - Tag releases
6. **Keep dependencies updated** - Regular maintenance
7. **Monitor analytics** - Track user experience
8. **Have rollback plan** - Be ready to revert

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Vercel CLI](https://vercel.com/docs/cli)

---

Remember: Test thoroughly on preview before promoting to production!
