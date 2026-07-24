import type { MetadataRoute } from "next";

import { ROUTE_PATHS } from "@/lib/content/page-titles";

const BASE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://porridge-budgeting.vercel.app"
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
      url: `${BASE_URL}${ROUTE_PATHS.faq}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];
}
