# Development Plan for Personal Budget App

This document outlines a phased roadmap and detailed considerations for building the personal budgeting application.

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

Summary of what was completed locally during this session:

- Implemented local APIs: `GET /api/reports` (reads sample-data) and `POST /api/sankey` (zod-validated allocations -> sankey nodes/links + budget suggestion).
- Implemented Reports UI (`app/reports/page.tsx`) with `FilterBar`, summary cards, pie/time-series/tag charts, and `TransactionsTable` using client-side filtering against sample-data.
- Implemented Sankey/Budget UI (`app/sankey/page.tsx`) with `SankeyForm` and `SankeyChart` (dynamic import) plus budget breakdown table.
- Added lib utilities (`lib/types.ts`, `lib/csvParser.ts`, `lib/aggregations.ts`).
- Fixed date-fns adapter for MUI: switched to `AdapterDateFnsV3` in `app/providers.tsx`.
- Installed dependencies, verified `pnpm build` succeeded, and smoke-tested the dev server and APIs.
- ✅ Provisioned DynamoDB + Cognito via SAM deploy; documented in `infra/SAM-DEPLOY.md`; added `deploy:infra` / `deploy:infra:prod` scripts to `package.json`.

Remaining / next priorities (high level):

- **User data management:** Implemented localStorage CRUD, transaction add/edit/delete, CSV import/export UI, and transaction forms. Next: wire server APIs to DynamoDB and enforce per-user access with Cognito (server-side pagination, validation, and CSV import persistence).
- Integrate persistence and auth: connect API routes to DynamoDB and enforce user-scoped access via Cognito (or chosen auth provider).
- Add tests (unit, integration, E2E) and CI (GitHub Actions) to protect builds and deployments.
- Add server-side pagination/aggregation and performance tuning for large datasets.
- Improve accessibility, add ARIA labels, keyboard navigation, and mobile layout tweaks.

Immediate next steps for the repository (developer tasks):

1. Implement user data management (localStorage CRUD + CSV import/export UI) — details below.
2. ✅ ~~Create AWS dev resources (Cognito + DynamoDB) and provide env vars for local dev.~~ Done — see `plan.completed.md`.
3. Create `.env.local` with stack output values (`NEXT_PUBLIC_COGNITO_USER_POOL_ID`, `NEXT_PUBLIC_COGNITO_CLIENT_ID`, `DYNAMODB_TABLE_NAME`).
4. Write IAM roles for Lambda functions; implement auth middleware and wire APIs to DynamoDB (replace localStorage with DynamoDB once auth is ready).
5. Add tests and CI; add example large dataset to `sample-data` for perf testing.

(Completed work has been moved to `plan.completed.md`.)

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

| Layer       | Current                                             | After                                                                                   |
| ----------- | --------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Data source | `GET /api/reports` reads `sample-data/expenses.csv` | Server APIs backed by DynamoDB (per-user transactions table `personal-budget-infra-dev-transactions`) |
| CSV import  | API parses CSV but no UI                            | `POST /api/reports/import` parses CSV and writes transactions to DynamoDB; returns preview and import summary |
| CSV export  | API exports CSV but no UI                           | `GET /api/reports/export` generates CSV server-side for filtered queries               |
| CRUD        | None                                                | Transaction CRUD via server APIs with Cognito authentication                            |

Additional entities stored in DynamoDB (separate tables recommended initially):

