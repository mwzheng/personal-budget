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
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";

import HomeHeroActions from "@/components/home/HomeHeroActions";
import { HOME_PAGE_CONTENT } from "@/lib/content/home";
import { APP_NAME, ROUTE_PATHS } from "@/lib/content/page-titles";

const HOME_FEATURE_ICONS = {
  transactions: ReceiptLongIcon,
  reports: BarChartIcon,
  budget: AutoGraphIcon,
  fire: LocalFireDepartmentIcon,
  progress: TrendingUpIcon,
} as const;
type HomeFeatureId = keyof typeof HOME_FEATURE_ICONS;
const HOME_FEATURE_ENTRY_COPY: Record<HomeFeatureId, string> = {
  transactions: "Manual-first tracking for everyday spending.",
  reports: "Clear comparisons for months, categories, and trends.",
  budget: "Thoughtful planning for flexible budget categories.",
  fire: "Long-range modeling for financial independence goals.",
  progress: "Ongoing visibility into savings and long-term progress.",
};
const HOME_FEATURE_ACCENT = "#2D7DD2";
const HOME_FEATURE_ICON_BACKGROUND = alpha(HOME_FEATURE_ACCENT, 0.14);
const HOME_FEATURE_ICON_BORDER = alpha(HOME_FEATURE_ACCENT, 0.24);
const HOME_FEATURE_ICON_SHADOW = `0 10px 30px ${alpha(
  HOME_FEATURE_ACCENT,
  0.16,
)}`;
const HOME_FEATURE_CARD_BORDER = alpha(HOME_FEATURE_ACCENT, 0.35);
const HOME_FEATURE_CARD_SHADOW = `0 12px 32px ${alpha("#000000", 0.35)}`;

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
          <HomeHeroActions />
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
              const descriptionId = `home-feature-${feature.id}-description`;
              const supportingCopyId = `home-feature-${feature.id}-supporting-copy`;

              return (
                <Grid key={feature.id} item xs={12} md={6}>
                  <Paper
                    component="article"
                    variant="outlined"
                    aria-labelledby={titleId}
                    aria-describedby={`${descriptionId} ${supportingCopyId}`}
                    sx={{
                      minHeight: { xs: 240, md: 280 },
                      height: "100%",
                      overflow: "hidden",
                      boxShadow: HOME_FEATURE_CARD_SHADOW,
                      borderColor: HOME_FEATURE_CARD_BORDER,
                    }}
                  >
                    <Box
                      sx={{
                        height: "100%",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          height: "100%",
                          p: { xs: 4, md: 4.5 },
                          textAlign: "center",
                        }}
                      >
                        <Box
                          sx={{
                            display: "inline-flex",
                            justifyContent: "center",
                            alignItems: "center",
                            width: 84,
                            height: 84,
                            borderRadius: "50%",
                            mb: 2.5,
                            backgroundColor: HOME_FEATURE_ICON_BACKGROUND,
                            border: `1px solid ${HOME_FEATURE_ICON_BORDER}`,
                            boxShadow: HOME_FEATURE_ICON_SHADOW,
                          }}
                        >
                          <Icon
                            aria-hidden="true"
                            color="primary"
                            sx={{ fontSize: 44 }}
                          />
                        </Box>
                        <Typography
                          id={titleId}
                          component="h3"
                          variant="h5"
                          fontWeight={700}
                          gutterBottom
                        >
                          {feature.title}
                        </Typography>
                        <Typography
                          id={descriptionId}
                          variant="body1"
                          color="text.secondary"
                          sx={{ lineHeight: 1.8 }}
                        >
                          {feature.description}
                        </Typography>
                        <Box
                          sx={{
                            mt: "auto",
                            pt: 3,
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Typography
                            id={supportingCopyId}
                            variant="body2"
                            color="primary.light"
                            fontWeight={600}
                            align="center"
                          >
                            {HOME_FEATURE_ENTRY_COPY[feature.id]}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
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
