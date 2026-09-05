import { z } from "zod";
import type { Transaction } from "../types/types";

export const RestoreTransactionSchema = z.object({
  id: z.string().min(1).max(200),
  name: z.string().min(1),
  amount: z.number().finite().nonnegative(),
  category: z.enum(["Need", "Want", "Saving", "Income"]),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((value) => {
      const parsed = new Date(`${value}T00:00:00Z`);
      return (
        Number.isFinite(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === value
      );
    }),
  notes: z.string(),
  paymentMethod: z.string(),
  tags: z.array(z.string()),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

/** Explicit projection prevents storage keys or ownership from reaching the client. */
export function publicTransaction(item: Record<string, unknown>): Transaction {
  return {
    id: String(item.id ?? ""),
    name: String(item.name ?? ""),
    amount: Number(item.amount ?? 0),
    category: item.category as Transaction["category"],
    date: String(item.date ?? ""),
    notes: String(item.notes ?? ""),
    paymentMethod: String(item.paymentMethod ?? ""),
    tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
    ...(typeof item.createdAt === "string"
      ? { createdAt: item.createdAt }
      : {}),
    ...(typeof item.updatedAt === "string"
      ? { updatedAt: item.updatedAt }
      : {}),
  };
}

export function sameTransactionContent(a: Transaction, b: Transaction) {
  return (
    a.id === b.id &&
    a.name === b.name &&
    a.amount === b.amount &&
    a.category === b.category &&
    a.date === b.date &&
    a.notes === b.notes &&
    a.paymentMethod === b.paymentMethod &&
    JSON.stringify(a.tags) === JSON.stringify(b.tags) &&
    (!b.createdAt || a.createdAt === b.createdAt)
  );
}
