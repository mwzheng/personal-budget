---
description: "Ensure Prettier is applied automatically to files modified by the agent."
applyTo: "**/*.{ts,tsx,js,jsx,md,json,css,scss,html}"
---

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
