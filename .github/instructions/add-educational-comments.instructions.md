# Add Educational Comments to Code Changes

Purpose

This instruction enforces that educational, developer-facing comments are included inside every source file that is added or modified in the repository. The goal is to keep the codebase self-explanatory: important reasoning, non-obvious choices, algorithms, invariants and trade-offs should be visible where the code lives.

Scope

Applies to all commits that add or modify source files under the repository (TypeScript, TSX, JS, JSX, Python, Go, etc.). It complements existing documentation rules (plan.md, plan.completed.md) and should be followed in every code change.

Rules and guidance

- Always include at least one developer-facing comment inside each new or modified file. Prefer a short top-of-file summary plus inline comments near complex logic.
- Use a consistent comment prefix: `Note N:` (capitalized Note, followed by a space and a short ordinal or number) for educational comments intended for other developers and Copilot-style automation.
- Keep comments focused and factual: explain intent, why a particular approach was chosen, alternatives considered, and any gotchas. Avoid repeating what the code literally does.
- Suggested levels: prefer "detail level 2" and "knowledge level 2" (concise explanation with enough depth to be actionable). Aim for roughly 125% of the original file line count for added explanatory context, but limit added comments to a maximum of ~400 new lines per file.
- For exported APIs, add a JSDoc-style header describing the contract, expected inputs/outputs, and failure modes. For React components include whether the file is a Server or Client component (`'use client'`) and any SSR considerations.
- Do NOT write secrets, credentials, or sensitive data to comments or files.

Format examples

- Top-of-file summary (TypeScript):

```ts
/**
 * Note N: High-level summary of this module's purpose.
 * - Why: explain design decisions or trade-offs
 * - Important invariants: what callers must not violate
 */
```

- Inline note for non-obvious code:

```ts
// Note N: Using an explicit `for` loop here because `Array.reduce` would allocate
// intermediate objects and make the hot path slower in benchmarks.
```

Subagents and automation

- When a specialized subagent (skill) exists and is relevant (for example: `add-educational-comments`, `documentation-writer`, or other repository skills), invoking that subagent to generate or assist with comments is **allowed and encouraged**.
- If a subagent is used:
  - Invoke it as the first action in the toolchain (follow the skill usage rules).
  - Review and lightly edit its output—do not accept generated comments verbatim without verification.
  - Document subagent usage in the commit message or plan.md (short note like: "Used add-educational-comments skill to generate inline notes").

Enforcement & checklist (developer workflow)

When changing files, follow this checklist before committing:

1. Add educational comments in every new or modified file (top-of-file summary + inline where helpful).
2. Run repository formatters and linters (e.g., `pnpm dlx prettier --write` or `pnpm format` if available).
3. If a relevant subagent was used, note that in the commit message and verify suggestions.
4. Update `plan.md` / `plan.completed.md` following repository plan rules when items are completed.
5. Commit changes with a clear conventional commit message.

Rationale

Embedding concise, educational comments with each change reduces bus factor, eases onboarding, and keeps the reasoning close to the code. Allowing subagents speeds the work while preserving human review as the authoritative gate.

---

"Apply these rules with pragmatic judgment—prefer clarity and safety over verbosity."

## Mandatory code review

- All updates or edits must undergo code review by at least one other developer or an assigned reviewer before committing.
- Address reviewer feedback and ensure the code and included educational comments meet the repository checklist (formatting, accuracy, and no sensitive data) before committing.
- When subagents are used to generate comments or other content, reviewers must verify, edit, and approve the generated output; do not commit AI-generated content without human review.
