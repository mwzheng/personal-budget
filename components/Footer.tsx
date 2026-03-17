/**
 * Note 1: This footer is intentionally a Server Component because every string
 * comes from the content layer, so the shell can stay lightweight and render
 * the same way for signed-out users, crawlers, and future public pages.
 */

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

import { FOOTER_CONTENT, FOOTER_PUBLIC_LINKS } from "@/lib/content/footer";
import type {
  FooterLinkGroup,
  LinkDefinition,
  SocialLink,
} from "@/lib/types/content";

const SOCIAL_ICON_BY_PLATFORM = {
  github: GitHubIcon,
  linkedin: LinkedInIcon,
} as const satisfies Record<SocialLink["platform"], typeof GitHubIcon>;

function FooterNavigationLink({ link }: { link: LinkDefinition }) {
  if (link.external) {
    return (
      <Link
        href={link.href}
        target="_blank"
        rel="noreferrer"
        underline="hover"
        color="inherit"
        sx={{
          alignItems: "center",
          display: "inline-flex",
          fontWeight: 600,
          gap: 0.5,
          width: "fit-content",
          "&:hover": { color: "primary.light" },
        }}
      >
        {link.label}
        <LaunchIcon sx={{ fontSize: 14 }} aria-hidden="true" />
      </Link>
    );
  }

  return (
    <Link
      component={NextLink}
      href={link.href}
      underline="hover"
      color="inherit"
      sx={{
        fontWeight: 600,
        width: "fit-content",
        "&:hover": { color: "primary.light" },
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
        color="text.secondary"
        sx={{ letterSpacing: 1.2 }}
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
        color="text.secondary"
        sx={{ letterSpacing: 1.2 }}
      >
        Social
      </Typography>
      <Stack
        component="ul"
        direction="row"
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
                underline="hover"
                color="inherit"
                sx={{
                  alignItems: "center",
                  display: "inline-flex",
                  gap: 0.75,
                  "&:hover": { color: "primary.light" },
                }}
              >
                <Icon sx={{ fontSize: 18 }} aria-hidden="true" />
                <Typography component="span" variant="body2" fontWeight={600}>
                  {link.label}
                </Typography>
                <LaunchIcon sx={{ fontSize: 14 }} aria-hidden="true" />
              </Link>
            </Box>
          );
        })}
      </Stack>
    </Stack>
  );
}

export function Footer() {
  const currentYear = new Date().getFullYear();
  const homeHref = FOOTER_PUBLIC_LINKS[0]?.href ?? "/";
  const { brandName, tagline, navigationGroups, socialLinks } = FOOTER_CONTENT;

  return (
    <Box
      component="footer"
      sx={{
        mt: "auto",
        bgcolor: "background.paper",
        borderTop: "1px solid rgba(255, 255, 255, 0.12)",
      }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 1.5, md: 2 } }}>
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
          <Stack spacing={0.5}>
            <Link
              component={NextLink}
              href={homeHref}
              color="inherit"
              underline="none"
              sx={{ display: "inline-flex", width: "fit-content" }}
            >
              <Typography variant="h6" fontWeight={700}>
                🥣 {brandName}
              </Typography>
            </Link>
            {tagline ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.25 }}
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
            {navigationGroups.map((group) => (
              <FooterNavigationGroup key={group.title} group={group} />
            ))}
            <FooterSocialGroup socialLinks={socialLinks} />
          </Box>
        </Box>

        <Divider
          sx={{
            borderColor: "rgba(255, 255, 255, 0.12)",
            my: { xs: 1, md: 1.25 },
          }}
        />

        <Typography variant="body2" color="text.secondary" align="center">
          © {currentYear} {brandName}
        </Typography>
      </Container>
    </Box>
  );
}
