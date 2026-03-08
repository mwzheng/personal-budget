// Note 1: `"use client"` makes AppNav a Client Component because it uses
// `usePathname` -- a Next.js hook that reads the current URL from the router.
// Hooks like `usePathname` can only run in the browser where a Router context exists.
"use client";

import AppBar from "@mui/material/AppBar";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { usePathname } from "next/navigation";

export function AppNav() {
  // Note 2: `usePathname` returns the current URL path (e.g. "/sankey" or "/reports").
  // It is used here to highlight the active tab. The `.startsWith` check means
  // all sub-routes under /sankey (e.g. /sankey/preview) keep that tab highlighted.
  const pathname = usePathname();
  const value = pathname.startsWith("/sankey") ? "sankey" : "reports";

  return (
    // Note 3: `elevation={0}` removes the default MUI shadow from the AppBar.
    // The border is added manually via `sx` to create a clean separation line
    // without a blurry shadow that could look heavy on a dark background.
    <AppBar
      position="static"
      elevation={0}
      sx={{ borderBottom: "1px solid #333", bgcolor: "#1a1a1a" }}
    >
      <Toolbar>
        <Typography variant="h6" sx={{ mr: 4, fontWeight: 700 }}>
          💰 Personal Budget
        </Typography>
        {/* Note 4: `component={NextLink}` replaces the Tab's default anchor
            element with Next.js's Link. This gives MUI Tab the accessible
            keyboard navigation and active-indicator behavior while still
            performing a client-side navigation (no full-page reload). */}
        <Tabs value={value} textColor="inherit" indicatorColor="primary">
          <Tab
            label="Reports"
            value="reports"
            component={NextLink}
            href="/reports"
          />
          <Tab
            label="Budget Generator"
            value="sankey"
            component={NextLink}
            href="/sankey"
          />
        </Tabs>
      </Toolbar>
    </AppBar>
  );
}
