# Git Hooks

This directory contains Git hooks that help maintain code quality and security.

## Available Hooks

### pre-push

**Purpose**: Prevents accidentally pushing sensitive data (API keys, tokens, secrets) to the remote repository.

**What it checks:**
- ✅ .env files (should never be committed)
- ✅ API keys and tokens
- ✅ AWS access keys
- ✅ Private SSH/RSA keys
- ✅ GitHub tokens
- ✅ Slack tokens
- ✅ Google API keys
- ✅ High-entropy strings (potential secrets)
- ⚠️ Generic secret patterns (warnings only)

**Installation:**

The hook is already installed in your local repository. For new clones or team members:

```bash
# Install the pre-push hook
cp .github/hooks/pre-push .git/hooks/pre-push
chmod +x .git/hooks/pre-push
```

**Usage:**

The hook runs automatically every time you push:

```bash
git push origin main
# 🔒 Running pre-push security check...
# Checking commits: ...
# ✅ Security check passed! No sensitive data detected.
```

**If secrets are detected:**

```bash
git push origin main
# 🔒 Running pre-push security check...
# ❌ ERROR: Potential API key detected in commit abc123
#
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# ❌ PUSH REJECTED: Sensitive data detected!
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#
# To fix this:
# 1. Remove the sensitive data from your commits
# 2. Use environment variables instead
# 3. Add secrets to .env.local (which is gitignored)
# 4. Rewrite git history if needed: git rebase -i
```

**How to fix when secrets are detected:**

1. **Remove the secret from code:**
   ```bash
   # Edit the file and remove the secret
   vim path/to/file
   ```

2. **Add to environment variables:**
   ```bash
   # Add to .env.local (gitignored)
   echo "API_KEY=your_secret_here" >> .env.local
   ```

3. **Amend the commit:**
   ```bash
   git add path/to/file
   git commit --amend --no-edit
   ```

4. **If secret is in older commits, rewrite history:**
   ```bash
   # Interactive rebase
   git rebase -i HEAD~3  # Go back 3 commits
   # Mark the commit as 'edit', fix it, then:
   git rebase --continue
   ```

**Bypass the hook (NOT RECOMMENDED):**

Only use this if you absolutely must and you're certain there are no secrets:

```bash
git push --no-verify
```

⚠️ **Warning**: Bypassing the hook can lead to exposing secrets publicly!

## Best Practices

### What Should Be in .env.local (Gitignored)
```bash
# API Keys
SENDGRID_API_KEY=SG.xxxxx
GOOGLE_API_KEY=AIzaxxxxx

# Database URLs
DATABASE_URL=postgresql://...

# Authentication Secrets
NEXTAUTH_SECRET=xxxxx
```

### What Can Be in Code (Public)
```typescript
// ✅ Good: Reference to env var
const apiKey = process.env.SENDGRID_API_KEY

// ✅ Good: Public configuration
const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.example.com'
}

// ❌ Bad: Hardcoded secret
const apiKey = 'SG.xxxxxxxxxxxx'

// ❌ Bad: Secret in comments
// My API key: SG.xxxxxxxxxxxx
```

## Troubleshooting

### Hook not running

```bash
# Check if hook exists
ls -la .git/hooks/pre-push

# If not, install it
cp .github/hooks/pre-push .git/hooks/pre-push
chmod +x .git/hooks/pre-push
```

### False positives

If the hook incorrectly flags something:

1. Review the flagged content carefully
2. If it's truly not sensitive, you can:
   - Reformat the code to not match the pattern
   - Or bypass with `--no-verify` (use sparingly)

### Hook too slow

For large pushes, the hook might take a while. This is normal and ensures security.

## Future Hooks

Potential hooks to add:
- `pre-commit`: Run linting and formatting before commits
- `commit-msg`: Enforce commit message conventions
- `post-merge`: Notify about package.json changes

## Resources

- [Git Hooks Documentation](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks)
- [OWASP Secrets Management](https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_password)
- Project security guidelines: `CLAUDE.md`

---

**Note**: Git hooks in `.git/hooks/` are not tracked by git. We keep a copy in `.github/hooks/` that IS tracked, so team members can install them.
