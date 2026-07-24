import { format, isValid, parseISO } from "date-fns";

import type { Transaction, TransactionCategoryType } from "@/lib/types/types";
import { TRANSACTION_CATEGORY_HEX_COLORS } from "@/lib/utils/categoryColors";

const CATEGORY_EVENT_COLORS = TRANSACTION_CATEGORY_HEX_COLORS;

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export interface TransactionCalendarEventDetails {
  transaction: Transaction;
  amountLabel: string;
  transactionName: string;
  categoryLabel: TransactionCategoryType;
  accessibilityLabel: string;
}

export interface TransactionCalendarEvent {
  id: string;
  title: string;
  start: string;
  allDay: boolean;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  classNames: string[];
  extendedProps: TransactionCalendarEventDetails;
}

export function formatTransactionAmount(amount: number): string {
  return currencyFormatter.format(amount);
}

export function formatTransactionLongDate(date: string): string {
  const parsedDate = parseISO(date);

  if (!isValid(parsedDate)) {
    return date;
  }

  return format(parsedDate, "MMMM d, yyyy");
}

export function mapTransactionsToCalendarEvents(
  transactions: Transaction[],
): TransactionCalendarEvent[] {
  return transactions.flatMap((transaction) => {
    const parsedDate = parseISO(transaction.date);

    if (!isValid(parsedDate)) {
      return [];
    }

    const amountLabel = formatTransactionAmount(transaction.amount);
    const dateLabel = format(parsedDate, "MMMM d, yyyy");
    const paymentMethodPhrase = transaction.paymentMethod
      ? ` paid with ${transaction.paymentMethod}`
      : "";

    return [
      {
        id: transaction.id,
        title: transaction.name,
        start: transaction.date,
        allDay: true,
        backgroundColor: CATEGORY_EVENT_COLORS[transaction.category],
        borderColor: CATEGORY_EVENT_COLORS[transaction.category],
        textColor: "#f8fafc",
        classNames: [
          "transaction-calendar__event",
          `transaction-calendar__event--${transaction.category.toLowerCase()}`,
        ],
        extendedProps: {
          transaction,
          amountLabel,
          transactionName: transaction.name,
          categoryLabel: transaction.category,
          accessibilityLabel: `${dateLabel}: ${transaction.name}, ${amountLabel}, ${transaction.category}${paymentMethodPhrase}.`,
        },
      },
    ];
  });
}
