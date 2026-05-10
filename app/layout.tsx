import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { Toaster } from "@/components/ui/sonner";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ManaDriver",
  description:
    "Your Car. A Professional Driver. On Demand. Book a trusted driver in minutes — hourly, temporary, or permanent.",
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
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <NotificationProvider>{children}</NotificationProvider>
        <Toaster />
      </body>
    </html>
  );
}
