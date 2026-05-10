import type { NextRequest } from "next/server";
import { requireAuth } from "@/utils/auth.utils";
import { forDriver } from "@/services/rating.service";
import { ok, handleError } from "@/utils/api-response.utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ driverId: string }> }
) {
  try {
    await requireAuth(req);
    const { driverId } = await params;
    const ratings = await forDriver(driverId);
    return ok({ ratings });
  } catch (e) {
    return handleError(e);
  }
}
