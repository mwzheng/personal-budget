"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Container from "@mui/material/Container";
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
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Create Account
              </Typography>
              <Typography color="text.secondary">
                Complete account setup in the secure account setup window, then
                return here with an active session.
              </Typography>
            </Box>

            {!cognitoConfigured && (
              <Alert severity="warning">
                Hosted account setup is not configured for this deployment. If
                you need to create an account, please contact the site owner.
              </Alert>
            )}

            <Stack spacing={2}>
              <SignInButton
                mode="signup"
                variant="contained"
                size="large"
                fullWidth
                disabled={!cognitoConfigured}
              >
                Create Account
              </SignInButton>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
