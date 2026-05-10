import type { NextRequest } from "next/server";
import { requireRole } from "@/utils/auth.utils";
import {
  listForJob,
  type ApplicantFilters,
} from "@/services/application.service";
import { ok, handleError } from "@/utils/api-response.utils";
import {
  EXPERIENCE_LEVELS,
  type ExperienceLevel,
} from "@/lib/constants/enums";

function parseRating(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return undefined;
  if (n < 0 || n > 5) return undefined;
  return n;
}

function parseExperience(value: string | null): ExperienceLevel | undefined {
  if (!value) return undefined;
  return (EXPERIENCE_LEVELS as readonly string[]).includes(value)
    ? (value as ExperienceLevel)
    : undefined;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const auth = await requireRole(req, "customer");
    const { jobId } = await params;

    const sp = req.nextUrl.searchParams;
    const filters: ApplicantFilters = {};
    const minRating = parseRating(sp.get("minRating"));
    if (minRating !== undefined) filters.minRating = minRating;
    const experienceLevel = parseExperience(sp.get("experienceLevel"));
    if (experienceLevel) filters.experienceLevel = experienceLevel;

    const applicants = await listForJob(jobId, auth.id, filters);
    return ok({ applicants });
  } catch (e) {
    return handleError(e);
  }
}
