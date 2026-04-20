/**
 * Note 1: FAQ entries are stored as structured data so a future page can render
 * them as accordions, lists, or search results without rewriting the answers.
 */

import type { FaqItem, FaqPageContent } from "../types/content";
import { APP_NAME } from "./page-titles";

export const FAQ_ITEMS = [
  {
    id: "creator",
    category: "creator",
    question: `Who built ${APP_NAME}?`,
    answer:
      "Porridge Budget was developed and is maintained by a software engineer with over five years of professional experience. It is a personal project maintained alongside full-time work.",
  },
  {
    id: "why-it-exists",
    category: "philosophy",
    question: `Why build ${APP_NAME} in the first place?`,
    answer:
      "I started the project as a hobby build because I was already tracking money manually in Excel and Notion. Porridge Budget brings that workflow into one place without losing the clarity of a hands-on habit.",
  },
  {
    id: "why-no-auto-imports",
    category: "philosophy",
    question: "Why not connect banks and import everything automatically?",
    answer:
      "Automatic imports can be convenient, but they can also make it easy to stop paying attention. This app intentionally leans toward mindful manual entry so each expense still gets a moment of review.",
  },
  {
    id: "bank-credentials",
    category: "data",
    question: "Do I need to give the app my bank credentials?",
    answer:
      "No. The workflow is built around manual entry and CSV handling rather than live bank connections, which keeps the product simpler and keeps the budgeting loop deliberate.",
  },
  {
    id: "manual-vs-csv",
    category: "workflow",
    question: "Is everything manual, or can I still use CSV files?",
    answer:
      "Manual entry is the preferred habit, but the app also supports CSV workflows so you do not need to key every row by hand. The point is still to stay close to the data instead of hiding it behind a sync.",
  },
  {
    id: "what-can-i-track",
    category: "features",
    question: "What can I track today?",
    answer:
      "The current app focuses on transactions, reports with month comparison, budgets, FIRE scenarios, salary history, and longer-term progress views. It is meant to help with both day-to-day spending review and slower-moving financial momentum.",
  },
  {
    id: "demo-mode",
    category: "features",
    question: "Can I try it before creating an account?",
    answer:
      "Yes. The app already supports a demo flow so people can explore the experience before treating it like a real habit, which makes it easier to evaluate the workflow first.",
  },
  {
    id: "export-data",
    category: "data",
    question: "Can I export my data again later?",
    answer:
      "Yes. Export matters because the project is supposed to support ownership, not lock-in. Keeping data portable is consistent with the spreadsheet-and-Notion roots of the app.",
  },
  {
    id: "fire-calculator",
    category: "features",
    question: "What is the FIRE calculator?",
    answer:
      "FIRE stands for Financial Independence, Retire Early. The calculator lets you project investment growth under different assumptions, compare multiple scenarios, and estimate how long it could take to reach your target number.",
  },
  {
    id: "month-comparison",
    category: "features",
    question: "Can I compare spending between months?",
    answer:
      "Yes. The reports page includes a Compare button that opens a side-by-side month view with summary cards, percentage changes, a grouped bar chart, and top-tag comparisons.",
  },
  {
    id: "progress-tracking",
    category: "features",
    question: "What does the progress page track?",
    answer:
      "The progress page combines salary history, retirement contributions, and financial milestones into one long-term workspace with charts and year-aware views.",
  },
] as const satisfies readonly FaqItem[];

export const FAQ_PAGE_CONTENT = {
  hero: {
    eyebrow: "FAQ",
    title: `Questions about ${APP_NAME}`,
    summary:
      "Short answers about the creator, the workflow, core features, and why the product favors manual budgeting over passive automation.",
  },
  items: FAQ_ITEMS,
} satisfies FaqPageContent;
