// Note 1: `app/layout.tsx` is the root layout in the Next.js App Router. It
// wraps every page in the application and renders exactly once. Server
// Components (no "use client" directive) like this file are rendered on the
// server and sent as HTML to the browser before JavaScript hydrates the page.
import type { Metadata } from "next";
import Script from "next/script";
import { AppNav } from "@/components/AppNav";
import { Providers } from "./providers";
import "./globals.css";

// Note 2: The `metadata` export is a special Next.js convention. The framework
// reads it at build time and injects the equivalent `<meta>` and `<title>` tags
// into the `<head>` of every page that does not override them with its own
// `metadata` export. No explicit `<head>` element is needed in JSX.
export const metadata: Metadata = {
  title: "Personal Budget",
  description: "Track and analyze your personal spending",
};

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
        cleanup runs before React hydrates client components.
      */}
      <body suppressHydrationWarning>
        <Script id="cleanup-darkreader" strategy="beforeInteractive">
          {`(function cleanupDarkReaderVars(){
  try {
    function clean(){
      document.querySelectorAll('[style]').forEach(function(el){
        var style = el.getAttribute('style');
        if (!style) return;
        var cleaned = style
          .split(';')
          .map(function(s){ return s.trim(); })
          .filter(function(s){ return s && s.indexOf('--darkreader-') === -1; })
          .join('; ');
        if (cleaned !== style) el.setAttribute('style', cleaned);
      });
    }
    clean();
    setTimeout(clean, 100);
  } catch (e) {
    // Safe no-op if anything goes wrong during early cleanup
  }
})();`}
        </Script>

        <Providers>
          <AppNav />
          {children}
        </Providers>
      </body>
    </html>
  );
}
