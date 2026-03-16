"use client";

/**
 * Note 1: Demo mode works by emulating the app's JSON API in the browser. That
 * lets the existing pages keep their normal `apiFetch("/api/...")` calls while
 * transparently reading and writing a seeded localStorage snapshot instead of
 * touching Cognito-protected DynamoDB routes.
 */

import { filterTransactions } from "../utils/aggregations";
import { normalizeBudgetForStorage } from "../utils/budget-planner";
import { loadTransactionsFromCSV } from "../utils/csvParser";
import { transactionsToCsv } from "../utils/csvExport";
import {
  createDemoId,
  getDemoStore,
  type DemoProgressGoal,
  type DemoSavingsGoal,
  type DemoStore,
  updateDemoStore,
} from "./demoData";
import { estimateGoalETA } from "../utils/goals";
import { BudgetSchema } from "../schemas/schemas";
import type {
  MilestoneEntry,
  RetirementEntry,
  SalaryEntry,
  Transaction,
} from "../types/types";

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
}

function resolveUrl(input: RequestInfo | URL): URL {
  if (typeof input === "string") {
    return new URL(input, window.location.origin);
  }

  if (input instanceof URL) {
    return new URL(input.toString(), window.location.origin);
  }

  return new URL(input.url, window.location.origin);
}

function resolveMethod(input: RequestInfo | URL, init?: RequestInit): string {
  if (init?.method) {
    return init.method.toUpperCase();
  }

  if (input instanceof Request) {
    return input.method.toUpperCase();
  }

  return "GET";
}

