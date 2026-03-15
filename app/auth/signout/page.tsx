"use client";

import React, { useEffect } from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

import { clearCognitoTokens, getCognitoLogoutUrl } from "@/lib/cognitoClient";

export default function SignOutPage() {
  useEffect(() => {
    clearCognitoTokens();

    const redirectToLogin = () => {
      // Use full navigation to force a reload and ensure all auth state is reset.
      window.location.href = "/auth/login";
    };

    const logoutUrl = getCognitoLogoutUrl(window.location.origin);
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
