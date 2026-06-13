/**
 * Canonical site origin used for all SEO metadata (sitemap, robots, canonical
 * and Open Graph URLs). Set NEXT_PUBLIC_BASE_URL to the production origin
 * (e.g. https://manadriver.com) in deployed environments; it falls back to
 * localhost for local development. The trailing slash is stripped so callers
 * can safely build paths with `${SITE_URL}/...`.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");
