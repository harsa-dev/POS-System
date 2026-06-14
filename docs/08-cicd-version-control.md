# CI/CD & Version Control

## 1. Purpose

This document defines version control, branching, commit, pull request, CI, CD, release, rollback, and code quality workflow for POS System V3.

The goal is to keep the codebase safe, traceable, reviewable, and deployable.

This document prevents random changes, broken main branch, unclear commits, unsafe deployment, missing checks, and undocumented production changes.

This document does not define hosting provider details, database schema, backend API internals, or monitoring rules. Those areas are handled in separate documents.

---

## 2. Current Context

POS System V3 is a web-based SaaS-style POS project.

The active mode is:

```txt
Restaurant
```

The project uses or may use:

```txt
Git
GitHub
Next.js
TypeScript
Prisma
PostgreSQL
pnpm
Vercel or similar hosting
```

The project is currently portfolio/MVP-stage, but it must still use disciplined version control.

The project should support:

```txt
safe commits
clear history
branch-based work
CI checks
build validation
typecheck validation
migration review
safe deployment
rollback
documentation updates
```

The goal is not to create corporate bureaucracy.

The goal is to avoid breaking a working POS flow because one commit titled `fix` secretly changed auth, order, payment, and the meaning of life.

---

## 3. Decisions

The following CI/CD and version control decisions are locked:

1. Git is the version control system.
2. GitHub is the default remote repository platform.
3. `main` is the stable branch.
4. Direct random changes to `main` should be avoided once the project becomes stable.
5. Feature work should happen in feature branches.
6. Bug fixes should happen in fix branches.
7. Commit messages must be meaningful.
8. `.env` files with secrets must not be committed.
9. `node_modules`, build output, logs, and local cache must not be committed.
10. Pull requests are recommended for meaningful changes.
11. CI must check code before merge/deploy when configured.
12. TypeScript errors must block production deployment.
13. Build errors must block production deployment.
14. Prisma schema validation should be part of checks.
15. Tests should be added gradually for critical business logic.
16. Documentation must be updated when architecture/workflow behavior changes.
17. Deployment should be connected to GitHub.
18. Production deploy should come from stable branch.
19. Rollback path must exist.
20. Database migrations must be reviewed before production use.
21. CI/CD should stay simple during MVP.
22. GitHub Actions is the recommended CI tool.
23. Vercel or hosting provider auto-deployment may be used for CD.
24. Release tags are optional during early MVP but recommended before real users.
25. Commit history must not expose secrets.

---

## 4. Rules

### 4.1 Repository Rules

The repository must contain:

```txt
source code
documentation
Prisma schema
migration files when applicable
package manager lockfile
configuration files
README
```

The repository must not contain:

```txt
node_modules
.next
dist
build
.env with real secrets
log files
local database dumps with sensitive data
temporary export files
private keys
```

Required or recommended files:

```txt
.gitignore
README.md
docs/
package.json
pnpm-lock.yaml
prisma/schema.prisma
```

### 4.2 Branch Rules

Recommended branch strategy for solo/MVP:

```txt
main
feature/*
fix/*
docs/*
refactor/*
chore/*
```

Examples:

```txt
feature/kitchen-order-flow
fix/payment-duplicate-check
docs/system-design
refactor/order-service-layer
chore/update-dependencies
```

Rules:

1. `main` should stay deployable.
2. Feature branches should focus on one topic.
3. Avoid mixing unrelated changes in one branch.
4. Avoid long-lived branches when working solo.
5. Pull latest `main` before starting large changes.
6. Do not create complex branch strategy before needed.

### 4.3 Commit Rules

Commit messages must be clear.

Recommended format:

```txt
type: short description
```

Common types:

```txt
feat
fix
refactor
docs
test
chore
style
perf
ci
build
```

Examples:

```txt
feat: add kitchen order queue
fix: prevent duplicate payment
refactor: move order logic to service layer
docs: add backend API rules
test: add order status transition tests
ci: add typecheck workflow
chore: update dependencies
```

Bad commit messages:

```txt
fix
update
asdf
final
coba
bisa
anjg
```

Rules:

