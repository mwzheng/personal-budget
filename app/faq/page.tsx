/**
 * Note 1: This page stays presentation-focused by consuming `FAQ_PAGE_CONTENT`
 * directly, which keeps route copy reusable for navigation, metadata, and any
 * future search or filtering UI.
 */

import type { Metadata } from "next";
import Script from "next/script";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";

import { FAQ_PAGE_CONTENT } from "@/lib/content/faq";
import {
  APP_NAME,
  PAGE_TITLE_KEYS,
  ROUTE_PATHS,
  getPageTitleEntry,
} from "@/lib/content/page-titles";
import { SERVER_THEME_TOKENS } from "@/lib/theme/server-theme-tokens";

const FAQ_PAGE_ENTRY = getPageTitleEntry(PAGE_TITLE_KEYS.FAQ);
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://porridge-budgeting.vercel.app"
).replace(/\/+$/, "");
// Note 1.1: These plain values keep the Server Component serializable while
// still reusing the app's shared dark palette from one server-safe token file.
const FAQ_PRIMARY = SERVER_THEME_TOKENS.palette.primary;
const FAQ_PAPER = SERVER_THEME_TOKENS.palette.backgroundPaper;
const FAQ_BORDER = SERVER_THEME_TOKENS.border.standard;
const FAQ_CATEGORY_BORDER = alpha(FAQ_PRIMARY, 0.35);
const FAQ_HERO_BORDER = alpha(FAQ_PRIMARY, 0.26);
const FAQ_HERO_BACKGROUND = `linear-gradient(160deg, ${alpha(
  FAQ_PRIMARY,
  0.2,
)} 0%, ${alpha(FAQ_PAPER, 0.98)} 32%, ${FAQ_PAPER} 100%)`;
const FAQ_HERO_SHADOW = `0 24px 48px ${SERVER_THEME_TOKENS.shadow.deep}`;
const FAQ_ACCORDION_BACKGROUND = alpha(FAQ_PAPER, 0.94);

export const metadata: Metadata = {
  title: "FAQ",
  description: FAQ_PAGE_ENTRY.description,
  alternates: {
    canonical: ROUTE_PATHS.faq,
  },
  openGraph: {
    type: "website",
    title: FAQ_PAGE_ENTRY.title,
    description: FAQ_PAGE_ENTRY.description,
    url: ROUTE_PATHS.faq,
    siteName: APP_NAME,
  },
  twitter: {
    card: "summary",
    title: FAQ_PAGE_ENTRY.title,
    description: FAQ_PAGE_ENTRY.description,
  },
};

function formatFaqCategoryLabel(category: string) {
  return category
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function FaqPage() {
  const { hero, intro, items } = FAQ_PAGE_CONTENT;
  const categories = Array.from(new Set(items.map((item) => item.category)));
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    url: `${SITE_URL}${ROUTE_PATHS.faq}`,
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <>
      {/* Note 2: FAQ schema is derived from the same content array as the visible
          accordions so search snippets stay aligned with the maintained answers. */}
      <Script id="faq-structured-data" type="application/ld+json">
        {JSON.stringify(faqStructuredData)}
      </Script>

      <Container component="main" maxWidth="xl" sx={{ py: { xs: 6, md: 8 } }}>
        <Stack spacing={{ xs: 4, md: 5 }}>
          <Paper
            component="section"
            aria-labelledby="faq-hero-title"
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 4,
              border: "1px solid",
              borderColor: FAQ_HERO_BORDER,
              background: FAQ_HERO_BACKGROUND,
              boxShadow: FAQ_HERO_SHADOW,
            }}
          >
            <Stack spacing={2.5}>
              {hero.eyebrow ? (
                <Chip
                  label={hero.eyebrow}
                  color="primary"
                  size="small"
                  sx={{ alignSelf: "flex-start", fontWeight: 700 }}
                />
              ) : null}

              <Box>
                <Typography
                  id="faq-hero-title"
                  component="h1"
                  variant="h2"
                  sx={{
                    fontSize: { xs: "2.4rem", md: "3.4rem" },
                    fontWeight: 700,
                    lineHeight: 1.1,
                  }}
                >
                  {hero.title}
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ mt: 2, maxWidth: 700, lineHeight: 1.75 }}
                >
                  {hero.summary}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Chip
                  label={`${items.length} questions`}
                  variant="outlined"
                  sx={{ borderColor: SERVER_THEME_TOKENS.border.strong }}
                />
                <Chip
                  label={`${categories.length} topics`}
                  variant="outlined"
                  sx={{ borderColor: SERVER_THEME_TOKENS.border.strong }}
                />
              </Stack>
            </Stack>
          </Paper>

          <Stack
            component="section"
            spacing={2.5}
            aria-labelledby="faq-list-heading"
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Box sx={{ maxWidth: 640 }}>
                <Typography id="faq-list-heading" component="h2" variant="h5">
                  {intro.heading}
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ mt: 1.25, lineHeight: 1.75 }}
                >
                  {intro.description}
                </Typography>
              </Box>

              <Stack
                direction="row"
                spacing={1}
                useFlexGap
                flexWrap="wrap"
                sx={{ alignContent: "flex-start" }}
              >
                {categories.map((category) => (
                  <Chip
                    key={category}
                    label={formatFaqCategoryLabel(category)}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderColor: FAQ_CATEGORY_BORDER,
                      color: "text.secondary",
                    }}
                  />
                ))}
              </Stack>
            </Box>

            <Box>
              {items.map((item, index) => {
                const panelId = `faq-panel-${item.id}`;

                return (
                  <Accordion
                    key={item.id}
                    defaultExpanded={index === 0}
                    disableGutters
                    sx={{
                      borderRadius: 3,
                      overflow: "hidden",
                      border: "1px solid",
                      borderColor: FAQ_BORDER,
                      backgroundColor: FAQ_ACCORDION_BACKGROUND,
                      backgroundImage: "none",
                      boxShadow: "none",
                      "&:before": { display: "none" },
                      "&:not(:first-of-type)": { mt: 1.5 },
                    }}
                  >
                    {/* Note 3: Opening the first panel by default gives first-time
                        visitors an immediate content sample without forcing them
                        to discover the accordion affordance on a dark surface. */}
                    <AccordionSummary
                      expandIcon={<ExpandMoreRoundedIcon color="primary" />}
                      aria-controls={`${panelId}-content`}
                      id={`${panelId}-header`}
                      sx={{
                        px: { xs: 2.5, md: 3 },
                        py: 0.75,
                        "& .MuiAccordionSummary-content": { my: 1.25 },
                      }}
                    >
                      <Box
                        component="span"
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.5,
                          textAlign: "left",
                        }}
                      >
                        <Typography
                          component="span"
                          variant="overline"
                          color="primary.light"
                          sx={{ letterSpacing: 1.3 }}
                        >
                          {formatFaqCategoryLabel(item.category)}
                        </Typography>
                        <Typography
                          component="span"
                          variant="h6"
                          sx={{ fontWeight: 600, lineHeight: 1.35 }}
                        >
                          {item.question}
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails
                      id={`${panelId}-content`}
                      sx={{
                        px: { xs: 2.5, md: 3 },
                        pb: { xs: 2.5, md: 3 },
                        pt: 0,
                      }}
                    >
                      <Typography
                        component="p"
                        variant="body1"
                        color="text.secondary"
                        sx={{ lineHeight: 1.8 }}
                      >
                        {item.answer}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Box>
          </Stack>
        </Stack>
      </Container>
    </>
  );
}
