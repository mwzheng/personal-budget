"use client";

// Note 1: Demo sign-out clears browser-local sample data immediately and skips the
// hosted Cognito logout redirect unless a real Cognito session existed. That keeps
// demo users from bouncing through the identity provider for a session that never
// left the browser in the first place.
import React, { useEffect } from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

import { clearDemoStore } from "@/lib/demo/demoData";
import {
  clearCognitoTokens,
  getCognitoLogoutUrl,
  hasStoredCognitoTokens,
} from "@/lib/auth/cognitoClient";

export default function SignOutPage() {
  useEffect(() => {
    const hadRealCognitoSession = hasStoredCognitoTokens();
    clearCognitoTokens();
    clearDemoStore();

    const redirectToLogin = () => {
      // Use full navigation to force a reload and ensure all auth state is reset.
      window.location.href = "/auth/login";
    };

    const logoutUrl = hadRealCognitoSession
      ? getCognitoLogoutUrl(window.location.origin)
      : null;
    if (logoutUrl) {
      window.location.href = logoutUrl;
    } else {
      redirectToLogin();
    }
  }, []);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "60vh",
      }}
    >
      <Typography variant="h6">Signing Out…</Typography>
    </Box>
  );
}
