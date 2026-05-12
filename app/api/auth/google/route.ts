import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { googleAuthSchema } from "@/schemas/auth.schema";
import { googleAuth } from "@/services/auth.service";
import { ok, created, handleError } from "@/utils/api-response.utils";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  accessCookieOptions,
  refreshCookieOptions,
} from "@/utils/cookies.utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = googleAuthSchema.parse(body);
    const result = await googleAuth(input.credential, input.role ?? "customer");

    const store = await cookies();
    store.set(ACCESS_TOKEN_COOKIE, result.accessToken, accessCookieOptions());
    store.set(REFRESH_TOKEN_COOKIE, result.refreshToken, refreshCookieOptions());

    const payload = { user: result.user, isNewUser: result.isNewUser };
    return result.isNewUser
      ? created(payload, "Account created with Google")
      : ok(payload, "Signed in with Google");
  } catch (e) {
    return handleError(e);
  }
}
