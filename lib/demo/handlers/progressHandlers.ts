/**
 * Note 1: Progress-tracking handlers for the demo API. Covers three related
 * sub-routes that share the `/api/progress/` prefix:
 *   - `/api/progress/retirement` — retirement account yearly snapshots
 *   - `/api/progress/goal`       — single aggregate savings-progress goal
 *   - `/api/progress/milestones` — milestone markers for the progress chart
 *
 * Helper functions (`withRetirementDerived`, `buildProgressGoalResponse`) are
 * colocated here because they are only relevant to these routes.
 */

import {
  createDemoId,
  getDemoStore,
  type DemoProgressGoal,
  type DemoStore,
  updateDemoStore,
} from "../demoData";
import type { MilestoneEntry, RetirementEntry } from "../../types/types";
import {
  MilestoneCreateSchema,
  MilestoneUpdateSchema,
} from "../../schemas/schemas";
import {
  type HandlerContext,
  jsonResponse,
  readJsonBody,
} from "./handlerUtils";

// Note 2: Derives `change` and `pct` fields from raw start/end amounts so the
// UI can render growth indicators without duplicating the calculation logic.
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

/* ------------------------------------------------------------------ */
/*  Retirement                                                         */
/* ------------------------------------------------------------------ */

async function handleRetirement(ctx: HandlerContext): Promise<Response | null> {
  const { method, input, init, url } = ctx;

  if (method === "GET") {
    return jsonResponse({
      ok: true,
      entries: withRetirementDerived(getDemoStore().retirementEntries),
    });
  }

  if (method === "POST") {
    const body =
      (await readJsonBody<Partial<RetirementEntry>>(input, init)) ?? undefined;
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
      (await readJsonBody<Partial<RetirementEntry>>(input, init)) ?? undefined;
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

  return null;
}

/* ------------------------------------------------------------------ */
/*  Progress goal                                                      */
/* ------------------------------------------------------------------ */

async function handleProgressGoal(
  ctx: HandlerContext,
): Promise<Response | null> {
  const { method, input, init } = ctx;

  if (method === "GET") {
    const { goals, latestEnd } = buildProgressGoalResponse(getDemoStore());
    return jsonResponse({ ok: true, goals, latestEnd });
  }

  if (method === "POST") {
    const body =
      (await readJsonBody<Partial<DemoProgressGoal>>(input, init)) ?? undefined;
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
      (await readJsonBody<Partial<DemoProgressGoal>>(input, init)) ?? undefined;
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

  return null;
}

/* ------------------------------------------------------------------ */
/*  Milestones                                                         */
/* ------------------------------------------------------------------ */

async function handleMilestones(ctx: HandlerContext): Promise<Response | null> {
  const { method, input, init, url } = ctx;

  if (method === "GET") {
    return jsonResponse({ ok: true, entries: getDemoStore().milestones });
  }

  if (method === "POST") {
    const body =
      (await readJsonBody<Partial<MilestoneEntry>>(input, init)) ?? undefined;
    const parsed = MilestoneCreateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonResponse(
        { ok: false, error: "Invalid milestone" },
        { status: 400 },
      );
    }

    const created: MilestoneEntry = {
      milestoneId: createDemoId("demo-milestone"),
      amount: parsed.data.amount,
      year: parsed.data.year ?? null,
      month: parsed.data.month ?? null,
      age: parsed.data.age ?? null,
      note: parsed.data.note,
    };

    updateDemoStore((current) => ({
      ...current,
      milestones: [...current.milestones, created],
    }));

    return jsonResponse({ ok: true, created });
  }

  if (method === "PUT") {
    const body =
      (await readJsonBody<Partial<MilestoneEntry>>(input, init)) ?? undefined;
    const parsed = MilestoneUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonResponse(
        { ok: false, error: "Invalid milestone" },
        { status: 400 },
      );
    }

    const updated: MilestoneEntry = {
      milestoneId: parsed.data.milestoneId,
      amount: parsed.data.amount,
      year: parsed.data.year ?? null,
      month: parsed.data.month ?? null,
      age: parsed.data.age ?? null,
      note: parsed.data.note,
    };
    updateDemoStore((current) => ({
      ...current,
      milestones: current.milestones.map((entry) =>
        entry.milestoneId === updated.milestoneId ? updated : entry,
      ),
    }));
    return jsonResponse({ ok: true, updated });
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

  return null;
}

/* ------------------------------------------------------------------ */
/*  Top-level router for all /api/progress/* routes                    */
/* ------------------------------------------------------------------ */

export async function handleProgressRoutes(
  ctx: HandlerContext,
): Promise<Response | null> {
  const pathname = ctx.url.pathname;

  if (pathname === "/api/progress/retirement") {
    return handleRetirement(ctx);
  }

  if (pathname === "/api/progress/goal") {
    return handleProgressGoal(ctx);
  }

  if (pathname === "/api/progress/milestones") {
    return handleMilestones(ctx);
  }

  return null;
}
