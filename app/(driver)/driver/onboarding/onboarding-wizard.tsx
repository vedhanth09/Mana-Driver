"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/components/shared/api-error";
import { apiGet, apiPost, apiUpload, ApiClientError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { CITIES, CITY_AREAS, type City } from "@/lib/constants/cities";
import {
  CAR_TYPES,
  DOCUMENT_TYPES,
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

const STEPS = [
  { id: 1, label: "Personal" },
  { id: 2, label: "Location" },
  { id: 3, label: "Skills" },
  { id: 4, label: "Documents" },
] as const;

export type WizardState = {
  // Step 1
  age: string;
  address: string;
  // Step 2
  city: City | "";
  areas: string[];
  // Step 3
  transmissionTypes: TransmissionType[];
  vehicleCategories: CarType[];
  languages: Language[];
  // Step 4
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

  // Bootstrap: if profile already exists (refresh case), pre-fill state
  // and jump straight to documents.
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
        // Profile exists — proceed.
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
    if (filesEntries.length < DOCUMENT_TYPES.length) {
      setServerError("Upload Aadhaar, PAN, and Driving Licence to continue");
      return false;
    }
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
      toast.success("You're all set. Welcome aboard.");
      router.push("/driver");
      router.refresh();
      return;
    }
    setStep((s) => Math.min(4, s + 1));
  }

  function goBack() {
    setServerError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  if (bootstrapping) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
        <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 md:px-6 md:py-12">
      <header className="flex flex-col gap-2 text-center">
        <p className="text-sm font-semibold tracking-wider text-secondary uppercase">
          Onboarding
        </p>
        <h1 className="text-h1-mobile font-bold text-foreground md:text-h1">
          Welcome, {fullName.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground">
          Tell us about yourself so customers can find you for the right jobs.
        </p>
      </header>

      <Stepper current={step} />

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-7">
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

        {serverError && (
          <div className="mt-5">
            <ApiError error={serverError} compact />
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-2 border-t border-border pt-5">
          <Button
            type="button"
            variant="ghost"
            onClick={goBack}
            disabled={step === 1 || submitting}
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            Back
          </Button>
          <Button
            type="button"
            onClick={() => void goNext()}
            disabled={submitting}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                {step === 4 ? "Uploading…" : "Saving…"}
              </>
            ) : step === 4 ? (
              <>
                <Check className="size-4" aria-hidden="true" />
                Finish
              </>
            ) : (
              <>
                Continue
                <ChevronRight className="size-4" aria-hidden="true" />
              </>
            )}
          </Button>
        </div>
      </section>
    </main>
  );
}

function Stepper({ current }: { current: number }) {
  const progress = ((current - 1) / (STEPS.length - 1)) * 100;
  return (
    <div className="flex flex-col gap-3">
      <div className="relative h-1.5 rounded-full bg-muted">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-secondary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <ol className="flex items-center justify-between text-xs font-medium">
        {STEPS.map((s) => {
          const done = s.id < current;
          const active = s.id === current;
          return (
            <li key={s.id} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors",
                  done && "border-secondary bg-secondary text-secondary-foreground",
                  active &&
                    "border-primary bg-primary/5 text-primary",
                  !done && !active && "border-border bg-card text-muted-foreground",
                )}
              >
                {done ? <Check className="size-4" aria-hidden="true" /> : s.id}
              </div>
              <span
                className={cn(
                  "text-xs",
                  active ? "text-foreground font-semibold" : "text-muted-foreground",
                )}
              >
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
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
    const missing = DOCUMENT_TYPES.filter((d) => !s.files[d]);
    if (missing.length > 0) {
      return {
        ok: false,
        message: `Upload all three documents to continue`,
      };
    }
    return { ok: true };
  }
  return { ok: true };
}
