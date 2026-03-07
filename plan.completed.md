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

- IAM roles for Lambda functions (to access DynamoDB + Cognito) are not yet created; will be needed when Lambda API routes are wired up.
- `.env.local` with the above values still needs to be created for local Next.js development.
