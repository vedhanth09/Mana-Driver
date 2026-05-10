import type { NextRequest } from "next/server";
import { requireRole } from "@/utils/auth.utils";
import { customerProfileSchema } from "@/schemas/customer.schema";
import {
  createProfile,
  getProfile,
  updateProfile,
} from "@/services/customer.service";
import { created, ok, handleError } from "@/utils/api-response.utils";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(req, "customer");
    const profile = await getProfile(auth.id);
    return ok({ profile });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(req, "customer");
    const body = await req.json();
    const input = customerProfileSchema.parse(body);
    const profile = await createProfile(auth.id, input);
    return created({ profile }, "Customer profile created");
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireRole(req, "customer");
    const body = await req.json();
    const input = customerProfileSchema.partial().parse(body);
    const profile = await updateProfile(auth.id, input);
    return ok({ profile }, "Customer profile updated");
  } catch (e) {
    return handleError(e);
  }
}
