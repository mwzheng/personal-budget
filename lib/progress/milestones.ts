import type { MilestoneEntry } from "@/lib/types/types";

type MilestoneDate = Pick<MilestoneEntry, "year" | "month">;

function hasExactDate(
  entry: MilestoneDate,
): entry is MilestoneDate & { year: number; month: number } {
  return typeof entry.year === "number" && typeof entry.month === "number";
}

export function sortMilestonesChronologically(
  entries: MilestoneEntry[],
): MilestoneEntry[] {
  return [...entries].sort((a, b) => {
    const aDate = hasExactDate(a);
    const bDate = hasExactDate(b);
    const aYear = typeof a.year === "number" ? a.year : undefined;
    const bYear = typeof b.year === "number" ? b.year : undefined;
    if (aYear !== undefined && bYear !== undefined) {
      if (aYear !== bYear) return aYear - bYear;
      if (aDate && bDate) return a.month - b.month;
      if (aDate) return -1;
      if (bDate) return 1;
      return 0;
    }
    if (aYear !== undefined) return -1;
    if (bYear !== undefined) return 1;
    return 0;
  });
}

export function formatMilestoneDate(entry: MilestoneDate): string | undefined {
  if (!hasExactDate(entry))
    return entry.year == null ? undefined : `Year ${entry.year}`;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(entry.year, entry.month - 1, 1)));
}

export function elapsedMonthsBetween(
  previous: MilestoneDate,
  current: MilestoneDate,
): number | undefined {
  if (!hasExactDate(previous) || !hasExactDate(current)) return undefined;
  return (current.year - previous.year) * 12 + current.month - previous.month;
}

export function formatElapsedMonths(months: number): string {
  if (months === 0) return "same month";
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  const parts: string[] = [];
  if (years) parts.push(`${years} year${years === 1 ? "" : "s"}`);
  if (remainingMonths)
    parts.push(`${remainingMonths} month${remainingMonths === 1 ? "" : "s"}`);
  return `${parts.join(", ")} later`;
}

export interface MilestoneTimelineRow {
  milestone: MilestoneEntry;
  elapsedLabel?: string;
}

export function buildMilestoneTimeline(
  entries: MilestoneEntry[],
): MilestoneTimelineRow[] {
  const sorted = sortMilestonesChronologically(entries);
  return sorted.map((milestone, index) => {
    const elapsed =
      index === 0
        ? undefined
        : elapsedMonthsBetween(sorted[index - 1], milestone);
    return {
      milestone,
      elapsedLabel:
        elapsed === undefined || elapsed < 0
          ? undefined
          : formatElapsedMonths(elapsed),
    };
  });
}
