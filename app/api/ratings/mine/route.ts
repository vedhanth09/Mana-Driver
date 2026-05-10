import type { NextRequest } from "next/server";
import { requireAuth } from "@/utils/auth.utils";
import { mineForUser } from "@/services/rating.service";
import { ok, handleError } from "@/utils/api-response.utils";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const ratedJobIds = await mineForUser(auth.id);
    return ok({ ratedJobIds });
  } catch (e) {
    return handleError(e);
  }
}
