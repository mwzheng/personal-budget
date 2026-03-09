// Note 1: "use client" makes AppNav a Client Component because it uses
// client-only hooks and browser APIs (sessionStorage and storage events).
"use client";

import React, { useEffect, useState } from "react";
import AppBar from "@mui/material/AppBar";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import NextLink from "next/link";
import { usePathname } from "next/navigation";

import { AUTH_CHANGED_EVENT, isAuthenticated } from "@/lib/cognitoClient";

export function AppNav() {
  // Note 2: `usePathname` returns the current URL path (e.g. "/sankey" or "/reports").
  // It is used here to highlight the active tab. The `.startsWith` check means
  // all sub-routes under /sankey (e.g. /sankey/preview) keep that tab highlighted.
  const pathname = usePathname();
  const value: string | false = pathname.startsWith("/sankey")
    ? "sankey"
    : pathname.startsWith("/reports")
      ? "reports"
      : false;

  // Note 3: Client-side auth detection uses sessionStorage so state is scoped to
  // the browser tab and can be observed via storage events in other tabs.
  const [loggedIn, setLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    const checkToken = () => setLoggedIn(isAuthenticated());

    checkToken();

    const onStorage = () => checkToken();
    const onAuthChanged = () => checkToken();

    window.addEventListener("storage", onStorage);
    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    };
  }, [pathname]);

  return (
    // Note 4: `elevation={0}` removes the default MUI shadow from the AppBar.
    // The border is added manually via `sx` to create a clean separation line
    // without a blurry shadow that could look heavy on a dark background.
    <AppBar
      position="static"
      elevation={0}
      sx={{ borderBottom: "1px solid #333", bgcolor: "#1a1a1a" }}
    >
      <Toolbar>
        <Typography
          variant="h6"
          sx={{
            mr: 4,
            fontWeight: 700,
            textDecoration: "none",
            color: "inherit",
            "&:hover, &:focus": { cursor: "pointer", textDecoration: "none" },
          }}
          component={NextLink}
          href="/"
          aria-label="Personal Budget home"
        >
          💰 Personal Budget
        </Typography>

        {/* Tabs are allowed to grow, pushing auth buttons to the right */}
        <Box sx={{ flexGrow: 1 }}>
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
        </Box>

        {/* Auth buttons: show Sign out when logged in, otherwise Sign in and Register */}
        {loggedIn ? (
          <Button component={NextLink} href="/auth/signout" color="inherit">
            Sign out
          </Button>
        ) : (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button component={NextLink} href="/auth/login" color="inherit">
              Sign in
            </Button>
            <Button component={NextLink} href="/auth/register" color="inherit">
              Register
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
