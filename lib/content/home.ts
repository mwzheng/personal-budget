import type { HomePageContent } from "../types/content";
import { APP_NAME } from "./page-titles";

export const HOME_PAGE_CONTENT = {
  hero: {
    eyebrow: "Manual-First Budgeting",
    title: APP_NAME,
    summary:
      "Track spending, plan budgets, and review financial progress without losing sight of the details.",
  },
  features: [
    {
      id: "transactions",
      title: "Transactions",
      description:
        "Import data or enter expenses manually. Review transactions with filters, tags, and search.",
      supportingCopy: "Manual-first tracking for everyday spending.",
    },
    {
      id: "reports",
      title: "Reports & Comparison",
      description:
        "View spending trends by category, compare months side-by-side, and drill into tagged expenses.",
      supportingCopy: "Clear comparisons for months, categories, and trends.",
    },
    {
      id: "budget",
      title: "Budgets & Sankey",
      description:
        "Build and save budgets with flexible categories. Preview pie charts and Sankey graphs.",
      supportingCopy: "Thoughtful planning for flexible budget categories.",
    },
    {
      id: "fire",
      title: "FIRE Calculator",
      description:
        "Project investment growth, estimate time to financial independence, and compare multiple scenarios.",
      supportingCopy: "Long-range modeling for financial independence goals.",
    },
    {
      id: "progress",
      title: "Progress Tracker",
      description:
        "Track salary history, retirement contributions, and financial milestones in one workspace.",
      supportingCopy: "Ongoing visibility into savings and long-term progress.",
    },
  ],
} satisfies HomePageContent;
