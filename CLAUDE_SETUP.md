# Claude Code Setup Documentation

This document describes the complete Claude Code configuration for your Next.js + Vercel personal website project.

## Project Structure

```
personalWebsite/
├── .github/workflows/
│   └── claude-code.yml          # GitHub Actions CI/CD workflow
├── .claude/
│   └── settings.json            # Project-specific settings
├── CLAUDE.md                    # Project guidelines and context
└── CLAUDE_SETUP.md             # This file
```

## Global Configuration (~/.claude/)

### MCP Servers (`~/.claude.json`)
The following MCP servers have been configured:

1. **next-devtools**: Official Vercel MCP for Next.js development
   - Real-time error detection
   - Live state queries
   - Build status monitoring

2. **context7**: Documentation access MCP
   - Real-time, version-specific docs
   - Eliminates outdated API references

### Custom Agents (`~/.claude/agents/`)
Four specialized agents have been created:

1. **nextjs-architect.md**: Next.js architecture expert
2. **vercel-deployment-specialist.md**: Vercel deployment expert
3. **security-auditor.md**: Security specialist
4. **code-reviewer.md**: Code quality reviewer

Usage: `@nextjs-architect` or invoke through commands

### Custom Skills (`~/.claude/skills/`)
Two skills have been created:

1. **nextjs-deploy**: Complete deployment workflow
2. **security-check**: Comprehensive security audit

### Custom Commands (`~/.claude/commands/`)
Three slash commands have been created:

1. `/create-nextjs-page`: Create new Next.js pages with proper structure
2. `/deploy-to-vercel`: Run deployment workflow
3. `/security-scan`: Run security audit

## GitHub Actions Integration

The `.github/workflows/claude-code.yml` file provides:

- **claude-review**: Automatic PR code review
- **security-scan**: Security checks on PRs
- **lint-and-test**: Linting, type checking, and testing
- **deploy-preview**: Preview deployments on PRs
- **deploy-production**: Production deployment on main branch

### Required GitHub Secrets

You'll need to add these secrets to your GitHub repository:

1. `ANTHROPIC_API_KEY`: Your Claude API key
2. `VERCEL_TOKEN`: Vercel API token
3. `VERCEL_ORG_ID`: Your Vercel organization ID
4. `VERCEL_PROJECT_ID`: Your Vercel project ID

## Next Steps

### 1. Install MCP Servers

The MCP servers are already configured in `~/.claude.json`. They will be automatically loaded when you restart Claude Code.

### 2. Set Up GitHub Integration

```bash
# Install Claude Code GitHub app
claude /install-github-app
```

### 3. Configure Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Get your Vercel IDs
vercel whoami
```

### 4. Add GitHub Secrets

Go to your GitHub repository settings:
- Settings → Secrets and variables → Actions
- Add the required secrets listed above

### 5. Initialize Your Next.js Project

If you haven't already created a Next.js project:

```bash
npx create-next-app@latest . --typescript --tailwind --app
```

## Usage Examples

### Development Workflow

```bash
# Start development
npm run dev

# Use Claude to create a new page
/create-nextjs-page

# Run security check before commit
/security-scan

# Deploy to Vercel
/deploy-to-vercel
```

### PR Workflow

1. Create a branch and make changes
2. Push and create a PR
3. GitHub Actions automatically:
   - Reviews code with Claude
   - Runs security scan
   - Runs tests and linting
   - Creates preview deployment
4. Comment `@claude` in PR to ask questions
5. Merge to main → auto-deploy to production

### Using Agents

```bash
# Invoke specific agents
@nextjs-architect help me design the routing structure
@security-auditor review this authentication code
@code-reviewer check this component for best practices
```

## File Descriptions

### CLAUDE.md
Contains project guidelines and context that Claude respects. This includes:
- Tech stack information
- Code style preferences
- Testing requirements
- Security guidelines
- File structure conventions

### .claude/settings.json
Project-specific settings including:
- Allowed tools
- Ignore patterns (node_modules, .next, etc.)
- Hooks configuration
- Environment variables

### .github/workflows/claude-code.yml
GitHub Actions workflow for CI/CD automation with Claude Code integration.

## Additional Resources

- [Claude Code Documentation](https://docs.claude.com/en/docs/claude-code)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## Troubleshooting

### MCP Servers Not Loading

1. Restart Claude Code
2. Check `~/.claude.json` for proper JSON formatting
3. Run `claude mcp list` to verify servers are loaded

### GitHub Actions Failing

1. Verify all secrets are properly set
2. Check workflow logs in GitHub Actions tab
3. Ensure `ANTHROPIC_API_KEY` has proper permissions

### Vercel Deployment Issues

1. Verify environment variables in Vercel dashboard
2. Check build logs in Vercel
3. Ensure `vercel.json` is properly configured

## Customization

Feel free to customize any of the configuration files:

- Edit `CLAUDE.md` to adjust project guidelines
- Modify agents in `~/.claude/agents/` for your specific needs
- Update `.claude/settings.json` for project-specific settings
- Adjust GitHub workflow in `.github/workflows/claude-code.yml`

## Support

For issues or questions:
- Claude Code: https://github.com/anthropics/claude-code/issues
- Next.js: https://github.com/vercel/next.js/discussions
- Vercel: https://vercel.com/support
