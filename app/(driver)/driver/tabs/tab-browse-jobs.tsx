"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Filter, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/ui/empty-state";
import { JobCardSkeleton } from "@/components/ui/skeleton-loaders";
import { ApiError } from "@/components/shared/api-error";
import { JobCard, type JobLike } from "@/components/shared/job-card";
import { apiGet, apiPost, ApiClientError } from "@/lib/api";
import { CITIES, type City } from "@/lib/constants/cities";
import {
  CAR_TYPES,
  JOB_TYPES,
  TRANSMISSION_TYPES,
  WORKING_HOURS,
  type CarType,
  type JobType,
  type Language,
  type TransmissionType,
  type WorkingHours,
} from "@/lib/constants/enums";
import { cn } from "@/lib/utils";

type Filters = {
  city: City | "";
  jobType: JobType | "";
  carType: CarType | "";
  transmissionType: TransmissionType | "";
  workingHours: WorkingHours | "";
  minPay: string;
  maxPay: string;
};

const EMPTY_FILTERS: Filters = {
  city: "",
  jobType: "",
  carType: "",
  transmissionType: "",
  workingHours: "",
  minPay: "",
  maxPay: "",
};

const selectClass = cn(
  "h-10 w-full appearance-none rounded-lg border border-border bg-background px-3 text-sm text-foreground",
  "outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20",
);

const inputClass = cn(
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground",
  "outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20",
);

export function TabBrowseJobs({ driverLanguages }: { driverLanguages: Language[] }) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [pendingFilters, setPendingFilters] = useState<Filters>(EMPTY_FILTERS);
  const [open, setOpen] = useState(false);
  const [jobs, setJobs] = useState<JobLike[] | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);

  const queryParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (filters.city) params.city = filters.city;
    if (filters.jobType) params.jobType = filters.jobType;
    if (filters.carType) params.carType = filters.carType;
    if (filters.transmissionType) params.transmissionType = filters.transmissionType;
    if (filters.workingHours) params.workingHours = filters.workingHours;
    if (filters.minPay) params.minPay = filters.minPay;
    if (filters.maxPay) params.maxPay = filters.maxPay;
    return params;
  }, [filters]);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<{ jobs: JobLike[]; appliedJobIds: string[] }>(
        "/api/jobs",
        queryParams,
      );
      setJobs(data.jobs.map((j) => ({ ...j, _id: String(j._id) })));
      setAppliedJobIds(new Set(data.appliedJobIds));
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await apiGet<{ jobs: JobLike[]; appliedJobIds: string[] }>(
          "/api/jobs",
          queryParams,
        );
        if (cancelled) return;
        setJobs(data.jobs.map((j) => ({ ...j, _id: String(j._id) })));
        setAppliedJobIds(new Set(data.appliedJobIds));
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
  }, [queryParams]);

  const activeFilterCount = Object.values(filters).filter((v) => v !== "").length;

  function applyFilters() {
    setFilters(pendingFilters);
    setOpen(false);
  }

  function resetFilters() {
    setPendingFilters(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
  }

  async function handleApply(job: JobLike) {
    setApplyingJobId(job._id);
    try {
      await apiPost("/api/applications", { jobId: job._id });
      toast.success("Application sent.");
      setAppliedJobIds((prev) => new Set(prev).add(job._id));
    } catch (e) {
      toast.error(
        e instanceof ApiClientError ? e.message : "Could not apply",
      );
    } finally {
      setApplyingJobId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-h3 font-semibold text-foreground">Open jobs</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setPendingFilters(filters);
            setOpen((o) => !o);
          }}
        >
          <Filter className="size-4" aria-hidden="true" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {open && (
        <FilterPanel
          filters={pendingFilters}
          onChange={setPendingFilters}
          onApply={applyFilters}
          onReset={resetFilters}
          onClose={() => setOpen(false)}
        />
      )}

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <JobCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <ApiError error={error} onRetry={() => void fetchJobs()} />
      ) : jobs && jobs.length === 0 ? (
        <EmptyState
          icon={<Search className="size-7" aria-hidden="true" />}
          title="No matching jobs yet"
          message={
            activeFilterCount > 0
              ? "Try removing some filters or check back soon — new jobs are posted often."
              : "We'll notify you the moment a customer in your area posts a job."
          }
          action={
            activeFilterCount > 0 ? (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {jobs?.map((job) => (
            <JobCard
              key={job._id}
              job={job}
              driverLanguages={driverLanguages}
              appliedFlag={appliedJobIds.has(job._id)}
              applying={applyingJobId === job._id}
              onApply={(j) => void handleApply(j)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterPanel({
  filters,
  onChange,
  onApply,
  onReset,
  onClose,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  onApply: () => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) =>
    onChange({ ...filters, [k]: v });

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Filter jobs</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close filters"
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">City</Label>
          <select
            value={filters.city}
            onChange={(e) => set("city", e.target.value as Filters["city"])}
            className={selectClass}
          >
            <option value="">All cities</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Job type</Label>
          <select
            value={filters.jobType}
            onChange={(e) => set("jobType", e.target.value as Filters["jobType"])}
            className={selectClass}
          >
            <option value="">All types</option>
            {JOB_TYPES.map((t) => (
              <option key={t} value={t} className="capitalize">
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Car type</Label>
          <select
            value={filters.carType}
            onChange={(e) => set("carType", e.target.value as Filters["carType"])}
            className={selectClass}
          >
            <option value="">Any</option>
            {CAR_TYPES.map((t) => (
              <option key={t} value={t} className="capitalize">
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Transmission</Label>
          <select
            value={filters.transmissionType}
            onChange={(e) =>
              set("transmissionType", e.target.value as Filters["transmissionType"])
            }
            className={selectClass}
          >
            <option value="">Any</option>
            {TRANSMISSION_TYPES.map((t) => (
              <option key={t} value={t} className="capitalize">
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Working hours</Label>
          <select
            value={filters.workingHours}
            onChange={(e) =>
              set("workingHours", e.target.value as Filters["workingHours"])
            }
            className={selectClass}
          >
            <option value="">Any</option>
            {WORKING_HOURS.map((h) => (
              <option key={h} value={h}>
                {h === "24x7" ? "24×7" : "12 hr/day"}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Min pay (₹)</Label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={filters.minPay}
            onChange={(e) => set("minPay", e.target.value)}
            placeholder="0"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Max pay (₹)</Label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={filters.maxPay}
            onChange={(e) => set("maxPay", e.target.value)}
            placeholder="No limit"
            className={inputClass}
          />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onReset}>
          Reset
        </Button>
        <Button size="sm" onClick={onApply}>
          Apply filters
        </Button>
      </div>
    </div>
  );
}
