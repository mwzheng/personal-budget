// Note 1: "use client" makes AppNav a Client Component because it uses
// client-only hooks and browser APIs (sessionStorage, storage events, and an
// interactive hover/click menu).
"use client";

import React, { useEffect, useState } from "react";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { usePathname } from "next/navigation";

import { AUTH_CHANGED_EVENT, isAuthenticated } from "@/lib/auth/cognitoClient";
import {
  PAGE_TITLE_KEYS,
  PUBLIC_INFO_PAGE_TITLE_KEYS,
  ROUTE_PATHS,
  getPageTitleEntry,
} from "@/lib/content/page-titles";

type InfoPageKey = (typeof PUBLIC_INFO_PAGE_TITLE_KEYS)[number];

const INFO_MENU_LABELS: Record<InfoPageKey, string> = {
  [PAGE_TITLE_KEYS.ABOUT]: "About",
  [PAGE_TITLE_KEYS.FAQ]: "FAQ",
  [PAGE_TITLE_KEYS.CONTACT]: "Contact",
};

// Note 1.1: The info menu points at the current public route set so
// signed-out visitors can move between About, FAQ, and Contact from one place.
const INFO_MENU_ITEMS = PUBLIC_INFO_PAGE_TITLE_KEYS.map((pageKey) => {
  const page = getPageTitleEntry(pageKey);
  return {
    key: pageKey,
    label: INFO_MENU_LABELS[pageKey],
    href: page.route,
  };
});

const AUTH_TABS = [
  { label: "Reports", value: "reports", href: ROUTE_PATHS.reports },
  { label: "Progress", value: "progress", href: ROUTE_PATHS.progress },
  { label: "Budget", value: "sankey", href: ROUTE_PATHS.sankey },
] as const;

