"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  BadgeCheck,
  Calendar,
  Car,
  Check,
  CheckCircle2,
  FileText,
  Languages as LanguagesIcon,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  ShieldX,
  Sliders,
  Star,
  Trash2,
  Trophy,
  User as UserIcon,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RatingStars } from "@/components/ui/rating-stars";
import { cn } from "@/lib/utils";
import { apiDelete, apiPatch, ApiClientError } from "@/lib/api";
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
  type UserRole,
} from "@/lib/constants/enums";

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

const documentLabels: Record<DocumentType, string> = {
  aadhaar: "Aadhaar Card",
  pan: "PAN Card",
  license: "Driving License",
};

// Narrow, serializable types passed from server pages.
export type ProfileUser = {
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  avatarUrl?: string;
  isProfileComplete: boolean;
  createdAt: string;
};

export type DriverProfileData = {
  age: number;
  city: string;
  address: string;
  areas: string[];
  transmissionTypes: TransmissionType[];
  vehicleCategories: CarType[];
  languages: Language[];
  documents: Record<DocumentType, { uploadedAt: string } | null>;
  isVerified: boolean;
  averageRating: number;
  totalJobsCompleted: number;
};

export type CustomerProfileData = {
  city: string;
  carDetails: { make: string; model: string } | null;
  preferences: {
    transmissionType: TransmissionType | null;
    vehicleCategory: CarType | null;
  } | null;
  languages: Language[];
  averageRating: number;
};

function initialsFor(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function formatJoinedDate(date: string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

function errorMessage(e: unknown, fallback: string): string {
  if (e instanceof ApiClientError) return e.message;
  if (e instanceof Error) return e.message;
  return fallback;
}

// ─────────────────────────────────────────────────────────────────────────────
// Building blocks
// ─────────────────────────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
  muted,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  value: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="size-4" aria-hidden={true} />
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span
          className={cn(
            "text-sm break-words",
            muted ? "text-muted-foreground italic" : "text-foreground"
          )}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  description,
  action,
  children,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Icon className="size-4 text-primary" aria-hidden={true} />
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          {action}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function EditActions({
  onCancel,
  saving,
  saveLabel = "Save",
}: {
  onCancel: () => void;
  saving: boolean;
  saveLabel?: string;
}) {
  return (
    <div className="flex justify-end gap-2 border-t border-border pt-3">
      <Button
        type="button"
        variant="ghost"
        onClick={onCancel}
        disabled={saving}
      >
        <X className="size-4" aria-hidden="true" />
        Cancel
      </Button>
      <Button type="submit" disabled={saving}>
        {saving ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Saving…
          </>
        ) : (
          <>
            <Check className="size-4" aria-hidden="true" />
            {saveLabel}
          </>
        )}
      </Button>
    </div>
  );
}

function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" variant="ghost" size="sm" onClick={onClick}>
      <Pencil className="size-3.5" aria-hidden="true" />
      Edit
    </Button>
  );
}

function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
      {message}
    </p>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="size-3.5" aria-hidden={true} />
        {label}
      </div>
      <div className="text-h3 font-bold text-foreground">{value}</div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

function ChipList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return (
      <span className="text-sm text-muted-foreground italic">Not specified</span>
    );
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <Badge key={item} variant="outline" className="capitalize">
          {item}
        </Badge>
      ))}
    </div>
  );
}

function TogglePill({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-foreground hover:border-primary/40"
      )}
    >
      {selected && <Check className="size-3.5" aria-hidden="true" />}
      {children}
    </button>
  );
}

const selectClass = cn(
  "h-10 w-full appearance-none rounded-lg border border-border bg-background px-3 text-sm text-foreground",
  "outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
);

// ─────────────────────────────────────────────────────────────────────────────
// Common sections
// ─────────────────────────────────────────────────────────────────────────────

