import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type LoaderProps = {
  size?: "sm" | "md" | "lg";
  label?: string;
  fullscreen?: boolean;
  className?: string;
};

const sizeMap = {
  sm: "size-4",
  md: "size-6",
  lg: "size-10",
};

export function Loader({
  size = "md",
  label = "Loading…",
  fullscreen = false,
  className,
}: LoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center justify-center gap-2 text-muted-foreground",
        fullscreen && "min-h-[60vh] w-full",
        className
      )}
    >
      <Loader2 className={cn("animate-spin text-primary", sizeMap[size])} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
