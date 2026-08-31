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

  it("keeps ordinary browsing bounded and exposes explicit history loading", () => {
    const source = readSource("app/reports/page.tsx");

    expect(source).toContain('params.set("startDate", `${year}-01-01`);');
    expect(source).toContain('params.set("endDate", `${year}-12-31`);');
    expect(source).toContain("Load all history");
  });
});
