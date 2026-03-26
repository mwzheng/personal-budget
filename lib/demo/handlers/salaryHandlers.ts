/**
 * Note 1: Salary-history handlers for the demo API (`/api/salary`). The GET
 * response enriches entries with a year-over-year percentage (`yoy`) computed
 * in `withSalaryYoY` so the UI can display salary growth without extra logic.
 */

import { createDemoId, getDemoStore, updateDemoStore } from "../demoData";
import type { SalaryEntry } from "../../types/types";
import {
  type HandlerContext,
  jsonResponse,
  readJsonBody,
} from "./handlerUtils";

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

export async function handleSalaryRoutes(
  ctx: HandlerContext,
): Promise<Response | null> {
  const { url, method, input, init } = ctx;

  if (url.pathname !== "/api/salary") {
    return null;
  }

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

  return null;
}
