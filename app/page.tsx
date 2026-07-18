import type { Metadata } from "next";
import Script from "next/script";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import BarChartIcon from "@mui/icons-material/BarChart";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import Paper from "@mui/material/Paper";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import Stack from "@mui/material/Stack";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";

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

const FeatureCard = ({
  feature,
}: {
  feature: (typeof HOME_PAGE_CONTENT)["features"][number];
}) => {
  const Icon = HOME_FEATURE_ICONS[feature.id];
  const titleId = `home-feature-${feature.id}-title`;

  return (
    <Grid key={feature.id} item xs={12} sm={6} lg={4}>
      <Paper
        component="article"
        aria-labelledby={titleId}
        sx={{
          p: 3,
          display: "flex",
          flexDirection: "column",
          backgroundColor: alpha(
            SERVER_THEME_TOKENS.palette.backgroundPaper,
            0.6,
          ),
          border: `1px solid ${alpha(SERVER_THEME_TOKENS.border.subtle, 0.25)}`,
          height: "100%",
          gap: 1,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 48,
            height: 48,
            borderRadius: 3,
            backgroundColor: alpha(SERVER_THEME_TOKENS.palette.primary, 0.12),
            border: `1px solid ${alpha(SERVER_THEME_TOKENS.palette.primary, 0.42)}`,
            margin: "auto",
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
            sx={{ fontSize: "1rem", textAlign: "center" }}
          >
            {feature.title}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ lineHeight: 1.75, textAlign: "center" }}
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
            textAlign: "center",
          }}
        >
          {feature.supportingCopy}
        </Typography>
      </Paper>
    </Grid>
  );
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
      <Script id="home-structured-data" type="application/ld+json">
        {JSON.stringify(homeStructuredData)}
      </Script>
      <Box
        component="section"
        aria-labelledby="home-hero-title"
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
              variant="overline"
              sx={{
                color: "primary.light",
                letterSpacing: "0.2em",
                fontWeight: 600,
                fontSize: "0.75rem",
                textTransform: "uppercase",
              }}
            >
              {hero.eyebrow}
            </Typography>
            <Typography
              id="home-hero-title"
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
            <HomeHeroActions />
          </Stack>
        </Container>
      </Box>
      <Box
        component="section"
        aria-labelledby="home-features-title"
        sx={{ pb: 10 }}
      >
        <Container maxWidth="xl">
          <Grid container spacing={3} justifyContent="center">
            {features.map((feature) => {
              return <FeatureCard key={feature.id} feature={feature} />;
            })}
          </Grid>
        </Container>
      </Box>
    </>
  );
}
