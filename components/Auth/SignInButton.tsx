"use client";
import Button from "@mui/material/Button";
import type { ButtonProps } from "@mui/material/Button";
import React, { useState } from "react";

import {
  CognitoFlowMode,
  startCognitoHostedAuth,
} from "@/lib/auth/cognitoClient";

interface SignInButtonProps extends Omit<ButtonProps, "onClick"> {
  mode?: CognitoFlowMode;
}

function getProviderNeutralStartMessage(error: unknown, mode: CognitoFlowMode) {
  // Note 1: Shared auth labels and alerts stay provider-neutral so the visible UI
  // can remain stable even if the hosted auth provider changes later.
  if (!(error instanceof Error)) {
    return mode === "signup"
      ? "Unable to start account setup."
      : "Unable to start sign-in.";
  }

  if (error.message.includes("not configured")) {
    return "Hosted sign-in is not configured for this deployment. If you need an account, please contact the site owner.";
  }

  if (error.message.includes("browser")) {
    return "Hosted sign-in is only available in the browser.";
  }

  return mode === "signup"
    ? "Unable to start account setup."
    : "Unable to start sign-in.";
}

export default function SignInButton({
  mode = "login",
  children,
  disabled,
  ...buttonProps
}: SignInButtonProps) {
  const [loading, setLoading] = useState(false);

  const onSignIn = async () => {
    setLoading(true);
    try {
      await startCognitoHostedAuth(mode);
    } catch (error) {
      alert(getProviderNeutralStartMessage(error, mode));
      setLoading(false);
    }
  };

  return (
    <Button {...buttonProps} disabled={disabled || loading} onClick={onSignIn}>
      {children || (mode === "signup" ? "Create Account" : "Sign In")}
    </Button>
  );
}
