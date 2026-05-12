import type { NextRequest } from "next/server";
import { verifyOtpSchema } from "@/schemas/auth.schema";
import { verifyPasswordResetOtp } from "@/services/auth.service";
import { ok, handleError } from "@/utils/api-response.utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = verifyOtpSchema.parse(body);
    const { resetToken } = await verifyPasswordResetOtp(input);
    return ok({ resetToken }, "Code verified");
  } catch (e) {
    return handleError(e);
  }
}
