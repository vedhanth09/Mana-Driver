import { NextResponse } from "next/server";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { ApiError, type ApiErrorCode } from "@/utils/errors";

export interface SuccessEnvelope<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ErrorEnvelope {
  success: false;
  error: string;
  code: ApiErrorCode;
  errors?: unknown;
}

export function ok<T>(data: T, message?: string, init: ResponseInit = {}) {
  const body: SuccessEnvelope<T> = { success: true, data };
  if (message) body.message = message;
  return NextResponse.json(body, { status: 200, ...init });
}

export function created<T>(data: T, message?: string) {
  return ok(data, message, { status: 201 });
}

export function fail(
  error: string,
  code: ApiErrorCode,
  status: number,
  errors?: unknown
) {
  const body: ErrorEnvelope = { success: false, error, code };
  if (errors !== undefined) body.errors = errors;
  return NextResponse.json(body, { status });
}

export function handleError(e: unknown): NextResponse<ErrorEnvelope> {
  if (e instanceof z.ZodError) {
    return fail("Invalid input", "VALIDATION_ERROR", 400, e.issues);
  }

  if (e instanceof ApiError) {
    const errors = e.code === "VALIDATION_ERROR" ? e.details : undefined;
    return fail(e.message, e.code, e.status, errors);
  }

  if (e instanceof jwt.JsonWebTokenError || e instanceof jwt.TokenExpiredError) {
    return fail("Invalid or expired token", "UNAUTHORIZED", 401);
  }

  if (
    e &&
    typeof e === "object" &&
    "code" in e &&
    (e as { code?: number }).code === 11000
  ) {
    return fail("Resource already exists", "CONFLICT", 409);
  }

  if (process.env.NODE_ENV !== "production") {
    console.error("[handleError]", e);
  }

  return fail("Something went wrong", "INTERNAL_ERROR", 500);
}
