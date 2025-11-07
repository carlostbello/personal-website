---
name: merge-pr
description: Review and merge PR with automated checks (project, gitignored)
---

You are helping with PR review and merge workflow. Follow these steps:

## Step 1: Identify the PR

Ask the user which PR to merge (or auto-detect if there's only one open):

```bash
# List open PRs
gh pr list --state open
```

## Step 2: Review the PR

Gather information about the PR:

```bash
# Get PR details
gh pr view [PR_NUMBER] --json title,body,additions,deletions,changedFiles,url

# Get the diff
gh pr diff [PR_NUMBER]

# Get CI status
gh pr checks [PR_NUMBER]
```

Review checklist:
- [ ] CI checks are passing
- [ ] No unintended files changed
- [ ] No debug code or console.logs
- [ ] All new code has proper types
- [ ] Comments/documentation where needed

## Step 3: Check Preview Deployment

If this is a Vercel project:

```bash
# Get deployment URL from PR
gh pr view [PR_NUMBER] --json statusCheckRollup
```

Remind user to:
1. Visit the preview deployment URL
2. Test all changed functionality
3. Check mobile responsiveness
4. Open browser DevTools and check for console errors
5. Verify no broken links

## Step 4: Local Testing (Optional but Recommended)

Suggest checking out the branch locally:

```bash
# Fetch and checkout the PR branch
gh pr checkout [PR_NUMBER]

# Run the app locally
npm run dev

# Run tests if available
npm test
```

## Step 5: Merge Decision

Ask user to confirm merge. Then execute:

```bash
# Squash merge (default for this project)
gh pr merge [PR_NUMBER] --squash --delete-branch

# Alternative: Regular merge commit
# gh pr merge [PR_NUMBER] --merge --delete-branch

# Alternative: Rebase merge
# gh pr merge [PR_NUMBER] --rebase --delete-branch
```

## Step 6: Post-Merge Actions

After successful merge:

```bash
# Switch back to main
git checkout main

# Pull latest changes
git pull origin main

# Verify production deployment
gh pr view [PR_NUMBER] --json mergedAt,mergeCommit
```

Remind user to:
- [ ] Check production deployment succeeded
- [ ] Verify changes in production
- [ ] Close any related issues
- [ ] Update project board/tracker if used

## Error Handling

**If CI checks fail:**
- Show which check failed
- Suggest: "Fix issues in the PR branch, don't merge yet"

**If merge conflicts:**
- Show conflict details
- Suggest: "Rebase the branch on main first"
```bash
git checkout [BRANCH_NAME]
git rebase main
# Resolve conflicts
git push --force-with-lease
```

**If preview deployment issues:**
- Check Vercel dashboard for errors
- Review deployment logs

## Best Practices Reminder

- **Always squash merge** for feature PRs (clean history)
- **Delete branch after merge** (keeps repo clean)
- **Test preview before merge** (catch issues early)
- **Never force-push to main** (protect production)
- **Watch the deployment** (ensure production is healthy)

## Example Output

```
📋 PR #1: feat: Add Header and Footer layout components
   Status: ✅ All checks passing
   Changes: 4 files changed (+250, -5)
   Preview: https://personal-website-xyz.vercel.app

✅ Pre-merge checklist:
   ✓ CI checks passing
   ✓ No debug code found
   ✓ TypeScript types complete
   ✓ No console errors in preview

🔄 Merging PR #1...
   Using: Squash merge
   Branch: feature/layout-components will be deleted

✅ Merged successfully!
   Commit: abc1234
   Production: Deploying...

Next steps:
- Verify production deployment
- Check https://your-site.com
- Start next task from TODO.md
```

## Integration with Other Workflows

This command pairs well with:
- `/pr-workflow` - Create the PR
- `/merge-pr` - Merge the PR (this command)
- Move to next TODO item

## Configuration

Uses:
- `gh` CLI for GitHub operations
- Project's default branch (main)
- Squash merge strategy by default
