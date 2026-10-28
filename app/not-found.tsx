import type { Metadata } from "next";
import NextLink from "next/link";
import CheckIcon from "@mui/icons-material/Check";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";

import { ROUTE_PATHS } from "@/lib/content/page-titles";

export const metadata: Metadata = {
  title: "Page not found",
  description:
    "The requested page could not be found. Return to the Porridge Budget home page to keep browsing.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFoundPage() {
  return (
    <Container
      component="main"
      maxWidth={false}
      sx={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: { xs: 2.75, md: 7.25 },
        py: 6,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          maxWidth: 520,
          mx: "auto",
          textAlign: "center",
        }}
      >
        <Box
          aria-hidden="true"
          sx={{
            width: 56,
            height: 56,
            mb: "18px",
            display: "grid",
            placeItems: "center",
            borderRadius: "50%",
            bgcolor: "action.selected",
            color: "primary.main",
          }}
        >
          <CheckIcon />
        </Box>
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ fontSize: 12, fontWeight: 700, letterSpacing: ".13em" }}
        >
          Porridge Budget
        </Typography>
        <Typography
          component="h1"
          sx={{
            my: 1,
            fontFamily: "Georgia, serif",
            fontSize: { xs: 36, sm: 42 },
            fontWeight: 500,
            lineHeight: 1.2,
          }}
        >
          We couldn&apos;t find that page
        </Typography>
        <Typography
          color="text.secondary"
          sx={{ maxWidth: 410, mb: "22px", fontSize: 16 }}
        >
          The address may be out of date, or the page may have moved.
        </Typography>
        <Button
          component={NextLink}
          href={ROUTE_PATHS.home}
          variant="contained"
          sx={{ minHeight: 40, px: "15px", fontSize: 14 }}
        >
          Go to Home
        </Button>
      </Box>
    </Container>
  );
}
