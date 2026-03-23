/**
 * Note 1: The layout bootstrap script and client-side route tracker both rely
 * on the same analytics hostname rules. Centralizing those rules here keeps the
 * canonical host, cookie scope, and measurement ID aligned across both paths.
 */
const DEFAULT_SITE_URL = "https://porridgebudget.com";
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
 * Note 3: Returning a disabled config is safer than tracking on localhost or a
 * preview host because those environments can reject GA cookies or pollute the
 * production property with non-customer traffic.
 */
export function buildGoogleAnalyticsRuntimeConfig(
  hostname: string,
  bootstrapConfig: GoogleAnalyticsBootstrapConfig = getGoogleAnalyticsBootstrapConfig(),
): GoogleAnalyticsRuntimeConfig {
  const normalizedHostname = normalizeHostname(hostname);

  if (
    !bootstrapConfig.measurementId ||
    !normalizedHostname ||
    LOCALHOST_HOSTNAMES.has(normalizedHostname)
  ) {
    return getDisabledRuntimeConfig();
  }

  if (
    bootstrapConfig.siteHostname &&
    normalizedHostname !== bootstrapConfig.siteHostname &&
    !normalizedHostname.endsWith(`.${bootstrapConfig.siteHostname}`)
  ) {
    return getDisabledRuntimeConfig();
  }

  return {
    enabled: true,
    measurementId: bootstrapConfig.measurementId,
    cookieDomain: bootstrapConfig.siteHostname ?? "auto",
  };
}
