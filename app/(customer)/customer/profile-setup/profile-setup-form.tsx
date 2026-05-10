"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/components/shared/api-error";
import { apiPost, ApiClientError } from "@/lib/api";
import { CITIES, type City } from "@/lib/constants/cities";
import {
  CAR_TYPES,
  LANGUAGES,
  TRANSMISSION_TYPES,
  type CarType,
  type Language,
  type TransmissionType,
} from "@/lib/constants/enums";
import { customerProfileSchema } from "@/schemas/customer.schema";
import { cn } from "@/lib/utils";

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

const languageLabels: Record<Language, string> = {
  english: "English",
  telugu: "Telugu",
  hindi: "Hindi",
};

type FormState = {
  city: City | "";
  languages: Language[];
  carMake: string;
  carModel: string;
  preferredTransmission: TransmissionType | "";
  preferredVehicle: CarType | "";
};

const INITIAL_STATE: FormState = {
  city: "",
  languages: [],
  carMake: "",
  carModel: "",
  preferredTransmission: "",
  preferredVehicle: "",
};

export function ProfileSetupForm({ fullName }: { fullName: string }) {
  const router = useRouter();
  const [state, setState] = useState<FormState>(INITIAL_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  function toggleLanguage(lang: Language) {
    update(
      "languages",
      state.languages.includes(lang)
        ? state.languages.filter((l) => l !== lang)
        : [...state.languages, lang],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    if (!state.city) {
      setServerError("Choose your city to continue");
      return;
    }

    const carMake = state.carMake.trim();
    const carModel = state.carModel.trim();
    const hasAnyCarField = carMake.length > 0 || carModel.length > 0;
    if (hasAnyCarField && (!carMake || !carModel)) {
      setServerError("Enter both car make and model, or leave both blank");
      return;
    }

    const payload = {
      city: state.city,
      languages: state.languages,
      carDetails: hasAnyCarField ? { make: carMake, model: carModel } : null,
      preferences:
        state.preferredTransmission || state.preferredVehicle
          ? {
              transmissionType: state.preferredTransmission || null,
              vehicleCategory: state.preferredVehicle || null,
            }
          : null,
    };

    const parsed = customerProfileSchema.safeParse(payload);
    if (!parsed.success) {
      setServerError(parsed.error.issues[0]?.message ?? "Form is invalid");
      return;
    }

    setSubmitting(true);
    try {
      await apiPost("/api/customer/profile", parsed.data);
      toast.success("Profile saved. Welcome aboard.");
      router.push("/customer");
      router.refresh();
    } catch (e) {
      if (e instanceof ApiClientError && e.code === "CONFLICT") {
        // Profile already exists — proceed.
        router.push("/customer");
        router.refresh();
        return;
      }
      setServerError(
        e instanceof ApiClientError ? e.message : "Couldn't save profile",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8 md:px-6 md:py-12">
      <header className="flex flex-col gap-2 text-center">
        <p className="text-sm font-semibold tracking-wider text-secondary uppercase">
          Profile setup
        </p>
        <h1 className="text-h1-mobile font-bold text-foreground md:text-h1">
          Welcome, {fullName.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted-foreground">
          Tell us where you&apos;re based and the kind of driver you prefer. You
          can update these later.
        </p>
      </header>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="flex flex-col gap-7 rounded-2xl border border-border bg-card p-5 shadow-sm md:p-7"
      >
        <Section
          title="City"
          description="Required — drivers in this city will see your jobs."
        >
          <Label htmlFor="city" className="sr-only">
            City
          </Label>
          <select
            id="city"
            value={state.city}
            onChange={(e) => update("city", e.target.value as City | "")}
            className={cn(
              "h-11 w-full appearance-none rounded-lg border border-border bg-background px-3 text-sm text-foreground",
              "outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20",
            )}
          >
            <option value="">Select your city</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Section>

        <Section
          title="Languages you speak"
          description="Optional — drivers who match get priority in your job listings."
        >
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((l) => {
              const selected = state.languages.includes(l);
              return (
                <button
                  key={l}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleLanguage(l)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:border-primary/40",
                  )}
                >
                  {selected && <Check className="size-3.5" aria-hidden="true" />}
                  {languageLabels[l]}
                </button>
              );
            })}
          </div>
        </Section>

        <Section
          title="Your car (optional)"
          description="If you have a specific car you want driven, share it here."
        >
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="car-make">Make</Label>
              <Input
                id="car-make"
                value={state.carMake}
                onChange={(e) => update("carMake", e.target.value)}
                placeholder="Honda"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="car-model">Model</Label>
              <Input
                id="car-model"
                value={state.carModel}
                onChange={(e) => update("carModel", e.target.value)}
                placeholder="City"
              />
            </div>
          </div>
        </Section>

        <Section
          title="Driver preferences (optional)"
          description="What kind of driver suits you best? You can leave this blank."
        >
          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pref-transmission">Preferred transmission</Label>
              <select
                id="pref-transmission"
                value={state.preferredTransmission}
                onChange={(e) =>
                  update(
                    "preferredTransmission",
                    e.target.value as TransmissionType | "",
                  )
                }
                className={cn(
                  "h-11 w-full appearance-none rounded-lg border border-border bg-background px-3 text-sm text-foreground",
                  "outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20",
                )}
              >
                <option value="">No preference</option>
                {TRANSMISSION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {transmissionLabels[t]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pref-vehicle">Preferred vehicle category</Label>
              <select
                id="pref-vehicle"
                value={state.preferredVehicle}
                onChange={(e) =>
                  update("preferredVehicle", e.target.value as CarType | "")
                }
                className={cn(
                  "h-11 w-full appearance-none rounded-lg border border-border bg-background px-3 text-sm text-foreground",
                  "outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20",
                )}
              >
                <option value="">No preference</option>
                {CAR_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {carLabels[t]}
                  </option>
                ))}
              </select>
            </div>
          </div>
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
                Saving…
              </>
            ) : (
              <>
                Continue
                <ChevronRight className="size-4" aria-hidden="true" />
              </>
            )}
          </Button>
        </div>
      </form>
    </main>
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
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}
