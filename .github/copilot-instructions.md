# Copilot Instructions for Personal Budget Project

This file contains high-level guidance for GitHub Copilot while assisting with development of the Personal Budget application.

## Project Overview
- **Purpose:** Build a personal budgeting application that helps users track income, expenses, and savings goals.
- **Tech Stack:**
  - **Frontend:** Next.js with TypeScript
  - **UI Library:** Material-UI (MUI) and custom React components
  - **Backend:** AWS Lambda functions written in TypeScript
  - **Authentication & accounts:** AWS Cognito for user management and auth flows
  - **Database:** AWS DynamoDB table for storing user data
  - **Deployment:** AWS Lambda (possibly via Serverless Framework or AWS SAM)

## Development Guidelines
- Use **TypeScript** everywhere for safety and tooling.
- Structure the Next.js app using standard conventions (pages/app router, API routes if needed).
- Keep UI components reusable and styled with MUI.
- Backend business logic should be separated into individual Lambda handlers.
- Interact with DynamoDB via AWS SDK v3 using typed models.
- Use environment variables for AWS configuration (e.g., table name, region).
- Write thorough tests: unit tests for slices, components, and utilities; integration tests for auth flows, CSV import/export, and API interactions; snapshot tests for visual components.
- Use **Redux Toolkit** for centralized application state management, keeping logic in slices and leveraging `createAsyncThunk` for async actions.
- Follow a consistent Prettier configuration across the entire project for formatting; format any file edits before committing.
- Adhere to best practices for accessibility and responsive design.
- Optimize for inexpensive, free-tier-friendly hosting: on-demand DynamoDB, minimal Lambda duration, Cognito free tier, deploy frontend to free hosting (Vercel/Netlify) or S3/CloudFront.

## UI/UX Requirements
- Provide a **transactions table** mirroring the Notion layout:
  - Columns: Date, Description/Name, Category, Payment Method, Tags, Amount, Notes, etc.
  - Client-side filtering/sorting on every column.
  - Ability to **filter by date range** and by any column value.
- Include a **filter bar** with controls for date range (using MUI date pickers), category and tag selectors, payment method dropdown, and text search.
- Support a quick year selector (e.g. dropdown or chips) to jump between calendar years.
- Implement a **spending-over-time chart** that aggregates data by month or week and supports predefined ranges (past month, past 3 months, past year, custom).
- Chart must update based on the same filters as the table.
- Provide a global **light/dark theme toggle** and ensure all components respect MUI theme settings.
- Enable filtering the transactions table and charts by **year** in addition to arbitrary date ranges.

## UI Extensions

- Add a dedicated **budget planner page** where users can define a budget by category and amount. Display a **pie chart** preview that updates as the budget is filled out to help visualize allocations.
- Provide a **year‑to‑year investment progress page** showing tracked amounts over time (similar to spreadsheet screenshot) with ability to input yearly values and render a growth chart or table for comparison.

## Data Import / Export
- Provide the ability for users to **export** their transaction data as CSV and **import** from a CSV file.
  - CSV format should match the example in `sample-data/expenses.csv` (date, description, category, payment method, tags, amount, notes, etc.).
  - Implement front‑end controls for selecting a file to upload and triggering a download of the current filtered dataset.
  - Validation should run on import to ensure required columns exist and values are well‑formed.
  - Backend/API route should accept a CSV payload, parse it, and upsert transactions into DynamoDB.
  - Export endpoint should query DynamoDB (respecting filters) and stream back a CSV file.

## AI Interaction Preferences
- Provide concise suggestions and explanations tailored to TypeScript and Next.js.
- When asked to generate code, include relevant imports and typing annotations.
- Favor modern React patterns (hooks, functional components).
- Ask clarifying questions if requirements are ambiguous.

## Common Tasks
- Creating pages/screens for budget categories, transactions, and reports.
- Implementing API routes or Lambda functions for CRUD operations.
- Configuring DynamoDB tables and IAM permissions in infrastructure.
- Styling components with MUI and using themes.
- Setting up CI/CD for AWS deployment (e.g., GitHub Actions). Pipelines should run tests and lint/format checks and only deploy on successful passes.

## Project Goals
1. Enable users to add, edit, and delete budget items.
2. Display summary dashboards and charts.
3. Secure data access per user.
4. Deploy reliably on AWS Lambda with DynamoDB.

Feel free to expand this file with more details as the project evolves.
