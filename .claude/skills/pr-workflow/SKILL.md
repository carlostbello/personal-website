---
name: pr-workflow
description: Automated workflow for quality checks and PR creation (project, gitignored)
---

# PR Workflow Automation

Automates the complete workflow for running quality checks and creating pull requests.

## What This Skill Does

1. **Quality Checks** - Runs all required checks in parallel:
   - ESLint (`npm run lint`)
   - TypeScript type checking (`npm run type-check`)
   - Prettier format checking (`npm run format:check`)
   - Production build (`npm run build`)

2. **Git Status** - Verifies:
   - Current branch name
   - Branch is pushed to remote
   - All changes are committed
   - Branch is ahead of main

3. **PR Creation** - Creates GitHub PR with:
   - Auto-generated title from branch name
   - Structured body with Summary, Changes, Test Plan
   - Proper markdown formatting
   - Link to created PR

## When to Use

Use this skill when you:
- Have completed feature work on a branch
- Are ready to create a PR
- Want to ensure all quality checks pass before PR creation
- Need a consistent PR format

## Usage

Simply invoke this skill:
```
/pr-workflow
```

Or via skill invocation:
```
Use the pr-workflow skill to run quality checks and create a PR
```

## Prerequisites

- Must be on a feature branch (not `main`)
- All changes must be committed
- Branch must be pushed to remote
- GitHub CLI must be authenticated

## What You Need to Provide

The skill will prompt you for:
1. **PR Title** (default: auto-generated from branch name)
2. **PR Description** (summary of changes)
3. **Key Files Changed** (for the Changes section)
4. **Test Checklist Items** (what was tested)

## Output

- Quality check results (pass/fail for each check)
- Git status summary
- PR URL when created
- Any errors or warnings encountered

## Error Handling

The skill will:
- Stop if quality checks fail (with error details)
- Warn if branch is not pushed to remote
- Prevent PR creation if already on main branch
- Show clear error messages for git issues

## Example Workflow

```
User: "Use pr-workflow skill"

Skill: Running quality checks...
✓ Lint check passed
✓ Type check passed
✓ Format check passed
✓ Build succeeded

Skill: Checking git status...
Current branch: feature/new-component
Status: Clean, all changes committed
Remote: Up to date with origin/feature/new-component

Skill: What would you like as the PR title?
User: "Add new component for user profile"

Skill: Provide a brief summary of changes:
User: "Created ProfileCard component with avatar, bio, and social links"

Skill: Creating PR...
✓ PR created: https://github.com/username/repo/pull/123
```

## Automation Benefits

This skill saves time by:
- **Eliminating repetitive commands** - No need to manually run each quality check
- **Consistent PR format** - Every PR follows the same structure
- **Preventing failed PRs** - Catches issues before PR creation
- **Reducing context switching** - Complete workflow in one command
- **Token efficiency** - Optimized prompts reduce token usage

## Technical Implementation

The skill performs the following steps internally:

### Step 1: Pre-flight Checks
```bash
# Verify we're on a feature branch
git branch --show-current

# Check if there are uncommitted changes
git status --porcelain

# Verify branch is pushed to remote
git rev-parse --abbrev-ref --symbolic-full-name @{u}
```

### Step 2: Quality Checks (Parallel Execution)
```bash
# Run all checks in parallel for speed
npm run lint &
npm run type-check &
npm run format:check &
npm run build &
wait
```

### Step 3: Gather PR Information
- Extract branch name for default title
- Prompt user for title, description, changes
- Generate test plan checklist

### Step 4: Create PR
```bash
gh pr create \
  --title "feat: user provided title" \
  --body "$(cat <<'EOF'
## Summary
- User provided summary points

## Changes
- List of modified files and changes

## Test Plan
- [x] All quality checks pass
- [x] User provided test items

## Notes
Additional context or information
EOF
)"
```

## Integration with Other Skills

This skill works well with:
- **security-check**: Run security scan before PR creation
- **nextjs-deploy**: Deploy after PR is merged

## Customization

You can customize the skill by:
1. Editing the PR template format
2. Adding/removing quality checks
3. Adjusting the prompts for PR information
4. Adding custom validation rules

## Troubleshooting

**"Not on a feature branch"**
- Ensure you're not on `main` or `master`
- Create a feature branch first: `git checkout -b feature/your-feature`

**"Uncommitted changes detected"**
- Commit your changes first: `git add . && git commit -m "your message"`
- Or stash them: `git stash`

**"Branch not pushed to remote"**
- Push your branch: `git push -u origin your-branch-name`

**"Quality checks failed"**
- Review the error output from the failed check
- Fix the issues and try again
- You can skip checks with caution (not recommended)

## Related Commands

- `/create-nextjs-page` - Create new Next.js pages
- `/security-scan` - Run security audit
- `/deploy-to-vercel` - Deploy to Vercel

## Configuration

No additional configuration needed. The skill uses:
- Project's `package.json` scripts
- Git configuration
- GitHub CLI authentication

## Best Practices

1. **Always run before creating PR** - Catch issues early
2. **Keep branch names descriptive** - Makes PR titles better
3. **Write clear commit messages** - Helps generate PR summary
4. **Test locally first** - Ensure changes work as expected
5. **Review quality check output** - Don't ignore warnings

## Future Enhancements

Potential improvements:
- [ ] Auto-detect PR type (feat/fix/docs) from commits
- [ ] Generate PR description from commit messages
- [ ] Integrate with linear/jira for issue linking
- [ ] Add code coverage checks
- [ ] Support for draft PRs
- [ ] Custom PR templates per project