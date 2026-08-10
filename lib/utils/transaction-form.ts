import { format, parseISO } from "date-fns";

import type { Transaction } from "@/lib/types/types";
import { generateId } from "@/lib/utils/generateId";

export interface TransactionFormValues {
  date: Date | null;
  name: string;
  amount: string;
  category: string;
  paymentMethod: string;
  tagsInput: string;
  tags: string[];
  notes: string;
}

export function transactionToFormValues(
  transaction: Transaction,
): TransactionFormValues {
  return {
    date: parseISO(transaction.date),
    name: transaction.name,
    amount: String(transaction.amount),
    category: transaction.category,
    paymentMethod: transaction.paymentMethod ?? "",
    tagsInput: "",
    tags: [...transaction.tags],
    notes: transaction.notes ?? "",
  };
}

interface BuildTransactionFormSubmissionOptions {
  editTransaction?: Transaction;
  generateTransactionId?: () => string;
}

export function buildTransactionFormSubmission(
  values: TransactionFormValues,
  {
    editTransaction,
    generateTransactionId = generateId,
  }: BuildTransactionFormSubmissionOptions = {},
): Transaction {
  return {
    id: editTransaction?.id ?? generateTransactionId(),
    name: values.name.trim(),
    amount: parseFloat(values.amount),
    category: values.category as Transaction["category"],
    date: format(values.date!, "yyyy-MM-dd"),
    notes: values.notes.trim(),
    paymentMethod: values.paymentMethod,
    tags: [...values.tags],
  };
}
