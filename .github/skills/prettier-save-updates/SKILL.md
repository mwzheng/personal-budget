---
name: prettier-save-updates
description: "Always format modified files with Prettier before saving updates. Use when creating, modifying, or updating any file in this repository. Triggers on save/write/update operations. Ensures consistent code style with the project's Prettier configuration."
license: MIT
---

# Prettier Save Updates Skill

## Core Rule

**Before saving ANY modified or new file, always run Prettier to apply formatting.** This is mandatory for every update session — not optional, not "if convenient", but a required step before writing files to disk.

## When This Skill Applies

- Creating new source files (`.ts`, `.tsx`, `.js`, `.jsx`, `.json`, `.css`, `.html`, `.md`)
- Modifying existing source files
- Updating configuration files (`.eslintrc`, `tsconfig.json`, etc.)
- Any write/save operation in this repository

## Workflow: Save with Prettier Formatting

### Step 1: Before Writing Files — Check for Prettier

First, check what formatting tooling is available in the project:

```bash
# Check for a format script in package.json
grep -E '"format"|"prettier"' package.json

# Or look for a prettier config file
ls .prettierrc* prettier.config.* 2>/dev/null
```

### Step 2: Run Prettier Before Saving

Choose the appropriate method based on what's available in the project:

**Option A — Project format script (preferred):**

```bash
pnpm format
# or
npm run format
```

**Option B — Use the installed prettier directly:**

```bash
npx prettier --write <file-path>
pnpm exec prettier --write <file-path>
```

**Option C — Format all changed files from git status:**

```bash
git diff --name-only --diff-filter=M | xargs npx prettier --write
```

**Option D — Use the project's package manager if available:**

```bash
pnpm dlx prettier --write .
```

### Step 3: Save Modified Files

After running Prettier, the files are now correctly formatted. Proceed to save/update as needed.

## Quick Reference Command

In most cases, this single command is sufficient:

```bash
npx prettier --write <file1> <file2> ...
```

Or format all project files at once:

```bash
pnpm exec prettier --write .
```

## Why This Matters

- Consistent code style across the entire codebase
- Prevents style-related CI failures
- Makes code reviews cleaner and faster
- Reduces noise in diffs (no formatting-only changes later)

## Reminder Checklist

Before confirming that files have been updated:

- [ ] Prettier has been run on all modified files
- [ ] No obvious formatting errors were reported
- [ ] Any Prettier warnings were addressed

**Never save unformatted code. Always run Prettier first.**
