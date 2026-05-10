import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: ReactNode;
  imageSrc?: string;
  imageAlt?: string;
  title: string;
  message?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  icon,
  imageSrc,
  imageAlt,
  title,
  message,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center",
        className
      )}
    >
      {imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt={imageAlt ?? ""}
          className="mb-2 h-32 w-auto object-contain opacity-80"
        />
      ) : icon ? (
        <div className="mb-1 flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
      ) : null}
      <h3 className="text-h3 font-semibold text-foreground">{title}</h3>
      {message && (
        <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
