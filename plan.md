<!-- Note 1: Development plan: living document for roadmap and todos. Updated 2026-03-08 to record documentation work and new test/CI todos. Updated 2026-03-09: Copilot instruction index updated (commit 9db76bb). Updated 2026-03-12: reports default-year persistence, quick tag filtering, report chart/filter polish, and the progress module code-quality refactor pass moved to plan.completed.md. Updated 2026-03-15: budget planner UI polish, latest-saved-budget restore, the path-based Sankey follow-up, and the browser-only demo sign-in flow moved to plan.completed.md. Updated 2026-03-16: signed-out nav cleanup plus auth-page demo CTA copy simplification moved to plan.completed.md. Updated 2026-03-17: refresh-token-sensitive auth guard now checks stored refresh tokens, the public-pages/calendar/contact feature cleanup plus its footer/nav/copy polish follow-up have moved to plan.completed.md, and the latest About/Contact/Home polish plus reports/progress/salary chart-loading readability pass are also recorded there. Updated 2026-03-21: page-width expansion, standardized action icon buttons/tooltips, budget row-load polish, and the SEO/accessibility cleanup pass moved to plan.completed.md. Updated 2026-03-23: the Google Analytics host-policy hardening pass and follow-up pageview queue fix moved to plan.completed.md. Updated 2026-03-25: transaction modal defaults, commit-authoring rules, and progress page visual overhaul moved to plan.completed.md. Updated 2026-03-26: the repository-wide cleanup pass (shared utility extraction, module splits, UI consistency work, Copilot docs cleanup, and expanded route/CSV coverage) moved to plan.completed.md. Updated 2026-03-27: the reports-view persistence, calendar readability polish, home-page feature-heading cleanup, CSV template download, Sankey readability pass, FIRE scenario-card hover/delete polish, and the FIRE hydration mismatch follow-up moved to plan.completed.md. -->

## Status: Active follow-up plan (updated 2026-03-27)

Latest completed work: The FIRE hydration mismatch follow-up is complete and
recorded in `plan.completed.md` alongside the recent reports/home/Sankey polish
pass and the FIRE saved-scenario card hover/delete alignment work. The latest
follow-up tightened the extension-cleanup mitigation for Dark Reader-style DOM
mutations and removed a timezone-sensitive FIRE summary date formatting path.

Current active follow-ups are intentionally narrow:

- Add direct coverage for `app/api/budgets/[id]/route.ts` (PUT/DELETE).
- Decide and document the DynamoDB integration-test strategy for CI/local work.
- Add a lightweight Budgets → Sankey E2E smoke test once the preferred test
  infrastructure is chosen.

# Development Plan for Porridge Budget

This document outlines a phased roadmap and detailed considerations for building the personal budgeting application.

Developer process note: When work is completed, update both `plan.md` and `plan.completed.md` in the same commit. Remove completed items from `plan.md` and append them to `plan.completed.md` so both files stay synchronized and act as the authoritative record of progress.

## 🚀 Phase 1 – Foundation

1. **Repository setup**
   - Initialize Next.js + TypeScript project (`pnpm create next-app --typescript`).
   - Add Prettier config and enforce via lint/pre‑commit hook.
   - Install MUI, Redux Toolkit, and chart library of choice.

2. **Authentication & infra**
   - ✅ Provision Cognito user pool — deployed via SAM (`us-east-1_p3sQWF56J`).
   - ✅ Create DynamoDB table (`pk=userId`, `sk=date#transactionId`, on-demand billing) — deployed via SAM (`personal-budget-infra-dev-transactions`).
   - Write IAM roles for Lambdas to access Cognito + DynamoDB.
   - Favor configuration and usage patterns that stay within AWS free-tier limits (e.g. limit log retention, remove unused resources).

3. **State management**
   - Scaffold Redux store + `authSlice` handling tokens.
   - Create `transactionsSlice` with `createAsyncThunk` for CRUD.
   - Wire Redux into Next.js using `next-redux-wrapper` or similar.

4. **API layer**
   - Build Lambda/API routes for transactions: list (with filters), create, update, delete.
   - Support CSV import/export endpoints (parse/serialize to DynamoDB).
   - Add middleware to verify Cognito JWT and attach `userId`.

