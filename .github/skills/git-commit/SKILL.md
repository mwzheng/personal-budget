---
name: git-commit
description: 'Execute git commit with conventional commit message analysis, intelligent staging, and message generation. Use when user asks to commit changes, create a git commit, or mentions "/commit". Supports: (1) Auto-detecting type and scope from changes, (2) Generating conventional commit messages from diff, (3) Interactive commit with optional type/scope/description overrides, (4) Intelligent file staging for logical grouping'
license: MIT
allowed-tools: Bash
---

# Git Commit with Conventional Commits

## Overview

Create standardized, semantic git commits using the Conventional Commits specification. Analyze the actual diff to determine appropriate type, scope, and message.

## Conventional Commit Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Commit Types

| Type       | Purpose                        |
| ---------- | ------------------------------ |
| `feat`     | New feature                    |
| `fix`      | Bug fix                        |
| `docs`     | Documentation only             |
| `style`    | Formatting/style (no logic)    |
| `refactor` | Code refactor (no feature/fix) |
| `perf`     | Performance improvement        |
| `test`     | Add/update tests               |
| `build`    | Build system/dependencies      |
| `ci`       | CI/config changes              |
| `chore`    | Maintenance/misc               |
| `revert`   | Revert commit                  |

## Breaking Changes

```
# Exclamation mark after type/scope
feat!: remove deprecated endpoint

# BREAKING CHANGE footer
feat: allow config to extend other configs

BREAKING CHANGE: `extends` key behavior changed
```

## Workflow

### 1. Analyze Diff

```bash
# If files are staged, use staged diff
git diff --staged

# If nothing staged, use working tree diff
git diff

# Also check status
git status --porcelain
```

### 2. Stage Files (if needed)

If nothing is staged or you want to group changes differently:

```bash
# Stage specific files
git add path/to/file1 path/to/file2

# Stage by pattern
git add *.test.*
git add src/components/*

# Interactive staging
git add -p
```

**Never commit secrets** (.env, credentials.json, private keys).

### 3. Generate Commit Message

Analyze the diff to determine:

- **Type**: What kind of change is this?
- **Scope**: What area/module is affected?
- **Description**: One-line summary of what changed (present tense, imperative mood, <72 chars)

### 4. Execute Commit

```bash
# Single line
git commit -m "<type>[scope]: <description>"

# Multi-line with body/footer (heredoc)
git commit -m "$(cat <<'EOF'
<type>[scope]: <description>

<optional body>

<optional footer>
EOF
)"

# Recommended helper: scripts/commit.sh converts literal "\\n" or "/n" into real newlines
# Example usage:
#   ./scripts/commit.sh "feat(scope): add feature" "Body line1\\nBody line2" "Footer: Closes #123"
# or via package script:
#   pnpm run gcommit -- "fix(scope): bugfix" "One-line body"
```

## Best Practices

- One logical change per commit
- Present tense: "add" not "added"
- Imperative mood: "fix bug" not "fixes bug"
- Reference issues: `Closes #123`, `Refs #456`
- Keep description under 72 characters

# Apply Prettier Before Each Commit

Before creating any git commit, format all changed files with the project's Prettier configuration. This must be done for every commit produced by automation or a developer.

Whenever the agent modifies, creates, or updates files in this repository, run Prettier
using the project's configuration before finalizing the edits or creating the patch/commit.

- Prefer the repository script if present: check `package.json` for a `format` or `prettier`
  script and run it (for example, `pnpm format` or `npm run format`).
- If no script exists, run Prettier via the package manager:
  - `pnpm dlx prettier --write .` or `npx prettier --write .`.
- Prefer formatting only the changed files to minimize diffs. Example approach:
  - `git diff --name-only --staged | xargs pnpm dlx prettier --write`
- Always include formatting changes in the same patch/commit that introduces the related code
  changes, unless the user explicitly asks for a separate formatting-only commit.
- After formatting, re-check linting/CI checks locally if applicable and include any resulting
  small fixes in the same patch.

These steps help keep the repository consistent with the project's Prettier settings and
prevent style-only diffs from appearing later in reviews or CI.

## Git Safety Protocol

- NEVER update git config
- NEVER run destructive commands (--force, hard reset) without explicit request
- NEVER skip hooks (--no-verify) unless user asks
- NEVER force push to main/master
- If commit fails due to hooks, fix and create NEW commit (don't amend)
