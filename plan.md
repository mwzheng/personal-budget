# Porridge Budget Development Plan

## Status: Active follow-up plan (updated 2026-05-28)

Latest completed work:

- Completed Progress page UX polish: added HistoryTabs (tabbed RetirementList /
  SalaryList panel with persistent mount), fixed GoalEditor staleness via
  refreshTrigger, added dashed goal ReferenceLine + compact YAxis formatter to
  charts, and replaced flat icon backgrounds with alpha-tinted circles.
- Removed the home-page feature card links so the cards stay informative and
  visually polished without behaving like login CTAs.
- Added a custom App Router 404 page with clear not-found copy, a manual route
  back home, and an automatic redirect to the home page after a short delay.
- Aligned the Progress Goal editor, shared types, demo handlers, and route tests
  around the current unnamed single-target goal model so the post-review state is
  internally consistent.
- Added a mobile-friendly AppNav drawer for smaller screens while keeping the
  desktop tab layout, and made Register a distinct primary CTA.
- Added home-page hero CTAs, polished feature icons with tinted circular
  treatments, and made feature cards clickable with clearer sign-in/demo
  affordances.
- Added a reusable `PageHeader` component for page-level consistency, increased
  footer breathing room, and extracted shared server-safe theme tokens for the
  About and FAQ pages.
- Added subtle previous-period trend indicators to the reports summary cards and
  exposed a mobile toolbar action for adding transactions without relying on the
  floating FAB alone.
- Added consistent empty-state icons across the remaining list screens and
  improved `ConfirmDialog` loading feedback with an in-button spinner and
  accessible busy state.
- Removed the standalone Savings Goals page/API/demo flow while preserving the
  separate Progress Goal used by the Progress page.
- Updated shared copy, route metadata, DynamoDB/demo helpers, and tests to
  reflect the removed standalone goals feature.
- Made the monthly chart totals adapt to density so labels rotate diagonally for
  crowded month ranges and remain readable when many bars are shown.
- Fixed the stacked spending total label in the monthly chart and tightened the
  gap between that chart and its legend so the plot area uses more vertical
  space.
- Tightened the reports chart sizing so Top Spending Tags shows only the top 10
  tags with less wasted left space, the spending breakdown chart is larger and
  vertically centered, and the monthly bar chart is slightly taller.
- Swapped the reports chart layout so Top Spending Tags appears in the upper
  card slot and the monthly spending/income chart sits below with totals shown
  above every major bar.
- Expanded the reports monthly chart to show savings as its own bar alongside
  the stacked Need/Want spending bar and the income bar.
- Updated the reports spending-vs-income chart so monthly spending is broken
  into stacked Need and Want segments while income remains a separate bar.
- Fixed the reports month-comparison/card rendering warning and deferred
  calendar month navigation to avoid the FullCalendar `flushSync` console error.
- Added income-aware reporting so the reports page can import income CSVs,
  filter income transactions, and chart monthly spending versus income.
- Reviewed the full application for outdated copy and documentation.
- Updated shared home/about/FAQ content to reflect the current feature set and
  creator profile.
- Refreshed `README.md` and `docs/aws-credentials.md` to match the current app.
- Cleaned the plan files and added `docs/future-feature-ideas.md` as a dedicated
  backlog for product ideas.

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
