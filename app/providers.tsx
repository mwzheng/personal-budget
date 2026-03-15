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
import { usePathname } from "next/navigation";

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
    // visual glitches. This cleanup function strips those injected variables
    // without touching untouched MUI styles, which keeps hydration stable.
    const removeDarkReaderVars = () => {
      document.querySelectorAll("[style]").forEach((el) => {
        const style = el.getAttribute("style");
        if (!style || !style.includes("--darkreader-")) return;
        // Note 6: The guard above is important: without it, merely trimming and
        // rejoining declarations would rewrite equivalent inline styles (for
        // example MUI's `overflow:hidden`) and create a hydration mismatch
        // before React ever gets a chance to attach to the DOM.
        const cleaned = style
          .split(";")
          .map((s) => s.trim())
          .filter((s) => s && !s.includes("--darkreader-"))
          .join("; ");
        if (cleaned) {
          if (cleaned !== style) el.setAttribute("style", cleaned);
        } else {
          el.removeAttribute("style");
        }
      });
    };
    removeDarkReaderVars();
    // Note 7: The 100 ms delayed call handles extensions that inject styles
    // asynchronously after React's first paint. The `clearTimeout` in the
    // cleanup function prevents the callback from running after unmount.
    const t = setTimeout(removeDarkReaderVars, 100);
    return () => clearTimeout(t);
  }, []);

  // Note 9: Send a page_view event to Google Analytics when the client-side
  // pathname changes in the App Router. Providers is a client component so it
  // can observe route changes and forward them to gtag when available.
  const pathname = usePathname();
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

  useEffect(() => {
    if (!pathname || !GA_ID) return;
    // Safe no-op if gtag isn't loaded yet
    const sendPageview = () => {
      if ((window as any).gtag) {
        (window as any).gtag("config", GA_ID, { page_path: pathname });
      } else if ((window as any).dataLayer) {
        (window as any).dataLayer.push({
          event: "page_view",
          page_path: pathname,
        });
      }
    };
    sendPageview();
  }, [pathname, GA_ID]);

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
