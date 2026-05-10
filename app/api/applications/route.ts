import type { NextRequest } from "next/server";
import { requireRole } from "@/utils/auth.utils";
import { applicationCreateSchema } from "@/schemas/application.schema";
import { apply } from "@/services/application.service";
import { created, handleError } from "@/utils/api-response.utils";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(req, "driver");
    const body = await req.json();
    const input = applicationCreateSchema.parse(body);
    const application = await apply(auth.id, input.jobId);
    return created({ application }, "Application submitted");
  } catch (e) {
    return handleError(e);
  }
}
