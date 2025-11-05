---
name: security-check
description: Comprehensive security audit for Next.js applications (project, gitignored)
---

# Security Audit Checklist for Next.js Personal Website

This skill performs a comprehensive security audit following OWASP guidelines and Next.js best practices.

## Quick Security Scan

Run these automated checks first:

```bash
# Check for dependency vulnerabilities
npm audit

# Check for high/critical vulnerabilities
npm audit --audit-level=high

# Fix fixable vulnerabilities
npm audit fix

# Check code quality and potential issues
npm run lint

# Type check for potential type-related bugs
npm run type-check
```

## Manual Security Review

### 1. Authentication & Authorization

#### Check Session Management
- [ ] Review authentication implementation (if added)
- [ ] Verify JWT tokens are securely stored (httpOnly cookies)
- [ ] Check session timeout configuration
- [ ] Ensure proper logout functionality

#### API Route Protection
- [ ] Verify API routes use authentication middleware
- [ ] Check authorization for protected resources
- [ ] Ensure role-based access control (if applicable)

**Files to review:**
- `src/app/api/**/*`
- Middleware configuration

### 2. Data Protection

#### Environment Variables
```bash
# Check for exposed secrets
grep -r "API_KEY\|SECRET\|PASSWORD\|TOKEN" src/ --exclude-dir=node_modules

# Verify .env files are gitignored
git check-ignore .env .env.local .env.*.local
```

- [ ] No secrets in source code
- [ ] All secrets in environment variables
- [ ] `.env` files properly gitignored
- [ ] `NEXT_PUBLIC_` prefix only for safe values
- [ ] `.env.example` documents required variables

#### Files to check:
```bash
# Should NOT contain sensitive data:
- src/**/*.ts
- src/**/*.tsx
- package.json
- next.config.ts

# Should be gitignored:
- .env
- .env.local
- .env.*.local
```

### 3. Input Validation

#### Form Validation
Review all forms for proper validation:

- [ ] Contact form validates input
- [ ] Email validation uses proper regex
- [ ] Text fields have length limits
- [ ] File uploads validated (if applicable)
- [ ] Use validation library (zod, yup, etc.)

**Example secure validation:**
```tsx
import { z } from 'zod'

const contactSchema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().min(2).max(100),
  message: z.string().min(10).max(1000),
})
```

#### API Input Validation
- [ ] All API routes validate input
- [ ] Sanitize user input
- [ ] Prevent SQL injection (if using DB)
- [ ] Prevent NoSQL injection
- [ ] Validate file uploads

**Files to review:**
- `src/app/api/**/*`
- `src/components/**/ContactForm.tsx`
- Any forms or user input handling

### 4. XSS Prevention

#### Content Sanitization
- [ ] User-generated content sanitized
- [ ] Markdown properly parsed (if using MDX)
- [ ] HTML rendered safely
- [ ] No dangerouslySetInnerHTML without sanitization

```bash
# Check for dangerous patterns
grep -r "dangerouslySetInnerHTML" src/
grep -r "eval(" src/
grep -r "innerHTML" src/
```

#### CSP Headers
Check Content Security Policy in `next.config.ts` or `vercel.json`:

```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
          },
        ],
      },
    ]
  },
}
```

### 5. CSRF Protection

#### Form Protection
- [ ] Use Next.js Server Actions (built-in CSRF protection)
- [ ] Or implement CSRF tokens for traditional forms
- [ ] Verify Origin header on API routes
- [ ] Use SameSite cookies

**Example with Server Actions:**
```tsx
// app/actions.ts
'use server'

export async function submitContact(formData: FormData) {
  // Built-in CSRF protection
  // Validate and process...
}
```

### 6. Security Headers

#### Required Headers
Check these headers are set (in vercel.json or next.config.ts):

- [ ] `X-Frame-Options: DENY`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Permissions-Policy` (as needed)
- [ ] `Strict-Transport-Security` (HSTS)
- [ ] `Content-Security-Policy`

**Verify headers:**
```bash
# After deployment, check headers:
curl -I https://your-domain.com
```

### 7. Dependencies Security

#### Vulnerability Scanning
```bash
# Run npm audit
npm audit

# Check for outdated packages
npm outdated

# Update dependencies carefully
npm update

