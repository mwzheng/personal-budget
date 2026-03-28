# Porridge Budget

Porridge Budget is a personal budgeting application built with TypeScript, Next.js, and serverless backends. The app helps track income, expenses, budgets, and investment progress with CSV import/export and interactive charts.

## Tech Stack

- **Frontend:** Next.js (React) with TypeScript
- **UI:** Material-UI (MUI)
- **Charts:** Recharts (time-series/pie) and @nivo (sankey/treemap)
- **Backend:** Next.js App Router route handlers backed by AWS services
- **Persistence:** DynamoDB single-table design with typed helpers
- **Authentication:** AWS Cognito
- **Email:** AWS SES for the contact form
- **Validation & testing:** Zod + Vitest

## New / Available Pages (local)

- `/` — Public landing page with the app overview plus structured data for search engines.
- `/about`, `/contact`, `/faq` — Public information pages with shared metadata, canonical URLs, and accessible section structure.
- `/reports` — Interactive Reports page with tag/date filtering, summary cards, pie chart (Needs/Wants/Savings), time-series chart, top-tags bar chart, a transactions table backed by authenticated per-user APIs, and a CSV import dialog with a downloadable template.
- `/sankey` — Budget Planner page: enter monthly income plus named expense rows, preview an expense pie chart, and generate a grouped Sankey diagram with optional rollup branches.
- `/goals` — Savings goal tracking with target progress, edit/delete actions, and reusable goal forms.
- `/progress` — Salary, retirement, and milestone tracking from one long-term progress workspace.
- `/salary` — Dedicated salary history entry and comparison screen.

## APIs (local)

- `GET /api/reports` — (Authenticated) Returns the current user's filtered transactions and aggregates. Supports query params: `pageSize`, `page`, `startDate`, `endDate`, `tags`, `search`.
- `POST /api/reports/import` — (Authenticated) Accepts `text/csv` or `{ csv }` JSON payloads and imports rows into the signed-in user's account only.
- `GET /api/reports/export` — (Authenticated) Exports only the signed-in user's filtered transactions as CSV.
- `GET /api/transactions` — (Authenticated) Lists transactions for the current user.
- `POST /api/transactions` — (Authenticated) Creates a transaction for the current user.
- `PUT /api/transactions` — (Authenticated) Updates a transaction for the current user.
- `DELETE /api/transactions` — (Authenticated) Deletes a transaction for the current user when `id` and `date` are supplied.
- `GET /api/budgets` — (Authenticated) List saved budgets for the current user, including monthly income and expense rows when available.
- `POST /api/budgets` — (Authenticated) Create a budget (Zod-validated request payload) with monthly income, expense rows, and legacy allocation compatibility.
- `GET /api/budgets/:id`, `PUT /api/budgets/:id`, `DELETE /api/budgets/:id` — (Authenticated) Fetch, update, or delete a saved budget by id.
- `POST /api/sankey` — Accepts allocation payload and returns `sankeyData` (nodes/links) and `budgetSuggestion`.
- `GET /api/goals`, `POST /api/goals`, `PUT /api/goals`, `DELETE /api/goals` — Goals CRUD with ETA enrichment and body/query fallback for delete identifiers.
- `GET /api/salary`, `POST /api/salary`, `PUT /api/salary`, `DELETE /api/salary` — Salary history CRUD with server-computed YoY values on reads.
- `GET /api/progress/goal`, `POST /api/progress/goal`, `PUT /api/progress/goal` — Long-term progress goal CRUD with derived progress fields.
- `GET /api/progress/retirement`, `POST /api/progress/retirement`, `PUT /api/progress/retirement`, `DELETE /api/progress/retirement` — Retirement-history CRUD with derived change metrics.
- `GET /api/progress/milestones`, `POST /api/progress/milestones`, `DELETE /api/progress/milestones` — Milestone CRUD for long-term savings checkpoints.
- `POST /api/contact` — Sends public contact-form submissions through SES.

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
NEXT_PUBLIC_GA_ID=<ga4_measurement_id>
NEXT_PUBLIC_SITE_URL=https://porridge-budgeting.vercel.app
```

Set `DISABLE_AUTH=true` only when you intentionally want the local demo user and sample CSV dataset. In normal authenticated mode, all report, import, export, and transaction APIs are scoped to the Cognito `sub` and will not fall back to shared sample data for signed-in users.

Google Analytics is optional, but when `NEXT_PUBLIC_GA_ID` is configured the
app now chooses a safe cookie scope for the current host. Visits on the
canonical site from `NEXT_PUBLIC_SITE_URL` share one first-party GA cookie,
while localhost and preview hosts fall back to host-local cookies so realtime
testing still works without invalid-domain cookie warnings. The layout
bootstrap also sends the first `page_view` manually and App Router navigations
queue their own `page_view` until GA is ready, which keeps authenticated
destinations like `/reports`, `/progress`, and `/sankey` reporting their
individual page titles instead of collapsing into the default app title.

If you just want to explore the UI, the login and register screens also provide a
`Demo Sign In` / `Demo Register` flow. That mode seeds browser-local demo data for
reports, progress, goals, and budgets, and all demo edits stay in local storage
until sign-out instead of writing to DynamoDB.

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
     - `POST http://localhost:3000/api/sankey` (see `app/api/sankey/route.ts` for the allocation payload shape)

## Quality checks

- `pnpm lint` — Next.js/ESLint checks
- `pnpm test --run` — Vitest suite
- `pnpm build` — production build verification

## Notes & next steps

- Reports, CSV import/export, and transaction CRUD are now bound to the authenticated Cognito user. Shared sample CSV data is only exposed in explicit demo mode (`DISABLE_AUTH=true`).
- A comprehensive cleanup pass was completed on 2026-03-26: repeated utility logic was centralized, `budget-planner.ts` and demo-mode API logic were split into focused modules, auth helpers were consolidated, and the UI typography/color/font usage was standardized.
- Direct route coverage now exists for budgets collection routes, goals, salary, progress routes, shared utility modules, DynamoDB helper behavior, and CSV import/export edge cases.
- The primary public and authenticated pages now use wider `xl` containers, edit/delete affordances are standardized as icon-only buttons with tooltips, and the app loads `Inter` via `next/font` for more consistent typography.
- Public pages now ship stronger SEO defaults through shared metadata, Open Graph/Twitter tags, `robots.txt`, `sitemap.xml`, and JSON-LD on the home and FAQ routes.
- The MUI date pickers use `AdapterDateFnsV3` (date-fns v3) — ensure compatibility when upgrading dependencies.
- The main follow-up still worth adding is direct test coverage for `app/api/budgets/[id]/route.ts` (PUT/DELETE) plus a documented DynamoDB integration-test strategy.

## Contributing

This is a personal project; contributions and suggestions are welcome. For development, update `plan.md` and consult `plan.completed.md` for recent progress.

## Acknowledgements

A significant portion of this project's code, documentation, and tests were produced with the assistance of GitHub Copilot while exploring how to use Copilot to build a real application. Copilot suggested scaffolding, implementation snippets, and documentation which were reviewed and adapted by the author. All generated content has been manually reviewed; please verify behavior and security if reusing or contributing. Avoid committing secrets or credentials; treat AI-assisted code as guidance that requires human validation.
