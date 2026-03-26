import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatCurrencyWhole,
  sanitizeNumberString,
} from "@/lib/utils/format";

describe("formatCurrency", () => {
  it("formats a positive decimal value with cents", () => {
    expect(formatCurrency(1234.56)).toBe("$1,234.56");
  });

  it("formats zero as $0.00", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("formats a negative value (accounting notation or minus sign)", () => {
    const result = formatCurrency(-500);
    // Intl may render as "-$500.00" or "($500.00)" depending on locale data
    expect(result).toMatch(/500/);
    expect(result).toMatch(/\$|USD/);
  });

  it("accepts Intl.NumberFormatOptions overrides", () => {
    // maximumFractionDigits: 0 should strip cents
    expect(formatCurrency(99.99, { maximumFractionDigits: 0 })).toBe("$100");
  });
});

describe("formatCurrencyWhole", () => {
  it("formats a value without cents", () => {
    expect(formatCurrencyWhole(1500)).toBe("$1,500");
  });

  it("formats zero without cents", () => {
    expect(formatCurrencyWhole(0)).toBe("$0");
  });

  it("rounds to the nearest dollar", () => {
    expect(formatCurrencyWhole(99.6)).toBe("$100");
  });
});

describe("sanitizeNumberString", () => {
  it("strips dollar sign, commas, and spaces from a formatted currency string", () => {
    expect(sanitizeNumberString("$1,234.56")).toBe("1234.56");
  });

  it("returns an empty string for undefined input", () => {
    expect(sanitizeNumberString(undefined)).toBe("");
  });

  it("returns an empty string for null input", () => {
    // sanitizeNumberString accepts null via its optional param signature
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(sanitizeNumberString(null as any)).toBe("");
  });

  it("returns the value unchanged when there is nothing to strip", () => {
    expect(sanitizeNumberString("42.5")).toBe("42.5");
  });

  it("strips whitespace characters", () => {
    expect(sanitizeNumberString("  100 ")).toBe("100");
  });
});
