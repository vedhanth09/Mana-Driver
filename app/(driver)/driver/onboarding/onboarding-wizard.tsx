"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/components/shared/api-error";
import { apiGet, apiPost, apiUpload, ApiClientError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { CITIES, CITY_AREAS, type City } from "@/lib/constants/cities";
import {
  CAR_TYPES,
  DRIVER_AGE_MAX,
  DRIVER_AGE_MIN,
  LANGUAGES,
  TRANSMISSION_TYPES,
  type CarType,
  type DocumentType,
  type Language,
  type TransmissionType,
} from "@/lib/constants/enums";
import { driverProfileSchema } from "@/schemas/driver.schema";
import { StepPersonalInfo } from "./steps/step-personal-info";
import { StepLocation } from "./steps/step-location";
import { StepSkills } from "./steps/step-skills";
import { StepDocuments } from "./steps/step-documents";

type StepMeta = {
  id: number;
  label: string;
  image: string;
  caption: { title: string; description: string; Icon: typeof MapPin };
};

const STEPS: ReadonlyArray<StepMeta> = [
  {
    id: 1,
    label: "Personal",
    image: "/onboarding/personal.jpg",
    caption: {
      title: "Join the network",
      description:
        "Flexible hours, reliable payouts, and a platform built for professional drivers.",
      Icon: Sparkles,
    },
  },
  {
    id: 2,
    label: "Location",
    image: "/onboarding/location.jpg",
    caption: {
      title: "Live Routing",
      description: "High-demand areas matched in real time.",
      Icon: MapPin,
    },
  },
  {
    id: 3,
    label: "Skills",
    image: "/onboarding/skills.jpg",
    caption: {
      title: "Clear Communication",
      description:
        "Drivers who list multiple languages and specialized vehicle skills earn up to 30% more on premium bookings.",
      Icon: MessageSquare,
    },
  },
  {
    id: 4,
    label: "Documents",
    image: "/onboarding/documents.jpg",
    caption: {
      title: "ID Verified",
      description: "Encrypted, secure upload — reviewed within 24 hours.",
      Icon: ShieldCheck,
    },
  },
] as const;

export type WizardState = {
  age: string;
  address: string;
  city: City | "";
  areas: string[];
  transmissionTypes: TransmissionType[];
  vehicleCategories: CarType[];
  languages: Language[];
  files: Partial<Record<DocumentType, File>>;
};

const INITIAL_STATE: WizardState = {
  age: "",
  address: "",
  city: "",
  areas: [],
  transmissionTypes: [],
  vehicleCategories: [],
  languages: [],
  files: {},
};

type ExistingProfile = {
  age: number;
  address: string;
  city: string;
  areas: string[];
  transmissionTypes: TransmissionType[];
  vehicleCategories: CarType[];
  languages: Language[];
  documents: Record<
    DocumentType,
    { url: string; cloudinaryId: string } | null
  >;
};

export function OnboardingWizard({ fullName }: { fullName: string }) {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [state, setState] = useState<WizardState>(INITIAL_STATE);
  const [profileSaved, setProfileSaved] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await apiGet<{ profile: ExistingProfile | null }>(
          "/api/driver/profile",
        );
        if (cancelled) return;
        if (res.profile) {
          const p = res.profile;
          setState((prev) => ({
            ...prev,
            age: String(p.age),
            address: p.address,
            city: (CITIES as readonly string[]).includes(p.city)
              ? (p.city as City)
              : "",
            areas: p.areas ?? [],
            transmissionTypes: p.transmissionTypes ?? [],
            vehicleCategories: p.vehicleCategories ?? [],
            languages: p.languages ?? [],
          }));
          setProfileSaved(true);
          setStep(4);
        }
      } catch {
        // Ignore — first-time onboarding has no profile yet.
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const update = <K extends keyof WizardState>(key: K, value: WizardState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const stepValidation = useMemo(() => validateStep(step, state), [step, state]);
  const meta = STEPS[step - 1]!;
  const progress = (step / STEPS.length) * 100;

  async function persistProfile(): Promise<boolean> {
    setServerError(null);
    const parsed = driverProfileSchema.safeParse({
      age: Number(state.age),
      address: state.address.trim(),
      city: state.city,
      areas: state.areas,
      transmissionTypes: state.transmissionTypes,
      vehicleCategories: state.vehicleCategories,
      languages: state.languages,
    });

    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Form is invalid";
      setServerError(msg);
      return false;
    }

    setSubmitting(true);
    try {
      await apiPost("/api/driver/profile", parsed.data);
      setProfileSaved(true);
      return true;
    } catch (e) {
      if (e instanceof ApiClientError && e.code === "CONFLICT") {
        setProfileSaved(true);
        return true;
      }
      setServerError(
        e instanceof ApiClientError ? e.message : "Couldn't save profile",
      );
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  async function uploadDocs(): Promise<boolean> {
    setServerError(null);
    const filesEntries = Object.entries(state.files) as [DocumentType, File][];
    if (filesEntries.length === 0) return true;
    const form = new FormData();
    for (const [docType, file] of filesEntries) {
      form.append(docType, file);
    }
    setSubmitting(true);
    try {
      await apiUpload("/api/driver/documents", form);
      return true;
    } catch (e) {
      setServerError(
        e instanceof ApiClientError ? e.message : "Couldn't upload documents",
      );
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  async function goNext() {
    if (!stepValidation.ok) {
      setServerError(stepValidation.message);
      return;
    }
    setServerError(null);
    if (step === 3) {
      if (!profileSaved) {
        const ok = await persistProfile();
        if (!ok) return;
      }
      setStep(4);
      return;
    }
    if (step === 4) {
      const ok = await uploadDocs();
      if (!ok) return;
      const uploadedCount = Object.keys(state.files).length;
      toast.success(
        uploadedCount === 0
          ? "You're in. Add your documents anytime to get verified."
          : "You're all set. Welcome aboard.",
      );
      router.push("/driver");
      router.refresh();
      return;
    }
    setStep((s) => Math.min(STEPS.length, s + 1));
  }

  function goBack() {
    setServerError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  if (bootstrapping) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6">
        <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
      </main>
    );
  }

  const isLast = step === STEPS.length;
  const uploadedCount = Object.keys(state.files).length;

  return (
    <main className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-[1.05fr_1fr]">
      {/* Left — wizard panel */}
      <section className="flex flex-col">
        {/* Top bar: brand + progress */}
        <header className="flex items-center gap-4 border-b border-border bg-card/60 px-6 py-4 sm:px-10">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-foreground"
          >
            ManaDriver
          </Link>
          <div className="flex flex-1 items-center gap-3">
            <div className="flex flex-1 items-center gap-3">
              <span className="text-xs font-semibold tracking-wide text-foreground whitespace-nowrap">
                Step {step}: {meta.label}
              </span>
              <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="flex flex-1 items-start justify-center px-6 py-10 sm:px-10 lg:items-center lg:px-16 lg:py-12">
          <div className="w-full max-w-xl">
            <div className="mb-6">
              <p className="text-label-caps tracking-wider text-muted-foreground uppercase">
                Welcome, {fullName.split(" ")[0]}
              </p>
              <h1 className="mt-1 text-h1-mobile font-bold text-foreground sm:text-h1">
                {stepHeading(step)}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {stepSubheading(step)}
              </p>
            </div>

            <div className="flex flex-col gap-6">
              {step === 1 && (
                <StepPersonalInfo
                  value={{ age: state.age, address: state.address }}
                  onChange={(patch) => setState((s) => ({ ...s, ...patch }))}
                />
              )}
              {step === 2 && (
                <StepLocation
                  city={state.city}
                  areas={state.areas}
                  onCityChange={(city) => {
                    update("city", city);
                    update("areas", []);
                  }}
                  onAreasChange={(areas) => update("areas", areas)}
                />
              )}
              {step === 3 && (
                <StepSkills
                  transmissionTypes={state.transmissionTypes}
                  vehicleCategories={state.vehicleCategories}
                  languages={state.languages}
                  onChange={(patch) => setState((s) => ({ ...s, ...patch }))}
                />
              )}
              {step === 4 && (
                <StepDocuments
                  files={state.files}
                  onChange={(files) => update("files", files)}
                />
              )}

              {serverError && <ApiError error={serverError} compact />}

              <div className="mt-2 flex items-center justify-between gap-2 border-t border-border pt-5">
                <button
                  type="button"
                  onClick={goBack}
                  disabled={step === 1 || submitting}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted",
                    "disabled:pointer-events-none disabled:opacity-40",
                  )}
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Back
                </button>
                <Button
                  type="button"
                  onClick={() => void goNext()}
                  disabled={submitting}
                  className="h-11 gap-2 bg-primary px-6 text-base text-primary-foreground hover:bg-primary/90"
                >
                  {submitting ? (
                    <>
                      <Loader2
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                      {isLast ? "Uploading…" : "Saving…"}
                    </>
                  ) : isLast ? (
                    <>
                      <Check className="size-4" aria-hidden="true" />
                      {uploadedCount === 0 ? "Skip & finish" : "Finish"}
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Right — hero image panel */}
      <aside className="relative hidden overflow-hidden bg-primary lg:block">
        {STEPS.map((s) => {
          const isActive = s.id === step;
          const Caption = s.caption.Icon;
          return (
            <div
              key={s.id}
              aria-hidden={!isActive}
              className={cn(
                "absolute inset-0 transition-opacity duration-500",
                isActive ? "opacity-100" : "pointer-events-none opacity-0",
              )}
            >
              {/* Fallback gradient background */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_30%,rgba(16,185,129,0.22),transparent_55%),radial-gradient(circle_at_80%_75%,rgba(59,130,246,0.16),transparent_55%)] bg-primary" />

              {/* Image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.image}
                alt=""
                className="absolute inset-0 size-full object-cover"
                onError={(e) => {
                  // Hide broken image so the gradient shows through.
                  e.currentTarget.style.display = "none";
                }}
              />

              {/* Bottom gradient for caption legibility */}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

              {/* Caption card */}
              <div className="absolute right-8 bottom-8 left-8 max-w-md">
                <div className="rounded-2xl bg-card/95 p-4 shadow-lg ring-1 ring-border backdrop-blur">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-secondary">
                      <Caption className="size-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {s.caption.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {s.caption.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </aside>
    </main>
  );
}

function stepHeading(step: number): string {
  switch (step) {
    case 1:
      return "Let's get started.";
    case 2:
      return "Where do you want to drive?";
    case 3:
      return "Skills & Languages";
    case 4:
      return "Upload Documents";
    default:
      return "";
  }
}

function stepSubheading(step: number): string {
  switch (step) {
    case 1:
      return "Enter your personal details to begin setting up your driver profile. This information helps us verify your identity.";
    case 2:
      return "Select your primary city and preferred operating zones to ensure we match you with relevant jobs.";
    case 3:
      return "Select the vehicle types you are comfortable driving and the languages you speak fluently to match with the best clients.";
    case 4:
      return "Please provide clear photos of your required documents to verify your identity and eligibility to drive.";
    default:
      return "";
  }
}

function validateStep(
  step: number,
  s: WizardState,
): { ok: true } | { ok: false; message: string } {
  if (step === 1) {
    const ageNum = Number(s.age);
    if (!s.age || !Number.isFinite(ageNum)) {
      return { ok: false, message: "Enter your age" };
    }
    if (ageNum < DRIVER_AGE_MIN || ageNum > DRIVER_AGE_MAX) {
      return {
        ok: false,
        message: `Age must be between ${DRIVER_AGE_MIN} and ${DRIVER_AGE_MAX}`,
      };
    }
    if (!s.address.trim()) {
      return { ok: false, message: "Enter your address" };
    }
    return { ok: true };
  }
  if (step === 2) {
    if (!s.city) return { ok: false, message: "Choose your city" };
    if (s.areas.length === 0)
      return { ok: false, message: "Select at least one service area" };
    const valid = new Set(CITY_AREAS[s.city] ?? []);
    if (s.areas.some((a) => !valid.has(a))) {
      return { ok: false, message: "An area is no longer valid for this city" };
    }
    return { ok: true };
  }
  if (step === 3) {
    if (s.transmissionTypes.length === 0)
      return { ok: false, message: "Select at least one transmission type" };
    if (s.vehicleCategories.length === 0)
      return { ok: false, message: "Select at least one vehicle category" };
    if (s.languages.length === 0)
      return { ok: false, message: "Select at least one language" };
    if (!TRANSMISSION_TYPES.every || !CAR_TYPES.every || !LANGUAGES.every) {
      // type-only guard so unused imports don't get tree-shaken in dev
    }
    return { ok: true };
  }
  if (step === 4) {
    return { ok: true };
  }
  return { ok: true };
}
