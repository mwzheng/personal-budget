import type { Metadata } from "next";
import NextLink from "next/link";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";

import { NotFoundHomeRedirect } from "@/components/NotFoundHomeRedirect";
import { ROUTE_PATHS } from "@/lib/content/page-titles";
import { SERVER_THEME_TOKENS } from "@/lib/theme/server-theme-tokens";

const NOT_FOUND_PAGE_DESCRIPTION =
  "The requested page could not be found. Return to the Porridge Budget home page to keep browsing.";
const NOT_FOUND_PANEL_BACKGROUND = `radial-gradient(circle at top, ${alpha(
  SERVER_THEME_TOKENS.palette.primary,
  0.2,
)} 0%, ${alpha(SERVER_THEME_TOKENS.palette.backgroundPaper, 0.98)} 46%, ${
  SERVER_THEME_TOKENS.palette.backgroundPaper
} 100%)`;
const NOT_FOUND_PANEL_BORDER = alpha(SERVER_THEME_TOKENS.palette.primary, 0.28);
const NOT_FOUND_CODE_COLOR = alpha("#ffffff", 0.22);

export const metadata: Metadata = {
  title: "Page not found",
  description: NOT_FOUND_PAGE_DESCRIPTION,
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFoundPage() {
  return (
    <Container component="main" maxWidth="md" sx={{ py: { xs: 10, md: 14 } }}>
      <Paper
        component="section"
        variant="outlined"
        aria-labelledby="not-found-title"
        sx={{
          overflow: "hidden",
          p: { xs: 3, sm: 4, md: 5 },
          borderColor: NOT_FOUND_PANEL_BORDER,
          background: NOT_FOUND_PANEL_BACKGROUND,
        }}
      >
        <Stack spacing={3.5} alignItems="flex-start">
          <Box
            aria-hidden="true"
            sx={{
              fontSize: { xs: "4rem", md: "5rem" },
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: 6,
              color: NOT_FOUND_CODE_COLOR,
            }}
          >
            404
          </Box>

          <Stack spacing={1.5}>
            <Typography
              variant="overline"
              color="primary.light"
              sx={{ letterSpacing: 1.3 }}
            >
              Page not found
            </Typography>
            <Typography
              id="not-found-title"
              component="h1"
              variant="h3"
              sx={{ maxWidth: 560 }}
            >
              We couldn’t find that page.
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: 640, lineHeight: 1.8 }}
            >
              The page may have moved, the address may be mistyped, or the link
              may no longer exist. We’ll send you back to the home page
              automatically so you can keep browsing.
            </Typography>
          </Stack>

          <NotFoundHomeRedirect />

          <Button
            component={NextLink}
            href={ROUTE_PATHS.home}
            variant="contained"
            size="large"
            startIcon={<ArrowBackRoundedIcon />}
          >
            Back to home
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
