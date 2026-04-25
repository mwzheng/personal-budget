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
      "I'm a software engineer with 5+ years of experience. This is a personal project I maintain alongside full-time work.",
  },
  {
    id: "why-it-exists",
    category: "philosophy",
    question: `Why build ${APP_NAME}?`,
    answer:
      "I was already tracking spending manually across multiple tools. I built this to consolidate that workflow without losing the clarity that comes from staying close to your data.",
  },
  {
    id: "why-no-auto-imports",
    category: "philosophy",
    question: "Why not connect banks and import everything automatically?",
    answer:
      "Automatic imports make it easy to stop paying attention. This app prioritizes manual entry so each expense gets a moment of review, keeping spending decisions visible.",
  },
  {
    id: "bank-credentials",
    category: "data",
    question: "Do I need to give the app my bank credentials?",
    answer:
      "No. The app is built around manual entry and CSV imports, not live bank connections.",
  },
  {
    id: "manual-vs-csv",
    category: "workflow",
    question: "Is everything manual, or can I use CSV files?",
    answer:
      "Manual entry is preferred, but CSV imports are supported for convenience. Either way, the goal is to stay close to the data.",
  },
  {
    id: "what-can-i-track",
    category: "features",
    question: "What can I track?",
    answer:
      "Transactions, spending reports, month comparisons, budgets, FIRE scenarios, salary history, and long-term progress.",
  },
  {
    id: "demo-mode",
    category: "features",
    question: "Can I try it before creating an account?",
    answer:
      "Yes. Demo mode lets you explore the workflow before committing to a real account.",
  },
  {
    id: "export-data",
    category: "data",
    question: "Can I export my data?",
    answer:
      "Yes. Data portability matters. You can export your data at any time.",
  },
  {
    id: "fire-calculator",
    category: "features",
    question: "What is the FIRE calculator?",
    answer:
      "FIRE stands for Financial Independence, Retire Early. The calculator projects investment growth, compares scenarios, and estimates time to reach your independence number.",
  },
  {
    id: "month-comparison",
    category: "features",
    question: "Can I compare spending between months?",
    answer:
      "Yes. Reports include side-by-side month comparisons with summary cards, percentage changes, charts, and top-tag breakdowns.",
  },
  {
    id: "progress-tracking",
    category: "features",
    question: "What does the progress page track?",
    answer:
      "Salary history, retirement contributions, and financial milestones in one workspace with charts and year-aware views.",
  },
] as const satisfies readonly FaqItem[];

export const FAQ_PAGE_CONTENT = {
  hero: {
    eyebrow: "FAQ",
    title: `Questions about ${APP_NAME}`,
    summary:
      "Common questions about the app, the manual-first workflow, and core features.",
  },
  intro: {
    heading: "Frequently asked questions",
    description:
      "Browse the most common questions about how the app works, why it prioritizes manual entry, and what you can track.",
  },
  items: FAQ_ITEMS,
} satisfies FaqPageContent;
