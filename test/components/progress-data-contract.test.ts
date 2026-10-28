import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "../..");
const readSource = (relativePath: string) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

describe("Progress history data ownership contract", () => {
  it("supports controlled salary data without mounting a child fetch", () => {
    const source = readSource("components/ui/SalaryList.tsx");

    expect(source).toContain("entries?: SalaryEntry[]");
    expect(source).toContain("controlledEntries ?? localEntries");
    expect(source).toContain("if (controlledEntries === undefined)");
    expect(source).toContain(
      "if (controlledEntries === undefined) await fetchEntries();",
    );
    expect(source).toContain("await Promise.resolve(onEntriesChanged?.());");
  });

  it("supports controlled retirement data without mounting a child fetch", () => {
    const source = readSource("components/ui/RetirementList.tsx");

    expect(source).toContain("entries?: RetirementEntry[]");
    expect(source).toContain("controlledEntries ?? localEntries");
    expect(source).toContain("if (controlledEntries === undefined)");
    expect(source).toContain(
      "if (controlledEntries === undefined) await fetchEntries();",
    );
    expect(source).toContain("await Promise.resolve(onEntriesChanged?.());");
  });

  it("passes parent-owned retirement entries to the history list", () => {
    const page = readSource("app/progress/page.tsx");

    expect(page).toContain("entries={retirementEntries}");
    expect(page).toContain("loading={chartLoading}");
    expect(page).toContain(
      "await Promise.all([refreshRetirementData(), refreshGoalData()])",
    );
  });
});
