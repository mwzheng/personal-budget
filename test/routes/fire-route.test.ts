import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/auth", () => ({
  getUserIdFromRequest: vi.fn(),
}));

vi.mock("@/lib/utils/fire-db", () => ({
  getUserFireScenarios: vi.fn(),
  putFireScenario: vi.fn(),
  deleteFireScenario: vi.fn(),
}));

import { DELETE, GET, POST, PUT } from "@/app/api/fire/route";
import {
  getUserFireScenarios,
  putFireScenario,
  deleteFireScenario,
} from "@/lib/utils/fire-db";
import { getUserIdFromRequest } from "@/lib/auth/auth";

const mockedGetUser = vi.mocked(getUserIdFromRequest);
const mockedGetScenarios = vi.mocked(getUserFireScenarios);
const mockedPutScenario = vi.mocked(putFireScenario);
const mockedDeleteScenario = vi.mocked(deleteFireScenario);

function buildRequest(url = "http://localhost/api/fire", init?: RequestInit) {
  return new Request(url, init);
}

const SAMPLE_SCENARIO = {
  scenarioId: "s-1",
  name: "Test",
  currentBalance: 100_000,
  monthlyContribution: 2_000,
  annualReturnRate: 0.07,
  annualInflationRate: 0.03,
  annualExpenses: 40_000,
  withdrawalRate: 0.04,
  targetFireNumber: null,
  projectionYears: 30,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("fire api route", () => {
  beforeEach(() => {
    mockedGetUser.mockReset();
    mockedGetScenarios.mockReset();
    mockedPutScenario.mockReset();
    mockedDeleteScenario.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET", () => {
    it("returns scenarios for authenticated user", async () => {
      mockedGetUser.mockResolvedValue("user-1");
      mockedGetScenarios.mockResolvedValue([SAMPLE_SCENARIO]);

      const res = await GET(buildRequest());
      const data = await res.json();

      expect(data.ok).toBe(true);
      expect(data.scenarios).toHaveLength(1);
      expect(data.scenarios[0].name).toBe("Test");
    });

    it("returns 401 when auth fails", async () => {
      mockedGetUser.mockRejectedValue(new Error("Unauthorized"));

      const res = await GET(buildRequest());
      expect(res.status).toBe(401);

      const data = await res.json();
      expect(data.ok).toBe(false);
    });
  });

  describe("POST", () => {
    it("creates a new scenario", async () => {
      mockedGetUser.mockResolvedValue("user-1");
      mockedPutScenario.mockResolvedValue({
        ...SAMPLE_SCENARIO,
        pk: "user#user-1",
        sk: "fireScenario#s-1",
      } as Awaited<ReturnType<typeof putFireScenario>>);

      const res = await POST(
        buildRequest("http://localhost/api/fire", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Test",
            currentBalance: 100_000,
            monthlyContribution: 2_000,
            annualReturnRate: 0.07,
            annualInflationRate: 0.03,
            annualExpenses: 40_000,
            withdrawalRate: 0.04,
            projectionYears: 30,
          }),
        }),
      );
      const data = await res.json();

      expect(data.ok).toBe(true);
      expect(data.created).toBeDefined();
      expect(mockedPutScenario).toHaveBeenCalledOnce();
    });

    it("returns 400 when body is missing", async () => {
      mockedGetUser.mockResolvedValue("user-1");

      const res = await POST(
        buildRequest("http://localhost/api/fire", { method: "POST" }),
      );
      expect(res.status).toBe(400);
    });
  });

  describe("PUT", () => {
    it("updates an existing scenario", async () => {
      mockedGetUser.mockResolvedValue("user-1");
      mockedPutScenario.mockResolvedValue({
        ...SAMPLE_SCENARIO,
        pk: "user#user-1",
        sk: "fireScenario#s-1",
      } as Awaited<ReturnType<typeof putFireScenario>>);

      const res = await PUT(
        buildRequest("http://localhost/api/fire", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scenarioId: "s-1",
            name: "Updated",
            currentBalance: 200_000,
            monthlyContribution: 3_000,
            annualReturnRate: 0.08,
            annualInflationRate: 0.03,
            annualExpenses: 50_000,
            withdrawalRate: 0.04,
            projectionYears: 25,
          }),
        }),
      );
      const data = await res.json();

      expect(data.ok).toBe(true);
      expect(data.updated).toBeDefined();
    });

    it("returns 400 when scenarioId is missing", async () => {
      mockedGetUser.mockResolvedValue("user-1");

      const res = await PUT(
        buildRequest("http://localhost/api/fire", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "NoId" }),
        }),
      );
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.error).toContain("scenarioId");
    });
  });

  describe("DELETE", () => {
    it("deletes a scenario from body", async () => {
      mockedGetUser.mockResolvedValue("user-1");
      mockedDeleteScenario.mockResolvedValue({ ok: true });

      const res = await DELETE(
        buildRequest("http://localhost/api/fire", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scenarioId: "s-1" }),
        }),
      );
      const data = await res.json();

      expect(data.ok).toBe(true);
      expect(mockedDeleteScenario).toHaveBeenCalledWith("user-1", "s-1");
    });

    it("deletes a scenario from query string", async () => {
      mockedGetUser.mockResolvedValue("user-1");
      mockedDeleteScenario.mockResolvedValue({ ok: true });

      const res = await DELETE(
        buildRequest("http://localhost/api/fire?scenarioId=s-2", {
          method: "DELETE",
        }),
      );
      const data = await res.json();

      expect(data.ok).toBe(true);
      expect(mockedDeleteScenario).toHaveBeenCalledWith("user-1", "s-2");
    });

    it("returns 400 when scenarioId is missing", async () => {
      mockedGetUser.mockResolvedValue("user-1");

      const res = await DELETE(
        buildRequest("http://localhost/api/fire", { method: "DELETE" }),
      );
      expect(res.status).toBe(400);
    });
  });
});
