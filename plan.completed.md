# Completed: Reports & Sankey Implementation

Date: 2026-03-06

Summary

This file lists the work that was completed for the Reports and Sankey budget features during the current development session. These items were removed from plan.md and consolidated here for traceability.

Completed items

- Added dependencies and installed (pnpm install; 423 packages installed).
- Added next.config.ts to transpile @nivo packages for Next.js bundling.
- Added TypeScript config and ESLint config (tsconfig.json, .eslintrc.json).
- Implemented lib utilities: `lib/types.ts`, `lib/csvParser.ts`, `lib/aggregations.ts`.
- Implemented API routes for local development:
  - `app/api/reports/route.ts` (GET /api/reports) — reads sample-data and returns transactions + aggregates.
  - `app/api/sankey/route.ts` (POST /api/sankey) — zod-validated payload, returns sankey nodes/links and budgetSuggestion.
- Implemented Reports UI: `app/reports/page.tsx` with `FilterBar`, summary stat cards, `SpendingPieChart`, `SpendingBarChart`, `TagBarChart`, and `TransactionsTable`.
- Implemented Sankey/Budget UI: `app/sankey/page.tsx` with `SankeyForm`, dynamically-loaded `SankeyChart`, and budget breakdown table.
- Implemented chart components: `components/SpendingPieChart`, `SpendingBarChart`, `TagBarChart`, and `components/SankeyChart` (using @nivo/sankey).
- Implemented UI components: `components/FilterBar`, `components/TransactionsTable`, `components/AppNav`.
- Fixed MUI date-fns adapter compatibility: replaced `AdapterDateFns` with `AdapterDateFnsV3` in `app/providers.tsx` to work with `date-fns@3`.
- Verified build: `pnpm build` succeeded with zero TypeScript or lint errors.
- Verified dev server: started `pnpm dev` and smoke-tested `/reports`, `/sankey`, `GET /api/reports?pageSize=5`, and `POST /api/sankey`.

Notes

- Filtering currently runs client-side against the sample CSV (hybrid approach planned for production).
- Persistence, authentication (Cognito), and DynamoDB integration remain TODO (listed in the main plan).

Commit

All changes were committed and pushed in the working branch. See the git history for per-file commits.

- Implemented CSV import/export API routes for local development: `app/api/reports/import` (POST — parses uploaded CSV and returns parsed transactions) and `app/api/reports/export` (GET — returns filtered transactions as CSV).

---

# Completed: AWS Infrastructure Provisioning (DynamoDB + Cognito)

Date: 2026-03-07

## Summary

Provisioned the AWS dev infrastructure using AWS SAM and fully documented the deployment process.

## Completed items

- Provisioned DynamoDB table `personal-budget-infra-dev-transactions` (pk=`userId`, sk=`date#transactionId`, on-demand/PAY_PER_REQUEST billing) via AWS SAM deploy.
- Provisioned Cognito User Pool `personal-budget-infra-dev-userpool` (User Pool ID: `us-east-1_p3sQWF56J`) with email as username attribute and auto-verified email.
- Created Cognito App Client `personal-budget-infra-dev-client` (Client ID: `2peialoophbsr5pso0grnljavt`, no client secret).
- CloudFormation stack `personal-budget-resources` deployed in `us-east-1` (account `747734166075`).
- Installed AWS CLI v2 and SAM CLI (user-local, no sudo) to enable local deploys.
- Fully rewrote `infra/SAM-DEPLOY.md` with end-to-end documentation: prerequisites (AWS CLI + SAM install commands), all three deploy methods (pnpm script, shell script, guided mode), post-deploy `.env.local` setup, CI/OIDC guidance, and a troubleshooting table.
- Added `deploy:infra` and `deploy:infra:prod` npm scripts to `package.json` for convenient redeployment.

## Stack outputs

| Key                     | Value                                    |
| ----------------------- | ---------------------------------------- |
| `TransactionsTableName` | `personal-budget-infra-dev-transactions` |
| `UserPoolId`            | `us-east-1_p3sQWF56J`                    |
| `UserPoolClientId`      | `2peialoophbsr5pso0grnljavt`             |

## Notes

- IAM roles for Lambda functions (to access DynamoDB + Cognito) were added to infra/template.yaml and committed.  