async function readBodyText(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<string> {
  const body = init?.body;

  if (typeof body === "string") {
    return body;
  }

  if (body instanceof URLSearchParams) {
    return body.toString();
  }

  if (body instanceof Blob) {
    return body.text();
  }

  if (body instanceof ArrayBuffer) {
    return new TextDecoder().decode(body);
  }

  if (body && ArrayBuffer.isView(body)) {
    return new TextDecoder().decode(body);
  }

  if (body === undefined && input instanceof Request) {
    return input.clone().text();
  }

  return "";
}

async function readJsonBody<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T | null> {
  const raw = await readBodyText(input, init);
  if (!raw.trim()) {
    return null;
  }

  return JSON.parse(raw) as T;
}

function sortTransactions(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((left, right) => {
    if (left.date === right.date) {
      return left.name.localeCompare(right.name);
    }

    return right.date.localeCompare(left.date);
  });
}

function withSalaryYoY(entries: SalaryEntry[]): SalaryEntry[] {
  const sorted = [...entries].sort((left, right) => left.year - right.year);

  return sorted.map((entry, index) => {
    const previous = index > 0 ? sorted[index - 1] : null;
    const yoy =
      previous && previous.amount
        ? ((entry.amount - previous.amount) / previous.amount) * 100
        : null;

    return {
      ...entry,
      yoy: yoy === null ? null : Math.round(yoy * 100) / 100,
    };
  });
}

function withRetirementDerived(entries: RetirementEntry[]): RetirementEntry[] {
  return [...entries]
    .sort((left, right) => left.year - right.year)
    .map((entry) => {
      const change =
        Number(entry.endAmount || 0) - Number(entry.startAmount || 0);
      const pct = entry.startAmount ? (change / entry.startAmount) * 100 : null;

      return {
        ...entry,
        change,
        pct: pct === null ? null : Math.round(pct * 100) / 100,
      };
    });
}

function withGoalEta(goals: DemoSavingsGoal[]) {
  return goals.map((goal) => ({
    ...goal,
    eta: estimateGoalETA(goal),
  }));
}

function buildProgressGoalResponse(store: DemoStore) {
  const latestRetirement =
    store.retirementEntries.reduce<RetirementEntry | null>((latest, entry) => {
      if (!latest || entry.year > latest.year) {
        return entry;
      }

      return latest;
    }, null);
  const latestEnd = latestRetirement
    ? Number(latestRetirement.endAmount || 0)
    : 0;

  return {
    goals: store.progressGoals.map((goal) => ({
      ...goal,
      progressPct: goal.targetAmount
        ? Math.round((latestEnd / goal.targetAmount) * 10000) / 100
        : null,
    })),
    latestEnd,
  };
}

function appendImportedTransactions(
  current: Transaction[],
  incoming: Transaction[],
): {
  nextTransactions: Transaction[];
  imported: Transaction[];
  skipped: Array<{ tx: Transaction; error: string }>;
} {
  const existingKeys = new Set(
    current.map(
      (transaction) =>
        `${transaction.date}|${transaction.name.toLowerCase()}|${transaction.amount}`,
    ),
  );

  const imported: Transaction[] = [];
  const skipped: Array<{ tx: Transaction; error: string }> = [];

  for (const transaction of incoming) {
    const duplicateKey = `${transaction.date}|${transaction.name.toLowerCase()}|${transaction.amount}`;

    if (existingKeys.has(duplicateKey)) {
      skipped.push({ tx: transaction, error: "Duplicate transaction" });
      continue;
    }

    existingKeys.add(duplicateKey);
    imported.push({
      ...transaction,
      id: createDemoId("demo-tx"),
    });
  }

  return {
    nextTransactions: sortTransactions([...current, ...imported]),
    imported,
    skipped,
  };
}

export async function handleDemoApiRequest(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const url = resolveUrl(input);
  const method = resolveMethod(input, init);
  const pathname = url.pathname;

  if (pathname === "/api/transactions") {
    if (method === "GET") {
      return jsonResponse({
        ok: true,
        transactions: sortTransactions(getDemoStore().transactions),
      });
    }

    if (method === "POST") {
      const body = (await readJsonBody<Transaction>(input, init)) ?? null;
      if (!body) {
        return jsonResponse(
          { ok: false, error: "Missing transaction payload" },
          { status: 400 },
        );
      }

      const created: Transaction = {
        ...body,
        id: body.id || createDemoId("demo-tx"),
      };

      updateDemoStore((current) => ({
        ...current,
        transactions: sortTransactions([...current.transactions, created]),
      }));

      return jsonResponse({ ok: true, created });
    }

    if (method === "PUT") {
      const body = (await readJsonBody<Transaction>(input, init)) ?? null;
      if (!body?.id) {
        return jsonResponse(
          { ok: false, error: "Missing id for update" },
          { status: 400 },
        );
      }

      updateDemoStore((current) => ({
        ...current,
        transactions: sortTransactions(
          current.transactions.map((transaction) =>
            transaction.id === body.id ? body : transaction,
          ),
        ),
      }));

      return jsonResponse({ ok: true, updated: body });
    }

    if (method === "DELETE") {
      const body =
        (await readJsonBody<{ id?: string }>(input, init)) ??
        ({} as { id?: string });
      const id = body.id ?? url.searchParams.get("id") ?? undefined;

      if (!id) {
        return jsonResponse(
          { ok: false, error: "Missing id" },
          { status: 400 },
        );
      }

      updateDemoStore((current) => ({
        ...current,
        transactions: current.transactions.filter(
          (transaction) => transaction.id !== id,
        ),
      }));

      return jsonResponse({ ok: true });
    }
  }

  if (pathname === "/api/reports/import" && method === "POST") {
    const body =
      (await readJsonBody<{ csv?: string }>(input, init)) ??
      ({} as { csv?: string });
    const csvText = body.csv ?? (await readBodyText(input, init));

    if (!csvText.trim()) {
      return jsonResponse(
        {
          error: { code: "INVALID_INPUT", message: "No CSV payload provided" },
        },
        { status: 400 },
      );
    }

    const parsed = loadTransactionsFromCSV(csvText);
    const currentStore = getDemoStore();
    const { nextTransactions, imported, skipped } = appendImportedTransactions(
      currentStore.transactions,
      parsed,
    );

    updateDemoStore((current) => ({
      ...current,
      transactions: nextTransactions,
    }));

    return jsonResponse({
      ok: true,
      importedCount: imported.length,
      transactions: imported,
      sample: imported.slice(0, 50),
      skipped,
    });
  }

  if (pathname === "/api/reports/export" && method === "GET") {
    const years = (url.searchParams.get("years") || "")
      .split(",")
      .filter(Boolean);
    const tags = (url.searchParams.get("tags") || "")
      .split(",")
      .filter(Boolean);
    const filtered = filterTransactions(getDemoStore().transactions, {
      years,
      startDate: url.searchParams.get("startDate"),
      endDate: url.searchParams.get("endDate"),
      tags,
      search: url.searchParams.get("search") ?? "",
    });
    const csv = transactionsToCsv(filtered);

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="transactions_export.csv"',
      },
    });
  }

  if (pathname === "/api/salary") {
    if (method === "GET") {
      return jsonResponse({
        ok: true,
        entries: withSalaryYoY(getDemoStore().salaryEntries),
      });
    }

    if (method === "POST") {
      const body =
        (await readJsonBody<Partial<SalaryEntry>>(input, init)) ?? undefined;
      if (
        !body ||
        typeof body.year !== "number" ||
        typeof body.amount !== "number"
      ) {
        return jsonResponse(
          { ok: false, error: "Missing year or amount" },
          { status: 400 },
        );
      }

      const created: SalaryEntry = {
        entryId: createDemoId("demo-salary"),
        year: body.year,
        amount: body.amount,
        note: body.note?.trim(),
      };

      updateDemoStore((current) => ({
        ...current,
        salaryEntries: [...current.salaryEntries, created],
      }));

      return jsonResponse({ ok: true, created });
    }

    if (method === "PUT") {
      const body =
        (await readJsonBody<Partial<SalaryEntry>>(input, init)) ?? undefined;
      if (
        !body ||
        !body.entryId ||
        typeof body.year !== "number" ||
        typeof body.amount !== "number"
      ) {
        return jsonResponse(
          { ok: false, error: "Missing entryId/year/amount" },
          { status: 400 },
        );
      }

      const updated: SalaryEntry = {
        entryId: body.entryId,
        year: body.year,
        amount: body.amount,
        note: body.note?.trim(),
      };

      updateDemoStore((current) => ({
        ...current,
        salaryEntries: current.salaryEntries.map((entry) =>
          entry.entryId === updated.entryId ? updated : entry,
        ),
      }));

      return jsonResponse({ ok: true, updated });
    }

    if (method === "DELETE") {
      const body =
        (await readJsonBody<{ entryId?: string }>(input, init)) ??
        ({} as { entryId?: string });
      const entryId =
        body.entryId ?? url.searchParams.get("entryId") ?? undefined;

      if (!entryId) {
        return jsonResponse(
          { ok: false, error: "Missing entryId or year" },
          { status: 400 },
        );
      }

      updateDemoStore((current) => ({
        ...current,
        salaryEntries: current.salaryEntries.filter(
          (entry) => entry.entryId !== entryId,
        ),
      }));

      return jsonResponse({ ok: true });
    }
  }

  if (pathname === "/api/progress/retirement") {
    if (method === "GET") {
      return jsonResponse({
        ok: true,
        entries: withRetirementDerived(getDemoStore().retirementEntries),
      });
    }

    if (method === "POST") {
      const body =
        (await readJsonBody<Partial<RetirementEntry>>(input, init)) ??
        undefined;
      if (
        !body ||
        typeof body.year !== "number" ||
        typeof body.startAmount !== "number" ||
        typeof body.endAmount !== "number"
      ) {
        return jsonResponse(
          { ok: false, error: "Missing year or amounts" },
          { status: 400 },
        );
      }

      const created: RetirementEntry = {
        entryId: createDemoId("demo-retirement"),
        year: body.year,
        startAmount: body.startAmount,
        endAmount: body.endAmount,
      };

      updateDemoStore((current) => ({
        ...current,
        retirementEntries: [...current.retirementEntries, created],
      }));

      return jsonResponse({ ok: true, created });
    }

    if (method === "PUT") {
      const body =
        (await readJsonBody<Partial<RetirementEntry>>(input, init)) ??
        undefined;
      if (
        !body ||
        !body.entryId ||
        typeof body.year !== "number" ||
        typeof body.startAmount !== "number" ||
        typeof body.endAmount !== "number"
      ) {
        return jsonResponse(
          { ok: false, error: "Missing entryId/year" },
          { status: 400 },
        );
      }

      const updated: RetirementEntry = {
        entryId: body.entryId,
        year: body.year,
        startAmount: body.startAmount,
        endAmount: body.endAmount,
      };

      updateDemoStore((current) => ({
        ...current,
        retirementEntries: current.retirementEntries.map((entry) =>
          entry.entryId === updated.entryId ? updated : entry,
        ),
      }));

      return jsonResponse({ ok: true, updated });
    }

    if (method === "DELETE") {
      const body =
        (await readJsonBody<{ entryId?: string }>(input, init)) ??
        ({} as { entryId?: string });
      const entryId =
        body.entryId ?? url.searchParams.get("entryId") ?? undefined;

      if (!entryId) {
        return jsonResponse(
          { ok: false, error: "Missing entryId or year" },
          { status: 400 },
        );
      }

      updateDemoStore((current) => ({
        ...current,
        retirementEntries: current.retirementEntries.filter(
          (entry) => entry.entryId !== entryId,
        ),
      }));

      return jsonResponse({ ok: true });
    }
  }

  if (pathname === "/api/progress/goal") {
    if (method === "GET") {
      const { goals, latestEnd } = buildProgressGoalResponse(getDemoStore());
      return jsonResponse({ ok: true, goals, latestEnd });
    }

    if (method === "POST") {
      const body =
        (await readJsonBody<Partial<DemoProgressGoal>>(input, init)) ??
        undefined;
      if (!body || typeof body.targetAmount !== "number") {
        return jsonResponse(
          { ok: false, error: "Missing targetAmount" },
          { status: 400 },
        );
      }

      const created: DemoProgressGoal = {
        goalId: createDemoId("demo-progress-goal"),
        targetAmount: body.targetAmount,
      };

      updateDemoStore((current) => ({
        ...current,
        progressGoals: [created],
      }));

      return jsonResponse({ ok: true, created });
    }

    if (method === "PUT") {
      const body =
        (await readJsonBody<Partial<DemoProgressGoal>>(input, init)) ??
        undefined;
      if (!body?.goalId || typeof body.targetAmount !== "number") {
        return jsonResponse(
          { ok: false, error: "Missing goalId or targetAmount" },
          { status: 400 },
        );
      }

      const updated: DemoProgressGoal = {
        goalId: body.goalId,
        targetAmount: body.targetAmount,
      };

      updateDemoStore((current) => ({
        ...current,
        progressGoals: current.progressGoals.length
          ? current.progressGoals.map((goal) =>
              goal.goalId === updated.goalId ? updated : goal,
            )
          : [updated],
      }));

      return jsonResponse({ ok: true, updated });
    }
  }

  if (pathname === "/api/progress/milestones") {
    if (method === "GET") {
      return jsonResponse({ ok: true, entries: getDemoStore().milestones });
    }

    if (method === "POST") {
      const body =
        (await readJsonBody<Partial<MilestoneEntry>>(input, init)) ?? undefined;
      if (!body || typeof body.amount !== "number") {
        return jsonResponse(
          { ok: false, error: "Missing amount" },
          { status: 400 },
        );
      }

      const created: MilestoneEntry = {
        milestoneId: createDemoId("demo-milestone"),
        amount: body.amount,
        year: body.year ?? null,
        age: body.age ?? null,
      };

      updateDemoStore((current) => ({
        ...current,
        milestones: [...current.milestones, created],
      }));

      return jsonResponse({ ok: true, created });
    }

    if (method === "DELETE") {
      const body =
        (await readJsonBody<{ milestoneId?: string }>(input, init)) ??
        ({} as { milestoneId?: string });
      const milestoneId =
        body.milestoneId ?? url.searchParams.get("milestoneId") ?? undefined;

      if (!milestoneId) {
        return jsonResponse(
          { ok: false, error: "Missing milestoneId" },
          { status: 400 },
        );
      }

      updateDemoStore((current) => ({
        ...current,
        milestones: current.milestones.filter(
          (entry) => entry.milestoneId !== milestoneId,
        ),
      }));

      return jsonResponse({ ok: true });
    }
  }

  if (pathname === "/api/goals") {
    if (method === "GET") {
      return jsonResponse({
        ok: true,
        goals: withGoalEta(getDemoStore().goals),
      });
    }

    if (method === "POST") {
      const body =
        (await readJsonBody<Partial<DemoSavingsGoal>>(input, init)) ??
        undefined;
      if (!body) {
        return jsonResponse(
          { ok: false, error: "Missing goal payload" },
          { status: 400 },
        );
      }

      const created: DemoSavingsGoal = {
        goalId: createDemoId("demo-goal"),
        name: body.name?.trim() || "Untitled Goal",
        targetAmount: Number(body.targetAmount || 0),
        currentSaved: Number(body.currentSaved || 0),
        monthlyContribution: Number(body.monthlyContribution || 0),
        expectedAnnualReturn: Number(body.expectedAnnualReturn || 0),
      };

      updateDemoStore((current) => ({
        ...current,
        goals: [...current.goals, created],
      }));

      return jsonResponse({
        ok: true,
        created,
        eta: estimateGoalETA(created),
      });
    }

    if (method === "PUT") {
      const body =
        (await readJsonBody<Partial<DemoSavingsGoal>>(input, init)) ??
        undefined;
      if (!body?.goalId) {
        return jsonResponse(
          { ok: false, error: "Missing goalId for update" },
          { status: 400 },
        );
      }

      const updated: DemoSavingsGoal = {
        goalId: body.goalId,
        name: body.name?.trim() || "Untitled Goal",
        targetAmount: Number(body.targetAmount || 0),
        currentSaved: Number(body.currentSaved || 0),
        monthlyContribution: Number(body.monthlyContribution || 0),
        expectedAnnualReturn: Number(body.expectedAnnualReturn || 0),
      };

      updateDemoStore((current) => ({
        ...current,
        goals: current.goals.map((goal) =>
          goal.goalId === updated.goalId ? updated : goal,
        ),
      }));

      return jsonResponse({
        ok: true,
        updated,
        eta: estimateGoalETA(updated),
      });
    }

    if (method === "DELETE") {
      const body =
        (await readJsonBody<{ goalId?: string }>(input, init)) ??
        ({} as { goalId?: string });
      const goalId = body.goalId ?? url.searchParams.get("goalId") ?? undefined;

      if (!goalId) {
        return jsonResponse(
          { ok: false, error: "Missing goalId" },
          { status: 400 },
        );
      }

      updateDemoStore((current) => ({
        ...current,
        goals: current.goals.filter((goal) => goal.goalId !== goalId),
      }));

      return jsonResponse({ ok: true });
    }
  }

  if (pathname === "/api/budgets" && method === "GET") {
    return jsonResponse({ ok: true, budgets: getDemoStore().budgets });
  }

  if (pathname === "/api/budgets" && method === "POST") {
    const body = (await readJsonBody<unknown>(input, init)) ?? undefined;
    const parseResult = BudgetSchema.safeParse(body);

    if (!parseResult.success) {
      return jsonResponse(
        {
          ok: false,
          error: {
            code: "validation_error",
            issues: parseResult.error.format(),
          },
        },
        { status: 422 },
      );
    }

    const now = new Date().toISOString();
    const created = normalizeBudgetForStorage({
      ...parseResult.data,
      budgetId: createDemoId("demo-budget"),
      createdAt: parseResult.data.createdAt || now,
      updatedAt: now,
    });

    updateDemoStore((current) => ({
      ...current,
      budgets: [created, ...current.budgets],
    }));

    return jsonResponse({ ok: true, created });
  }

  if (pathname.startsWith("/api/budgets/")) {
    const budgetId = pathname.split("/").at(-1);

    if (!budgetId) {
      return jsonResponse(
        { ok: false, error: "Missing budget id" },
        { status: 400 },
      );
    }

    if (method === "DELETE") {
      updateDemoStore((current) => ({
        ...current,
        budgets: current.budgets.filter(
          (budget) => budget.budgetId !== budgetId,
        ),
      }));

      return jsonResponse({ ok: true });
    }

    if (method === "PUT") {
      const body = (await readJsonBody<unknown>(input, init)) ?? undefined;
      const parseResult = BudgetSchema.safeParse(body);

      if (!parseResult.success) {
        return jsonResponse(
          {
            ok: false,
            error: {
              code: "validation_error",
              issues: parseResult.error.format(),
            },
          },
          { status: 422 },
        );
      }

      const existingBudget = getDemoStore().budgets.find(
        (budget) => budget.budgetId === budgetId,
      );
      const updated = normalizeBudgetForStorage({
        ...parseResult.data,
        budgetId,
        createdAt: parseResult.data.createdAt || existingBudget?.createdAt,
        updatedAt: new Date().toISOString(),
      });

      updateDemoStore((current) => ({
        ...current,
        budgets: current.budgets.map((budget) =>
          budget.budgetId === budgetId ? updated : budget,
        ),
      }));

      return jsonResponse({ ok: true, updated });
    }
  }

  return jsonResponse(
    {
      ok: false,
      error: `Demo mode does not handle ${method} ${pathname}`,
    },
    { status: 404 },
  );
}
