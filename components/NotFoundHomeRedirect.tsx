"use client";

import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { ROUTE_PATHS } from "@/lib/content/page-titles";
import { SERVER_THEME_TOKENS } from "@/lib/theme/server-theme-tokens";

const REDIRECT_DELAY_MS = 5000;
export const NOT_FOUND_REDIRECT_DELAY_SECONDS = REDIRECT_DELAY_MS / 1000;

export function NotFoundHomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.prefetch(ROUTE_PATHS.home);

    const redirectTimer = window.setTimeout(() => {
      router.replace(ROUTE_PATHS.home);
    }, REDIRECT_DELAY_MS);

    return () => {
      window.clearTimeout(redirectTimer);
    };
  }, [router]);

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 640,
        p: 2.25,
        borderRadius: 1,
        border: `1px solid ${alpha(SERVER_THEME_TOKENS.palette.primary, 0.24)}`,
        bgcolor: alpha(SERVER_THEME_TOKENS.palette.primary, 0.08),
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <AccessTimeRoundedIcon
          aria-hidden="true"
          sx={{ color: "primary.main", mt: 0.1 }}
        />
        <Stack spacing={0.75}>
          <Typography
            component="p"
            variant="body2"
            role="status"
            aria-live="polite"
          >
            You’ll be redirected to the home page in about{" "}
            {NOT_FOUND_REDIRECT_DELAY_SECONDS} seconds.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            If nothing happens, use the button below to go back home manually.
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
}
