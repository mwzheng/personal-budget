/**
 * Note 1: This route stays a Server Component because every substantive string
 * is sourced from the content layer, which keeps the page presentation-focused
 * and publicly renderable without client-side data fetching.
 */

import type { Metadata } from "next";
import GitHubIcon from "@mui/icons-material/GitHub";
import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";

import { ABOUT_PAGE_CONTENT } from "@/lib/content/about";
import { PAGE_TITLE_KEYS, getPageTitleEntry } from "@/lib/content/page-titles";
import type { ContentSection, SocialLink } from "@/lib/types/content";

const ABOUT_PAGE_ENTRY = getPageTitleEntry(PAGE_TITLE_KEYS.ABOUT);

export const metadata: Metadata = {
  title: ABOUT_PAGE_ENTRY.title,
  description: ABOUT_PAGE_ENTRY.description,
};

const SOCIAL_ICON_BY_PLATFORM = {
  github: GitHubIcon,
  linkedin: LinkedInIcon,
} as const;
// Note 1.1: MUI client components can receive plain `sx` objects from a Server
// Component, but not theme callback functions, so these shared colors stay
// flattened here to keep the route prerenderable.
const ABOUT_PRIMARY = "#2D7DD2";
const ABOUT_BACKGROUND = "#1a1a1a";
const ABOUT_PAPER = "#242424";
const ABOUT_BORDER = alpha("#ffffff", 0.08);
const ABOUT_HERO_BACKGROUND = `linear-gradient(140deg, ${alpha(
  ABOUT_PRIMARY,
  0.18,
)}, ${alpha(ABOUT_PAPER, 0.96)})`;
const ABOUT_FACT_BACKGROUND = alpha(ABOUT_BACKGROUND, 0.4);
const ABOUT_PRINCIPLE_BORDER = alpha(ABOUT_PRIMARY, 0.32);
const ABOUT_PRINCIPLE_BACKGROUND = alpha(ABOUT_PRIMARY, 0.08);

function CreatorLink({ link }: { link: SocialLink }) {
  const Icon = SOCIAL_ICON_BY_PLATFORM[link.platform];

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        height: "100%",
      }}
    >
      <Link
        href={link.href}
        target={link.external ? "_blank" : undefined}
        rel={link.external ? "noreferrer" : undefined}
        underline="hover"
        color="inherit"
        sx={{
          alignItems: "flex-start",
          display: "flex",
          gap: 1.5,
          "&:hover": { color: "primary.light" },
        }}
      >
        <Icon aria-hidden="true" sx={{ fontSize: 20, mt: 0.25 }} />
        <Stack spacing={0.25} flexGrow={1}>
          <Typography component="span" variant="body1" fontWeight={600}>
            {link.label}
          </Typography>
          <Typography component="span" variant="body2" color="text.secondary">
            @{link.handle}
          </Typography>
          {link.description ? (
            <Typography
              component="span"
              variant="caption"
              color="text.secondary"
            >
              {link.description}
            </Typography>
          ) : null}
        </Stack>
        {link.external ? (
          <LaunchRoundedIcon
            aria-hidden="true"
            sx={{ fontSize: 18, mt: 0.25 }}
          />
        ) : null}
      </Link>
    </Paper>
  );
}

function StorySection({ section }: { section: ContentSection }) {
  const headingId = `about-section-${section.id}`;

  return (
    <Paper
      component="article"
      variant="outlined"
      aria-labelledby={headingId}
      sx={{ p: { xs: 3, md: 3.5 }, height: "100%" }}
    >
      <Stack spacing={2}>
        <Typography id={headingId} component="h2" variant="h5">
          {section.heading}
        </Typography>
        <Stack spacing={1.25}>
          {section.paragraphs.map((paragraph) => (
            <Typography
              key={`${section.id}-${paragraph}`}
              variant="body2"
              color="text.secondary"
              sx={{ lineHeight: 1.8 }}
            >
              {paragraph}
            </Typography>
          ))}
        </Stack>
        {section.highlights?.length ? (
          <>
            <Divider flexItem />
            <Stack component="ul" spacing={1} sx={{ m: 0, pl: 2.5 }}>
              {section.highlights.map((highlight) => (
                <Typography
                  component="li"
                  key={`${section.id}-${highlight}`}
                  variant="body2"
                  color="text.secondary"
                >
                  {highlight}
                </Typography>
              ))}
            </Stack>
          </>
        ) : null}
      </Stack>
    </Paper>
  );
}

/**
 * Note 2: Small local helpers keep the JSX readable while preserving the rule
 * that all substantive copy comes from `ABOUT_PAGE_CONTENT` instead of this file.
 */
