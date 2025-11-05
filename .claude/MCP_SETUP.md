# MCP Server Setup Guide

This guide explains how to configure Model Context Protocol (MCP) servers for enhanced Claude Code functionality with Next.js and Vercel development.

## What are MCP Servers?

MCP servers extend Claude Code's capabilities by providing specialized tools and integrations. They run locally and give Claude access to:
- Real-time documentation
- Development tools (Next.js dev server integration)
- External APIs (Vercel, GitHub, etc.)
- Custom functionality

## Recommended MCP Servers for This Project

### 1. Next.js DevTools MCP (ESSENTIAL)

The official Vercel MCP server for Next.js development.

**Features**:
- Automatic discovery of running Next.js dev servers
- Real-time error detection and diagnostics
- Access to Next.js runtime state
- Build status monitoring
- Route information
- Development logs

**Installation**:

Add to `~/.claude.json`:

```json
{
  "mcpServers": {
    "next-devtools": {
      "command": "npx",
      "args": ["-y", "next-devtools-mcp@latest"]
    }
  }
}
```

**Usage**:
- Start your Next.js dev server: `npm run dev`
- Claude can now query the running server for errors, routes, and diagnostics
- Use commands like "Check for Next.js errors" or "Show current routes"

**MCP Integration**:
- For Next.js < 16: Enable MCP with `__NEXT_EXPERIMENTAL_MCP_SERVER=true npm run dev`
- For Next.js 16+: MCP is enabled by default

### 2. Context7 MCP (RECOMMENDED)

Provides real-time access to official documentation for Next.js, React, TypeScript, and more.

**Features**:
- Version-specific documentation
- Latest API references
- Official examples
- Eliminates hallucinations
- Always up-to-date

**Installation**:

```bash
# Quick install via Claude Code command
claude mcp add context7
```

Or manually add to `~/.claude.json`:

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7"]
    }
  }
}
```

**Usage**:
```bash
# Get Next.js documentation
"What's the latest way to handle metadata in Next.js?"

# Compare versions
"What changed in Next.js 15 vs 14?"

# Get API docs
"How do I use generateStaticParams?"
```

### 3. GitHub MCP (via GitHub CLI)

Interact with GitHub repositories, issues, and pull requests.

**Installation**:

```bash
# Install GitHub CLI
# macOS
brew install gh

# Windows
winget install --id GitHub.cli

# Linux
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh

# Authenticate
gh auth login
```

**Usage**:
Claude can now use `gh` commands directly:
```bash
# Create PR
gh pr create --title "feat: new feature" --body "Description"

# View PR status
gh pr status

# Create issue
gh issue create --title "Bug report"
```

### 4. Browser Automation MCP (OPTIONAL)

Test your Next.js app with real browser automation using Playwright.

**Installation**:

This is already available via the `mcp__next-devtools__browser_eval` tool.

**Usage**:
```bash
# Test a page
"Use browser automation to test the /about page"

# Check for errors
"Load the homepage and check for console errors"

# Take screenshot
"Take a screenshot of the mobile view"
```

**Important**: For Next.js projects, prefer using the `nextjs_runtime` tool for error detection instead of browser console logs.

## Complete Configuration Example

Here's a complete `~/.claude.json` configuration:

```json
{
  "mcpServers": {
    "next-devtools": {
      "command": "npx",
      "args": ["-y", "next-devtools-mcp@latest"],
      "disabled": false
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7"],
      "disabled": false
    }
  },
  "allowedDirectories": [
    "/mnt/c/Users/carlo/Documents/Repos/personal-website"
  ]
}
```

## MCP Server Management

### Enable/Disable MCPs

```json
{
  "mcpServers": {
    "next-devtools": {
      "command": "npx",
      "args": ["-y", "next-devtools-mcp@latest"],
      "disabled": false  // Set to true to disable
    }
  }
}
```

### Verify MCP Installation

After adding MCPs, restart Claude Code and check:

```bash
# In Claude Code session, ask:
"List available MCP tools"

