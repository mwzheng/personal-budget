# Porridge Budget Development Plan

## Status: Active follow-up plan (updated 2026-04-25)

Latest completed work:

- Full-application dark-theme UI/UX redesign (Phases 1–6):
  - Expanded server-theme-tokens.ts with 9 semantic token groups
  - 20+ MUI component overrides in providers.tsx
  - AppNav, Footer, landing page, login, register, reports, sankey, progress, fire pages redesigned
  - All 8 chart components standardized with token-based grid/axis/label colors
  - Auth callback/signout pages polished with Paper card layouts
  - Contact page hero given gradient Paper matching About/FAQ

Current active follow-ups:

1. Decide and document the DynamoDB integration-test strategy for CI and local
   development.
2. Add a lightweight Budgets -> Sankey E2E smoke test once the preferred
   browser-test runner is chosen.
3. Migrate `pnpm lint` from `next lint` to the standalone ESLint CLI ahead of
   the Next.js 16 upgrade.
4. Revisit the highest-value future product ideas after the testing/tooling
   follow-ups above are complete.

## Current application snapshot

- **Public pages:** `/`, `/about`, `/faq`, `/contact`, and auth entry/sign-out
  routes. Home hero CTAs ("Try Demo" / "Sign In") are hidden for signed-in users.
- **Authenticated pages:** `/reports`, `/sankey`, `/progress`, `/salary`, and
  `/fire`.
- **Core capabilities:** transaction CRUD, CSV import/export, month comparison,
  saved budgets with Sankey visualization, salary/progress tracking, FIRE
  projections, and demo mode.
- **Data model:** Cognito-scoped DynamoDB persistence with explicit browser-only
  demo fallbacks.
- **Documentation sources:**
  - `plan.completed.md` — authoritative log of completed work
  - `docs/future-feature-ideas.md` — candidate roadmap and product ideas
  - `README.md` — setup, pages, APIs, and current project state

## Near-term execution priorities

### 1. DynamoDB integration-test strategy

- Choose the default approach for local and CI integration tests:
  AWS SDK client mocks, LocalStack, or local/in-memory DynamoDB.
- Document the workflow, trade-offs, and maintenance cost in repository docs.
- Keep the decision aligned with the current Vitest-based route-test patterns.

### 2. Budgets -> Sankey smoke coverage

- Add one lightweight browser-level flow covering create, load/select,
  visualize, and delete.
- Keep the runner choice aligned with the integration-test strategy decision.
- Prefer a narrow, high-signal smoke path instead of broad E2E coverage.

### 3. Lint/tooling modernization

- Replace `next lint` with ESLint CLI.
- Preserve the current rule coverage and CI behavior.
- Update docs/scripts together so contributors keep one clear validation path.

## Prioritized feature candidates

The broader backlog lives in `docs/future-feature-ideas.md`. The strongest
near-term product candidates are:

1. Recurring transactions
2. Authenticated dashboard / monthly overview
3. Budget vs. actual comparison
4. Transaction tag autocomplete
5. Light/dark theme toggle

## Product and technical considerations

### Security, privacy & compliance

- Enforce authentication and authorization on every user-data API route.
- Keep validating and sanitizing input with Zod or equivalent server-side
  schemas.
- Add user-facing data export/deletion workflows before privacy requirements
  become urgent.
- Prefer short-lived cloud credentials and least-privilege IAM policies.

### Observability & performance

- Define a practical latency/error-rate baseline for report and budget APIs.
- Keep structured logging and CloudWatch-friendly operational visibility in
  place as new server features are added.
- Revisit caching and pre-aggregation only if report scale makes current query
  costs unacceptable.

### Data, exports & offline behavior

- Improve CSV imports with duplicate-aware upsert and row-level validation
  feedback when that work becomes a priority.
- Keep export portability strong; do not regress on user ownership of data.
- If offline support is added later, design it as an explicit sync flow instead
  of falling back to shared sample data behavior.

### QA & deployment

- Keep Vitest route and utility coverage current as features expand.
- Prefer focused smoke coverage over broad flaky E2E suites.
- Ensure CI continues to run lint, tests, and build before deployment steps.

## Data retention policy (default)

Default policy: indefinite retention with manual export or deletion workflows to
be added in account settings or support flows. Document any future retention or
deletion policy changes in both `README.md` and the relevant product docs.

Keep `plan.md` and `plan.completed.md` synchronized in the same commit whenever
work moves from active follow-up to completed history.
