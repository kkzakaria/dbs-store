# CI/CD GitHub Actions + Branch Protection — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automated CI pipeline on PRs (lint + test + build) and continuous deployment to Cloudflare Workers on merge to main, with branch protection enforcing quality gates.

**Architecture:** Two GitHub Actions workflows — one for PR validation (ci.yml), one for deploy on merge (deploy.yml). Branch protection rules on main enforce PR requirement and passing CI. Wrangler CLI handles D1 migrations and Worker deployment.

**Tech Stack:** GitHub Actions, Bun, Wrangler CLI, Cloudflare Workers/D1

---

## File Structure

```
.github/
├── workflows/
│   ├── ci.yml              # PR validation: lint + test + build
│   └── deploy.yml          # Deploy on merge to main: lint + test + build + migrate + deploy
```

---

## Prerequisites

The following GitHub secrets must be configured before running the deploy workflow:

| Secret | Description |
|--------|-------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Workers/D1 permissions |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |

These are set via GitHub repo → Settings → Secrets and variables → Actions → New repository secret.

---

### Task 1: CI workflow for PR validation

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create the CI workflow file**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  validate:
    name: Lint + Test + Build
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: "1.3.3"

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Lint
        run: bun run lint

      - name: Test
        run: bun run test

      - name: Build
        run: bun run build
        env:
          SKIP_ENV_VALIDATION: "1"
```

- [ ] **Step 2: Verify the YAML is valid**

Run:
```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))" && echo "YAML valid"
```
Expected: `YAML valid`

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add PR validation workflow (lint + test + build)"
```

---

### Task 2: Deploy workflow for merge to main

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create the deploy workflow file**

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

concurrency:
  group: deploy-production
  cancel-in-progress: false

jobs:
  deploy:
    name: Lint + Test + Build + Deploy
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: "1.3.3"

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Lint
        run: bun run lint

      - name: Test
        run: bun run test

      - name: Build
        run: bun run build
        env:
          SKIP_ENV_VALIDATION: "1"

      - name: Apply D1 migrations
        run: bunx wrangler d1 migrations apply dbs-store-db --remote
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

      - name: Deploy to Cloudflare Workers
        run: bunx wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

- [ ] **Step 2: Verify the YAML is valid**

Run:
```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy.yml'))" && echo "YAML valid"
```
Expected: `YAML valid`

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add deploy workflow (merge to main → Cloudflare Workers)"
```

---

### Task 3: Configure branch protection via GitHub CLI

This task is run once manually — it configures GitHub branch protection rules on main.

- [ ] **Step 1: Verify gh CLI is authenticated**

Run:
```bash
gh auth status
```
Expected: Shows authenticated user and repo access.

- [ ] **Step 2: Apply branch protection rules**

Run:
```bash
gh api repos/{owner}/{repo}/rulesets --method POST --input - <<'EOF'
{
  "name": "Protect main",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["refs/heads/main"],
      "exclude": []
    }
  },
  "rules": [
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": false,
        "require_last_push_approval": false
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": false,
        "required_status_checks": [
          {
            "context": "Lint + Test + Build"
          }
        ]
      }
    }
  ]
}
EOF
```

Expected: JSON response with the ruleset ID confirming creation.

This enforces:
- PRs required to merge into main (no direct push)
- CI job "Lint + Test + Build" must pass before merge

- [ ] **Step 3: Verify the ruleset is active**

Run:
```bash
gh api repos/{owner}/{repo}/rulesets
```
Expected: JSON array containing the "Protect main" ruleset with `"enforcement": "active"`.

---

### Task 4: Configure squash merge only

- [ ] **Step 1: Set merge strategy to squash only**

Run:
```bash
gh api repos/{owner}/{repo} --method PATCH --field allow_squash_merge=true --field allow_merge_commit=false --field allow_rebase_merge=false --field squash_merge_commit_title=PR_TITLE --field squash_merge_commit_message=PR_BODY
```

Expected: JSON response showing `"allow_squash_merge": true`, `"allow_merge_commit": false`, `"allow_rebase_merge": false`.

---

### Task 5: Set GitHub secrets for Cloudflare

This task requires the user's Cloudflare API token and account ID.

- [ ] **Step 1: Set CLOUDFLARE_ACCOUNT_ID**

Run:
```bash
gh secret set CLOUDFLARE_ACCOUNT_ID
```
Paste the Cloudflare account ID when prompted.

- [ ] **Step 2: Set CLOUDFLARE_API_TOKEN**

Run:
```bash
gh secret set CLOUDFLARE_API_TOKEN
```
Paste the Cloudflare API token when prompted. The token needs permissions: Workers Scripts:Edit, D1:Edit, Account Settings:Read.

- [ ] **Step 3: Verify secrets are set**

Run:
```bash
gh secret list
```
Expected: Output shows `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` with their creation dates.

---

### Task 6: End-to-end validation

- [ ] **Step 1: Create a test branch and PR**

Run:
```bash
git checkout -b feat/test-ci
```

- [ ] **Step 2: Make a trivial change to trigger CI**

Add a blank line at the end of `CLAUDE.md` or any non-critical file, then commit:

```bash
echo "" >> CLAUDE.md
git add CLAUDE.md
git commit -m "test: trigger CI pipeline"
```

- [ ] **Step 3: Push and create PR**

Run:
```bash
git push -u origin feat/test-ci
gh pr create --title "test: validate CI pipeline" --body "Testing CI/CD setup. Will close after validation."
```

- [ ] **Step 4: Verify CI runs and passes**

Run:
```bash
gh pr checks feat/test-ci --watch
```
Expected: "Lint + Test + Build" job completes with a pass.

- [ ] **Step 5: Verify branch protection blocks merge without CI**

Check that the PR shows "Required status check — Lint + Test + Build" before allowing merge.

- [ ] **Step 6: Merge the PR to test deploy workflow**

Run:
```bash
gh pr merge feat/test-ci --squash --delete-branch
```

- [ ] **Step 7: Verify deploy workflow runs**

Run:
```bash
gh run list --branch main --limit 1
gh run view --log-failed
```
Expected: Deploy workflow runs. If secrets are configured, it deploys successfully. If secrets are not yet set, the deploy steps fail (expected — secrets can be added later).

- [ ] **Step 8: Clean up — revert the trivial change if needed**

If the CLAUDE.md change was just a blank line, revert it:
```bash
git checkout main
git pull
```
