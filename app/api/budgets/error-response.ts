import { NextResponse } from "next/server";

function isAuthorizationError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes("Missing or invalid Authorization header")
  );
}

export function budgetRouteErrorResponse(
  error: unknown,
  fallbackStatus: 400 | 401,
  fallbackMessage: string,
) {
  if (isAuthorizationError(error)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  return NextResponse.json(
    { ok: false, error: fallbackMessage },
    { status: fallbackStatus },
  );
}

export function budgetRouteUnauthorizedResponse() {
  return NextResponse.json(
    { ok: false, error: "Unauthorized" },
    { status: 401 },
  );
}
