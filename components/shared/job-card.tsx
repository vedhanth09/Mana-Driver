"use client";

import { useState } from "react";
import {
  MapPin,
  Clock,
  Calendar,
  Banknote,
  Car,
  Languages as LanguagesIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Job } from "@/models/Job";
import type { JobType, Language } from "@/lib/constants/enums";

const jobTypeStyles: Record<JobType, { dot: string; pill: string; label: string }> = {
  hourly: {
    dot: "bg-status-hourly",
    pill: "border-status-hourly/30 bg-status-hourly/10 text-status-hourly",
    label: "Hourly",
  },
  temporary: {
    dot: "bg-status-temporary",
    pill: "border-status-temporary/30 bg-status-temporary/10 text-status-temporary",
    label: "Temporary",
  },
  permanent: {
    dot: "bg-status-permanent",
    pill: "border-status-permanent/30 bg-status-permanent/10 text-status-permanent",
    label: "Permanent",
  },
};

function formatPay(job: JobLike): string {
  if (job.jobType === "hourly" && job.expectedPayout != null) {
    return `₹${job.expectedPayout.toLocaleString("en-IN")}`;
  }
  if (job.jobType === "temporary" && job.dailyPayment != null) {
    return `₹${job.dailyPayment.toLocaleString("en-IN")} / day`;
  }
  if (job.jobType === "permanent" && job.monthlySalary != null) {
    return `₹${job.monthlySalary.toLocaleString("en-IN")} / month`;
  }
  return "Pay on request";
}

function formatDuration(job: JobLike): string | null {
  if (job.jobType === "hourly" && job.estimatedDuration) {
    return `${job.estimatedDuration} hr${job.estimatedDuration > 1 ? "s" : ""}`;
  }
  if (job.jobType === "temporary" && job.durationDays) {
    return `${job.durationDays} day${job.durationDays > 1 ? "s" : ""}`;
  }
  if (job.jobType === "permanent" && job.workingHours) {
    return job.workingHours === "24x7" ? "24×7" : "12 hr/day";
  }
  return null;
}

export type JobLike = Pick<
  Job,
  | "jobType"
  | "city"
  | "areas"
  | "startLocation"
  | "endLocation"
  | "carType"
  | "transmissionType"
  | "estimatedDuration"
  | "expectedPayout"
  | "durationDays"
  | "dailyPayment"
  | "workingHours"
  | "monthlySalary"
  | "requiredLanguages"
  | "status"
> & { _id: string };

export type JobCardProps = {
  job: JobLike;
  driverLanguages?: Language[];
  appliedFlag?: boolean;
  onApply?: (job: JobLike, opts: { acknowledgedLanguageMismatch: boolean }) => void;
  applying?: boolean;
  className?: string;
  footer?: React.ReactNode;
};

export function JobCard({
  job,
  driverLanguages,
  appliedFlag,
  onApply,
  applying,
  className,
  footer,
}: JobCardProps) {
  const styles = jobTypeStyles[job.jobType];
  const duration = formatDuration(job);
  const languageMismatch =
    !!driverLanguages &&
    job.requiredLanguages.length > 0 &&
    !job.requiredLanguages.some((l) => driverLanguages.includes(l));

  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleApplyClick = () => {
    if (!onApply) return;
    if (languageMismatch) {
      setConfirmOpen(true);
      return;
    }
    onApply(job, { acknowledgedLanguageMismatch: false });
  };

  return (
    <Card
      className={cn(
        "group relative flex flex-col gap-3 overflow-hidden border-border p-4 transition-shadow hover:shadow-md",
        className
      )}
    >
      <div
        aria-hidden="true"
        className={cn("absolute inset-y-0 left-0 w-1", styles.dot)}
      />
      <div className="flex items-start justify-between gap-3 pl-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold",
                styles.pill
              )}
            >
              {styles.label}
            </span>
            <Badge variant="outline" className="capitalize">
              {job.carType} · {job.transmissionType}
            </Badge>
          </div>
          <div className="mt-1.5 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3.5" aria-hidden="true" />
            <span>
              {job.city}
              {job.areas.length > 0 && ` · ${job.areas.slice(0, 2).join(", ")}`}
              {job.areas.length > 2 && ` +${job.areas.length - 2}`}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-1 text-base font-semibold text-foreground">
            <Banknote className="size-4 text-muted-foreground" aria-hidden="true" />
            {formatPay(job)}
          </div>
          {duration && (
            <div className="mt-0.5 flex items-center justify-end gap-1 text-xs text-muted-foreground">
              {job.jobType === "permanent" ? (
                <Calendar className="size-3" aria-hidden="true" />
              ) : (
                <Clock className="size-3" aria-hidden="true" />
              )}
              {duration}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1 pl-2 text-sm">
        <div className="flex items-start gap-1.5">
          <Car className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <p className="text-foreground">
            <span className="font-medium">From:</span> {job.startLocation}
          </p>
        </div>
        {job.endLocation && (
          <p className="pl-5 text-muted-foreground">
            <span className="font-medium text-foreground">To:</span> {job.endLocation}
          </p>
        )}
      </div>

      {job.requiredLanguages.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pl-2">
          <LanguagesIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
          {job.requiredLanguages.map((lang) => (
            <Badge
              key={lang}
              variant={
                driverLanguages?.includes(lang) ? "secondary" : "outline"
              }
              className="capitalize"
            >
              {lang}
            </Badge>
          ))}
          {languageMismatch && (
            <span className="text-xs text-status-temporary">No language match</span>
          )}
        </div>
      )}

      {(onApply || appliedFlag || footer) && (
        <div className="flex items-center justify-between gap-2 border-t border-border pt-3 pl-2">
          <div className="text-xs text-muted-foreground capitalize">{job.status.replace("_", " ")}</div>
          <div className="flex items-center gap-2">
            {footer}
            {appliedFlag ? (
              <Badge variant="secondary">Applied</Badge>
            ) : onApply ? (
              <Button
                type="button"
                size="sm"
                disabled={applying}
                onClick={handleApplyClick}
              >
                {applying ? "Applying…" : "Apply"}
              </Button>
            ) : null}
          </div>
        </div>
      )}

      {confirmOpen && (
        <LanguageMismatchModal
          job={job}
          driverLanguages={driverLanguages ?? []}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false);
            onApply?.(job, { acknowledgedLanguageMismatch: true });
          }}
        />
      )}
    </Card>
  );
}

function LanguageMismatchModal({
  job,
  driverLanguages,
  onConfirm,
  onCancel,
}: {
  job: JobLike;
  driverLanguages: Language[];
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lang-mismatch-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-card p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="lang-mismatch-title" className="text-h3 font-semibold">
          Apply anyway?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This job requires {job.requiredLanguages.join(", ")} but your profile lists{" "}
          {driverLanguages.length ? driverLanguages.join(", ") : "no languages"}.
          The customer may still consider your application.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button size="sm" onClick={onConfirm}>
            Apply Anyway
          </Button>
        </div>
      </div>
    </div>
  );
}
