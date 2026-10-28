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
      "I was already tracking spending manually across multiple tools. I built this to bring my budgeting into one place and learn as a developer while making a tool I would use.",
  },
  {
    id: "why-no-auto-imports",
    category: "philosophy",
    question: "Why not connect banks and import everything automatically?",
    answer:
      "The app does not connect to banks. You can enter transactions yourself or import them from a CSV file, then review them in Reports.",
  },
  {
    id: "bank-credentials",
    category: "data",
    question: "Do I need to give the app my bank credentials?",
    answer:
      "No. The app is built around manual entry and CSV imports, not live bank connections.",
  },
  {
    id: "data-storage",
    category: "data",
    question: "Where is my data stored?",
    answer:
      "When you use an account, the app stores your financial data in AWS DynamoDB and uses AWS Cognito for sign-in. Demo data stays in your browser. Avoid entering passwords, account numbers, bank credentials, or other sensitive information.",
  },
  {
    id: "manual-vs-csv",
    category: "workflow",
    question: "Is everything manual, or can I use CSV files?",
    answer:
      "You can do either. Expense CSV files need Name, Amount, Category, and Date columns. Income files need Source, Amount, and Pay Date. Expense files can also include Notes, Payment Method, and Tags.",
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
      "Yes. Choose Continue with Demo on the sign-in page to explore with sample data. Demo edits are stored in your browser and cleared when you sign out or start a new demo session. Saving FIRE scenarios is not available in demo mode.",
  },
  {
    id: "export-data",
    category: "data",
    question: "Can I export my data?",
    answer:
      "You can export filtered transactions from Reports as a CSV file and export the active budget from the Budget Planner. These exports do not include all data in your account.",
  },
  {
    id: "fire-calculator",
    category: "features",
    question: "What is the FIRE calculator?",
    answer:
      "FIRE stands for Financial Independence, Retire Early. The calculator projects investment growth and estimates how long it may take to reach your financial independence goal. Results depend on your assumptions and can differ from actual outcomes. They are estimates, not financial advice.",
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
      "Savings Progress tracks your retirement savings goal, recorded balances, and milestones. Salary History is a separate page for salary entries and year-over-year comparisons.",
  },
] as const satisfies readonly FaqItem[];

export const FAQ_PAGE_CONTENT = {
  hero: {
    eyebrow: "FAQ",
    title: `Questions About ${APP_NAME}`,
    summary:
      "Common questions about the app, the manual-first workflow, and core features.",
  },
  intro: {
    heading: "Frequently Asked Questions",
    description:
      "Browse the most common questions about how the app works, why it prioritizes manual entry, and what you can track.",
  },
  items: FAQ_ITEMS,
} satisfies FaqPageContent;
