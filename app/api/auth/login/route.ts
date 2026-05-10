import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { loginSchema } from "@/schemas/auth.schema";
import { login } from "@/services/auth.service";
import { ok, handleError } from "@/utils/api-response.utils";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  accessCookieOptions,
  refreshCookieOptions,
} from "@/utils/cookies.utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = loginSchema.parse(body);
    const { user, accessToken, refreshToken } = await login(input);

    const store = await cookies();
    store.set(ACCESS_TOKEN_COOKIE, accessToken, accessCookieOptions());
    store.set(REFRESH_TOKEN_COOKIE, refreshToken, refreshCookieOptions());

    return ok({ user }, "Logged in");
  } catch (e) {
    return handleError(e);
  }
}
