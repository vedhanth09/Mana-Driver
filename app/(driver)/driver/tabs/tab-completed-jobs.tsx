"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Banknote,
  Calendar,
  CheckCircle2,
  Clock,
  History,
  MapPin,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { JobCardSkeleton } from "@/components/ui/skeleton-loaders";
import { ApiError } from "@/components/shared/api-error";
import { apiGet } from "@/lib/api";
import type { ApplicationStatus, DriverResponse, JobType } from "@/lib/constants/enums";
import { cn } from "@/lib/utils";

type CompletedView = {
  application: {
    _id: string;
    status: ApplicationStatus;
    driverResponse: DriverResponse | null;
    appliedAt: string;
    updatedAt: string;
  };
  job: {
    _id: string;
    jobType: JobType;
    city: string;
    areas: string[];
    startLocation: string;
    endLocation: string | null;
    expectedPayout: number | null;
    dailyPayment: number | null;
    monthlySalary: number | null;
    estimatedDuration: number | null;
    durationDays: number | null;
    workingHours: string | null;
    status: string;
    cancellationReason: string | null;
    updatedAt: string;
  };
};

const jobTypeStyles: Record<JobType, { label: string; pill: string; dot: string }> = {
  hourly: {
    label: "Hourly",
    pill: "border-status-hourly/30 bg-status-hourly/10 text-status-hourly",
    dot: "bg-status-hourly",
  },
  temporary: {
    label: "Temporary",
    pill: "border-status-temporary/30 bg-status-temporary/10 text-status-temporary",
    dot: "bg-status-temporary",
  },
  permanent: {
    label: "Permanent",
    pill: "border-status-permanent/30 bg-status-permanent/10 text-status-permanent",
    dot: "bg-status-permanent",
  },
};

function payText(j: CompletedView["job"]): string {
  if (j.jobType === "hourly" && j.expectedPayout != null)
    return `₹${j.expectedPayout.toLocaleString("en-IN")}`;
  if (j.jobType === "temporary" && j.dailyPayment != null)
    return `₹${j.dailyPayment.toLocaleString("en-IN")} / day`;
  if (j.jobType === "permanent" && j.monthlySalary != null)
    return `₹${j.monthlySalary.toLocaleString("en-IN")} / month`;
  return "Pay on request";
}

function durationText(j: CompletedView["job"]): string | null {
  if (j.jobType === "hourly" && j.estimatedDuration)
    return `${j.estimatedDuration} hr${j.estimatedDuration > 1 ? "s" : ""}`;
  if (j.jobType === "temporary" && j.durationDays)
    return `${j.durationDays} day${j.durationDays > 1 ? "s" : ""}`;
  if (j.jobType === "permanent" && j.workingHours)
    return j.workingHours === "24x7" ? "24×7" : "12 hr/day";
  return null;
}

export function TabCompletedJobs() {
  const [items, setItems] = useState<CompletedView[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<{ applications: CompletedView[] }>(
        "/api/applications/driver",
      );
      const finished = data.applications.filter(
        (a) => a.job.status === "completed" || a.job.status === "cancelled",
      );
      finished.sort(
        (a, b) =>
          new Date(b.job.updatedAt).getTime() -
          new Date(a.job.updatedAt).getTime(),
      );
      setItems(finished);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await apiGet<{ applications: CompletedView[] }>(
          "/api/applications/driver",
        );
        if (cancelled) return;
        const finished = data.applications.filter(
          (a) => a.job.status === "completed" || a.job.status === "cancelled",
        );
        finished.sort(
          (a, b) =>
            new Date(b.job.updatedAt).getTime() -
            new Date(a.job.updatedAt).getTime(),
        );
        setItems(finished);
        setError(null);
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading && !items) {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <JobCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return <ApiError error={error} onRetry={() => void fetchData()} />;
  }

  if (!items || items.length === 0) {
    return (
      <EmptyState
        icon={<History className="size-7" aria-hidden="true" />}
        title="No completed jobs yet"
        message="Finished and cancelled jobs will be archived here for your records."
      />
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map(({ application, job }) => {
        const styles = jobTypeStyles[job.jobType];
        const dur = durationText(job);
        const cancelled = job.status === "cancelled";
        const finishedAt = new Date(job.updatedAt).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
        return (
          <article
            key={application._id}
            className="relative flex flex-col gap-3 overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <div
              aria-hidden="true"
              className={cn("absolute inset-y-0 left-0 w-1", styles.dot)}
            />
            <div className="flex items-start justify-between gap-3 pl-2">
              <div className="flex flex-col gap-1.5">
                <span
                  className={cn(
                    "inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-xs font-semibold",
                    styles.pill,
                  )}
                >
                  {styles.label}
                </span>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="size-3.5" aria-hidden="true" />
                  {job.city}
                  {job.areas.length > 0 && ` · ${job.areas.slice(0, 2).join(", ")}`}
                </div>
              </div>
              <Badge
                variant={cancelled ? "outline" : "secondary"}
                className={cn(
                  "shrink-0",
                  cancelled && "border-destructive/30 text-destructive",
                )}
              >
                {cancelled ? (
                  <>
                    <XCircle className="size-3.5" aria-hidden="true" />
                    Cancelled
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-3.5" aria-hidden="true" />
                    Completed
                  </>
                )}
              </Badge>
            </div>

            <div className="flex flex-col gap-1 pl-2 text-sm">
              <p className="text-foreground">
                <span className="font-medium">From:</span> {job.startLocation}
              </p>
              {job.endLocation && (
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">To:</span> {job.endLocation}
                </p>
              )}
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Banknote className="size-3.5" aria-hidden="true" />
                  {payText(job)}
                </span>
                {dur && (
                  <span className="inline-flex items-center gap-1">
                    {job.jobType === "permanent" ? (
                      <Calendar className="size-3.5" aria-hidden="true" />
                    ) : (
                      <Clock className="size-3.5" aria-hidden="true" />
                    )}
                    {dur}
                  </span>
                )}
                <span>{cancelled ? "Cancelled" : "Completed"} on {finishedAt}</span>
              </div>
            </div>

            {cancelled && job.cancellationReason && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 pl-3 text-sm text-foreground">
                <p className="text-xs font-semibold tracking-wider text-destructive uppercase">
                  Cancellation reason
                </p>
                <p className="mt-1 text-muted-foreground">
                  {job.cancellationReason}
                </p>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
