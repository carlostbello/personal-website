---
name: security-scan
description: Run comprehensive security scan (project, gitignored)
---

Run a comprehensive security audit of the codebase following OWASP guidelines and Next.js best practices.

## Quick Security Scan

Run automated security checks:

```bash
# Check for dependency vulnerabilities
npm audit

# Check only high/critical
npm audit --audit-level=high

# Check for outdated packages
npm outdated
```

## Invoke Security Auditor Agent

Use the security-auditor subagent for comprehensive manual review:

1. Review authentication and authorization
2. Check data protection measures
3. Validate input validation
4. Verify XSS prevention
5. Check CSRF protection
6. Review security headers
7. Audit dependencies
8. Check API security
9. Review error handling
10. Validate environment variable usage

## Automated Checks

### 1. Dependency Vulnerabilities
```bash
npm audit
```
**Action**: Review and fix critical/high vulnerabilities

### 2. Search for Exposed Secrets
```bash
# Check for potential secrets in code
grep -r "API_KEY\|SECRET\|PASSWORD\|TOKEN\|PRIVATE" src/ --exclude-dir=node_modules | grep -v "NEXT_PUBLIC"

# Verify .env files are gitignored
git check-ignore .env .env.local .env.*.local
```
**Action**: Ensure no secrets in source code

### 3. Check for Dangerous Patterns
```bash
# Check for dangerous innerHTML usage
grep -r "dangerouslySetInnerHTML" src/

# Check for eval usage
grep -r "eval(" src/

# Check for console statements (should be removed in production)
grep -r "console\\.log" src/ | grep -v "node_modules"
```
**Action**: Remove or justify usage

### 4. Verify Security Headers
```bash
# Check next.config.ts for security headers
cat next.config.ts | grep -A 20 "headers"
```
**Action**: Ensure proper headers configured

## Manual Security Review

### 1. Authentication & Authorization
- [ ] Review auth implementation (if exists)
- [ ] Check session management
- [ ] Verify token storage (httpOnly cookies)
- [ ] Check API route protection
- [ ] Validate authorization logic

**Files to review**:
```bash
src/app/api/**/*
src/middleware.ts
```

### 2. Data Protection
- [ ] No secrets in source code
- [ ] Environment variables properly used
- [ ] `.env` files gitignored
- [ ] `NEXT_PUBLIC_` only for safe values
- [ ] Sensitive data encrypted

**Check**:
```bash
# Should return nothing (no secrets in code)
grep -r "sk_\|pk_\|api_key\|secret" src/ --exclude-dir=node_modules

# Should list all .env files (they should be ignored)
git check-ignore .env .env.local .env.production.local .env.development.local
```

### 3. Input Validation
- [ ] All forms validate input
- [ ] Email validation uses proper regex
- [ ] Text fields have length limits
- [ ] File uploads validated
- [ ] Using validation library (zod/yup)

**Files to review**:
```bash
src/app/api/**/*
src/components/**/ContactForm.tsx
src/app/actions.ts
```

**Example check**:
```tsx
// Should see validation like this:
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  message: z.string().min(10).max(1000)
})
```

### 4. XSS Prevention
- [ ] User content sanitized
- [ ] No unsafe dangerouslySetInnerHTML
- [ ] MDX properly configured
- [ ] Content Security Policy set

**Check CSP headers**:
```typescript
// next.config.ts should have:
headers: [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; ..."
  }
]
```

### 5. CSRF Protection
- [ ] Using Server Actions (built-in protection)
- [ ] Or CSRF tokens implemented
- [ ] Origin header verified
- [ ] SameSite cookies used

### 6. Security Headers
Required headers should be configured:

```typescript
// Check next.config.ts or vercel.json for:
[
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }
]
```

**Verify**:
```bash
# After deployment:
curl -I https://your-domain.com | grep -i "x-frame\|x-content\|referrer\|strict-transport"
```

### 7. API Security
For each API route (`src/app/api/*`), verify:

- [ ] Input validation implemented
- [ ] Proper error handling
- [ ] No sensitive data in responses
- [ ] Rate limiting (if needed)
- [ ] Authentication (if required)
- [ ] CORS properly configured

