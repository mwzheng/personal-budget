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
export const DARK_THEME_TOKENS = {
  palette: {
    primary: "#8DC9A8",
    primaryLight: "#B6D3BD",
    primaryDark: "#609276",
    secondary: "#55C7E8",
    success: "#55D68A",
    warning: "#F2B35D",
    danger: "#FF7B82",
    backgroundDefault: "#171D1A",
    backgroundPaper: "#202824",
  },
  // Semantic surface layers for the dark Dithered composition.
  surface: {
    page: "#171D1A",
    card: "#202824",
    raised: "#29352E",
    overlay: "#27312C",
    selected: alpha("#8DC9A8", 0.14),
    selectedHover: alpha("#8DC9A8", 0.22),
  },
  border: {
    subtle: "#354139",
    standard: "#52645A",
    strong: "#71877A",
    focus: "#B6D3BD",
  },
  text: {
    primary: "#EDF2EE",
    secondary: "#B2BEB5",
    disabled: "#8D9C92",
    hint: "#B2BEB5",
  },
  // 8-color accessible palette for dark-mode data visualization.
  // Colors are ordered by perceptual distinctiveness for sequential series.
  chart: {
    palette: [
      "#8DC9A8", // teal
      "#55C7E8", // cyan
      "#55D68A", // green
      "#F2B35D", // amber
      "#BBA7FF", // violet
      "#FF9F70", // orange
      "#FF7B82", // red
      "#B2BEB5", // muted
    ] as readonly string[],
    axis: "#B2BEB5",
    grid: "#354139",
    tooltip: "#27312C",
  },
  shadow: {
    low: "0 2px 8px rgba(0, 0, 0, 0.18)",
    medium: "0 8px 24px rgba(0, 0, 0, 0.28)",
    deep: "0 16px 40px rgba(0, 0, 0, 0.36)",
    card: "0 4px 16px rgba(0, 0, 0, 0.2)",
    dialog: "0 20px 60px rgba(0, 0, 0, 0.45)",
  },
  focus: {
    ring: "0 0 0 3px rgba(182, 211, 189, 0.34)",
  },
  // Consistent spacing constants for sections and page layout.
  spacing: {
    pagePy: { xs: 4, md: 5 },
    sectionGap: 3,
    cardPadding: { xs: 2.5, sm: 3 },
  },
} as const;

export const LIGHT_THEME_TOKENS = {
  ...DARK_THEME_TOKENS,
  palette: {
    primary: "#31775D",
    primaryLight: "#3D8669",
    primaryDark: "#285F49",
    secondary: "#087A98",
    success: "#237A46",
    warning: "#965C08",
    danger: "#BB343F",
    backgroundDefault: "#F4F3EE",
    backgroundPaper: "#FFFEFA",
  },
  surface: {
    page: "#F4F3EE",
    card: "#FFFEFA",
    raised: "#EEF1EB",
    overlay: "#FFFEFA",
    selected: "rgba(49,119,93,0.10)",
    selectedHover: "rgba(49,119,93,0.17)",
  },
  border: {
    subtle: "#E4E7DF",
    standard: "#BCCBC0",
    strong: "#81998A",
    focus: "#31775D",
  },
  text: {
    primary: "#232B27",
    secondary: "#53645A",
    disabled: "#627C82",
    hint: "#53645A",
  },
  chart: {
    palette: [
      "#31775D",
      "#087A98",
      "#237A46",
      "#965C08",
      "#7352B3",
      "#B45620",
      "#BB343F",
      "#53645A",
    ] as readonly string[],
    axis: "#53645A",
    grid: "#E4E7DF",
    tooltip: "#FFFEFA",
  },
  focus: { ring: "0 0 0 3px rgba(49,119,93,0.25)" },
};

// CSS variables allow Server Components to follow appearance without hydration
// differences. Color math and raster exports use the concrete schemes above.
export const SERVER_THEME_TOKENS = {
  ...DARK_THEME_TOKENS,
  ...Object.fromEntries(
    Object.entries(DARK_THEME_TOKENS)
      .filter(([group]) => group !== "spacing")
      .map(([group, values]) => [
        group,
        Object.fromEntries(
          Object.entries(values).map(([name, value]) => [
            name,
            Array.isArray(value)
              ? value.map((_, index) => `var(--pb-${group}-${name}-${index})`)
              : `var(--pb-${group}-${name})`,
          ]),
        ),
      ]),
  ),
} as typeof DARK_THEME_TOKENS;

export function schemeCssVariables(
  tokens: typeof LIGHT_THEME_TOKENS | typeof DARK_THEME_TOKENS,
) {
  return Object.entries(tokens)
    .filter(([group]) => group !== "spacing")
    .flatMap(([group, values]) =>
      Object.entries(values).flatMap(([name, value]) =>
        Array.isArray(value)
          ? value.map(
              (color, index) => `--pb-${group}-${name}-${index}: ${color};`,
            )
          : [`--pb-${group}-${name}: ${value};`],
      ),
    )
    .join("\n");
}
