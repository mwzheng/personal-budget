"use client";

/**
 * Note 1: Demo mode needs a realistic multi-page dataset, but it must stay fully
 * browser-local so clicking around the app never writes to DynamoDB. This module
 * owns that seeded snapshot plus the localStorage helpers that keep demo edits
 * alive across page navigations and refreshes until the user signs out.
 */

import type { Goal as SavingsGoal } from "../goals";
import type {
  MilestoneEntry,
  RetirementEntry,
  SalaryEntry,
  SavedBudget,
  Transaction,
} from "../types";

export interface DemoProgressGoal {
  goalId: string;
  targetAmount: number;
}

export interface DemoSavingsGoal extends SavingsGoal {
  goalId: string;
}

export interface DemoStore {
  transactions: Transaction[];
  salaryEntries: SalaryEntry[];
  retirementEntries: RetirementEntry[];
  progressGoals: DemoProgressGoal[];
  milestones: MilestoneEntry[];
  goals: DemoSavingsGoal[];
  budgets: SavedBudget[];
}

const DEMO_STORE_KEY = "porridge-budget-demo-store";

function cloneDemoStore(store: DemoStore): DemoStore {
  return JSON.parse(JSON.stringify(store)) as DemoStore;
}

function createSeededBudgets(): SavedBudget[] {
  return [
    {
      budgetId: "demo-budget-balanced",
      name: "Balanced Month",
      monthlyIncome: 5200,
      expenses: [
        {
          expenseId: "demo-expense-rent",
          name: "Rent",
          amount: 1750,
          category: "Need",
          group: "Housing",
        },
        {
          expenseId: "demo-expense-groceries",
          name: "Groceries",
          amount: 540,
          category: "Need",
          group: "Living > Food",
        },
        {
          expenseId: "demo-expense-transport",
          name: "Transit + Gas",
          amount: 260,
          category: "Need",
          group: "Living > Transport",
        },
        {
          expenseId: "demo-expense-fun",
          name: "Fun Budget",
          amount: 420,
          category: "Want",
          group: "Lifestyle > Entertainment",
        },
        {
          expenseId: "demo-expense-travel",
          name: "Travel Fund",
          amount: 250,
          category: "Want",
          group: "Lifestyle > Trips",
        },
        {
          expenseId: "demo-expense-emergency",
          name: "Emergency Savings",
          amount: 900,
          category: "Saving",
          group: "Savings > Emergency Fund",
        },
        {
          expenseId: "demo-expense-retirement",
          name: "Retirement Investing",
          amount: 700,
          category: "Saving",
          group: "Savings > Retirement",
        },
      ],
      allocations: [
        { category: "Need", amount: 2550 },
        { category: "Want", amount: 670 },
        { category: "Saving", amount: 1600 },
      ],
      createdAt: "2026-02-20T12:00:00.000Z",
      updatedAt: "2026-02-20T12:00:00.000Z",
    },
    {
      budgetId: "demo-budget-lean",
      name: "Lean Month",
      monthlyIncome: 4800,
      expenses: [
        {
          expenseId: "demo-expense-rent-lean",
          name: "Rent",
          amount: 1750,
          category: "Need",
          group: "Housing",
        },
        {
          expenseId: "demo-expense-groceries-lean",
          name: "Groceries",
          amount: 450,
          category: "Need",
          group: "Living > Food",
        },
        {
          expenseId: "demo-expense-utilities-lean",
          name: "Utilities",
          amount: 220,
          category: "Need",
          group: "Living > Utilities",
        },
        {
          expenseId: "demo-expense-social-lean",
          name: "Social Spending",
          amount: 220,
          category: "Want",
          group: "Lifestyle > Social",
        },
        {
          expenseId: "demo-expense-savings-lean",
          name: "Rainy Day Fund",
          amount: 950,
          category: "Saving",
          group: "Savings > Emergency Fund",
        },
      ],
      allocations: [
        { category: "Need", amount: 2420 },
        { category: "Want", amount: 220 },
        { category: "Saving", amount: 950 },
      ],
      createdAt: "2026-01-10T12:00:00.000Z",
      updatedAt: "2026-01-10T12:00:00.000Z",
    },
  ];
}

