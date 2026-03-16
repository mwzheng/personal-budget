// Note 1: The "use client" directive tells Next.js that this module (and any
// module that imports it) must only execute in the browser. It prevents the
// bundler from including localStorage-dependent code in the server bundle, where
// `window` and `localStorage` do not exist.
"use client";

import type { Transaction } from "../types/types";

// Note 2: Storing all transactions under a single localStorage key is simple and
// works well for small datasets. For larger datasets, IndexedDB or a server-side
// database (DynamoDB) should be used instead. The constant prevents typos in key
// names that would silently create a second, disconnected data store.
const STORAGE_KEY = "personal-budget-transactions";
const REPORT_YEAR_STORAGE_KEY = "personal-budget-last-report-year";

// Note 3: `typeof window === "undefined"` is true during SSR in Next.js. Returning
// an empty array instead of throwing keeps server-side rendering safe, even though
// this module is declared "use client" (the guard is an extra safety net).
export function getTransactions(): Transaction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    // Note 4: `JSON.parse` can throw if the stored string is malformed (e.g. the
    // data was corrupted). The try/catch wraps this so a corrupted store returns
    // an empty array rather than crashing the entire page.
    return raw ? (JSON.parse(raw) as Transaction[]) : [];
  } catch {
    return [];
  }
}

// Note 5: `JSON.stringify` serializes the full array to a single string. Because
// localStorage is synchronous and has a ~5 MB limit per origin, this approach is
// suitable only for a moderate number of transactions. Large datasets should use
// the DynamoDB-backed API route instead.
export function setTransactions(transactions: Transaction[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

export function addTransaction(transaction: Transaction): void {
  const all = getTransactions();
  // Note 6: Spread syntax `[...all, transaction]` creates a new array rather than
  // mutating the existing one. Immutable updates are a React best practice that
  // prevents subtle bugs when the same array reference is shared across components.
  setTransactions([...all, transaction]);
}

// Note 7: `Array.map` returns a new array where the updated transaction replaces
// the old one based on matching `id`. All other transactions are returned unchanged.
export function updateTransaction(updated: Transaction): void {
  const all = getTransactions();
  setTransactions(all.map((t) => (t.id === updated.id ? updated : t)));
}

export function deleteTransaction(id: string): void {
  const all = getTransactions();
  setTransactions(all.filter((t) => t.id !== id));
}

/** Appends rows that are not duplicates of existing data.
 *  Duplicate = same date + name + amount (case-insensitive name match).
 *  Returns the number of rows actually appended and the number skipped.
 */
export function appendTransactions(incoming: Transaction[]): {
  appended: number;
  skipped: number;
} {
  const existing = getTransactions();

  // Note 8: A Set of composite keys (date|name|amount) provides O(1) lookup to
  // check for duplicates. Building it once before the loop avoids an O(n^2)
  // nested scan that would be slow for large import files.
  const existingKeys = new Set(
    existing.map((t) => `${t.date}|${t.name.toLowerCase()}|${t.amount}`),
  );

  const toAdd: Transaction[] = [];
  let skipped = 0;

  for (const t of incoming) {
    const key = `${t.date}|${t.name.toLowerCase()}|${t.amount}`;
    if (existingKeys.has(key)) {
      skipped++;
    } else {
      // Note 9: Adding the new key to the set prevents a second occurrence of the
      // same transaction within the incoming batch from being added twice (intra-
      // batch deduplication in addition to the cross-batch check above).
      existingKeys.add(key);
      // Note 10: `crypto.randomUUID()` generates a Version 4 UUID, which is
      // cryptographically random and practically guaranteed to be unique. This
      // replaces any placeholder id that may have been assigned by the CSV parser.
      toAdd.push({ ...t, id: crypto.randomUUID() });
    }
  }

  setTransactions([...existing, ...toAdd]);
  return { appended: toAdd.length, skipped };
}

export function clearTransactions(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// Note 11: Reports-year persistence uses a separate key so clearing or migrating
// transaction data does not accidentally destroy an unrelated UI preference.
// The stored value is now a JSON array, but the reader still accepts the older
// single-string format so existing browsers migrate without losing preferences.
export function getLastSelectedReportYears(): string[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(REPORT_YEAR_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (value): value is string => typeof value === "string",
      );
    }
    if (typeof parsed === "string") {
      return [parsed];
    }
  } catch {
    // Note 11a: Old builds stored a plain string instead of JSON. Treat that as
    // a one-item selection so the new multi-year picker can restore it cleanly.
    return [raw];
  }
  return typeof raw === "string" ? [raw] : [];
}

export function getLastSelectedReportYear(): string | null {
  return getLastSelectedReportYears()[0] ?? null;
}

// Note 12: The selected years are stored as raw year tokens instead of derived
// date bounds, which keeps the persisted state aligned with the quick-filter UI
// and avoids reconstructing non-contiguous multi-year selections from dates.
export function setLastSelectedReportYears(years: string[]): void {
  if (typeof window === "undefined") return;
  if (years.length === 0) {
    localStorage.removeItem(REPORT_YEAR_STORAGE_KEY);
    return;
  }
  localStorage.setItem(REPORT_YEAR_STORAGE_KEY, JSON.stringify(years));
}

export function setLastSelectedReportYear(year: string): void {
  setLastSelectedReportYears([year]);
}

// Note 13: Resetting the reports preference is a first-class helper because the
// reset button and "deselect active year" flow should both remove the stored
// preference, not leave behind stale startup state.
export function clearLastSelectedReportYears(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(REPORT_YEAR_STORAGE_KEY);
}

export function clearLastSelectedReportYear(): void {
  clearLastSelectedReportYears();
}
