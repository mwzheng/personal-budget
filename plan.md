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

- **User data management (next up — see section below):** Migrate from static CSV to localStorage-backed CRUD; add import/export UI; add Add/Edit/Delete transaction forms.
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

Replace the static sample-CSV data source with a user-owned, locally-persisted dataset. Users should be able to:

- **Manually add, edit, and delete** individual transactions via a form dialog.
- **Import** their own CSV (matching the sample `expenses.csv` format) — appending rows to existing data.
- **Export** their current filtered dataset as a CSV download.
- Start from an **empty state** (no sample data pre-loaded) with a clear call-to-action.

### Architecture Overview

| Layer       | Current                                             | After                                          |
| ----------- | --------------------------------------------------- | ---------------------------------------------- |
| Data source | `GET /api/reports` reads `sample-data/expenses.csv` | localStorage (client-side)                     |
| CSV import  | API parses CSV but no UI                            | UI dialog → API parse → append to localStorage |
| CSV export  | API exports CSV but no UI                           | Client-side CSV generation + download          |
| CRUD        | None                                                | Add/Edit/Delete via MUI Dialog form            |

The existing `/api/reports/import` route (CSV parsing via PapaParse) is reused as the server-side parser for imports. Data is stored and managed entirely in `localStorage` under the key `personal-budget-transactions`.

### Files to Create

| File                             | Purpose                                                                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `lib/storage.ts`                 | localStorage CRUD utilities: `getTransactions`, `setTransactions`, `addTransaction`, `updateTransaction`, `deleteTransaction`, `appendTransactions`, `clearTransactions` |
| `lib/csvExport.ts`               | Client-side CSV generation matching the `expenses.csv` format                                                                                                            |
| `components/TransactionForm.tsx` | MUI Dialog form for add/edit with Zod validation (fields: date, name, amount, category, payment method, tags, notes)                                                     |
| `components/ImportCsvDialog.tsx` | Import flow: file picker → parse via API → preview summary → confirm append                                                                                              |

### Files to Update

| File                               | Changes                                                                                                  |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `app/reports/page.tsx`             | Load data from `lib/storage` instead of `/api/reports`; wire up CRUD, import, export; add empty-state UI |
| `components/TransactionsTable.tsx` | Add Edit and Delete action buttons per row                                                               |
| `app/api/reports/route.ts`         | No longer used for primary data fetch; keep for reference or repurpose for sample-data seeding           |

### Key Design Decisions

- **localStorage key**: `personal-budget-transactions` (JSON array of `Transaction[]`).
- **Empty state**: When no data exists, show a centered call-to-action with an "Import CSV" button and an "Add Transaction" button.
- **CSV import mode**: Append only. Duplicate detection is by exact match on `(date, name, amount)`; duplicates are skipped with a warning count shown in the preview.
- **Transaction IDs**: Generated client-side as `crypto.randomUUID()` to avoid collisions on append.
- **Export format**: Matches the sample CSV columns: `Name,Amount,Category,Date,Notes,Payment Method,Tags` (amounts formatted as `$X.XX`, tags joined with `, `).
- **Form validation**: Required fields are `date`, `name`, `amount`, `category`. `paymentMethod`, `tags`, `notes` are optional.

### Todos (ordered)

1. **`lib/storage.ts`** — localStorage CRUD utilities
2. **`lib/csvExport.ts`** — client-side CSV generation
3. **`components/TransactionForm.tsx`** — add/edit dialog
4. **`components/ImportCsvDialog.tsx`** — import preview dialog
5. **`components/TransactionsTable.tsx`** — add Edit/Delete actions
6. **`app/reports/page.tsx`** — wire everything together (localStorage, CRUD, import/export, empty state)

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
