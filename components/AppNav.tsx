"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { BrandMark } from "@/components/BrandMark";
import { AppearanceMenu } from "@/components/AppearanceMenu";
import { FOOTER_PUBLIC_LINKS } from "@/lib/content/footer";
import { SERVER_THEME_TOKENS as tokens } from "@/lib/theme/server-theme-tokens";

const workspace = [
  ["Reports", "/reports"],
  ["Budget", "/budget"],
  ["Progress", "/progress"],
  ["Salary History", "/salary"],
  ["FIRE", "/fire"],
] as const;
const information = [
  ["About", "/about"],
  ["FAQ", "/faq"],
] as const;

export function AppNav({ loggedIn }: { loggedIn: boolean }) {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (!loggedIn) {
    return (
      <Box
        component="header"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
          px: { xs: 2, md: 3 },
          py: 1.5,
          borderBottom: `1px solid ${tokens.border.subtle}`,
          bgcolor: tokens.surface.card,
        }}
      >
        <Box
          component={Link}
          href="/"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            color: "text.primary",
            textDecoration: "none",
            fontFamily: "Georgia, serif",
            fontWeight: 700,
          }}
        >
          <BrandMark />
          Porridge Budget
        </Box>
        <Box
          component="nav"
          aria-label="Main navigation"
          sx={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: { xs: 1.5, sm: 2.5 },
            fontSize: 14,
            "& a": {
              color: "text.secondary",
              textDecoration: "none",
              "&:hover": { color: "primary.main" },
              "&:focus-visible": {
                outline: `3px solid ${tokens.border.focus}`,
                outlineOffset: 2,
              },
            },
          }}
        >
          {FOOTER_PUBLIC_LINKS.filter(({ href }) => href !== "/").map(
            ({ label, href }) => (
              <Link
                key={href}
                href={href}
                aria-current={pathname === href ? "page" : undefined}
              >
                {label}
              </Link>
            ),
          )}
          <Link href="/auth/login">Sign in</Link>
          <AppearanceMenu />
        </Box>
      </Box>
    );
  }

  const navigation = (mobile = false) => (
    <Box
      component="nav"
      aria-label="Main navigation"
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        p: 2,
        bgcolor: tokens.surface.card,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Box
          component={Link}
          href="/"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            color: "text.primary",
            textDecoration: "none",
            fontFamily: "Georgia, serif",
            fontWeight: 700,
            fontSize: 18,
          }}
        >
          <BrandMark size={36} />
          Porridge Budget
        </Box>
        {mobile && (
          <IconButton
            aria-label="Close navigation menu"
            onClick={() => setOpen(false)}
          >
            <CloseRoundedIcon />
          </IconButton>
        )}
      </Box>
      <Box sx={{ flex: 1, overflowY: "auto" }}>
        {loggedIn && (
          <NavGroup label="Workspace" items={workspace} pathname={pathname} />
        )}
        <NavGroup label="Information" items={information} pathname={pathname} />
      </Box>
      <Box
        sx={{
          borderTop: `1px solid ${tokens.border.subtle}`,
          pt: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Button
          component={Link}
          href="/auth/signout"
          variant="outlined"
          size="small"
          sx={{ textTransform: "none" }}
        >
          Sign Out
        </Button>
        <AppearanceMenu />
      </Box>
    </Box>
  );
  return (
    <>
      <Box
        sx={{
          display: { xs: "none", lg: "block" },
          width: 248,
          flexShrink: 0,
          position: "fixed",
          inset: "0 auto 0 0",
          borderRight: `1px solid ${tokens.border.subtle}`,
          zIndex: 10,
        }}
      >
        {navigation()}
      </Box>
      <Box
        sx={{
          display: { xs: "flex", lg: "none" },
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          minHeight: 64,
          borderBottom: `1px solid ${tokens.border.subtle}`,
          bgcolor: tokens.surface.card,
        }}
      >
        <Box
          component={Link}
          href="/"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            color: "text.primary",
            textDecoration: "none",
            fontFamily: "Georgia, serif",
            fontWeight: 700,
          }}
        >
          <BrandMark />
          Porridge Budget
        </Box>
        <IconButton
          aria-label="Open navigation menu"
          onClick={() => setOpen(true)}
        >
          <MenuRoundedIcon />
        </IconButton>
      </Box>
      <Drawer
        anchor="left"
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{ paper: { sx: { width: "min(320px, 100vw)" } } }}
      >
        {navigation(true)}
      </Drawer>
    </>
  );
}

function NavGroup({
  label,
  items,
  pathname,
}: {
  label: string;
  items: readonly (readonly [string, string])[];
  pathname: string;
}) {
  return (
    <Box sx={{ mb: 3 }}>
      <Box
        sx={{
          px: 1.5,
          mb: 1,
          color: "text.secondary",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: ".13em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </Box>
      {items.map(([name, href]) => {
        const selected =
          pathname === href ||
          (href !== "/" && pathname.startsWith(`${href}/`));
        return (
          <Box
            key={href}
            component={Link}
            href={href}
            aria-current={selected ? "page" : undefined}
            sx={{
              display: "flex",
              alignItems: "center",
              minHeight: 42,
              px: 1.5,
              mb: 0.25,
              borderRadius: 1,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: selected ? 700 : 500,
              color: selected ? "primary.main" : "text.secondary",
              bgcolor: selected ? tokens.surface.selected : "transparent",
              "&:hover": {
                bgcolor: tokens.surface.raised,
                color: "text.primary",
              },
              "&:focus-visible": {
                outline: `3px solid ${tokens.border.focus}`,
                outlineOffset: 2,
              },
            }}
          >
            {name}
          </Box>
        );
      })}
    </Box>
  );
}