1. Commit should describe what changed.
2. Commit should be small enough to understand.
3. Do not commit unrelated files.
4. Do not commit secrets.
5. Do not commit broken code intentionally unless branch is clearly experimental.
6. Use `git status` before commit.
7. Use `git diff` before commit when unsure.

### 4.4 Pull Request Rules

Pull requests are recommended for:

```txt
new features
bug fixes
architecture changes
database schema changes
auth/permission changes
payment changes
inventory changes
deployment changes
```

PR description should include:

```txt
summary
changes
testing
risk
screenshots if UI changed
migration notes if database changed
```

PR template:

```md
## Summary

Explain what this PR changes.

## Changes

- Change 1
- Change 2
- Change 3

## Testing

- [ ] Typecheck passed
- [ ] Build passed
- [ ] Manual flow tested
- [ ] Relevant tests added/updated

## Risk

Explain possible risk.

## Notes

Migration, deployment, or follow-up notes.
```

Rules:

1. PR should focus on one goal.
2. PR should not hide massive unrelated refactor.
3. PR that changes schema must mention migration impact.
4. PR that changes auth/payment/inventory must mention testing.
5. PR must not be merged if build/typecheck fails.

### 4.5 CI Rules

CI must run checks automatically when configured.

Recommended checks:

```txt
install dependencies
typecheck
lint
test
Prisma validate
build
```

Minimum CI for MVP:

```txt
typecheck
build
```

Recommended CI for serious MVP:

```txt
typecheck
lint
test critical logic
prisma validate
build
```

Rules:

1. CI failure must block merge/deploy.
2. Do not ignore CI failure just because local works.
3. CI must use clean install.
4. CI must not require production secrets for basic checks.
5. CI should avoid touching production database.
6. CI should run on pull request and main branch push.

### 4.6 CD Rules

CD means deployment automation.

MVP CD may use:

```txt
GitHub push
↓
Vercel / hosting provider build
↓
Preview or production deployment
```

Rules:

1. Production deploy should come from `main`.
2. Preview deploy may come from feature branches.
3. Production deployment must require successful build.
4. Production environment variables must be configured before deploy.
5. Deployment logs must be checked when deploy fails.
6. Deployment success is not proof that business flow works.
7. Manual smoke testing is required after important deploys.

### 4.7 Build Rules

Build must pass before production deploy.

Recommended scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "typecheck": "tsc --noEmit",
    "lint": "next lint",
    "test": "vitest",
    "prisma:validate": "prisma validate"
  }
}
```

Rules:

1. TypeScript error must be fixed properly.
2. Do not silence TypeScript using `any` without reason.
3. Do not bypass build failure with temporary hacks.
4. Build must not require local-only files.
5. Build must work in clean environment.

### 4.8 Database Migration Rules

Database schema changes require extra care.

Rules:

1. Prisma schema change must be reviewed.
2. Migration files must be committed.
3. Migration must be tested locally or staging first.
4. Destructive migration must require backup.
5. Production database must not be reset casually.
6. Rename migrations must preserve data when possible.
7. `restaurantId` to `businessId` or `tenantId` migration must be separate and planned.
8. Do not run random migration commands without understanding impact.

Dangerous commands in production:

```txt
prisma migrate reset
db push with destructive changes
manual table drop
manual data deletion
```

Those are not “fixes.” Those are tiny disasters wearing CLI costumes.

### 4.9 Release Rules

For early MVP, releases may be simple.

Recommended versioning later:

```txt
v0.1.0
v0.2.0
v1.0.0
```

Semantic versioning concept:

```txt
MAJOR.MINOR.PATCH
```

Meaning:

```txt
MAJOR: breaking changes
MINOR: new features
PATCH: bug fixes
```

Rules:

1. Tag stable milestones.
2. Write release notes for meaningful versions.
3. Mention migrations in release notes.
4. Mention breaking changes.
5. Keep deployment history.

### 4.10 Rollback Rules

Rollback must be possible.

Rollback options:

```txt
revert commit
redeploy previous hosting deployment
restore database backup
disable feature flag if available
```

Rules:

1. Know how to redeploy previous version.
2. Use `git revert` for safe code rollback.
3. Do not rewrite shared history casually.
4. Database rollback requires planning.
5. Destructive migration must not happen without backup.
6. After rollback, write down root cause.

### 4.11 Documentation Rules

Docs must be updated when changes affect:

```txt
architecture
API behavior
database schema
auth/permission
workflow status
deployment process
environment variables
security rules
testing strategy
```

Rules:

1. Code change that alters architecture should update docs.
2. Schema change should update database docs.
3. Permission change should update permission docs.
4. API response change should update backend docs.
5. Workflow status change should update status transition appendix.

### 4.12 Secret Handling Rules

Never commit:

```txt
DATABASE_URL
SESSION_SECRET
JWT_SECRET
STORAGE_SECRET_KEY
PAYMENT_SECRET_KEY
WEBHOOK_SECRET
SENTRY_AUTH_TOKEN
private keys
production tokens
```

If secret is committed:

```txt
rotate secret
remove from Git history if needed
invalidate leaked credential
check logs/access
document incident
```

Do not just delete the line in the next commit and pretend the internet forgot. It did not. The internet has the memory of an elephant with legal problems.

---

## 5. Implementation Guide

### 5.1 Recommended `.gitignore`

Recommended `.gitignore` for Next.js/Node:

```gitignore
# dependencies
node_modules

