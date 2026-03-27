import { PutCommand, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { getDocClient } from "../api/dynamoClient";
import { generateId } from "./generateId";
import { SK_PREFIX } from "../api/tableKeys";
import type { FireScenario } from "../types/types";

const TABLE_NAME = process.env.DYNAMODB_TABLE || "";

interface FireScenarioQueryItem {
  scenarioId?: unknown;
  name?: unknown;
  currentBalance?: unknown;
  monthlyContribution?: unknown;
  annualReturnRate?: unknown;
  annualInflationRate?: unknown;
  annualExpenses?: unknown;
  withdrawalRate?: unknown;
  targetFireNumber?: unknown;
  projectionYears?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}

function readOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export async function putFireScenario(
  userId: string,
  scenario: {
    scenarioId?: string;
    name: string;
    currentBalance: number;
    monthlyContribution: number;
    annualReturnRate: number;
    annualInflationRate: number;
    annualExpenses: number;
    withdrawalRate: number;
    targetFireNumber?: number | null;
    projectionYears: number;
  },
) {
  const client = getDocClient(TABLE_NAME);
  if (!client) throw new Error("DynamoDB table not configured");
  const now = new Date().toISOString();
  const id = scenario.scenarioId || generateId();
  const item = {
    pk: `user#${userId}`,
    sk: `${SK_PREFIX.FIRE_SCENARIO}${id}`,
    scenarioId: id,
    name: scenario.name,
    currentBalance: scenario.currentBalance,
    monthlyContribution: scenario.monthlyContribution,
    annualReturnRate: scenario.annualReturnRate,
    annualInflationRate: scenario.annualInflationRate,
    annualExpenses: scenario.annualExpenses,
    withdrawalRate: scenario.withdrawalRate,
    targetFireNumber: scenario.targetFireNumber ?? null,
    projectionYears: scenario.projectionYears,
    createdAt: now,
    updatedAt: now,
  } as const;
  await client.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  return item;
}

export async function getUserFireScenarios(
  userId: string,
): Promise<FireScenario[]> {
  const client = getDocClient(TABLE_NAME);
  if (!client) return [];
  const pk = `user#${userId}`;
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: "#pk = :pk and begins_with(#sk, :prefix)",
    ExpressionAttributeNames: { "#pk": "pk", "#sk": "sk" },
    ExpressionAttributeValues: {
      ":pk": pk,
      ":prefix": SK_PREFIX.FIRE_SCENARIO,
    },
  } as const;
  const res = await client.send(new QueryCommand(params));
  const items = (res.Items ?? []) as FireScenarioQueryItem[];
  return items.map((item) => ({
    scenarioId: String(item.scenarioId || ""),
    name: String(item.name || ""),
    currentBalance: Number(item.currentBalance || 0),
    monthlyContribution: Number(item.monthlyContribution || 0),
    annualReturnRate: Number(item.annualReturnRate || 0),
    annualInflationRate: Number(item.annualInflationRate || 0),
    annualExpenses: Number(item.annualExpenses || 0),
    withdrawalRate: Number(item.withdrawalRate || 0),
    targetFireNumber: item.targetFireNumber
      ? Number(item.targetFireNumber)
      : null,
    projectionYears: Number(item.projectionYears || 0),
    createdAt: readOptionalString(item.createdAt),
    updatedAt: readOptionalString(item.updatedAt),
  }));
}

export async function deleteFireScenario(
  userId: string,
  scenarioId: string,
): Promise<{ ok: true }> {
  const client = getDocClient(TABLE_NAME);
  if (!client) throw new Error("DynamoDB table not configured");
  const sk = `${SK_PREFIX.FIRE_SCENARIO}${scenarioId}`;
  await client.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { pk: `user#${userId}`, sk },
    }),
  );
  return { ok: true };
}
