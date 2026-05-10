import type { NextRequest } from "next/server";
import { requireAuth } from "@/utils/auth.utils";
import { markAllRead } from "@/services/notification.service";
import { ok, handleError } from "@/utils/api-response.utils";

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const updated = await markAllRead(auth.id);
    return ok({ updated }, "Notifications marked as read");
  } catch (e) {
    return handleError(e);
  }
}
