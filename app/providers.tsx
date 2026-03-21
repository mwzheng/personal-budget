// Note 1: `"use client"` marks this module as a Client Component. The
// Providers component wraps the entire app and must be a Client Component
// because MUI's ThemeProvider and LocalizationProvider use React Context,
// which requires client-side rendering. Server Components cannot use Context.
"use client";

import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFnsV3";
import { ReactNode, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  APP_NAME,
  getPageTitleEntryByPathname,
  normalizeAppPathname,
} from "@/lib/content/page-titles";

type AnalyticsWindow = Window & {
  gtag?: (
    command: "config",
    targetId: string,
    config: Record<string, unknown>,
  ) => void;
  dataLayer?: unknown[];
};

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
  shape: {
    borderRadius: 12,
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
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderRadius: 12,
          // Note 5: Subtle border gives cards visual separation without heavy shadows
          border: "1px solid rgba(255, 255, 255, 0.06)",
          transition:
            "box-shadow 0.2s ease-in-out, border-color 0.2s ease-in-out",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none" as const,
          fontWeight: 500,
          transition: "all 0.2s ease-in-out",
        },
        contained: {
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
          "&:hover": {
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.4)",
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6)",
          backgroundImage: "none",
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: "1.125rem",
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: "16px 24px",
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: "1px solid",
          // Note 6: MUI automatically sets borderColor based on severity via the theme
        },
        standardError: {
          borderColor: "rgba(239, 83, 80, 0.3)",
        },
        standardSuccess: {
          borderColor: "rgba(102, 187, 106, 0.3)",
        },
        standardInfo: {
          borderColor: "rgba(41, 182, 246, 0.3)",
        },
        standardWarning: {
          borderColor: "rgba(255, 167, 38, 0.3)",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
            transition:
              "border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
            "&.Mui-focused": {
              boxShadow: "0 0 0 2px rgba(45, 125, 210, 0.2)",
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none" as const,
          fontWeight: 500,
          minWidth: "auto",
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: "3px 3px 0 0",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: "rgba(255, 255, 255, 0.06)",
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: "rgba(255, 255, 255, 0.06)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
        },
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

  // Note 8: Route metadata is resolved once here so browser-tab titles and
  // analytics payloads share the same source of truth as more public pages land.
  const pathname = usePathname();
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
  const normalizedPathname = normalizeAppPathname(pathname);
  const pageTitle =
    getPageTitleEntryByPathname(normalizedPathname)?.title ?? APP_NAME;
  const hasTrackedInitialPageLoad = useRef(false);

  useEffect(() => {
    document.title = pageTitle;

    if (!GA_ID) return;

    // Note 9: The first hard-load page_view comes from `app/layout.tsx`, so this
    // effect skips its first analytics send and only tracks later SPA navigations.
    if (!hasTrackedInitialPageLoad.current) {
      hasTrackedInitialPageLoad.current = true;
      return;
    }

    // Note 10: Retrying briefly avoids racing the GA bootstrap script on a very
    // fast client-side navigation, while the fallback keeps the old dataLayer
    // no-op behavior if gtag never appears.
    let attemptsRemaining = 10;
    let timeoutId: number | undefined;

    const sendPageview = () => {
      const analyticsWindow = window as AnalyticsWindow;
      const payload = {
        page_path: normalizedPathname,
        page_title: pageTitle,
      };

      if (analyticsWindow.gtag) {
        analyticsWindow.gtag("config", GA_ID, payload);
        return;
      }

      if (analyticsWindow.dataLayer) {
        analyticsWindow.dataLayer.push({
          event: "page_view",
          ...payload,
        });
        return;
      }

      if (attemptsRemaining === 0) return;

      attemptsRemaining -= 1;
      timeoutId = window.setTimeout(sendPageview, 100);
    };

    sendPageview();

    return () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [GA_ID, normalizedPathname, pageTitle]);

  return (
    // Note 11: `ThemeProvider` makes the `darkTheme` available to all nested
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
