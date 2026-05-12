"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Car, Check, Eye, EyeOff, User } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/components/shared/api-error";
import { GoogleSignInButton } from "@/components/shared/google-sign-in-button";
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
  Icon: typeof Car;
}> = [
  { value: "driver", title: "Driver", Icon: Car },
  { value: "customer", title: "Customer", Icon: User },
];

type PanelContent = {
  tagline: string;
  heading: string;
  description: string;
  image: string;
};

const PANEL_CONTENT: Record<"driver" | "customer", PanelContent> = {
  driver: {
    tagline: "Drive your career forward.",
    heading: "Join our network of premium drivers.",
    description:
      "Experience flexible hours, guaranteed payouts, and a supportive community designed for professionals.",
    image: "/signup-driver.jpg",
  },
  customer: {
    tagline: "Travel in comfort and safety.",
    heading: "Your Car. A Professional Driver. On Demand.",
    description:
      "Experience seamless travel, professional chauffeurs, and premium vehicles at your fingertips.",
    image: "/signup-customer.jpg",
  },
};

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [panelVisible, setPanelVisible] = useState(true);
  const [googleBusy, setGoogleBusy] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    mode: "onSubmit",
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      role: "driver",
    },
  });

  const selectedRole = watch("role");
  const panel = PANEL_CONTENT[selectedRole];

  useEffect(() => {
    setPanelVisible(false);
    const t = setTimeout(() => setPanelVisible(true), 180);
    return () => clearTimeout(t);
  }, [selectedRole]);

  async function onSubmit(values: SignupInput) {
    setServerError(null);
    if (!agreed) {
      setServerError("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }
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

  async function onGoogleCredential(credential: string) {
    setServerError(null);
    if (!agreed) {
      setServerError("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }
    setGoogleBusy(true);
    try {
      const data = await apiPost<{ user: AuthedUser; isNewUser: boolean }>(
        "/api/auth/google",
        { credential, role: selectedRole },
      );
      toast.success(
        data.isNewUser
          ? "Account created. Let's get you set up."
          : `Welcome back, ${data.user.fullName.split(" ")[0]}.`,
      );
      router.push(homeForRole(data.user.role));
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
    <main className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-[1fr_1.1fr]">
      {/* Left — brand panel */}
      <aside className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Image
          key={panel.image}
          src={panel.image}
          alt=""
          fill
          className="object-cover transition-opacity duration-500"
          style={{ opacity: panelVisible ? 1 : 0 }}
          priority
          aria-hidden="true"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-primary/60"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(16,185,129,0.22),transparent_55%),radial-gradient(circle_at_85%_80%,rgba(59,130,246,0.14),transparent_55%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(0,0,0,0.4)_100%)]"
        />

        <div className="relative z-10">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            ManaDriver
          </Link>
          <p
            className={cn(
              "mt-2 text-sm text-primary-foreground/70 transition-opacity duration-200",
              panelVisible ? "opacity-100" : "opacity-0",
            )}
          >
            {panel.tagline}
          </p>
        </div>

        <div
          className={cn(
            "relative z-10 flex flex-col gap-6 transition-opacity duration-200",
            panelVisible ? "opacity-100" : "opacity-0",
          )}
        >
          <div className="max-w-md">
            <h2 className="text-h1 leading-tight font-bold">
              {panel.heading}
            </h2>
            <p className="mt-3 text-base text-primary-foreground/75">
              {panel.description}
            </p>
          </div>

        </div>
      </aside>

      {/* Right — form panel */}
      <section className="flex items-center justify-center px-4 py-10 sm:px-8 lg:px-16">
        <div className="w-full max-w-xl">
          <Link
            href="/"
            className="mb-8 block text-center text-2xl font-bold tracking-tight text-foreground lg:hidden"
          >
            ManaDriver
          </Link>

          <div className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border sm:p-8">
            <div className="mb-6">
              <h1 className="text-h1-mobile font-bold text-foreground sm:text-h1">
                Create an account
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Select your role to get started.
              </p>
            </div>

            <form
              noValidate
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-5"
            >
              {/* Role selector */}
              <fieldset className="grid grid-cols-2 gap-3">
                <legend className="sr-only">Choose your role</legend>
                {ROLE_OPTIONS.map(({ value, title, Icon }) => {
                  const checked = selectedRole === value;
                  return (
                    <label
                      key={value}
                      className={cn(
                        "relative flex h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 bg-background transition-all",
                        checked
                          ? "border-primary bg-accent shadow-sm"
                          : "border-border hover:border-primary/40",
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
                      {checked && (
                        <span className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="size-3" aria-hidden="true" />
                        </span>
                      )}
                      <Icon
                        className={cn(
                          "size-7",
                          checked ? "text-primary" : "text-muted-foreground",
                        )}
                        aria-hidden="true"
                      />
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          checked ? "text-primary" : "text-foreground",
                        )}
                      >
                        {title}
                      </span>
                    </label>
                  );
                })}
              </fieldset>
              {errors.role && (
                <p className="text-xs text-destructive">{errors.role.message}</p>
              )}

              {/* Name row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <input
                    id="fullName"
                    type="text"
                    autoComplete="name"
                    placeholder="e.g. Rahul Sharma"
                    aria-invalid={errors.fullName ? "true" : undefined}
                    className={plainInputClass}
                    {...register("fullName")}
                  />
                  {errors.fullName && (
                    <p className="text-xs text-destructive">
                      {errors.fullName.message}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="flex">
                    <span className="flex h-11 items-center rounded-l-lg border border-r-0 border-border bg-muted px-3 text-sm font-medium text-muted-foreground">
                      +91
                    </span>
                    <input
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="98765 43210"
                      aria-invalid={errors.phone ? "true" : undefined}
                      className={cn(plainInputClass, "rounded-l-none")}
                      {...register("phone")}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-xs text-destructive">
                      {errors.phone.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email Address</Label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  aria-invalid={errors.email ? "true" : undefined}
                  className={plainInputClass}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Create a strong password"
                    aria-invalid={errors.password ? "true" : undefined}
                    className={cn(plainInputClass, "pr-10")}
                    {...register("password", {
                      onChange: (e) =>
                        setValue("confirmPassword", e.target.value),
                    })}
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

              {/* Terms */}
              <label className="flex cursor-pointer items-start gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 size-4 rounded border-border accent-primary"
                />
                <span className="text-muted-foreground">
                  I agree to the{" "}
                  <a
                    href="#"
                    className="font-semibold text-foreground underline-offset-2 hover:underline"
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="#"
                    className="font-semibold text-foreground underline-offset-2 hover:underline"
                  >
                    Privacy Policy
                  </a>
                  .
                </span>
              </label>

              {serverError && <ApiError error={serverError} compact />}

              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting || googleBusy}
                className="h-11 w-full bg-primary text-base text-primary-foreground hover:bg-primary/90"
              >
                {isSubmitting ? "Creating account…" : "Create Account"}
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
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-foreground underline-offset-4 hover:underline"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

const plainInputClass = cn(
  "h-11 w-full rounded-lg border border-border bg-background px-3 text-base text-foreground placeholder:text-muted-foreground",
  "outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20",
  "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
);
