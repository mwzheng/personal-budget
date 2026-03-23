// Note 1: These tests lock down the host policy that keeps Google Analytics off
// localhost and preview domains, which prevents invalid-domain cookie warnings
// from resurfacing when the analytics bootstrap changes in the future.
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

  it("disables analytics on localhost even when a measurement id exists", () => {
    process.env.NEXT_PUBLIC_GA_ID = "G-TEST123";
    process.env.NEXT_PUBLIC_SITE_URL = "https://porridgebudget.com";

    expect(buildGoogleAnalyticsRuntimeConfig("localhost")).toEqual({
      enabled: false,
      measurementId: null,
      cookieDomain: null,
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

  it("disables analytics on preview hosts outside the canonical domain", () => {
    process.env.NEXT_PUBLIC_GA_ID = "G-TEST123";
    process.env.NEXT_PUBLIC_SITE_URL = "https://porridgebudget.com";

    expect(
      buildGoogleAnalyticsRuntimeConfig("personal-budget-git-main.vercel.app"),
    ).toEqual({
      enabled: false,
      measurementId: null,
      cookieDomain: null,
    });
  });
});
