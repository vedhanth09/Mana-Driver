import { ACCESS_TOKEN_MAX_AGE, REFRESH_TOKEN_MAX_AGE } from "@/lib/constants/enums";

export const ACCESS_TOKEN_COOKIE = "accessToken";
export const REFRESH_TOKEN_COOKIE = "refreshToken";

export interface AuthCookieOptions {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  maxAge: number;
}

function baseOptions(maxAge: number): AuthCookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  };
}

export const accessCookieOptions = (): AuthCookieOptions =>
  baseOptions(ACCESS_TOKEN_MAX_AGE);

export const refreshCookieOptions = (): AuthCookieOptions =>
  baseOptions(REFRESH_TOKEN_MAX_AGE);

export const clearedCookieOptions = (): AuthCookieOptions => baseOptions(0);
