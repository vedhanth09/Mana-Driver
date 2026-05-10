import type { NextRequest } from "next/server";
import { requireAuth } from "@/utils/auth.utils";
import { jobStatusUpdateSchema } from "@/schemas/job.schema";
import { transitionStatus } from "@/services/job.service";
import { ok, handleError } from "@/utils/api-response.utils";
import { ForbiddenError } from "@/utils/errors";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if (auth.role !== "driver" && auth.role !== "customer") {
      throw new ForbiddenError("Only driver or customer can change job status");
    }
    const { id } = await params;
    const body = await req.json();
    const input = jobStatusUpdateSchema.parse(body);
    const job = await transitionStatus({
      jobId: id,
      target: input.status,
      actor: { id: auth.id, role: auth.role },
      reason: input.cancellationReason,
    });
    return ok({ job }, "Job status updated");
  } catch (e) {
    return handleError(e);
  }
}
