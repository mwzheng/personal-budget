# Personal Budget

A personal budgeting application built with TypeScript, Next.js, and serverless backends. The app helps track income, expenses, budgets, and investment progress with CSV import/export and interactive charts.

## Tech Stack

- **Frontend:** Next.js (React) with TypeScript
- **UI:** Material-UI (MUI)
- **Charts:** Recharts (time-series/pie) and @nivo (sankey/treemap)
- **State management:** Redux Toolkit (planned)
- **Backend:** AWS Lambda functions (DynamoDB for persistence)
- **Authentication:** AWS Cognito (planned)

## New / Available Pages (local)

- `/reports` — Interactive Reports page with tag/date filtering, summary cards, pie chart (Needs/Wants/Savings), time-series chart, top-tags bar chart, and a transactions table (client-side filtering for sample data).
- `/sankey` — Budget Generator page: supply monthly income and category allocations; generates a Sankey diagram and a suggested monthly budget breakdown.

## APIs (local)

- `GET /api/reports` — Returns transactions and aggregates from `sample-data/expenses.csv` (used for local development).
- `POST /api/sankey` — Accepts allocation payload and returns `sankeyData` (nodes/links) and `budgetSuggestion`.

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

- Currently the Reports page filters client-side against `sample-data/expenses.csv` for fast local iteration. Production persistence and auth (Cognito + DynamoDB) are pending.
- The MUI date pickers use `AdapterDateFnsV3` (date-fns v3) — ensure compatibility when upgrading dependencies.
- Run `pnpm build` to verify TypeScript and lint checks.

## Contributing

This is a personal project; contributions and suggestions are welcome. For development, update `plan.md` and consult `plan.completed.md` for recent progress.

 
