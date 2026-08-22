"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

import SignInButton from "@/components/Auth/SignInButton";
import { isAuthenticated } from "@/lib/auth/cognitoClient";

export default function RegisterPage() {
  const router = useRouter();
  const cognitoConfigured = Boolean(
    process.env.NEXT_PUBLIC_COGNITO_DOMAIN &&
    process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
  );

  useEffect(() => {
    // Note 1: Registration stays Cognito-only so demo mode remains a deliberate
    // sign-in shortcut on the login page instead of a second pseudo-registration
    // path that suggests demo data can become a real saved account.
    if (isAuthenticated()) {
      router.replace("/reports");
    }
  }, [router]);

  // Note 2: Keep registration copy provider-neutral so account setup can move
  // behind a different hosted provider later without changing this page's UX.
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
            Create an Account
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center">
            Complete setup in the secure account window, then return here.
          </Typography>
        </Stack>

        <Paper elevation={1} sx={{ p: 3 }}>
          <Stack spacing={3}>
            {!cognitoConfigured && (
              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                Hosted account setup is not configured for this deployment. If
                you need to create an account, please contact the site owner.
              </Alert>
            )}

            <SignInButton
              mode="signup"
              variant="contained"
              size="large"
              fullWidth
              disabled={!cognitoConfigured}
            >
              Get started
            </SignInButton>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
}
