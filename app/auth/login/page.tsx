"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Container from "@mui/material/Container";
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
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Sign In
              </Typography>
              <Typography color="text.secondary">
                Continue with your saved account to access your budget data.
              </Typography>
            </Box>

            {!cognitoConfigured && (
              <Alert severity="warning">
                Hosted sign-in is not configured for this deployment. If you
                need an account, please contact the site owner.
              </Alert>
            )}

            <Alert severity="info">
              Demo Sign In loads seeded sample data in this browser only. Demo
              changes are not saved.
            </Alert>

            {demoError ? <Alert severity="error">{demoError}</Alert> : null}

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <SignInButton
                variant="contained"
                size="large"
                fullWidth
                disabled={!cognitoConfigured}
              >
                Sign In
              </SignInButton>
              <Button
                variant="outlined"
                size="large"
                fullWidth
                onClick={demoSignIn}
                disabled={demoBusy}
              >
                {demoBusy ? "Starting Demo…" : "Demo Sign In"}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
