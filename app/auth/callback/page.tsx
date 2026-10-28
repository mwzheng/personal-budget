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
    return "Hosted sign-in is not configured for this deployment. If you need an account, please contact the site owner.";
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
    <Container maxWidth="sm" sx={{ pt: "10vh", pb: 6, textAlign: "center" }}>
      <Stack spacing={2} alignItems="center" role="status" aria-live="polite">
        <Box
          sx={{
            width: 56,
            height: 56,
            display: "grid",
            placeItems: "center",
            borderRadius: "50%",
            bgcolor: "action.selected",
            color: "primary.main",
          }}
        >
          {error ? "!" : <CircularProgress size={28} />}
        </Box>
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ fontSize: 10, fontWeight: 700, letterSpacing: ".13em" }}
        >
          Porridge Budget
        </Typography>
        <Typography
          component="h1"
          sx={{
            fontFamily: "Georgia, serif",
            fontSize: 34,
            fontWeight: 500,
            lineHeight: 1.2,
          }}
        >
          {error ? "Sign in failed" : "Finishing sign in"}
        </Typography>
        {error ? (
          <>
            <Alert severity="error" sx={{ width: "100%", textAlign: "left" }}>
              {error}
            </Alert>
            <Button variant="contained" href="/auth/login">
              Back to sign in
            </Button>
          </>
        ) : (
          <Typography color="text.secondary" variant="body2">
            Completing your sign-in and preparing your session.
          </Typography>
        )}
      </Stack>
    </Container>
  );
}
