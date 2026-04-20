// Note 1: "use client" makes AppNav a Client Component because it uses
// client-only hooks and browser APIs (localStorage/sessionStorage, storage events, and an
// interactive hover/click menu).
"use client";

import React, { useEffect, useState } from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
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
  AUTHENTICATED_PAGE_TITLE_KEYS,
  PAGE_TITLE_KEYS,
  PUBLIC_INFO_PAGE_TITLE_KEYS,
  ROUTE_PATHS,
  getPageTitleEntry,
  normalizeAppPathname,
} from "@/lib/content/page-titles";

type InfoPageKey = (typeof PUBLIC_INFO_PAGE_TITLE_KEYS)[number];
type AuthPageKey = Extract<
  (typeof AUTHENTICATED_PAGE_TITLE_KEYS)[number],
  | typeof PAGE_TITLE_KEYS.REPORTS
  | typeof PAGE_TITLE_KEYS.PROGRESS
  | typeof PAGE_TITLE_KEYS.SANKEY
  | typeof PAGE_TITLE_KEYS.FIRE
>;

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

const AUTH_TAB_PAGE_KEYS = [
  PAGE_TITLE_KEYS.REPORTS,
  PAGE_TITLE_KEYS.PROGRESS,
  PAGE_TITLE_KEYS.SANKEY,
  PAGE_TITLE_KEYS.FIRE,
] as const satisfies readonly AuthPageKey[];

const AUTH_TAB_LABELS: Record<AuthPageKey, string> = {
  [PAGE_TITLE_KEYS.REPORTS]: "Reports",
  [PAGE_TITLE_KEYS.PROGRESS]: "Progress",
  [PAGE_TITLE_KEYS.SANKEY]: "Budget",
  [PAGE_TITLE_KEYS.FIRE]: "FIRE",
};

const AUTH_TABS = AUTH_TAB_PAGE_KEYS.map((pageKey) => {
  const page = getPageTitleEntry(pageKey);
  return {
    key: pageKey,
    label: AUTH_TAB_LABELS[pageKey],
    value: pageKey,
    href: page.route,
  };
});

const MOBILE_DRAWER_WIDTH = 320;

