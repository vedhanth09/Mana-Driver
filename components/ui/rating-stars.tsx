"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { RATING_MAX, RATING_MIN } from "@/lib/constants/enums";

type RatingStarsProps = {
  value: number;
  mode?: "input" | "display";
  onChange?: (value: number) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
};

const sizeMap = {
  sm: "size-4",
  md: "size-5",
  lg: "size-7",
};

export function RatingStars({
  value,
  mode = "display",
  onChange,
  size = "md",
  className,
  label,
}: RatingStarsProps) {
  const [hover, setHover] = useState<number | null>(null);
  const interactive = mode === "input";
  const display = hover ?? value;

  const stars = Array.from({ length: RATING_MAX }, (_, i) => i + 1);

  return (
    <div
      className={cn("inline-flex items-center gap-0.5", className)}
      role={interactive ? "radiogroup" : "img"}
      aria-label={label ?? `${value} out of ${RATING_MAX} stars`}
    >
      {stars.map((n) => {
        const filled = n <= display;
        const StarEl = (
          <Star
            className={cn(
              sizeMap[size],
              "transition-colors",
              filled
                ? "fill-status-temporary text-status-temporary"
                : "fill-transparent text-muted-foreground"
            )}
            aria-hidden="true"
          />
        );
        if (!interactive) return <span key={n}>{StarEl}</span>;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(n)}
            onBlur={() => setHover(null)}
            onClick={() => onChange?.(Math.max(RATING_MIN, Math.min(RATING_MAX, n)))}
            className="rounded-sm p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {StarEl}
          </button>
        );
      })}
    </div>
  );
}