5. **Core UI components**
   - `FilterBar` component (date picker, year selector, category/tag dropdowns, search).
   - `TransactionsTable` using MUI DataGrid with column filters & sorting.
   - `SpendingChart` component that aggregates props data and respects range selector.
   - Light/dark theme toggle stored in Redux or context, applied via MUI theme provider.

---

## 📅 Phase 2 – Secondary pages & features

6. **Budget planner page**
   - Form for category/amount entries.
   - Real‑time pie‑chart preview updating as user types.

7. **Investment progress page**
   - Input table for year‑by‑year values.
   - Chart/table visualization of growth (line/bar with labels).

8. **CSV import/export UI**
   - File-selector component with validation.
   - “Download current view” button that calls export API.

9. **Year‑to‑year filter support**
   - Enhance filters to include a quick year selector and apply to both table/chart.

---

## 🧩 Phase 3 – Robustness & polish

10. **Validation & error handling**
    - Client‑side form validation with schema (zod/yup).
    - Server validation and proper HTTP error responses.

11. **Pagination / performance**
    - Implement server‑side pagination or infinite scroll for large transaction sets.
    - Optimize chart aggregation queries (maybe pre‑compute monthly totals).

12. **Accessibility & responsive design**
    - Add ARIA labels, keyboard navigation to tables, and ensure mobile layouts work.

13. **Testing**
    - Unit tests for slices, utils, and components.
    - Integration tests for CSV flows and auth (mock Cognito/DynamoDB).
    - Snapshot tests for charts.

14. **Monitoring & security**
    - CloudWatch logs/metrics for Lambdas.
    - Alerts on DynamoDB consumption errors.
    - Sanitize all inputs to avoid injection in filter expressions.

15. **Deployment pipeline**
    - GitHub Actions workflow deploying to AWS (different stages).
    - Pipeline must run all unit/integration tests, linting, and formatting checks; deployment only triggers when jobs pass.
    - ✅ SAM template and `deploy-sam.sh` script provision Cognito, DynamoDB resources; `deploy:infra` / `deploy:infra:prod` npm scripts added.
    - Lambda function resources still need to be added to the SAM template when Lambda API routes are implemented.

---

## Reports & Sankey Budget Plan (STATUS)

Status: Local implementation complete (reports + sankey). AWS infrastructure (DynamoDB + Cognito) deployed via SAM — stack `personal-budget-resources` live in `us-east-1`. Next priority: wire API routes to DynamoDB with Cognito JWT middleware, and build user data management (localStorage CRUD → DynamoDB).

Completed work (moved): The full details of the recent completed work (Reports & Sankey implementation, infra provisioning and documentation, repository-wide educational comments, Husky + lint-staged setup and fixes, build & dev smoke-testing, related code quality fixes, the 2026-03-12 reports default-year persistence plus the follow-up quick tag filtering and chart/filter layout polish passes, and the 2026-03-12 progress module refactor/cleanup pass) have been moved to `plan.completed.md`. See the top of `plan.completed.md` for a consolidated record and per-feature entries. Additionally, Budgets API & UI wiring was completed on 2026-03-08 and its details are recorded in `plan.completed.md`.

Remaining / next priorities (high level):

- Completed (implemented):
  - User data management (localStorage CRUD, transaction add/edit/delete, CSV import/export UI, transaction forms) — wired into Reports UI and client-side flows.
  - AWS infra (Cognito + DynamoDB) provisioned via SAM and documented; `.env.local` values available in `infra/SAM-DEPLOY.md`.
  - API persistence wired to DynamoDB for transactions, budgets (basic), goals, and salary APIs with per-user access via Cognito JWT.
  - Sankey generation and Budget UI scaffold (create/list) implemented; selecting a saved budget posts allocations to `/api/sankey` and renders the Sankey chart.
  - CI basics, sample datasets, CSV import/export routes, and local auth helpers are implemented (see `plan.completed.md`).
  - Husky pre-commit hook and post-commit author enforcement hook added; Prettier formatting runs on staged files via lint-staged.
  - Client-side auth refresh flow implemented in `lib/apiFetch.ts` (refresh on 401/403 using refresh_token).

