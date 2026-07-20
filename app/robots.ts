import type { MetadataRoute } from "next";

import { ROUTE_PATHS } from "@/lib/content/page-titles";

const BASE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://porridge-budgeting.vercel.app"
).replace(/\/+$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [ROUTE_PATHS.home, ROUTE_PATHS.about, ROUTE_PATHS.faq],
        disallow: [
          "/api/",
          "/auth/",
          ROUTE_PATHS.reports,
          ROUTE_PATHS.budget,
          ROUTE_PATHS.progress,
          ROUTE_PATHS.salary,
        ],
      },
    ],
    host: BASE_URL,
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
