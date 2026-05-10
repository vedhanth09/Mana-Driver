import type { NextRequest } from "next/server";
import { requireAuth } from "@/utils/auth.utils";
import { me } from "@/services/auth.service";
import { ok, handleError } from "@/utils/api-response.utils";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const user = await me(auth.id);
    return ok({ user });
  } catch (e) {
    return handleError(e);
  }
}
