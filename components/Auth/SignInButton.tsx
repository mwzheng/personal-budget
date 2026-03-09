"use client";
import Button from "@mui/material/Button";
import type { ButtonProps } from "@mui/material/Button";
import React, { useState } from "react";

import { CognitoFlowMode, startCognitoHostedAuth } from "@/lib/cognitoClient";

interface SignInButtonProps extends Omit<ButtonProps, "onClick"> {
  mode?: CognitoFlowMode;
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
      const message =
        error instanceof Error
          ? error.message
          : "Unable to start Cognito sign-in.";
      alert(message);
      setLoading(false);
    }
  };

  return (
    <Button {...buttonProps} disabled={disabled || loading} onClick={onSignIn}>
      {children ||
        (mode === "signup"
          ? "Create account with Cognito"
          : "Sign in with Cognito")}
    </Button>
  );
}
