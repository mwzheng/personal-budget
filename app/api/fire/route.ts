import { NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth/auth";
import {
  getUserFireScenarios,
  putFireScenario,
  deleteFireScenario,
} from "@/lib/utils/fire-db";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function readNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function readOptionalNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
    const scenarios = await getUserFireScenarios(userId);
    return NextResponse.json({ ok: true, scenarios });
  } catch (err) {
    console.error("[/api/fire GET]", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 401 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
    const body = (await request.json().catch(() => null)) as unknown;
    if (!isRecord(body)) {
      return NextResponse.json(
        { ok: false, error: "Missing scenario payload" },
        { status: 400 },
      );
    }
    const created = await putFireScenario(userId, {
      name: readOptionalString(body.name) ?? "FIRE Scenario",
      currentBalance: readNumber(body.currentBalance),
      monthlyContribution: readNumber(body.monthlyContribution),
      annualReturnRate: readNumber(body.annualReturnRate),
      annualInflationRate: readNumber(body.annualInflationRate),
      annualExpenses: readNumber(body.annualExpenses),
      withdrawalRate: readNumber(body.withdrawalRate),
      targetFireNumber: readOptionalNumber(body.targetFireNumber),
      projectionYears: readNumber(body.projectionYears),
    });
    return NextResponse.json({ ok: true, created });
  } catch (err) {
    console.error("[/api/fire POST]", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 400 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
    const body = (await request.json().catch(() => null)) as unknown;
    if (!isRecord(body)) {
      return NextResponse.json(
        { ok: false, error: "Missing scenario payload" },
        { status: 400 },
      );
    }
    const scenarioId = readOptionalString(body.scenarioId);
    if (!scenarioId) {
      return NextResponse.json(
        { ok: false, error: "Missing scenarioId for update" },
        { status: 400 },
      );
    }
    const updated = await putFireScenario(userId, {
      scenarioId,
      name: readOptionalString(body.name) ?? "FIRE Scenario",
      currentBalance: readNumber(body.currentBalance),
      monthlyContribution: readNumber(body.monthlyContribution),
      annualReturnRate: readNumber(body.annualReturnRate),
      annualInflationRate: readNumber(body.annualInflationRate),
      annualExpenses: readNumber(body.annualExpenses),
      withdrawalRate: readNumber(body.withdrawalRate),
      targetFireNumber: readOptionalNumber(body.targetFireNumber),
      projectionYears: readNumber(body.projectionYears),
    });
    return NextResponse.json({ ok: true, updated });
  } catch (err) {
    console.error("[/api/fire PUT]", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);
    let scenarioId: string | undefined;
    try {
      const body = await request.json();
      scenarioId = body?.scenarioId;
    } catch {
      // ignore
    }
    if (!scenarioId) {
      const url = new URL(request.url);
      scenarioId = url.searchParams.get("scenarioId") || undefined;
    }
    if (!scenarioId) {
      return NextResponse.json(
        { ok: false, error: "Missing scenarioId" },
        { status: 400 },
      );
    }
    await deleteFireScenario(userId, scenarioId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/fire DELETE]", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 400 },
    );
  }
}
