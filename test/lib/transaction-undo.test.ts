import { afterEach, describe, expect, it, vi } from "vitest";
import { TransactionUndoController } from "@/lib/reports/transactionUndo";
import { RestoreTransactionSchema } from "@/lib/utils/transaction-restore";
import type { Transaction } from "@/lib/types/types";
const tx: Transaction = {
  id: "one",
  name: "Coffee",
  date: "2026-09-01",
  amount: 4.25,
  category: "Want",
  notes: "note",
  paymentMethod: "Cash",
  tags: ["cafe"],
};
const response = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status });
function setup() {
  const request = vi
    .fn()
    .mockImplementation(async () => response({ ok: true, deleted: tx }));
  const onRemoved = vi.fn(),
    onRestored = vi.fn();
  const controller = new TransactionUndoController({
    request,
    onRemoved,
    onRestored,
    isCurrent: () => true,
  });
  return { controller, request, onRemoved, onRestored };
}
afterEach(() => {
  vi.useRealTimers();
});
describe("transaction undo", () => {
  it("gives each queued deletion ten visible seconds and pauses for all reasons", async () => {
    vi.useFakeTimers();
    const { controller } = setup();
    await controller.remove(tx);
    await controller.remove({ ...tx, id: "two" });
    vi.advanceTimersByTime(4000);
    controller.pause("hover", true);
    controller.pause("hidden", true);
    vi.advanceTimersByTime(20000);
    controller.pause("hover", false);
    vi.advanceTimersByTime(20000);
    expect(controller.getSnapshot()).toHaveLength(2);
    controller.pause("hidden", false);
    vi.advanceTimersByTime(5999);
    expect(controller.getSnapshot()).toHaveLength(2);
    vi.advanceTimersByTime(1);
    expect(controller.getSnapshot()).toHaveLength(1);
    vi.advanceTimersByTime(9999);
    expect(controller.getSnapshot()).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(controller.getSnapshot()).toHaveLength(0);
  });
  it("retains failed recovery without expiry, retries once, announces server record", async () => {
    vi.useFakeTimers();
    const { controller, request, onRestored } = setup();
    await controller.remove(tx);
    request.mockResolvedValueOnce(response({}, 500));
    await controller.restore();
    vi.advanceTimersByTime(60000);
    expect(controller.getSnapshot()[0].status).toBe("retry");
    const restored = { ...tx, updatedAt: "2026-09-04T00:00:00Z" };
    request.mockResolvedValueOnce(response({ ok: true, restored }));
    await Promise.all([controller.restore(), controller.restore()]);
    expect(request).toHaveBeenCalledTimes(3);
    expect(onRestored).toHaveBeenCalledWith(restored);
    expect(controller.announcement).toBe("Transaction restored.");
    expect(controller.getSnapshot()).toHaveLength(0);
  });
  it("conflicts allow only dismissal", async () => {
    const { controller, request } = setup();
    await controller.remove(tx);
    request.mockResolvedValueOnce(response({}, 409));
    await controller.restore();
    await controller.restore();
    expect(request).toHaveBeenCalledTimes(2);
    expect(controller.getSnapshot()[0].status).toBe("conflict");
    controller.dismiss();
  });
  it("missing records reconcile without undo and failed deletions never reconcile", async () => {
    const { controller, request, onRemoved } = setup();
    request.mockResolvedValueOnce(response({ ok: true, deleted: null }));
    await controller.remove(tx);
    expect(onRemoved).toHaveBeenCalledWith(tx.id, null);
    expect(controller.getSnapshot()).toHaveLength(0);
    request.mockResolvedValueOnce(response({}, 500));
    await expect(controller.remove(tx)).rejects.toThrow();
    expect(onRemoved).toHaveBeenCalledTimes(1);
  });
  it("does not reconcile malformed successful responses", async () => {
    const { controller, request, onRemoved } = setup();
    request.mockResolvedValueOnce(
      response({ ok: true, deleted: { id: tx.id } }),
    );
    await expect(controller.remove(tx)).rejects.toThrow(
      "Failed to delete transaction",
    );
    expect(onRemoved).not.toHaveBeenCalled();

    request.mockResolvedValueOnce(response({ ok: true, deleted: tx }));
    await controller.remove(tx);
    request.mockResolvedValueOnce(
      response({ ok: true, restored: { id: tx.id } }),
    );
    await controller.restore();
    expect(controller.getSnapshot()[0].status).toBe("retry");
  });
  it("clears snapshots and rejects old in-flight requests after account cleanup", async () => {
    const { controller, request, onRemoved } = setup();
    let resolve!: (r: Response) => void;
    request.mockReturnValueOnce(
      new Promise<Response>((r) => {
        resolve = r;
      }),
    );
    const pending = controller.remove(tx);
    controller.clear();
    resolve(response({ ok: true, deleted: tx }));
    expect(await pending).toBe(false);
    expect(onRemoved).not.toHaveBeenCalled();
    controller.dispose();
    controller.activate();
    request.mockResolvedValueOnce(response({ ok: true, deleted: tx }));
    expect(await controller.remove(tx)).toBe(true);
    controller.dispose();
    expect(controller.getSnapshot()).toHaveLength(0);
  });
  it("validates calendar dates and strips injected ownership", () => {
    expect(
      RestoreTransactionSchema.safeParse({ ...tx, date: "2026-02-29" }).success,
    ).toBe(false);
    expect(
      RestoreTransactionSchema.parse({ ...tx, pk: "another-user" }),
    ).toEqual(tx);
  });
});
