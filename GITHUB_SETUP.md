# GitHub Repository Setup Guide

This guide will walk you through setting up your GitHub repository for this Next.js personal website project.

## Step 1: Create GitHub Repository

### Option A: Using GitHub Web Interface

1. Go to [GitHub](https://github.com)
2. Click the **"+"** icon in the top right → **"New repository"**
3. Fill in the details:
   - **Repository name**: `personal-website` (or your preferred name)
   - **Description**: "My personal website built with Next.js, TypeScript, and Tailwind CSS"
   - **Visibility**: Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
4. Click **"Create repository"**

### Option B: Using GitHub CLI

```bash
# Install GitHub CLI if you haven't already
# macOS: brew install gh
# Windows: winget install GitHub.cli
# Linux: See https://github.com/cli/cli/blob/trunk/docs/install_linux.md

# Login to GitHub
gh auth login

# Create repository
gh repo create personal-website --public --source=. --remote=origin
```

## Step 2: Connect Local Repository to GitHub

If you used Option A (web interface), run these commands:

```bash
# Add the GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/personal-website.git

# Verify the remote was added
git remote -v
```

## Step 3: Initial Commit and Push

```bash
# Stage all files
git add .

# Create initial commit
git commit -m "Initial commit: Project setup with Claude Code configuration"

# Push to GitHub
git push -u origin main
```

## Step 4: Configure Branch Protection (Recommended)

Protect your main branch to ensure code quality:

1. Go to your repository on GitHub
2. Click **Settings** → **Branches**
3. Under "Branch protection rules", click **"Add rule"**
4. Configure the protection rule:
   - **Branch name pattern**: `main`
   - Enable:
     - ✅ **Require a pull request before merging**
     - ✅ **Require status checks to pass before merging**
       - Add: `lint-and-test` (will be created by GitHub Actions)
     - ✅ **Require branches to be up to date before merging**
     - ✅ **Do not allow bypassing the above settings**
5. Click **"Create"** or **"Save changes"**

## Step 5: Set Up GitHub Secrets

For the CI/CD pipeline to work, you need to add secrets:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"**
3. Add the following secrets:

### Required Secrets

| Secret Name | Where to Get It | Description |
|-------------|-----------------|-------------|
| `ANTHROPIC_API_KEY` | [Claude Console](https://console.anthropic.com/) | For Claude Code GitHub Actions integration |
| `VERCEL_TOKEN` | [Vercel Dashboard](https://vercel.com/account/tokens) → New Token | For automated deployments |
| `VERCEL_ORG_ID` | Run `vercel whoami` or check Vercel project settings | Your Vercel organization ID |
| `VERCEL_PROJECT_ID` | Vercel project settings | Your project ID (set up after Vercel configuration) |

**Note**: You'll add `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` after setting up Vercel (see VERCEL_SETUP.md)

## Step 6: Configure Repository Settings

### General Settings

1. Go to **Settings** → **General**
2. Under "Features":
   - ✅ Enable **Issues**
   - ✅ Enable **Discussions** (optional, for community engagement)
3. Under "Pull Requests":
   - ✅ **Allow merge commits**
   - ✅ **Allow squash merging** (recommended)
   - ✅ **Automatically delete head branches**

### GitHub Actions Permissions

1. Go to **Settings** → **Actions** → **General**
2. Under "Actions permissions":
   - Select **"Allow all actions and reusable workflows"**
3. Under "Workflow permissions":
   - Select **"Read and write permissions"**
   - ✅ **Allow GitHub Actions to create and approve pull requests**

## Step 7: Set Up GitHub Pages (Optional)

If you want to use GitHub Pages in addition to Vercel:

1. Go to **Settings** → **Pages**
2. Under "Source", select:
   - **Deploy from a branch**
   - Branch: `main`
   - Folder: `/docs` or `/` (depending on your setup)

**Note**: We recommend using Vercel for hosting (better performance and features), but GitHub Pages is a free alternative.

## Step 8: Enable Vercel GitHub Integration

1. Go to [Vercel Dashboard](https://vercel.com)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Vercel will automatically:
   - Detect it's a Next.js project
   - Configure build settings
   - Set up preview deployments for PRs
   - Deploy on every push to main

## Step 9: Verify Setup

Check that everything is working:

```bash
# Check Git status
git status

# Check remote
git remote -v

# Check branch
git branch
```

You should see:
- Clean working directory
- `origin` pointing to your GitHub repository
- `main` branch active

## Workflow Overview

Your development workflow will now be:

1. **Create a feature branch**: `git checkout -b feature/new-feature`
2. **Make changes**: Edit files, add features
3. **Commit changes**: `git commit -m "Add new feature"`
4. **Push to GitHub**: `git push origin feature/new-feature`
5. **Create Pull Request**: On GitHub, create PR from feature branch to main
6. **Automated checks run**: Linting, testing, security scan
7. **Claude Code review**: Comment `@claude` for AI review
8. **Preview deployment**: Vercel creates preview URL
9. **Merge PR**: After approval and checks pass
10. **Auto-deploy**: Vercel automatically deploys to production

## Troubleshooting

### Permission Denied (publickey)

If you get SSH errors:

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add to SSH agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Add public key to GitHub
# Copy the output of:
cat ~/.ssh/id_ed25519.pub
# Then add it to GitHub: Settings → SSH and GPG keys → New SSH key
```

### Using HTTPS Instead of SSH

If you prefer HTTPS:

```bash
# Use HTTPS URL format
git remote set-url origin https://github.com/YOUR_USERNAME/personal-website.git

# Configure credential helper (prevents password prompts)
git config --global credential.helper store
```

### GitHub Actions Not Running

1. Check **Actions** tab in repository
2. Verify workflow file exists: `.github/workflows/claude-code.yml`
3. Check **Settings** → **Actions** → Permissions are correct
4. Ensure secrets are properly set

## Next Steps

1. ✅ Complete Vercel setup (see `VERCEL_SETUP.md`)
2. ✅ Initialize Next.js project (see `DEVELOPMENT_GUIDE.md`)
3. ✅ Install GitHub App for Claude Code: `claude /install-github-app`
4. ✅ Start developing!

## Additional Resources

- [GitHub Docs](https://docs.github.com)
- [GitHub CLI Manual](https://cli.github.com/manual/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Git Documentation](https://git-scm.com/doc)