# Or check specific MCP:
"Is next-devtools MCP available?"
```

### Troubleshooting MCPs

If MCP servers aren't working:

1. **Check configuration syntax**:
   ```bash
   cat ~/.claude.json | jq .
   ```
   Should parse without errors.

2. **Verify command exists**:
   ```bash
   # For npx-based MCPs
   npx -y next-devtools-mcp@latest --help
   ```

3. **Check Claude Code logs**:
   Look for MCP connection errors in Claude Code output

4. **Restart Claude Code**:
   Exit and restart to reload MCP configuration

5. **Check permissions**:
   Ensure the MCP command is executable

## Optional MCP Servers

### Vercel API MCP

For programmatic Vercel deployment management (advanced).

**Note**: This requires setting up a custom MCP server. For most use cases, the Vercel CLI or GitHub integration is sufficient.

### v0 MCP (UI Generation)

Generate React components from natural language (experimental).

**Installation**:
```bash
git clone https://github.com/hellolucky/v0-mcp.git
cd v0-mcp
npm install
# Add V0_API_KEY to .env
```

Add to `~/.claude.json`:
```json
{
  "mcpServers": {
    "v0": {
      "command": "node",
      "args": ["/path/to/v0-mcp/index.js"],
      "env": {
        "V0_API_KEY": "your_key_here"
      },
      "disabled": false
    }
  }
}
```

## Best Practices

### 1. Start with Essential MCPs
Begin with:
- next-devtools (essential for Next.js)
- context7 (documentation)
- GitHub CLI (if using GitHub)

### 2. Test MCPs Individually
Add one MCP at a time and verify it works before adding more.

### 3. Keep MCPs Updated
MCPs auto-update when using `npx -y package@latest`, but verify occasionally:
```bash
# Check for updates
npm view next-devtools-mcp version
```

### 4. Monitor Performance
Too many MCPs can slow down Claude Code. Disable unused MCPs.

### 5. Use Environment Variables
For MCPs requiring API keys, use environment variables:
```json
{
  "mcpServers": {
    "example": {
      "command": "node",
      "args": ["server.js"],
      "env": {
        "API_KEY": "${ENV:MY_API_KEY}"
      }
    }
  }
}
```

## Project-Specific vs Global MCPs

### Global MCPs (~/.claude.json)
- Used across all projects
- next-devtools, context7, GitHub CLI
- General-purpose tools

### Project-Specific Configuration
- Stored in `.claude/settings.json` (gitignored)
- Project-specific settings
- Override global settings

## Security Considerations

### 1. API Keys
- Never commit API keys to git
- Use environment variables
- Store in `~/.claude.json` or system env vars

### 2. MCP Permissions
- MCPs run with your user permissions
- Review MCP code before installing
- Only use trusted MCPs

### 3. Network Access
- MCPs can make network requests
- Review what data they access
- Use official MCPs when available

## Getting Help

### MCP Not Working?

1. Check configuration: `cat ~/.claude.json`
2. Verify command exists: `which npx` or test the command
3. Check Claude Code logs
4. Restart Claude Code
5. Ask in Claude Code session: "Debug MCP configuration"

### Need More MCPs?

- [Claude Code Marketplace](https://github.com/anthropics/claude-code)
- [MCP Specification](https://modelcontextprotocol.io/)
- Community MCPs

## Summary

For this Next.js + Vercel project, the recommended setup is:

**Essential**:
- ✅ next-devtools MCP (Next.js integration)
- ✅ context7 MCP (Documentation)

**Recommended**:
- ✅ GitHub CLI (GitHub integration)

**Optional**:
- Browser Automation (Testing)
- v0 MCP (Component generation)
- Custom Vercel MCP (Advanced deployment)

Start with the essential MCPs and add more as needed!

## Next Steps

1. Add MCPs to `~/.claude.json`
2. Restart Claude Code
3. Verify MCPs are available
4. Start using MCP-enhanced features
5. Explore additional MCPs as needed

---

**Note**: MCP configuration is stored globally in `~/.claude.json`, not in this repository. This file is for reference only.
