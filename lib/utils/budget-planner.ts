/**
 * Note 1: Barrel re-export — preserves the original import path for all
 * consumers while the implementation now lives in three focused modules:
 *
 *   budget-normalizer  → factories, sanitization, path parsing
 *   sankey-builder     → pie chart and Sankey graph construction
 *   budget-calculator  → math helpers, sort, and insight orchestration
 *
 * No code should be added here. Import from the focused modules in new code
 * and rely on this barrel only for backwards-compatible existing imports.
 */
export * from "./budget-normalizer";
export * from "./sankey-builder";
export * from "./budget-calculator";
