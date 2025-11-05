# Claude Code Configuration

This directory contains Claude Code configuration specific to this Next.js project.

## Directory Structure

```
.claude/
├── README.md                # This file
├── QUICK_REFERENCE.md       # Quick reference guide
├── MCP_SETUP.md            # MCP server setup guide
├── settings.json            # Project settings (committed)
├── settings.local.json      # Local overrides (gitignored)
├── agents/                  # Custom agents
│   ├── nextjs-architect.md
│   ├── vercel-deployment-specialist.md
│   ├── security-auditor.md
│   └── code-reviewer.md
├── skills/                  # Custom skills
│   ├── nextjs-deploy/
│   │   └── SKILL.md
│   └── security-check/
│       └── SKILL.md
└── commands/                # Custom slash commands
    ├── create-nextjs-page.md
    ├── deploy-to-vercel.md
    └── security-scan.md
```

## What's in This Directory

### Agents (`agents/`)

Specialized AI agents for specific tasks:

- **nextjs-architect**: Next.js architecture expert for designing optimal patterns
- **vercel-deployment-specialist**: Vercel deployment and infrastructure expert
- **security-auditor**: Security specialist for vulnerability detection
- **code-reviewer**: Code quality and best practices reviewer

**Usage**:
```bash
# Invoke an agent from Claude Code
"Use the nextjs-architect agent to design a new blog page structure"
"Run the security-auditor agent to review the contact form"
```

### Skills (`skills/`)

Multi-step workflows for complex tasks:

- **nextjs-deploy**: Complete deployment workflow to Vercel
- **security-check**: Comprehensive security audit checklist

**Usage**:
```bash
# Invoke a skill
/skill nextjs-deploy
/skill security-check
```

### Commands (`commands/`)

Quick slash commands for common operations:

- **/create-nextjs-page**: Create new Next.js page with proper structure
- **/deploy-to-vercel**: Run pre-deployment checks and deploy
- **/security-scan**: Run comprehensive security scan

**Usage**:
```bash
# Use slash commands
/create-nextjs-page
/deploy-to-vercel
/security-scan
```

### Settings (`settings.json`)

Project-specific Claude Code configuration. This file is committed to git so all team members share the same configuration.

Example:
```json
{
  "rules": [
    "Follow Next.js 16+ conventions",
    "Use Server Components by default",
    "Validate all user inputs"
  ],
  "ignored_paths": [
    "node_modules",
    ".next",
    "out"
  ]
}
```

### Local Settings (`settings.local.json`)

Personal overrides for settings.json. This file is gitignored.

Use for:
- Personal preferences
- Local development paths
- Machine-specific configuration

## How to Use

### Using Agents

Agents are specialized for specific domains:

```bash
# Get architecture advice
"nextjs-architect: How should I structure the blog routes?"

# Review code
"code-reviewer: Review the ContactForm component"

# Security audit
"security-auditor: Check the API routes for vulnerabilities"

# Deployment help
"vercel-deployment-specialist: Help me configure environment variables"
```

### Using Skills

Skills guide you through multi-step processes:

```bash
# Deploy to Vercel
/skill nextjs-deploy

# Run security audit
/skill security-check
```

### Using Commands

Commands are quick, single-purpose operations:

```bash
# Create a new page
/create-nextjs-page

# Deploy to Vercel
/deploy-to-vercel

# Security scan
/security-scan
```

## Configuration Guidelines

### What Should Be Committed

✅ **Commit to Git**:
- `settings.json` - Shared project settings
- `agents/*.md` - Shared agent configurations
- `skills/*/SKILL.md` - Shared skill workflows
- `commands/*.md` - Shared command definitions
- `README.md`, `QUICK_REFERENCE.md`, `MCP_SETUP.md` - Documentation

❌ **Don't Commit** (add to .gitignore):
- `settings.local.json` - Personal overrides
- `.cache/` - Cache directory
- `logs/` - Log files
- `temp/` - Temporary files

### Creating Custom Agents

Create a new file in `agents/`:

```markdown
---
name: my-agent
description: Brief description
tools: bash, read, write
model: sonnet
---

You are an expert in...

## Responsibilities
1. ...
2. ...

## Key Practices
- ...
- ...
```

### Creating Custom Skills

Create a new directory in `skills/` with a `SKILL.md` file:

```markdown
---
name: my-skill
description: Brief description
---

# My Skill

## Prerequisites
...

## Steps
1. ...
2. ...
```

### Creating Custom Commands

Create a new file in `commands/`:

```markdown
---
name: my-command
description: Brief description
---

Execute this command to...

Steps:
1. ...
2. ...
```

## Best Practices

### 1. Keep Configuration DRY
- Don't duplicate guidelines between files
- Reference CLAUDE.md for project standards
- Agents/skills/commands should be focused and specific

### 2. Document Everything
- Add clear descriptions to all configs
- Include usage examples
- Explain why, not just what

### 3. Test Configurations
- Test new agents/skills/commands before committing
- Ensure they work as expected
- Update documentation if behavior changes

### 4. Version Control
- Commit meaningful configuration changes
- Write clear commit messages
- Review configuration changes in PRs

### 5. Security
- Never commit API keys or secrets
- Use environment variables
- Review security implications of new configs

## Troubleshooting

### Agent Not Working?

1. Check the agent file syntax
2. Verify the agent name matches the file name
3. Ensure required tools are available
4. Check Claude Code logs for errors

### Command Not Found?

1. Verify the command file exists in `commands/`
2. Check the command name in the frontmatter
3. Restart Claude Code to reload configs
4. Check for syntax errors in the command file

### Skill Not Executing?

1. Verify SKILL.md exists in the skill directory
2. Check the skill name in the frontmatter
3. Ensure all steps are clearly defined
4. Test individual steps manually first

## Integration with Other Tools

### Git
- Configuration files are tracked in git
- Changes reviewed in pull requests
- Team members share same configs

### GitHub Actions
- Some commands trigger CI/CD workflows
- See `.github/workflows/claude-code.yml`
- Deployment commands integrate with Vercel

### Vercel
- Deployment skills/commands integrate with Vercel
- Environment variables managed separately
- Preview deployments for testing

### Next.js MCP
- Agents can query running Next.js server
- Real-time error detection
- Development server integration

## Resources

- [Claude Code Documentation](https://docs.claude.com/claude-code)
- [Project Guidelines](../CLAUDE.md)
- [MCP Setup Guide](./MCP_SETUP.md)
- [Quick Reference](./QUICK_REFERENCE.md)

## Getting Help

1. Check QUICK_REFERENCE.md for common operations
2. Review CLAUDE.md for project guidelines
3. Check MCP_SETUP.md for MCP configuration
4. Ask Claude Code: "How do I use agents/skills/commands?"

---

**Note**: This configuration is specific to this project. Global Claude Code configuration is in `~/.claude/`.
