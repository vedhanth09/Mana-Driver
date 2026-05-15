"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/components/shared/api-error";
import { Logo } from "@/components/shared/logo";
import { apiPost, ApiClientError } from "@/lib/api";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyOtpSchema,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type VerifyOtpInput,
} from "@/schemas/auth.schema";
import { cn } from "@/lib/utils";

type Step = "email" | "otp" | "reset" | "done";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");

  return (
    <main className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Image
          src="/login-hero.jpg"
          alt="Driver on the road"
          fill
          className="object-cover"
          priority
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.25)_0%,rgba(0,0,0,0.55)_100%)]"
        />
        <Link
          href="/"
          className="relative z-10 text-2xl font-bold tracking-tight"
        >
          <Logo withWordmark className="size-16" />
        </Link>
        <div className="relative z-10 max-w-md">
          <h2 className="text-h1 leading-tight font-bold">
            Forgot your password?
          </h2>
          <p className="mt-3 text-base text-primary-foreground/75">
            No worries. Enter your email and we&apos;ll send you a code to reset
            it.
          </p>
        </div>
      </aside>

      <section className="flex items-center justify-center px-4 py-10 sm:px-8 lg:px-16">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-8 flex justify-center text-2xl font-bold tracking-tight text-foreground lg:hidden"
          >
            <Logo withWordmark className="size-16" />
          </Link>

          <div className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border sm:p-8">
            <Link
              href="/login"
              className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to sign in
            </Link>

            {step === "email" && (
              <EmailStep
                onSent={(value) => {
                  setEmail(value);
                  setStep("otp");
                }}
              />
            )}

            {step === "otp" && (
              <OtpStep
                email={email}
                onVerified={(token) => {
                  setResetToken(token);
                  setStep("reset");
                }}
                onChangeEmail={() => {
                  setEmail("");
                  setStep("email");
                }}
              />
            )}

            {step === "reset" && (
              <ResetStep
                resetToken={resetToken}
                onDone={() => {
                  setStep("done");
                  toast.success("Password updated. Please sign in.");
                  setTimeout(() => router.push("/login"), 600);
                }}
              />
            )}

            {step === "done" && (
              <div className="text-center">
                <h1 className="text-h1-mobile font-bold text-foreground sm:text-h1">
                  Password updated
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Redirecting you to sign in&hellip;
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function EmailStep({ onSent }: { onSent: (email: string) => void }) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    setServerError(null);
    try {
      await apiPost<{ sent: boolean }>("/api/auth/forgot-password", values);
      toast.success("If an account exists, a code is on its way.");
      onSent(values.email);
    } catch (e) {
      if (e instanceof ApiClientError) {
        setServerError(e.message);
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-h1-mobile font-bold text-foreground sm:text-h1">
          Reset your password
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the email associated with your account.
        </p>
      </div>

      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-5"
      >
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
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        {serverError && <ApiError error={serverError} compact />}

        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="h-11 w-full bg-primary text-base text-primary-foreground hover:bg-primary/90"
        >
          {isSubmitting ? "Sending…" : "Send code"}
        </Button>
      </form>
    </>
  );
}

function OtpStep({
  email,
  onVerified,
  onChangeEmail,
}: {
  email: string;
  onVerified: (resetToken: string) => void;
  onChangeEmail: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [resendBusy, setResendBusy] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VerifyOtpInput>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { email, code: "" },
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  async function onSubmit(values: VerifyOtpInput) {
    setServerError(null);
    try {
      const data = await apiPost<{ resetToken: string }>(
        "/api/auth/verify-otp",
        { email, code: values.code },
      );
      onVerified(data.resetToken);
    } catch (e) {
      if (e instanceof ApiClientError) {
        setServerError(e.message);
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    }
  }

  async function resend() {
    setServerError(null);
    setResendBusy(true);
    try {
      await apiPost<{ sent: boolean }>("/api/auth/forgot-password", { email });
      toast.success("A new code has been sent.");
      reset({ email, code: "" });
      setSecondsLeft(60);
      inputRef.current?.focus();
    } catch (e) {
      if (e instanceof ApiClientError) {
        setServerError(e.message);
      } else {
        setServerError("Couldn't resend the code. Please try again.");
      }
    } finally {
      setResendBusy(false);
    }
  }

  const { ref: codeRef, ...codeRest } = register("code");

  return (
    <>
      <div className="mb-6">
        <h1 className="text-h1-mobile font-bold text-foreground sm:text-h1">
          Enter your code
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          We sent a 6-digit code to{" "}
          <span className="font-medium text-foreground">{email}</span>.{" "}
          <button
            type="button"
            onClick={onChangeEmail}
            className="underline-offset-4 hover:underline"
          >
            Change email
          </button>
        </p>
      </div>

      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-5"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="code">6-digit code</Label>
          <input
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="xxx-xxx"
            maxLength={6}
            aria-invalid={errors.code ? "true" : undefined}
            className={cn(
              "h-12 w-full rounded-lg border border-border bg-background px-4 text-center font-mono text-2xl tracking-[0.5em] text-foreground placeholder:text-muted-foreground placeholder:tracking-normal",
              "outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20",
              "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
            )}
            {...codeRest}
            ref={(el) => {
              codeRef(el);
              inputRef.current = el;
            }}
          />
          {errors.code && (
            <p className="text-xs text-destructive">{errors.code.message}</p>
          )}
        </div>

        {serverError && <ApiError error={serverError} compact />}

        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="h-11 w-full bg-primary text-base text-primary-foreground hover:bg-primary/90"
        >
          {isSubmitting ? "Verifying…" : "Verify code"}
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          {secondsLeft > 0 ? (
            <span>
              Didn&apos;t get it? You can resend in {secondsLeft}s.
            </span>
          ) : (
            <button
              type="button"
              onClick={resend}
              disabled={resendBusy}
              className="font-medium text-foreground underline-offset-4 hover:underline disabled:opacity-50"
            >
              {resendBusy ? "Resending…" : "Resend code"}
            </button>
          )}
        </div>
      </form>
    </>
  );
}

function ResetStep({
  resetToken,
  onDone,
}: {
  resetToken: string;
  onDone: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { resetToken, password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetPasswordInput) {
    setServerError(null);
    try {
      await apiPost<{ reset: boolean }>("/api/auth/reset-password", {
        ...values,
        resetToken,
      });
      onDone();
    } catch (e) {
      if (e instanceof ApiClientError) {
        setServerError(e.message);
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-h1-mobile font-bold text-foreground sm:text-h1">
          Set a new password
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a strong password you haven&apos;t used before.
        </p>
      </div>

      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-5"
      >
        <input type="hidden" {...register("resetToken")} value={resetToken} />

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">New password</Label>
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
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Re-enter your new password"
              aria-invalid={errors.confirmPassword ? "true" : undefined}
              className={inputClass}
              {...register("confirmPassword")}
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {serverError && <ApiError error={serverError} compact />}

        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="h-11 w-full bg-primary text-base text-primary-foreground hover:bg-primary/90"
        >
          {isSubmitting ? "Updating…" : "Update password"}
        </Button>
      </form>
    </>
  );
}

const inputClass = cn(
  "h-11 w-full rounded-lg border border-border bg-background pr-3 pl-10 text-base text-foreground placeholder:text-muted-foreground",
  "outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20",
  "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
);
