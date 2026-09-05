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

export const LIGHT_THEME_TOKENS = {
  ...DARK_THEME_TOKENS,
  palette: {
    primary: "#087F75",
    primaryLight: "#0A9689",
    primaryDark: "#05655E",
    secondary: "#087A98",
    success: "#237A46",
    warning: "#965C08",
    danger: "#BB343F",
    backgroundDefault: "#F3F7F7",
    backgroundPaper: "#FFFFFF",
  },
  surface: {
    page: "#F3F7F7",
    card: "#FFFFFF",
    raised: "#E9F0F0",
    overlay: "#FFFFFF",
    selected: "rgba(8,127,117,0.10)",
    selectedHover: "rgba(8,127,117,0.17)",
  },
  border: {
    subtle: "#D6E2E2",
    standard: "#B7CDCD",
    strong: "#789C9F",
    focus: "#087F75",
  },
  text: {
    primary: "#172F35",
    secondary: "#47646B",
    disabled: "#627C82",
    hint: "#47646B",
  },
  chart: {
    palette: [
      "#087F75",
      "#087A98",
      "#237A46",
      "#965C08",
      "#7352B3",
      "#B45620",
      "#BB343F",
      "#47646B",
    ] as readonly string[],
    axis: "#47646B",
    grid: "#D6E2E2",
    tooltip: "#FFFFFF",
  },
  focus: { ring: "0 0 0 3px rgba(8,127,117,0.25)" },
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
