"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import SignInButton from "@/components/Auth/SignInButton";
import { isAuthenticated, startDemoSession } from "@/lib/auth/cognitoClient";

export default function LoginPage() {
  const router = useRouter();
  const [demoBusy, setDemoBusy] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);
  const cognitoConfigured = Boolean(
    process.env.NEXT_PUBLIC_COGNITO_DOMAIN &&
    process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
  );

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/reports");
    }
  }, [router]);

  const demoSignIn = async () => {
    setDemoBusy(true);
    setDemoError(null);

    try {
      // Note 1: Demo sign-in creates a dedicated browser-only session instead of
      // fake Cognito JWTs. That gives the user realistic sample data across pages
      // while ensuring all writes stay in localStorage and never reach DynamoDB.
      await startDemoSession();
      router.replace("/reports");
    } catch (error) {
      setDemoError(
        error instanceof Error ? error.message : "Failed to start demo mode.",
      );
    } finally {
      setDemoBusy(false);
    }
  };

  // Note 2: Keep login copy provider-neutral so the choice stays focused on
  // saved-account access versus demo mode, not on Cognito-specific branding.
  return (
    <Container
      maxWidth="sm"
      sx={{
        minHeight: "calc(100vh - 128px)",
        display: "flex",
        alignItems: "center",
        py: 6,
      }}
    >
      <Box sx={{ width: "100%" }}>
        <Stack spacing={1} alignItems="center" sx={{ mb: 3 }}>
          <Typography
            variant="h4"
            fontWeight={800}
            align="center"
            sx={{ letterSpacing: "-0.02em" }}
          >
            Welcome back
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center">
            Sign in to access your budget data.
          </Typography>
        </Stack>

        <Paper elevation={1} sx={{ overflow: "hidden" }}>
          <Stack spacing={0} divider={<Divider />}>
            {/* Primary sign-in option */}
            <Box sx={{ p: 3 }}>
              <Stack spacing={2}>
                {!cognitoConfigured && (
                  <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    Hosted sign-in is not configured for this deployment. If you
                    need an account, please contact the site owner.
                  </Alert>
                )}
                <SignInButton
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={!cognitoConfigured}
                >
                  Sign in with account
                </SignInButton>
              </Stack>
            </Box>

            {/* Demo option */}
            <Box sx={{ p: 3, bgcolor: "background.default" }}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Try the demo
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Explore with seeded sample data. No account needed. Changes
                    are not saved.
                  </Typography>
                </Box>
                {demoError ? (
                  <Alert severity="error" sx={{ borderRadius: 2 }}>
                    {demoError}
                  </Alert>
                ) : null}
                <Button
                  variant="outlined"
                  size="large"
                  fullWidth
                  onClick={demoSignIn}
                  disabled={demoBusy}
                >
                  {demoBusy ? "Starting demo…" : "Continue with demo"}
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
}
