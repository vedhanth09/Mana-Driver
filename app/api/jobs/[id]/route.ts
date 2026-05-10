import type { NextRequest } from "next/server";
import { requireAuth } from "@/utils/auth.utils";
import { getById } from "@/services/job.service";
import { ok, handleError } from "@/utils/api-response.utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(req);
    const { id } = await params;
    const job = await getById(id);
    return ok({ job });
  } catch (e) {
    return handleError(e);
  }
}