- Pending (next priorities):
  1. Decide DynamoDB test mocking strategy (todo: decide-dynamodb-mock-strategy) — choose between AWS SDK client mocks, LocalStack, or an in-memory DynamoDB for CI and local integration tests; document the trade-offs and the expected developer workflow.
  2. Extend Budgets endpoint coverage to the item route (`app/api/budgets/[id]/route.ts`) so PUT/DELETE behavior is covered as directly as the collection route.
  3. Add E2E smoke tests for the Budgets → Sankey flow (todo: add-budgets-e2e-smoke-tests) — create a minimal create → edit → select → preview → delete path.
  4. Migrate from `next lint` to the standalone ESLint CLI before the Next.js 16 upgrade so the repository is ahead of the deprecation.

Immediate next steps (developer tasks):

1. Decide and document the DynamoDB testing approach (client mocks vs LocalStack vs in-memory) — add a short RFC describing CI implications and local setup.
2. Add direct route tests for `app/api/budgets/[id]/route.ts` (PUT/DELETE) using the existing route-test mocking patterns.
3. Add a lightweight E2E smoke test for the core Budgets → Sankey flow once the preferred browser-test runner is selected.
4. Migrate the lint script from `next lint` to ESLint CLI and verify the same rules continue to run in CI.
5. After the test strategy is settled, consider adding coverage reporting and an optional smoke stage to CI.

(Completed work moved to `plan.completed.md` — keep that file as the authoritative record of done items.)

---

## User Data Management — Implementation Plan

### Goal

Move from the static sample-CSV data source to server-persisted, per-user data in DynamoDB (DynamoDB-only). Users should be able to:

- Add, edit, and delete individual transactions via authenticated server APIs and UI forms.
- Import CSVs via a server-side parser that persists transactions to DynamoDB and returns an import summary.
- Export filtered datasets via server-side CSV generation.
- Create and manage named budgets saved per-user and generate Sankey graphs from a saved budget or from recent aggregates.
- Create and track financial goals with progress and estimated time-to-goal.
- Run savings projections and track salary history (manual per-year entries) with year-over-year changes.

### Architecture Overview

| Layer       | Current                                                                                                      | Remaining follow-up work                                                                 |
| ----------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Data source | Reports/transactions are loaded from Cognito-scoped server APIs backed by DynamoDB or demo-only sample data. | Add optional offline sync mode without reintroducing cross-account leakage.              |
| CSV import  | `POST /api/reports/import` imports CSV rows into the authenticated user's account.                           | Add duplicate-aware upsert and richer row-level validation feedback.                     |
| CSV export  | `GET /api/reports/export` generates CSV server-side for the authenticated user's filtered data.              | Add larger-export ergonomics (streaming / background jobs) if exports become very large. |
| CRUD        | Transaction CRUD runs through authenticated server APIs keyed by Cognito `sub`.                              | Add broader endpoint coverage and E2E smoke tests.                                       |

Additional entities stored in DynamoDB (separate tables recommended initially):

