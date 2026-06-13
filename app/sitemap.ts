import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants/site";

/**
 * Last-modified date for the public marketing pages. Bump a route's date only
 * when its content meaningfully changes — crawlers learn to distrust a
 * `lastmod` that updates on every deploy, so a stable, honest date is better
 * for SEO than `new Date()`.
 */
const LAST_MODIFIED = "2026-06-13";

/**
 * Only public, indexable ranking targets belong here. Authenticated areas
 * (`/driver`, `/customer`) and the API are disallowed in robots.ts, and the
 * thin utility pages (`/login`, `/forgot-password`) are marked noindex in
 * their route layouts — so none of them are listed here.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/signup`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "yearly",
      priority: 0.8,
    },
  ];
}
