"use client";

import Box from "@mui/material/Box";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { AppNav } from "@/components/AppNav";
import { Footer } from "@/components/Footer";
import { AUTH_CHANGED_EVENT, isAuthenticated } from "@/lib/auth/cognitoClient";

export function AppFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isPrototype = pathname?.startsWith("/prototypes/") ?? false;
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const check = () => setLoggedIn(isAuthenticated());
    check();
    window.addEventListener("storage", check);
    window.addEventListener(AUTH_CHANGED_EVENT, check);
    return () => {
      window.removeEventListener("storage", check);
      window.removeEventListener(AUTH_CHANGED_EVENT, check);
    };
  }, [pathname]);

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        pl: !isPrototype && loggedIn ? { xs: 0, lg: "248px" } : 0,
        width: "100%",
        minWidth: 0,
        overflowX: "clip",
      }}
    >
      {!isPrototype && <AppNav loggedIn={loggedIn} />}
      <Box component="div" sx={{ flexGrow: 1, minWidth: 0, maxWidth: "100%" }}>
        {children}
      </Box>
      {!isPrototype && <Footer />}
    </Box>
  );
}
