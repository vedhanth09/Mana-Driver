"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Car,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  Search,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/components/shared/api-error";
import { apiPost, ApiClientError } from "@/lib/api";
import { signupSchema, type SignupInput } from "@/schemas/auth.schema";
import type { UserRole } from "@/lib/constants/enums";
import { cn } from "@/lib/utils";

type AuthedUser = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isProfileComplete: boolean;
};

function homeForRole(role: UserRole): string {
  if (role === "driver") return "/driver";
  if (role === "customer") return "/customer";
  return "/";
}

const ROLE_OPTIONS: ReadonlyArray<{
  value: "driver" | "customer";
  title: string;
  description: string;
  Icon: typeof Car;
}> = [
  {
    value: "customer",
    title: "I need a Driver",
    description: "Post jobs and hire vetted drivers for your car.",
    Icon: Search,
  },
  {
    value: "driver",
    title: "I am a Driver",
    description: "Find driving work — hourly, temporary, or permanent.",
    Icon: Car,
  },
];

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      role: "customer",
    },
  });

  const selectedRole = watch("role");

  async function onSubmit(values: SignupInput) {
    setServerError(null);
    try {
      const data = await apiPost<{ user: AuthedUser }>(
        "/api/auth/signup",
        values,
      );
      toast.success("Account created. Let's get you set up.");
      router.push(homeForRole(data.user.role));
      router.refresh();
    } catch (e) {
      if (e instanceof ApiClientError) {
        setServerError(e.message);
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-background p-4 md:p-8">
      <div className="w-full max-w-xl py-8">
        <Link
          href="/"
          className="mb-6 flex flex-col items-center gap-3 text-primary"
        >
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Car className="size-7" aria-hidden="true" />
          </div>
          <span className="text-h2 font-bold tracking-tight">ManaDriver</span>
        </Link>

        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-secondary to-primary" />

          <div className="mb-6 text-center">
            <h1 className="text-h1-mobile font-bold text-foreground">
              Create your account
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose how you&apos;ll use ManaDriver to get started.
            </p>
          </div>

          <form
            noValidate
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
          >
            {/* Role selector */}
            <fieldset className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <legend className="sr-only">Choose your role</legend>
              {ROLE_OPTIONS.map(({ value, title, description, Icon }) => {
                const checked = selectedRole === value;
                return (
                  <label
                    key={value}
                    className={cn(
                      "flex h-full cursor-pointer flex-col gap-2 rounded-xl border p-4 transition-colors",
                      checked
                        ? "border-primary bg-secondary/5 ring-2 ring-primary/20"
                        : "border-border bg-background hover:border-primary/40",
                    )}
                  >
                    <input
                      type="radio"
                      value={value}
                      className="sr-only"
                      checked={checked}
                      onChange={() =>
                        setValue("role", value, { shouldValidate: true })
                      }
                    />
                    <Icon
                      className={cn(
                        "size-7",
                        checked ? "text-primary" : "text-muted-foreground",
                      )}
                      aria-hidden="true"
                    />
                    <p className="text-sm font-bold text-foreground">{title}</p>
                    <p className="text-xs text-muted-foreground">
                      {description}
                    </p>
                  </label>
                );
              })}
            </fieldset>
            {errors.role && (
              <p className="text-xs text-destructive">{errors.role.message}</p>
            )}

            {/* Full name */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="fullName">Full name</Label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="John Doe"
                  aria-invalid={errors.fullName ? "true" : undefined}
                  className={inputClass}
                  {...register("fullName")}
                />
              </div>
              {errors.fullName && (
                <p className="text-xs text-destructive">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  aria-invalid={errors.email ? "true" : undefined}
                  className={inputClass}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">Phone</Label>
              <div className="relative">
                <Phone
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+91 98765 43210"
                  aria-invalid={errors.phone ? "true" : undefined}
                  className={inputClass}
                  {...register("phone")}
                />
              </div>
              {errors.phone && (
                <p className="text-xs text-destructive">{errors.phone.message}</p>
              )}
            </div>

            {/* Password + Confirm */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="At least 6 characters"
                    aria-invalid={errors.password ? "true" : undefined}
                    className={cn(inputClass, "pr-10")}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                      <Eye className="size-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="confirmPassword">Confirm</Label>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Repeat password"
                    aria-invalid={errors.confirmPassword ? "true" : undefined}
                    className={cn(inputClass, "pr-10")}
                    {...register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((s) => !s)}
                    aria-label={
                      showConfirm ? "Hide password" : "Show password"
                    }
                    className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {showConfirm ? (
                      <EyeOff className="size-4" aria-hidden="true" />
                    ) : (
                      <Eye className="size-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            {serverError && <ApiError error={serverError} compact />}

            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? "Creating account…" : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 border-t border-border pt-5 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By creating an account you agree to our{" "}
          <a href="#" className="underline-offset-2 hover:underline">
            Terms
          </a>{" "}
          and{" "}
          <a href="#" className="underline-offset-2 hover:underline">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </main>
  );
}

const inputClass = cn(
  "h-11 w-full rounded-lg border border-border bg-background pr-3 pl-10 text-base text-foreground placeholder:text-muted-foreground",
  "outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20",
  "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
);
