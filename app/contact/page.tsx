/**
 * Note 1: This page stays server-rendered so the shared content blocks and SEO
 * metadata ship in the first HTML response, while only the form itself hydrates.
 */

import type { Metadata } from "next";
import LaunchIcon from "@mui/icons-material/Launch";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";

import { ContactForm } from "@/components/contact/ContactForm";
import { CONTACT_PAGE_CONTENT } from "@/lib/content/contact";
import {
  APP_NAME,
  PAGE_TITLE_KEYS,
  PAGE_TITLES,
  ROUTE_PATHS,
} from "@/lib/content/page-titles";
import { SERVER_THEME_TOKENS } from "@/lib/theme/server-theme-tokens";
import type { ContentNotice } from "@/lib/types/content";

const CONTACT_PRIMARY = SERVER_THEME_TOKENS.palette.primary;
const CONTACT_PAPER = SERVER_THEME_TOKENS.palette.backgroundPaper;
const CONTACT_BORDER = SERVER_THEME_TOKENS.border.standard;
const CONTACT_HERO_BACKGROUND = `linear-gradient(140deg, ${alpha(CONTACT_PRIMARY, 0.18)}, ${alpha(CONTACT_PAPER, 0.96)})`;

const contactPageTitle = PAGE_TITLES[PAGE_TITLE_KEYS.CONTACT];
const CONTACT_PAGE_DESCRIPTION =
  "Contact the creator of Porridge Budget with product feedback, bug reports, collaboration ideas, or thoughtful questions about the manual-first workflow.";

export const metadata: Metadata = {
  title: "Contact",
  description: CONTACT_PAGE_DESCRIPTION,
  alternates: {
    canonical: ROUTE_PATHS.contact,
  },
  openGraph: {
    type: "website",
    title: contactPageTitle.title,
    description: CONTACT_PAGE_DESCRIPTION,
    url: ROUTE_PATHS.contact,
    siteName: APP_NAME,
  },
  twitter: {
    card: "summary",
    title: contactPageTitle.title,
    description: CONTACT_PAGE_DESCRIPTION,
  },
};

function ContactNoticeCard({ notice }: { notice: ContentNotice }) {
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent sx={{ p: 3, height: "100%" }}>
        <Stack spacing={1}>
          <Chip
            label={notice.title}
            color="primary"
            variant="outlined"
            sx={{ alignSelf: "flex-start", fontWeight: 600 }}
          />
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ lineHeight: 1.7 }}
          >
            {notice.body}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function ContactPage() {
  const {
    availabilityNote,
    form,
    hero,
    methods,
    notices,
    sidebar,
    summary,
    topics,
  } = CONTACT_PAGE_CONTENT;

  return (
    <Container component="main" maxWidth="xl" sx={{ py: { xs: 6, md: 8 } }}>
      <Stack spacing={{ xs: 4, md: 6 }}>
        <Paper
          component="section"
          aria-labelledby="contact-hero-title"
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            border: `1px solid ${CONTACT_BORDER}`,
            background: CONTACT_HERO_BACKGROUND,
          }}
        >
          <Stack spacing={2} sx={{ maxWidth: 760 }}>
            <Typography
              variant="overline"
              color="primary.main"
              sx={{ letterSpacing: 1.2 }}
            >
              {hero.eyebrow}
            </Typography>
            <Typography
              id="contact-hero-title"
              component="h1"
              variant="h3"
              fontWeight={700}
            >
              {hero.title}
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {hero.summary}
            </Typography>
            {summary.map((paragraph) => (
              <Typography
                key={paragraph}
                variant="body1"
                color="text.secondary"
              >
                {paragraph}
              </Typography>
            ))}
          </Stack>
          <Box
            sx={{
              display: "grid",
              gap: 2,
              mt: 3,
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, minmax(0, 1fr))",
              },
            }}
          >
            {notices.map((notice) => (
              <ContactNoticeCard key={notice.title} notice={notice} />
            ))}
          </Box>
        </Paper>

        <Box
          component="section"
          aria-label="Contact options"
          sx={{
            display: "grid",
            gap: { xs: 3, lg: 4 },
            gridTemplateColumns: {
              xs: "1fr",
              lg: "minmax(0, 1.2fr) minmax(320px, 0.8fr)",
            },
            alignItems: "stretch",
          }}
        >
          <ContactForm form={form} />

          <Stack spacing={3} sx={{ height: "100%" }}>
            <Card variant="outlined" sx={{ flex: 1.2 }}>
              <CardContent sx={{ p: 3, height: "100%", minHeight: 320 }}>
                <Stack spacing={2}>
                  <Typography component="h2" variant="h5" fontWeight={700}>
                    {sidebar.methodsTitle}
                  </Typography>
                  <Typography color="text.secondary">
                    {sidebar.methodsDescription}
                  </Typography>

                  <Stack
                    component="ul"
                    spacing={1.5}
                    sx={{ m: 0, p: 0, listStyle: "none" }}
                  >
                    {methods.map((method) => (
                      <Box component="li" key={method.href}>
                        <Stack
                          spacing={1.25}
                          sx={{
                            p: 2,
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: 2,
                            minWidth: 0,
                          }}
                        >
                          <Typography
                            component="h3"
                            variant="h6"
                            fontWeight={600}
                            sx={{ minWidth: 0 }}
                          >
                            {method.label}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              overflowWrap: "anywhere",
                              wordBreak: "break-word",
                              minWidth: 0,
                            }}
                          >
                            {method.description}
                          </Typography>
                          <Button
                            component="a"
                            href={method.href}
                            target="_blank"
                            rel="noreferrer"
                            variant="outlined"
                            endIcon={<LaunchIcon />}
                            sx={{
                              alignSelf: "flex-start",
                              whiteSpace: "normal",
                            }}
                          >
                            {method.cta}
                          </Button>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            <Card variant="outlined" sx={{ flex: 0.8 }}>
              <CardContent sx={{ p: 3, height: "100%", minHeight: 200 }}>
                <Stack spacing={2} sx={{ height: "100%" }}>
                  <Typography component="h2" variant="h5" fontWeight={700}>
                    {sidebar.topicsTitle}
                  </Typography>
                  <Stack component="ul" spacing={1.25} sx={{ m: 0, pl: 2.5 }}>
                    {topics.map((topic) => (
                      <Typography
                        component="li"
                        key={topic}
                        variant="body2"
                        color="text.secondary"
                      >
                        {topic}
                      </Typography>
                    ))}
                  </Stack>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {availabilityNote}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
}
