/**
 * Note 1: Next.js Metadata API sitemap convention — exporting a default
 * function from `app/sitemap.ts` causes Next.js to serve `/sitemap.xml`
 * automatically at build time with no extra route wiring.
 *
 * Only the public marketing pages are listed so search engines spend crawl
 * budget on content pages instead of login and authenticated app routes.
 *
 * Note 2: Set `NEXT_PUBLIC_SITE_URL` in your environment to the production
 * domain (e.g. "https://porridgebudget.com"). The fallback is a placeholder.
 */

import type { MetadataRoute } from "next";

import { ROUTE_PATHS } from "@/lib/content/page-titles";

const BASE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://porridgebudget.com"
).replace(/\/+$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: `${BASE_URL}${ROUTE_PATHS.home}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}${ROUTE_PATHS.about}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}${ROUTE_PATHS.contact}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}${ROUTE_PATHS.faq}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];
}
