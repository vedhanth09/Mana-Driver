"use client";

import { useCallback, useEffect, useState } from "react";
import { Filter, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { ApplicantCardSkeleton } from "@/components/ui/skeleton-loaders";
import { ApiError } from "@/components/shared/api-error";
import {
  ApplicantCard,
  type ApplicantSummary,
} from "@/components/shared/applicant-card";
import { apiGet, apiPatch, ApiClientError } from "@/lib/api";
import {
  EXPERIENCE_LEVELS,
  type ApplicationStatus,
  type DriverResponse,
  type ExperienceLevel,
  type Language,
} from "@/lib/constants/enums";
import { cn } from "@/lib/utils";

type ApplicantApiItem = {
  application: {
    _id: string;
    jobId: string;
    driverId: string;
    appliedAt: string;
    status: ApplicationStatus;
    driverResponse: DriverResponse | null;
  };
  driver: {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
  };
  driverProfile: {
    averageRating: number;
    totalJobsCompleted: number;
    languages: Language[];
    city: string;
  } | null;
};

const experienceLabels: Record<ExperienceLevel, string> = {
  beginner: "Beginner (0–9 jobs)",
  intermediate: "Intermediate (10–49)",
  experienced: "Experienced (50+)",
};

const selectClass = cn(
  "h-10 w-full appearance-none rounded-lg border border-border bg-background px-3 text-sm text-foreground",
  "outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20",
);

export type ApplicantsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string | null;
  onHired?: () => void;
};

export function ApplicantsModal({
  open,
  onOpenChange,
  jobId,
  onHired,
}: ApplicantsModalProps) {
  const [items, setItems] = useState<ApplicantApiItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [hiringId, setHiringId] = useState<string | null>(null);

  const [minRating, setMinRating] = useState<string>("");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | "">(
    "",
  );

  const fetchApplicants = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (minRating) params.minRating = minRating;
      if (experienceLevel) params.experienceLevel = experienceLevel;
      const data = await apiGet<{ applicants: ApplicantApiItem[] }>(
        `/api/applications/job/${jobId}`,
        params,
      );
      setItems(data.applicants);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [jobId, minRating, experienceLevel]);

  useEffect(() => {
    if (!open || !jobId) {
      setItems(null);
      setError(null);
      return;
    }
    void fetchApplicants();
  }, [open, jobId, fetchApplicants]);

  async function handleHire(applicationId: string) {
    setHiringId(applicationId);
    try {
      await apiPatch(`/api/applications/${applicationId}`, { action: "hire" });
      toast.success("Driver hired. They'll need to accept now.");
      onHired?.();
      await fetchApplicants();
    } catch (e) {
      toast.error(
        e instanceof ApiClientError ? e.message : "Couldn't hire driver",
      );
    } finally {
      setHiringId(null);
    }
  }

  function toSummary(a: ApplicantApiItem): ApplicantSummary {
    return {
      applicationId: a.application._id,
      driverId: a.driver._id,
      status: a.application.status,
      driverResponse: a.application.driverResponse,
      appliedAt: a.application.appliedAt,
      driver: {
        fullName: a.driver.fullName,
        phone: a.driver.phone,
        averageRating: a.driverProfile?.averageRating ?? 0,
        totalJobsCompleted: a.driverProfile?.totalJobsCompleted ?? 0,
        languages: a.driverProfile?.languages ?? [],
        city: a.driverProfile?.city ?? "",
      },
    };
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Applicants</DialogTitle>
          <DialogDescription>
            Review drivers who applied. Filter by rating or experience and hire
            the best match.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              <Filter className="size-3.5" aria-hidden="true" />
              Filter
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Min rating</Label>
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Any</option>
                  <option value="3">3+ stars</option>
                  <option value="4">4+ stars</option>
                  <option value="4.5">4.5+ stars</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs">Experience level</Label>
                <select
                  value={experienceLevel}
                  onChange={(e) =>
                    setExperienceLevel(e.target.value as ExperienceLevel | "")
                  }
                  className={selectClass}
                >
                  <option value="">Any</option>
                  {EXPERIENCE_LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {experienceLabels[l]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <ApplicantCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <ApiError error={error} onRetry={() => void fetchApplicants()} />
          ) : !items || items.length === 0 ? (
            <EmptyState
              icon={<Users className="size-7" aria-hidden="true" />}
              title="No applicants yet"
              message={
                minRating || experienceLevel
                  ? "Try loosening your filters — drivers may not match these exact criteria."
                  : "Drivers will appear here as they apply. We'll notify you each time."
              }
            />
          ) : (
            <div className="flex flex-col gap-2">
              {items.map((a) => (
                <ApplicantCard
                  key={a.application._id}
                  applicant={toSummary(a)}
                  onHire={
                    a.application.status === "pending"
                      ? (id) => void handleHire(id)
                      : undefined
                  }
                  hiring={hiringId === a.application._id}
                />
              ))}
            </div>
          )}

          {hiringId && (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              Locking down the hire — other applicants will be auto-rejected.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
