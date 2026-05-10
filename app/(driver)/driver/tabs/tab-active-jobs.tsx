"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Banknote,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Mail,
  PlayCircle,
  Phone,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { JobCardSkeleton } from "@/components/ui/skeleton-loaders";
import { ApiError } from "@/components/shared/api-error";
import { CancelJobModal } from "@/components/shared/cancel-job-modal";
import { apiGet, apiPatch, ApiClientError } from "@/lib/api";
import type { ApplicationStatus, DriverResponse, JobType } from "@/lib/constants/enums";
import { cn } from "@/lib/utils";

type ActiveView = {
  application: {
    _id: string;
    status: ApplicationStatus;
    driverResponse: DriverResponse | null;
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
    status: "accepted" | "in_progress" | "completed" | "cancelled" | string;
  };
  customer: { fullName: string; email: string; phone: string } | null;
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

function payText(j: ActiveView["job"]): string {
  if (j.jobType === "hourly" && j.expectedPayout != null)
    return `₹${j.expectedPayout.toLocaleString("en-IN")}`;
  if (j.jobType === "temporary" && j.dailyPayment != null)
    return `₹${j.dailyPayment.toLocaleString("en-IN")} / day`;
  if (j.jobType === "permanent" && j.monthlySalary != null)
    return `₹${j.monthlySalary.toLocaleString("en-IN")} / month`;
  return "Pay on request";
}

function durationText(j: ActiveView["job"]): string | null {
  if (j.jobType === "hourly" && j.estimatedDuration)
    return `${j.estimatedDuration} hr${j.estimatedDuration > 1 ? "s" : ""}`;
  if (j.jobType === "temporary" && j.durationDays)
    return `${j.durationDays} day${j.durationDays > 1 ? "s" : ""}`;
  if (j.jobType === "permanent" && j.workingHours)
    return j.workingHours === "24x7" ? "24×7" : "12 hr/day";
  return null;
}

export function TabActiveJobs() {
  const [items, setItems] = useState<ActiveView[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<{ applications: ActiveView[] }>(
        "/api/applications/driver",
      );
      const active = data.applications.filter(
        (a) =>
          (a.job.status === "accepted" || a.job.status === "in_progress") &&
          a.application.driverResponse === "accepted",
      );
      setItems(active);
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
        const data = await apiGet<{ applications: ActiveView[] }>(
          "/api/applications/driver",
        );
        if (cancelled) return;
        const active = data.applications.filter(
          (a) =>
            (a.job.status === "accepted" || a.job.status === "in_progress") &&
            a.application.driverResponse === "accepted",
        );
        setItems(active);
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

  async function transition(
    jobId: string,
    status: "in_progress" | "completed" | "cancelled",
    reason?: string,
  ) {
    setActingId(jobId);
    try {
      await apiPatch(`/api/jobs/${jobId}/status`, {
        status,
        ...(reason ? { cancellationReason: reason } : {}),
      });
      const messages: Record<typeof status, string> = {
        in_progress: "Job started.",
        completed: "Job marked complete.",
        cancelled: "Job cancelled.",
      };
      toast.success(messages[status]);
      await fetchData();
    } catch (e) {
      toast.error(
        e instanceof ApiClientError ? e.message : "Couldn't update job",
      );
    } finally {
      setActingId(null);
      setCancelTarget(null);
    }
  }

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
        icon={<Briefcase className="size-7" aria-hidden="true" />}
        title="No active jobs"
        message="When a customer hires you and you accept, the job will show here so you can start it."
      />
    );
  }

  return (
    <>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map(({ application, job, customer }) => {
          const styles = jobTypeStyles[job.jobType];
          const dur = durationText(job);
          const acting = actingId === job._id;
          const isInProgress = job.status === "in_progress";
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
                  variant={isInProgress ? "default" : "secondary"}
                  className="shrink-0"
                >
                  {isInProgress ? "In progress" : "Ready to start"}
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
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
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
                </div>
              </div>

              {customer && (
                <div className="flex flex-col gap-1 rounded-lg border border-border bg-muted/30 p-3 pl-3 text-sm">
                  <p className="font-medium text-foreground">{customer.fullName}</p>
                  <a
                    href={`tel:${customer.phone}`}
                    className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <Phone className="size-3.5" aria-hidden="true" />
                    {customer.phone}
                  </a>
                  <a
                    href={`mailto:${customer.email}`}
                    className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <Mail className="size-3.5" aria-hidden="true" />
                    {customer.email}
                  </a>
                </div>
              )}

              <div className="flex items-center gap-2 border-t border-border pt-3 pl-2">
                {!isInProgress && (
                  <Button
                    size="sm"
                    onClick={() => void transition(job._id, "in_progress")}
                    disabled={acting}
                  >
                    <PlayCircle className="size-4" aria-hidden="true" />
                    Start Job
                  </Button>
                )}
                {isInProgress && (
                  <Button
                    size="sm"
                    onClick={() => void transition(job._id, "completed")}
                    disabled={acting}
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                  >
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                    Mark Completed
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setCancelTarget(job._id)}
                  disabled={acting}
                >
                  <XCircle className="size-4" aria-hidden="true" />
                  Cancel
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      <CancelJobModal
        open={cancelTarget !== null}
        onOpenChange={(o) => !o && setCancelTarget(null)}
        loading={!!cancelTarget && actingId === cancelTarget}
        onConfirm={(reason) =>
          cancelTarget ? transition(cancelTarget, "cancelled", reason) : undefined
        }
      />
    </>
  );
}
