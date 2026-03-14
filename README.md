# Personal Budget

A personal budgeting application built with TypeScript, Next.js, and serverless backends. The app helps track income, expenses, budgets, and investment progress with CSV import/export and interactive charts.

## Tech Stack

- **Frontend:** Next.js (React) with TypeScript
- **UI:** Material-UI (MUI)
- **Charts:** Recharts (time-series/pie) and @nivo (sankey/treemap)
- **State management:** Redux Toolkit (planned)
- **Backend:** AWS Lambda functions (DynamoDB for persistence)
- **Authentication:** AWS Cognito

## New / Available Pages (local)

- `/reports` — Interactive Reports page with tag/date filtering, summary cards, pie chart (Needs/Wants/Savings), time-series chart, top-tags bar chart, and a transactions table backed by authenticated per-user APIs.
- `/sankey` — Budget Generator page: supply monthly income and category allocations; generates a Sankey diagram and a suggested monthly budget breakdown.

## APIs (local)

- `GET /api/reports` — (Authenticated) Returns the current user's filtered transactions and aggregates. Supports query params: `pageSize`, `page`, `startDate`, `endDate`, `tags`, `search`.
- `POST /api/reports/import` — (Authenticated) Accepts `text/csv` or `{ csv }` JSON payloads and imports rows into the signed-in user's account only.
- `GET /api/reports/export` — (Authenticated) Exports only the signed-in user's filtered transactions as CSV.
- `GET /api/transactions` — (Authenticated) Lists transactions for the current user.
- `POST /api/transactions` — (Authenticated) Creates a transaction for the current user.
- `PUT /api/transactions` — (Authenticated) Updates a transaction for the current user.
- `DELETE /api/transactions` — (Authenticated) Deletes a transaction for the current user when `id` and `date` are supplied.
- `GET /api/budgets` — (Authenticated) List budgets for the current user.
- `POST /api/budgets` — (Authenticated) Create a budget (Zod-validated request payload).
- `GET /api/budgets/:id` — (Authenticated) Fetch a budget by id.
- `POST /api/sankey` — Accepts allocation payload and returns `sankeyData` (nodes/links) and `budgetSuggestion`.
- `GET /api/goals`, `POST /api/goals`, `PUT /api/goals/:id`, `DELETE /api/goals/:id` — Goals CRUD with estimates/ETA in responses.
- `GET /api/salary`, `POST /api/salary`, `PUT /api/salary/:id`, `DELETE /api/salary/:id` — Salary history CRUD for per-year entries.

### Auth / Environment

The app uses AWS Cognito for authentication. Set the following env vars in `.env.local` (see `env.example` for an example):

```
NEXT_PUBLIC_COGNITO_DOMAIN=https://your-domain.auth.us-east-1.amazoncognito.com
NEXT_PUBLIC_COGNITO_CLIENT_ID=<cognito_app_client_id>
NEXT_PUBLIC_COGNITO_USER_POOL_ID=<cognito_user_pool_id>
COGNITO_CLIENT_ID=<cognito_app_client_id>
COGNITO_USER_POOL_ID=<cognito_user_pool_id>
DYNAMODB_TABLE=<transactions_table_name>
AWS_REGION=us-east-1
```

Set `DISABLE_AUTH=true` only when you intentionally want the local demo user and sample CSV dataset. In normal authenticated mode, all report, import, export, and transaction APIs are scoped to the Cognito `sub` and will not fall back to shared sample data for signed-in users.

## Getting Started (local development)

1. Clone the repo and install dependencies:
   ```bash
   pnpm install
   ```
2. Run the development server:
   ```bash
   pnpm run dev
   ```
3. Visit the app in your browser:
   - Reports: http://localhost:3000/reports
   - Sankey Budget: http://localhost:3000/sankey
   - Example API requests:
     - `GET http://localhost:3000/api/reports?pageSize=5`
     - `POST http://localhost:3000/api/sankey` (see `components/SankeyForm` for request shape)

## Notes & next steps

- Reports, CSV import/export, and transaction CRUD are now bound to the authenticated Cognito user. Shared sample CSV data is only exposed in explicit demo mode (`DISABLE_AUTH=true`).
- A refactor and cleanup pass was completed on 2026-03-12: lint warnings were eliminated, progress/salary API handlers now use stricter payload-to-user extraction, and progress chart yearly merge logic was optimized from repeated lookups to map-based O(n) merging.
- The MUI date pickers use `AdapterDateFnsV3` (date-fns v3) — ensure compatibility when upgrading dependencies.
- Run `pnpm build` to verify TypeScript and lint checks.

## Contributing

This is a personal project; contributions and suggestions are welcome. For development, update `plan.md` and consult `plan.completed.md` for recent progress.

## Acknowledgements

A significant portion of this project's code, documentation, and tests were produced with the assistance of GitHub Copilot while exploring how to use Copilot to build a real application. Copilot suggested scaffolding, implementation snippets, and documentation which were reviewed and adapted by the author. All generated content has been manually reviewed; please verify behavior and security if reusing or contributing. Avoid committing secrets or credentials; treat AI-assisted code as guidance that requires human validation.
