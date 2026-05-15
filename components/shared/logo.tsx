import { cn } from "@/lib/utils";

type LogoProps = {
  /** Classes for the logo mark (size/color). Defaults to `size-10`. */
  className?: string;
  /** Render the "ManaDriver" wordmark next to the mark. */
  withWordmark?: boolean;
  /** Extra classes for the wordmark text. Typography is inherited by default. */
  wordmarkClassName?: string;
};

/**
 * Brand logo. The mark is rendered from `/public/logo.svg` via a CSS mask so it
 * adopts `currentColor` — it stays visible on light backgrounds (navbar) and
 * dark ones (footer, auth panels) without shipping separate assets.
 */
export function Logo({
  className,
  withWordmark = false,
  wordmarkClassName,
}: LogoProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden="true"
        className={cn("inline-block shrink-0 bg-current", className ?? "size-12")}
        style={{
          WebkitMaskImage: "url(/logo.svg)",
          maskImage: "url(/logo.svg)",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          WebkitMaskSize: "contain",
          maskSize: "contain",
        }}
      />
      {withWordmark && (
        <span className={cn("font-bold tracking-tight", wordmarkClassName)}>
          ManaDriver
        </span>
      )}
    </span>
  );
}
