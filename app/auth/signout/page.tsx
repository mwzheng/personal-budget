"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import CheckIcon from "@mui/icons-material/Check";
import { useState } from "react";

import { clearDemoStore } from "@/lib/demo/demoData";
import {
  clearCognitoTokens,
  getCognitoLogoutUrl,
  hasStoredCognitoTokens,
} from "@/lib/auth/cognitoClient";

export default function SignOutPage() {
  const [signingOut, setSigningOut] = useState(false);

  const signOut = () => {
    setSigningOut(true);
    const hadRealCognitoSession = hasStoredCognitoTokens();
    clearCognitoTokens();
    clearDemoStore();

    const logoutUrl = hadRealCognitoSession
      ? getCognitoLogoutUrl(window.location.origin)
      : null;
    window.location.href = logoutUrl || "/auth/login";
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: 6,
        textAlign: "center",
      }}
    >
      <Box
        sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}
      >
        <Box
          sx={{
            width: 56,
            height: 56,
            mb: "18px",
            display: "grid",
            placeItems: "center",
            borderRadius: "50%",
            bgcolor: "action.selected",
            color: "primary.main",
          }}
        >
          <CheckIcon />
        </Box>
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ fontSize: 12, fontWeight: 700, letterSpacing: ".13em" }}
        >
          Porridge Budget
        </Typography>
        <Typography
          component="h1"
          sx={{
            my: 1,
            fontFamily: "Georgia, serif",
            fontSize: { xs: 36, sm: 42 },
            fontWeight: 500,
            lineHeight: 1.2,
          }}
        >
          Sign Out
        </Typography>
        <Typography
          color="text.secondary"
          sx={{ maxWidth: 410, mb: "22px", fontSize: 16 }}
        >
          {signingOut
            ? "You will be redirected in a moment."
            : "You are about to end your session."}
        </Typography>
        <Button variant="contained" onClick={signOut} disabled={signingOut}>
          {signingOut ? "Signing Out..." : "Sign Out"}
        </Button>
        <Button href="/reports" disabled={signingOut} sx={{ mt: "10px" }}>
          Stay Signed In
        </Button>
      </Box>
    </Container>
  );
}
