# Personal Budget

A personal budgeting application built with TypeScript, Next.js, and AWS serverless technologies. The app allows you to track income, expenses, budgets, and investment progress, with CSV import/export and interactive charts.

## Tech Stack

- **Frontend:** Next.js (React) with TypeScript
- **UI:** Material-UI (MUI)
- **State management:** Redux Toolkit
- **Backend:** AWS Lambda functions (via Serverless Framework/SAM/CDK)
- **Authentication:** AWS Cognito
- **Database:** AWS DynamoDB using on-demand capacity

## Features

- Transactions table with filtering, sorting, and date/column filters
- Spending-over-time charts with range selectors
- Light/dark theme toggle and year-based filtering
- CSV data import/export (format in `sample-data/expenses.csv`)
- Budget planner with live pie chart preview
- Year-to-year investment progress tracking

## Getting Started

1. Clone the repo and install dependencies:
   ```bash
   pnpm install
   ```
2. Configure AWS credentials and environment variables (`.env` or secrets) for Cognito, DynamoDB, etc.
3. Deploy serverless resources (Cognito user pool, DynamoDB table, Lambdas):
   ```bash
   pnpm run deploy
   ```
4. Run the development server:
   ```bash
   pnpm run dev
   ```

Refer to `plan.md` for a development roadmap and `.github/copilot-instructions.md` for guidance while building.

## Contributing

This is a personal project, but feel free to open issues or submit pull requests if you want to contribute.

 
