/**
 * Note 1: This landing page stays server-rendered so both metadata and
 * structured data ship in the first HTML response for crawlers and users.
 */

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
import SavingsIcon from "@mui/icons-material/Savings";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import Typography from "@mui/material/Typography";

import { HOME_PAGE_CONTENT } from "@/lib/content/home";
import { APP_NAME, ROUTE_PATHS } from "@/lib/content/page-titles";

const HOME_FEATURE_ICONS = {
  transactions: ReceiptLongIcon,
  reports: BarChartIcon,
  budget: AutoGraphIcon,
  fire: LocalFireDepartmentIcon,
  goals: SavingsIcon,
  progress: TrendingUpIcon,
} as const;

const HOME_PAGE_DESCRIPTION =
  "Track expenses, compare months, plan budgets, and review long-term progress with a manual-first personal budgeting app built for clarity and reflection.";
const VISUALLY_HIDDEN_SX = {
  border: 0,
  clip: "rect(0 0 0 0)",
  height: 1,
  margin: -1,
  overflow: "hidden",
  padding: 0,
  position: "absolute",
  whiteSpace: "nowrap",
  width: 1,
} as const;
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

      <Container component="main" maxWidth="xl" sx={{ py: { xs: 9, md: 12 } }}>
        <Box
          component="section"
          aria-labelledby="home-hero-title"
          sx={{
            maxWidth: 860,
            mx: "auto",
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(45, 125, 210, 0.12) 0%, transparent 70%)",
            pb: { xs: 5, md: 6 },
          }}
        >
          <Typography
            variant="overline"
            color="primary.main"
            align="center"
            sx={{ display: "block", letterSpacing: 1.4, mb: 1.5 }}
          >
            {hero.eyebrow}
          </Typography>
          <Typography
            id="home-hero-title"
            variant="h2"
            component="h1"
            gutterBottom
            align="center"
            sx={{
              fontSize: { xs: "2.75rem", md: "4.25rem" },
              fontWeight: 700,
              background: "linear-gradient(135deg, #ffffff 30%, #2D7DD2 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {hero.title}
          </Typography>
          <Typography
            variant="h5"
            color="text.secondary"
            paragraph
            align="center"
            sx={{ lineHeight: 1.7, mb: { xs: 5, md: 6 } }}
          >
            {hero.summary}
          </Typography>
        </Box>

        <Box component="section" aria-labelledby="home-features-title">
          <Typography
            id="home-features-title"
            component="h2"
            sx={VISUALLY_HIDDEN_SX}
          >
            Core budgeting features
          </Typography>
          <Grid
            container
            spacing={3}
            sx={{ pt: { xs: 1, md: 2 } }}
            justifyContent="center"
          >
            {features.map((feature) => {
              const Icon = HOME_FEATURE_ICONS[feature.id];
              const titleId = `home-feature-${feature.id}-title`;

              return (
                <Grid key={feature.id} item xs={12} md={6}>
                  <Paper
                    component="article"
                    variant="outlined"
                    aria-labelledby={titleId}
                    sx={{
                      p: { xs: 4, md: 4.5 },
                      minHeight: { xs: 240, md: 280 },
                      height: "100%",
                      transition:
                        "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        mb: 2.5,
                      }}
                    >
                      <Icon
                        aria-hidden="true"
                        color="primary"
                        sx={{ fontSize: 52 }}
                      />
                    </Box>
                    <Typography
                      id={titleId}
                      component="h3"
                      variant="h5"
                      align="center"
                      fontWeight={700}
                      gutterBottom
                    >
                      {feature.title}
                    </Typography>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      align="center"
                      sx={{ lineHeight: 1.8 }}
                    >
                      {feature.description}
                    </Typography>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      </Container>
    </>
  );
}
