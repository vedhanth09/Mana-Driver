"use client";

import { Award, MapPin, Languages as LanguagesIcon, Phone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RatingStars } from "@/components/ui/rating-stars";
import { cn } from "@/lib/utils";
import type { ApplicationStatus, DriverResponse, Language } from "@/lib/constants/enums";

export type ApplicantSummary = {
  applicationId: string;
  driverId: string;
  status: ApplicationStatus;
  driverResponse: DriverResponse | null;
  appliedAt: string | Date;
  driver: {
    fullName: string;
    phone?: string;
    averageRating: number;
    totalJobsCompleted: number;
    languages: Language[];
    city: string;
  };
};

export type ApplicantCardProps = {
  applicant: ApplicantSummary;
  onHire?: (applicationId: string) => void;
  hiring?: boolean;
  className?: string;
};

const statusStyles: Record<ApplicationStatus, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  pending: { variant: "outline", label: "Pending" },
  approved: { variant: "secondary", label: "Hired" },
  rejected: { variant: "destructive", label: "Rejected" },
  withdrawn: { variant: "outline", label: "Withdrawn" },
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

export function ApplicantCard({
  applicant,
  onHire,
  hiring,
  className,
}: ApplicantCardProps) {
  const { driver, status, driverResponse } = applicant;
  const isHireable = status === "pending" && !!onHire;
  const showAcceptedBadge = status === "approved" && driverResponse === "accepted";

  return (
    <Card
      className={cn(
        "flex items-start gap-3 border-border p-4",
        className
      )}
    >
      <Avatar className="size-12 shrink-0">
        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
          {initials(driver.fullName)}
        </AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-semibold text-foreground">{driver.fullName}</h3>
          <Badge variant={statusStyles[status].variant}>{statusStyles[status].label}</Badge>
          {showAcceptedBadge && (
            <Badge variant="secondary">Driver accepted</Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <RatingStars value={Math.round(driver.averageRating)} size="sm" />
            <span>
              {driver.averageRating.toFixed(1)} ({driver.totalJobsCompleted} jobs)
            </span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Award className="size-3" aria-hidden="true" />
            {driver.totalJobsCompleted >= 50
              ? "Experienced"
              : driver.totalJobsCompleted >= 10
                ? "Intermediate"
                : "Beginner"}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3" aria-hidden="true" />
            {driver.city}
          </span>
        </div>

        {driver.languages.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <LanguagesIcon className="size-3 text-muted-foreground" aria-hidden="true" />
            {driver.languages.map((l) => (
              <Badge key={l} variant="outline" className="capitalize">
                {l}
              </Badge>
            ))}
          </div>
        )}

        {status === "approved" && driver.phone && (
          <div className="mt-1 inline-flex items-center gap-1.5 text-sm text-foreground">
            <Phone className="size-3.5 text-muted-foreground" aria-hidden="true" />
            <a href={`tel:${driver.phone}`} className="font-medium hover:underline">
              {driver.phone}
            </a>
          </div>
        )}
      </div>

      {isHireable && (
        <Button
          type="button"
          size="sm"
          disabled={hiring}
          onClick={() => onHire?.(applicant.applicationId)}
          className="shrink-0"
        >
          {hiring ? "Hiring…" : "Hire"}
        </Button>
      )}
    </Card>
  );
}