function ProfileHeader({
  user,
  subtitle,
  verifiedBadge,
}: {
  user: ProfileUser;
  subtitle: string;
  verifiedBadge?: { verified: boolean };
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 py-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Avatar size="lg" className="size-16">
            {user.avatarUrl && (
              <AvatarImage src={user.avatarUrl} alt={user.fullName} />
            )}
            <AvatarFallback className="bg-primary text-base font-semibold text-primary-foreground">
              {initialsFor(user.fullName) || <UserIcon className="size-6" />}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-h2 font-bold text-foreground">{user.fullName}</h1>
              <Badge variant="secondary" className="capitalize">
                {user.role}
              </Badge>
              {verifiedBadge?.verified ? (
                <Badge className="gap-1 bg-status-permanent/10 text-status-permanent">
                  <BadgeCheck className="size-3" aria-hidden="true" />
                  Verified
                </Badge>
              ) : verifiedBadge ? (
                <Badge variant="outline" className="gap-1">
                  <ShieldX className="size-3" aria-hidden="true" />
                  Unverified
                </Badge>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
            <p className="text-xs text-muted-foreground">
              Member since {formatJoinedDate(user.createdAt)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ContactSection({ user }: { user: ProfileUser }) {
  return (
    <Section icon={UserIcon} title="Account details">
      <div className="grid gap-4 sm:grid-cols-2">
        <InfoRow icon={Mail} label="Email" value={user.email} />
        <InfoRow
          icon={Phone}
          label="Phone"
          value={user.phone || "Not provided"}
          muted={!user.phone}
        />
        <InfoRow
          icon={Calendar}
          label="Joined"
          value={formatJoinedDate(user.createdAt)}
        />
        <InfoRow
          icon={CheckCircle2}
          label="Profile status"
          value={
            <span
              className={cn(
                "font-medium",
                user.isProfileComplete
                  ? "text-status-permanent"
                  : "text-status-temporary"
              )}
            >
              {user.isProfileComplete ? "Complete" : "Incomplete"}
            </span>
          }
        />
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Driver editable sections
// ─────────────────────────────────────────────────────────────────────────────

type DriverLocationFields = Pick<
  DriverProfileData,
  "age" | "city" | "address" | "areas"
>;

function DriverLocationSection({
  data,
  onSaved,
}: {
  data: DriverLocationFields;
  onSaved: (next: DriverLocationFields) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    age: String(data.age),
    city: data.city as City | "",
    address: data.address,
    areas: data.areas,
  });

  function startEdit() {
    setForm({
      age: String(data.age),
      city: (CITIES as readonly string[]).includes(data.city)
        ? (data.city as City)
        : "",
      address: data.address,
      areas: data.areas,
    });
    setError(null);
    setEditing(true);
  }

  function cancel() {
    setEditing(false);
    setError(null);
  }

  function toggleArea(area: string) {
    setForm((s) => ({
      ...s,
      areas: s.areas.includes(area)
        ? s.areas.filter((a) => a !== area)
        : [...s.areas, area],
    }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const ageNum = Number(form.age);
    if (!form.age || !Number.isFinite(ageNum)) {
      setError("Enter a valid age");
      return;
    }
    if (ageNum < DRIVER_AGE_MIN || ageNum > DRIVER_AGE_MAX) {
      setError(`Age must be between ${DRIVER_AGE_MIN} and ${DRIVER_AGE_MAX}`);
      return;
    }
    if (!form.address.trim()) {
      setError("Address is required");
      return;
    }
    if (!form.city) {
      setError("Choose your city");
      return;
    }
    if (form.areas.length === 0) {
      setError("Select at least one service area");
      return;
    }

    setSaving(true);
    try {
      await apiPatch("/api/driver/profile", {
        age: ageNum,
        address: form.address.trim(),
        city: form.city,
        areas: form.areas,
      });
      onSaved({
        age: ageNum,
        address: form.address.trim(),
        city: form.city,
        areas: form.areas,
      });
      setEditing(false);
      toast.success("Location updated");
    } catch (e) {
      setError(errorMessage(e, "Couldn't save location"));
    } finally {
      setSaving(false);
    }
  }

  const availableAreas = form.city ? CITY_AREAS[form.city] : [];

  return (
    <Section
      icon={MapPin}
      title="Location & service areas"
      action={editing ? null : <EditButton onClick={startEdit} />}
    >
      {!editing ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <InfoRow icon={MapPin} label="City" value={data.city} />
          <InfoRow
            icon={UserIcon}
            label="Age"
            value={`${data.age} years`}
          />
          <div className="sm:col-span-2">
            <InfoRow icon={MapPin} label="Address" value={data.address} />
          </div>
          <div className="sm:col-span-2">
            <InfoRow
              icon={MapPin}
              label="Service areas"
              value={
                data.areas.length > 0 ? (
                  <ChipList items={data.areas} />
                ) : (
                  "Not specified"
                )
              }
              muted={data.areas.length === 0}
            />
          </div>
        </div>
      ) : (
        <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="driver-age">Age</Label>
              <Input
                id="driver-age"
                type="number"
                min={DRIVER_AGE_MIN}
                max={DRIVER_AGE_MAX}
                value={form.age}
                onChange={(e) =>
                  setForm((s) => ({ ...s, age: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="driver-city">City</Label>
              <select
                id="driver-city"
                value={form.city}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    city: e.target.value as City | "",
                    areas: [],
                  }))
                }
                className={selectClass}
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
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="driver-address">Address</Label>
            <Input
              id="driver-address"
              value={form.address}
              onChange={(e) =>
                setForm((s) => ({ ...s, address: e.target.value }))
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>
              Service areas
              {form.areas.length > 0 && (
                <span className="ml-1 text-muted-foreground">
                  ({form.areas.length} selected)
                </span>
              )}
            </Label>
            {!form.city ? (
              <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                <MapPin className="size-3.5" aria-hidden="true" />
                Choose a city first to see service areas.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableAreas.map((area) => (
                  <TogglePill
                    key={area}
                    selected={form.areas.includes(area)}
                    onClick={() => toggleArea(area)}
                  >
                    {area}
                  </TogglePill>
                ))}
              </div>
            )}
          </div>
          <FormError message={error} />
          <EditActions onCancel={cancel} saving={saving} />
        </form>
      )}
    </Section>
  );
}

type DriverSkillsFields = Pick<
  DriverProfileData,
  "transmissionTypes" | "vehicleCategories" | "languages"
>;

function DriverSkillsSection({
  data,
  onSaved,
}: {
  data: DriverSkillsFields;
  onSaved: (next: DriverSkillsFields) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<DriverSkillsFields>(data);

  function startEdit() {
    setForm(data);
    setError(null);
    setEditing(true);
  }

  function cancel() {
    setEditing(false);
    setError(null);
  }

  function toggle<T extends string>(
    key: keyof DriverSkillsFields,
    value: T,
    list: readonly T[]
  ) {
    setForm((s) => {
      const current = s[key] as T[];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      // Preserve canonical ordering from constants for stable rendering.
      const ordered = list.filter((v) => next.includes(v));
      return { ...s, [key]: ordered };
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.transmissionTypes.length === 0) {
      setError("Select at least one transmission");
      return;
    }
    if (form.vehicleCategories.length === 0) {
      setError("Select at least one vehicle category");
      return;
    }
    if (form.languages.length === 0) {
      setError("Select at least one language");
      return;
    }
    setSaving(true);
    try {
      await apiPatch("/api/driver/profile", form);
      onSaved(form);
      setEditing(false);
      toast.success("Skills updated");
    } catch (e) {
      setError(errorMessage(e, "Couldn't save skills"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section
      icon={Car}
      title="Driving skills"
      description="Vehicle types and transmissions you can drive."
      action={editing ? null : <EditButton onClick={startEdit} />}
    >
      {!editing ? (
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              Transmissions
            </p>
            <ChipList
              items={data.transmissionTypes.map((t) => transmissionLabels[t])}
            />
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              Vehicle categories
            </p>
            <ChipList items={data.vehicleCategories.map((c) => carLabels[c])} />
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              Languages
            </p>
            <ChipList items={data.languages.map((l) => languageLabels[l])} />
          </div>
        </div>
      ) : (
        <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Transmissions</Label>
            <div className="flex flex-wrap gap-2">
              {TRANSMISSION_TYPES.map((t) => (
                <TogglePill
                  key={t}
                  selected={form.transmissionTypes.includes(t)}
                  onClick={() =>
                    toggle("transmissionTypes", t, TRANSMISSION_TYPES)
                  }
                >
                  {transmissionLabels[t]}
                </TogglePill>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Vehicle categories</Label>
            <div className="flex flex-wrap gap-2">
              {CAR_TYPES.map((c) => (
                <TogglePill
                  key={c}
                  selected={form.vehicleCategories.includes(c)}
                  onClick={() => toggle("vehicleCategories", c, CAR_TYPES)}
                >
                  {carLabels[c]}
                </TogglePill>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Languages</Label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((l) => (
                <TogglePill
                  key={l}
                  selected={form.languages.includes(l)}
                  onClick={() => toggle("languages", l, LANGUAGES)}
                >
                  {languageLabels[l]}
                </TogglePill>
              ))}
            </div>
          </div>
          <FormError message={error} />
          <EditActions onCancel={cancel} saving={saving} />
        </form>
      )}
    </Section>
  );
}

function DriverDocumentsSection({
  documents,
  isVerified,
}: {
  documents: DriverProfileData["documents"];
  isVerified: boolean;
}) {
  return (
    <Section
      icon={FileText}
      title="Documents"
      description="Identity and license documents on file."
      action={
        <Button
          type="button"
          variant="ghost"
          size="sm"
          render={<Link href="/driver/onboarding?edit=1" />}
        >
          <Pencil className="size-3.5" aria-hidden="true" />
          {isVerified ? "Re-upload" : "Upload"}
        </Button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {DOCUMENT_TYPES.map((docType) => {
          const asset = documents[docType];
          const uploaded = !!asset;
          return (
            <div
              key={docType}
              className={cn(
                "flex flex-col gap-1.5 rounded-lg border p-3",
                uploaded
                  ? "border-status-permanent/30 bg-status-permanent/5"
                  : "border-border bg-muted/30"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  {documentLabels[docType]}
                </span>
                {uploaded ? (
                  <BadgeCheck
                    className="size-4 text-status-permanent"
                    aria-hidden="true"
                  />
                ) : (
                  <ShieldX
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                )}
              </div>
              {uploaded ? (
                <span className="text-xs text-muted-foreground">
                  Uploaded {formatJoinedDate(asset.uploadedAt)}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground italic">
                  Not uploaded
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Customer editable sections
// ─────────────────────────────────────────────────────────────────────────────

function CustomerCitySection({
  city,
  onSaved,
}: {
  city: string;
  onSaved: (next: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [value, setValue] = useState<City | "">(
    (CITIES as readonly string[]).includes(city) ? (city as City) : ""
  );

  function startEdit() {
    setValue((CITIES as readonly string[]).includes(city) ? (city as City) : "");
    setError(null);
    setEditing(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!value) {
      setError("Choose your city");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiPatch("/api/customer/profile", { city: value });
      onSaved(value);
      setEditing(false);
      toast.success("City updated");
    } catch (e) {
      setError(errorMessage(e, "Couldn't save city"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section
      icon={MapPin}
      title="Base city"
      description="Jobs you post target this city."
      action={editing ? null : <EditButton onClick={startEdit} />}
    >
      {!editing ? (
        <InfoRow icon={MapPin} label="City" value={city} />
      ) : (
        <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="customer-city">City</Label>
            <select
              id="customer-city"
              value={value}
              onChange={(e) => setValue(e.target.value as City | "")}
              className={selectClass}
            >
              <option value="">Select your city…</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <FormError message={error} />
          <EditActions onCancel={() => setEditing(false)} saving={saving} />
        </form>
      )}
    </Section>
  );
}

function CustomerCarSection({
  carDetails,
  onSaved,
}: {
  carDetails: CustomerProfileData["carDetails"];
  onSaved: (next: CustomerProfileData["carDetails"]) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    make: carDetails?.make ?? "",
    model: carDetails?.model ?? "",
  });

  function startEdit() {
    setForm({ make: carDetails?.make ?? "", model: carDetails?.model ?? "" });
    setError(null);
    setEditing(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const make = form.make.trim();
    const model = form.model.trim();
    const both = make.length > 0 && model.length > 0;
    const neither = make.length === 0 && model.length === 0;

    if (!both && !neither) {
      setError("Enter both make and model, or leave both blank");
      return;
    }

    setSaving(true);
    try {
      const next = both ? { make, model } : null;
      await apiPatch("/api/customer/profile", { carDetails: next });
      onSaved(next);
      setEditing(false);
      toast.success("Car details updated");
    } catch (e) {
      setError(errorMessage(e, "Couldn't save car details"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section
      icon={Car}
      title="Your car"
      action={editing ? null : <EditButton onClick={startEdit} />}
    >
      {!editing ? (
        carDetails ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoRow icon={Car} label="Make" value={carDetails.make} />
            <InfoRow icon={Car} label="Model" value={carDetails.model} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No car details added.
          </p>
        )
      ) : (
        <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="car-make">Make</Label>
              <Input
                id="car-make"
                value={form.make}
                onChange={(e) =>
                  setForm((s) => ({ ...s, make: e.target.value }))
                }
                placeholder="Honda"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="car-model">Model</Label>
              <Input
                id="car-model"
                value={form.model}
                onChange={(e) =>
                  setForm((s) => ({ ...s, model: e.target.value }))
                }
                placeholder="City"
              />
            </div>
          </div>
          <FormError message={error} />
          <EditActions onCancel={() => setEditing(false)} saving={saving} />
        </form>
      )}
    </Section>
  );
}

function CustomerPreferencesSection({
  preferences,
  onSaved,
}: {
  preferences: CustomerProfileData["preferences"];
  onSaved: (next: CustomerProfileData["preferences"]) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    transmissionType: preferences?.transmissionType ?? ("" as TransmissionType | ""),
    vehicleCategory: preferences?.vehicleCategory ?? ("" as CarType | ""),
  });

  function startEdit() {
    setForm({
      transmissionType: preferences?.transmissionType ?? "",
      vehicleCategory: preferences?.vehicleCategory ?? "",
    });
    setError(null);
    setEditing(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const next =
        form.transmissionType || form.vehicleCategory
          ? {
              transmissionType: form.transmissionType || null,
              vehicleCategory: form.vehicleCategory || null,
            }
          : null;
      await apiPatch("/api/customer/profile", { preferences: next });
      onSaved(next);
      setEditing(false);
      toast.success("Preferences updated");
    } catch (e) {
      setError(errorMessage(e, "Couldn't save preferences"));
    } finally {
      setSaving(false);
    }
  }

  const hasPrefs =
    !!preferences &&
    (preferences.transmissionType !== null ||
      preferences.vehicleCategory !== null);

  return (
    <Section
      icon={Sliders}
      title="Driver preferences"
      description="What kind of driver suits you best."
      action={editing ? null : <EditButton onClick={startEdit} />}
    >
      {!editing ? (
        hasPrefs ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoRow
              icon={Sliders}
              label="Preferred transmission"
              value={
                preferences!.transmissionType
                  ? transmissionLabels[preferences!.transmissionType]
                  : "No preference"
              }
              muted={!preferences!.transmissionType}
            />
            <InfoRow
              icon={Car}
              label="Preferred vehicle"
              value={
                preferences!.vehicleCategory
                  ? carLabels[preferences!.vehicleCategory]
                  : "No preference"
              }
              muted={!preferences!.vehicleCategory}
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No preferences set.
          </p>
        )
      ) : (
        <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pref-transmission">Preferred transmission</Label>
              <select
                id="pref-transmission"
                value={form.transmissionType}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    transmissionType: e.target.value as TransmissionType | "",
                  }))
                }
                className={selectClass}
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
                value={form.vehicleCategory}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    vehicleCategory: e.target.value as CarType | "",
                  }))
                }
                className={selectClass}
              >
                <option value="">No preference</option>
                {CAR_TYPES.map((c) => (
                  <option key={c} value={c}>
                    {carLabels[c]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <FormError message={error} />
          <EditActions onCancel={() => setEditing(false)} saving={saving} />
        </form>
      )}
    </Section>
  );
}

function CustomerLanguagesSection({
  languages,
  onSaved,
}: {
  languages: Language[];
  onSaved: (next: Language[]) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Language[]>(languages);

  function startEdit() {
    setForm(languages);
    setError(null);
    setEditing(true);
  }

  function toggle(lang: Language) {
    setForm((s) => {
      const next = s.includes(lang) ? s.filter((l) => l !== lang) : [...s, lang];
      return LANGUAGES.filter((l) => next.includes(l));
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiPatch("/api/customer/profile", { languages: form });
      onSaved(form);
      setEditing(false);
      toast.success("Languages updated");
    } catch (e) {
      setError(errorMessage(e, "Couldn't save languages"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section
      icon={LanguagesIcon}
      title="Languages you speak"
      action={editing ? null : <EditButton onClick={startEdit} />}
    >
      {!editing ? (
        <ChipList items={languages.map((l) => languageLabels[l])} />
      ) : (
        <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((l) => (
              <TogglePill
                key={l}
                selected={form.includes(l)}
                onClick={() => toggle(l)}
              >
                {languageLabels[l]}
              </TogglePill>
            ))}
          </div>
          <FormError message={error} />
          <EditActions onCancel={() => setEditing(false)} saving={saving} />
        </form>
      )}
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Delete account
// ─────────────────────────────────────────────────────────────────────────────

const DELETE_CONFIRM_PHRASE = "DELETE";

function DeleteAccountSection({ role }: { role: UserRole }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matches = confirmText.trim() === DELETE_CONFIRM_PHRASE;

  const consequences =
    role === "driver"
      ? [
          "Your driver profile and uploaded documents",
          "Your applications to jobs",
          "Ratings you've given and received",
          "Notifications and account history",
        ]
      : [
          "Your customer profile and preferences",
          "Every job you've posted (and its applications)",
          "Ratings you've given and received",
          "Notifications and account history",
        ];

  function close() {
    if (deleting) return;
    setOpen(false);
    setConfirmText("");
    setError(null);
  }

  async function confirm() {
    if (!matches) return;
    setError(null);
    setDeleting(true);
    try {
      await apiDelete("/api/auth/me");
      toast.success("Account deleted");
      // Bounce to login; the server already cleared auth cookies.
      router.replace("/login");
      router.refresh();
    } catch (e) {
      setError(errorMessage(e, "Couldn't delete account"));
      setDeleting(false);
    }
  }

  return (
    <>
      <Card className="border-destructive/40">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle
              className="size-4 text-destructive"
              aria-hidden={true}
            />
            <CardTitle className="text-base text-destructive">
              Danger zone
            </CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            Permanently delete your Mana Drive account and everything tied to it.
            This cannot be undone.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              You&apos;ll be signed out immediately after deletion.
            </p>
            <Button
              type="button"
              variant="destructive"
              onClick={() => setOpen(true)}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Delete account
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) close();
          else setOpen(true);
        }}
      >
        <DialogContent
          aria-labelledby="delete-account-title"
          aria-describedby="delete-account-desc"
        >
          <DialogHeader>
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive"
              >
                <AlertTriangle className="size-5" />
              </span>
              <div className="flex flex-col gap-1">
                <DialogTitle id="delete-account-title">
                  Delete your account?
                </DialogTitle>
                <DialogDescription id="delete-account-desc">
                  This will permanently remove your account and the data below.
                  This action cannot be undone.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <ul className="flex flex-col gap-1.5 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-foreground">
            {consequences.map((line) => (
              <li key={line} className="flex items-start gap-2">
                <span
                  aria-hidden="true"
                  className="mt-1 size-1.5 shrink-0 rounded-full bg-destructive"
                />
                <span>{line}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-2">
            <Label htmlFor="delete-confirm">
              Type <span className="font-mono font-semibold">{DELETE_CONFIRM_PHRASE}</span>{" "}
              to confirm
            </Label>
            <Input
              id="delete-confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
              placeholder={DELETE_CONFIRM_PHRASE}
              disabled={deleting}
            />
          </div>

          <FormError message={error} />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={close}
              disabled={deleting}
              type="button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void confirm()}
              disabled={!matches || deleting}
              type="button"
            >
              {deleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Deleting…
                </>
              ) : (
                <>
                  <Trash2 className="size-4" aria-hidden="true" />
                  Delete account
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Top-level dashboards
// ─────────────────────────────────────────────────────────────────────────────

export function DriverProfileDashboard({
  user,
  profile: initialProfile,
}: {
  user: ProfileUser;
  profile: DriverProfileData | null;
}) {
  const [profile, setProfile] = useState<DriverProfileData | null>(initialProfile);

  if (!profile) {
    return (
      <main className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-6 md:px-6 md:py-10">
        <ProfileHeader
          user={user}
          subtitle="Driver profile not set up yet"
          verifiedBadge={{ verified: false }}
        />
        <ContactSection user={user} />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <ShieldX
              className="size-8 text-muted-foreground"
              aria-hidden="true"
            />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-foreground">
                Driver profile not set up
              </p>
              <p className="text-xs text-muted-foreground">
                Complete onboarding to start receiving jobs.
              </p>
            </div>
            <Button render={<Link href="/driver/onboarding" />}>
              Complete onboarding
            </Button>
          </CardContent>
        </Card>
        <DeleteAccountSection role={user.role} />
      </main>
    );
  }

  const uploadedDocs = DOCUMENT_TYPES.filter((t) => profile.documents[t]);
  const totalDocs = DOCUMENT_TYPES.length;
  const ratingValue = profile.averageRating;
  const ratingDisplay = ratingValue > 0 ? ratingValue.toFixed(1) : "—";

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-6 md:px-6 md:py-10">
      <ProfileHeader
        user={user}
        subtitle={`Driver based in ${profile.city}`}
        verifiedBadge={{ verified: profile.isVerified }}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          icon={Star}
          label="Average rating"
          value={
            <div className="flex items-center gap-2">
              <span>{ratingDisplay}</span>
              <RatingStars value={Math.round(ratingValue)} size="sm" />
            </div>
          }
          hint={ratingValue > 0 ? "out of 5" : "No ratings yet"}
        />
        <StatTile
          icon={Trophy}
          label="Jobs completed"
          value={profile.totalJobsCompleted}
          hint="lifetime"
        />
        <StatTile
          icon={ShieldCheck}
          label="Documents"
          value={`${uploadedDocs.length} / ${totalDocs}`}
          hint={profile.isVerified ? "Fully verified" : "Verification pending"}
        />
      </div>

      <ContactSection user={user} />

      <DriverLocationSection
        data={profile}
        onSaved={(next) => setProfile({ ...profile, ...next })}
      />

      <DriverSkillsSection
        data={profile}
        onSaved={(next) => setProfile({ ...profile, ...next })}
      />

      <DriverDocumentsSection
        documents={profile.documents}
        isVerified={profile.isVerified}
      />

      <DeleteAccountSection role={user.role} />
    </main>
  );
}

export function CustomerProfileDashboard({
  user,
  profile: initialProfile,
}: {
  user: ProfileUser;
  profile: CustomerProfileData | null;
}) {
  const [profile, setProfile] = useState<CustomerProfileData | null>(
    initialProfile
  );

  if (!profile) {
    return (
      <main className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-6 md:px-6 md:py-10">
        <ProfileHeader
          user={user}
          subtitle="Customer profile not set up yet"
        />
        <ContactSection user={user} />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <ShieldX
              className="size-8 text-muted-foreground"
              aria-hidden="true"
            />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-foreground">
                Customer profile not set up
              </p>
              <p className="text-xs text-muted-foreground">
                Finish profile setup to start posting jobs.
              </p>
            </div>
            <Button render={<Link href="/customer/profile-setup" />}>
              Complete profile setup
            </Button>
          </CardContent>
        </Card>
        <DeleteAccountSection role={user.role} />
      </main>
    );
  }

  const ratingValue = profile.averageRating;
  const ratingDisplay = ratingValue > 0 ? ratingValue.toFixed(1) : "—";

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-6 md:px-6 md:py-10">
      <ProfileHeader user={user} subtitle={`Customer in ${profile.city}`} />

      <div className="grid gap-3 sm:grid-cols-2">
        <StatTile
          icon={Star}
          label="Your rating"
          value={
            <div className="flex items-center gap-2">
              <span>{ratingDisplay}</span>
              <RatingStars value={Math.round(ratingValue)} size="sm" />
            </div>
          }
          hint={ratingValue > 0 ? "from drivers" : "No ratings from drivers yet"}
        />
        <StatTile
          icon={MapPin}
          label="Base city"
          value={profile.city}
          hint="Jobs you post target this city"
        />
      </div>

      <ContactSection user={user} />

      <CustomerCitySection
        city={profile.city}
        onSaved={(next) => setProfile({ ...profile, city: next })}
      />

      <CustomerCarSection
        carDetails={profile.carDetails}
        onSaved={(next) => setProfile({ ...profile, carDetails: next })}
      />

      <CustomerPreferencesSection
        preferences={profile.preferences}
        onSaved={(next) => setProfile({ ...profile, preferences: next })}
      />

      <CustomerLanguagesSection
        languages={profile.languages}
        onSaved={(next) => setProfile({ ...profile, languages: next })}
      />

      <DeleteAccountSection role={user.role} />
    </main>
  );
}
