"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Try to parse tokens from hash (implicit flow) or query (fallback)
    const parseParams = (str: string) => {
      const params: Record<string, string> = {};
      str.split("&").forEach((pair) => {
        const [k, v] = pair.split("=");
        if (k && v) params[decodeURIComponent(k)] = decodeURIComponent(v);
      });
      return params;
    };

    let params: Record<string, string> = {};
    if (window.location.hash && window.location.hash.length > 1) {
      params = parseParams(window.location.hash.substring(1));
    } else if (window.location.search && window.location.search.length > 1) {
      params = parseParams(window.location.search.substring(1));
    }

    const accessToken = params["access_token"];
    const idToken = params["id_token"];
    const refreshToken = params["refresh_token"];

    if (accessToken || idToken) {
      if (accessToken) sessionStorage.setItem("access_token", accessToken);
      if (idToken) sessionStorage.setItem("id_token", idToken);
      if (refreshToken) sessionStorage.setItem("refresh_token", refreshToken);
      // Navigate to the reports page after successful sign-in
      router.replace("/reports");
    } else {
      // No tokens found - go to login page
      router.replace("/auth/login");
    }
  }, [router]);

  return <div style={{ padding: 24 }}>Signing in...</div>;
}