- Budgets table: `personal-budget-infra-dev-budgets` (PK = userId, SK = budgetId)
- Goals table: `personal-budget-infra-dev-goals` (PK = userId, SK = goalId)
- Salary table: `personal-budget-infra-dev-salary` (PK = userId, SK = year#entryId)

(Consider moving to a single-table design later for scale/efficiency once access patterns are stable.)

### Files to Create

| File / Path                      | Purpose                                                                                              |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `lib/dynamo.ts`                  | DynamoDB client helper and small wrappers for common operations (query, get, put, update, delete)   |
| `app/api/transactions/*`         | Transaction CRUD endpoints (list, create, update, delete) with filters, pagination and aggregates   |
| `app/api/reports/import`         | CSV parse + persist endpoint (validates rows, writes to DynamoDB, returns summary)                 |
| `app/api/reports/export`         | Server-side CSV generation endpoint for filtered queries                                            |
| `app/api/budgets/*`              | Budgets CRUD endpoints (create/list/get/update/delete)                                              |
| `app/api/goals/*`                | Goals CRUD endpoints and ETA/time-to-goal compute                                                   |
| `app/api/salary/*`               | Salary history CRUD endpoints                                                                        |
| `lib/budgets.ts`                 | Utilities to convert budget allocations into Sankey nodes/links                                     |
| `components/BudgetForm.tsx`      | Create/Edit budget dialog                                                                            |
| `components/BudgetList.tsx`      | Budget selector and management UI                                                                    |
| `components/GoalForm.tsx`        | Create/Edit goal dialog                                                                              |
| `components/GoalList.tsx`        | Goals list and progress UI                                                                           |
| `components/ProjectionForm.tsx`  | Savings projection input UI                                                                          |
| `components/ProjectionChart.tsx` | Chart for projection results                                                                          |
| `components/SalaryForm.tsx`      | Manual per-year salary entry form                                                                     |
| `components/SalaryChart.tsx`     | Year-over-year salary visualization                                                                   |

### Files to Update

- `app/reports/page.tsx` — switch data loading to server APIs, hook up import/export flows to server endpoints, and support server-side pagination/filters.
- `components/TransactionsTable.tsx` — wire Edit/Delete actions to API calls and add server-aware pagination.
- `app/sankey/page.tsx` — add budget picker, "Create budget from current spending" action, and budget save/preview controls. (IN PROGRESS — BudgetForm/BudgetList scaffolding added; next: wire saved budgets to Sankey generation.)
- `infra/SAM-DEPLOY.md` — document new tables and required IAM policy changes; update deploy scripts if needed.

### Key Design Decisions

- Use Cognito for authentication; use Cognito `sub` as `userId` (partition key) for per-user data.
- Start with separate DynamoDB tables for budgets, goals, and salary for clarity; consider consolidating to a single-table design later.
- Budget model: `{ budgetId, name, allocations: [{ category: string, amount: number }], createdAt, updatedAt }`.
- Sankey generation: `lib/budgets.ts` converts allocations → sankey nodes/links; budgets can be previewed client-side by fetching a budget by id and rendering via `components/SankeyChart`.
- Goals model: `{ goalId, name, targetAmount, currentSaved, monthlyContribution, expectedAnnualReturn, createdAt }` — server returns ETA based on assumptions.
- Salary entries: manual per-year entries `{ year, amount, note }`; compute YoY percentage changes server-side or client-side as needed.
- Validation: use Zod on server endpoints to validate inputs and return structured errors.

### Todos (ordered)

1. Create `.env.local` from SAM outputs (Cognito IDs, table names).
2. Add IAM roles and least-privilege policies to SAM (Lambdas for transactions, budgets, goals, salary).
3. Implement Cognito JWT middleware / Lambda authorizer and common auth helpers.
4. Implement Transaction CRUD endpoints + import/export (DynamoDB-backed).
5. Implement Budgets table + CRUD endpoints.
6. Add Budget UI to Sankey page and `lib/budgets.ts` budget→sankey conversion.
7. Implement Goals table + endpoints and Goals UI with time-to-goal calculation. (API implemented; UI pending)
8. Implement Savings projection UI and projection utilities (client-side; optional server batch/export).
9. Implement Salary history API + UI (manual per-year entries and year-over-year chart).
10. Update reports UI to call server APIs and support server-side pagination/aggregation.
11. Add tests and CI; include sample large datasets for perf testing.

### Notes & considerations

- Keep existing `app/api/reports` routes as local-dev seeds but route production UI to DynamoDB-backed APIs.
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
