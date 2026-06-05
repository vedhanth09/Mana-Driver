"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Banknote,
  Calendar,
  CheckCircle2,
  Clock,
  ClipboardList,
  Mail,
  MapPin,
  Phone,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { JobCardSkeleton } from "@/components/ui/skeleton-loaders";
import { ApiError } from "@/components/shared/api-error";
import { apiGet, apiPatch, ApiClientError } from "@/lib/api";
import type {
  ApplicationStatus,
  DriverResponse,
  JobType,
} from "@/lib/constants/enums";
import { cn } from "@/lib/utils";

type ApplicationView = {
  application: {
    _id: string;
    jobId: string;
    driverId: string;
    appliedAt: string;
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
    status: string;
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

function statusBadge(status: ApplicationStatus, response: DriverResponse | null) {
  if (status === "approved" && response === "pending")
    return { label: "Hired — your move", variant: "default" as const, tone: "secondary" };
  if (status === "approved" && response === "accepted")
    return { label: "Accepted", variant: "secondary" as const, tone: "secondary" };
  if (status === "rejected" && response === "declined")
    return { label: "Declined by you", variant: "outline" as const, tone: "muted" };
  if (status === "rejected")
    return { label: "Rejected", variant: "outline" as const, tone: "destructive" };
  if (status === "withdrawn")
    return { label: "Withdrawn", variant: "outline" as const, tone: "muted" };
  return { label: "Pending review", variant: "outline" as const, tone: "muted" };
}

function payText(j: ApplicationView["job"]): string {
  if (j.jobType === "hourly" && j.expectedPayout != null)
    return `₹${j.expectedPayout.toLocaleString("en-IN")}`;
  if (j.jobType === "temporary" && j.dailyPayment != null)
    return `₹${j.dailyPayment.toLocaleString("en-IN")} / day`;
  if (j.jobType === "permanent" && j.monthlySalary != null)
    return `₹${j.monthlySalary.toLocaleString("en-IN")} / month`;
  return "Pay on request";
}

function durationText(j: ApplicationView["job"]): string | null {
  if (j.jobType === "hourly" && j.estimatedDuration)
    return `${j.estimatedDuration} hr${j.estimatedDuration > 1 ? "s" : ""}`;
  if (j.jobType === "temporary" && j.durationDays)
    return `${j.durationDays} day${j.durationDays > 1 ? "s" : ""}`;
  if (j.jobType === "permanent" && j.workingHours)
    return j.workingHours === "24x7" ? "24×7" : "12 hr/day";
  return null;
}

export function TabApplications() {
  const [items, setItems] = useState<ApplicationView[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<{ applications: ApplicationView[] }>(
        "/api/applications/driver",
      );
      setItems(data.applications);
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
        const data = await apiGet<{ applications: ApplicationView[] }>(
          "/api/applications/driver",
        );
        if (!cancelled) {
          setItems(data.applications);
          setError(null);
        }
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

  async function respond(applicationId: string, action: "accept" | "decline") {
    setActingId(applicationId);
    try {
      await apiPatch(`/api/applications/${applicationId}`, { action });
      toast.success(action === "accept" ? "Job accepted." : "Application declined.");
      await fetchData();
    } catch (e) {
      toast.error(
        e instanceof ApiClientError ? e.message : "Couldn't update application",
      );
    } finally {
      setActingId(null);
    }
  }

  if (loading && !items) {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
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
        icon={<ClipboardList className="size-7" aria-hidden="true" />}
        title="No applications yet"
        message="Browse open jobs and apply — the customer's contact details unlock once you're hired."
      />
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map(({ application, job, customer }) => {
        const styles = jobTypeStyles[job.jobType];
        const badge = statusBadge(application.status, application.driverResponse);
        const reveal =
          application.status === "approved" &&
          application.driverResponse === "pending" &&
          customer;
        const dur = durationText(job);
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
                  <span>
                    {job.city}
                    {job.areas.length > 0 && ` · ${job.areas.slice(0, 2).join(", ")}`}
                  </span>
                </div>
              </div>
              <Badge variant={badge.variant} className="shrink-0">
                {badge.label}
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
                <span>· Applied {new Date(application.appliedAt).toLocaleDateString()}</span>
              </div>
            </div>

            {reveal && customer && (
              <div className="flex flex-col gap-2 rounded-lg border border-secondary/30 bg-secondary/5 p-3 pl-3">
                <p className="text-xs font-semibold tracking-wider text-secondary uppercase">
                  Customer contact
                </p>
                <div className="flex flex-col gap-1 text-sm">
                  <p className="font-medium text-foreground">{customer.fullName}</p>
                  <a
                    href={`mailto:${customer.email}`}
                    className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <Mail className="size-3.5" aria-hidden="true" />
                    {customer.email}
                  </a>
                  <a
                    href={`tel:${customer.phone}`}
                    className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <Phone className="size-3.5" aria-hidden="true" />
                    {customer.phone}
                  </a>
                </div>
                <div className="mt-1 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => void respond(application._id, "accept")}
                    disabled={actingId === application._id}
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                  >
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                    Accept job
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void respond(application._id, "decline")}
                    disabled={actingId === application._id}
                  >
                    <XCircle className="size-4" aria-hidden="true" />
                    Decline
                  </Button>
                </div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
