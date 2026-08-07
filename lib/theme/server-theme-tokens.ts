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
    primary: "#36D9C5",
    primaryLight: "#86FFF0",
    primaryDark: "#159E98",
    secondary: "#55C7E8",
    success: "#55D68A",
    warning: "#F2B35D",
    danger: "#FF7B82",
    backgroundDefault: "#06111B",
    backgroundPaper: "#0B1B26",
  },
  // Semantic surface layers for the dark Dithered composition.
  surface: {
    page: "#06111B",
    card: "#0B1B26",
    raised: "#102632",
    overlay: "#142F3A",
    selected: alpha("#36D9C5", 0.14),
    selectedHover: alpha("#36D9C5", 0.22),
  },
  border: {
    subtle: "#17313B",
    standard: "#24505A",
    strong: "#3A6B72",
    focus: "#86FFF0",
  },
  text: {
    primary: "#E6F4F2",
    secondary: "#A9C6C8",
    disabled: "#6D8B91",
    hint: "#A9C6C8",
  },
  // 8-color accessible palette for dark-mode data visualization.
  // Colors are ordered by perceptual distinctiveness for sequential series.
  chart: {
    palette: [
      "#36D9C5", // teal
      "#55C7E8", // cyan
      "#55D68A", // green
      "#F2B35D", // amber
      "#BBA7FF", // violet
      "#FF9F70", // orange
      "#FF7B82", // red
      "#A9C6C8", // muted
    ] as readonly string[],
    axis: "#A9C6C8",
    grid: "#17313B",
    tooltip: "#142F3A",
  },
  shadow: {
    low: "0 2px 8px rgba(0, 0, 0, 0.18)",
    medium: "0 8px 24px rgba(0, 0, 0, 0.28)",
    deep: "0 16px 40px rgba(0, 0, 0, 0.36)",
    card: "0 4px 16px rgba(0, 0, 0, 0.2)",
    dialog: "0 20px 60px rgba(0, 0, 0, 0.45)",
  },
  focus: {
    ring: "0 0 0 3px rgba(134, 255, 240, 0.34)",
  },
  // Consistent spacing constants for sections and page layout.
  spacing: {
    pagePy: { xs: 4, md: 5 },
    sectionGap: 3,
    cardPadding: { xs: 2.5, sm: 3 },
  },
} as const;
