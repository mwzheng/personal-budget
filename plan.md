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

## 📌 Ongoing / future enhancements

- Offline support via IndexedDB and sync logic.
- Export charts as images/PDF.
- Drag‑and‑drop reordering, keyboard shortcuts.
- Mobile app or API for external clients.
- Internationalization/currency formatting.


💡 _Keep this plan updated as the project evolves; it serves as a living spec for the team and Copilot._
