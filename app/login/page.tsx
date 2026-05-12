"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/components/shared/api-error";
import { GoogleSignInButton } from "@/components/shared/google-sign-in-button";
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
  const [googleBusy, setGoogleBusy] = useState(false);

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

  async function onGoogleCredential(credential: string) {
    setServerError(null);
    setGoogleBusy(true);
    try {
      const data = await apiPost<{ user: AuthedUser; isNewUser: boolean }>(
        "/api/auth/google",
        { credential },
      );
      const firstName = data.user.fullName.split(" ")[0];
      toast.success(
        data.isNewUser
          ? `Welcome, ${firstName}. Your account is ready.`
          : `Welcome back, ${firstName}.`,
      );
      const next = search.get("next");
      router.push(next ?? homeForRole(data.user.role));
      router.refresh();
    } catch (e) {
      if (e instanceof ApiClientError) {
        setServerError(e.message);
      } else {
        setServerError("Could not sign in with Google. Please try again.");
      }
    } finally {
      setGoogleBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-2">
      {/* Left — image panel */}
      <aside className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Image
          src="/login-hero.jpg"
          alt="Driver on the road"
          fill
          className="object-cover"
          priority
        />
        {/* Dark overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.25)_0%,rgba(0,0,0,0.55)_100%)]"
        />

        <Link
          href="/"
          className="relative z-10 text-2xl font-bold tracking-tight"
        >
          ManaDriver
        </Link>

        <div className="relative z-10 max-w-md">
          <h2 className="text-h1 leading-tight font-bold">
            Empowering professional drivers.
          </h2>
          <p className="mt-3 text-base text-primary-foreground/75">
            Join the fleet that connects reliable professionals with premium
            opportunities. Seamlessly manage your schedule and earnings.
          </p>
        </div>
      </aside>

      {/* Right — form panel */}
      <section className="flex items-center justify-center px-4 py-10 sm:px-8 lg:px-16">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <Link
            href="/"
            className="mb-8 block text-center text-2xl font-bold tracking-tight text-foreground lg:hidden"
          >
            ManaDriver
          </Link>

          <div className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border sm:p-8">
            <div className="mb-6">
              <h1 className="text-h1-mobile font-bold text-foreground sm:text-h1">
                Welcome back
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Please enter your details to sign in.
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
                    placeholder="Enter your email"
                    aria-invalid={errors.email ? "true" : undefined}
                    className={inputClass}
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
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

              {/* Remember me */}
              <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  className="size-4 rounded border-border text-primary accent-primary"
                />
                Remember me
              </label>

              {serverError && <ApiError error={serverError} compact />}

              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting || googleBusy}
                className="h-11 w-full bg-primary text-base text-primary-foreground hover:bg-primary/90"
              >
                {isSubmitting ? "Signing in…" : "Sign In"}
              </Button>
            </form>

            <div className="my-6 flex items-center gap-3" role="separator" aria-label="or">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs font-medium text-muted-foreground">OR</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <GoogleSignInButton
              text="continue_with"
              disabled={isSubmitting || googleBusy}
              onCredential={onGoogleCredential}
            />

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-semibold text-foreground underline-offset-4 hover:underline"
              >
                Sign up
              </Link>
            </p>
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
      </section>

    </main>
  );
}

const inputClass = cn(
  "h-11 w-full rounded-lg border border-border bg-background pr-3 pl-10 text-base text-foreground placeholder:text-muted-foreground",
  "outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20",
  "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
);
