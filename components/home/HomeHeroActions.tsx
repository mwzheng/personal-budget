"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";

import { AUTH_CHANGED_EVENT, isAuthenticated } from "@/lib/auth/cognitoClient";
import { ROUTE_PATHS } from "@/lib/content/page-titles";

export default function HomeHeroActions() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const checkToken = () => setLoggedIn(isAuthenticated());

    checkToken();

    const onStorage = () => checkToken();
    const onAuthChanged = () => checkToken();

    window.addEventListener("storage", onStorage);
    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    };
  }, []);

  if (loggedIn === null) {
    return null;
  }

  if (loggedIn) {
    return (
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        justifyContent="center"
        alignItems="center"
      >
        <Button
          component={NextLink}
          href={ROUTE_PATHS.reports}
          variant="contained"
          size="large"
          sx={{ minWidth: { sm: 180 } }}
        >
          Go to Dashboard
        </Button>
      </Stack>
    );
  }

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
      justifyContent="center"
      alignItems="center"
    >
      <Button
        component={NextLink}
        href={ROUTE_PATHS.login}
        variant="contained"
        size="large"
        sx={{ minWidth: { sm: 180 } }}
      >
        Try Demo
      </Button>
      <Button
        component={NextLink}
        href={ROUTE_PATHS.login}
        variant="outlined"
        size="large"
        sx={{ minWidth: { sm: 180 } }}
      >
        Sign In
      </Button>
    </Stack>
  );
}
