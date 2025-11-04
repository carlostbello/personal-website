# Claude Code Quick Reference

## Custom Slash Commands

| Command | Description |
|---------|-------------|
| `/create-nextjs-page` | Create a new Next.js page with proper structure |
| `/deploy-to-vercel` | Run pre-deployment checks and deploy |
| `/security-scan` | Run comprehensive security audit |

## Custom Agents

Invoke agents using `@agent-name`:

| Agent | Use Case |
|-------|----------|
| `@nextjs-architect` | Architecture decisions, routing, components |
| `@vercel-deployment-specialist` | Deployment configuration and optimization |
| `@security-auditor` | Security reviews and vulnerability detection |
| `@code-reviewer` | Code quality and best practices review |

## Skills

Skills are specialized workflows:

- **nextjs-deploy**: Full deployment workflow with checks
- **security-check**: Comprehensive security audit checklist

## MCP Servers

Automatically loaded MCP servers:

- **next-devtools**: Next.js development tools and diagnostics
- **context7**: Real-time documentation access

## Common Workflows

### Create a New Feature
```
1. @nextjs-architect help me plan the feature
2. Implement the feature
3. @code-reviewer review my implementation
4. /security-scan
5. /deploy-to-vercel
```

### Fix a Security Issue
```
1. /security-scan
2. @security-auditor analyze the specific issue
3. Implement fixes
4. /security-scan (verify fixes)
```

### Deploy to Production
```
1. npm run build (test locally)
2. /deploy-to-vercel
3. Verify deployment
```

## GitHub Integration

### In Pull Requests
- Comment `@claude` to invoke Claude for PR review
- Automatic security scans run on all PRs
- Preview deployments created automatically

### Workflow Triggers
- **PR opened/updated**: Runs linting, tests, security scan
- **Push to main**: Deploys to production
- **Comment with @claude**: Runs Claude review

## Environment Setup

### Required Tools
- Node.js 20+
- npm or yarn
- Vercel CLI: `npm i -g vercel`
- GitHub CLI: `gh` (for GitHub integration)

### Required Secrets (GitHub)
- `ANTHROPIC_API_KEY`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## Tips

1. **Use CLAUDE.md**: Update it with project-specific guidelines
2. **Invoke agents early**: Get architectural advice before implementing
3. **Run security scans**: Before every deployment
4. **Use preview deployments**: Test in production-like environment
5. **Commit frequently**: Smaller commits are easier to review

## Keyboard Shortcuts (Claude Code)

- `Ctrl+R`: Search command history
- `Tab`: Auto-complete file names
- `Shift+Tab`: Toggle auto-accept mode
- `Esc`: Interrupt current task
- `Enter`: Queue additional messages

## File Structure Conventions

```
app/
├── (routes)/           # Route groups
│   ├── page.tsx       # Page component
│   ├── layout.tsx     # Layout wrapper
│   ├── loading.tsx    # Loading state
│   └── error.tsx      # Error boundary
components/
├── ui/                # shadcn components
└── custom/            # Custom components
lib/
└── utils.ts           # Utility functions
```

## Next Steps

1. Initialize your Next.js project if not done
2. Set up Vercel and link project
3. Configure GitHub secrets
4. Install GitHub app: `claude /install-github-app`
5. Start building!
