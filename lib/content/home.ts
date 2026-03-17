/**
 * Note 1: Home page marketing copy lives in shared data so future landing-page
 * tweaks can change messaging without editing the route component layout.
 */

import type { HomePageContent } from "../types/content";
import { APP_NAME } from "./page-titles";

export const HOME_PAGE_CONTENT = {
  hero: {
    eyebrow: "Manual-First Budgeting",
    title: APP_NAME,
    summary:
      "Track income, plan budgets, and review spending with deliberate tools that stay close to the data instead of hiding it behind automation.",
  },
  features: [
    {
      id: "transactions",
      title: "Transactions",
      description:
        "Import and review transaction history so spending reports stay grounded in the details that matter.",
    },
    {
      id: "budgets",
      title: "Budgets",
      description:
        "Create, save, and apply budgets to see how well your plan matches real monthly decisions.",
    },
    {
      id: "reports",
      title: "Reports",
      description:
        "Explore spending over time, by category, and by tag with charts that stay readable as the data changes.",
    },
    {
      id: "budget",
      title: "Budget",
      description:
        "Plan named expenses, preview a pie chart, and inspect grouped Sankey flows before you commit to a budget.",
    },
  ],
} satisfies HomePageContent;
