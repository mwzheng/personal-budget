"use client";

import { useRouter } from "next/navigation";
import React from "react";

export default function RegisterPage() {
  const router = useRouter();

  const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN || "";
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "";
  const redirectUri =
    typeof window !== "undefined"
      ? window.location.origin + "/auth/callback"
      : "/auth/callback";

  const signUpHosted = () => {
    if (!domain || !clientId)
      return alert(
        "Hosted Cognito not configured (NEXT_PUBLIC_COGNITO_DOMAIN/NEXT_PUBLIC_COGNITO_CLIENT_ID)",
      );
    // Cognito hosted UI exposes a /signup path for new user sign-up
    const url = `${domain}/signup?response_type=token&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent("openid profile email")}`;
    window.location.href = url;
  };

  const demoRegister = () => {
    // For local/dev, just reuse demo sign-in
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("access_token", "demo-access-token");
      window.sessionStorage.setItem("id_token", "demo-id-token");
      window.sessionStorage.setItem("refresh_token", "demo-refresh-token");
    }
    router.push("/reports");
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Create account</h1>
      <p>
        Use the hosted Cognito registration flow, or create a demo account for
        local development.
      </p>
      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <button onClick={signUpHosted} style={{ padding: "8px 12px" }}>
          Register with Cognito
        </button>
        <button onClick={demoRegister} style={{ padding: "8px 12px" }}>
          Demo register
        </button>
      </div>
    </div>
  );
}
