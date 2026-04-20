import { alpha } from "@mui/material/styles";

/**
 * Note 1: Server Components cannot rely on MUI theme callback functions inside
 * `sx`, so these flattened tokens mirror the shared app palette in a plain,
 * importable shape that works on both the server and client.
 */
export const SERVER_THEME_TOKENS = {
  palette: {
    primary: "#2D7DD2",
    secondary: "#4caf50",
    backgroundDefault: "#1a1a1a",
    backgroundPaper: "#242424",
  },
  border: {
    subtle: alpha("#ffffff", 0.06),
    standard: alpha("#ffffff", 0.08),
    strong: alpha("#ffffff", 0.18),
  },
  shadow: {
    deep: alpha("#000000", 0.24),
  },
} as const;
