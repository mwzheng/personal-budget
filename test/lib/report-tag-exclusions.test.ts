// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";

import {
  getExcludedReportTags,
  setExcludedReportTags,
} from "@/lib/utils/storage";

afterEach(() => {
  localStorage.clear();
});

describe("Top Tags exclusion preferences", () => {
  it("persists tags independently for each account", () => {
    setExcludedReportTags("user:one", ["eating out", "amazon"]);
    setExcludedReportTags("user:two", ["travel"]);

    expect(getExcludedReportTags("user:one")).toEqual(["eating out", "amazon"]);
    expect(getExcludedReportTags("user:two")).toEqual(["travel"]);
  });

  it("clears an account's exclusions when given an empty list", () => {
    setExcludedReportTags("demo", ["eating out"]);
    setExcludedReportTags("demo", []);

    expect(getExcludedReportTags("demo")).toEqual([]);
  });
});
