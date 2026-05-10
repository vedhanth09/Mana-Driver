import Link from "next/link";
import { Car } from "lucide-react";
import { CITIES } from "@/lib/constants/cities";

/* Brand-glyph icons (lucide-react no longer ships brand marks) */
function TwitterGlyph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
function LinkedInGlyph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.45zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zm1.78 13.02H3.55V9h3.57zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}
function InstagramGlyph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.15-3.23 1.66-4.77 4.92-4.92C8.42 2.17 8.8 2.16 12 2.16zm0-2.16C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95C23.73 2.69 21.31.27 16.95.07 15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zm0 10.16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.41-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z" />
    </svg>
  );
}
function FacebookGlyph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.408.593 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.099 1.893-4.787 4.658-4.787 1.325 0 2.464.099 2.795.143v3.24h-1.918c-1.504 0-1.795.715-1.795 1.764v2.31h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.592 1.323-1.324V1.325C24 .593 23.408 0 22.675 0z" />
    </svg>
  );
}

const FOOTER_COLUMNS = [
  {
    heading: "About",
    links: [
      { label: "About Us", href: "/#about" },
      { label: "Careers", href: "#" },
      { label: "Press", href: "#" },
      { label: "Blog", href: "#" },
    ],
  },
  {
    heading: "Services",
    links: [
      { label: "Hourly Rides", href: "/#services" },
      { label: "Temporary Drivers", href: "/#services" },
      { label: "Permanent Drivers", href: "/#services" },
      { label: "Business Solutions", href: "/#business" },
    ],
  },
  {
    heading: "Contact",
    links: [
      { label: "Sales", href: "mailto:hello@manadriver.example" },
      { label: "Partner with Us", href: "#" },
      { label: "Press", href: "#" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "Help Center", href: "#" },
      { label: "Safety", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Privacy Policy", href: "#" },
    ],
  },
] as const;

const SOCIAL_LINKS = [
  { Icon: TwitterGlyph, label: "Twitter", href: "#" },
  { Icon: LinkedInGlyph, label: "LinkedIn", href: "#" },
  { Icon: InstagramGlyph, label: "Instagram", href: "#" },
  { Icon: FacebookGlyph, label: "Facebook", href: "#" },
];

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-8 md:px-8">
        <div className="grid grid-cols-1 gap-10 border-b border-white/10 pb-12 sm:grid-cols-2 md:grid-cols-6">
          {/* Brand column */}
          <div className="md:col-span-2">
            <Link
              href="/"
              className="flex items-center gap-2 text-h2 font-bold"
            >
              <Car className="size-7" aria-hidden="true" />
              <span>ManaDriver</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-primary-foreground/70">
              Your car. A professional driver. On demand. Hourly, temporary, or
              permanent — verified drivers across India.
            </p>
            <div className="mt-6 flex gap-3">
              {SOCIAL_LINKS.map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex size-9 items-center justify-center rounded-full bg-white/10 text-primary-foreground transition-colors hover:bg-white/20"
                >
                  <Icon className="size-4" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.heading}>
              <h4 className="mb-5 text-sm font-bold tracking-wide uppercase">
                {col.heading}
              </h4>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-primary-foreground/70 transition-colors hover:text-primary-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="mb-5 text-sm font-bold tracking-wide uppercase">
              Cities
            </h4>
            <ul className="grid grid-cols-1 gap-2">
              {CITIES.slice(0, 6).map((city) => (
                <li key={city}>
                  <span className="text-sm text-primary-foreground/70">
                    {city}
                  </span>
                </li>
              ))}
              <li>
                <span className="text-xs text-primary-foreground/50">
                  + {CITIES.length - 6} more
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-4 pt-6 md:flex-row md:items-center">
          <p className="text-xs text-primary-foreground/50">
            © {new Date().getFullYear()} ManaDriver Technologies Pvt. Ltd. All
            rights reserved.
          </p>
          <p className="text-xs text-primary-foreground/50">
            Made for India · English (India)
          </p>
        </div>
      </div>
    </footer>
  );
}
