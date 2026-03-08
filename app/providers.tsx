// Note 1: `"use client"` marks this module as a Client Component. The
// Providers component wraps the entire app and must be a Client Component
// because MUI's ThemeProvider and LocalizationProvider use React Context,
// which requires client-side rendering. Server Components cannot use Context.
"use client";

import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFnsV3";
import { ReactNode, useEffect } from "react";

// Note 2: `createTheme` builds an MUI theme object at module load time (once).
// Defining it outside the component prevents the theme object from being
// recreated on every render, which would trigger unnecessary re-renders of all
// themed child components.
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    // Note 3: MUI palette colors follow the Material Design convention:
    // `main` is the primary color used for buttons, links, and highlights.
    // `primary` and `secondary` are used throughout MUI's default component styles.
    primary: { main: "#2D7DD2" },
    secondary: { main: "#4caf50" },
    background: {
      default: "#1a1a1a",
      paper: "#242424",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiCard: {
      // Note 4: MUI Cards in dark mode add a gradient `backgroundImage` by
      // default to simulate elevation via surface tints. Setting it to `none`
      // keeps the flat dark look consistent with the rest of the design.
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Note 5: Some browser extensions like Dark Reader inject CSS custom
    // properties (e.g. `--darkreader-bg-...`) as inline styles onto DOM
    // elements. These can conflict with MUI's own inline styles and cause
    // visual glitches. This cleanup function strips those injected variables.
    const removeDarkReaderVars = () => {
      document.querySelectorAll("[style]").forEach((el) => {
        const style = el.getAttribute("style");
        if (!style) return;
        // Note 6: `split(";")` splits the style string into individual
        // declarations, `filter` removes the Dark Reader ones, and `join("; ")`
        // reassembles a clean style string. The result is only written back
        // when it changed (`!== style`) to avoid redundant DOM mutations.
        const cleaned = style
          .split(";")
          .map((s) => s.trim())
          .filter((s) => s && !s.includes("--darkreader-"))
          .join("; ");
        if (cleaned !== style) el.setAttribute("style", cleaned);
      });
    };
    removeDarkReaderVars();
    // Note 7: The 100 ms delayed call handles extensions that inject styles
    // asynchronously after React's first paint. The `clearTimeout` in the
    // cleanup function prevents the callback from running after unmount.
    const t = setTimeout(removeDarkReaderVars, 100);
    return () => clearTimeout(t);
  }, []);

  return (
    // Note 8: `ThemeProvider` makes the `darkTheme` available to all nested
    // MUI components via React Context. `LocalizationProvider` provides the
    // date adapter (date-fns) to MUI date picker components. `CssBaseline`
    // injects a CSS reset and applies the theme's background color to <body>.
    <ThemeProvider theme={darkTheme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <CssBaseline />
        {children}
      </LocalizationProvider>
    </ThemeProvider>
  );
}
