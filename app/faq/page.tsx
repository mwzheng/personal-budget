import type { Metadata } from "next";
import Script from "next/script";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { FAQ_PAGE_CONTENT } from "@/lib/content/faq";
import {
  APP_NAME,
  PAGE_TITLE_KEYS,
  ROUTE_PATHS,
  getPageTitleEntry,
} from "@/lib/content/page-titles";

const FAQ_PAGE_ENTRY = getPageTitleEntry(PAGE_TITLE_KEYS.FAQ);
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://porridge-budgeting.vercel.app"
).replace(/\/+$/, "");

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
  const { hero, items } = FAQ_PAGE_CONTENT;

  const firstItemId = items[0]?.id;
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
      <Script id="faq-structured-data" type="application/ld+json">
        {JSON.stringify(faqStructuredData)}
      </Script>
      <Box
        component="section"
        aria-labelledby="faq-hero-title"
        sx={{
          position: "relative",
          overflow: "hidden",
          py: 10,
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 50% -20%, rgba(45, 125, 210, 0.12) 0%, transparent 50%), radial-gradient(circle at 50% 10%, rgba(45, 125, 210, 0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          },
        }}
      >
        <Container maxWidth="md">
          <Stack spacing={4} alignItems="center" textAlign="center">
            <Typography
              id="faq-hero-title"
              variant="h1"
              component="h1"
              sx={{
                fontSize: { xs: "2.75rem", sm: "3.5rem", md: "4.5rem" },
                letterSpacing: "-0.05em",
                color: "common.white",
              }}
            >
              {hero.title}
            </Typography>
            <Typography
              variant="h5"
              component="p"
              color="text.secondary"
              sx={{
                maxWidth: 600,
                lineHeight: 1.7,
                fontSize: { xs: "1rem", md: "1.25rem" },
                fontWeight: 400,
              }}
            >
              {hero.summary}
            </Typography>
          </Stack>
        </Container>
      </Box>
      <Container maxWidth="lg" sx={{ pb: { xs: 6, md: 8 } }}>
        <Stack spacing={5}>
          {categories.map((category) => {
            const categoryItems = items.filter(
              (item) => item.category === category,
            );

            return (
              <Box key={category}>
                <Typography
                  component="h2"
                  variant="h6"
                  sx={{ fontWeight: 600, mb: 1.5 }}
                >
                  {formatFaqCategoryLabel(category)}
                </Typography>
                <Box>
                  {categoryItems.map((item) => (
                    <Accordion
                      key={item.id}
                      defaultExpanded={item.id === firstItemId}
                      disableGutters
                      sx={{
                        "&:not(:first-of-type)": { mt: 1.5 },
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreRoundedIcon color="primary" />}
                        aria-controls={`faq-panel-${item.id}-content`}
                        id={`faq-panel-${item.id}-header`}
                        sx={{
                          px: { xs: 2.5, md: 3 },
                          py: 0.75,
                        }}
                      >
                        <Typography
                          component="span"
                          variant="h6"
                          sx={{ fontWeight: 600, lineHeight: 1.35 }}
                        >
                          {item.question}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails
                        id={`faq-panel-${item.id}-content`}
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
                  ))}
                </Box>
              </Box>
            );
          })}
        </Stack>
      </Container>
      <Box sx={{ textAlign: "center", py: { xs: 6, md: 8 } }}>
        <Container maxWidth="sm">
          <Stack spacing={3} alignItems="center">
            <Typography variant="h4" fontWeight={700}>
              Still have questions?
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: 480, lineHeight: 1.7 }}
            >
              We&rsquo;re here to help. Reach out and we&rsquo;ll get back to
              you.
            </Typography>
            <Button variant="contained" size="large" href="/about">
              Contact Us
            </Button>
          </Stack>
        </Container>
      </Box>
    </>
  );
}
