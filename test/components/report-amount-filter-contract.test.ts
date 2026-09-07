import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "../..");

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

describe("Report amount filter layout contract", () => {
  it("keeps only title-cased manual amount fields in More Filters", () => {
    const source = readSource("components/report/AmountRangeFilter.tsx");

    expect(source).toContain('label="Min Amount"');
    expect(source).toContain('label="Max Amount"');
    expect(source).not.toContain("Quick Range");
    expect(source).not.toContain("<Button");
    expect(source).not.toContain("<Chip");
  });

  it("makes quick ranges available in the toolbar beside Date Range", () => {
    const source = readSource("components/report/FilterBar.tsx");

    expect(source).toContain('aria-label="Choose Amount Range"');
    expect(source).toContain('id="report-amount-range-menu"');
    expect(source).toContain("REPORT_AMOUNT_PRESETS.map");
    expect(source).toContain("Custom Range");
  });

  it("removes persistent amount helper copy from the filter bar", () => {
    const source = readSource("components/report/FilterBar.tsx");

    expect(source).not.toContain("Blank means");
    expect(source).not.toContain("Whole dollars only");
  });

  it("keeps desktop amount fields compact and mobile fields two-column", () => {
    const source = readSource("components/report/AmountRangeFilter.tsx");

    expect(source).toContain('xs: "repeat(2, minmax(0, 1fr))"');
    expect(source).toContain('md: "170px auto 170px"');
    expect(source).toContain('width: { xs: "100%", md: "fit-content" }');

    const filterBar = readSource("components/report/FilterBar.tsx");
    expect(filterBar).toContain('data-testid="report-amount-actions"');
    expect(filterBar).toContain('md: "auto auto"');
  });
});
