/**
 * Note 1: Savings-goal handlers for the demo API (`/api/goals`). Each response
 * enriches goals with an `eta` field computed by `estimateGoalETA` so the UI
 * always receives a projected completion date without extra client-side work.
 */

import {
  createDemoId,
  getDemoStore,
  type DemoSavingsGoal,
  updateDemoStore,
} from "../demoData";
import { estimateGoalETA } from "../../utils/goals";
import {
  type HandlerContext,
  jsonResponse,
  readJsonBody,
} from "./handlerUtils";

function withGoalEta(goals: DemoSavingsGoal[]) {
  return goals.map((goal) => ({
    ...goal,
    eta: estimateGoalETA(goal),
  }));
}

export async function handleGoalRoutes(
  ctx: HandlerContext,
): Promise<Response | null> {
  const { url, method, input, init } = ctx;

  if (url.pathname !== "/api/goals") {
    return null;
  }

  if (method === "GET") {
    return jsonResponse({
      ok: true,
      goals: withGoalEta(getDemoStore().goals),
    });
  }

  if (method === "POST") {
    const body =
      (await readJsonBody<Partial<DemoSavingsGoal>>(input, init)) ?? undefined;
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
      (await readJsonBody<Partial<DemoSavingsGoal>>(input, init)) ?? undefined;
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

  return null;
}
