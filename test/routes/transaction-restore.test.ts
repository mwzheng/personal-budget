import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/auth/requestUser", () => ({ getRequestUserId: vi.fn() }));
vi.mock("@/lib/api/dynamo", () => ({
  restoreTransaction: vi.fn(),
  TransactionRestoreConflict: class extends Error {},
}));
import { POST } from "@/app/api/transactions/restore/route";
import { getRequestUserId } from "@/lib/auth/requestUser";
import {
  restoreTransaction,
  TransactionRestoreConflict,
} from "@/lib/api/dynamo";
const tx = {
  id: "one",
  date: "2026-09-01",
  name: "Coffee",
  amount: 4,
  category: "Want",
  notes: "",
  paymentMethod: "",
  tags: [],
};
const request = (transaction: unknown) =>
  new Request("http://localhost/api/transactions/restore", {
    method: "POST",
    body: JSON.stringify({ transaction }),
  });
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getRequestUserId).mockResolvedValue("user-a");
});
describe("restore route", () => {
  it("uses authenticated ownership and returns restored record", async () => {
    vi.mocked(restoreTransaction).mockResolvedValue(tx as never);
    const result = await POST(request({ ...tx, pk: "user#b" }));
    expect(result.status).toBe(200);
    expect(restoreTransaction).toHaveBeenCalledWith("user-a", tx);
    expect(await result.json()).toEqual({ ok: true, restored: tx });
  });
  it("rejects unauthenticated requests before writing", async () => {
    vi.mocked(getRequestUserId).mockRejectedValue(
      new Response(null, { status: 401 }),
    );
    expect((await POST(request(tx))).status).toBe(401);
    expect(restoreTransaction).not.toHaveBeenCalled();
  });
  it("rejects invalid data", async () => {
    expect((await POST(request({ ...tx, amount: -1 }))).status).toBe(400);
    expect(restoreTransaction).not.toHaveBeenCalled();
  });
  it("reports conflicting and retryable errors separately", async () => {
    vi.mocked(restoreTransaction).mockRejectedValueOnce(
      new TransactionRestoreConflict("Conflict"),
    );
    expect((await POST(request(tx))).status).toBe(409);
    vi.mocked(restoreTransaction).mockRejectedValueOnce(new Error("network"));
    expect((await POST(request(tx))).status).toBe(500);
  });
});
