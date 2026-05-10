import type { NextRequest } from "next/server";
import { requireAuth } from "@/utils/auth.utils";
import { applicationActionSchema } from "@/schemas/application.schema";
import { hire, respond } from "@/services/application.service";
import { ok, handleError } from "@/utils/api-response.utils";
import { ForbiddenError } from "@/utils/errors";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req);
    const { id } = await params;
    const body = await req.json();
    const { action } = applicationActionSchema.parse(body);

    if (action === "hire") {
      if (auth.role !== "customer") {
        throw new ForbiddenError("Only customers can hire applicants");
      }
      const application = await hire(id, auth.id);
      return ok({ application }, "Driver hired");
    }

    if (auth.role !== "driver") {
      throw new ForbiddenError("Only drivers can accept or decline");
    }
    const application = await respond(id, auth.id, action);
    return ok(
      { application },
      action === "accept" ? "Application accepted" : "Application declined"
    );
  } catch (e) {
    return handleError(e);
  }
}
