/**
 * Note 1: Centralized category color mappings for the entire application.
 * All category-to-color assignments live here so visual encoding stays
 * consistent across charts, tables, and forms. When a category color
 * changes, only this file needs to be updated.
 *
 * The three mappings serve different rendering contexts:
 * - CATEGORY_HEX_COLORS  → Recharts and other SVG/canvas-based charts
 * - CATEGORY_CHIP_COLORS → MUI Chip `color` prop (semantic token)
 * - TAG_CHART_PALETTE    → 15-color cycling palette for per-tag bar charts
 */
import type { CategoryType, TransactionCategoryType } from "@/lib/types/types";

// Note 2: Hex values intentionally mirror MUI's default palette so charts
// look visually consistent with themed components even though Recharts
// does not consume the MUI theme directly.
export const CATEGORY_HEX_COLORS: Record<CategoryType, string> = {
  Need: "#ef5350", // red  – aligns with MUI error
  Want: "#42a5f5", // blue – aligns with MUI info
  Saving: "#66bb6a", // green – aligns with MUI success
};

// Note 3: MUI semantic color tokens used by Chip, Badge, and similar
// components. The same tokens double as keys into `theme.palette[token]`
// for theme-aware color resolution (e.g. in SankeyForm sliders).
export const CATEGORY_CHIP_COLORS: Record<
  CategoryType,
  "error" | "info" | "success"
> = {
  Need: "error",
  Want: "info",
  Saving: "success",
};

export const TRANSACTION_CATEGORY_HEX_COLORS: Record<
  TransactionCategoryType,
  string
> = {
  ...CATEGORY_HEX_COLORS,
  Income: "#26a69a",
};

export const TRANSACTION_CATEGORY_CHIP_COLORS: Record<
  TransactionCategoryType,
  "error" | "info" | "success" | "primary"
> = {
  ...CATEGORY_CHIP_COLORS,
  Income: "primary",
};

// Note 4: A 15-color palette for the TagBarChart. The first three entries
// happen to match the category hex colors for visual consistency, and the
// remaining twelve provide enough variety for the most common tag counts
// before the palette wraps via modulo.
export const TAG_CHART_PALETTE: string[] = [
  "#42a5f5",
  "#66bb6a",
  "#ef5350",
  "#ffa726",
  "#ab47bc",
  "#26c6da",
  "#d4e157",
  "#ff7043",
  "#8d6e63",
  "#78909c",
  "#26a69a",
  "#5c6bc0",
  "#ef9a9a",
  "#ffe082",
  "#a5d6a7",
];
