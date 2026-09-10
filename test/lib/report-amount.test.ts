import { describe, expect, it } from "vitest";

import {
  InvalidReportAmountRangeError,
  parseReportAmountDraft,
  parseReportAmountRange,
} from "@/lib/utils/reportAmount";

describe("report amount range parsing", () => {
  it("uses the supported full range when parameters are omitted", () => {
    expect(parseReportAmountRange(new URLSearchParams())).toEqual({
      minAmount: 0,
      maxAmount: 999_999,
    });
  });

  it.each([
    "minAmount=-1",
    "maxAmount=999999.5",
    "minAmount=abc",
    "maxAmount=1000000",
    "minAmount=101&maxAmount=100",
  ])("rejects %s", (query) => {
    expect(() => parseReportAmountRange(new URLSearchParams(query))).toThrow(
      InvalidReportAmountRangeError,
    );
  });

  it("accepts a blank maximum as the supported upper limit", () => {
    expect(parseReportAmountDraft("100", "")).toEqual({
      range: { minAmount: 100, maxAmount: 999_999 },
      errors: {},
    });
  });

  it.each([
    ["-1", ""],
    ["0", "100.5"],
    ["100", "99"],
    ["", "100"],
  ])("reports invalid editable values (%s, %s)", (minAmount, maxAmount) => {
    expect(parseReportAmountDraft(minAmount, maxAmount).range).toBeNull();
  });
});
