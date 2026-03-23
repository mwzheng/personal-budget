// Note 1: These tests lock down the host-aware cookie policy so Google Analytics
// still works on production, localhost, and preview URLs without falling back
// to an invalid shared domain like `vercel.app`.
import { afterEach, describe, expect, it } from "vitest";

import {
  buildGoogleAnalyticsRuntimeConfig,
  getGoogleAnalyticsBootstrapConfig,
} from "@/lib/analytics/google-analytics";

describe("google analytics host policy", () => {
  const originalGaId = process.env.NEXT_PUBLIC_GA_ID;
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  afterEach(() => {
    if (originalGaId === undefined) {
      delete process.env.NEXT_PUBLIC_GA_ID;
    } else {
      process.env.NEXT_PUBLIC_GA_ID = originalGaId;
    }

    if (originalSiteUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
    }
  });

  it("parses the configured canonical site hostname from NEXT_PUBLIC_SITE_URL", () => {
    process.env.NEXT_PUBLIC_GA_ID = "G-TEST123";
    process.env.NEXT_PUBLIC_SITE_URL = "https://porridgebudget.com/";

    expect(getGoogleAnalyticsBootstrapConfig()).toEqual({
      measurementId: "G-TEST123",
      siteHostname: "porridgebudget.com",
    });
  });

  it("keeps analytics enabled on localhost with a host-only cookie", () => {
    process.env.NEXT_PUBLIC_GA_ID = "G-TEST123";
    process.env.NEXT_PUBLIC_SITE_URL = "https://porridgebudget.com";

    expect(buildGoogleAnalyticsRuntimeConfig("localhost")).toEqual({
      enabled: true,
      measurementId: "G-TEST123",
      cookieDomain: "none",
    });
  });

  it("enables analytics on the canonical host and scopes cookies to that domain", () => {
    process.env.NEXT_PUBLIC_GA_ID = "G-TEST123";
    process.env.NEXT_PUBLIC_SITE_URL = "https://porridgebudget.com";

    expect(buildGoogleAnalyticsRuntimeConfig("porridgebudget.com")).toEqual({
      enabled: true,
      measurementId: "G-TEST123",
      cookieDomain: "porridgebudget.com",
    });
  });

  it("reuses the canonical cookie on matching subdomains", () => {
    process.env.NEXT_PUBLIC_GA_ID = "G-TEST123";
    process.env.NEXT_PUBLIC_SITE_URL = "https://porridgebudget.com";

    expect(buildGoogleAnalyticsRuntimeConfig("www.porridgebudget.com")).toEqual(
      {
        enabled: true,
        measurementId: "G-TEST123",
        cookieDomain: "porridgebudget.com",
      },
    );
  });

  it("keeps analytics enabled on preview hosts with a host-scoped cookie", () => {
    process.env.NEXT_PUBLIC_GA_ID = "G-TEST123";
    process.env.NEXT_PUBLIC_SITE_URL = "https://porridgebudget.com";

    expect(
      buildGoogleAnalyticsRuntimeConfig("personal-budget-git-main.vercel.app"),
    ).toEqual({
      enabled: true,
      measurementId: "G-TEST123",
      cookieDomain: "personal-budget-git-main.vercel.app",
    });
  });
});
