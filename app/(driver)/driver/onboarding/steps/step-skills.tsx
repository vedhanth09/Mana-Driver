"use client";

import { Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  CAR_TYPES,
  LANGUAGES,
  TRANSMISSION_TYPES,
  type CarType,
  type Language,
  type TransmissionType,
} from "@/lib/constants/enums";
import { cn } from "@/lib/utils";

type Props = {
  transmissionTypes: TransmissionType[];
  vehicleCategories: CarType[];
  languages: Language[];
  onChange: (
    patch: Partial<{
      transmissionTypes: TransmissionType[];
      vehicleCategories: CarType[];
      languages: Language[];
    }>,
  ) => void;
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

const languageLabels: Record<Language, string> = {
  english: "English",
  telugu: "Telugu",
  hindi: "Hindi",
};

export function StepSkills({
  transmissionTypes,
  vehicleCategories,
  languages,
  onChange,
}: Props) {
  return (
    <div className="flex flex-col gap-7">
      <ChipGroup
        label="Transmission types"
        options={TRANSMISSION_TYPES.map((t) => ({ value: t, label: transmissionLabels[t] }))}
        selected={transmissionTypes}
        onToggle={(value) =>
          onChange({
            transmissionTypes: toggle(transmissionTypes, value),
          })
        }
      />

      <ChipGroup
        label="Vehicle categories"
        options={CAR_TYPES.map((t) => ({ value: t, label: carLabels[t] }))}
        selected={vehicleCategories}
        onToggle={(value) =>
          onChange({
            vehicleCategories: toggle(vehicleCategories, value),
          })
        }
      />

      <ChipGroup
        label="Languages spoken"
        options={LANGUAGES.map((l) => ({ value: l, label: languageLabels[l] }))}
        selected={languages}
        onToggle={(value) =>
          onChange({
            languages: toggle(languages, value),
          })
        }
      />
    </div>
  );
}

function toggle<T extends string>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

function ChipGroup<T extends string>({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: ReadonlyArray<{ value: T; label: string }>;
  selected: T[];
  onToggle: (value: T) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <Label className="text-sm">
        {label}
        {selected.length > 0 && (
          <span className="ml-1 text-muted-foreground">({selected.length})</span>
        )}
      </Label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isSelected = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onToggle(opt.value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:border-primary/40",
              )}
            >
              {isSelected && <Check className="size-3.5" aria-hidden="true" />}
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