---

# Completed: Auth middleware & Transactions API

Date: 2026-03-08

Summary

- Implemented Cognito JWT verification helper: `lib/auth.ts` (uses `jose` and the Cognito JWKS endpoint) for server-side token verification and user extraction.
- Added DynamoDB put/delete helpers to `lib/dynamo.ts` and implemented authenticated Transactions API handlers: `app/api/transactions/route.ts` (GET/POST/PUT/DELETE) that enforce per-user access using the Cognito `sub` claim as the partition key.
- Commits created for these changes and corresponding session todos updated.

## Completed: Budgets API (partial)

Date: 2026-03-08

- Implemented basic budgets storage helpers in `lib/dynamo.ts` and `lib/budgets.ts` for converting budgets to a Sankey-friendly format.
- Implemented authenticated budgets API `app/api/budgets/route.ts` (GET list, POST create) using the Cognito `sub` as the partition key.  

Notes: Update and delete for budgets, richer validation, and UI integration remain todo and are tracked in the main plan.

## Completed: Goals API

Date: 2026-03-08

- Implemented Goals storage helpers in `lib/dynamo.ts` (put/get/delete) and estimation utilities in `lib/goals.ts`.
- Implemented authenticated Goals API `app/api/goals/route.ts` (GET list, POST create, PUT update, DELETE) that returns estimated months-to-goal and projected date for each goal.

Notes: Goals UI (page) and robust validation remain todo and are tracked in the main plan.


Notes

- Transaction handlers currently support listing, create (upsert), update (PUT as upsert), and delete; pagination, input validation (Zod), and stricter error handling remain TODO and are tracked in the main plan.

- `.env.local` with the above values still needs to be created for local Next.js development.

## Completed: Salary API & UI

Date: 2026-03-08

- Implemented salary helpers in `lib/salary.ts` and authenticated Salary API `app/api/salary/route.ts` (GET/POST/PUT/DELETE) using Cognito `sub` as the partition key.
- Added Salary UI components: `components/SalaryForm.tsx`, `components/SalaryList.tsx`, `components/SalaryChart.tsx`, and `app/salary/page.tsx` for manual per-year entries and YoY visualization.

Notes: Validation, accessibility improvements, and integration tests remain TODO and are tracked in the main plan.

## Completed: Local Data Management (client-side)

Date: 2026-03-08

- Implemented localStorage persistence helpers in `lib/storage.ts` with get/add/update/delete/append/clear and duplicate detection logic.
- Wired Reports page to localStorage: `app/reports/page.tsx` uses `lib/storage` and components `TransactionForm`, `TransactionsTable`, and `ImportCsvDialog` to support add/edit/delete and CSV import flows.

## Completed: CSV Export

Date: 2026-03-08

- Implemented `lib/csvExport.ts` and hooked the Reports page export button to download filtered transactions as CSV matching `expenses.csv` format.

## Completed: Budgets storage (single-table)

Date: 2026-03-08

- Implemented budgets persistence in `lib/dynamo.ts` using the single-table pattern (pk=`user#<userId>`, sk=`budget#<budgetId>`), and `putBudget` / `getUserBudgets` helpers. Frontend BudgetForm/BudgetList are wired to `app/api/budgets` for creation and listing.

Notes: Server-side CSV import/export endpoints and persistence to DynamoDB remain TODO and are tracked in the main plan.

## Completed: Sample datasets

Date: 2026-03-08

- Added sample CSV datasets for performance and pagination testing (dev-sample-data/expenses_small.csv, expenses_medium.csv, expenses_large.csv). These are included under `dev-sample-data/` since `sample-data/` is gitignored to avoid large repository artifacts.

Notes: Files are intended for local performance testing and CI artifacts; use them to benchmark pagination, aggregation, and import workflows.

Completed: Sankey Budget UI (scaffold)

Date: 2026-03-08

- Added `components/BudgetForm.tsx` and `components/BudgetList.tsx` and updated `app/sankey/page.tsx` to allow creating and selecting saved budgets. Selecting a budget posts allocations to `/api/sankey` and renders the Sankey diagram. Validation, delete confirmation UX, and accessibility improvements remain TODO.
