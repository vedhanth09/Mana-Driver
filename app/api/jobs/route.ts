import type { NextRequest } from "next/server";
import { requireAuth, requireRole } from "@/utils/auth.utils";
import { jobCreateSchema } from "@/schemas/job.schema";
import {
  createJob,
  listForCustomer,
  listForDriver,
  type DriverJobFilters,
} from "@/services/job.service";
import { created, ok, handleError } from "@/utils/api-response.utils";
import {
  CAR_TYPES,
  JOB_TYPES,
  TRANSMISSION_TYPES,
  WORKING_HOURS,
  type CarType,
  type JobType,
  type TransmissionType,
  type WorkingHours,
} from "@/lib/constants/enums";
import { CITIES, type City } from "@/lib/constants/cities";

function asEnum<T extends string>(
  value: string | null,
  values: readonly T[]
): T | undefined {
  if (!value) return undefined;
  return (values as readonly string[]).includes(value) ? (value as T) : undefined;
}

function parsePositiveNumber(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(req, "customer");
    const body = await req.json();
    const input = jobCreateSchema.parse(body);
    const job = await createJob(auth.id, input);
    return created({ job }, "Job posted");
  } catch (e) {
    return handleError(e);
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);

    if (auth.role === "customer") {
      const jobs = await listForCustomer(auth.id);
      return ok({ jobs });
    }

    if (auth.role !== "driver") {
      const jobs = await listForCustomer(auth.id);
      return ok({ jobs });
    }

    const sp = req.nextUrl.searchParams;
    const filters: DriverJobFilters = {};
    const city = asEnum<City>(sp.get("city"), CITIES);
    if (city) filters.city = city;
    const areasParam = sp.get("areas");
    if (areasParam) {
      const areas = areasParam
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);
      if (areas.length > 0) filters.areas = areas;
    }
    const jobType = asEnum<JobType>(sp.get("jobType"), JOB_TYPES);
    if (jobType) filters.jobType = jobType;
    const carType = asEnum<CarType>(sp.get("carType"), CAR_TYPES);
    if (carType) filters.carType = carType;
    const transmissionType = asEnum<TransmissionType>(
      sp.get("transmissionType"),
      TRANSMISSION_TYPES
    );
    if (transmissionType) filters.transmissionType = transmissionType;
    const workingHours = asEnum<WorkingHours>(
      sp.get("workingHours"),
      WORKING_HOURS
    );
    if (workingHours) filters.workingHours = workingHours;
    const minPay = parsePositiveNumber(sp.get("minPay"));
    if (minPay !== undefined) filters.minPay = minPay;
    const maxPay = parsePositiveNumber(sp.get("maxPay"));
    if (maxPay !== undefined) filters.maxPay = maxPay;

    const result = await listForDriver(auth.id, filters);
    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}
