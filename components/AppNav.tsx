"use client";

import React, { useEffect, useState } from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
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
import { SERVER_THEME_TOKENS } from "@/lib/theme/server-theme-tokens";

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
};

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

const SALARY_NAV_ITEM = {
  key: PAGE_TITLE_KEYS.SALARY,
  label: "Salary History",
  href: getPageTitleEntry(PAGE_TITLE_KEYS.SALARY).route,
};

const MOBILE_DRAWER_WIDTH = 320;

const mobileNavItemSx = {
  borderRadius: 2,
  px: 1.5,
  py: 0.875,
  "&.Mui-selected": {
    bgcolor: SERVER_THEME_TOKENS.surface.selected,
    color: "primary.light",
  },
  "&.Mui-selected:hover": {
    bgcolor: SERVER_THEME_TOKENS.surface.selectedHover,
  },
} as const;

function isRouteSelected(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNav() {
  const pathname = normalizeAppPathname(usePathname());
  const value: AuthPageKey | false =
    AUTH_TABS.find((tab) => isRouteSelected(pathname, tab.href))?.value ??
    false;
  const isInfoRoute = INFO_MENU_ITEMS.some(({ href }) =>
    isRouteSelected(pathname, href),
  );

  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [infoMenuAnchorEl, setInfoMenuAnchorEl] =
    useState<HTMLButtonElement | null>(null);

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
    <AppBar
      position="static"
      elevation={0}
      sx={{ bgcolor: "background.default" }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 }, py: 0 }}>
        <Toolbar sx={{ gap: 1, minHeight: { xs: 56, sm: 64 } }}>
          <Typography
            variant="subtitle1"
            component={NextLink}
            href={ROUTE_PATHS.home}
            aria-label="Porridge Budget home"
            sx={{
              mr: { lg: 3 },
              flexGrow: { xs: 1, lg: 0 },
              fontWeight: 700,
              fontSize: "1rem",
              textDecoration: "none",
              color: "text.primary",
              letterSpacing: "-0.01em",
              transition: "color 0.15s ease-in-out",
              "&:hover": { color: "primary.light" },
            }}
          >
            🥣 Porridge Budget
          </Typography>
          {loggedIn ? (
            <Box sx={{ flexGrow: 1, display: { xs: "none", lg: "block" } }}>
              <Tabs
                value={value}
                textColor="inherit"
                indicatorColor="primary"
                sx={{ "& .MuiTab-root": { px: 2, py: 2 } }}
              >
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
          <Box
            sx={{
              display: { xs: "none", lg: "flex" },
              alignItems: "center",
              gap: 0.5,
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
                    fontSize: "1.1rem",
                    transition: "transform 150ms ease",
                    transform: isInfoMenuOpen
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
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
                fontWeight: 500,
                color:
                  isInfoMenuOpen || isInfoRoute
                    ? "primary.light"
                    : "text.secondary",
                "&:hover": { color: "text.primary" },
              }}
            >
              Info
            </Button>
            <Divider
              orientation="vertical"
              flexItem
              sx={{
                mx: 0.5,
                my: 1.5,
                borderColor: SERVER_THEME_TOKENS.border.subtle,
              }}
            />
            {loggedIn ? (
              <Button
                component={NextLink}
                href={ROUTE_PATHS.signout}
                size="small"
                sx={{
                  color: "text.secondary",
                  fontWeight: 500,
                  "&:hover": { color: "text.primary" },
                }}
              >
                Sign out
              </Button>
            ) : (
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Button
                  component={NextLink}
                  href={ROUTE_PATHS.login}
                  size="small"
                  sx={{
                    color: "text.secondary",
                    fontWeight: 500,
                    "&:hover": { color: "text.primary" },
                  }}
                >
                  Sign in
                </Button>
                <Button
                  component={NextLink}
                  href={ROUTE_PATHS.register}
                  variant="contained"
                  size="small"
                >
                  Get started
                </Button>
              </Box>
            )}
          </Box>
          <IconButton
            color="inherit"
            aria-label="Open navigation menu"
            edge="end"
            onClick={() => setMobileDrawerOpen(true)}
            sx={{ display: { xs: "inline-flex", lg: "none" } }}
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
              dense: true,
            }}
            slotProps={{
              paper: {
                elevation: 2,
                sx: {
                  mt: 1,
                  minWidth: 176,
                  py: 0.5,
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
                >
                  <Typography variant="body2" fontWeight={600}>
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
                  bgcolor: "background.default",
                  backgroundImage: "none",
                  borderLeft: `1px solid ${SERVER_THEME_TOKENS.border.subtle}`,
                },
              },
            }}
          >
            <Box
              sx={{ height: "100%", display: "flex", flexDirection: "column" }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                  px: 2,
                  py: 1.5,
                  borderBottom: `1px solid ${SERVER_THEME_TOKENS.border.subtle}`,
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
                    color: "text.primary",
                  }}
                >
                  🥣 Porridge Budget
                </Typography>
                <IconButton
                  color="inherit"
                  aria-label="Close navigation menu"
                  onClick={() => setMobileDrawerOpen(false)}
                  size="small"
                >
                  <CloseRoundedIcon />
                </IconButton>
              </Box>
              <Box sx={{ flexGrow: 1, overflowY: "auto", px: 1.5, py: 2 }}>
                {loggedIn ? (
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="overline"
                      sx={{
                        px: 1.5,
                        color: "text.disabled",
                        letterSpacing: "0.08em",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                      }}
                    >
                      Workspace
                    </Typography>
                    <List disablePadding sx={{ mt: 0.5 }}>
                      {AUTH_TABS.map((tab) => (
                        <ListItemButton
                          key={tab.key}
                          component={NextLink}
                          href={tab.href}
                          onClick={() => setMobileDrawerOpen(false)}
                          selected={isRouteSelected(pathname, tab.href)}
                          sx={mobileNavItemSx}
                        >
                          <ListItemText
                            primary={tab.label}
                            primaryTypographyProps={{
                              fontWeight: 600,
                              variant: "body2",
                            }}
                          />
                        </ListItemButton>
                      ))}
                      <ListItemButton
                        component={NextLink}
                        href={SALARY_NAV_ITEM.href}
                        onClick={() => setMobileDrawerOpen(false)}
                        selected={isRouteSelected(
                          pathname,
                          SALARY_NAV_ITEM.href,
                        )}
                        sx={mobileNavItemSx}
                      >
                        <ListItemText
                          primary={SALARY_NAV_ITEM.label}
                          primaryTypographyProps={{
                            fontWeight: 600,
                            variant: "body2",
                          }}
                        />
                      </ListItemButton>
                    </List>
                  </Box>
                ) : null}
                <Box>
                  <Typography
                    variant="overline"
                    sx={{
                      px: 1.5,
                      color: "text.disabled",
                      letterSpacing: "0.08em",
                      fontSize: "0.7rem",
                      fontWeight: 600,
                    }}
                  >
                    Info
                  </Typography>
                  <List disablePadding sx={{ mt: 0.5 }}>
                    {INFO_MENU_ITEMS.map((item) => (
                      <ListItemButton
                        key={item.key}
                        component={NextLink}
                        href={item.href}
                        onClick={() => setMobileDrawerOpen(false)}
                        selected={isRouteSelected(pathname, item.href)}
                        sx={mobileNavItemSx}
                      >
                        <ListItemText
                          primary={item.label}
                          primaryTypographyProps={{
                            fontWeight: 600,
                            variant: "body2",
                          }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Box>
              </Box>
              <Box
                sx={{
                  p: 2,
                  borderTop: `1px solid ${SERVER_THEME_TOKENS.border.subtle}`,
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
                    sx={{ borderColor: SERVER_THEME_TOKENS.border.strong }}
                  >
                    Sign out
                  </Button>
                ) : (
                  <Box sx={{ display: "grid", gap: 1.5 }}>
                    <Button
                      component={NextLink}
                      href={ROUTE_PATHS.register}
                      variant="contained"
                      fullWidth
                      onClick={() => setMobileDrawerOpen(false)}
                    >
                      Get started
                    </Button>
                    <Button
                      component={NextLink}
                      href={ROUTE_PATHS.login}
                      variant="outlined"
                      color="inherit"
                      fullWidth
                      onClick={() => setMobileDrawerOpen(false)}
                      sx={{ borderColor: SERVER_THEME_TOKENS.border.standard }}
                    >
                      Sign in
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>
          </Drawer>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
