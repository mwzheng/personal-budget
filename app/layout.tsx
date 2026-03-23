// Note 1: `app/layout.tsx` is the root layout in the Next.js App Router. It
// wraps every page in the application and renders exactly once. Server
// Components (no "use client" directive) like this file are rendered on the
// server and sent as HTML to the browser before JavaScript hydrates the page.
import type { Metadata } from "next";
import Script from "next/script";
import Box from "@mui/material/Box";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { getGoogleAnalyticsBootstrapConfig } from "@/lib/analytics/google-analytics";
import { AppNav } from "@/components/AppNav";
import { Footer } from "@/components/Footer";
import { APP_NAME, PAGE_TITLES } from "@/lib/content/page-titles";
import { Providers } from "./providers";
import "./globals.css";

// Note 1.5: Metadata URLs need a stable origin so canonical, Open Graph, and
// sitemap URLs resolve consistently in production and local previews.
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://porridgebudget.com"
).replace(/\/+$/, "");

const ROOT_METADATA_DESCRIPTION =
  "Manual-first budgeting app for tracking spending, planning budgets, and reviewing financial progress without hiding the details behind automation.";

// Note 2: The `metadata` export is a special Next.js convention. The framework
// reads it at build time and injects the equivalent `<meta>` and `<title>` tags
// into the `<head>` of every page that does not override them with its own
// `metadata` export. No explicit `<head>` element is needed in JSX.
// Note 2.1: The `icons` property uses the same 🥣 bowl icon as the AppNav for
// a consistent visual identity across the app and browser tab.
export const metadata: Metadata = {
  title: { template: "%s - Porridge Budget", default: "Porridge Budget" },
  metadataBase: new URL(SITE_URL),
  description: ROOT_METADATA_DESCRIPTION,
  applicationName: APP_NAME,
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: APP_NAME,
    description: ROOT_METADATA_DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary",
    title: APP_NAME,
    description: ROOT_METADATA_DESCRIPTION,
  },
  icons: {
    icon: "/favicon.svg",
  },
  // Note: Read the Google site verification token from the environment to avoid
  // hardcoding verification tokens in the repository.
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

