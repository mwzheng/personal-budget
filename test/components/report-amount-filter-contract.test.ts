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

  it("makes quick ranges available in the toolbar beside Date", () => {
    const source = readSource("components/report/FilterBar.tsx");

    expect(source).toContain('aria-label="Choose Amount"');
    expect(source).toContain('id="report-amount-range-menu"');
    expect(source).toContain("REPORT_AMOUNT_PRESETS.map");
    expect(source).not.toContain("Custom Range");
    expect(source).toContain('aria-label="Choose Date"');
  });

  it("removes persistent amount helper copy from the filter bar", () => {
    const source = readSource("components/report/FilterBar.tsx");

    expect(source).not.toContain("Blank means");
    expect(source).not.toContain("Whole dollars only");
  });

  it("uses spaced paired ranges with responsive connectors", () => {
    const source = readSource("components/report/AmountRangeFilter.tsx");

    expect(source).toContain('sm: "minmax(0, 1fr) auto minmax(0, 1fr)"');
    expect(source).toContain('data-testid="report-amount-range-connector"');
    expect(source).toContain(">\n        to\n      </Typography>");
    expect(source).toContain('width: "100%"');

    const filterBar = readSource("components/report/FilterBar.tsx");
    expect(filterBar).toContain('data-testid="report-date-range-group"');
    expect(filterBar).toContain('data-testid="report-amount-range-group"');
    expect(filterBar).toContain('data-testid="report-date-range-connector"');
    expect(filterBar).toContain("gap: { xs: 2.5, lg: 4 }");
    expect(filterBar).not.toContain('component="fieldset"');
    expect(filterBar).not.toContain('component="legend"');
    expect(filterBar).not.toContain("Apply Amount Range");
    expect(filterBar).toContain('lg: "repeat(2, minmax(0, 1fr))"');
    expect(filterBar).toContain('sm: "repeat(2, minmax(0, 1fr))"');
  });
});
