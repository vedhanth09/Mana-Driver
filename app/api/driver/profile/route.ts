import type { NextRequest } from "next/server";
import { requireRole } from "@/utils/auth.utils";
import { driverProfileSchema } from "@/schemas/driver.schema";
import {
  createProfile,
  getProfile,
  updateProfile,
} from "@/services/driver.service";
import { created, ok, handleError } from "@/utils/api-response.utils";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(req, "driver");
    const profile = await getProfile(auth.id);
    return ok({ profile });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(req, "driver");
    const body = await req.json();
    const input = driverProfileSchema.parse(body);
    const profile = await createProfile(auth.id, input);
    return created({ profile }, "Driver profile created");
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireRole(req, "driver");
    const body = await req.json();
    const input = driverProfileSchema.partial().parse(body);
    const profile = await updateProfile(auth.id, input);
    return ok({ profile }, "Driver profile updated");
  } catch (e) {
    return handleError(e);
  }
}
