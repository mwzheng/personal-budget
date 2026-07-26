"use client";

import GitHubIcon from "@mui/icons-material/GitHub";
import LaunchIcon from "@mui/icons-material/Launch";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { useEffect, useState } from "react";

import { isAuthenticated } from "@/lib/auth/cognitoClient";
import { FOOTER_CONTENT, FOOTER_PUBLIC_LINKS } from "@/lib/content/footer";
import { SERVER_THEME_TOKENS } from "@/lib/theme/server-theme-tokens";
import type {
  FooterLinkGroup,
  LinkDefinition,
  SocialLink,
} from "@/lib/types/content";

const SOCIAL_ICON_BY_PLATFORM = {
  linkedin: LinkedInIcon,
  github: GitHubIcon,
  projectGithub: GitHubIcon,
} as const satisfies Record<SocialLink["platform"], typeof GitHubIcon>;

function FooterNavigationLink({ link }: { link: LinkDefinition }) {
  if (link.external) {
    return (
      <Link
        href={link.href}
        target="_blank"
        rel="noreferrer"
        underline="none"
        color="text.secondary"
        sx={{
          alignItems: "center",
          display: "inline-flex",
          fontWeight: 500,
          fontSize: "0.875rem",
          gap: 0.5,
          width: "fit-content",
          transition: "color 0.15s ease-in-out",
          "&:hover": { color: "primary.main" },
        }}
      >
        {link.label}
        <LaunchIcon sx={{ fontSize: 13 }} aria-hidden="true" />
      </Link>
    );
  }

  return (
    <Link
      component={NextLink}
      href={link.href}
      underline="none"
      color="text.secondary"
      sx={{
        fontWeight: 500,
        fontSize: "0.875rem",
        width: "fit-content",
        transition: "color 0.15s ease-in-out",
        "&:hover": { color: "primary.main" },
      }}
    >
      {link.label}
    </Link>
  );
}

function FooterNavigationGroup({ group }: { group: FooterLinkGroup }) {
  const groupHeadingId = `footer-group-${group.title
    .toLowerCase()
    .replace(/\s+/g, "-")}`;

  return (
    <Stack component="section" spacing={1} aria-labelledby={groupHeadingId}>
      <Typography
        id={groupHeadingId}
        variant="overline"
        color="text.disabled"
        sx={{ letterSpacing: "0.08em", fontSize: "0.7rem", fontWeight: 600 }}
      >
        {group.title}
      </Typography>
      <Stack component="ul" spacing={1} sx={{ listStyle: "none", m: 0, p: 0 }}>
        {group.links.map((link) => (
          <Box component="li" key={`${group.title}-${link.label}`}>
            <FooterNavigationLink link={link} />
          </Box>
        ))}
      </Stack>
    </Stack>
  );
}

function FooterSocialGroup({
  socialLinks,
}: {
  socialLinks: readonly SocialLink[];
}) {
  return (
    <Stack component="section" spacing={1} aria-labelledby="footer-social">
      <Typography
        id="footer-social"
        variant="overline"
        color="text.disabled"
        sx={{ letterSpacing: "0.08em", fontSize: "0.7rem", fontWeight: 600 }}
      >
        Social
      </Typography>
      <Stack
        component="ul"
        direction="column"
        spacing={1.5}
        useFlexGap
        flexWrap="wrap"
        sx={{ listStyle: "none", m: 0, p: 0 }}
      >
        {socialLinks.map((link) => {
          const Icon = SOCIAL_ICON_BY_PLATFORM[link.platform];

          return (
            <Box component="li" key={link.label}>
              <Link
                href={link.href}
                target="_blank"
                rel="noreferrer"
                underline="none"
                color="text.secondary"
                sx={{
                  alignItems: "center",
                  display: "inline-flex",
                  gap: 0.75,
                  fontSize: "0.875rem",
                  transition: "color 0.15s ease-in-out",
                  "&:hover": { color: "primary.main" },
                }}
              >
                <Icon sx={{ fontSize: 17 }} aria-hidden="true" />
                <Typography component="span" variant="body2" fontWeight={500}>
                  {link.label}
                </Typography>
                <LaunchIcon sx={{ fontSize: 13 }} aria-hidden="true" />
              </Link>
            </Box>
          );
        })}
      </Stack>
    </Stack>
  );
}

export function Footer() {
  const [loggedIn, setLoggedIn] = useState(false);
  const currentYear = new Date().getFullYear();
  const homeHref = FOOTER_PUBLIC_LINKS[0]?.href ?? "/";
  const { brandName, tagline, navigationGroups, socialLinks } = FOOTER_CONTENT;

  useEffect(() => {
    setLoggedIn(isAuthenticated());
  }, []);

  return (
    <Box
      component="footer"
      sx={{
        mt: "auto",
        bgcolor: "background.paper",
        borderTop: `1px solid ${SERVER_THEME_TOKENS.border.subtle}`,
      }}
    >
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
        <Box
          sx={{
            display: "grid",
            gap: { xs: 2, lg: 2 },
            gridTemplateColumns: {
              xs: "1fr",
              lg: "minmax(0, 1fr) minmax(0, 1.2fr)",
            },
          }}
        >
          <Stack spacing={0.75}>
            <Link
              component={NextLink}
              href={homeHref}
              color="inherit"
              underline="none"
              sx={{
                display: "inline-flex",
                width: "fit-content",
                transition: "color 0.15s ease-in-out",
                "&:hover": { color: "primary.light" },
              }}
            >
              <Typography variant="subtitle1" fontWeight={700}>
                🥣 {brandName}
              </Typography>
            </Link>
            {tagline ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ maxWidth: 280, lineHeight: 1.6 }}
              >
                {tagline}
              </Typography>
            ) : null}
          </Stack>
          <Box
            sx={{
              display: "grid",
              gap: { xs: 1.5, sm: 2 },
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(auto-fit, minmax(140px, 1fr))",
              },
            }}
          >
            {navigationGroups.map((group) => {
              if (group.title === "Account" && loggedIn) {
                return null;
              }

              return <FooterNavigationGroup key={group.title} group={group} />;
            })}
            <FooterSocialGroup socialLinks={socialLinks} />
          </Box>
        </Box>
        <Divider
          sx={{
            borderColor: SERVER_THEME_TOKENS.border.subtle,
            my: { xs: 2.5, md: 3 },
          }}
        />
        <Typography
          variant="caption"
          color="text.disabled"
          align="center"
          display="block"
        >
          © {currentYear} {brandName}
        </Typography>
      </Container>
    </Box>
  );
}
