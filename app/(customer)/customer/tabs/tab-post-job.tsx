"use client";

import { useState } from "react";
import {
  Banknote,
  Calendar,
  Check,
  Clock,
  Loader2,
  MapPin,
  Send,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/components/shared/api-error";
import { apiPost, ApiClientError } from "@/lib/api";
import { CITIES, CITY_AREAS, type City } from "@/lib/constants/cities";
import {
  CAR_TYPES,
  TRANSMISSION_TYPES,
  WORKING_HOURS,
  type CarType,
  type JobType,
  type TransmissionType,
  type WorkingHours,
} from "@/lib/constants/enums";
import { jobCreateSchema } from "@/schemas/job.schema";
import { cn } from "@/lib/utils";

type FormState = {
  jobType: JobType;
  city: City | "";
  areas: string[];
  startLocation: string;
  endLocation: string;
  carType: CarType | "";
  transmissionType: TransmissionType | "";
  // hourly
  estimatedDuration: string;
  expectedPayout: string;
  // temporary
  durationDays: string;
  dailyPayment: string;
  // permanent
  workingHours: WorkingHours | "";
  monthlySalary: string;
};

const INITIAL_STATE: FormState = {
  jobType: "hourly",
  city: "",
  areas: [],
  startLocation: "",
  endLocation: "",
  carType: "",
  transmissionType: "",
  estimatedDuration: "",
  expectedPayout: "",
  durationDays: "",
  dailyPayment: "",
  workingHours: "",
  monthlySalary: "",
};

const transmissionLabels: Record<TransmissionType, string> = {
  manual: "Manual",
  automatic: "Automatic",
  "semi-automatic": "Semi-Automatic",
};

const carLabels: Record<CarType, string> = {
  hatchback: "Hatchback",
  sedan: "Sedan",
  suv: "SUV",
  luxury: "Luxury",
};

const jobTypeMeta: Record<
  JobType,
  {
    title: string;
    blurb: string;
    Icon: typeof Zap;
    accent: string;
    border: string;
    activeBg: string;
    activeText: string;
  }
> = {
  hourly: {
    title: "Hourly",
    blurb: "Short trip with start, end, and estimated duration.",
    Icon: Clock,
    accent: "text-status-hourly",
    border: "border-status-hourly",
    activeBg: "bg-status-hourly/10",
    activeText: "text-status-hourly",
  },
  temporary: {
    title: "Temporary",
    blurb: "Multi-day engagement with a daily rate.",
    Icon: Calendar,
    accent: "text-status-temporary",
    border: "border-status-temporary",
    activeBg: "bg-status-temporary/10",
    activeText: "text-status-temporary",
  },
  permanent: {
    title: "Permanent",
    blurb: "Long-term hire on a monthly salary.",
    Icon: Zap,
    accent: "text-status-permanent",
    border: "border-status-permanent",
    activeBg: "bg-status-permanent/10",
    activeText: "text-status-permanent",
  },
};

const inputClass = cn(
  "h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground",
  "outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20",
);

const selectClass = cn(
  "h-11 w-full appearance-none rounded-lg border border-border bg-background px-3 text-sm text-foreground",
  "outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20",
);

export function TabPostJob({ onPosted }: { onPosted: () => void }) {
  const [state, setState] = useState<FormState>(INITIAL_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  function setJobType(jobType: JobType) {
    setState((prev) => ({ ...prev, jobType }));
  }

  function toggleArea(area: string) {
    update(
      "areas",
      state.areas.includes(area)
        ? state.areas.filter((a) => a !== area)
        : [...state.areas, area],
    );
  }

  const areaOptions = state.city ? CITY_AREAS[state.city as City] : [];

  function buildPayload(): Record<string, unknown> | null {
    if (!state.city || !state.carType || !state.transmissionType) return null;

    const base: Record<string, unknown> = {
      jobType: state.jobType,
      city: state.city,
      areas: state.areas,
      startLocation: state.startLocation.trim(),
      carType: state.carType,
      transmissionType: state.transmissionType,
    };

    if (state.jobType === "hourly") {
      return {
        ...base,
        endLocation: state.endLocation.trim(),
        estimatedDuration: Number(state.estimatedDuration),
        expectedPayout: Number(state.expectedPayout),
      };
    }
    if (state.jobType === "temporary") {
      return {
        ...base,
        endLocation: state.endLocation.trim(),
        durationDays: Number(state.durationDays),
        dailyPayment: Number(state.dailyPayment),
      };
    }
    return {
      ...base,
      workingHours: state.workingHours,
      monthlySalary: Number(state.monthlySalary),
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    const payload = buildPayload();
    if (!payload) {
      setServerError("Fill the required fields to continue");
      return;
    }
    const parsed = jobCreateSchema.safeParse(payload);
    if (!parsed.success) {
      setServerError(parsed.error.issues[0]?.message ?? "Form is invalid");
      return;
    }

    setSubmitting(true);
    try {
      await apiPost("/api/jobs", parsed.data);
      toast.success("Job posted. Drivers nearby have been notified.");
      setState(INITIAL_STATE);
      onPosted();
    } catch (e) {
      setServerError(
        e instanceof ApiClientError ? e.message : "Couldn't post the job",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="flex flex-col gap-6"
    >
      <Section
        title="Job type"
        description="Pick the kind of engagement you need."
      >
        <div className="grid gap-3 md:grid-cols-3">
          {(Object.keys(jobTypeMeta) as JobType[]).map((t) => {
            const meta = jobTypeMeta[t];
            const active = state.jobType === t;
            const Icon = meta.Icon;
            return (
              <button
                key={t}
                type="button"
                aria-pressed={active}
                onClick={() => setJobType(t)}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-xl border bg-card p-4 text-left transition-colors",
                  active
                    ? cn(meta.border, meta.activeBg)
                    : "border-border hover:border-primary/30",
                )}
              >
                <span
                  className={cn(
                    "inline-flex size-9 items-center justify-center rounded-full",
                    active ? meta.activeBg : "bg-muted",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4",
                      active ? meta.accent : "text-muted-foreground",
                    )}
                    aria-hidden="true"
                  />
                </span>
                <div>
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      active ? meta.activeText : "text-foreground",
                    )}
                  >
                    {meta.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{meta.blurb}</p>
                </div>
              </button>
            );
          })}
        </div>
      </Section>

      <Section
        title="Location"
        description="Where will the driver report and serve?"
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="city">City</Label>
            <select
              id="city"
              value={state.city}
              onChange={(e) => {
                update("city", e.target.value as City | "");
                update("areas", []);
              }}
              className={selectClass}
            >
              <option value="">Select city</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="start">
              <MapPin className="size-3.5 inline" aria-hidden="true" /> Start
              location
            </Label>
            <Input
              id="start"
              value={state.startLocation}
              onChange={(e) => update("startLocation", e.target.value)}
              placeholder="Pickup point"
            />
          </div>

          {(state.jobType === "hourly" || state.jobType === "temporary") && (
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <Label htmlFor="end">End location</Label>
              <Input
                id="end"
                value={state.endLocation}
                onChange={(e) => update("endLocation", e.target.value)}
                placeholder="Drop point"
              />
            </div>
          )}
        </div>

        {state.city && areaOptions.length > 0 && (
          <div className="flex flex-col gap-2">
            <Label>
              Areas in {state.city}
              {state.areas.length > 0 && (
                <span className="ml-1 text-muted-foreground">
                  ({state.areas.length})
                </span>
              )}
            </Label>
            <div className="flex flex-wrap gap-2">
              {areaOptions.map((area) => {
                const selected = state.areas.includes(area);
                return (
                  <button
                    key={area}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleArea(area)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:border-primary/40",
                    )}
                  >
                    {selected && (
                      <Check className="size-3" aria-hidden="true" />
                    )}
                    {area}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </Section>

      <Section title="Vehicle" description="Type of car and transmission.">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="car-type">Car type</Label>
            <select
              id="car-type"
              value={state.carType}
              onChange={(e) =>
                update("carType", e.target.value as CarType | "")
              }
              className={selectClass}
            >
              <option value="">Select car type</option>
              {CAR_TYPES.map((c) => (
                <option key={c} value={c}>
                  {carLabels[c]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="transmission">Transmission</Label>
            <select
              id="transmission"
              value={state.transmissionType}
              onChange={(e) =>
                update(
                  "transmissionType",
                  e.target.value as TransmissionType | "",
                )
              }
              className={selectClass}
            >
              <option value="">Select transmission</option>
              {TRANSMISSION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {transmissionLabels[t]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Section>

      <Section
        title="Schedule & pay"
        description={
          state.jobType === "hourly"
            ? "Set the trip duration and what you'll pay."
            : state.jobType === "temporary"
              ? "Set the days needed and daily pay."
              : "Set the working hours and monthly salary."
        }
      >
        {state.jobType === "hourly" && (
          <div className="grid gap-3 md:grid-cols-2">
            <NumericField
              id="duration"
              label="Estimated duration (hours)"
              value={state.estimatedDuration}
              onChange={(v) => update("estimatedDuration", v)}
              placeholder="e.g. 4"
            />
            <NumericField
              id="payout"
              label={
                <>
                  <Banknote className="size-3.5 inline" aria-hidden="true" />{" "}
                  Expected payout (₹)
                </>
              }
              value={state.expectedPayout}
              onChange={(v) => update("expectedPayout", v)}
              placeholder="e.g. 800"
            />
          </div>
        )}

        {state.jobType === "temporary" && (
          <div className="grid gap-3 md:grid-cols-2">
            <NumericField
              id="days"
              label="Duration (days)"
              value={state.durationDays}
              onChange={(v) => update("durationDays", v)}
              placeholder="e.g. 5"
              integer
            />
            <NumericField
              id="daily"
              label={
                <>
                  <Banknote className="size-3.5 inline" aria-hidden="true" />{" "}
                  Daily payment (₹)
                </>
              }
              value={state.dailyPayment}
              onChange={(v) => update("dailyPayment", v)}
              placeholder="e.g. 1500"
            />
          </div>
        )}

        {state.jobType === "permanent" && (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="working-hours">Working hours</Label>
              <select
                id="working-hours"
                value={state.workingHours}
                onChange={(e) =>
                  update("workingHours", e.target.value as WorkingHours | "")
                }
                className={selectClass}
              >
                <option value="">Select hours</option>
                {WORKING_HOURS.map((w) => (
                  <option key={w} value={w}>
                    {w === "24x7" ? "24×7" : "12 hr / day"}
                  </option>
                ))}
              </select>
            </div>
            <NumericField
              id="salary"
              label={
                <>
                  <Banknote className="size-3.5 inline" aria-hidden="true" />{" "}
                  Monthly salary (₹)
                </>
              }
              value={state.monthlySalary}
              onChange={(v) => update("monthlySalary", v)}
              placeholder="e.g. 25000"
            />
          </div>
        )}
      </Section>

      {serverError && <ApiError error={serverError} compact />}

      <div className="flex items-center justify-end border-t border-border pt-5">
        <Button
          type="submit"
          disabled={submitting}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Posting…
            </>
          ) : (
            <>
              <Send className="size-4" aria-hidden="true" />
              Post job
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

function NumericField({
  id,
  label,
  value,
  onChange,
  placeholder,
  integer,
}: {
  id: string;
  label: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  integer?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <input
        id={id}
        type="number"
        inputMode={integer ? "numeric" : "decimal"}
        min={1}
        step={integer ? 1 : "any"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
    </div>
  );
}
