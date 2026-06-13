import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { Toaster } from "@/components/ui/sonner";
import { SITE_URL } from "@/lib/constants/site";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ManaDriver — On-Demand Professional Drivers for Your Car",
    template: "%s | ManaDriver",
  },
  description:
    "Your Car. A Professional Driver. On Demand. Book a trusted driver in minutes — hourly, temporary, or permanent.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "ManaDriver",
    url: "/",
    title: "ManaDriver — On-Demand Professional Drivers for Your Car",
    description:
      "Book a trusted, background-verified driver for your own car — by the hour, temporarily, or permanently. Serving cities across India.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ManaDriver — On-Demand Professional Drivers for Your Car",
    description:
      "Book a trusted, background-verified driver for your own car — by the hour, temporarily, or permanently.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col bg-background text-foreground font-sans"
        suppressHydrationWarning
      >
        <NotificationProvider>{children}</NotificationProvider>
        <Toaster />
      </body>
    </html>
  );
}
