# Porridge Budget redesign brief

## Goal

Explore three modern, pleasant, intuitive responsive designs for Porridge Budget. Keep the existing product scope and workflows. The redesign is visual and structural; it does not add product features.

## Agreed direction

- Create three standalone, clickable prototypes for comparison.
- Vary navigation and page organization across prototypes. Treat color themes as secondary.
- Cover every current page route in every prototype.
- Prioritize desktop web layouts and make each route usable at mobile widths.
- Use sample data and local-only interactions. Do not connect prototypes to APIs or persist changes.
- Keep the existing Light, Dark, and System appearance choices.
- Keep Porridge Budget's identity warm and subtle. Avoid food illustrations or food metaphors in data displays.
- Preserve the current workflows and concepts. Do not add features.

## Routes in scope

| Route            | Existing page                                                      |
| ---------------- | ------------------------------------------------------------------ |
| `/`              | Public home                                                        |
| `/about`         | About                                                              |
| `/faq`           | FAQ                                                                |
| `/auth/login`    | Sign in                                                            |
| `/auth/register` | Create account                                                     |
| `/auth/callback` | Complete sign in state                                             |
| `/auth/signout`  | Sign out state                                                     |
| `/reports`       | Reports, filters, charts, transaction list and CSV actions         |
| `/budget`        | Budget editor, saved budgets, actual-versus-budget, visualizations |
| `/progress`      | Goal, salary, retirement and milestone tracking                    |
| `/salary`        | Salary history                                                     |
| `/fire`          | FIRE calculator and projection                                     |
| not-found        | Unknown route state                                                |

The prototypes may provide route selection within their dedicated prototype page rather than creating real application routes per direction. Label each view with its matching existing route. Use page-specific mock content and key controls so all routes can be reviewed. The route registry contains `/contact` metadata, but there is no live `/contact` page. The contact form appears in the `/about` page, so represent it there and do not create a separate contact route.

## Existing behavior to represent

- Reports: search and filter transactions by date, category, tags and amount; view spending summaries, charts, comparisons and transaction details; import and export CSV; undo a deletion.
- Budget: enter income and expense rows, save and select budgets, compare a budget with recorded activity for a month, export a budget, and preview breakdown and flow visualizations.
- Progress: review and edit long-term goal, salary, retirement and milestone history, with charts.
- Salary: review, add, edit and delete salary history entries and compare changes.
- FIRE: edit projection assumptions, compare scenarios, inspect a projection table and chart.
- About: include the existing contact section and form without sending messages.
- Account routes: show the current form or status state without changing authentication.
- Appearance: show Light, Dark and System options. Theme switching may work locally in the prototype.

Prototype controls should use local UI state only. Example: submit a sample transaction form and show a local confirmation; do not write to the product data store.

## Accessibility and responsive design criteria

- Use semantic headings, landmarks, labels and buttons. Give all interactive controls keyboard focus indicators.
- Keep text and controls legible in both light and dark modes. Do not use color alone to encode financial status.
- Reflow page content at 320 CSS pixels without page-level horizontal scrolling. Dense tables and charts need readable mobile treatments.
- Keep pointer targets at least 24 by 24 CSS pixels or provide the spacing allowed by WCAG 2.2 AA.
- Verify keyboard navigation, contrast, visible focus, readable form errors, chart text alternatives, and mobile layout during review.

These criteria use WCAG 2.2 AA as a practical baseline, including contrast, focus, reflow and target size guidance.

## Research notes

- YNAB emphasizes goal tracking and spending/net-worth reports. The useful reference is clear separation of planning targets and financial summaries, not a reason to copy its budgeting method.
- Monarch's reports documentation describes category, group and merchant views, plus cash-flow visualizations. This supports giving report filters and chart context a clear hierarchy.
- Copilot's settings documentation includes accessible color options. This supports treating color as a system with readable semantic states in both modes.
- These are inspiration references only. Do not import their features, language, or interaction rules when they conflict with Porridge Budget's current behavior.

## References

- [YNAB features](https://www.ynab.com/features)
- [YNAB goal tracking](https://www.ynab.com/features/goal-tracking)
- [Monarch reports](https://help.monarch.com/hc/en-us/articles/21846787088916-Reports)
- [Copilot appearance and accessibility settings](https://help.copilot.money/en/articles/11062072-settings-overview)
- [WCAG 2.2](https://www.w3.org/TR/WCAG/)
- [WCAG contrast minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum)
- [WCAG reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)
- [WCAG target size minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum)
- [WCAG focus appearance](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance)

## Completion checklist

- [x] Three visually distinct layout directions exist at their own prototype entry points.
- [x] Each direction includes mockups for every live route in the table, including not-found.
- [x] Each direction represents the established workflows with local interactions and adds no product features.
- [x] Primary navigation and route switching work within each prototype.
- [x] Representative controls show local-only feedback.
- [x] Each prototype supports Light, Dark and System modes.
- [x] Desktop and mobile layouts are implemented for all views.
- [ ] Keyboard, reflow, contrast, focus and target-size criteria are reviewed.
- [x] Prototype instructions explain how to open and navigate each direction.
