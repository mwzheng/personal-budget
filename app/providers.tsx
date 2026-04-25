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
import {
  buildGoogleAnalyticsPageViewPayload,
  buildGoogleAnalyticsRuntimeConfig,
  type GoogleAnalyticsPageViewPayload,
  type GoogleAnalyticsRuntimeConfig,
} from "@/lib/analytics/google-analytics";
import {
  APP_NAME,
  getPageTitleEntryByPathname,
  normalizeAppPathname,
} from "@/lib/content/page-titles";
import { SERVER_THEME_TOKENS } from "@/lib/theme/server-theme-tokens";

type Gtag = {
  (command: "config", targetId: string, config: Record<string, unknown>): void;
  (
    command: "event",
    eventName: "page_view",
    config: Record<string, unknown>,
  ): void;
};

type AnalyticsWindow = Window & {
  __PB_ANALYTICS__?: GoogleAnalyticsRuntimeConfig;
  __PB_ANALYTICS_READY__?: boolean;
  __PB_LAST_TRACKED_PAGE_PATH__?: string;
  __PB_PENDING_PAGE_VIEW__?: GoogleAnalyticsPageViewPayload | null;
  gtag?: Gtag;
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
    primary: {
      main: SERVER_THEME_TOKENS.palette.primary,
      light: SERVER_THEME_TOKENS.palette.primaryLight,
      dark: SERVER_THEME_TOKENS.palette.primaryDark,
    },
    secondary: { main: SERVER_THEME_TOKENS.palette.secondary },
    background: {
      default: SERVER_THEME_TOKENS.palette.backgroundDefault,
      paper: SERVER_THEME_TOKENS.palette.backgroundPaper,
    },
  },
  typography: {
    // Note 3.1: `var(--font-inter)` resolves to the Next.js self-hosted Inter
    // font injected by the root layout. The remaining stack is a safe fallback
    // chain for the rare case the variable is absent (e.g., in Storybook).
    fontFamily:
      'var(--font-inter), "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700, letterSpacing: "-0.02em" },
    h2: { fontWeight: 700, letterSpacing: "-0.01em" },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        // Note 3.2: Standardize focus-visible across all interactive elements so
        // keyboard navigation is clearly visible without relying on browser defaults.
        "*, *::before, *::after": {
          "&:focus-visible": {
            outline: `2px solid ${SERVER_THEME_TOKENS.border.focus}`,
            outlineOffset: "2px",
          },
        },
      },
    },
    MuiCard: {
      // Note 4: MUI Cards in dark mode add a gradient `backgroundImage` by
      // default to simulate elevation via surface tints. Setting it to `none`
      // keeps the flat dark look consistent with the rest of the design.
      styleOverrides: {
        root: {
          backgroundImage: "none",
          transition:
            "box-shadow 0.2s ease-in-out, border-color 0.2s ease-in-out",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderRadius: 12,
          // Note 5: Subtle border gives cards visual separation without heavy shadows
          border: `1px solid ${SERVER_THEME_TOKENS.border.subtle}`,
          transition:
            "box-shadow 0.2s ease-in-out, border-color 0.2s ease-in-out",
        },
        elevation1: {
          boxShadow: SERVER_THEME_TOKENS.shadow.low,
        },
        elevation2: {
          boxShadow: SERVER_THEME_TOKENS.shadow.medium,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none" as const,
          fontWeight: 600,
          letterSpacing: "0.01em",
          transition: "all 0.2s ease-in-out",
          "&:focus-visible": {
            boxShadow: SERVER_THEME_TOKENS.focus.ring,
          },
        },
        contained: {
          boxShadow: SERVER_THEME_TOKENS.shadow.low,
          "&:hover": {
            boxShadow: SERVER_THEME_TOKENS.shadow.medium,
          },
        },
        outlined: {
          borderColor: SERVER_THEME_TOKENS.border.strong,
          "&:hover": {
            borderColor: SERVER_THEME_TOKENS.palette.primary,
            backgroundColor: SERVER_THEME_TOKENS.surface.selected,
          },
        },
        text: {
          "&:hover": {
            backgroundColor: SERVER_THEME_TOKENS.surface.selected,
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: "all 0.15s ease-in-out",
          "&:hover": {
            backgroundColor: SERVER_THEME_TOKENS.surface.selected,
          },
          "&:focus-visible": {
            boxShadow: SERVER_THEME_TOKENS.focus.ring,
          },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: "none" as const,
          fontWeight: 500,
          borderColor: SERVER_THEME_TOKENS.border.standard,
          "&.Mui-selected": {
            backgroundColor: SERVER_THEME_TOKENS.surface.selected,
            borderColor: SERVER_THEME_TOKENS.palette.primary,
            color: SERVER_THEME_TOKENS.palette.primaryLight,
            "&:hover": {
              backgroundColor: SERVER_THEME_TOKENS.surface.selectedHover,
            },
          },
          "&:focus-visible": {
            boxShadow: SERVER_THEME_TOKENS.focus.ring,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          border: `1px solid ${SERVER_THEME_TOKENS.border.standard}`,
          boxShadow: SERVER_THEME_TOKENS.shadow.dialog,
          backgroundImage: "none",
          backgroundColor: SERVER_THEME_TOKENS.surface.card,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: "1.125rem",
          borderBottom: `1px solid ${SERVER_THEME_TOKENS.border.subtle}`,
          paddingBottom: "16px",
          marginBottom: "4px",
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: "20px 24px",
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: "16px 24px",
          borderTop: `1px solid ${SERVER_THEME_TOKENS.border.subtle}`,
          gap: "8px",
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
            "& fieldset": {
              borderColor: SERVER_THEME_TOKENS.border.standard,
            },
            "&:hover fieldset": {
              borderColor: SERVER_THEME_TOKENS.border.strong,
            },
            "&.Mui-focused fieldset": {
              borderColor: SERVER_THEME_TOKENS.palette.primary,
            },
            "&.Mui-focused": {
              boxShadow: SERVER_THEME_TOKENS.focus.ring,
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
          transition: "all 0.15s ease-in-out",
          "&.MuiChip-clickable:hover": {
            backgroundColor: SERVER_THEME_TOKENS.surface.raised,
          },
        },
        outlined: {
          borderColor: SERVER_THEME_TOKENS.border.standard,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none" as const,
          fontWeight: 500,
          minWidth: "auto",
          letterSpacing: "0.01em",
          "&:focus-visible": {
            boxShadow: SERVER_THEME_TOKENS.focus.ring,
            borderRadius: 4,
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 2,
          borderRadius: "2px 2px 0 0",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: SERVER_THEME_TOKENS.border.subtle,
        },
        head: {
          fontWeight: 600,
          fontSize: "0.75rem",
          letterSpacing: "0.05em",
          textTransform: "uppercase" as const,
          color: SERVER_THEME_TOKENS.text.secondary,
          backgroundColor: SERVER_THEME_TOKENS.surface.card,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: "background-color 0.15s ease-in-out",
          "&:hover": {
            backgroundColor: SERVER_THEME_TOKENS.surface.raised,
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: SERVER_THEME_TOKENS.border.subtle,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderBottom: `1px solid ${SERVER_THEME_TOKENS.border.subtle}`,
        },
      },
    },
    MuiTooltip: {
      defaultProps: {
        arrow: true,
        enterDelay: 400,
      },
      styleOverrides: {
        tooltip: {
          backgroundColor: SERVER_THEME_TOKENS.surface.overlay,
          border: `1px solid ${SERVER_THEME_TOKENS.border.standard}`,
          borderRadius: 6,
          boxShadow: SERVER_THEME_TOKENS.shadow.medium,
          fontSize: "0.8125rem",
          fontWeight: 500,
          padding: "6px 10px",
        },
        arrow: {
          color: SERVER_THEME_TOKENS.surface.overlay,
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: SERVER_THEME_TOKENS.surface.raised,
        },
        wave: {
          "&::after": {
            background: `linear-gradient(90deg, transparent, ${SERVER_THEME_TOKENS.surface.overlay}, transparent)`,
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: "background-color 0.15s ease-in-out",
          "&:hover": {
            backgroundColor: SERVER_THEME_TOKENS.surface.raised,
          },
          "&.Mui-selected": {
            backgroundColor: SERVER_THEME_TOKENS.surface.selected,
            "&:hover": {
              backgroundColor: SERVER_THEME_TOKENS.surface.selectedHover,
            },
          },
          "&:focus-visible": {
            boxShadow: SERVER_THEME_TOKENS.focus.ring,
          },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: "2px 4px",
          padding: "8px 12px",
          transition: "background-color 0.15s ease-in-out",
          "&:hover": {
            backgroundColor: SERVER_THEME_TOKENS.surface.raised,
          },
          "&.Mui-selected": {
            backgroundColor: SERVER_THEME_TOKENS.surface.selected,
            "&:hover": {
              backgroundColor: SERVER_THEME_TOKENS.surface.selectedHover,
            },
          },
          "&:focus-visible": {
            boxShadow: SERVER_THEME_TOKENS.focus.ring,
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          borderRadius: 8,
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          "&:before": { display: "none" },
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          "&:focus-visible": {
            boxShadow: `${SERVER_THEME_TOKENS.focus.ring}, ${SERVER_THEME_TOKENS.shadow.medium}`,
          },
        },
      },
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Note 5: Some browser extensions like Dark Reader inject CSS custom
    // properties (e.g. `--darkreader-bg-...`) and `data-darkreader-inline-*`
    // attributes onto DOM elements. These can conflict with MUI's own inline
    // styles and trigger hydration diffs, so the cleanup removes only those
    // extension-owned markers without rewriting untouched app styles.
    const removeDarkReaderVars = () => {
      document.querySelectorAll("*").forEach((el) => {
        Array.from(el.attributes).forEach((attr) => {
          if (attr.name.startsWith("data-darkreader-inline-")) {
            el.removeAttribute(attr.name);
          }
        });

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
  const normalizedPathname = normalizeAppPathname(pathname);
  const pageTitle =
    getPageTitleEntryByPathname(normalizedPathname)?.title ?? APP_NAME;

  useEffect(() => {
    document.title = pageTitle;

    const analyticsWindow = window as AnalyticsWindow;
    const runtimeConfig =
      analyticsWindow.__PB_ANALYTICS__ ??
      buildGoogleAnalyticsRuntimeConfig(window.location.hostname);

    if (!runtimeConfig.enabled || !runtimeConfig.measurementId) return;

    const pageViewPayload = buildGoogleAnalyticsPageViewPayload(
      normalizedPathname,
      pageTitle,
      window.location.href,
    );

    // Note 9: The layout bootstrap sends the first page_view explicitly and
    // records the path it just reported. Re-checking that path here avoids
    // duplicate hits when App Router hydration finishes on the same route.
    if (
      analyticsWindow.__PB_LAST_TRACKED_PAGE_PATH__ ===
      pageViewPayload.page_path
    ) {
      return;
    }

    // Note 10: Auth redirects can finish before the afterInteractive GA bootstrap
    // has completed its first `gtag("config")` call. Queueing the most recent
    // page_view lets the bootstrap flush it after GA is fully ready so the first
    // authenticated destination (usually `/reports`) is not lost.
    if (!analyticsWindow.__PB_ANALYTICS_READY__ || !analyticsWindow.gtag) {
      analyticsWindow.__PB_PENDING_PAGE_VIEW__ = pageViewPayload;
      return;
    }

    analyticsWindow.gtag("event", "page_view", pageViewPayload);
    analyticsWindow.__PB_LAST_TRACKED_PAGE_PATH__ = pageViewPayload.page_path;
  }, [normalizedPathname, pageTitle]);

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
