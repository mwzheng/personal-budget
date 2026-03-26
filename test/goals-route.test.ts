// Note 1: These tests exercise `app/api/goals/route.ts` at the HTTP boundary so
// auth behavior, payload normalization, and ETA enrichment stay covered even if
// the DynamoDB helpers or goal math internals are refactored later.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/auth", () => ({
  getUserIdFromRequest: vi.fn(),
}));

vi.mock("@/lib/api/dynamo", () => ({
  deleteGoal: vi.fn(),
  getUserGoals: vi.fn(),
  putGoal: vi.fn(),
}));

import { DELETE, GET, POST, PUT } from "@/app/api/goals/route";
import { deleteGoal, getUserGoals, putGoal } from "@/lib/api/dynamo";
import { getUserIdFromRequest } from "@/lib/auth/auth";

const mockedDeleteGoal = vi.mocked(deleteGoal);
const mockedGetUserGoals = vi.mocked(getUserGoals);
const mockedGetUserIdFromRequest = vi.mocked(getUserIdFromRequest);
const mockedPutGoal = vi.mocked(putGoal);

function buildGoalsRequest(
  url = "http://localhost/api/goals",
  init?: RequestInit,
) {
  return new Request(url, init);
}

describe("goals api route", () => {
  beforeEach(() => {
    mockedDeleteGoal.mockReset();
    mockedGetUserGoals.mockReset();
    mockedGetUserIdFromRequest.mockReset();
    mockedPutGoal.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-26T12:34:56.000Z"));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("returns only the authenticated user's goals with ETA enrichment", async () => {
    mockedGetUserIdFromRequest.mockResolvedValue("user-123");
    mockedGetUserGoals.mockResolvedValue([
      {
        goalId: "goal-1",
        name: "Emergency Fund",
        targetAmount: 2000,
        currentSaved: 1000,
        monthlyContribution: 100,
        expectedAnnualReturn: 0,
      },
      {
        goalId: "goal-2",
        name: "Travel Fund",
        targetAmount: 5000,
        currentSaved: 500,
        monthlyContribution: 0,
        expectedAnnualReturn: 0,
      },
    ]);

    const response = await GET(buildGoalsRequest());

    expect(mockedGetUserIdFromRequest).toHaveBeenCalledTimes(1);
    expect(mockedGetUserGoals).toHaveBeenCalledWith("user-123");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      goals: [
        {
          goalId: "goal-1",
          name: "Emergency Fund",
          targetAmount: 2000,
          currentSaved: 1000,
          monthlyContribution: 100,
          expectedAnnualReturn: 0,
          eta: {
            months: 10,
            projectedDate: expect.stringMatching(
              /^2027-01-26T\d{2}:34:56\.000Z$/,
            ),
          },
        },
        {
          goalId: "goal-2",
          name: "Travel Fund",
          targetAmount: 5000,
          currentSaved: 500,
          monthlyContribution: 0,
          expectedAnnualReturn: 0,
          // Note 2: The API now serializes an unreachable ETA as `null` + `null`
          // because JSON cannot preserve `Infinity`. The UI still treats this as
          // "no ETA" and renders the same em dash fallback for the user.
          eta: {
            months: null,
            projectedDate: null,
          },
        },
      ],
    });
  });

  it("creates a goal for the authenticated user after normalizing numeric strings", async () => {
    mockedGetUserIdFromRequest.mockResolvedValue("user-456");
    mockedPutGoal.mockImplementation(async (_userId, goal) => ({
      ...goal,
      goalId: "goal-3",
      createdAt: "2026-03-26T12:34:56.000Z",
      updatedAt: "2026-03-26T12:34:56.000Z",
    }));

    const response = await POST(
      buildGoalsRequest("http://localhost/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "  Emergency Fund  ",
          targetAmount: "5000",
          currentSaved: "1000",
          monthlyContribution: "400",
          expectedAnnualReturn: "0",
        }),
      }),
    );

    expect(mockedPutGoal).toHaveBeenCalledTimes(1);
    expect(mockedPutGoal).toHaveBeenCalledWith("user-456", {
      goalId: undefined,
      name: "Emergency Fund",
      targetAmount: 5000,
      currentSaved: 1000,
      monthlyContribution: 400,
      expectedAnnualReturn: 0,
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      created: {
        goalId: "goal-3",
        name: "Emergency Fund",
        targetAmount: 5000,
        currentSaved: 1000,
        monthlyContribution: 400,
        expectedAnnualReturn: 0,
        createdAt: "2026-03-26T12:34:56.000Z",
        updatedAt: "2026-03-26T12:34:56.000Z",
      },
      eta: {
        months: 10,
        projectedDate: expect.stringMatching(/^2027-01-26T\d{2}:34:56\.000Z$/),
      },
    });
  });

  it("updates an existing goal when goalId is supplied", async () => {
    mockedGetUserIdFromRequest.mockResolvedValue("user-789");
    mockedPutGoal.mockImplementation(async (_userId, goal) => ({
      ...goal,
      updatedAt: "2026-03-26T12:34:56.000Z",
    }));

    const response = await PUT(
      buildGoalsRequest("http://localhost/api/goals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goalId: "goal-4",
          name: "  House Deposit  ",
          targetAmount: "2600",
          currentSaved: "200",
          monthlyContribution: "200",
          expectedAnnualReturn: "0",
        }),
      }),
    );

    expect(mockedPutGoal).toHaveBeenCalledWith("user-789", {
      goalId: "goal-4",
      name: "House Deposit",
      targetAmount: 2600,
      currentSaved: 200,
      monthlyContribution: 200,
      expectedAnnualReturn: 0,
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      updated: {
        goalId: "goal-4",
        name: "House Deposit",
        targetAmount: 2600,
        currentSaved: 200,
        monthlyContribution: 200,
        expectedAnnualReturn: 0,
        updatedAt: "2026-03-26T12:34:56.000Z",
      },
      eta: {
        months: 12,
        projectedDate: expect.stringMatching(/^2027-03-26T\d{2}:34:56\.000Z$/),
      },
    });
  });

  it("deletes a goal using the query-string goalId path", async () => {
    mockedGetUserIdFromRequest.mockResolvedValue("user-delete");
    mockedDeleteGoal.mockResolvedValue(undefined as never);

    const response = await DELETE(
      buildGoalsRequest("http://localhost/api/goals?goalId=goal-99", {
        method: "DELETE",
      }),
    );

    expect(mockedDeleteGoal).toHaveBeenCalledWith("user-delete", "goal-99");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it("rejects create requests that do not send a JSON goal payload", async () => {
    mockedGetUserIdFromRequest.mockResolvedValue("user-101");

    const response = await POST(
      buildGoalsRequest("http://localhost/api/goals", {
        method: "POST",
      }),
    );

    expect(mockedPutGoal).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Missing goal payload",
    });
  });

  it("requires goalId when updating an existing goal", async () => {
    mockedGetUserIdFromRequest.mockResolvedValue("user-102");

    const response = await PUT(
      buildGoalsRequest("http://localhost/api/goals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Goal without id",
          targetAmount: 1000,
        }),
      }),
    );

    expect(mockedPutGoal).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Missing goalId for update",
    });
  });

  it("preserves the route's auth failure response shape", async () => {
    mockedGetUserIdFromRequest.mockRejectedValue(
      new Error("Missing or invalid Authorization header"),
    );

    const response = await GET(buildGoalsRequest());

    expect(mockedGetUserGoals).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Error: Missing or invalid Authorization header",
    });
  });
});
