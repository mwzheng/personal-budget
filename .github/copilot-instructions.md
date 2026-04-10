# Copilot Instructions for Porridge Budget Project

This file is the top-level guidance for GitHub Copilot when working on the Porridge Budget application. It provides project context and high-level rules; detailed, per-topic rules live under `.github/instructions/` and take precedence when present. When new skills or instruction files are added, update this document to reflect them.

## Available Copilot skills (local agent capabilities)

The repository exposes specialized Copilot skills that can (and should) be used when relevant. If a user's request maps to a skill, invoke that skill immediately as the first tool action.

- `add-educational-comments` — Add educational comments to the specified file or prompt for a file when none is supplied.
- `documentation-writer` — Diátaxis-style documentation expert for producing structured docs and guides.
- `first-ask` — Interactive task refinement workflow to clarify scope before implementation (requires Joyride).
- `git-commit` — Create git commits with intelligent staging and conventional commit messages.
- `javascript-typescript-jest` — Generate and improve JavaScript/TypeScript tests using Vitest (primary) or Jest, including mocking strategies and best practices.
- `make-skill-template` — Scaffold a new Copilot skill template.
- `mentoring-juniors` — Socratic mentoring workflow for teaching and guiding junior developers.
- `prd` — Generate Product Requirements Documents (PRDs) with structure and acceptance criteria.
- `prompt-builder` — Help craft high-quality prompts for Copilot and other LLMs.
- `update-implementation-plan` — Update or create implementation plans (plan.md) from new requirements.
- `devops-rollout-plan` — Help plan and execute DevOps rollouts including environment changes, deployment strategies, runbooks, and rollout checkpoints.
- `web-coder` — Expert-level web development assistant for HTML/CSS/JS and modern web patterns.
- `web-design-reviewer` — Visual design reviewer for UI layout, accessibility, and responsiveness.

Guidance: when multiple skills are relevant, prefer the most specialized one (for example, use `javascript-typescript-jest` for test-related tasks rather than a general web-coder).

## Local instruction files (authoritative)

Detailed rules are kept in `.github/instructions/`. Always open and follow the relevant file before making changes. Examples in this repository include:

- `devops-core-principles.instructions.md` — DevOps core principles (CALMS, DORA metrics) and cultural guidance.
- `github-actions-ci-cd-best-practices.instructions.md` — CI/CD workflow guidance and GitHub Actions best practices.
- `reactjs.instructions.md` — React component and testing guidance.
- `code-review-generic.instructions.md` — Generic code review checklist and reviewer guidance.
- `typescript-5-es2022.instructions.md` — TypeScript 5 / ES2022 guidelines, typing, and async patterns.
- `update-docs-on-code-change.instructions.md` — When and how to update documentation when code changes.
- `html-css-style-color-guide.instructions.md` — HTML/CSS styling and color guidance.
- `nextjs.instructions.md` — Next.js App Router best practices.
- `performance-optimization.instructions.md` — Performance optimization guidelines for frontend and backend.
- `commit-authoring.instructions.md` — Commit author enforcement and commit message rules.
- `context-engineering.instructions.md` — Guidance on project structure and context engineering for AI assistance.

If this top-level file conflicts with a per-topic instruction, the per-topic file wins. Keep `.github/instructions/` in sync with repository needs.

## Project overview

- Purpose: Build a personal budgeting application to track income, expenses, and savings goals.
- Tech stack:
  - Frontend: Next.js + TypeScript (App Router preferred)
  - UI: Material-UI (MUI)
  - Backend: AWS Lambda (TypeScript) with API route handlers
  - Auth: AWS Cognito
  - Database: AWS DynamoDB
  - Deployment: Serverless Lambdas (SAM/Serverless Framework) and static frontend hosting (Vercel/Netlify/S3)

## Development guidelines (high level)

- Prefer TypeScript 5 and an ES2022 baseline; add explicit types for public APIs.
- Keep UI components reusable, accessible, and theme-aware (MUI). Use hooks and modern React patterns.
- Keep backend logic in small, testable Lambda handlers and shared `lib/` modules.
- Interact with DynamoDB using AWS SDK v3 and typed models.
- Use environment variables for configuration; never commit secrets.
- Add unit tests, integration tests, and snapshot tests where appropriate; use `javascript-typescript-jest` skill for test scaffolding when helpful.
- Use Redux Toolkit for complex app state; prefer local state and React Query for server state where it fits.
- Follow the repository formatting rules: run the `format` script if present (e.g., `pnpm format` or `npm run format`) or run Prettier (`pnpm dlx prettier --write .` / `npx prettier --write .`) after edits.

