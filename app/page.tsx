/**
 * Note 1: This landing page stays server-rendered so both metadata and
 * structured data ship in the first HTML response for crawlers and users.
 */

import type { Metadata } from "next";
import Script from "next/script";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import BarChartIcon from "@mui/icons-material/BarChart";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import Paper from "@mui/material/Paper";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import Stack from "@mui/material/Stack";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import NextLink from "next/link";

import HomeHeroActions from "@/components/home/HomeHeroActions";
import { HOME_PAGE_CONTENT } from "@/lib/content/home";
import {
  APP_NAME,
  PAGE_TITLE_KEYS,
  ROUTE_PATHS,
  getPageTitleEntry,
} from "@/lib/content/page-titles";
import { SERVER_THEME_TOKENS } from "@/lib/theme/server-theme-tokens";

const HOME_FEATURE_ICONS = {
  transactions: ReceiptLongIcon,
  reports: BarChartIcon,
  budget: AutoGraphIcon,
  fire: LocalFireDepartmentIcon,
  progress: TrendingUpIcon,
} as const;

const HOME_PAGE_DESCRIPTION = getPageTitleEntry(
  PAGE_TITLE_KEYS.HOME,
).description;
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://porridge-budgeting.vercel.app"
).replace(/\/+$/, "");

export const metadata: Metadata = {
  title: {
    absolute: APP_NAME,
  },
  description: HOME_PAGE_DESCRIPTION,
  alternates: {
    canonical: ROUTE_PATHS.home,
  },
  openGraph: {
    type: "website",
    title: APP_NAME,
    description: HOME_PAGE_DESCRIPTION,
    url: ROUTE_PATHS.home,
  },
  twitter: {
    card: "summary",
    title: APP_NAME,
    description: HOME_PAGE_DESCRIPTION,
  },
};

export default function Home() {
  const { features, hero } = HOME_PAGE_CONTENT;
  const homeStructuredData = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: APP_NAME,
      url: `${SITE_URL}${ROUTE_PATHS.home}`,
      description: HOME_PAGE_DESCRIPTION,
      inLanguage: "en",
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: APP_NAME,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: features.map((feature) => feature.title),
      description: HOME_PAGE_DESCRIPTION,
      url: `${SITE_URL}${ROUTE_PATHS.home}`,
    },
  ];

  return (
    <>
      {/* Note 2: Keeping the JSON-LD beside the rendered hero avoids copy drift
          between visible marketing text and the schema crawlers consume. */}
      <Script id="home-structured-data" type="application/ld+json">
        {JSON.stringify(homeStructuredData)}
      </Script>

      {/* Hero section */}
      <Box
        component="section"
        aria-labelledby="home-hero-title"
        sx={{
          position: "relative",
          overflow: "hidden",
          py: { xs: 10, md: 14 },
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(45, 125, 210, 0.18) 0%, transparent 70%)",
            pointerEvents: "none",
          },
        }}
      >
        <Container maxWidth="md">
          <Stack spacing={3} alignItems="center" textAlign="center">
            <Typography
              variant="overline"
              sx={{
                color: "primary.light",
                letterSpacing: "0.1em",
                fontWeight: 600,
                fontSize: "0.75rem",
              }}
            >
              {hero.eyebrow}
            </Typography>

            <Typography
              id="home-hero-title"
              variant="h1"
              component="h1"
              sx={{
                fontSize: { xs: "2.5rem", sm: "3.5rem", md: "4.5rem" },
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                background: `linear-gradient(135deg, #ffffff 40%, ${SERVER_THEME_TOKENS.palette.primaryLight} 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {hero.title}
            </Typography>

            <Typography
              variant="h5"
              component="p"
              color="text.secondary"
              sx={{
                maxWidth: 560,
                lineHeight: 1.7,
                fontSize: { xs: "1rem", md: "1.2rem" },
              }}
            >
              {hero.summary}
            </Typography>

            <HomeHeroActions />
          </Stack>
        </Container>
      </Box>

      {/* Feature grid */}
      <Box
        component="section"
        aria-labelledby="home-features-title"
        sx={{ pb: { xs: 10, md: 14 } }}
      >
        <Container maxWidth="xl">
          <Typography
            id="home-features-title"
            variant="overline"
            align="center"
            display="block"
            sx={{
              color: "text.disabled",
              letterSpacing: "0.08em",
              fontWeight: 600,
              fontSize: "0.7rem",
              mb: 3,
            }}
          >
            What&rsquo;s included
          </Typography>

          <Grid container spacing={2.5} justifyContent="center">
            {features.map((feature) => {
              const Icon = HOME_FEATURE_ICONS[feature.id];
              const titleId = `home-feature-${feature.id}-title`;

              return (
                <Grid key={feature.id} item xs={12} sm={6} lg={4}>
                  <Paper
                    component="article"
                    aria-labelledby={titleId}
                    sx={{
                      height: "100%",
                      p: { xs: 3, md: 3.5 },
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      transition:
                        "border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                      "&:hover": {
                        borderColor: alpha(
                          SERVER_THEME_TOKENS.palette.primary,
                          0.4,
                        ),
                        boxShadow: SERVER_THEME_TOKENS.shadow.medium,
                      },
                    }}
                  >
                    {/* Icon badge */}
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 48,
                        height: 48,
                        borderRadius: 3,
                        backgroundColor: alpha(
                          SERVER_THEME_TOKENS.palette.primary,
                          0.12,
                        ),
                        border: `1px solid ${alpha(SERVER_THEME_TOKENS.palette.primary, 0.22)}`,
                        flexShrink: 0,
                      }}
                    >
                      <Icon
                        aria-hidden="true"
                        sx={{ fontSize: 26, color: "primary.light" }}
                      />
                    </Box>

                    <Stack spacing={1} sx={{ flex: 1 }}>
                      <Typography
                        id={titleId}
                        component="h3"
                        variant="h6"
                        fontWeight={700}
                        sx={{ fontSize: "1rem" }}
                      >
                        {feature.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ lineHeight: 1.75 }}
                      >
                        {feature.description}
                      </Typography>
                    </Stack>

                    <Typography
                      variant="caption"
                      sx={{
                        color: "primary.light",
                        fontWeight: 600,
                        fontSize: "0.8rem",
                        mt: "auto",
                      }}
                    >
                      {feature.supportingCopy}
                    </Typography>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Container>
      </Box>
    </>
  );
}
