"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  clearPendingCognitoAuth,
  handleCognitoCallback,
} from "@/lib/cognitoClient";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const completeSignIn = async () => {
      try {
        await handleCognitoCallback();
        if (!cancelled) {
          router.replace("/reports");
        }
      } catch (callbackError) {
        clearPendingCognitoAuth();
        if (!cancelled) {
          setError(
            callbackError instanceof Error
              ? callbackError.message
              : "Unable to complete the Cognito sign-in flow.",
          );
        }
      }
    };

    void completeSignIn();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Stack spacing={3} alignItems="center" textAlign="center">
        {error ? (
          <>
            <Typography variant="h4" fontWeight={700}>
              Sign-In Failed
            </Typography>
            <Alert severity="error" sx={{ width: "100%" }}>
              {error}
            </Alert>
            <Button variant="contained" href="/auth/login">
              Back to Sign In
            </Button>
          </>
        ) : (
          <>
            <Box>
              <CircularProgress />
            </Box>
            <Typography variant="h5" fontWeight={700}>
              Finishing Sign-In
            </Typography>
            <Typography color="text.secondary">
              Exchanging your Cognito authorization code for tokens.
            </Typography>
          </>
        )}
      </Stack>
    </Container>
  );
}
