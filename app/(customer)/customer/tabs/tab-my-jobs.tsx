"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Banknote,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Users,
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
import type { JobStatus, JobType } from "@/lib/constants/enums";
import { cn } from "@/lib/utils";
import { ApplicantsModal } from "./applicants-modal";

type CustomerJob = {
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
  status: JobStatus;
  acceptedDriverId: string | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
};

const jobTypeStyles: Record<
  JobType,
  { label: string; pill: string; dot: string }
> = {
  hourly: {
    label: "Hourly",
    pill: "border-status-hourly/30 bg-status-hourly/10 text-status-hourly",
    dot: "bg-status-hourly",
  },
  temporary: {
    label: "Temporary",
    pill:
      "border-status-temporary/30 bg-status-temporary/10 text-status-temporary",
    dot: "bg-status-temporary",
  },
  permanent: {
    label: "Permanent",
    pill:
      "border-status-permanent/30 bg-status-permanent/10 text-status-permanent",
    dot: "bg-status-permanent",
  },
};

function statusBadge(s: JobStatus): { label: string; className: string } {
  switch (s) {
    case "posted":
      return {
        label: "Posted",
        className: "border-status-pending/30 bg-status-pending/10 text-muted-foreground",
      };
    case "applied":
      return {
        label: "Receiving applicants",
        className:
          "border-status-hourly/30 bg-status-hourly/10 text-status-hourly",
      };
    case "accepted":
      return {
        label: "Driver hired",
        className:
          "border-secondary/30 bg-secondary/10 text-secondary",
      };
    case "in_progress":
      return {
        label: "In progress",
        className:
          "border-status-temporary/30 bg-status-temporary/10 text-status-temporary",
      };
    case "completed":
      return {
        label: "Completed",
        className: "border-secondary/30 bg-secondary/10 text-secondary",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        className: "border-destructive/30 bg-destructive/10 text-destructive",
      };
  }
}

function payText(j: CustomerJob): string {
  if (j.jobType === "hourly" && j.expectedPayout != null)
    return `₹${j.expectedPayout.toLocaleString("en-IN")}`;
  if (j.jobType === "temporary" && j.dailyPayment != null)
    return `₹${j.dailyPayment.toLocaleString("en-IN")} / day`;
  if (j.jobType === "permanent" && j.monthlySalary != null)
    return `₹${j.monthlySalary.toLocaleString("en-IN")} / month`;
  return "Pay on request";
}

function durationText(j: CustomerJob): string | null {
  if (j.jobType === "hourly" && j.estimatedDuration)
    return `${j.estimatedDuration} hr${j.estimatedDuration > 1 ? "s" : ""}`;
  if (j.jobType === "temporary" && j.durationDays)
    return `${j.durationDays} day${j.durationDays > 1 ? "s" : ""}`;
  if (j.jobType === "permanent" && j.workingHours)
    return j.workingHours === "24x7" ? "24×7" : "12 hr/day";
  return null;
}

const ACTIVE_STATUSES: JobStatus[] = [
  "posted",
  "applied",
  "accepted",
  "in_progress",
];

export function TabMyJobs() {
  const [jobs, setJobs] = useState<CustomerJob[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [applicantsJobId, setApplicantsJobId] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<{ jobs: CustomerJob[] }>("/api/jobs");
      const active = data.jobs.filter((j) => ACTIVE_STATUSES.includes(j.status));
      setJobs(active);
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
        const data = await apiGet<{ jobs: CustomerJob[] }>("/api/jobs");
        if (cancelled) return;
        const active = data.jobs.filter((j) =>
          ACTIVE_STATUSES.includes(j.status),
        );
        setJobs(active);
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
    status: "completed" | "cancelled",
    reason?: string,
  ) {
    setActingId(jobId);
    try {
      await apiPatch(`/api/jobs/${jobId}/status`, {
        status,
        ...(reason ? { cancellationReason: reason } : {}),
      });
      toast.success(
        status === "completed" ? "Job marked complete." : "Job cancelled.",
      );
      await fetchJobs();
    } catch (e) {
      toast.error(
        e instanceof ApiClientError ? e.message : "Couldn't update job",
      );
    } finally {
      setActingId(null);
      setCancelTarget(null);
    }
  }

  if (loading && !jobs) {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <JobCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return <ApiError error={error} onRetry={() => void fetchJobs()} />;
  }

  if (!jobs || jobs.length === 0) {
    return (
      <EmptyState
        icon={<Briefcase className="size-7" aria-hidden="true" />}
        title="No active jobs yet"
        message="Post your first job to start finding a driver. Drivers in your city will be notified."
      />
    );
  }

  return (
    <>
      <div className="grid gap-3 md:grid-cols-2">
        {jobs.map((job) => {
          const styles = jobTypeStyles[job.jobType];
          const badge = statusBadge(job.status);
          const dur = durationText(job);
          const acting = actingId === job._id;
          const canViewApplicants =
            job.status === "posted" || job.status === "applied";
          const canMarkComplete = job.status === "in_progress";
          const canCancel = job.status !== "completed" && job.status !== "cancelled";
          return (
            <article
              key={job._id}
              className="relative flex flex-col gap-3 overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <div
                aria-hidden="true"
                className={cn("absolute inset-y-0 left-0 w-1", styles.dot)}
              />
              <div className="flex items-start justify-between gap-3 pl-2">
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-xs font-semibold",
                        styles.pill,
                      )}
                    >
                      {styles.label}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn("text-xs", badge.className)}
                    >
                      {badge.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="size-3.5" aria-hidden="true" />
                    {job.city}
                    {job.areas.length > 0 &&
                      ` · ${job.areas.slice(0, 2).join(", ")}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center gap-1 text-sm font-semibold text-foreground">
                    <Banknote
                      className="size-3.5 text-muted-foreground"
                      aria-hidden="true"
                    />
                    {payText(job)}
                  </div>
                  {dur && (
                    <div className="mt-0.5 inline-flex items-center justify-end gap-1 text-xs text-muted-foreground">
                      {job.jobType === "permanent" ? (
                        <Calendar className="size-3" aria-hidden="true" />
                      ) : (
                        <Clock className="size-3" aria-hidden="true" />
                      )}
                      {dur}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1 pl-2 text-sm">
                <p className="text-foreground">
                  <span className="font-medium">From:</span> {job.startLocation}
                </p>
                {job.endLocation && (
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">To:</span>{" "}
                    {job.endLocation}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Posted {new Date(job.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3 pl-2">
                {canViewApplicants && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setApplicantsJobId(job._id)}
                  >
                    <Users className="size-4" aria-hidden="true" />
                    View Applicants
                  </Button>
                )}
                {canMarkComplete && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void transition(job._id, "completed")}
                    disabled={acting}
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                  >
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                    Mark Completed
                  </Button>
                )}
                {canCancel && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setCancelTarget(job._id)}
                    disabled={acting}
                  >
                    <XCircle className="size-4" aria-hidden="true" />
                    Cancel
                  </Button>
                )}
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

      <ApplicantsModal
        open={applicantsJobId !== null}
        onOpenChange={(o) => !o && setApplicantsJobId(null)}
        jobId={applicantsJobId}
        onHired={() => void fetchJobs()}
      />
    </>
  );
}
