/**
 * Note 1: This helper keeps the transaction-to-calendar projection pure so the
 * reports page and future tests can assert labels, colors, and accessibility
 * text without having to mount FullCalendar or mock browser DOM APIs.
 */
import { format, isValid, parseISO } from "date-fns";

import type { CategoryType, Transaction } from "@/lib/types/types";

const CATEGORY_EVENT_COLORS: Record<CategoryType, string> = {
  Need: "#ef5350",
  Want: "#42a5f5",
  Saving: "#66bb6a",
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export interface TransactionCalendarEventDetails {
  transaction: Transaction;
  amountLabel: string;
  transactionName: string;
  categoryLabel: CategoryType;
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

    // Note 2: Calendar rendering is stricter than the table view because each
    // event must anchor to a real day. Invalid imported dates are skipped here so
    // a single bad record does not crash the whole reports page.
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
