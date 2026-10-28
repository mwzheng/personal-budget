# Porridge Budget redesign prototype

Start with [the shared redesign brief](porridge-budget-redesign-brief.md), then review the [sidebar workspace plan](plan-sidebar-workspace.md):

- [Sidebar workspace](plan-sidebar-workspace.md), `/prototypes/sidebar-workspace`

The prototype uses local sample data. It does not read or write budget data.

## Open the prototypes

Run `pnpm dev`, then open the route:

- `http://localhost:3000/prototypes/sidebar-workspace`

The contact form appears within About, matching the current app. `/contact` exists in route metadata but is not a live page.

## Current review status

The prototype has mock views for the live routes and not-found, local sample interactions, and Light, Dark and System controls. Its styles include responsive layouts.

The accessibility checklist still needs a manual visual and keyboard review at desktop and mobile widths. In particular, confirm contrast in both color modes, keyboard focus and navigation, chart alternatives, 320px reflow, and target sizing before choosing a direction for production work.

## Sidebar workspace update

The sidebar workspace is available at `/prototypes/sidebar-workspace`. It keeps the existing budget, transaction, progress, salary, and FIRE workflows in local sample state, with a collapsible phone navigation and phone-friendly record views. Manual accessibility review remains open.
