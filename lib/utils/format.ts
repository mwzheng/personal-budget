/**
 * Note 1: Shared USD currency formatter extracted from 8 components that each
 * defined their own identical copy. Centralising here avoids drift and lets
 * every consumer share a single, tested implementation.
 *
 * @param value  The numeric amount to format.
 * @param options  Optional `Intl.NumberFormatOptions` overrides (e.g.
 *   `{ maximumFractionDigits: 0 }` for whole-dollar display).
 * @returns A locale-formatted USD string such as "$1,234.56".
 */
export function formatCurrency(
  value: number,
  options?: Intl.NumberFormatOptions,
): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    ...options,
  });
}

/**
 * Note 2: Convenience wrapper that drops the cents — used by the budget
 * planner, Sankey chart, and pie chart where fractional dollars add visual
 * noise without adding useful precision.
 */
export function formatCurrencyWhole(value: number): string {
  return formatCurrency(value, { maximumFractionDigits: 0 });
}

export function sanitizeNumberString(s?: string) {
  if (s === undefined || s === null) return "";
  return String(s).replace(/[\s,$]/g, "");
}
