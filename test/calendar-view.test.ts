// Note 1: These checks stay at the pure-helper level so calendar rendering can be
// refactored freely while event labels, colors, and filtering remain stable.
import { describe, expect, it } from "vitest";

import {
  formatTransactionAmount,
  mapTransactionsToCalendarEvents,
} from "@/lib/utils/transaction-calendar";
import type { Transaction } from "@/lib/types/types";

function buildTransaction(
  id: string,
  overrides?: Partial<Transaction>,
): Transaction {
  return {
    id,
    name: `transaction-${id}`,
    amount: 42,
    category: "Need",
    date: "2025-03-01",
    notes: "",
    paymentMethod: "",
    tags: [],
    ...overrides,
  };
}

describe("transaction calendar helpers", () => {
  it("formats transaction amounts as USD currency", () => {
    expect(formatTransactionAmount(1234.5)).toBe("$1,234.50");
  });

  it("maps transactions into calendar events with category colors and labels", () => {
    const events = mapTransactionsToCalendarEvents([
      buildTransaction("need", {
        name: "Rent",
        amount: 1250,
        category: "Need",
        paymentMethod: "card",
      }),
      buildTransaction("want", {
        name: "Dinner",
        amount: 45.5,
        category: "Want",
        date: "2025-03-02",
      }),
      buildTransaction("saving", {
        name: "Emergency fund",
        amount: 300,
        category: "Saving",
        date: "2025-03-03",
      }),
    ]);

    expect(events).toHaveLength(3);
    expect(events[0]).toMatchObject({
      id: "need",
      title: "Rent",
      start: "2025-03-01",
      allDay: true,
      backgroundColor: "#ef5350",
      borderColor: "#ef5350",
      textColor: "#f8fafc",
      classNames: [
        "transaction-calendar__event",
        "transaction-calendar__event--need",
      ],
      extendedProps: {
        transactionName: "Rent",
        amountLabel: "$1,250.00",
        categoryLabel: "Need",
        accessibilityLabel:
          "March 1, 2025: Rent, $1,250.00, Need paid with card.",
      },
    });
    expect(events[1]).toMatchObject({
      backgroundColor: "#42a5f5",
      borderColor: "#42a5f5",
      classNames: [
        "transaction-calendar__event",
        "transaction-calendar__event--want",
      ],
      extendedProps: {
        amountLabel: "$45.50",
        categoryLabel: "Want",
        accessibilityLabel: "March 2, 2025: Dinner, $45.50, Want.",
      },
    });
    expect(events[2]).toMatchObject({
      backgroundColor: "#66bb6a",
      borderColor: "#66bb6a",
      classNames: [
        "transaction-calendar__event",
        "transaction-calendar__event--saving",
      ],
      extendedProps: {
        amountLabel: "$300.00",
        categoryLabel: "Saving",
        accessibilityLabel: "March 3, 2025: Emergency fund, $300.00, Saving.",
      },
    });
  });

  it("skips transactions whose dates cannot anchor to a calendar day", () => {
    const events = mapTransactionsToCalendarEvents([
      buildTransaction("valid"),
      buildTransaction("invalid", { date: "not-a-date" }),
    ]);

    expect(events).toHaveLength(1);
    expect(events[0].id).toBe("valid");
  });
});
