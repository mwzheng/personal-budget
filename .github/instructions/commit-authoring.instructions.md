# Commit author enforcement

This repository enforces a consistent commit author for new commits using a Husky post-commit hook.

Behavior

- The post-commit hook will ensure that the most recent commit's author matches the repository's configured git user.name/user.email. If the repo-level config is not set, it falls back to the user's global git config.
- The hook will amend the HEAD commit to set the desired author when it differs. This is idempotent and will not loop indefinitely (the hook checks the author before amending).
- To explicitly override the author used by the hook, set the following environment variables before committing:
  - `COMMIT_AUTHOR_NAME` (e.g., `export COMMIT_AUTHOR_NAME="Your Name"`)
  - `COMMIT_AUTHOR_EMAIL` (e.g., `export COMMIT_AUTHOR_EMAIL="you@example.com"`)

How to use

1. Ensure your git identity is set (preferred):

```bash
# Set repository-local identity (preferred for this repo)
git config user.name "Your Name"
git config user.email "you@example.com"

# Or set globally (affects all repos)
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

2. Install dependencies to activate Husky hooks (if not already installed):

```bash
pnpm install
```

3. The hook runs automatically after commits and will amend the commit author when needed. Avoid `--no-verify` unless you know what you are doing.

Notes

- Amending the commit will change the commit SHA for the amended commit. Avoid amending commits that have already been pushed to shared branches without coordinating with others.
- If Husky hooks are not installed (hooks missing), run `pnpm install` to trigger the repository `prepare` script which runs `husky install`.

## Commit message quality

Every commit message must be meaningful and accurately describe the change it contains.

- **Use conventional commit format**: `<type>(<scope>): <short summary>`
  - Common types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `style`
  - Scope is optional but recommended when targeting a specific area (e.g., `feat(transactions): ...`)
  - Summary is imperative, present tense, lowercase, no trailing period
- **Make multiple commits when necessary**: If a session produces logically distinct changes, split them into separate commits rather than bundling everything into one. Each commit should represent a single coherent unit of work.
- **Avoid vague messages**: Messages like `fix stuff`, `updates`, or `wip` are not acceptable.
- **Always include the Co-authored-by trailer** when commits are created by or with Copilot assistance:
  ```
  Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
  ```

Examples of good commit messages:

```
feat(transactions): default date to today and category to Need

fix(auth): handle expired token on silent refresh

refactor(api): extract shared error handler into lib/api/errors.ts

docs(instructions): add commit message quality rules
```