const mobileNavItemSx = {
  borderRadius: 2,
  px: 1.5,
  py: 0.75,
  "&.Mui-selected": {
    bgcolor: "rgba(45, 125, 210, 0.16)",
  },
  "&.Mui-selected:hover": {
    bgcolor: "rgba(45, 125, 210, 0.24)",
  },
} as const;

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
  const pathname = normalizeAppPathname(usePathname());
  const value: AuthPageKey | false =
    AUTH_TABS.find((tab) => isRouteSelected(pathname, tab.href))?.value ??
    false;
  const isInfoRoute = INFO_MENU_ITEMS.some(({ href }) =>
    isRouteSelected(pathname, href),
  );

  // Note 4: Client-side auth detection uses browser storage so real auth can
  // survive browser restarts while demo sessions remain tab-scoped.
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [infoMenuAnchorEl, setInfoMenuAnchorEl] =
    useState<HTMLButtonElement | null>(null);
  // Note 4.1: Hover should reveal the menu without yanking focus away from the
  // current element, so only explicit keyboard-triggered opens move focus into
  // the menu list for arrow-key navigation.
  const [shouldAutoFocusInfoMenu, setShouldAutoFocusInfoMenu] =
    useState<boolean>(false);
  const isInfoMenuOpen = Boolean(infoMenuAnchorEl);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

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

  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [pathname, loggedIn]);

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
      sx={{
        borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
        bgcolor: "background.default",
      }}
    >
      <Toolbar sx={{ gap: 1 }}>
        <Typography
          variant="h6"
          sx={{
            mr: { md: 4 },
            flexGrow: { xs: 1, md: 0 },
            fontWeight: 700,
            textDecoration: "none",
            color: "inherit",
            "&:hover, &:focus": {
              cursor: "pointer",
              textDecoration: "none",
              color: "primary.main",
            },
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
          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "block" } }}>
            <Tabs value={value} textColor="inherit" indicatorColor="primary">
              {AUTH_TABS.map((tab) => (
                <Tab
                  key={tab.key}
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
        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            gap: 1,
          }}
        >
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
                variant="contained"
              >
                Register
              </Button>
            </Box>
          )}
        </Box>

        <IconButton
          color="inherit"
          aria-label="Open navigation menu"
          edge="end"
          onClick={() => setMobileDrawerOpen(true)}
          sx={{ display: { xs: "inline-flex", md: "none" } }}
        >
          <MenuRoundedIcon />
        </IconButton>

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
                mt: 1,
                minWidth: 160,
                border: "1px solid rgba(255, 255, 255, 0.08)",
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

        <Drawer
          anchor="right"
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          ModalProps={{ keepMounted: true }}
          slotProps={{
            paper: {
              sx: {
                width: {
                  xs: `min(${MOBILE_DRAWER_WIDTH}px, 100vw)`,
                  sm: MOBILE_DRAWER_WIDTH,
                },
                bgcolor: "background.paper",
                backgroundImage: "none",
                borderLeft: "1px solid rgba(255, 255, 255, 0.06)",
              },
            },
          }}
        >
          <Box
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                px: 2,
                py: 1.5,
                borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <Typography
                variant="subtitle1"
                component={NextLink}
                href={ROUTE_PATHS.home}
                onClick={() => setMobileDrawerOpen(false)}
                sx={{
                  fontWeight: 700,
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                🥣 Porridge Budget
              </Typography>

              <IconButton
                color="inherit"
                aria-label="Close navigation menu"
                onClick={() => setMobileDrawerOpen(false)}
              >
                <CloseRoundedIcon />
              </IconButton>
            </Box>

            <Box sx={{ flexGrow: 1, overflowY: "auto", px: 1.5, py: 2 }}>
              {loggedIn ? (
                <Box sx={{ mb: 2.5 }}>
                  <Typography
                    variant="overline"
                    sx={{
                      px: 1.5,
                      color: "text.secondary",
                      letterSpacing: 0.8,
                    }}
                  >
                    Workspace
                  </Typography>
                  <List disablePadding sx={{ mt: 0.5 }}>
                    {AUTH_TABS.map((tab) => {
                      const isSelected = isRouteSelected(pathname, tab.href);
                      return (
                        <ListItemButton
                          key={tab.key}
                          component={NextLink}
                          href={tab.href}
                          onClick={() => setMobileDrawerOpen(false)}
                          selected={isSelected}
                          sx={mobileNavItemSx}
                        >
                          <ListItemText
                            primary={tab.label}
                            primaryTypographyProps={{ fontWeight: 600 }}
                          />
                        </ListItemButton>
                      );
                    })}
                  </List>
                </Box>
              ) : null}

              <Box>
                <Typography
                  variant="overline"
                  sx={{ px: 1.5, color: "text.secondary", letterSpacing: 0.8 }}
                >
                  Info
                </Typography>
                <List disablePadding sx={{ mt: 0.5 }}>
                  {INFO_MENU_ITEMS.map((item) => {
                    const isSelected = isRouteSelected(pathname, item.href);
                    return (
                      <ListItemButton
                        key={item.key}
                        component={NextLink}
                        href={item.href}
                        onClick={() => setMobileDrawerOpen(false)}
                        selected={isSelected}
                        sx={mobileNavItemSx}
                      >
                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{ fontWeight: 600 }}
                        />
                      </ListItemButton>
                    );
                  })}
                </List>
              </Box>
            </Box>

            <Box
              sx={{
                p: 2,
                borderTop: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              {loggedIn ? (
                <Button
                  component={NextLink}
                  href={ROUTE_PATHS.signout}
                  variant="outlined"
                  color="inherit"
                  fullWidth
                  onClick={() => setMobileDrawerOpen(false)}
                >
                  Sign out
                </Button>
              ) : (
                <Box sx={{ display: "grid", gap: 1 }}>
                  <Button
                    component={NextLink}
                    href={ROUTE_PATHS.login}
                    color="inherit"
                    fullWidth
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    Sign in
                  </Button>
                  <Button
                    component={NextLink}
                    href={ROUTE_PATHS.register}
                    variant="contained"
                    fullWidth
                    onClick={() => setMobileDrawerOpen(false)}
                  >
                    Register
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        </Drawer>
      </Toolbar>
    </AppBar>
  );
}
