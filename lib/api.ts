import axios, { AxiosError } from "axios";
import type { ApiErrorCode } from "@/utils/errors";

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

export type ApiEnvelope<T> = SuccessEnvelope<T> | ErrorEnvelope;

export const api = axios.create({
  baseURL: "/",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export class ApiClientError extends Error {
  status: number;
  code: ApiErrorCode | "NETWORK_ERROR";
  errors?: unknown;

  constructor(
    message: string,
    status: number,
    code: ApiErrorCode | "NETWORK_ERROR",
    errors?: unknown
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

function unwrap<T>(envelope: unknown, status: number): T {
  if (
    envelope &&
    typeof envelope === "object" &&
    "success" in envelope &&
    (envelope as ApiEnvelope<T>).success
  ) {
    return (envelope as SuccessEnvelope<T>).data;
  }
  if (
    envelope &&
    typeof envelope === "object" &&
    "success" in envelope &&
    !(envelope as ApiEnvelope<T>).success
  ) {
    const env = envelope as ErrorEnvelope;
    throw new ApiClientError(env.error, status, env.code, env.errors);
  }
  throw new ApiClientError("Unexpected response", status, "INTERNAL_ERROR");
}

function rethrow(e: unknown): never {
  if (axios.isAxiosError(e)) {
    const ax = e as AxiosError<ErrorEnvelope>;
    if (ax.response?.data && typeof ax.response.data === "object") {
      const env = ax.response.data;
      throw new ApiClientError(
        env.error ?? ax.message,
        ax.response.status,
        env.code ?? "INTERNAL_ERROR",
        env.errors
      );
    }
    throw new ApiClientError(
      ax.message ?? "Network error",
      ax.response?.status ?? 0,
      "NETWORK_ERROR"
    );
  }
  if (e instanceof ApiClientError) throw e;
  throw new ApiClientError(
    e instanceof Error ? e.message : "Unknown error",
    0,
    "INTERNAL_ERROR"
  );
}

export async function apiGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  try {
    const res = await api.get<ApiEnvelope<T>>(url, { params });
    return unwrap<T>(res.data, res.status);
  } catch (e) {
    rethrow(e);
  }
}

export async function apiPost<T, B = unknown>(url: string, body?: B): Promise<T> {
  try {
    const res = await api.post<ApiEnvelope<T>>(url, body);
    return unwrap<T>(res.data, res.status);
  } catch (e) {
    rethrow(e);
  }
}

export async function apiPatch<T, B = unknown>(url: string, body?: B): Promise<T> {
  try {
    const res = await api.patch<ApiEnvelope<T>>(url, body);
    return unwrap<T>(res.data, res.status);
  } catch (e) {
    rethrow(e);
  }
}

export async function apiDelete<T>(url: string): Promise<T> {
  try {
    const res = await api.delete<ApiEnvelope<T>>(url);
    return unwrap<T>(res.data, res.status);
  } catch (e) {
    rethrow(e);
  }
}

export async function apiUpload<T>(url: string, form: FormData): Promise<T> {
  try {
    const res = await api.post<ApiEnvelope<T>>(url, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return unwrap<T>(res.data, res.status);
  } catch (e) {
    rethrow(e);
  }
}
