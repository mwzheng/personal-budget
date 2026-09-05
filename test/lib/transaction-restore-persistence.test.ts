import { beforeEach, describe, expect, it, vi } from "vitest";
const { send } = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock("@/lib/api/dynamoClient", () => ({ getDocClient: () => ({ send }) }));
import {
  deleteTransaction,
  restoreTransaction,
  TransactionRestoreConflict,
} from "@/lib/api/dynamo";
const tx = {
  id: "one",
  date: "2026-09-01",
  name: "Coffee",
  amount: 4,
  category: "Want" as const,
  notes: "",
  paymentMethod: "",
  tags: [],
  createdAt: "2025-01-01T00:00:00Z",
};
beforeEach(() => send.mockReset());
describe("transaction restore persistence", () => {
  it("deletes using ALL_OLD and strips storage fields", async () => {
    send.mockResolvedValue({
      Attributes: { ...tx, pk: "user#a", sk: "private" },
    });
    expect(await deleteTransaction("a", tx.id, tx.date)).toEqual({
      ok: true,
      deleted: tx,
    });
    expect(send.mock.calls[0][0].input).toMatchObject({
      ReturnValues: "ALL_OLD",
    });
  });
  it("conditionally creates with original details and fresh updatedAt", async () => {
    send.mockResolvedValue({});
    const result = await restoreTransaction("a", tx);
    expect(result).toMatchObject(tx);
    expect(result.updatedAt).toBeDefined();
    expect(send.mock.calls[0][0].input).toMatchObject({
      ConditionExpression: "attribute_not_exists(pk)",
      Item: { pk: "user#a", createdAt: tx.createdAt },
    });
  });
  it("treats an identical existing record as successful retry without writing twice", async () => {
    send
      .mockRejectedValueOnce(
        Object.assign(new Error(), { name: "ConditionalCheckFailedException" }),
      )
      .mockResolvedValueOnce({ Item: tx });
    expect(await restoreTransaction("a", tx)).toEqual(tx);
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[1][0].input.ConsistentRead).toBe(true);
  });
  it("never overwrites a conflicting existing record", async () => {
    send
      .mockRejectedValueOnce(
        Object.assign(new Error(), { name: "ConditionalCheckFailedException" }),
      )
      .mockResolvedValueOnce({ Item: { ...tx, amount: 9 } });
    await expect(restoreTransaction("a", tx)).rejects.toBeInstanceOf(
      TransactionRestoreConflict,
    );
    expect(send).toHaveBeenCalledTimes(2);
  });
});
