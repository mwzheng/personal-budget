# Prototype plan: sidebar workspace

Read [the shared brief](porridge-budget-redesign-brief.md) first. This plan is self-contained enough to run in a later session.

## Structure to explore

Use a persistent left sidebar on desktop for the primary app routes. Put the page title and route-specific actions at the top of the main workspace. On narrow screens, collapse the sidebar behind a menu button. Keep informational and account links visibly grouped.

This prototype should favor frequent movement between budget, reports, progress, salary and FIRE while keeping a stable location cue.

## Routes and views

Implement each route listed in the shared brief as a selectable mock view. Include the existing contact form within the About view. Do not create a separate `/contact` view, because that route is not live in the app.

## Content and local interactions

Use plausible sample figures. Represent the existing controls and workflows named in the shared brief. Interactions may change local component state and display success, empty or error feedback. Do not call app APIs or modify the real data.

## Visual direction

Use a calm oat, cream and muted green palette as a starting point, with a restrained accent. Keep the identity warm and subtle. Define separate semantic light and dark tokens. Do not use porridge imagery or food labels for financial elements.

## Decisions

- Keep this work in the standalone prototype until the design is reviewed. The live routes and shared navigation remain outside this prototype pass.
- Put Reports, Budget, Progress, Salary history, and FIRE in the signed-in sidebar. Group Home, About, and FAQ separately. Keep sign-in, registration, callback, sign-out, and not-found states in a prototype-only route picker.
- Open Reports by default in the sample workspace. Keep `/` as the public home view.
- Keep filters, forms, CSV actions, saved budgets, edits, deletes, undo, comparisons, and projection scenarios local to the prototype.
- Show report summaries and charts before the transaction list. On phones, use stacked records and full-screen forms. Let dense comparisons scroll inside their own sections.
- Treat a budget as the plan and transactions as recorded activity. Progress includes savings, salary, retirement, and milestones; Salary history remains the focused salary comparison page.

These decisions apply to the prototype. The app glossary records the shared terms.

## Prototype behavior

The sidebar prototype includes searchable and filterable transaction records, transaction details and editing, CSV import and export, budget income and expense rows, saved budget snapshots, plan-versus-actual summaries, progress and salary history forms, milestone updates, and editable FIRE assumptions with scenario projections. Changes stay in component state and do not call app APIs.

## Suggested implementation boundary

- Entry page: `/prototypes/sidebar-workspace`
- Keep all implementation files under `components/prototypes/sidebar-workspace/` plus the dedicated entry page.
- Do not edit shared navigation, global theme providers, existing routes or other prototypes.
- A local route picker or active-view state is acceptable so the 13 mockups remain inside one prototype route.

## Sessions

1. Establish shell, route picker and desktop/mobile navigation.
2. Add signed-in views: reports, budget, progress, salary and FIRE.
3. Add public, auth and not-found views; add local interactions and theme modes.
4. Review the shared checklist and document anything incomplete.

## Completion

Use the shared brief's completion checklist. Add a short prototype-specific note to `docs/redesign/README.md` with its entry URL and any known gaps.
