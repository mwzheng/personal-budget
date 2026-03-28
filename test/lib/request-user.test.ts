// Note 1: These tests lock down the server-side user resolution rules so future
// auth refactors cannot silently fall back to shared demo data for signed-in users.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getPayloadFromRequestMock } = vi.hoisted(() => ({
  getPayloadFromRequestMock: vi.fn(),
}));

// Note 2: requestUser.ts imports `getPayloadFromRequest` from `@/lib/auth/auth`.
vi.mock("@/lib/auth/auth", () => ({
  getPayloadFromRequest: getPayloadFromRequestMock,
}));

import { DEMO_USER_ID, getRequestUserId } from "@/lib/auth/requestUser";

const mockedGetPayloadFromRequest = vi.mocked(getPayloadFromRequestMock);

describe("request user helpers", () => {
  const originalDisableAuth = process.env.DISABLE_AUTH;

  beforeEach(() => {
    if (originalDisableAuth === undefined) {
      delete process.env.DISABLE_AUTH;
    } else {
      process.env.DISABLE_AUTH = originalDisableAuth;
    }
    mockedGetPayloadFromRequest.mockReset();
  });

  afterEach(() => {
    if (originalDisableAuth === undefined) {
      delete process.env.DISABLE_AUTH;
    } else {
      process.env.DISABLE_AUTH = originalDisableAuth;
    }
  });

  it("returns the demo user only when DISABLE_AUTH is explicitly enabled", async () => {
    process.env.DISABLE_AUTH = "true";

    await expect(
      getRequestUserId(new Request("http://localhost")),
    ).resolves.toBe(DEMO_USER_ID);
    expect(mockedGetPayloadFromRequest).not.toHaveBeenCalled();
  });

  it("returns the Cognito subject when auth is enabled", async () => {
    mockedGetPayloadFromRequest.mockResolvedValue({ sub: "user-123" });

    await expect(
      getRequestUserId(new Request("http://localhost")),
    ).resolves.toBe("user-123");
    expect(mockedGetPayloadFromRequest).toHaveBeenCalledTimes(1);
  });

  it("surfaces JWT failures as a 401 response", async () => {
    mockedGetPayloadFromRequest.mockRejectedValue(
      new Error("Missing or invalid Authorization header"),
    );

    let thrown: unknown;
    try {
      await getRequestUserId(new Request("http://localhost"));
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(Response);

    const response = thrown as Response;
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "unauthorized",
        message: "Missing or invalid Authorization header",
      },
    });
  });
});
