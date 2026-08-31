import type { Transaction } from "@/lib/types/types";

export interface TransactionPage {
  transactions: Transaction[];
  hasMore: boolean;
  nextCursor?: string;
}

export type TransactionPageLoader = (
  cursor?: string,
) => Promise<TransactionPage>;

interface CacheEntry {
  transactions?: Transaction[];
  stale: boolean;
  loadPromise?: Promise<Transaction[]>;
  pendingPatches: TransactionPatch[];
}

type TransactionPatch =
  | {
      type: "upsert";
      transaction: Transaction;
      previous?: Pick<Transaction, "id" | "date">;
    }
  | { type: "remove"; transaction: Pick<Transaction, "id" | "date"> };

const transactionCache = new Map<string, CacheEntry>();

function entryFor(scope: string) {
  const current = transactionCache.get(scope);
  if (current) return current;
  const entry: CacheEntry = { stale: false, pendingPatches: [] };
  transactionCache.set(scope, entry);
  return entry;
}

function transactionKey(transaction: Pick<Transaction, "id" | "date">) {
  return `${transaction.date}\u0000${transaction.id}`;
}

/** Returns a copy so callers cannot mutate module-level cached state. */
export function getCachedTransactions(scope: string) {
  return transactionCache.get(scope)?.transactions?.slice();
}

/** Marks a scope for reconciliation on its next load without dropping its data. */
export function markTransactionCacheStale(scope: string) {
  const entry = transactionCache.get(scope);
  if (entry) entry.stale = true;
}

/** Clears one authenticated scope, or all scopes after sign-out/auth changes. */
export function clearTransactionCache(scope?: string) {
  if (scope) {
    transactionCache.delete(scope);
  } else {
    transactionCache.clear();
  }
}

/** Replaces an old date/id record before inserting the server-confirmed record. */
export function upsertTransactionInList(
  transactions: Transaction[],
  transaction: Transaction,
  previous?: Pick<Transaction, "id" | "date">,
) {
  const oldKey = previous && transactionKey(previous);
  const nextKey = transactionKey(transaction);
  const withoutOld = transactions.filter((item) => {
    const key = transactionKey(item);
    return key !== oldKey && key !== nextKey;
  });
  return [...withoutOld, transaction];
}

export function removeTransactionFromList(
  transactions: Transaction[],
  transaction: Pick<Transaction, "id" | "date">,
) {
  const key = transactionKey(transaction);
  return transactions.filter((item) => transactionKey(item) !== key);
}

export function upsertCachedTransaction(
  scope: string,
  transaction: Transaction,
  previous?: Pick<Transaction, "id" | "date">,
) {
  const entry = transactionCache.get(scope);
  if (!entry) return;
  const patch: TransactionPatch = { type: "upsert", transaction, previous };
  if (entry.loadPromise) entry.pendingPatches.push(patch);
  if (entry.transactions) {
    entry.transactions = upsertTransactionInList(
      entry.transactions,
      transaction,
      previous,
    );
  }
  entry.stale = false;
}

export function removeCachedTransaction(
  scope: string,
  transaction: Pick<Transaction, "id" | "date">,
) {
  const entry = transactionCache.get(scope);
  if (!entry) return;
  const patch: TransactionPatch = { type: "remove", transaction };
  if (entry.loadPromise) entry.pendingPatches.push(patch);
  if (entry.transactions) {
    entry.transactions = removeTransactionFromList(
      entry.transactions,
      transaction,
    );
  }
  entry.stale = false;
}

function applyPatches(
  transactions: Transaction[],
  patches: TransactionPatch[],
) {
  return patches.reduce((current, patch) => {
    if (patch.type === "upsert") {
      return upsertTransactionInList(
        current,
        patch.transaction,
        patch.previous,
      );
    }
    return removeTransactionFromList(current, patch.transaction);
  }, transactions);
}

/**
 * Loads every cursor page once per scope. A force refresh bypasses completed
 * cache data but deliberately still joins an in-flight load for that scope.
 */
export function loadCachedTransactions(
  scope: string,
  loadPage: TransactionPageLoader,
  options: { force?: boolean } = {},
): Promise<Transaction[]> {
  const entry = entryFor(scope);
  if (entry.loadPromise) return entry.loadPromise;
  if (entry.transactions && !entry.stale && !options.force) {
    return Promise.resolve(entry.transactions.slice());
  }

  const loadingEntry = entry;
  // Patches received while this full load is in flight are replayed onto its
  // response, so an older server snapshot cannot erase a successful mutation.
  loadingEntry.pendingPatches = [];
  const promise = (async () => {
    const transactions: Transaction[] = [];
    const seenCursors = new Set<string>();
    let cursor: string | undefined;

    do {
      const page = await loadPage(cursor);
      transactions.push(...page.transactions);
      cursor = page.hasMore ? page.nextCursor : undefined;
      if (cursor && seenCursors.has(cursor)) {
        throw new Error("Transaction pagination returned a repeated cursor");
      }
      if (cursor) seenCursors.add(cursor);
    } while (cursor);

    // A clear or scope reset while loading must prevent stale results from
    // repopulating a cache that belongs to a later auth state.
    const mergedTransactions = applyPatches(
      transactions,
      loadingEntry.pendingPatches,
    );
    loadingEntry.pendingPatches = [];
    if (transactionCache.get(scope) === loadingEntry) {
      loadingEntry.transactions = mergedTransactions;
      loadingEntry.stale = false;
    }
    return mergedTransactions.slice();
  })();

  entry.loadPromise = promise;
  void promise.then(
    () => {
      if (transactionCache.get(scope) === loadingEntry) {
        delete loadingEntry.loadPromise;
      }
    },
    () => {
      if (transactionCache.get(scope) === loadingEntry) {
        delete loadingEntry.loadPromise;
      }
    },
  );
  return promise;
}
