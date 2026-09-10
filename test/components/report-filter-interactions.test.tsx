// @vitest-environment jsdom
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFnsV3";
import { DATE_RANGE_PRESETS, FilterBar } from "@/components/report/FilterBar";
import { FilterParams, Transaction } from "@/lib/types/types";
import {
  filterTransactions,
  getReportDateRangePreset,
} from "@/lib/utils/aggregations";
import { EMPTY_FILTERS } from "@/lib/utils/reportUtils";
import { REPORT_AMOUNT_PRESETS } from "@/lib/utils/reportAmount";

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 8, 7, 12));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
const transactions: Transaction[] = [
  {
    id: "1",
    name: "coffee",
    date: "2026-09-05",
    category: "Need",
    tags: ["home"],
    amount: 25,
    notes: "",
    paymentMethod: "Cash",
  },
  {
    id: "2",
    name: "coffee",
    date: "2025-08-05",
    category: "Want",
    tags: ["trip"],
    amount: 75,
    notes: "",
    paymentMethod: "Cash",
  },
  {
    id: "3",
    name: "rent",
    date: "2026-09-06",
    category: "Need",
    tags: ["home"],
    amount: 1000,
    notes: "",
    paymentMethod: "Cash",
  },
];
function setup(initial: FilterParams = EMPTY_FILTERS, accept = true) {
  function Harness() {
    const [filters, setFilters] = useState(initial);
    return (
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <FilterBar
          availableTags={["home", "trip"]}
          filters={filters}
          onChange={(next) => {
            if (accept)
              setFilters({
                ...next,
                years: [...next.years],
                categories: [...next.categories],
                tags: [...next.tags],
              });
          }}
        />
        <output data-testid="state">{JSON.stringify(filters)}</output>
        <output data-testid="results">
          {filterTransactions(transactions, filters)
            .map((t) => t.id)
            .join(",")}
        </output>
      </LocalizationProvider>
    );
  }
  render(<Harness />);
  return userEvent.setup();
}
function assertApplied(expected: FilterParams, ids?: string) {
  expect(JSON.parse(screen.getByTestId("state").textContent!)).toEqual(
    expected,
  );
  expect(screen.getByTestId("results").textContent).toBe(
    ids ??
      filterTransactions(transactions, expected)
        .map((t) => t.id)
        .join(","),
  );
}
async function draft(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Show More Filters" }));
  await user.clear(screen.getByLabelText("Min Amount"));
  await user.type(screen.getByLabelText("Min Amount"), "17");
  await user.clear(screen.getByLabelText("Max Amount"));
  await user.type(screen.getByLabelText("Max Amount"), "88");
}
function assertDraft() {
  expect((screen.getByLabelText("Min Amount") as HTMLInputElement).value).toBe(
    "17",
  );
  expect((screen.getByLabelText("Max Amount") as HTMLInputElement).value).toBe(
    "88",
  );
}
async function removeChip(
  user: ReturnType<typeof userEvent.setup>,
  name: string,
) {
  const chip = screen.getByRole("button", { name });
  chip.focus();
  await user.keyboard("{Delete}");
}
describe("controlled report filter interactions", () => {
  it.each(DATE_RANGE_PRESETS)(
    "commits $label using applied bounds and retains amount drafts",
    async ({ value, label }) => {
      const initial = {
        ...EMPTY_FILTERS,
        years: ["2025"],
        categories: ["Need" as const],
        tags: ["home"],
        search: "coffee",
        minAmount: 10,
        maxAmount: 100,
      };
      const user = setup(initial);
      await draft(user);
      await user.click(screen.getByRole("button", { name: "Choose Date" }));
      await user.click(screen.getByRole("menuitem", { name: label }));
      const expected = {
        ...initial,
        years: [],
        ...getReportDateRangePreset(value),
      };
      assertApplied(expected);
      assertDraft();
      expect(
        screen.getByRole("button", { name: "Choose Date" }).textContent,
      ).toBe(`Date: ${label}`);
    },
  );
  it("does not display a preset the parent declined to commit", async () => {
    const user = setup(EMPTY_FILTERS, false);
    await user.click(screen.getByRole("button", { name: "Choose Date" }));
    await user.click(screen.getByRole("menuitem", { name: "Last Month" }));
    assertApplied(EMPTY_FILTERS, "1,2,3");
    expect(
      screen.getByRole("button", { name: "Choose Date" }).textContent,
    ).toBe("Date: All Time");
  });
  it.each([
    {
      field: "categories" as const,
      label: "Category",
      values: ["Need", "Want"],
      chip: "Category",
    },
    {
      field: "tags" as const,
      label: "Tags",
      values: ["home", "trip"],
      chip: "Tag",
    },
  ])(
    "selects, deselects and removes multiple $label values immediately",
    async ({ field, label, values, chip }) => {
      const initial: FilterParams = {
        ...EMPTY_FILTERS,
        search: "coffee",
        minAmount: 10,
        maxAmount: 100,
        years: ["2025", "2026"],
        startDate: "2025-01-01",
        endDate: "2026-12-31",
        categories: field === "tags" ? ["Need", "Want"] : [],
        tags: field === "categories" ? ["home", "trip"] : [],
      };
      const user = setup(initial);
      await draft(user);
      async function select(value: string) {
        await user.click(screen.getByRole("combobox", { name: label }));
        await user.click(screen.getByRole("option", { name: value }));
      }
      await select(values[0]);
      assertApplied({ ...initial, [field]: [values[0]] }, "1");
      await select(values[1]);
      assertApplied({ ...initial, [field]: values }, "1,2");
      await select(values[0]);
      assertApplied({ ...initial, [field]: [values[1]] }, "2");
      await removeChip(user, `${chip}: ${values[1]}`);
      assertApplied(initial, "1,2");
      assertDraft();
    },
  );
  it("removes year chips and clears search without losing other filters or drafts", async () => {
    const initial = {
      ...EMPTY_FILTERS,
      years: ["2025", "2026"],
      categories: ["Need" as const],
      tags: ["home"],
      search: "coffee",
      minAmount: 10,
      maxAmount: 2000,
    };
    const user = setup(initial);
    await draft(user);
    await removeChip(user, "Year: 2025");
    assertApplied({ ...initial, years: ["2026"] }, "1");
    await user.click(screen.getByRole("button", { name: "Clear Search" }));
    assertApplied({ ...initial, years: ["2026"], search: "" }, "1,3");
    await removeChip(user, "Year: 2026");
    assertApplied({ ...initial, years: [], search: "" }, "1,3");
    assertDraft();
  });
  it.each(REPORT_AMOUNT_PRESETS)(
    "applies $label and clears all filters and drafts",
    async ({ label, range }) => {
      const initial = {
        ...EMPTY_FILTERS,
        startDate: "2026-01-01",
        categories: ["Need" as const],
        tags: ["home"],
        search: "coffee",
      };
      const user = setup(initial);
      await draft(user);
      await user.click(screen.getByRole("button", { name: "Choose Amount" }));
      await user.click(screen.getByRole("menuitem", { name: label }));
      assertApplied({ ...initial, ...range });
      await user.click(screen.getByRole("button", { name: "Clear Filters" }));
      assertApplied(EMPTY_FILTERS, "1,2,3");
      expect(
        (screen.getByLabelText("Min Amount") as HTMLInputElement).value,
      ).toBe("0");
      expect(
        (screen.getByLabelText("Max Amount") as HTMLInputElement).value,
      ).toBe("");
    },
  );
  it("commits valid manual dates and cleared dates while retaining amount drafts", async () => {
    const initial = {
      ...EMPTY_FILTERS,
      years: ["2025", "2026"],
      startDate: "2025-01-01",
      endDate: "2026-12-31",
    };
    const user = setup(initial);
    await draft(user);
    await user.click(screen.getAllByRole("button", { name: /Choose date/ })[0]);
    await user.click(screen.getByRole("gridcell", { name: "15" }));
    assertApplied({ ...initial, years: [], startDate: "2025-01-15" }, "1,2,3");
    await user.clear(screen.getByLabelText("Start Date"));
    assertApplied({ ...initial, years: [], startDate: null }, "1,2,3");
    await user.clear(screen.getByLabelText("End Date"));
    assertApplied(
      { ...initial, years: [], startDate: null, endDate: null },
      "1,2,3",
    );
    assertDraft();
  });
  it("only commits manual amount drafts with their dedicated Apply action", async () => {
    const user = setup();
    await draft(user);
    assertApplied(EMPTY_FILTERS, "1,2,3");
    await user.click(
      screen.getByRole("button", { name: "Apply Amount Range" }),
    );
    assertApplied({ ...EMPTY_FILTERS, minAmount: 17, maxAmount: 88 }, "1,2");
    expect(
      screen.getByRole("button", { name: "Choose Amount" }).textContent,
    ).toBe("Amount: Custom");
    expect(
      (
        screen.getByRole("button", {
          name: "Apply Amount Range",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });
  it("keeps manual dates labeled as custom without exposing a custom preset", async () => {
    const user = setup({
      ...EMPTY_FILTERS,
      startDate: "2026-09-01",
      endDate: "2026-09-02",
    });
    expect(
      screen.getByRole("button", { name: "Choose Date" }).textContent,
    ).toBe("Date: Custom");
    await user.click(screen.getByRole("button", { name: "Choose Date" }));
    expect(screen.queryByRole("menuitem", { name: "Custom" })).toBeNull();
  });
});
