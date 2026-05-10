"use client";

import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApiClientError } from "@/lib/api";
import { cn } from "@/lib/utils";

export type ApiErrorProps = {
  error: unknown;
  onRetry?: () => void;
  className?: string;
  compact?: boolean;
};

export function getErrorMessage(error: unknown): string {
  if (!error) return "Something went wrong";
  if (error instanceof ApiClientError) {
    if (error.code === "NETWORK_ERROR") return "Couldn't reach the server. Check your connection.";
    if (error.code === "UNAUTHORIZED") return "Your session has expired. Please sign in again.";
    if (error.code === "FORBIDDEN") return "You don't have permission to do that.";
    if (error.code === "NOT_FOUND") return error.message || "Resource not found";
    if (error.code === "VALIDATION_ERROR") return error.message || "Some fields are invalid";
    return error.message;
  }
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unexpected error";
}

export function ApiError({ error, onRetry, className, compact }: ApiErrorProps) {
  const message = getErrorMessage(error);

  if (compact) {
    return (
      <div
        role="alert"
        className={cn(
          "flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive",
          className
        )}
      >
        <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
        <span className="flex-1">{message}</span>
        {onRetry && (
          <Button variant="ghost" size="xs" onClick={onRetry}>
            Retry
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center",
        className
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="size-6" aria-hidden="true" />
      </div>
      <h3 className="text-h3 font-semibold text-foreground">Something went wrong</h3>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCcw className="size-4" aria-hidden="true" />
          Try again
        </Button>
      )}
    </div>
  );
}
