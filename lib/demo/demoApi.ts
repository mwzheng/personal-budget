"use client";

/**
 * Note 1: Demo mode works by emulating the app's JSON API in the browser. That
 * lets the existing pages keep their normal `apiFetch("/api/...")` calls while
 * transparently reading and writing a seeded localStorage snapshot instead of
 * touching Cognito-protected DynamoDB routes.
 *
 * Note 2: This file is now a thin dispatcher. Domain-specific request handling
 * lives in `./handlers/*Handlers.ts` modules; shared HTTP helpers live in
 * `./handlers/handlerUtils.ts`. The public API (`handleDemoApiRequest`) is
 * unchanged so no consumers need updating.
 */

import { handleTransactionRoutes } from "./handlers/transactionHandlers";
import { handleBudgetRoutes } from "./handlers/budgetHandlers";
import { handleGoalRoutes } from "./handlers/goalHandlers";
import { handleSalaryRoutes } from "./handlers/salaryHandlers";
import { handleProgressRoutes } from "./handlers/progressHandlers";
import { jsonResponse, type HandlerContext } from "./handlers/handlerUtils";

function resolveUrl(input: RequestInfo | URL): URL {
  if (typeof input === "string") {
    return new URL(input, window.location.origin);
  }

  if (input instanceof URL) {
    return new URL(input.toString(), window.location.origin);
  }

  return new URL(input.url, window.location.origin);
}

function resolveMethod(input: RequestInfo | URL, init?: RequestInit): string {
  if (init?.method) {
    return init.method.toUpperCase();
  }

  if (input instanceof Request) {
    return input.method.toUpperCase();
  }

  return "GET";
}

// Note 3: Handlers are tried in order; the first non-null response wins.
// Each handler returns `null` when the route does not belong to its domain.
const handlers = [
  handleTransactionRoutes,
  handleSalaryRoutes,
  handleProgressRoutes,
  handleGoalRoutes,
  handleBudgetRoutes,
];

export async function handleDemoApiRequest(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const url = resolveUrl(input);
  const method = resolveMethod(input, init);
  const ctx: HandlerContext = { url, method, input, init };

  for (const handler of handlers) {
    const response = await handler(ctx);
    if (response) {
      return response;
    }
  }

  return jsonResponse(
    {
      ok: false,
      error: `Demo mode does not handle ${method} ${url.pathname}`,
    },
    { status: 404 },
  );
}
