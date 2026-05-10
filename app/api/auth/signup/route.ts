import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { signupSchema } from "@/schemas/auth.schema";
import { signup } from "@/services/auth.service";
import { created, handleError } from "@/utils/api-response.utils";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  accessCookieOptions,
  refreshCookieOptions,
} from "@/utils/cookies.utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = signupSchema.parse(body);
    const { user, accessToken, refreshToken } = await signup(input);

    const store = await cookies();
    store.set(ACCESS_TOKEN_COOKIE, accessToken, accessCookieOptions());
    store.set(REFRESH_TOKEN_COOKIE, refreshToken, refreshCookieOptions());

    return created({ user }, "Account created");
  } catch (e) {
    return handleError(e);
  }
}
