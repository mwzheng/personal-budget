# Future Feature Ideas

This document collects candidate product ideas for Porridge Budget that fit the
manual-first budgeting philosophy. These are not committed roadmap items yet;
they are options to evaluate after the current testing and tooling follow-ups.

## Highest-priority candidates

1. **Recurring transactions**
   - Let users mark rent, subscriptions, and other repeating expenses as weekly,
     biweekly, or monthly.
   - Show upcoming suggested entries instead of silently auto-posting them.
2. **Authenticated dashboard**
   - Show a signed-in overview with current-month spending, budget adherence,
     goal progress, and recent activity.
   - Keep the public landing page marketing-focused and reserve the dashboard
     for authenticated users.
3. **Transaction tag autocomplete**
   - Suggest existing tags while users type in the transaction form.
   - Reduce duplicates caused by inconsistent capitalization or spelling.

## Strong medium-term ideas

4. **Net worth tracking**
   - Track assets and liabilities over time with a net-worth chart.
   - Extend the app beyond expense tracking into broader financial visibility.
5. **Category spending alerts**
   - Warn users when a category is approaching or exceeding its monthly budget.
   - Surface this in reports and any future dashboard.
6. **Bulk transaction actions**
   - Add bulk categorize, bulk tag, and bulk delete for imported transaction
     cleanup.
   - Pair well with CSV-heavy workflows.
7. **JSON backup and restore**
   - Export/import full account data, not just transaction CSVs.
   - Improve user ownership and portability.
8. **CSV import history**
   - Record import time, source filename, and inserted row count.
   - Make recent imports auditable and easier to undo.

## Longer-term product expansion ideas

9. **PWA / offline support**
   - Add installability, local caching, and explicit sync behavior.
   - Preserve the current clear distinction between real data and demo data.
10. **Scheduled summaries**
    - Use SES to email weekly or monthly spending summaries.
    - Could build on existing report aggregates and contact/email plumbing.
11. **Investment portfolio tracker**
    - Track actual holdings, allocation, and dividend income alongside FIRE
      scenarios.
    - Keep the current FIRE calculator as the planning layer.
12. **Shared budgets**
    - Allow two users to collaborate on a shared budget while preserving clear
      ownership of data and actions.
13. **Multi-currency support**
    - Store a currency per transaction and add exchange-rate-aware reporting.

## Quality-of-life ideas

14. **Keyboard shortcuts**
    - Add shortcuts for common actions like new transaction, search, and opening
      filters.
15. **Chart annotations**
    - Let users add notes to specific months, such as vacations or one-time
      expenses.
16. **Goal sharing / read-only export**
    - Generate a simple shareable view for progress-goal milestones.
17. **Onboarding flow**
    - Guide new users through their first budget, transaction import, and progress goal.

## Selection criteria

Use the following questions when deciding which idea to promote into `plan.md`:

- Does it strengthen the manual-first workflow instead of hiding the data?
- Does it improve clarity, reflection, or ownership for the user?
- Can it be delivered without making the product feel noisy or over-automated?
- Does it fit the current Cognito + DynamoDB + Next.js architecture cleanly?
