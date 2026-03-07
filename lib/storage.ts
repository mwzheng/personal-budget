"use client";

import type { Transaction } from "./types";

const STORAGE_KEY = "personal-budget-transactions";

export function getTransactions(): Transaction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Transaction[]) : [];
  } catch {
    return [];
  }
}

export function setTransactions(transactions: Transaction[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

export function addTransaction(transaction: Transaction): void {
  const all = getTransactions();
  setTransactions([...all, transaction]);
}

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
      existingKeys.add(key);
      toAdd.push({ ...t, id: crypto.randomUUID() });
    }
  }

  setTransactions([...existing, ...toAdd]);
  return { appended: toAdd.length, skipped };
}

export function clearTransactions(): void {
  localStorage.removeItem(STORAGE_KEY);
}