export function createSeededDemoStore(): DemoStore {
  return {
    transactions: [
      {
        id: "demo-tx-rent-mar",
        name: "Rent",
        amount: 1750,
        category: "Need",
        date: "2026-03-01",
        notes: "Main apartment payment",
        paymentMethod: "Bank Transfer",
        tags: ["Housing", "Fixed"],
      },
      {
        id: "demo-tx-grocery-mar",
        name: "Trader Joe's",
        amount: 126.48,
        category: "Need",
        date: "2026-03-05",
        notes: "Weekly groceries",
        paymentMethod: "Credit Card",
        tags: ["Groceries", "Food"],
      },
      {
        id: "demo-tx-savings-mar",
        name: "Emergency Fund Transfer",
        amount: 400,
        category: "Saving",
        date: "2026-03-06",
        notes: "Automatic transfer",
        paymentMethod: "Bank Transfer",
        tags: ["Savings", "Emergency Fund"],
      },
      {
        id: "demo-tx-coffee-mar",
        name: "Coffee Shop",
        amount: 18.7,
        category: "Want",
        date: "2026-03-07",
        notes: "Weekend meetup",
        paymentMethod: "Debit Card",
        tags: ["Treat", "Social"],
      },
      {
        id: "demo-tx-electric-feb",
        name: "Electric Bill",
        amount: 82.14,
        category: "Need",
        date: "2026-02-14",
        notes: "",
        paymentMethod: "Autopay",
        tags: ["Utilities", "Housing"],
      },
      {
        id: "demo-tx-concert-feb",
        name: "Concert Tickets",
        amount: 96,
        category: "Want",
        date: "2026-02-20",
        notes: "Spring tour",
        paymentMethod: "Credit Card",
        tags: ["Entertainment", "Friends"],
      },
      {
        id: "demo-tx-retirement-jan",
        name: "IRA Contribution",
        amount: 350,
        category: "Saving",
        date: "2026-01-10",
        notes: "Monthly retirement contribution",
        paymentMethod: "Bank Transfer",
        tags: ["Retirement", "Investing"],
      },
      {
        id: "demo-tx-gas-jan",
        name: "Gas Station",
        amount: 41.92,
        category: "Need",
        date: "2026-01-22",
        notes: "",
        paymentMethod: "Credit Card",
        tags: ["Transport", "Car"],
      },
    ],
    salaryEntries: [
      {
        entryId: "demo-salary-2023",
        year: 2023,
        amount: 72000,
        note: "Base salary",
      },
      {
        entryId: "demo-salary-2024",
        year: 2024,
        amount: 76000,
        note: "Performance raise",
      },
      {
        entryId: "demo-salary-2025",
        year: 2025,
        amount: 82000,
        note: "Promotion year",
      },
    ],
    retirementEntries: [
      {
        entryId: "demo-retirement-2023",
        year: 2023,
        startAmount: 25000,
        endAmount: 31250,
      },
      {
        entryId: "demo-retirement-2024",
        year: 2024,
        startAmount: 31250,
        endAmount: 40800,
      },
      {
        entryId: "demo-retirement-2025",
        year: 2025,
        startAmount: 40800,
        endAmount: 53600,
      },
    ],
    progressGoals: [
      {
        goalId: "demo-progress-goal",
        targetAmount: 100000,
      },
    ],
    milestones: [
      {
        milestoneId: "demo-milestone-six-figures",
        amount: 100000,
        year: 2027,
        age: 35,
      },
      {
        milestoneId: "demo-milestone-quarter-mil",
        amount: 250000,
        year: 2030,
        age: null,
      },
    ],
    goals: [
      {
        goalId: "demo-goal-emergency",
        name: "Emergency Fund",
        targetAmount: 12000,
        currentSaved: 4500,
        monthlyContribution: 400,
        expectedAnnualReturn: 0,
      },
      {
        goalId: "demo-goal-travel",
        name: "Japan Trip",
        targetAmount: 6000,
        currentSaved: 1800,
        monthlyContribution: 250,
        expectedAnnualReturn: 0.02,
      },
    ],
    budgets: createSeededBudgets(),
  };
}

export function createDemoId(prefix: string): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getDemoStore(): DemoStore {
  if (typeof window === "undefined") {
    return createSeededDemoStore();
  }

  const raw = window.localStorage.getItem(DEMO_STORE_KEY);
  if (!raw) {
    return resetDemoStore();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<DemoStore>;
    const seeded = createSeededDemoStore();

    return {
      transactions: Array.isArray(parsed.transactions)
        ? (parsed.transactions as Transaction[])
        : seeded.transactions,
      salaryEntries: Array.isArray(parsed.salaryEntries)
        ? (parsed.salaryEntries as SalaryEntry[])
        : seeded.salaryEntries,
      retirementEntries: Array.isArray(parsed.retirementEntries)
        ? (parsed.retirementEntries as RetirementEntry[])
        : seeded.retirementEntries,
      progressGoals: Array.isArray(parsed.progressGoals)
        ? (parsed.progressGoals as DemoProgressGoal[])
        : seeded.progressGoals,
      milestones: Array.isArray(parsed.milestones)
        ? (parsed.milestones as MilestoneEntry[])
        : seeded.milestones,
      goals: Array.isArray(parsed.goals)
        ? (parsed.goals as DemoSavingsGoal[])
        : seeded.goals,
      budgets: Array.isArray(parsed.budgets)
        ? (parsed.budgets as SavedBudget[])
        : seeded.budgets,
    };
  } catch {
    return resetDemoStore();
  }
}

export function setDemoStore(store: DemoStore): DemoStore {
  const nextStore = cloneDemoStore(store);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(DEMO_STORE_KEY, JSON.stringify(nextStore));
  }

  return nextStore;
}

export function updateDemoStore(
  updater: (current: DemoStore) => DemoStore,
): DemoStore {
  return setDemoStore(updater(getDemoStore()));
}

export function resetDemoStore(): DemoStore {
  return setDemoStore(createSeededDemoStore());
}

export function clearDemoStore(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(DEMO_STORE_KEY);
}
