// Note 1: These tests lock down the host-aware cookie policy so Google Analytics
// still works on production, localhost, and preview URLs without falling back
// to an invalid shared domain like `vercel.app`.
import { afterEach, describe, expect, it } from "vitest";

import {
  buildGoogleAnalyticsPageViewPayload,
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
    process.env.NEXT_PUBLIC_SITE_URL = "https://porridge-budgeting.vercel.app/";

    expect(getGoogleAnalyticsBootstrapConfig()).toEqual({
      measurementId: "G-TEST123",
      siteHostname: "porridge-budgeting.vercel.app",
    });
  });

  it("keeps analytics enabled on localhost with a host-only cookie", () => {
    process.env.NEXT_PUBLIC_GA_ID = "G-TEST123";
    process.env.NEXT_PUBLIC_SITE_URL = "https://porridge-budgeting.vercel.app";

    expect(buildGoogleAnalyticsRuntimeConfig("localhost")).toEqual({
      enabled: true,
      measurementId: "G-TEST123",
      cookieDomain: "none",
    });
  });

  it("enables analytics on the canonical host and scopes cookies to that domain", () => {
    process.env.NEXT_PUBLIC_GA_ID = "G-TEST123";
    process.env.NEXT_PUBLIC_SITE_URL = "https://porridge-budgeting.vercel.app";

    expect(
      buildGoogleAnalyticsRuntimeConfig("porridge-budgeting.vercel.app"),
    ).toEqual({
      enabled: true,
      measurementId: "G-TEST123",
      cookieDomain: "porridge-budgeting.vercel.app",
    });
  });

  it("builds explicit GA4 page_view payloads with the expected field names", () => {
    expect(
      buildGoogleAnalyticsPageViewPayload(
        "/reports",
        "Reports - Porridge Budget",
        "https://porridge-budgeting.vercel.app/reports",
      ),
    ).toEqual({
      page_path: "/reports",
      page_title: "Reports - Porridge Budget",
      page_location: "https://porridge-budgeting.vercel.app/reports",
    });
  });

  it("reuses the canonical cookie on matching subdomains", () => {
    process.env.NEXT_PUBLIC_GA_ID = "G-TEST123";
    process.env.NEXT_PUBLIC_SITE_URL = "https://porridge-budgeting.vercel.app";

    expect(
      buildGoogleAnalyticsRuntimeConfig("www.porridge-budgeting.vercel.app"),
    ).toEqual({
      enabled: true,
      measurementId: "G-TEST123",
      cookieDomain: "porridge-budgeting.vercel.app",
    });
  });

  it("keeps analytics enabled on preview hosts with a host-scoped cookie", () => {
    process.env.NEXT_PUBLIC_GA_ID = "G-TEST123";
    process.env.NEXT_PUBLIC_SITE_URL = "https://porridge-budgeting.vercel.app";

    expect(
      buildGoogleAnalyticsRuntimeConfig("personal-budget-git-main.vercel.app"),
    ).toEqual({
      enabled: true,
      measurementId: "G-TEST123",
      cookieDomain: "personal-budget-git-main.vercel.app",
    });
  });

  // Note 2: When no measurement ID is configured the runtime config must be
  // fully disabled regardless of the current hostname so no GA network call is
  // ever made from a misconfigured deployment.
  it("returns a fully disabled config when NEXT_PUBLIC_GA_ID is not set", () => {
    delete process.env.NEXT_PUBLIC_GA_ID;
    process.env.NEXT_PUBLIC_SITE_URL = "https://porridge-budgeting.vercel.app";

    expect(
      buildGoogleAnalyticsRuntimeConfig("porridge-budgeting.vercel.app"),
    ).toEqual({
      enabled: false,
      measurementId: null,
      cookieDomain: null,
    });
  });

  // Note 3: IPv4 addresses and bare hostnames without dots must use the
  // host-only cookie scope ("none") because browsers reject a cookie domain
  // that is an IP address or contains no dot separator.
  it("uses a host-only cookie scope for IPv4 address hosts", () => {
    process.env.NEXT_PUBLIC_GA_ID = "G-TEST123";
    process.env.NEXT_PUBLIC_SITE_URL = "https://porridge-budgeting.vercel.app";

    expect(buildGoogleAnalyticsRuntimeConfig("192.168.1.100")).toEqual({
      enabled: true,
      measurementId: "G-TEST123",
      cookieDomain: "none",
    });
  });

  it("uses a host-only cookie scope for bare hostnames without a dot", () => {
    process.env.NEXT_PUBLIC_GA_ID = "G-TEST123";
    process.env.NEXT_PUBLIC_SITE_URL = "https://porridge-budgeting.vercel.app";

    expect(buildGoogleAnalyticsRuntimeConfig("devbox")).toEqual({
      enabled: true,
      measurementId: "G-TEST123",
      cookieDomain: "none",
    });
  });
});
