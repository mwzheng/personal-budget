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
} from "@/lib/auth/cognitoClient";

function getProviderNeutralCallbackMessage(callbackError: unknown) {
  // Note 1: Callback status and error copy stay provider-neutral so the hosted
  // auth backend can change without leaking provider branding into the UI.
  if (!(callbackError instanceof Error)) {
    return "Unable to complete sign-in.";
  }

  if (callbackError.message.includes("not configured")) {
    return "Hosted sign-in is not configured. Set NEXT_PUBLIC_COGNITO_DOMAIN and NEXT_PUBLIC_COGNITO_CLIENT_ID.";
  }

  if (callbackError.message.includes("only run in the browser")) {
    return "Hosted sign-in can only finish in the browser.";
  }

  return [
    ["Cognito authorization code", "authorization code"],
    ["Cognito callback response", "sign-in callback response"],
    ["from Cognito", "from the sign-in service"],
    ["Cognito sign-in flow", "sign-in flow"],
    ["Cognito", "hosted sign-in"],
  ].reduce(
    (message, [searchValue, replaceValue]) =>
      message.replaceAll(searchValue, replaceValue),
    callbackError.message,
  );
}

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
          setError(getProviderNeutralCallbackMessage(callbackError));
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
              Completing your sign-in and preparing your session.
            </Typography>
          </>
        )}
      </Stack>
    </Container>
  );
}
