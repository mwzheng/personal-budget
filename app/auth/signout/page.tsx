"use client";

import React, { useEffect } from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

export default function SignOutPage() {
  useEffect(() => {
    try {
      // Clear all sessionStorage entries (token keys vary by implementation).
      // Note 1: We intentionally clear the entire sessionStorage here to ensure
      // client-side token state is removed across the app. If you prefer to
      // only remove specific keys, replace this with individual removes.
      sessionStorage.clear();
    } catch (e) {
      // ignore on server or if access denied
    }

    const cognitoDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
    const cognitoClientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;

    const redirectToLogin = () => {
      // Use full navigation to force a reload and ensure all auth state is reset.
      window.location.href = "/auth/login";
    };

    if (cognitoDomain && cognitoClientId) {
      const logoutUri = encodeURIComponent(
        window.location.origin + "/auth/login",
      );
      const logoutUrl = `https://${cognitoDomain}/logout?client_id=${cognitoClientId}&logout_uri=${logoutUri}`;
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
      <Typography variant="h6">Signing out…</Typography>
    </Box>
  );
}
