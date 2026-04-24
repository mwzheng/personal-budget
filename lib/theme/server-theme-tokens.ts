import { alpha } from "@mui/material/styles";

/**
 * Note 1: Server Components cannot rely on MUI theme callback functions inside
 * `sx`, so these flattened tokens mirror the shared app palette in a plain,
 * importable shape that works on both the server and client.
 *
 * Tokens are organized semantically so consumers express intent ("surface.card",
 * "chart.grid") rather than raw values. Adding a new token here automatically
 * propagates to every Server and Client Component that imports this module.
 */
export const SERVER_THEME_TOKENS = {
  palette: {
    primary: "#2D7DD2",
    primaryLight: "#5B9FE0",
    primaryDark: "#1A5FA8",
    secondary: "#4caf50",
    backgroundDefault: "#1a1a1a",
    backgroundPaper: "#242424",
  },
  // Semantic surface layers for hierarchical dark-mode composition.
  // Use page → card → raised → overlay as you go deeper in the z-stack.
  surface: {
    page: "#1a1a1a",
    card: "#242424",
    raised: "#2c2c2c",
    overlay: "#353535",
    selected: alpha("#2D7DD2", 0.14),
    selectedHover: alpha("#2D7DD2", 0.22),
  },
  border: {
    subtle: alpha("#ffffff", 0.06),
    standard: alpha("#ffffff", 0.08),
    strong: alpha("#ffffff", 0.18),
    focus: "#2D7DD2",
  },
  text: {
    primary: alpha("#ffffff", 0.87),
    secondary: alpha("#ffffff", 0.6),
    disabled: alpha("#ffffff", 0.38),
    hint: alpha("#ffffff", 0.5),
  },
  // 8-color accessible palette for dark-mode data visualization.
  // Colors are ordered by perceptual distinctiveness for sequential series.
  chart: {
    palette: [
      "#5B9FE0", // blue (primary family)
      "#66BB6A", // green
      "#FF8A65", // orange
      "#AB47BC", // purple
      "#26C6DA", // cyan
      "#FFCA28", // amber
      "#EF5350", // red
      "#78909C", // blue-grey
    ] as readonly string[],
    axis: alpha("#ffffff", 0.3),
    grid: alpha("#ffffff", 0.08),
    tooltip: "#2c2c2c",
  },
  shadow: {
    low: `0 1px 4px ${alpha("#000000", 0.24)}`,
    medium: `0 4px 12px ${alpha("#000000", 0.32)}`,
    deep: `0 8px 24px ${alpha("#000000", 0.4)}`,
    card: `0 2px 8px ${alpha("#000000", 0.28)}`,
    dialog: `0 12px 40px ${alpha("#000000", 0.55)}`,
  },
  focus: {
    ring: `0 0 0 2px rgba(45, 125, 210, 0.35)`,
  },
  // Consistent spacing constants for sections and page layout.
  spacing: {
    pagePy: { xs: 4, md: 5 },
    sectionGap: 3,
    cardPadding: { xs: 2.5, sm: 3 },
  },
} as const;