# next
.next
out

# production
dist
build

# env
.env
.env.local
.env.development
.env.production
.env.test

# logs
*.log
npm-debug.log*
yarn-debug.log*
pnpm-debug.log*

# testing
coverage

# system
.DS_Store
Thumbs.db

# local
*.local
```

Rules:

1. Keep `.env.example` if needed.
2. Do not include real secrets in `.env.example`.
3. Use placeholder values.

Example `.env.example`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/pos_dev"
SESSION_SECRET="replace-with-secure-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

### 5.2 Basic Git Workflow

Recommended solo developer workflow:

```txt
git checkout main
git pull origin main
git checkout -b feature/some-feature
work on code
git status
git diff
git add relevant-files
git commit -m "feat: add some feature"
git push origin feature/some-feature
open PR
check CI
merge to main
deploy
```

For small documentation-only changes, direct commit to main may be acceptable during early project stage.

For risky code changes, use branch and PR.

---

### 5.3 Commit Checklist

Before commit:

```txt
git status
git diff
check changed files
run typecheck if code changed
run test if critical logic changed
check no secrets included
check no unrelated files included
```

Recommended commands:

```bash
git status
git diff
pnpm typecheck
pnpm build
```

Commit:

```bash
git add docs/08-cicd-version-control.md
git commit -m "docs: add ci cd and version control guide"
```

---

### 5.4 PR Checklist

Before opening PR:

```txt
branch is up to date
scope is clear
description is written
tests/checks listed
migration impact noted
screenshots added if UI changed
docs updated if needed
```

PR body example:

```md
## Summary

Add backend order status validation.

## Changes

- Add order transition map
- Add transition validation helper
- Apply validation in status update endpoint
- Add tests for invalid transitions

## Testing

- [x] pnpm typecheck
- [x] pnpm test
- [x] Manual cashier → kitchen → serving flow

## Risk

Medium. Changes order status behavior.

## Notes

No database migration.
```

---

### 5.5 GitHub Actions CI Example

Basic CI workflow:

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  checks:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Prisma validate
        run: pnpm prisma validate

      - name: Typecheck
        run: pnpm typecheck

      - name: Test
        run: pnpm test

      - name: Build
        run: pnpm build
```

Adjust script names to match actual `package.json`.

If tests are not ready yet, start with:

```txt
prisma validate
typecheck
build
```

Then add tests gradually.

---

### 5.6 Package Scripts

