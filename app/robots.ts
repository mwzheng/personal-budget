/**
 * Note 1: Next.js Metadata API robots convention — exporting a default
 * function from `app/robots.ts` causes Next.js to serve `/robots.txt`
 * automatically. This keeps crawler rules co-located with the app code
 * and version-controlled alongside route changes.
 *
 * Note 2: The `allow` list mirrors the public pages in the sitemap.
 * The `disallow` list covers auth, API routes, and every authenticated page so
 * crawlers focus on public marketing content instead of gated flows.
 *
 * Note 3: Set `NEXT_PUBLIC_SITE_URL` in your environment to the production
 * domain. The fallback is a placeholder used during local development.
 */

import type { MetadataRoute } from "next";

import { ROUTE_PATHS } from "@/lib/content/page-titles";

const BASE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://porridgebudget.com"
).replace(/\/+$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          ROUTE_PATHS.home,
          ROUTE_PATHS.about,
          ROUTE_PATHS.contact,
          ROUTE_PATHS.faq,
        ],
        disallow: [
          "/api/",
          "/auth/",
          ROUTE_PATHS.reports,
          ROUTE_PATHS.sankey,
          ROUTE_PATHS.progress,
          ROUTE_PATHS.goals,
          ROUTE_PATHS.salary,
        ],
      },
    ],
    host: BASE_URL,
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
