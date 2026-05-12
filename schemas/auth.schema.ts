import { z } from "zod";

export const SIGNUP_ROLES = ["driver", "customer"] as const;
export type SignupRole = (typeof SIGNUP_ROLES)[number];

export const signupSchema = z
  .object({
    fullName: z
      .string({ message: "Full name is required" })
      .trim()
      .min(2, "Full name must be at least 2 characters"),
    email: z
      .string({ message: "Email is required" })
      .trim()
      .toLowerCase()
      .email("Enter a valid email address"),
    phone: z
      .string({ message: "Phone number is required" })
      .trim()
      .regex(/^\+?\d{10,15}$/, "Phone must be 10–15 digits"),
    password: z
      .string({ message: "Password is required" })
      .min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string({ message: "Please confirm your password" }),
    role: z.enum(SIGNUP_ROLES, { message: "Choose driver or customer" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z
    .string({ message: "Email is required" })
    .trim()
    .toLowerCase()
    .email("Enter a valid email address"),
  password: z
    .string({ message: "Password is required" })
    .min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const googleAuthSchema = z.object({
  credential: z
    .string({ message: "Google credential is required" })
    .min(10, "Invalid Google credential"),
  role: z.enum(SIGNUP_ROLES).optional(),
});

export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string({ message: "Email is required" })
    .trim()
    .toLowerCase()
    .email("Enter a valid email address"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const verifyOtpSchema = z.object({
  email: z
    .string({ message: "Email is required" })
    .trim()
    .toLowerCase()
    .email("Enter a valid email address"),
  code: z
    .string({ message: "Code is required" })
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

export const resetPasswordSchema = z
  .object({
    resetToken: z
      .string({ message: "Reset token is required" })
      .min(10, "Invalid reset token"),
    password: z
      .string({ message: "Password is required" })
      .min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string({ message: "Please confirm your password" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
