import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildMilestoneTimeline,
  formatElapsedMonths,
  formatMilestoneDate,
  sortMilestonesChronologically,
} from "@/lib/progress/milestones";
import type { MilestoneEntry } from "@/lib/types/types";

const milestones: MilestoneEntry[] = [
  { milestoneId: "later", amount: 50_000, year: 2024, month: 7 },
  { milestoneId: "legacy", amount: 25_000, year: 2023, month: null },
  { milestoneId: "first", amount: 100_000, year: 2023, month: 9, age: 25 },
  { milestoneId: "undated", amount: 10_000, year: null, month: null },
];

describe("milestone timeline helpers", () => {
  it("sorts exact dates chronologically ahead of legacy undated records", () => {
    expect(
      sortMilestonesChronologically(milestones).map(
        (entry) => entry.milestoneId,
      ),
    ).toEqual(["first", "legacy", "later", "undated"]);
  });

  it("formats exact dates and elapsed calendar months", () => {
    expect(formatMilestoneDate({ year: 2023, month: 9 })).toBe(
      "September 2023",
    );
    expect(formatElapsedMonths(0)).toBe("same month");
    expect(formatElapsedMonths(1)).toBe("1 month later");
    expect(formatElapsedMonths(10)).toBe("10 months later");
    expect(formatElapsedMonths(13)).toBe("1 year, 1 month later");
    expect(formatElapsedMonths(24)).toBe("2 years later");
  });

  it("only creates elapsed labels between adjacent exact month/year records", () => {
    expect(
      buildMilestoneTimeline(milestones).map((row) => ({
        id: row.milestone.milestoneId,
        elapsed: row.elapsedLabel,
      })),
    ).toEqual([
      { id: "first", elapsed: undefined },
      { id: "legacy", elapsed: undefined },
      { id: "later", elapsed: undefined },
      { id: "undated", elapsed: undefined },
    ]);
    expect(
      buildMilestoneTimeline([
        { milestoneId: "a", amount: 1, year: 2023, month: 9 },
        { milestoneId: "b", amount: 2, year: 2024, month: 7 },
      ]).at(1)?.elapsedLabel,
    ).toBe("10 months later");
  });

  it("recomputes the adjacent elapsed label after the milestone data is replaced", () => {
    const initial = buildMilestoneTimeline([
      { milestoneId: "january", amount: 100, year: 2026, month: 1 },
      { milestoneId: "july", amount: 200, year: 2026, month: 7 },
    ]);
    const refreshed = buildMilestoneTimeline([
      { milestoneId: "january", amount: 100, year: 2026, month: 1 },
      { milestoneId: "april", amount: 150, year: 2026, month: 4 },
      { milestoneId: "july", amount: 200, year: 2026, month: 7 },
    ]);

    expect(initial.at(1)?.elapsedLabel).toBe("6 months later");
    expect(refreshed.map((row) => row.elapsedLabel)).toEqual([
      undefined,
      "3 months later",
      "3 months later",
    ]);
  });

  it("uses a controlled month selector and awaits milestone refreshes", () => {
    const formSource = readFileSync(
      resolve(process.cwd(), "components/forms/MilestoneForm.tsx"),
      "utf8",
    );
    const pageSource = readFileSync(
      resolve(process.cwd(), "app/progress/page.tsx"),
      "utf8",
    );
    const listSource = readFileSync(
      resolve(process.cwd(), "components/progress/MilestonesList.tsx"),
      "utf8",
    );

    expect(formSource).toContain("<Select");
    expect(formSource).toContain("MONTHS.map");
    expect(formSource).not.toContain('type="month"');
    expect(pageSource).toContain("await refreshMilestones();");
    expect(listSource).toContain("await onMilestonesChanged?.();");
  });

  it("keeps legacy blank dates editable while requiring complete dates for new milestones", () => {
    const formSource = readFileSync(
      resolve(process.cwd(), "components/forms/MilestoneForm.tsx"),
      "utf8",
    );

    expect(formSource).toContain(
      "const yearRequired = !existingMilestone || existingMilestone.year != null;",
    );
    expect(formSource).toContain(
      "const monthRequired = !existingMilestone || existingMilestone.month != null;",
    );
    expect(formSource).toMatch(/label="Year"[\s\S]*?required=\{yearRequired\}/);
    expect(formSource).toMatch(/<FormControl required=\{monthRequired\}/);
    expect(formSource).toContain("year: year ? numericYear : null");
    expect(formSource).toContain("month: month ? numericMonth : null");
  });

  it("sends the fetched version for edits without treating createdAt as client authority", () => {
    const formSource = readFileSync(
      resolve(process.cwd(), "components/forms/MilestoneForm.tsx"),
      "utf8",
    );
    expect(formSource).toContain(
      "body.expectedUpdatedAt = existingMilestone.updatedAt;",
    );
    expect(formSource).not.toContain(
      "body.createdAt = existingMilestone.createdAt",
    );
  });
});
