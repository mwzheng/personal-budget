import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "../..");

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

describe("Reports loading contract", () => {
  it("forces all-history requests to bypass bounded cache data", () => {
    const source = readSource("app/reports/page.tsx");

    expect(source).toContain("force: force || plan.allHistory");
    expect(source).toContain("maxPages: plan.allHistory ? undefined : 1");
  });

  it("loads all history when All Time becomes the active date range", () => {
    const source = readSource("app/reports/page.tsx");

    expect(source).toContain("void loadTransactions(nextPlan, {");
    expect(source).toContain("dateSelection: getDateSelection(nextFilters)");
    expect(source).not.toContain("Load all history");
    expect(source).not.toContain(
      "Showing the first page of current-year transactions",
    );
  });

  it("uses saved date and year filters for the initial request", () => {
    const source = readSource("app/reports/page.tsx");

    expect(source).toContain("getInitialTransactionLoadPlan");
    expect(source).toContain("if (plan.startDate)");
    expect(source).toContain("if (plan.endDate)");
  });

  it("keeps filter controls mounted during date refreshes", () => {
    const source = readSource("app/reports/page.tsx");

    expect(source).toContain("const [initialLoading, setInitialLoading]");
    expect(source).toContain("const [resultsRefreshing, setResultsRefreshing]");
    expect(source).toContain("{initialLoading ? (");
    expect(source).toContain("{resultsLoading ? (");
    expect(source).toContain('aria-label="Loading transaction results"');
  });
});
