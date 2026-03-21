/**
 * Note N: Public home page for unauthenticated users. Signed-in users are
 * redirected to /reports using client-side tokens in sessionStorage. For
 * server-side enforcement, consider adding `middleware.ts`.
 */

"use client";

import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import BarChartIcon from "@mui/icons-material/BarChart";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SavingsIcon from "@mui/icons-material/Savings";
import Typography from "@mui/material/Typography";

import { HOME_PAGE_CONTENT } from "@/lib/content/home";

const HOME_FEATURE_ICONS = {
  transactions: ReceiptLongIcon,
  budgets: SavingsIcon,
  reports: BarChartIcon,
  budget: AutoGraphIcon,
} as const;

export default function Home() {
  // Note N: Keep the home page public so users can always recover navigation
  // by returning to `/`, even when authentication state is stale.
  const { features, hero } = HOME_PAGE_CONTENT;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 9, md: 12 } }}>
      <Box
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

      <Grid container spacing={3} sx={{ pt: { xs: 2, md: 3 } }}>
        {features.map((feature) => {
          const Icon = HOME_FEATURE_ICONS[feature.id];

          return (
            <Grid key={feature.id} item xs={12} md={6}>
              <Paper
                variant="outlined"
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
                  <Icon color="primary" sx={{ fontSize: 52 }} />
                </Box>
                <Typography
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

      {/* Note N: Intentionally no quick-action auth buttons on this landing page. */}
    </Container>
  );
}
