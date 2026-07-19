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
import {
  APP_NAME,
  PAGE_TITLE_KEYS,
  ROUTE_PATHS,
  getPageTitleEntry,
} from "@/lib/content/page-titles";
import { SERVER_THEME_TOKENS } from "@/lib/theme/server-theme-tokens";
import type {
  ContentNotice,
  ContentSection,
  SocialLink,
} from "@/lib/types/content";

const ABOUT_PAGE_ENTRY = getPageTitleEntry(PAGE_TITLE_KEYS.ABOUT);

export const metadata: Metadata = {
  title: "About",
  description: ABOUT_PAGE_ENTRY.description,
  alternates: {
    canonical: ROUTE_PATHS.about,
  },
  openGraph: {
    type: "article",
    title: ABOUT_PAGE_ENTRY.title,
    description: ABOUT_PAGE_ENTRY.description,
    url: ROUTE_PATHS.about,
    siteName: APP_NAME,
  },
  twitter: {
    card: "summary",
    title: ABOUT_PAGE_ENTRY.title,
    description: ABOUT_PAGE_ENTRY.description,
  },
};

const SOCIAL_ICON_BY_PLATFORM = {
  github: GitHubIcon,
  linkedin: LinkedInIcon,
  projectGithub: GitHubIcon,
} as const;
// Note 1.1: Server Components still need plain token values for `sx`, so these
// route styles derive from one shared server-safe palette instead of duplicating
// theme colors locally.
const ABOUT_PRIMARY = SERVER_THEME_TOKENS.palette.primary;
const ABOUT_BACKGROUND = SERVER_THEME_TOKENS.palette.backgroundDefault;
const ABOUT_PAPER = SERVER_THEME_TOKENS.palette.backgroundPaper;
const ABOUT_BORDER = SERVER_THEME_TOKENS.border.standard;
const ABOUT_HERO_BACKGROUND = `linear-gradient(140deg, ${alpha(
  ABOUT_PRIMARY,
  0.18,
)}, ${alpha(ABOUT_PAPER, 0.96)})`;
const ABOUT_FACT_BACKGROUND = alpha(ABOUT_BACKGROUND, 0.4);
const ABOUT_PRINCIPLE_BORDER = alpha(ABOUT_PRIMARY, 0.32);
const ABOUT_PRINCIPLE_BACKGROUND = alpha(ABOUT_PRIMARY, 0.08);
const ABOUT_NOTICE_BACKGROUND = alpha(ABOUT_PRIMARY, 0.06);

function NoticeCard({ notice }: { notice: ContentNotice }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        height: "100%",
        borderColor: ABOUT_PRINCIPLE_BORDER,
        bgcolor: ABOUT_NOTICE_BACKGROUND,
      }}
    >
      <Stack spacing={0.75}>
        <Typography
          variant="overline"
          color="primary.light"
          sx={{ letterSpacing: 1.1 }}
        >
          {notice.title}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ lineHeight: 1.7 }}
        >
          {notice.body}
        </Typography>
      </Stack>
    </Paper>
  );
}

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
        <Stack spacing={0.25} sx={{ flexGrow: 1, minWidth: 0 }}>
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
  const {
    creator,
    facts,
    hero,
    notices,
    principles,
    sectionTitles,
    sections,
    summary,
  } = ABOUT_PAGE_CONTENT;

  return (
    <Box component="main" sx={{ py: { xs: 6, md: 8 } }}>
      <Container maxWidth="xl">
        <Stack spacing={4}>
          <Paper
            component="section"
            aria-labelledby="about-hero-title"
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
                  id="about-hero-title"
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
                    md: "repeat(2, minmax(0, 1fr))",
                  },
                }}
              >
                {notices.map((notice) => (
                  <NoticeCard key={notice.title} notice={notice} />
                ))}
              </Box>
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
                <Box sx={{ display: "grid", gap: 0.75 }}>
                  <Typography id="about-creator-heading" variant="h5">
                    {sectionTitles.creator}
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
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
                <Typography id="about-philosophy-heading" variant="h5">
                  {sectionTitles.philosophy}
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
            <Typography id="about-story-heading" variant="h5">
              {sectionTitles.story}
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
