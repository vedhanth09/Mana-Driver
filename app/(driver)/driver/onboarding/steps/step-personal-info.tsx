"use client";

import { Calendar, MapPin } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DRIVER_AGE_MAX, DRIVER_AGE_MIN } from "@/lib/constants/enums";
import { cn } from "@/lib/utils";

const inputClass = cn(
  "h-11 w-full rounded-lg border border-border bg-background px-3 text-base text-foreground placeholder:text-muted-foreground",
  "outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20",
);

type Props = {
  value: { age: string; address: string };
  onChange: (patch: Partial<{ age: string; address: string }>) => void;
};

export function StepPersonalInfo({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h2 className="text-h3 font-semibold text-foreground">Personal information</h2>
        <p className="text-sm text-muted-foreground">
          We need a bit about you so customers know who&apos;s behind the wheel.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="age">Age</Label>
          <div className="relative">
            <Calendar
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="age"
              type="number"
              inputMode="numeric"
              min={DRIVER_AGE_MIN}
              max={DRIVER_AGE_MAX}
              value={value.age}
              onChange={(e) => onChange({ age: e.target.value })}
              placeholder={`${DRIVER_AGE_MIN}–${DRIVER_AGE_MAX}`}
              className={cn(inputClass, "pl-10")}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Drivers must be {DRIVER_AGE_MIN}–{DRIVER_AGE_MAX} years old.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="address">Address</Label>
          <div className="relative">
            <MapPin
              className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Textarea
              id="address"
              rows={3}
              value={value.address}
              onChange={(e) => onChange({ address: e.target.value })}
              placeholder="Flat, building, street, area…"
              className="pl-10"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Used for verification only — never shown to customers.
          </p>
        </div>
      </div>
    </div>
  );
}