// Note 2.2: Only the route/title pairs are serialized into the bootstrap
// script so the initial tab title stays in sync without duplicating page copy.
const INITIAL_PAGE_TITLES = Object.fromEntries(
  Object.values(PAGE_TITLES).map(({ route, title }) => [route, title] as const),
);
const GOOGLE_ANALYTICS_BOOTSTRAP = getGoogleAnalyticsBootstrapConfig();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Note 3: `lang="en"` on the `<html>` element is an accessibility best
    // practice: screen readers use it to select the correct voice/pronunciation
    // profile, and search engines use it for language-aware indexing.
    <html lang="en">
      {/*
        Note 4: `suppressHydrationWarning` on <body> reduces React's hydration
        warnings when server-rendered HTML differs from the client. A common
        cause is browser extensions (e.g. Dark Reader) that inject inline
        styles before React hydrates. To proactively avoid hydration mismatches
        caused by such extensions, an inline script runs before React's
        hydration to strip any Dark Reader style variables from elements.

        The <Script strategy="beforeInteractive"> component ensures the
        cleanup runs before React hydrates client components, but the script
        must avoid reformatting ordinary style attributes because even harmless
        whitespace changes count as hydration mutations.
      */}
      <body suppressHydrationWarning>
        {/*
          Note 5: `AppRouterCacheProvider` is MUI's official App Router bridge for
          Emotion style collection during SSR. Wrapping the body contents here keeps
          server-injected MUI styles and the first client render in sync, which is
          especially important for components like `Tabs` that attach inline styles
          derived from MUI's styling pipeline.
        */}
        <AppRouterCacheProvider>
          <Script id="cleanup-darkreader" strategy="beforeInteractive">
            {`(function cleanupDarkReaderVars(){
  try {
    function clean(){
      document.querySelectorAll('[style]').forEach(function(el){
        var style = el.getAttribute('style');
        if (!style || style.indexOf('--darkreader-') === -1) return;
        var cleaned = style
          .split(';')
          .map(function(s){ return s.trim(); })
          .filter(function(s){ return s && s.indexOf('--darkreader-') === -1; })
          .join('; ');
        if (cleaned) {
          if (cleaned !== style) el.setAttribute('style', cleaned);
        } else {
          el.removeAttribute('style');
        }
      });
    }
    clean();
    setTimeout(clean, 100);
  } catch (e) {
    // Safe no-op if anything goes wrong during early cleanup
  }
})();`}
          </Script>

          {/* Note 5.1: This small bootstrap keeps the first browser-tab title in
              sync with the shared route metadata before hydration and analytics
              initialization happen. */}
          <Script id="page-title-bootstrap" strategy="beforeInteractive">
            {`(function setInitialPageTitle(){
  var pageTitles = ${JSON.stringify(INITIAL_PAGE_TITLES)};
  var fallbackTitle = ${JSON.stringify(APP_NAME)};
  var pathname = window.location.pathname.replace(/\\/+$/, '') || '/';
  document.title = pageTitles[pathname] || fallbackTitle;
})();`}
          </Script>

          {/* Note 6: Google Analytics now opts into a host policy before loading
               gtag.js. That keeps localhost and preview hosts from trying to set
               production cookies while still allowing the canonical site domain
               (from NEXT_PUBLIC_SITE_URL) to share one first-party identifier. */}
          {GOOGLE_ANALYTICS_BOOTSTRAP.measurementId && (
            <Script id="google-analytics-init" strategy="afterInteractive">
              {`(function initializeGoogleAnalytics(){
  var config = ${JSON.stringify(GOOGLE_ANALYTICS_BOOTSTRAP)};
  var hostname = window.location.hostname.toLowerCase().replace(/\\.+$/, "");
  var siteHostname = config.siteHostname;
  var isLocalhost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]";
  var isAllowedHost =
    !siteHostname ||
    hostname === siteHostname ||
    hostname.endsWith("." + siteHostname);
  var runtimeConfig = {
    enabled: Boolean(config.measurementId) && !isLocalhost && isAllowedHost,
    measurementId:
      Boolean(config.measurementId) && !isLocalhost && isAllowedHost
        ? config.measurementId
        : null,
    cookieDomain:
      Boolean(config.measurementId) && !isLocalhost && isAllowedHost
        ? siteHostname || "auto"
        : null,
  };
  window.__PB_ANALYTICS__ = runtimeConfig;
  if (!runtimeConfig.enabled || !runtimeConfig.measurementId) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function () {
      window.dataLayer.push(arguments);
    };
  var analyticsScript = document.querySelector("script[data-porridge-ga='true']");
  if (!analyticsScript) {
    analyticsScript = document.createElement("script");
    analyticsScript.async = true;
    analyticsScript.src =
      "https://www.googletagmanager.com/gtag/js?id=" + runtimeConfig.measurementId;
    analyticsScript.dataset.porridgeGa = "true";
    document.head.appendChild(analyticsScript);
  }
  window.gtag("js", new Date());
  window.gtag("config", runtimeConfig.measurementId, {
    page_path: window.location.pathname,
    page_title: document.title,
    page_location: window.location.href,
    cookie_domain: runtimeConfig.cookieDomain,
  });
})();`}
            </Script>
          )}

          <Providers>
            {/* Note 7: The app shell uses a column flex layout so the footer can
                sit after the page content on every route while still staying at
                the bottom of short signed-out pages. */}
            <Box
              sx={{
                minHeight: "100dvh",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <AppNav />
              <Box component="div" sx={{ flexGrow: 1 }}>
                {children}
              </Box>
              <Footer />
            </Box>
          </Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
