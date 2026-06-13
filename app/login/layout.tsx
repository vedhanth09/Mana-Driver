import type { Metadata } from "next";

// The login page is a thin utility page with no search value. Keep it out of
// the index (and out of sitemap.ts) so crawl budget stays on the pages that
// should rank.
export const metadata: Metadata = {
  title: "Log In",
  robots: { index: false, follow: true },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
