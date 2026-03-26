/**
 * Note 1: These tests stay at the App Router boundary by mocking auth and
 * progress data helpers, which keeps the suite focused on request parsing,
 * response shapes, and route-specific derived fields instead of DynamoDB.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth2", () => ({
  getPayloadFromRequest: vi.fn(),
}));

vi.mock("@/lib/auth/users", () => ({
  upsertUserProfile: vi.fn(),
}));

vi.mock("@/lib/utils/progress", () => ({
  getUserProgressGoals: vi.fn(),
  putProgressGoal: vi.fn(),
  getUserRetirement: vi.fn(),
  putRetirement: vi.fn(),
  deleteRetirement: vi.fn(),
  getUserMilestones: vi.fn(),
  putMilestone: vi.fn(),
  deleteMilestone: vi.fn(),
}));

import {
  GET as getGoal,
  POST as postGoal,
  PUT as putGoal,
} from "@/app/api/progress/goal/route";
import {
  DELETE as deleteMilestoneRoute,
  GET as getMilestones,
  POST as postMilestone,
} from "@/app/api/progress/milestones/route";
import {
  DELETE as deleteRetirementRoute,
  GET as getRetirement,
  POST as postRetirement,
  PUT as putRetirementRoute,
} from "@/app/api/progress/retirement/route";
import { getPayloadFromRequest } from "@/lib/auth2";
import { upsertUserProfile } from "@/lib/auth/users";
import {
  deleteMilestone,
  deleteRetirement,
  getUserMilestones,
  getUserProgressGoals,
  getUserRetirement,
  putMilestone,
  putProgressGoal,
  putRetirement,
} from "@/lib/utils/progress";

const mockedGetPayloadFromRequest = vi.mocked(getPayloadFromRequest);
const mockedUpsertUserProfile = vi.mocked(upsertUserProfile);
const mockedGetUserProgressGoals = vi.mocked(getUserProgressGoals);
const mockedPutProgressGoal = vi.mocked(putProgressGoal);
const mockedGetUserRetirement = vi.mocked(getUserRetirement);
const mockedPutRetirement = vi.mocked(putRetirement);
const mockedDeleteRetirement = vi.mocked(deleteRetirement);
const mockedGetUserMilestones = vi.mocked(getUserMilestones);
const mockedPutMilestone = vi.mocked(putMilestone);
const mockedDeleteMilestone = vi.mocked(deleteMilestone);

function buildRequest(url: string, init?: RequestInit): Request {
  return new Request(url, init);
}

describe("progress api routes", () => {
  beforeEach(() => {
    mockedGetPayloadFromRequest.mockReset();
    mockedUpsertUserProfile.mockReset();
    mockedGetUserProgressGoals.mockReset();
    mockedPutProgressGoal.mockReset();
    mockedGetUserRetirement.mockReset();
    mockedPutRetirement.mockReset();
    mockedDeleteRetirement.mockReset();
    mockedGetUserMilestones.mockReset();
    mockedPutMilestone.mockReset();
    mockedDeleteMilestone.mockReset();

    mockedGetPayloadFromRequest.mockResolvedValue({ sub: "user-123" });
    mockedUpsertUserProfile.mockResolvedValue(null);

    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns goal progress using the latest retirement balance for derived fields", async () => {
    mockedGetUserProgressGoals.mockResolvedValue([
      {
        goalId: "goal-1",
        name: "Financial Independence",
        targetAmount: 200000,
      },
      {
        goalId: "goal-2",
        name: "Placeholder Goal",
        targetAmount: 0,
      },
    ]);
    mockedGetUserRetirement.mockResolvedValue([
      {
        entryId: "ret-2024",
        year: 2024,
        startAmount: 90000,
        endAmount: 100000,
      },
      {
        entryId: "ret-2026",
        year: 2026,
        startAmount: 110000,
        endAmount: 150000,
      },
      {
        entryId: "ret-2025",
        year: 2025,
        startAmount: 100000,
        endAmount: 120000,
      },
    ]);

    const response = await getGoal(
      buildRequest("http://localhost/api/progress/goal"),
    );

    expect(response.status).toBe(200);
    expect(mockedUpsertUserProfile).toHaveBeenCalledWith({ sub: "user-123" });
    expect(mockedGetUserProgressGoals).toHaveBeenCalledWith("user-123");
    expect(mockedGetUserRetirement).toHaveBeenCalledWith("user-123");
    await expect(response.json()).resolves.toEqual({
      ok: true,
      latestEnd: 150000,
      goals: [
        {
          goalId: "goal-1",
          name: "Financial Independence",
          targetAmount: 200000,
          progressPct: 75,
        },
        {
          goalId: "goal-2",
          name: "Placeholder Goal",
          targetAmount: 0,
          progressPct: null,
        },
      ],
    });
  });

  it("creates a progress goal for the authenticated user", async () => {
    mockedPutProgressGoal.mockResolvedValue({
      goalId: "goal-3",
      name: "Progress Goal",
      targetAmount: 500000,
    });

    const response = await postGoal(
      buildRequest("http://localhost/api/progress/goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetAmount: 500000 }),
      }),
    );

    expect(mockedPutProgressGoal).toHaveBeenCalledWith("user-123", {
      targetAmount: 500000,
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      created: {
        goalId: "goal-3",
        name: "Progress Goal",
        targetAmount: 500000,
      },
    });
  });

  it("updates a progress goal when goalId and targetAmount are present", async () => {
    mockedPutProgressGoal.mockResolvedValue({
      goalId: "goal-1",
      name: "Financial Independence",
      targetAmount: 250000,
    });

    const response = await putGoal(
      buildRequest("http://localhost/api/progress/goal", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goalId: "goal-1",
          targetAmount: 250000,
          name: "Financial Independence",
        }),
      }),
    );

    expect(mockedPutProgressGoal).toHaveBeenCalledWith("user-123", {
      goalId: "goal-1",
      targetAmount: 250000,
      name: "Financial Independence",
    });
    await expect(response.json()).resolves.toEqual({
      ok: true,
      updated: {
        goalId: "goal-1",
        name: "Financial Independence",
        targetAmount: 250000,
      },
    });
  });

  it("rejects goal writes when targetAmount or goalId are missing", async () => {
    const createResponse = await postGoal(
      buildRequest("http://localhost/api/progress/goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Incomplete" }),
      }),
    );
    const updateResponse = await putGoal(
      buildRequest("http://localhost/api/progress/goal", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetAmount: 1000 }),
      }),
    );

    expect(createResponse.status).toBe(400);
    await expect(createResponse.json()).resolves.toEqual({
      ok: false,
      error: "Missing targetAmount",
    });
    expect(updateResponse.status).toBe(400);
    await expect(updateResponse.json()).resolves.toEqual({
      ok: false,
      error: "Missing goalId or targetAmount",
    });
    expect(mockedPutProgressGoal).not.toHaveBeenCalled();
  });

  it("returns the goal route auth failure as a 401 response", async () => {
    mockedGetPayloadFromRequest.mockRejectedValue(
      new Error("Missing or invalid Authorization header"),
    );

    const response = await getGoal(
      buildRequest("http://localhost/api/progress/goal"),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Error: Missing or invalid Authorization header",
    });
    expect(mockedGetUserProgressGoals).not.toHaveBeenCalled();
  });

  it("returns retirement entries sorted by year and with derived change fields", async () => {
    mockedGetUserRetirement.mockResolvedValue([
      {
        entryId: "ret-2026",
        year: 2026,
        startAmount: 0,
        endAmount: 1000,
      },
      {
        entryId: "ret-2024",
        year: 2024,
        startAmount: 10000,
        endAmount: 12550,
      },
    ]);

    const response = await getRetirement(
      buildRequest("http://localhost/api/progress/retirement"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      entries: [
        {
          entryId: "ret-2024",
          year: 2024,
          startAmount: 10000,
          endAmount: 12550,
          change: 2550,
          pct: 25.5,
        },
        {
          entryId: "ret-2026",
          year: 2026,
          startAmount: 0,
          endAmount: 1000,
          change: 1000,
          pct: null,
        },
      ],
    });
  });

  it("creates and updates retirement entries", async () => {
    mockedPutRetirement
      .mockResolvedValueOnce({
        entryId: "ret-2030",
        year: 2030,
        startAmount: 100000,
        endAmount: 120000,
      })
      .mockResolvedValueOnce({
        entryId: "ret-2030",
        year: 2030,
        startAmount: 100000,
        endAmount: 130000,
      });

    const createResponse = await postRetirement(
      buildRequest("http://localhost/api/progress/retirement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: 2030,
          startAmount: 100000,
          endAmount: 120000,
        }),
      }),
    );
    const updateResponse = await putRetirementRoute(
      buildRequest("http://localhost/api/progress/retirement", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryId: "ret-2030",
          year: 2030,
          startAmount: 100000,
          endAmount: 130000,
        }),
      }),
    );

    expect(mockedPutRetirement).toHaveBeenNthCalledWith(1, "user-123", {
      year: 2030,
      startAmount: 100000,
      endAmount: 120000,
    });
    expect(mockedPutRetirement).toHaveBeenNthCalledWith(2, "user-123", {
      entryId: "ret-2030",
      year: 2030,
      startAmount: 100000,
      endAmount: 130000,
    });
    await expect(createResponse.json()).resolves.toEqual({
      ok: true,
      created: {
        entryId: "ret-2030",
        year: 2030,
        startAmount: 100000,
        endAmount: 120000,
      },
    });
    await expect(updateResponse.json()).resolves.toEqual({
      ok: true,
      updated: {
        entryId: "ret-2030",
        year: 2030,
        startAmount: 100000,
        endAmount: 130000,
      },
    });
  });

  it("deletes retirement entries from query parameters and rejects missing ids", async () => {
    const successResponse = await deleteRetirementRoute(
      buildRequest(
        "http://localhost/api/progress/retirement?entryId=ret-2028&year=2028",
        { method: "DELETE" },
      ),
    );
    const missingResponse = await deleteRetirementRoute(
      buildRequest("http://localhost/api/progress/retirement", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    );

    expect(mockedDeleteRetirement).toHaveBeenCalledWith(
      "user-123",
      "ret-2028",
      2028,
    );
    await expect(successResponse.json()).resolves.toEqual({ ok: true });
    expect(missingResponse.status).toBe(400);
    await expect(missingResponse.json()).resolves.toEqual({
      ok: false,
      error: "Missing entryId or year",
    });
  });

  it("returns the retirement route auth failure as a 401 response", async () => {
    mockedGetPayloadFromRequest.mockRejectedValue(new Error("Token expired"));

    const response = await getRetirement(
      buildRequest("http://localhost/api/progress/retirement"),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Error: Token expired",
    });
    expect(mockedGetUserRetirement).not.toHaveBeenCalled();
  });

  it("rejects retirement writes when required numeric fields are missing", async () => {
    const createResponse = await postRetirement(
      buildRequest("http://localhost/api/progress/retirement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: 2031 }),
      }),
    );
    const updateResponse = await putRetirementRoute(
      buildRequest("http://localhost/api/progress/retirement", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId: "ret-2031", endAmount: 150000 }),
      }),
    );

    expect(createResponse.status).toBe(400);
    await expect(createResponse.json()).resolves.toEqual({
      ok: false,
      error: "Missing amounts",
    });
    expect(updateResponse.status).toBe(400);
    await expect(updateResponse.json()).resolves.toEqual({
      ok: false,
      error: "Missing entryId/year",
    });
  });

  it("returns milestone entries for the authenticated user", async () => {
    mockedGetUserMilestones.mockResolvedValue([
      {
        milestoneId: "milestone-1",
        amount: 100000,
        year: 2030,
        age: 45,
        note: "First six figures",
      },
    ]);

    const response = await getMilestones(
      buildRequest("http://localhost/api/progress/milestones"),
    );

    expect(response.status).toBe(200);
    expect(mockedGetUserMilestones).toHaveBeenCalledWith("user-123");
    await expect(response.json()).resolves.toEqual({
      ok: true,
      entries: [
        {
          milestoneId: "milestone-1",
          amount: 100000,
          year: 2030,
          age: 45,
          note: "First six figures",
        },
      ],
    });
  });

  it("creates and deletes milestones, including query-string delete fallback", async () => {
    mockedPutMilestone.mockResolvedValue({
      milestoneId: "milestone-2",
      amount: 250000,
      year: 2035,
      note: "Coast FI",
    });

    const createResponse = await postMilestone(
      buildRequest("http://localhost/api/progress/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 250000,
          year: 2035,
          note: "Coast FI",
        }),
      }),
    );
    const deleteResponse = await deleteMilestoneRoute(
      buildRequest(
        "http://localhost/api/progress/milestones?milestoneId=milestone-2&year=2035",
        { method: "DELETE" },
      ),
    );

    expect(mockedPutMilestone).toHaveBeenCalledWith("user-123", {
      amount: 250000,
      year: 2035,
      note: "Coast FI",
    });
    expect(mockedDeleteMilestone).toHaveBeenCalledWith(
      "user-123",
      "milestone-2",
      2035,
    );
    await expect(createResponse.json()).resolves.toEqual({
      ok: true,
      created: {
        milestoneId: "milestone-2",
        amount: 250000,
        year: 2035,
        note: "Coast FI",
      },
    });
    await expect(deleteResponse.json()).resolves.toEqual({ ok: true });
  });

  // Note 2: Milestone deletes allow `year` to be omitted because the helper
  // falls back to `0` when rebuilding the composite DynamoDB sort key.
  it("rejects invalid milestone payloads and preserves auth failures", async () => {
    const invalidCreateResponse = await postMilestone(
      buildRequest("http://localhost/api/progress/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: 2035 }),
      }),
    );
    const missingDeleteResponse = await deleteMilestoneRoute(
      buildRequest("http://localhost/api/progress/milestones", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    );

    mockedGetPayloadFromRequest.mockRejectedValueOnce(new Error("No token"));
    const authFailureResponse = await getMilestones(
      buildRequest("http://localhost/api/progress/milestones"),
    );

    expect(invalidCreateResponse.status).toBe(400);
    await expect(invalidCreateResponse.json()).resolves.toEqual({
      ok: false,
      error: "Missing amount",
    });
    expect(missingDeleteResponse.status).toBe(400);
    await expect(missingDeleteResponse.json()).resolves.toEqual({
      ok: false,
      error: "Missing milestoneId",
    });
    expect(authFailureResponse.status).toBe(401);
    await expect(authFailureResponse.json()).resolves.toEqual({
      ok: false,
      error: "Error: No token",
    });
  });
});
