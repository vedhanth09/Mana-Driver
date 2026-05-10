import type { NextRequest } from "next/server";
import { requireRole } from "@/utils/auth.utils";
import { listForDriver } from "@/services/application.service";
import { ok, handleError } from "@/utils/api-response.utils";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(req, "driver");
    const applications = await listForDriver(auth.id);
    return ok({ applications });
  } catch (e) {
    return handleError(e);
  }
}
