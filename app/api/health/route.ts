import { ok } from "@/utils/api-response.utils";

export async function GET() {
  return ok({ status: "healthy" });
}
