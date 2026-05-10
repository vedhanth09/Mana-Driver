"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Car, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/components/shared/api-error";
import { apiPost, ApiClientError } from "@/lib/api";
import { loginSchema, type LoginInput } from "@/schemas/auth.schema";
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

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const search = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    try {
      const data = await apiPost<{ user: AuthedUser }>(
        "/api/auth/login",
        values,
      );
      toast.success(`Welcome back, ${data.user.fullName.split(" ")[0]}.`);
      const next = search.get("next");
      router.push(next ?? homeForRole(data.user.role));
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
      <div className="w-full max-w-md">
        {/* Brand */}
        <Link
          href="/"
          className="mb-8 flex flex-col items-center gap-3 text-primary"
        >
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Car className="size-7" aria-hidden="true" />
          </div>
          <span className="text-h2 font-bold tracking-tight">ManaDriver</span>
        </Link>

        {/* Card */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-secondary to-primary" />

          <div className="mb-6 text-center">
            <h1 className="text-h1-mobile font-bold text-foreground">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Log in to your account.
            </p>
          </div>

          <form
            noValidate
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
          >
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
                  className={cn(
                    "h-11 w-full rounded-lg border border-border bg-background pr-3 pl-10 text-base text-foreground placeholder:text-muted-foreground",
                    "outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20",
                    "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
                  )}
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
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
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-invalid={errors.password ? "true" : undefined}
                  className={cn(
                    "h-11 w-full rounded-lg border border-border bg-background pr-10 pl-10 text-base text-foreground placeholder:text-muted-foreground",
                    "outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20",
                    "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
                  )}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
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

            {/* Forgot password (disabled — Phase 1) */}
            <div className="flex justify-end">
              <span
                aria-disabled="true"
                title="Coming soon"
                className="cursor-not-allowed text-xs font-medium text-muted-foreground/70 select-none"
              >
                Forgot password?
              </span>
            </div>

            {serverError && <ApiError error={serverError} compact />}

            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? "Signing in…" : "Log In"}
            </Button>
          </form>

          <div className="mt-6 border-t border-border pt-5 text-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By logging in you agree to our{" "}
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
