import { describe, expect, it, vi } from "vitest";

import {
  buildTransactionFormSubmission,
  transactionToFormValues,
} from "@/lib/utils/transaction-form";
import type { Transaction } from "@/lib/types/types";

const source: Transaction = {
  id: "source-id",
  name: "Weekly groceries",
  amount: 87.45,
  category: "Need",
  date: "2026-08-08",
  notes: "Use rewards card",
  paymentMethod: "Credit Card",
  tags: ["food", "household"],
  createdAt: "2026-08-08T12:00:00.000Z",
  updatedAt: "2026-08-08T12:00:00.000Z",
};

describe("transaction form duplication semantics", () => {
  it("prefills editable fields and creates a new transaction ID", () => {
    const values = transactionToFormValues(source);
    const generateTransactionId = vi.fn(() => "duplicate-id");

    expect(values).toMatchObject({
      name: source.name,
      amount: String(source.amount),
      category: source.category,
      paymentMethod: source.paymentMethod,
      tags: source.tags,
      notes: source.notes,
    });
    expect(values.date?.toISOString().slice(0, 10)).toBe(source.date);
    expect(values.tags).not.toBe(source.tags);

    expect(
      buildTransactionFormSubmission(values, { generateTransactionId }),
    ).toEqual({
      id: "duplicate-id",
      name: source.name,
      amount: source.amount,
      category: source.category,
      date: source.date,
      notes: source.notes,
      paymentMethod: source.paymentMethod,
      tags: source.tags,
    });
    expect(generateTransactionId).toHaveBeenCalledOnce();
  });

  it("retains the source ID only for edit submissions", () => {
    const generateTransactionId = vi.fn(() => "unused-id");

    expect(
      buildTransactionFormSubmission(transactionToFormValues(source), {
        editTransaction: source,
        generateTransactionId,
      }).id,
    ).toBe(source.id);
    expect(generateTransactionId).not.toHaveBeenCalled();
  });
});
