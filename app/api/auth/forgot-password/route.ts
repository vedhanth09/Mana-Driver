import type { NextRequest } from "next/server";
import { forgotPasswordSchema } from "@/schemas/auth.schema";
import { requestPasswordReset } from "@/services/auth.service";
import { ok, handleError } from "@/utils/api-response.utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = forgotPasswordSchema.parse(body);
    await requestPasswordReset(input);
    // Generic success response: do not reveal whether the email is registered.
    return ok(
      { sent: true },
      "If an account with that email exists, a code has been sent.",
    );
  } catch (e) {
    return handleError(e);
  }
}
