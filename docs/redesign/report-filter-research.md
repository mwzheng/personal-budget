# Report filter design research

## Question

How should the prototype report page expose date range, search, category, tags, and amount filters without making the controls hard to scan?

## Patterns considered

| Pattern                                                  | Strength                                           | Fit for this report                                                                        |
| -------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Keep every filter visible in one grid                    | No hidden controls                                 | Rejected. Search and tag inputs compete for space, especially on narrow screens.           |
| Put all filters in a modal                               | Leaves more room for the report                    | Rejected. Users lose sight of the date and search controls while reviewing results.        |
| Keep date and search visible, disclose secondary filters | Keeps frequent controls at hand and limits clutter | Chosen. Category, tags, and amount are available through a labeled “More filters” control. |

## Findings

- The Carbon data table pattern places search, filters, and other table tools in a toolbar. This supports keeping report search and filter access in one predictable area. [Carbon data table guidelines](https://www.carbondesignsystem.com/building-blocks/core/components/data-table/guidelines)
- USWDS recommends a search field at least 27 characters wide, with a visible or accessible label, and advises against making advanced search the default. This supports a wide primary search input and hiding the less common filters until requested. [USWDS search](https://designsystem.digital.gov/components/search/)
- USWDS presents a date range as two separately labeled inputs and recommends allowing people to type dates. That suits the report's “Start date” and “End date” controls. [USWDS date range picker](https://designsystem.digital.gov/components/date-range-picker/)
- GOV.UK says a calendar is most useful when users need to see dates in relation to each other or need weekday context. For ordinary reporting dates, avoid forcing a calendar-only interaction. [GOV.UK date pattern](https://design-system.service.gov.uk/patterns/dates/)

## Design decision

Keep a wide transaction search, start and end date inputs, a “More filters” disclosure, and a clear action in one toolbar. Place category, included and excluded tags, and amount bounds in the disclosed area. Use labeled checkboxes for the prototype's existing tags so people can select several without typing separators. Show a count on the disclosure when secondary filters are active. Keep the date fields available at all times because they define the report period.