Recommended scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit",
    "lint": "next lint",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "prisma:validate": "prisma validate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:generate": "prisma generate"
  }
}
```

Rules:

1. Scripts must work locally.
2. CI must call scripts that exist.
3. Do not invent CI script names without adding them to `package.json`.

---

### 5.7 Deployment Flow

Recommended MVP deployment flow:

```txt
feature branch
↓
PR
↓
CI checks
↓
merge to main
↓
hosting provider builds
↓
production deploy
↓
verify app health
↓
monitor logs/errors
```

Manual smoke test after deploy:

```txt
login
open dashboard
create order
process payment
check kitchen queue
mark preparing
mark ready
check serving
complete order
check inventory if affected
check logs/errors
```

For docs-only changes, smoke test may not be needed.

For auth/payment/database changes, smoke test is mandatory. Yes, manually. The machine is useful, not psychic.

---

### 5.8 Migration Flow

Safe migration flow:

```txt
change Prisma schema
↓
generate migration locally
↓
review migration SQL if possible
↓
run local migration
↓
test affected flow
↓
commit schema + migration
↓
apply to staging
↓
test staging
↓
deploy production
↓
apply production migration carefully
```

Migration checklist:

```txt
does it drop data?
does it rename fields?
does it change enum?
does it add required field?
does it need default value?
does old code still work?
does new code require migration first?
```

Special care for enum changes:

```txt
OrderStatus
PaymentStatus
Role
StockMovementType
```

Enums affect TypeScript, Prisma, and database. Naturally, they enjoy breaking everything in three layers at once.

---

### 5.9 Rollback Flow

Code rollback:

```bash
git revert <commit-sha>
git push origin main
```

Hosting rollback:

```txt
open hosting dashboard
select previous deployment
promote / redeploy
verify health
```

Database rollback:

```txt
restore backup
apply reverse migration if safe
manual recovery if required
```

Rules:

1. Code rollback is simpler than database rollback.
2. Database migration must be planned before production.
3. Backup must exist before destructive migration.
4. Rollback must be followed by root-cause review.

---

### 5.10 Release Notes

Release notes should include:

```txt
version
date
summary
features
fixes
migration notes
known issues
rollback notes if needed
```

Example:

```md
# v0.2.0

## Summary

Restaurant order flow stabilization.

## Features

- Add kitchen order queue
- Add serving page
- Add payment validation

## Fixes

- Prevent invalid status transition
- Prevent duplicate payment

## Migration

- Add index on restaurantId + status + createdAt

## Known Issues

- Realtime still uses polling
```

---

## 6. Anti-Patterns

Do not:

- Work forever without committing
- Commit everything with `git add .` without checking
- Use commit messages like `fix`, `update`, or `final`
- Commit `.env`
- Commit `node_modules`
- Commit build output
- Commit logs
- Push secrets to GitHub
- Force push shared branch without reason
- Keep broken `main`
- Merge PR with failing build
- Ignore TypeScript errors
- Silence TypeScript with `any` instead of fixing real issue
- Deploy directly from random local state
- Apply production migration blindly
- Reset production database
- Mix auth, database, UI, and docs changes in one chaotic PR
- Rename critical schema fields without migration plan
- Skip docs update after architecture change
- Treat successful deploy as proof the app works
- Use CI/CD complexity as an excuse not to build product

---

## 7. Checklist

CI/CD and version control are acceptable when:

- [ ] Repository uses Git.
- [ ] Remote repository is on GitHub.
- [ ] `.gitignore` excludes secrets, dependencies, build output, and logs.
- [ ] Commit messages are meaningful.
- [ ] Main branch stays stable.
- [ ] Feature/fix/docs branches are used for meaningful changes.
- [ ] PRs include summary, testing, and risk when needed.
- [ ] Typecheck runs before production deploy.
- [ ] Build runs before production deploy.
- [ ] Prisma schema validation runs when database is used.
- [ ] Critical tests are added gradually.
- [ ] CI does not require production secrets.
- [ ] Deployment is connected to GitHub.
- [ ] Production deploy comes from stable branch.
- [ ] Migration files are committed.
- [ ] Migration impact is reviewed.
- [ ] Rollback path exists.
- [ ] Docs are updated when behavior changes.
- [ ] No secrets are committed.

---

## 8. References

Related documents:

- 00-ai-context.md
- 01-system-design.md
- 02-system-architecture.md
- 04-backend-api.md
- 05-database-storage.md
- 07-hosting-cloud.md
- 09-security.md
- 12-error-tracking-logs.md
- 13-monitoring-alerts.md
- 14-testing.md
- appendices/implementation-rules.md