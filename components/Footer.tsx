"use client";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { FOOTER_CONTENT, FOOTER_PUBLIC_LINKS } from "@/lib/content/footer";
import { ROUTE_PATHS } from "@/lib/content/page-titles";
import { SERVER_THEME_TOKENS } from "@/lib/theme/server-theme-tokens";

export function Footer() {
  const links = FOOTER_PUBLIC_LINKS.filter(
    (link) => link.href === ROUTE_PATHS.about || link.href === ROUTE_PATHS.faq,
  );

  return (
    <Box
      component="footer"
      sx={{
        mt: "auto",
        bgcolor: "background.paper",
        borderTop: `1px solid ${SERVER_THEME_TOKENS.border.subtle}`,
      }}
    >
      <Container maxWidth="xl" sx={{ py: 1 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          useFlexGap
          spacing={2}
        >
          <Stack
            component="nav"
            aria-label="Footer navigation"
            direction="row"
            spacing={2}
            divider={<Divider orientation="vertical" flexItem />}
          >
            <Link
              component={NextLink}
              href={ROUTE_PATHS.home}
              aria-label="Porridge Budget home"
              sx={{ display: "flex", alignItems: "center" }}
            >
              <BrandMark size={24} />
            </Link>
            {links.map((link) => (
              <Link
                key={link.href}
                component={NextLink}
                href={link.href}
                color="text.secondary"
                underline="none"
                sx={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  "&:hover": { color: "primary.main" },
                }}
              >
                {link.label}
              </Link>
            ))}
          </Stack>
          <Stack
            component="nav"
            aria-label="Social links"
            direction="row"
            flexWrap="wrap"
            useFlexGap
            spacing={2}
          >
            {FOOTER_CONTENT.socialLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                color="text.secondary"
                underline="none"
                sx={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  "&:hover": { color: "primary.main" },
                }}
              >
                {link.label}
              </Link>
            ))}
          </Stack>
        </Stack>
        <Typography
          variant="caption"
          color="text.disabled"
          align="center"
          display="block"
          sx={{ mt: 0.5 }}
        >
          © {new Date().getFullYear()} {FOOTER_CONTENT.copyrightOwner}
        </Typography>
      </Container>
    </Box>
  );
}
