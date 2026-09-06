import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Transaction } from "@/lib/types/types";
import {
  clearTransactionCache,
  getCachedTransactions,
  loadCachedTransactions,
  markTransactionCacheStale,
  removeCachedTransaction,
  upsertCachedTransaction,
} from "@/lib/reports/transactionCache";

const tx = (id: string, date = "2026-01-01"): Transaction => ({
  id,
  date,
  name: id,
  amount: 10,
  category: "Need",
  notes: "",
  paymentMethod: "Card",
  tags: [],
});

describe("transactionCache", () => {
  beforeEach(() => clearTransactionCache());

  it("dedupes simultaneous full paginated loads", async () => {
    let resolveFirst!: (value: {
      transactions: Transaction[];
      hasMore: boolean;
      nextCursor?: string;
    }) => void;
    const fetchPage = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockResolvedValueOnce({ transactions: [tx("second")], hasMore: false });

    const first = loadCachedTransactions("user-a", fetchPage);
    const duplicate = loadCachedTransactions("user-a", fetchPage);
    resolveFirst({
      transactions: [tx("first")],
      hasMore: true,
      nextCursor: "p2",
    });

    await expect(first).resolves.toEqual([tx("first"), tx("second")]);
    await expect(duplicate).resolves.toEqual([tx("first"), tx("second")]);
    expect(fetchPage).toHaveBeenCalledTimes(2);
    expect(fetchPage).toHaveBeenNthCalledWith(1, undefined);
    expect(fetchPage).toHaveBeenNthCalledWith(2, "p2");
  });

  it("can intentionally stop after the first page for bounded browsing", async () => {
    const fetchPage = vi.fn().mockResolvedValue({
      transactions: [tx("first")],
      hasMore: true,
      nextCursor: "p2",
    });

    await expect(
      loadCachedTransactions("user-a", fetchPage, { maxPages: 1 }),
    ).resolves.toEqual([tx("first")]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(fetchPage).toHaveBeenCalledWith(undefined);
    expect(getCachedTransactions("user-a")).toEqual([tx("first")]);
  });

  it("reloads when the requested date scope differs from the cached scope", async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({
        transactions: [tx("current")],
        hasMore: false,
      })
      .mockResolvedValueOnce({
        transactions: [tx("historical", "2023-01-01")],
        hasMore: false,
      });

    await loadCachedTransactions("user-a", fetchPage, {
      scope: {
        allHistory: false,
        startDate: "2026-01-01",
        endDate: "2026-12-31",
      },
    });
    await expect(
      loadCachedTransactions("user-a", fetchPage, {
        scope: {
          allHistory: false,
          startDate: "2023-01-01",
          endDate: "2023-12-31",
        },
      }),
    ).resolves.toEqual([tx("historical", "2023-01-01")]);

    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it("promotes a bounded cache to a complete history on force load", async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({
        transactions: [tx("current")],
        hasMore: true,
        nextCursor: "p2",
      })
      .mockResolvedValueOnce({
        transactions: [tx("current")],
        hasMore: true,
        nextCursor: "p2",
      })
      .mockResolvedValueOnce({
        transactions: [tx("historical")],
        hasMore: false,
      });

    await loadCachedTransactions("user-a", fetchPage, { maxPages: 1 });
    await expect(
      loadCachedTransactions("user-a", fetchPage, { force: true }),
    ).resolves.toEqual([tx("current"), tx("historical")]);
    expect(fetchPage).toHaveBeenCalledTimes(3);
    expect(getCachedTransactions("user-a")).toEqual([
      tx("current"),
      tx("historical"),
    ]);
  });

  it("isolates scopes and clears data", async () => {
    const fetchA = vi
      .fn()
      .mockResolvedValue({ transactions: [tx("a")], hasMore: false });
    const fetchB = vi
      .fn()
      .mockResolvedValue({ transactions: [tx("b")], hasMore: false });
    await loadCachedTransactions("token-a", fetchA);
    await loadCachedTransactions("token-b", fetchB);

    expect(getCachedTransactions("token-a")).toEqual([tx("a")]);
    expect(getCachedTransactions("token-b")).toEqual([tx("b")]);
    clearTransactionCache("token-a");
    expect(getCachedTransactions("token-a")).toBeUndefined();
    expect(getCachedTransactions("token-b")).toEqual([tx("b")]);
  });

  it("reloads stale entries and force refreshes fresh entries", async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({ transactions: [tx("first")], hasMore: false })
      .mockResolvedValueOnce({ transactions: [tx("stale")], hasMore: false })
      .mockResolvedValueOnce({ transactions: [tx("forced")], hasMore: false });
    await loadCachedTransactions("user-a", fetchPage);
    await loadCachedTransactions("user-a", fetchPage);
    markTransactionCacheStale("user-a");
    await loadCachedTransactions("user-a", fetchPage);
    await loadCachedTransactions("user-a", fetchPage, { force: true });

    expect(fetchPage).toHaveBeenCalledTimes(3);
    expect(getCachedTransactions("user-a")).toEqual([tx("forced")]);
  });

  it("patches date-changing updates and deletes without reloading", async () => {
    const fetchPage = vi.fn().mockResolvedValue({
      transactions: [tx("same", "2026-01-01"), tx("other")],
      hasMore: false,
    });
    await loadCachedTransactions("user-a", fetchPage);
    const original = tx("same", "2026-01-01");
    const updated = { ...original, date: "2026-02-01", name: "Moved" };

    upsertCachedTransaction("user-a", updated, original);
    removeCachedTransaction("user-a", tx("other"));

    expect(getCachedTransactions("user-a")).toEqual([updated]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it("replays a successful mutation made while a full load is in flight", async () => {
    let resolveLoad!: (value: {
      transactions: Transaction[];
      hasMore: boolean;
    }) => void;
    const fetchPage = vi.fn(
      () =>
        new Promise<{ transactions: Transaction[]; hasMore: boolean }>(
          (resolve) => {
            resolveLoad = resolve;
          },
        ),
    );

    const load = loadCachedTransactions("user-a", fetchPage);
    const created = tx("created", "2026-02-01");
    upsertCachedTransaction("user-a", created);
    resolveLoad({ transactions: [tx("from-load")], hasMore: false });

    await expect(load).resolves.toEqual([tx("from-load"), created]);
    expect(getCachedTransactions("user-a")).toEqual([tx("from-load"), created]);
  });

  it("replays deletion and restoration in order over a stale server load", async () => {
    const original = tx("coffee");
    let resolveLoad!: (page: {
      transactions: Transaction[];
      hasMore: boolean;
    }) => void;
    const load = loadCachedTransactions(
      "user-a",
      () =>
        new Promise((resolve) => {
          resolveLoad = resolve;
        }),
    );
    removeCachedTransaction("user-a", original);
    const restored = { ...original, updatedAt: "2026-09-04T12:00:00.000Z" };
    upsertCachedTransaction("user-a", restored);
    resolveLoad({ transactions: [original], hasMore: false });
    await expect(load).resolves.toEqual([restored]);
    expect(getCachedTransactions("user-a")).toEqual([restored]);
  });

  it("does not resurrect a deleted transaction from an in-flight load", async () => {
    const original = tx("coffee");
    let resolveLoad!: (page: {
      transactions: Transaction[];
      hasMore: boolean;
    }) => void;
    const load = loadCachedTransactions(
      "user-a",
      () =>
        new Promise((resolve) => {
          resolveLoad = resolve;
        }),
    );
    removeCachedTransaction("user-a", original);
    resolveLoad({ transactions: [original], hasMore: false });
    await expect(load).resolves.toEqual([]);
    expect(getCachedTransactions("user-a")).toEqual([]);
  });

  it("does not restore a cleared scope when its late load settles", async () => {
    let resolveLoad!: (value: {
      transactions: Transaction[];
      hasMore: boolean;
    }) => void;
    const load = loadCachedTransactions(
      "user-a",
      () =>
        new Promise<{ transactions: Transaction[]; hasMore: boolean }>(
          (resolve) => {
            resolveLoad = resolve;
          },
        ),
    );

    clearTransactionCache();
    resolveLoad({ transactions: [tx("late")], hasMore: false });

    await expect(load).resolves.toEqual([tx("late")]);
    expect(getCachedTransactions("user-a")).toBeUndefined();
  });

  it("rejects a repeated pagination cursor", async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({
        transactions: [tx("first")],
        hasMore: true,
        nextCursor: "again",
      })
      .mockResolvedValueOnce({
        transactions: [tx("second")],
        hasMore: true,
        nextCursor: "again",
      });

    await expect(loadCachedTransactions("user-a", fetchPage)).rejects.toThrow(
      "Transaction pagination returned a repeated cursor",
    );
    expect(getCachedTransactions("user-a")).toBeUndefined();
  });
});