# For major versions
npm install package@latest
```

#### Regular Maintenance
- [ ] Dependencies updated regularly
- [ ] Security patches applied promptly
- [ ] Deprecated packages replaced
- [ ] Unused dependencies removed

**Review:**
```bash
# Check package.json for:
- Old or deprecated packages
- Packages with known vulnerabilities
- Unused dependencies
```

### 8. API Security

#### API Route Security
For each API route, verify:

- [ ] Authentication required (if needed)
- [ ] Input validation implemented
- [ ] Rate limiting configured
- [ ] Proper error handling
- [ ] No sensitive data in responses
- [ ] CORS properly configured

**Example secure API route:**
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

#### Rate Limiting
Consider implementing rate limiting for:
- Contact form submissions
- API endpoints
- Authentication attempts

### 9. File Upload Security (if applicable)

If file uploads are implemented:

- [ ] Validate file types
- [ ] Check file size limits
- [ ] Scan for malware
- [ ] Store files securely
- [ ] Use CDN for serving
- [ ] Sanitize file names

### 10. Error Handling

#### Secure Error Messages
- [ ] Don't expose stack traces in production
- [ ] Generic error messages for users
- [ ] Detailed errors logged server-side only
- [ ] No sensitive data in error messages

```bash
# Check for exposed errors
grep -r "console.log" src/
grep -r "console.error" src/
```

## Environment-Specific Checks

### Development
- [ ] `.env.local` used for local secrets
- [ ] Debug tools disabled in production
- [ ] Source maps disabled in production

### Production
- [ ] Environment variables set in Vercel
- [ ] Error monitoring configured (optional)
- [ ] Logging configured properly
- [ ] Rate limiting active

## Third-Party Services Security

### Analytics (if used)
- [ ] Privacy-compliant implementation
- [ ] Cookie consent (if required)
- [ ] No PII sent to analytics

### Email Service (if used)
- [ ] API keys secure
- [ ] Rate limiting implemented
- [ ] SPF/DKIM configured

### External APIs
- [ ] API keys in environment variables
- [ ] API responses validated
- [ ] Timeout configured
- [ ] Error handling implemented

## Security Testing

### Automated Tests
```bash
# If you have security tests
npm run test:security

# Or use tools like:
# - OWASP ZAP
# - Snyk
# - npm audit
```

### Manual Testing
- [ ] Test all forms with malicious input
- [ ] Try SQL injection on inputs
- [ ] Test XSS payloads
- [ ] Check for sensitive data exposure
- [ ] Test rate limiting
- [ ] Verify authentication flows

## Compliance Checklist

### GDPR (if applicable)
- [ ] Privacy policy page
- [ ] Cookie consent
- [ ] Data deletion capability
- [ ] User data export

### Accessibility
- [ ] WCAG AA compliance
- [ ] Screen reader testing
- [ ] Keyboard navigation

## Security Audit Report Template

After completing the audit, document findings:

```markdown
# Security Audit Report - [Date]

## Summary
- Total issues found: X
- Critical: X
- High: X
- Medium: X
- Low: X

## Critical Issues
1. [Issue description]
   - Location: file:line
   - Risk: [Description]
   - Remediation: [Steps]

## Recommendations
1. [Priority recommendations]

## Action Items
- [ ] Fix critical issues immediately
- [ ] Address high-priority issues
- [ ] Plan for medium/low priority fixes
- [ ] Schedule next security audit
```

## Quick Security Fixes

### Common Vulnerabilities & Fixes

1. **Exposed API Keys**
   ```bash
   # Move to .env.local
   echo "API_KEY=your_key" >> .env.local
   # Add to .gitignore
   echo ".env.local" >> .gitignore
   ```

2. **Missing Input Validation**
   ```bash
   npm install zod
   # Implement validation in forms and API routes
   ```

3. **Missing Security Headers**
   ```typescript
   // Add to next.config.ts
   async headers() {
     return [
       {
         source: '/:path*',
         headers: securityHeaders,
       },
     ]
   }
   ```

4. **Vulnerable Dependencies**
   ```bash
   npm audit fix
   # Or manually update:
   npm install package@latest
   ```

## Security Best Practices Summary

1. **Never commit secrets** - Use environment variables
2. **Validate all inputs** - Use validation libraries
3. **Sanitize user content** - Prevent XSS
4. **Use HTTPS** - Always
5. **Keep dependencies updated** - Regular audits
6. **Implement rate limiting** - Prevent abuse
7. **Use security headers** - Defense in depth
8. **Monitor and log** - Detect issues early
9. **Regular security audits** - Stay secure
10. **Follow OWASP Top 10** - Standard practices

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit)

---

**Note**: Run security audits regularly (monthly recommended) and before major releases.
