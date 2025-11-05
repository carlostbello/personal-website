---
name: deploy-to-vercel
description: Run pre-deployment checks and deploy to Vercel (project, gitignored)
---

Run the complete deployment workflow to Vercel with comprehensive pre-deployment checks.

## Pre-Deployment Checks

Execute all checks before deployment:

### 1. Run Linting
```bash
npm run lint
```
- **Required**: Must pass with no errors
- Fix any linting issues before proceeding
- Address warnings if critical

### 2. Type Check
```bash
npm run type-check
```
- **Required**: Must pass with no TypeScript errors
- Fix all type errors before proceeding
- Ensure strict mode compliance

### 3. Format Check
```bash
npm run format:check
```
- **Required**: All code must be formatted
- Run `npm run format` to fix formatting
- Ensure Prettier compliance

### 4. Build Check
```bash
npm run build
```
- **Required**: Build must succeed
- Check for build warnings
- Verify all pages compile
- Review bundle size

### 5. Test Check (if available)
```bash
npm test
```
- Run all tests
- Ensure tests pass
- Check test coverage

## Deployment Workflow

### Option A: Deploy via Pull Request (Recommended)

1. **Create feature branch** (if not already):
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Commit changes**:
   ```bash
   git add .
   git commit -m "feat: descriptive message"
   ```

3. **Push to GitHub**:
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create Pull Request**:
   - Go to GitHub repository
   - Click "Create Pull Request"
   - Fill in PR description
   - Wait for preview deployment
   - Vercel bot will comment with preview URL

5. **Test Preview Deployment**:
   - Click preview URL from Vercel bot
   - Test all functionality
   - Check mobile responsiveness
   - Verify environment variables
   - Test all critical paths

6. **Merge to Main** (after approval):
   - Ensure all CI checks pass
   - Get code review approval
   - Merge PR to main
   - Production deployment auto-triggers

### Option B: Direct Deploy (Emergency Only)

Use only for hotfixes or emergencies:

```bash
# Ensure on main branch
git checkout main

# Pull latest
git pull origin main

# Make changes, commit
git add .
git commit -m "hotfix: critical fix"

# Push to main (triggers auto-deployment)
git push origin main
```

## Post-Deployment Verification

After deployment completes:

### 1. Monitor Deployment
- Watch Vercel dashboard
- Check deployment logs
- Verify successful completion

### 2. Verify Production
- [ ] Visit production URL
- [ ] Test homepage
- [ ] Test all main pages
- [ ] Test navigation
- [ ] Test contact form (if applicable)
- [ ] Check blog posts (if applicable)
- [ ] Verify mobile responsiveness
- [ ] Test accessibility

### 3. Check Metrics
- [ ] Run Lighthouse audit
- [ ] Check Core Web Vitals
- [ ] Verify SEO score
- [ ] Check performance score
- [ ] Review accessibility score

### 4. Monitor for Issues
- Check error monitoring (if configured)
- Review analytics (if configured)
- Monitor user feedback
- Watch for error reports

## Rollback Procedure

If issues detected after deployment:

### Immediate Rollback

1. **Go to Vercel Dashboard**:
   - Navigate to project
   - Go to "Deployments" tab

2. **Find Last Good Deployment**:
   - Identify previous working version
   - Check deployment timestamp

3. **Rollback**:
   - Click "..." menu on good deployment
   - Select "Promote to Production"
   - Confirm rollback

4. **Verify Rollback**:
   - Check production URL
   - Verify issue is resolved
   - Notify team if applicable

### Fix and Redeploy

1. **Create Hotfix Branch**:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/issue-description
   ```

2. **Fix Issue**:
   - Identify root cause
   - Implement fix
   - Test thoroughly locally

3. **Test Fix**:
   ```bash
   npm run lint
   npm run type-check
   npm run build
   npm test
   ```

4. **Deploy Fix**:
   - Create PR
   - Get quick review
   - Merge and deploy
   - Monitor deployment

## Environment Variables

### Check Required Variables
Ensure all required environment variables are set in Vercel:

1. Go to Project Settings → Environment Variables
2. Verify all required vars exist:
   - Production environment
   - Preview environment
   - Development environment (if needed)

### Add New Variables
If deployment needs new env vars:

```bash
# Via Vercel Dashboard
1. Project Settings → Environment Variables
2. Click "Add New"
3. Enter Key/Value
4. Select environments
5. Save

# Via Vercel CLI (alternative)
vercel env add VARIABLE_NAME
```

## Deployment Checklist

Use this before every production deployment:

### Pre-Deployment
- [ ] All code reviewed
- [ ] Linting passes (`npm run lint`)
- [ ] Type checking passes (`npm run type-check`)
- [ ] Formatting correct (`npm run format:check`)
- [ ] Build succeeds (`npm run build`)
- [ ] Tests pass (`npm test`)
- [ ] Environment variables documented
- [ ] No console.log in production code
- [ ] No commented-out code
- [ ] Security scan completed

### Preview Testing
- [ ] Preview deployment tested
- [ ] All pages load correctly
- [ ] Navigation works
- [ ] Forms function properly
- [ ] Images load correctly
- [ ] Mobile responsive
- [ ] Accessibility verified
- [ ] Performance acceptable

### Post-Deployment
- [ ] Production deployment succeeded
- [ ] Production URL verified
- [ ] All critical paths tested
- [ ] Lighthouse audit run
- [ ] No console errors
- [ ] Analytics tracking (if configured)
- [ ] Error monitoring active (if configured)

## Common Issues

### Build Failures

**TypeScript Errors**:
```bash
npm run type-check
# Fix all type errors
```

**Lint Errors**:
```bash
npm run lint
# Fix linting issues
```

**Missing Dependencies**:
```bash
# Ensure package.json includes all dependencies
npm install
```

**Environment Variables Missing**:
- Add to Vercel dashboard
- Redeploy after adding

### Runtime Errors

**500 Errors**:
- Check Vercel function logs
- Verify environment variables
- Check API route implementations

**404 Errors**:
- Verify routes exist
- Check file naming
- Ensure proper exports

**API Failures**:
- Check environment variables
- Verify API endpoints
- Review rate limits
- Check CORS settings

## Best Practices

1. **Always use preview deployments** - Test before production
2. **Never skip checks** - Run all pre-deployment checks
3. **Test thoroughly** - Don't assume it works
4. **Monitor deployments** - Watch for issues
5. **Have rollback plan** - Know how to revert
6. **Document changes** - Good commit messages
7. **Communicate** - Notify team of deploys
8. **Review logs** - Check for warnings/errors

## Resources

- [Vercel Deployment Docs](https://vercel.com/docs/deployments)
- [Next.js Deployment](https://nextjs.org/docs/app/building-your-application/deploying)
- [Vercel CLI](https://vercel.com/docs/cli)
- Project CLAUDE.md guidelines

## Summary

This command ensures safe, reliable deployments by:
1. Running comprehensive pre-deployment checks
2. Using preview deployments for testing
3. Providing clear rollback procedures
4. Verifying deployments post-deploy
5. Following best practices

**Remember**: Test on preview before promoting to production!
