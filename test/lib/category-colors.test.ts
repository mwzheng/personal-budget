import { describe, it, expect } from "vitest";
import {
  CATEGORY_HEX_COLORS,
  CATEGORY_CHIP_COLORS,
  TAG_CHART_PALETTE,
} from "@/lib/utils/categoryColors";

const EXPECTED_CATEGORIES = ["Need", "Want", "Saving"] as const;

describe("CATEGORY_HEX_COLORS", () => {
  it("has an entry for every CategoryType", () => {
    for (const cat of EXPECTED_CATEGORIES) {
      expect(CATEGORY_HEX_COLORS, `should have key '${cat}'`).toHaveProperty(
        cat,
      );
    }
  });

  it("all values are valid 6-digit hex color strings", () => {
    for (const [cat, color] of Object.entries(CATEGORY_HEX_COLORS)) {
      expect(color, `${cat} color '${color}' should be a valid hex`).toMatch(
        /^#[0-9a-fA-F]{6}$/,
      );
    }
  });

  it("maps Need to a red-family hex", () => {
    expect(CATEGORY_HEX_COLORS.Need).toBe("#ef5350");
  });

  it("maps Want to a blue-family hex", () => {
    expect(CATEGORY_HEX_COLORS.Want).toBe("#42a5f5");
  });

  it("maps Saving to a green-family hex", () => {
    expect(CATEGORY_HEX_COLORS.Saving).toBe("#66bb6a");
  });
});

describe("CATEGORY_CHIP_COLORS", () => {
  it("has matching keys to CATEGORY_HEX_COLORS", () => {
    expect(Object.keys(CATEGORY_CHIP_COLORS).sort()).toEqual(
      Object.keys(CATEGORY_HEX_COLORS).sort(),
    );
  });

  it("maps Need to 'error' (MUI semantic token)", () => {
    expect(CATEGORY_CHIP_COLORS.Need).toBe("error");
  });

  it("maps Want to 'info' (MUI semantic token)", () => {
    expect(CATEGORY_CHIP_COLORS.Want).toBe("info");
  });

  it("maps Saving to 'success' (MUI semantic token)", () => {
    expect(CATEGORY_CHIP_COLORS.Saving).toBe("success");
  });
});

describe("TAG_CHART_PALETTE", () => {
  it("is an array of 15 entries", () => {
    expect(TAG_CHART_PALETTE).toHaveLength(15);
  });

  it("every entry is a valid 6-digit hex color string", () => {
    for (const color of TAG_CHART_PALETTE) {
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it("has no duplicate colors", () => {
    const unique = new Set(TAG_CHART_PALETTE);
    expect(unique.size).toBe(TAG_CHART_PALETTE.length);
  });
});