**Example secure API route**:
```tsx
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = schema.parse(body)

    // Process...

    return NextResponse.json({ success: true })
  } catch (error) {
    // Don't expose internal errors
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }
}
```

### 8. Error Handling
- [ ] No stack traces in production
- [ ] Generic error messages for users
- [ ] Detailed errors logged server-side only
- [ ] No sensitive data in errors

**Check**:
```bash
# Should find minimal or no console.logs
grep -r "console\\." src/ --exclude-dir=node_modules
```

### 9. Environment Variables
- [ ] All secrets in environment variables
- [ ] `.env.example` documents required vars
- [ ] No `.env` files committed
- [ ] Vercel env vars configured

**Verify**:
```bash
# Should be gitignored
git status | grep ".env"  # Should show nothing

# Should exist
test -f .env.example && echo "✓ .env.example exists" || echo "✗ Create .env.example"
```

### 10. Third-Party Dependencies
```bash
# Check for vulnerabilities
npm audit

# Check for outdated packages
npm outdated

# Check for deprecated packages
npm ls --depth=0 2>&1 | grep "deprecated"
```

**Action Items**:
- Update vulnerable packages
- Replace deprecated packages
- Remove unused dependencies

## Security Report

After completing the scan, generate a report:

### Critical Issues
List any critical security issues found:
- [ ] Exposed secrets/API keys
- [ ] Unvalidated user input
- [ ] Missing authentication
- [ ] Vulnerable dependencies (high/critical)

### High Priority
List high-priority issues:
- [ ] Missing security headers
- [ ] Weak input validation
- [ ] Missing CSRF protection
- [ ] Improper error handling

### Medium Priority
List medium-priority issues:
- [ ] Missing rate limiting
- [ ] Outdated dependencies
- [ ] Incomplete input validation
- [ ] Weak CSP policy

### Low Priority
List low-priority issues:
- [ ] Console.log statements
- [ ] Missing .env.example
- [ ] Incomplete documentation

## Remediation Steps

For each issue found, provide:
1. **Location**: Specific file and line number
2. **Description**: What the issue is
3. **Risk**: Security impact
4. **Fix**: Specific remediation steps
5. **Priority**: Critical/High/Medium/Low

## Quick Fixes

### Fix Vulnerable Dependencies
```bash
# Automatically fix issues
npm audit fix

# For breaking changes
npm audit fix --force
```

### Add Missing Security Headers
```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ]
  }
}
```

### Add Input Validation
```bash
# Install validation library
npm install zod

# Use in forms and API routes
```

### Remove Console Statements
```bash
# Find all console statements
grep -r "console\\." src/ --exclude-dir=node_modules

# Remove manually or use ESLint to enforce
```

## Best Practices

1. **Run security scans regularly** - Monthly minimum
2. **Fix critical issues immediately** - Don't delay
3. **Keep dependencies updated** - Weekly checks
4. **Use security headers** - Defense in depth
5. **Validate all inputs** - Trust nothing
6. **Never commit secrets** - Use env vars
7. **Monitor for vulnerabilities** - Stay informed
8. **Follow OWASP Top 10** - Standard practices
9. **Test security fixes** - Verify they work
10. **Document security measures** - Team awareness

## Post-Scan Actions

After running the security scan:

1. **Fix Critical Issues**:
   - Address immediately
   - Test fixes thoroughly
   - Deploy hotfix if in production

2. **Schedule High Priority**:
   - Plan fixes for next sprint
   - Create tracking issues
   - Assign owners

3. **Plan Medium/Low**:
   - Add to backlog
   - Address in regular development
   - Monitor for escalation

4. **Update Documentation**:
   - Document findings
   - Update security guidelines
   - Share with team

5. **Schedule Next Scan**:
   - Monthly for active development
   - Before major releases
   - After significant changes

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [npm Audit Docs](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [Snyk Vulnerability DB](https://snyk.io/vuln/)

## Summary

This security scan:
1. Runs automated vulnerability checks
2. Performs manual security review
3. Generates actionable report
4. Provides remediation guidance
5. Follows industry best practices

**Remember**: Security is ongoing, not one-time. Run regularly!