## Code change and commit rules

- Run the repository's format script or Prettier after making edits and include formatting changes in the same commit.
- Run existing linters and tests locally (or in CI) before committing when feasible.
- When creating git commits via automation or agents, include this trailer in the commit message:

  Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>

- Prefer small, focused commits with conventional commit messages (use the `git-commit` skill when appropriate).

## AI interaction and tool usage

- When the user asks about Copilot/CLI capabilities, call `fetch_copilot_cli_documentation` first and base answers on its output.
- Before creating a plan or making code changes, if any requirement or ambiguity exists, use the `ask_user` tool to get clarification. Ask one focused question at a time and prefer multiple-choice where possible. Do not proceed with implementation until outstanding clarifying questions are resolved.
- During implementation: after making changes, refactor and review them, then run repository checks (format, lint, tests, build) locally or in CI before committing. Suggested commands: `pnpm dlx prettier --write .` (or `pnpm format`), `pnpm lint`, `pnpm test --run`, `pnpm build`.
- Always commit changes with meaningful, focused commit messages. Multiple commits are allowed and encouraged for logically separate changes. When automation or Copilot assists with commits, include the Co-authored-by trailer: `Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>`.
- Use the `ask_user` tool for any further clarifying questions during implementation; continue to ask one focused question at a time and prefer multiple-choice where possible.
- When calling tools, report intent via the `report_intent` tool on the first tool-calling turn and when changing phases; use a short gerund phrase (<=4 words), e.g., `Updating instructions`.
- If a specialized skill applies to the request, invoke the `skill` tool immediately as the first action (do not wait to produce text output first).

## Common tasks (summary)

- Pages/screens: transactions, budgets, reports, settings
- API/Lambda: CRUD for transactions, budgets, and user data
- Data import/export: CSV import/export (see `dev-sample-data/`) with validation and server-side upsert
- Charts: spending-over-time, budget allocation, investment progress
- CI/CD: GitHub Actions workflows should run tests, linting, and formatting before deploys (see `.github/instructions/github-actions-ci-cd-best-practices.instructions.md`)

## When to update this file

- Add new skills to the "Available Copilot skills" list when they are added to the repository.
- Add or update references to per-topic instruction files when those files change.
- Keep the commit/format guidance current with repository scripts (e.g., update instructions if the repo switches package manager or adds a different format script).

- Plan update rule (REQUIRED): When work or a todo is completed, update BOTH `plan.md` and `plan.completed.md` in the SAME commit. Do not leave one file updated without the other. This keeps the active plan and the completed history synchronized and audit-friendly.
  - Required steps when marking work complete:
    1. Edit `plan.md` to remove (or clearly mark as moved) the completed item so the active plan reflects only pending work.
    2. Append a detailed entry to `plan.completed.md` that includes at minimum:
       - Date (YYYY-MM-DD)
       - Short summary title
       - Completed items list (brief bullets)
       - Files changed (paths)
       - Commit message or commit SHA reference
       - Any notes or next steps
    3. Stage and commit both files in the same commit. Include the usual commit trailer:
       `Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>`
    4. Run the repository format/lint checks (pre-commit hooks) before pushing. If hooks fail locally, fix hooks (`pnpm install` && `pnpm run prepare`) rather than bypassing them.
    5. If the project uses the session todos database, also update the `todos` table (set status = 'done') and add any `todo_deps` changes in the same work session.

  - Automation guidance:
    - Use the `update-implementation-plan` skill when available to automate creating/updating the `plan.md` and `plan.completed.md` entries.
    - If making code changes programmatically, prefer to include the plan updates in the same patch/PR so reviewers can see what was removed from the active plan and why.

  - Rationale: Keeping `plan.md` (the active plan) and `plan.completed.md` (the authoritative record of done work) synchronized prevents drift, eases reviews, and makes it straightforward to audit progress and revert if necessary.

---

Keep this file concise; prefer moving long or detailed rules into `.github/instructions/` so they can be edited per topic.
