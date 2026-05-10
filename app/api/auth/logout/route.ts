import { cookies } from "next/headers";
import { ok, handleError } from "@/utils/api-response.utils";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearedCookieOptions,
} from "@/utils/cookies.utils";

export async function POST() {
  try {
    const store = await cookies();
    store.set(ACCESS_TOKEN_COOKIE, "", clearedCookieOptions());
    store.set(REFRESH_TOKEN_COOKIE, "", clearedCookieOptions());
    return ok({ loggedOut: true }, "Logged out");
  } catch (e) {
    return handleError(e);
  }
}
