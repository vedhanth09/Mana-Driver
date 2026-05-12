import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { requireAuth } from "@/utils/auth.utils";
import { deleteAccount, me } from "@/services/auth.service";
import { ok, handleError } from "@/utils/api-response.utils";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearedCookieOptions,
} from "@/utils/cookies.utils";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const user = await me(auth.id);
    return ok({ user });
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const summary = await deleteAccount(auth.id);

    const store = await cookies();
    store.set(ACCESS_TOKEN_COOKIE, "", clearedCookieOptions());
    store.set(REFRESH_TOKEN_COOKIE, "", clearedCookieOptions());

    return ok({ deleted: true, summary }, "Account deleted");
  } catch (e) {
    return handleError(e);
  }
}
