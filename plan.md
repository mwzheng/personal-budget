# Development Plan for Personal Budget App

This document outlines a phased roadmap and detailed considerations for building the personal budgeting application.

## 🚀 Phase 1 – Foundation

1. **Repository setup**
   - Initialize Next.js + TypeScript project (`pnpm create next-app --typescript`).
   - Add Prettier config and enforce via lint/pre‑commit hook.
   - Install MUI, Redux Toolkit, and chart library of choice.

2. **Authentication & infra**
   - Provision Cognito user pool (via Serverless/SAM/CDK), keeping within the free tier.
   - Create DynamoDB table (`pk=userId`, `sk=date#transactionId`) using on-demand capacity to avoid costs.
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
    - Auto‑generate Terraform/Serverless resources for Cognito, DynamoDB, and Lambdas.

---

## Reports & Sankey Budget Plan (NEW)

### Overview

Objective: Add a Reports page and a Sankey Budget page which let users generate spending reports, filter data by tags and date ranges, and visualize spending via charts (pie chart for wants/needs/savings, category diagrams, time-series) and a Sankey diagram to help derive a budget from user inputs.

This plan assumes a Next.js + TypeScript front-end (app router), MUI for UI, Redux Toolkit available for global state, and a serverless backend (AWS Lambda + DynamoDB) for persistent transaction storage.

### Scope

In scope:

- /reports page with filtering by tags and date range, a transactions table, and multiple charts (pie, treemap/sunburst, time-series).
- /sankey page that accepts user-provided income/allocations and generates an interactive Sankey diagram and suggested budget breakdown.
- A reports API (route handler or Lambda) that supports filtering, pagination, and server-side aggregation for large datasets.
- Hybrid filtering strategy: client-side for small datasets, server-side for large datasets.

Out of scope:

- Full infra rework beyond adding route handlers or Lambdas.
- Advanced forecasting or ML-driven budget recommendations (future enhancement).

### Data model (proposal - confirm in discovery)

Suggested canonical transaction shape:

- id: string
- userId: string
- date: ISO date string (YYYY-MM-DD)
- amount: number
- type: 'expense' | 'income'
- category: string
- categoryType: 'needs' | 'wants' | 'savings' # optional; can be derived
- tags: string[]
- paymentMethod: string
- notes?: string

Confirm mapping from sample CSV and DynamoDB schema during `confirm-data-sources`.

### Filtering strategy (chosen: hybrid)

- Client-side filtering for small datasets (<= 2,000 transactions) for snappy UI and offline capability.
- Server-side filtering and pre-aggregation for large datasets or broad date ranges; API accepts filters and returns paginated transactions + aggregates for charts.
- Heuristic: check transaction count or requested date span; default to server-side for ranges > 1 year or when transactionCount > threshold.
- Keep URL search params in sync with filters for shareable reports.

### API design (proposed)

GET /api/reports

- Query params: startDate, endDate, tags (comma), page, pageSize, groupBy (month|week|day), includeAggregates=true
- Response shape:
  {
  transactions: [ ... ],
  totalCount: number,
  aggregates: {
  totalAmount: number,
  totalByCategoryType: { needs: number, wants: number, savings: number },
  totalByCategory: { [category]: number },
  timeseries: [ { period: 'YYYY-MM', amount: number } ],
  categoryDiagramData: [ { id: category, value: number } ]
  }
  }

POST /api/sankey

- Body: { incomes: [{source, amount}], categories: [{name, currentSpend?}], userConstraints: {...} }
- Returns: { sankeyData: { nodes: [...], links: [...] }, budgetSuggestion: { category: suggestedAmount } }

Notes:

- Validate inputs (use zod) and sanitize.
- Implement DynamoDB queries with appropriate indexes (GSI by userId+date) and aggregate in Lambda.

### UI pages & components

Pages:

- app/reports/page.tsx — Reports screen
- app/sankey/page.tsx — Sankey budget generator

Shared components:

- FilterBar: date-range picker (MUI), tag multi-select, text search, apply/reset
- TransactionsTable: paginated table (MUI DataGrid)
- ChartsPanel: container for ChartCards
- PieChartCard: wants/needs/savings breakdown
- CategoryDiagramCard: treemap/sunburst
- TimeSeriesCard: monthly/weekly series
- SankeyForm: input incomes and categories
- SankeyChart: renders Sankey and suggestions

Implementation notes:

- Chart components must be client components (`'use client'`) and lazy-loaded via dynamic import/Suspense.
- Persist filters in URL and optionally in Redux for saved views.

### Chart libraries (recommendation)

- Recharts or Chart.js for pie/time-series (lightweight).
- @nivo for treemap/sunburst and Sankey (rich visuals); lazy-load to reduce bundle size.
- Decision: Recharts + @nivo recommended.

### State & data flow

- Use React Query (or similar) for server data fetching and caching.
- Use Redux Toolkit for global UI state and saved filters.
- Sync filter state to URL search params for shareable reports.

### Implementation roadmap (phases & tasks)

Phase A — Discovery & setup

- confirm-data-sources: inspect DynamoDB schema, Lambda code, and sample-data CSV.
- add chart deps (Recharts, @nivo) and configure pnpm.

Phase B — API & aggregation

- implement-api-reports: create GET /api/reports returning sample aggregates (start with sample-data for local dev).
- implement-api-sankey: POST /api/sankey to compute sankey nodes/links and budget suggestion.

Phase C — Reports UI

- filters-implementation: build FilterBar, URL sync, and client-side filtering utilities.
- reports-page-ui: implement /reports page and TransactionsTable.
- charts-implementation: wire pie, treemap, time-series to API or client filters.

Phase D — Sankey UI

- sankey-page: build SankeyForm and SankeyChart, call /api/sankey and show budgetSuggestion.

Phase E — Polish & tests

- data-import-export: ensure CSV import/export maps categories/tags and support filtered export.
- tests-and-docs: unit/integration tests; update README with usage and examples.
- accessibility-performance: run accessibility checks and lazy-load heavy chart bundles.

### Acceptance criteria

- Reports page filters by tags and date ranges; charts and table update correctly.
- Pie chart accurately shows wants/needs/savings from filtered data.
- Category diagram shows category proportions with tooltips.
- Sankey page produces an interactive Sankey and returns budget suggestions from user inputs.
- API endpoints validate inputs and return aggregates in the specified shape.
- Tests cover main API endpoints and UI flows; README updated.

### Risks & mitigations

- Large datasets -> slow UI: mitigate with server-side aggregation, pagination, and lazy-loading charts.
- Bundle size -> use dynamic imports and only load @nivo when needed.
- CategoryType mapping missing -> provide configurable mapping and default rules.

### Next steps (immediate)

1. Run `confirm-data-sources` to map CSV and DynamoDB schemas and update todo state.
2. Add chart libraries (Recharts + @nivo) to package.json and pnpm install.
3. Implement a minimal GET /api/reports that returns sample aggregates from `sample-data` for frontend development.

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

