/**
 * Note 1: Budget-domain handlers for the demo API. Covers `/api/budgets` (list
 * and create) and `/api/budgets/:id` (update and delete). Budget payloads are
 * validated with `BudgetSchema` (Zod) and normalised before storage so the
 * demo store always mirrors what the real DynamoDB backend would persist.
 */

import { normalizeBudgetForStorage } from "../../utils/budget-planner";
import { createDemoId, getDemoStore, updateDemoStore } from "../demoData";
import { BudgetSchema } from "../../schemas/schemas";
import {
  type HandlerContext,
  jsonResponse,
  readJsonBody,
} from "./handlerUtils";

export async function handleBudgetRoutes(
  ctx: HandlerContext,
): Promise<Response | null> {
  const { url, method, input, init } = ctx;
  const pathname = url.pathname;

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

  // Note 2: Dynamic segment — `/api/budgets/<budgetId>` for PUT and DELETE.
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

  return null;
}
