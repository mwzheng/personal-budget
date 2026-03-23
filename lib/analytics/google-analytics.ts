/**
 * Note 1: The layout bootstrap script and client-side route tracker both rely
 * on the same analytics hostname rules. Centralizing those rules here keeps the
 * canonical host, cookie scope, and measurement ID aligned across both paths.
 */
const DEFAULT_SITE_URL = "https://porridgebudget.com";
const IPV4_HOSTNAME_PATTERN = /^\d{1,3}(?:\.\d{1,3}){3}$/;
const LOCALHOST_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export type GoogleAnalyticsBootstrapConfig = Readonly<{
  measurementId: string | null;
  siteHostname: string | null;
}>;

export type GoogleAnalyticsRuntimeConfig = Readonly<{
  enabled: boolean;
  measurementId: string | null;
  cookieDomain: string | null;
}>;

function normalizeHostname(hostname?: string | null): string | null {
  const normalized = hostname?.trim().toLowerCase().replace(/\.+$/, "");
  return normalized ? normalized : null;
}

function getConfiguredSiteHostname(): string | null {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL).trim();

  if (!siteUrl) return null;

  const normalizedSiteUrl = /^[a-z][a-z0-9+.-]*:\/\//i.test(siteUrl)
    ? siteUrl
    : `https://${siteUrl}`;
  const hostname = normalizedSiteUrl
    .replace(/^[a-z][a-z0-9+.-]*:\/\//i, "")
    .split(/[/?#]/, 1)[0]
    .replace(/:\d+$/, "");

  return normalizeHostname(hostname);
}

function getDisabledRuntimeConfig(): GoogleAnalyticsRuntimeConfig {
  return {
    enabled: false,
    measurementId: null,
    cookieDomain: null,
  };
}

function usesHostOnlyCookies(hostname: string): boolean {
  return (
    LOCALHOST_HOSTNAMES.has(hostname) ||
    !hostname.includes(".") ||
    IPV4_HOSTNAME_PATTERN.test(hostname) ||
    hostname.includes(":")
  );
}

/**
 * Note 2: The root layout serializes this bootstrap payload into an inline
 * script so the browser can decide whether analytics should start on the
 * current host before it loads the remote Google tag script.
 */
export function getGoogleAnalyticsBootstrapConfig(): GoogleAnalyticsBootstrapConfig {
  return {
    measurementId: process.env.NEXT_PUBLIC_GA_ID?.trim() || null,
    siteHostname: getConfiguredSiteHostname(),
  };
}

/**
 * Note 3: The runtime config now keeps analytics active on production, preview,
 * and localhost hosts, but it picks a cookie scope that each environment can
 * actually accept. That prevents invalid-domain warnings without disabling GA.
 */
export function buildGoogleAnalyticsRuntimeConfig(
  hostname: string,
  bootstrapConfig: GoogleAnalyticsBootstrapConfig = getGoogleAnalyticsBootstrapConfig(),
): GoogleAnalyticsRuntimeConfig {
  const normalizedHostname = normalizeHostname(hostname);

  if (!bootstrapConfig.measurementId || !normalizedHostname) {
    return getDisabledRuntimeConfig();
  }

  if (usesHostOnlyCookies(normalizedHostname)) {
    return {
      enabled: true,
      measurementId: bootstrapConfig.measurementId,
      cookieDomain: "none",
    };
  }

  if (
    bootstrapConfig.siteHostname &&
    (normalizedHostname === bootstrapConfig.siteHostname ||
      normalizedHostname.endsWith(`.${bootstrapConfig.siteHostname}`))
  ) {
    return {
      enabled: true,
      measurementId: bootstrapConfig.measurementId,
      cookieDomain: bootstrapConfig.siteHostname,
    };
  }

  return {
    enabled: true,
    measurementId: bootstrapConfig.measurementId,
    cookieDomain: normalizedHostname,
  };
}
