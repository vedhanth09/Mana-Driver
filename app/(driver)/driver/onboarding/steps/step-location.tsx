"use client";

import { Building2, Check, MapPin } from "lucide-react";
import { Label } from "@/components/ui/label";
import { CITIES, CITY_AREAS, type City } from "@/lib/constants/cities";
import { cn } from "@/lib/utils";

type Props = {
  city: City | "";
  areas: string[];
  onCityChange: (city: City | "") => void;
  onAreasChange: (areas: string[]) => void;
};

const triggerClass = cn(
  "h-11 w-full rounded-lg border border-border bg-background px-3 text-base text-foreground",
  "outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20",
);

export function StepLocation({ city, areas, onCityChange, onAreasChange }: Props) {
  const availableAreas = city ? CITY_AREAS[city] : [];

  const toggleArea = (area: string) => {
    if (areas.includes(area)) {
      onAreasChange(areas.filter((a) => a !== area));
    } else {
      onAreasChange([...areas, area]);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="city">City</Label>
        <div className="relative">
          <Building2
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <select
            id="city"
            value={city}
            onChange={(e) => onCityChange(e.target.value as City | "")}
            className={cn(triggerClass, "pl-10 appearance-none")}
          >
            <option value="">Select your city…</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm">
            Service areas
            {areas.length > 0 && (
              <span className="ml-1 text-muted-foreground">({areas.length} selected)</span>
            )}
          </Label>
          {city && areas.length > 0 && (
            <button
              type="button"
              onClick={() => onAreasChange([])}
              className="text-xs font-medium text-secondary hover:underline"
            >
              Clear
            </button>
          )}
        </div>

        {!city ? (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            <MapPin className="size-4" aria-hidden="true" />
            Choose a city first to see service areas.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {availableAreas.map((area) => {
              const selected = areas.includes(area);
              return (
                <button
                  key={area}
                  type="button"
                  onClick={() => toggleArea(area)}
                  aria-pressed={selected}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:border-primary/40",
                  )}
                >
                  {selected && <Check className="size-3.5" aria-hidden="true" />}
                  {area}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
