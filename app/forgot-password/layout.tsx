import type { Metadata } from "next";

// Password-reset flow — a thin utility page with no search value. Keep it out
// of the index (and out of sitemap.ts) so crawl budget stays on the pages that
// should rank.
export const metadata: Metadata = {
  title: "Reset Password",
  robots: { index: false, follow: true },
};

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