export default function AboutPage() {
  const { creator, facts, hero, principles, sections, summary } =
    ABOUT_PAGE_CONTENT;

  return (
    <Box component="main" sx={{ py: { xs: 6, md: 8 } }}>
      <Container maxWidth="lg">
        <Stack spacing={4}>
          <Paper
            component="section"
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              border: `1px solid ${ABOUT_BORDER}`,
              background: ABOUT_HERO_BACKGROUND,
            }}
          >
            <Stack spacing={3}>
              {hero.eyebrow ? (
                <Chip
                  label={hero.eyebrow}
                  color="primary"
                  variant="outlined"
                  sx={{ alignSelf: "flex-start", fontWeight: 600 }}
                />
              ) : null}
              <Stack spacing={1.5}>
                <Typography
                  component="h1"
                  variant="h2"
                  sx={{ fontSize: { xs: "2.25rem", md: "3rem" } }}
                >
                  {hero.title}
                </Typography>
                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{ maxWidth: 760, lineHeight: 1.6 }}
                >
                  {hero.summary}
                </Typography>
              </Stack>
              <Box
                sx={{
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    lg: "repeat(4, minmax(0, 1fr))",
                  },
                }}
              >
                {facts.map((fact) => (
                  <Paper
                    key={fact.label}
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      height: "100%",
                      borderColor: ABOUT_BORDER,
                      bgcolor: ABOUT_FACT_BACKGROUND,
                    }}
                  >
                    <Typography
                      variant="overline"
                      color="text.secondary"
                      sx={{ letterSpacing: 1.1 }}
                    >
                      {fact.label}
                    </Typography>
                    <Typography variant="h6" sx={{ mt: 0.75 }}>
                      {fact.value}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            </Stack>
          </Paper>

          <Box
            sx={{
              display: "grid",
              gap: 3,
              gridTemplateColumns: {
                xs: "1fr",
                md: "minmax(0, 1.1fr) minmax(0, 0.9fr)",
              },
              alignItems: "start",
            }}
          >
            <Paper
              component="section"
              aria-labelledby="about-creator-heading"
              variant="outlined"
              sx={{ p: { xs: 3, md: 4 }, height: "100%" }}
            >
              <Stack spacing={2.5}>
                <Box>
                  <Typography id="about-creator-heading" variant="h4">
                    {creator.name}
                  </Typography>
                  <Typography variant="subtitle1" color="primary.light">
                    {creator.role}
                  </Typography>
                </Box>
                <Typography variant="body1" color="text.secondary">
                  {creator.experienceSummary}
                </Typography>
                <Stack spacing={1.5}>
                  {creator.bio.map((paragraph) => (
                    <Typography
                      key={paragraph}
                      variant="body1"
                      color="text.secondary"
                      sx={{ lineHeight: 1.8 }}
                    >
                      {paragraph}
                    </Typography>
                  ))}
                </Stack>
                <Divider flexItem />
                <Stack
                  component="ul"
                  spacing={1.5}
                  sx={{ listStyle: "none", m: 0, p: 0 }}
                >
                  {creator.links.map((link) => (
                    <Box component="li" key={link.platform}>
                      <CreatorLink link={link} />
                    </Box>
                  ))}
                </Stack>
              </Stack>
            </Paper>

            <Paper
              component="section"
              aria-labelledby="about-philosophy-heading"
              variant="outlined"
              sx={{ p: { xs: 3, md: 4 }, height: "100%" }}
            >
              <Stack spacing={2.5}>
                <Typography id="about-philosophy-heading" variant="h4">
                  App philosophy
                </Typography>
                <Stack spacing={1.5}>
                  {summary.map((paragraph) => (
                    <Typography
                      key={paragraph}
                      variant="body1"
                      color="text.secondary"
                      sx={{ lineHeight: 1.8 }}
                    >
                      {paragraph}
                    </Typography>
                  ))}
                </Stack>
                <Divider flexItem />
                <Stack
                  component="ul"
                  spacing={1.25}
                  sx={{ listStyle: "none", m: 0, p: 0 }}
                >
                  {principles.map((principle) => (
                    <Box component="li" key={principle}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderColor: ABOUT_PRINCIPLE_BORDER,
                          bgcolor: ABOUT_PRINCIPLE_BACKGROUND,
                        }}
                      >
                        <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                          {principle}
                        </Typography>
                      </Paper>
                    </Box>
                  ))}
                </Stack>
              </Stack>
            </Paper>
          </Box>

          <Stack
            component="section"
            spacing={2.5}
            aria-labelledby="about-story-heading"
          >
            <Typography id="about-story-heading" variant="h4">
              More about the product
            </Typography>
            <Box
              sx={{
                display: "grid",
                gap: 2.5,
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(3, minmax(0, 1fr))",
                },
              }}
            >
              {sections.map((section) => (
                <StorySection key={section.id} section={section} />
              ))}
            </Box>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