function isRouteSelected(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Note 2: `AppNav` keeps authenticated workspace tabs and public info routes in
 * the same header so signed-out visitors can still reach About, FAQ, and
 * Contact without losing the existing signed-in workflow navigation.
 */
export function AppNav() {
  // Note 3: `usePathname` returns the current URL path (e.g. "/sankey" or "/reports").
  // The helper below treats nested routes like `/reports/monthly` as belonging
  // to the same top-level nav item, which keeps highlighting stable.
  const pathname = usePathname();
  const value: string | false = isRouteSelected(pathname, ROUTE_PATHS.sankey)
    ? "sankey"
    : isRouteSelected(pathname, ROUTE_PATHS.reports)
      ? "reports"
      : isRouteSelected(pathname, ROUTE_PATHS.progress)
        ? "progress"
        : false;
  const isInfoRoute = INFO_MENU_ITEMS.some(({ href }) =>
    isRouteSelected(pathname, href),
  );

  // Note 4: Client-side auth detection uses sessionStorage so state is scoped to
  // the browser tab and can be observed via storage events in other tabs.
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [infoMenuAnchorEl, setInfoMenuAnchorEl] =
    useState<HTMLButtonElement | null>(null);
  // Note 4.1: Hover should reveal the menu without yanking focus away from the
  // current element, so only explicit keyboard-triggered opens move focus into
  // the menu list for arrow-key navigation.
  const [shouldAutoFocusInfoMenu, setShouldAutoFocusInfoMenu] =
    useState<boolean>(false);
  const isInfoMenuOpen = Boolean(infoMenuAnchorEl);

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

  const openInfoMenu = (
    anchorEl: HTMLButtonElement,
    focusMenu: boolean = false,
  ) => {
    setShouldAutoFocusInfoMenu(focusMenu);
    setInfoMenuAnchorEl(anchorEl);
  };

  const closeInfoMenu = () => {
    setShouldAutoFocusInfoMenu(false);
    setInfoMenuAnchorEl(null);
  };

  return (
    // Note 6: `elevation={0}` removes the default MUI shadow from the AppBar.
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
          href={ROUTE_PATHS.home}
          aria-label="Porridge Budget home"
        >
          🥣 Porridge Budget
        </Typography>

        {/* Note 7: The in-app pages only make sense for authenticated or demo users,
            so signed-out visitors see a simpler header with just the brand and auth
            actions instead of tabs that would immediately redirect them to login. */}
        {loggedIn ? (
          <Box sx={{ flexGrow: 1 }}>
            <Tabs value={value} textColor="inherit" indicatorColor="primary">
              {AUTH_TABS.map((tab) => (
                <Tab
                  key={tab.value}
                  label={tab.label}
                  value={tab.value}
                  component={NextLink}
                  href={tab.href}
                />
              ))}
            </Tabs>
          </Box>
        ) : (
          <Box sx={{ flexGrow: 1 }} />
        )}

        {/* Note 8: `Info` stays visible for every visitor. Hover opens the menu
            for pointer users, while click and keyboard handlers keep it usable on
            touch devices and with assistive technology. */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Button
            id="app-nav-info-button"
            color="inherit"
            aria-controls={isInfoMenuOpen ? "app-nav-info-menu" : undefined}
            aria-expanded={isInfoMenuOpen ? "true" : undefined}
            aria-haspopup="menu"
            endIcon={
              <KeyboardArrowDownRoundedIcon
                sx={{
                  transition: "transform 150ms ease",
                  transform: isInfoMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            }
            onMouseEnter={(event) => openInfoMenu(event.currentTarget)}
            onClick={(event) => {
              if (isInfoMenuOpen) {
                closeInfoMenu();
                return;
              }

              openInfoMenu(event.currentTarget);
            }}
            onKeyDown={(event) => {
              if (
                event.key === "ArrowDown" ||
                event.key === "Enter" ||
                event.key === " "
              ) {
                event.preventDefault();
                openInfoMenu(event.currentTarget, true);
              }
            }}
            sx={{
              minWidth: 0,
              px: 1.5,
              color: isInfoMenuOpen || isInfoRoute ? "primary.main" : "inherit",
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            Info
          </Button>

          {/* Auth buttons: show Sign out when logged in, otherwise Sign in and Register */}
          {loggedIn ? (
            <Button
              component={NextLink}
              href={ROUTE_PATHS.signout}
              color="inherit"
            >
              Sign out
            </Button>
          ) : (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                component={NextLink}
                href={ROUTE_PATHS.login}
                color="inherit"
              >
                Sign in
              </Button>
              <Button
                component={NextLink}
                href={ROUTE_PATHS.register}
                color="inherit"
              >
                Register
              </Button>
            </Box>
          )}
        </Box>

        <Menu
          id="app-nav-info-menu"
          anchorEl={infoMenuAnchorEl}
          open={isInfoMenuOpen}
          autoFocus={shouldAutoFocusInfoMenu}
          disableAutoFocusItem={!shouldAutoFocusInfoMenu}
          keepMounted
          onClose={closeInfoMenu}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
          MenuListProps={{
            "aria-labelledby": "app-nav-info-button",
          }}
          slotProps={{
            paper: {
              sx: {
                mt: 0.5,
                minWidth: 160,
                border: "1px solid",
                borderColor: "rgba(255, 255, 255, 0.12)",
                bgcolor: "background.paper",
                backgroundImage: "none",
              },
            },
          }}
        >
          {INFO_MENU_ITEMS.map((item) => {
            const isSelected = isRouteSelected(pathname, item.href);
            return (
              <MenuItem
                key={item.key}
                component={NextLink}
                href={item.href}
                onClick={closeInfoMenu}
                selected={isSelected}
                sx={{
                  py: 1,
                  "&.Mui-selected": {
                    bgcolor: "rgba(45, 125, 210, 0.16)",
                  },
                  "&.Mui-selected:hover": {
                    bgcolor: "rgba(45, 125, 210, 0.24)",
                  },
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {item.label}
                </Typography>
              </MenuItem>
            );
          })}
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
