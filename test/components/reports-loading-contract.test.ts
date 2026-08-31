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

    expect(source).toContain(
      "force: force || allHistory, maxPages: allHistory ? undefined : 1",
    );
  });

  it("loads all history when All Time becomes the active date range", () => {
    const source = readSource("app/reports/page.tsx");

    expect(source).toContain("void loadTransactions(true, true);");
    expect(source).not.toContain("Load all history");
    expect(source).not.toContain(
      "Showing the first page of current-year transactions",
    );
  });

  it("uses saved date and year filters for the initial request", () => {
    const source = readSource("app/reports/page.tsx");

    expect(source).toContain("getInitialTransactionLoadPlan");
    expect(source).toContain("if (range?.startDate)");
    expect(source).toContain("if (range?.endDate)");
  });
});
