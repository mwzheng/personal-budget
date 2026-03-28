// Note 1: These tests exercise the salary route at the HTTP boundary so auth,
// user scoping, validation, and derived year-over-year fields stay covered even
// if the DynamoDB helpers are refactored behind the route later.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/auth", () => ({
  getPayloadFromRequest: vi.fn(),
}));

vi.mock("@/lib/auth/users", () => ({
  upsertUserProfile: vi.fn(),
}));

vi.mock("@/lib/utils/salary", () => ({
  putSalary: vi.fn(),
  getUserSalary: vi.fn(),
  deleteSalary: vi.fn(),
}));

import { DELETE, GET, POST, PUT } from "@/app/api/salary/route";
import { getPayloadFromRequest } from "@/lib/auth/auth";
import { upsertUserProfile } from "@/lib/auth/users";
import { deleteSalary, getUserSalary, putSalary } from "@/lib/utils/salary";

const mockedGetPayloadFromRequest = vi.mocked(getPayloadFromRequest);
const mockedUpsertUserProfile = vi.mocked(upsertUserProfile);
const mockedDeleteSalary = vi.mocked(deleteSalary);
const mockedGetUserSalary = vi.mocked(getUserSalary);
const mockedPutSalary = vi.mocked(putSalary);

function buildSalaryRequest(path = "/api/salary", init?: RequestInit) {
  return new Request(`http://localhost${path}`, init);
}

describe("salary api route", () => {
  beforeEach(() => {
    mockedGetPayloadFromRequest.mockReset();
    mockedUpsertUserProfile.mockReset();
    mockedDeleteSalary.mockReset();
    mockedGetUserSalary.mockReset();
    mockedPutSalary.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns only the authenticated user's salary entries with sorted rounded yoy values", async () => {
    mockedGetPayloadFromRequest.mockResolvedValue({ sub: "user-salary" });
    mockedUpsertUserProfile.mockResolvedValue(null);
    mockedGetUserSalary.mockResolvedValue([
      { entryId: "salary-2025", year: 2025, amount: 65555, note: "Current" },
      { entryId: "salary-2023", year: 2023, amount: 0, note: "Reset year" },
      { entryId: "salary-2024", year: 2024, amount: 60000, note: "Promotion" },
      { entryId: "salary-2022", year: 2022, amount: 50000, note: "Base" },
    ]);

    const response = await GET(buildSalaryRequest());

    expect(mockedGetUserSalary).toHaveBeenCalledWith("user-salary");
    expect(mockedUpsertUserProfile).toHaveBeenCalledWith({
      sub: "user-salary",
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      entries: [
        {
          entryId: "salary-2022",
          year: 2022,
          amount: 50000,
          note: "Base",
          yoy: null,
        },
        {
          entryId: "salary-2023",
          year: 2023,
          amount: 0,
          note: "Reset year",
          yoy: -100,
        },
        {
          entryId: "salary-2024",
          year: 2024,
          amount: 60000,
          note: "Promotion",
          yoy: null,
        },
        {
          entryId: "salary-2025",
          year: 2025,
          amount: 65555,
          note: "Current",
          yoy: 9.26,
        },
      ],
    });
  });

  it("creates a salary entry for the authenticated user", async () => {
    mockedGetPayloadFromRequest.mockResolvedValue({ sub: "user-create" });
    mockedUpsertUserProfile.mockResolvedValue(null);
    mockedPutSalary.mockImplementation(async (_userId, entry) => ({
      entryId: "salary-created",
      ...entry,
      note: entry.note ?? "",
    }));

    const response = await POST(
      buildSalaryRequest("/api/salary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Note 2: `amount: 0` is intentionally valid because salary history can
        // include unemployment or sabbatical years and the route validates by
        // numeric type instead of truthiness.
        body: JSON.stringify({
          year: 2026,
          amount: 0,
          note: "Sabbatical",
        }),
      }),
    );

    expect(mockedPutSalary).toHaveBeenCalledWith("user-create", {
      year: 2026,
      amount: 0,
      note: "Sabbatical",
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      created: {
        entryId: "salary-created",
        year: 2026,
        amount: 0,
        note: "Sabbatical",
      },
    });
  });

  it("rejects salary creation when required numeric fields are missing", async () => {
    mockedGetPayloadFromRequest.mockResolvedValue({ sub: "user-invalid" });
    mockedUpsertUserProfile.mockResolvedValue(null);

    const response = await POST(
      buildSalaryRequest("/api/salary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: 2026 }),
      }),
    );

    expect(mockedPutSalary).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Missing year or amount",
    });
  });

  it("updates an existing salary entry for the authenticated user", async () => {
    mockedGetPayloadFromRequest.mockResolvedValue({ sub: "user-update" });
    mockedUpsertUserProfile.mockResolvedValue(null);
    mockedPutSalary.mockResolvedValue({
      entryId: "salary-2024",
      year: 2024,
      amount: 72000,
      note: "Merit increase",
    });

    const response = await PUT(
      buildSalaryRequest("/api/salary", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryId: "salary-2024",
          year: 2024,
          amount: 72000,
          note: "Merit increase",
        }),
      }),
    );

    expect(mockedPutSalary).toHaveBeenCalledWith("user-update", {
      entryId: "salary-2024",
      year: 2024,
      amount: 72000,
      note: "Merit increase",
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      updated: {
        entryId: "salary-2024",
        year: 2024,
        amount: 72000,
        note: "Merit increase",
      },
    });
  });

  it("rejects salary updates that omit the entry identifier", async () => {
    mockedGetPayloadFromRequest.mockResolvedValue({
      sub: "user-update-invalid",
    });
    mockedUpsertUserProfile.mockResolvedValue(null);

    const response = await PUT(
      buildSalaryRequest("/api/salary", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: 2024,
          amount: 72000,
        }),
      }),
    );

    expect(mockedPutSalary).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Missing entryId/year/amount",
    });
  });

  it("deletes a salary entry using the delete body when provided", async () => {
    mockedGetPayloadFromRequest.mockResolvedValue({ sub: "user-delete" });
    mockedUpsertUserProfile.mockResolvedValue(null);
    mockedDeleteSalary.mockResolvedValue({ ok: true });

    const response = await DELETE(
      buildSalaryRequest("/api/salary", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryId: "salary-2024",
          year: 2024,
        }),
      }),
    );

    expect(mockedDeleteSalary).toHaveBeenCalledWith(
      "user-delete",
      "salary-2024",
      2024,
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it("falls back to delete query parameters when the client sends no body", async () => {
    mockedGetPayloadFromRequest.mockResolvedValue({ sub: "user-delete-query" });
    mockedUpsertUserProfile.mockResolvedValue(null);
    mockedDeleteSalary.mockResolvedValue({ ok: true });

    const response = await DELETE(
      buildSalaryRequest("/api/salary?entryId=salary-2023&year=2023", {
        method: "DELETE",
      }),
    );

    expect(mockedDeleteSalary).toHaveBeenCalledWith(
      "user-delete-query",
      "salary-2023",
      2023,
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it("returns the route's auth failure response when salary fetch auth fails", async () => {
    mockedGetPayloadFromRequest.mockRejectedValue(
      new Error("Missing or invalid Authorization header"),
    );

    const response = await GET(buildSalaryRequest());

    expect(mockedGetUserSalary).not.toHaveBeenCalled();
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Error: Missing or invalid Authorization header",
    });
  });
});
