import type { NextRequest } from "next/server";
import { requireAuth } from "@/utils/auth.utils";
import { listForUser } from "@/services/notification.service";
import { ok, handleError } from "@/utils/api-response.utils";
import { NOTIFICATION_LIMIT } from "@/lib/constants/enums";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const { notifications, unreadCount } = await listForUser(auth.id, {
      limit: NOTIFICATION_LIMIT,
    });
    return ok({ notifications, unreadCount });
  } catch (e) {
    return handleError(e);
  }
}
