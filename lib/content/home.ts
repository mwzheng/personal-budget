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
      id: "reports",
      title: "Reports & Comparison",
      description:
        "Explore spending over time, by category, and by tag with interactive charts and side-by-side month comparisons.",
    },
    {
      id: "budget",
      title: "Budgets & Sankey",
      description:
        "Create named budgets with expense rows, preview a pie chart, and inspect grouped Sankey flows before you commit to a plan.",
    },
    {
      id: "fire",
      title: "FIRE Calculator",
      description:
        "Calculate your Financial Independence number, project investment growth, and compare retirement scenarios with interactive charts.",
    },
    {
      id: "progress",
      title: "Progress Tracker",
      description:
        "Follow salary history, retirement contributions, and milestones from one long-term financial progress workspace.",
    },
  ],
} satisfies HomePageContent;