- Budgets table: `personal-budget-infra-dev-budgets` (PK = userId, SK = budgetId)
- Goals table: `personal-budget-infra-dev-goals` (PK = userId, SK = goalId)
- Salary table: `personal-budget-infra-dev-salary` (PK = userId, SK = year#entryId)

(Current implementation uses a single-table design with `pk = user#${userId}` and `sk` prefixes for entity types — e.g., `date#<date>#<txId>`, `budget#<budgetId>`, `goal#<goalId>`, `salary#<year>#<entryId>`). Budgets are stored as items with `sk = budget#<budgetId>` and an `allocations` array; see `lib/dynamo.ts` (putBudget/getUserBudgets) and `lib/budgets.ts` for conversion helpers.

### Files to Create

| File / Path                      | Purpose                                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------- |
| `lib/dynamo.ts`                  | DynamoDB client helper and small wrappers for common operations (query, get, put, update, delete) |
| `app/api/transactions/*`         | Transaction CRUD endpoints (list, create, update, delete) with filters, pagination and aggregates |
| `app/api/reports/import`         | CSV parse + persist endpoint (validates rows, writes to DynamoDB, returns summary)                |
| `app/api/reports/export`         | Server-side CSV generation endpoint for filtered queries                                          |
| `app/api/budgets/*`              | Budgets CRUD endpoints (create/list/get/update/delete)                                            |
| `app/api/goals/*`                | Goals CRUD endpoints and ETA/time-to-goal compute                                                 |
| `app/api/salary/*`               | Salary history CRUD endpoints                                                                     |
| `lib/budgets.ts`                 | Utilities to convert budget allocations into Sankey nodes/links                                   |
| `components/BudgetForm.tsx`      | Create/Edit budget dialog                                                                         |
| `components/BudgetList.tsx`      | Budget selector and management UI                                                                 |
| `components/GoalForm.tsx`        | Create/Edit goal dialog                                                                           |
| `components/GoalList.tsx`        | Goals list and progress UI                                                                        |
| `components/ProjectionForm.tsx`  | Savings projection input UI                                                                       |
| `components/ProjectionChart.tsx` | Chart for projection results                                                                      |
| `components/SalaryForm.tsx`      | Manual per-year salary entry form                                                                 |
| `components/SalaryChart.tsx`     | Year-over-year salary visualization                                                               |

### Files to Update

- `components/TransactionsTable.tsx` — wire Edit/Delete actions to API calls and add server-aware pagination.
- `infra/SAM-DEPLOY.md` — document new tables and required IAM policy changes; update deploy scripts if needed.

### Key Design Decisions

- Use Cognito for authentication; use Cognito `sub` as `userId` (partition key) for per-user data.
- Start with separate DynamoDB tables for budgets, goals, and salary for clarity; consider consolidating to a single-table design later.
- Budget model: `{ budgetId, name, monthlyIncome, expenses: [{ expenseId, name, amount, category, group? }], allocations, createdAt, updatedAt }`, where `allocations` remains as a compatibility field for older saved-budget readers.
- Sankey generation: `lib/budget-planner.ts` derives grouped Sankey nodes/links plus pie-chart slices from the same expense list so the budget page can preview both views without a separate generate step.
- Goals model: `{ goalId, name, targetAmount, currentSaved, monthlyContribution, expectedAnnualReturn, createdAt }` — server returns ETA based on assumptions.
- Salary entries: manual per-year entries `{ year, amount, note }`; compute YoY percentage changes server-side or client-side as needed.
- Validation: use Zod on server endpoints to validate inputs and return structured errors.

### Todos (ordered)

1. Re-enable stricter ESLint & TypeScript rules — (todo: reenable-eslint-strict).
2. Decide DynamoDB test mocking strategy — (todo: decide-dynamodb-mock-strategy).
3. Add unit & integration tests for the remaining Budgets item endpoints (PUT/DELETE) after the collection-route GET/POST coverage — (todo: add-budgets-endpoint-tests).
4. Add E2E smoke tests for Budgets → Sankey flow — (todo: add-budgets-e2e-smoke-tests).
5. Create feature branches & open PRs for re-enable-eslint and test work — (todo: create-feature-branches).
6. Add CI job to run budgets endpoint tests and optional E2E smoke stage (mocked) — (todo: ci-add-budgets-tests).

(Completed work has been moved to `plan.completed.md`.)

### Notes & considerations

- Core per-user report isolation was completed on 2026-03-13: the reports page now reads/writes/imports/exports through authenticated APIs, and shared sample data is restricted to explicit demo mode only.
- If offline support is desired later, design an IndexedDB sync mechanism after server APIs are stable.
- Ensure IAM roles grant only the necessary permissions for required tables and operations.
- Add integration tests that exercise Cognito-authenticated flows (using test accounts or mocked authorizers).

---

## 📌 Ongoing / future enhancements

- Offline support via IndexedDB and sync logic.
- Export charts as images/PDF.
- Drag‑and‑drop reordering, keyboard shortcuts.
- Mobile app or API for external clients.
- Internationalization/currency formatting.

💡 _Keep this plan updated as the project evolves; it serves as a living spec for the team and Copilot._

---

## Additional recommended items

### Security, privacy & compliance

- Enforce authentication and authorization on all API routes; implement role-based access control (RBAC) if multi-role features are needed.
- Validate and sanitize all inputs (use Zod or similar) and implement rate limiting to protect endpoints.
- Use TLS for all traffic; ensure DynamoDB encryption at rest and store secrets in AWS Secrets Manager or Parameter Store.
- Implement a data-retention & deletion policy (support user data export and deletion to meet GDPR/CCPA requirements).
- Maintain audit logs for sensitive actions and access to user data; keep immutable logs where practical.
- Integrate SCA (software composition analysis) and SAST (static analysis) into CI (dependency-review-action, CodeQL, Snyk as options).

### Operational & observability

- Produce structured logs with correlation IDs; export logs to CloudWatch/ELK and instrument tracing (OpenTelemetry) for cross-service traces.
- Define key metrics and dashboards: API latency, report generation time, error rates, transaction counts, cache hit ratios; configure alerts for thresholds.
- Define SLOs and SLIs (example: 95th-percentile aggregated-report latency < 500ms for typical queries; error rate < 1%).
- Backups and restore strategy for DynamoDB or export snapshots; monitor provisioned/consumed capacity and set alerts to avoid throttling.

### API contracts & TypeScript interfaces

- Add explicit TypeScript interfaces for request/response shapes and surface them in the repo (examples below):

```ts
interface ReportTransaction {
  id: string;
  userId: string;
  date: string; // ISO YYYY-MM-DD
  amount: number;
  type: "expense" | "income";
  category: string;
  categoryType?: "needs" | "wants" | "savings";
  tags?: string[];
  paymentMethod?: string;
  notes?: string;
}

interface ReportsAggregates {
  totalAmount: number;
  totalByCategoryType: { needs: number; wants: number; savings: number };
  totalByCategory: Record<string, number>;
  timeseries: { period: string; amount: number }[];
  categoryDiagramData: { id: string; value: number }[];
}

interface ReportsResponse {
  transactions: ReportTransaction[];
  totalCount: number;
  aggregates: ReportsAggregates;
}

interface SankeyResponse {
  sankeyData: {
    nodes: { id: string }[];
    links: { source: string; target: string; value: number }[];
  };
  budgetSuggestion: Record<string, number>;
}
```

- Standardize error responses: { error: { code: string, message: string } }.
- Pagination defaults: pageSize=50, maxPageSize=1000; enforce reasonable max date ranges (e.g., 5 years default cap) on the API.

### CSV import/export

- Standard CSV header sample: date,description,amount,category,tags,payment_method,notes,type
- Validate CSV on upload and return per-row errors in a preview step; support idempotent upsert to avoid duplicates.
- Version the CSV schema and include migration/compatibility notes in docs.

### Caching & pre-aggregation

- Cache per-user aggregated responses (short TTL, e.g., 5–15 minutes) and use cache keys that include filter params.
- For heavy workloads, maintain pre-aggregated monthly/weekly metrics in a separate table or materialized view to serve charts quickly.
- Invalidate or update aggregates and caches on transaction create/update/delete operations.

### Feature flags & rollout

- Gate major features behind environment toggles or a feature-flag service for safe rollouts and experiments (env flags for dev/staging, LaunchDarkly/Unleash if managed service desired).
- Plan canary releases for UI or backend features and monitor metrics before full rollout.

### Offline & error states

- Provide IndexedDB (or localForage) offline cache and a sync strategy; define conflict resolution rules (last-write-wins or merge with user confirmation).
- Design explicit empty/loading/error states in UI for each chart and table and show helpful recovery actions.

### Localization & currency

- Store user locale and currency preference; format numbers and dates using Intl APIs.
- Consider storing currency per-transaction if the app will import multi-currency data; include conversion rules if needed.

### Developer & QA process

- Add representative sample datasets (small/medium/large) in sample-data for frontend and perf testing: expenses_small.csv, expenses_medium.csv, expenses_large.csv.
- Define unit, integration, and E2E test suites (Jest + React Testing Library; Playwright/Cypress) and performance tests (k6) for nightly runs.
- Set coverage targets (e.g., 80% for unit tests) and require critical tests to pass in CI before deploy.

### CI/CD, staging & rollback runbook

- CI pipeline: lint -> test -> build -> deploy to staging -> run smoke tests -> manual approval -> deploy to production.
- Use OIDC for cloud provider authentication in CI; require manual approvals for production deployment.
- Define automated rollback triggers (e.g., error rate spike, latency threshold breaches) and keep previous artifacts available for quick rollback.

### Acceptance metrics & benchmarks

- Latency: 95th-percentile aggregated-report latency < 500ms for queries covering <= 1 year or <= 2000 transactions.
- Error rate: < 1% for report API under normal load.
- Accuracy: aggregation tolerance <= 0.1% (floating point rounding allowed).

---

## Data retention policy (default)

Default policy: Indefinite (no automatic deletion). Users may request data export or deletion via account settings or support; implement manual or on-request deletion workflows and document steps in the privacy policy.
\n- Completed reorg of lib into subfolders (2026-03-17)
