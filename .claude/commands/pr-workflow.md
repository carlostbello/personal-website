---
name: pr-workflow
description: Run quality checks and create PR with automated workflow (project, gitignored)
---

You are helping with an automated PR creation workflow. Follow these steps:

## Step 1: Pre-flight Checks

First, verify the current git state:

```bash
# Get current branch
BRANCH=$(git branch --show-current)

# Check if on main/master
if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
  echo "ERROR: Cannot create PR from main/master branch"
  exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  echo "ERROR: You have uncommitted changes. Please commit them first."
  exit 1
fi

# Check if branch is pushed to remote
if ! git rev-parse --abbrev-ref --symbolic-full-name @{u} &>/dev/null; then
  echo "ERROR: Branch not pushed to remote. Run: git push -u origin $BRANCH"
  exit 1
fi
```

## Step 2: Run Quality Checks

Run all quality checks and report results:

```bash
echo "Running quality checks..."

# Run checks
npm run lint
npm run type-check
npm run format:check
npm run build
```

If any check fails, stop and report the error. Do not proceed to PR creation.

## Step 3: Gather PR Information

Extract information and ask user:

1. **Get branch name** for default title suggestion
2. **Get recent commits** to suggest PR description:
   ```bash
   git log main..HEAD --oneline
   ```
3. **Get changed files** for Changes section:
   ```bash
   git diff main..HEAD --name-status
   ```

Ask the user:
- **PR Title**: Suggest a title based on branch name, but let user customize
- **Summary**: Ask for 2-3 bullet points describing the changes
- **Test Items**: Ask what was tested (beyond the automated checks)

## Step 4: Generate PR Body

Create a well-structured PR body:

```markdown
## Summary
[User provided bullet points]

## Changes
[List of files changed with brief description of each]

## Test Plan
- [x] Lint checks pass
- [x] Type checks pass
- [x] Format checks pass
- [x] Build succeeds
[Additional user-provided test items]

## Notes
[Any additional context, breaking changes, deployment notes, etc.]
```

## Step 5: Create PR

Use gh CLI to create the PR:

```bash
gh pr create \
  --title "[user provided title]" \
  --body "$(cat <<'EOF'
[Generated PR body]
EOF
)"
```

## Step 6: Report Success

After PR creation:
1. Show the PR URL
2. Remind user to:
   - Review the preview deployment
   - Check GitHub Actions status
   - Merge when ready

## Error Handling

If any step fails:
- **Quality checks fail**: Show which check failed and the error output
- **Git issues**: Provide clear instructions on how to fix
- **PR creation fails**: Check if PR already exists or if gh CLI is authenticated

## Example Output

```
✓ Pre-flight checks passed
  Branch: feature/add-profile-component
  Status: Clean, all committed
  Remote: Synced with origin

✓ Quality checks passed
  ✓ Lint check passed
  ✓ Type check passed
  ✓ Format check passed
  ✓ Build succeeded

📝 PR Information:
  Title: feat: Add user profile component
  Files changed: 3 files (+120, -5)

✓ PR created: https://github.com/user/repo/pull/123

Next steps:
- Review preview deployment
- Check CI status
- Merge when ready
```

## Best Practices

- **Don't skip quality checks** - They catch issues early
- **Write clear titles** - Use conventional commits format
- **Be descriptive** - Explain what and why, not just what
- **Test locally first** - Don't rely only on CI

## Implementation Notes

- Run quality checks in parallel when possible (but report results sequentially)
- Use heredoc for PR body to avoid escaping issues
- Provide helpful error messages with actionable instructions
- Don't auto-merge or push additional commits during this workflow
