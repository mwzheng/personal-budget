"use client";

import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFnsV3";
import { ReactNode, useEffect } from "react";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
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
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    const removeDarkReaderVars = () => {
      document.querySelectorAll("[style]").forEach((el) => {
        const style = el.getAttribute("style");
        if (!style) return;
        const cleaned = style
          .split(";")
          .map((s) => s.trim())
          .filter((s) => s && !s.includes("--darkreader-"))
          .join("; ");
        if (cleaned !== style) el.setAttribute("style", cleaned);
      });
    };
    removeDarkReaderVars();
    const t = setTimeout(removeDarkReaderVars, 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <ThemeProvider theme={darkTheme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <CssBaseline />
        {children}
      </LocalizationProvider>
    </ThemeProvider>
  );
}
