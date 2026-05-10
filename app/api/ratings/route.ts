import type { NextRequest } from "next/server";
import { requireAuth } from "@/utils/auth.utils";
import { ratingSchema } from "@/schemas/rating.schema";
import { submit } from "@/services/rating.service";
import { created, handleError } from "@/utils/api-response.utils";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    const body = await req.json();
    const input = ratingSchema.parse(body);
    const rating = await submit(auth.id, input);
    return created({ rating }, "Rating submitted");
  } catch (e) {
    return handleError(e);
  }
}
