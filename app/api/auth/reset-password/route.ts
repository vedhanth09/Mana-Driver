import type { NextRequest } from "next/server";
import { resetPasswordSchema } from "@/schemas/auth.schema";
import { resetPassword } from "@/services/auth.service";
import { ok, handleError } from "@/utils/api-response.utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = resetPasswordSchema.parse(body);
    await resetPassword(input);
    return ok({ reset: true }, "Password updated");
  } catch (e) {
    return handleError(e);
  }
}
