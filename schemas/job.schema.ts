import { z } from "zod";
import { CITIES, CITY_AREAS, type City } from "@/lib/constants/cities";
import {
  CAR_TYPES,
  TRANSMISSION_TYPES,
  WORKING_HOURS,
} from "@/lib/constants/enums";

// Status values a client may explicitly request via PATCH /api/jobs/[id]/status.
// "accepted" and "applied" are internal transitions driven by the applications API
// (hire / decline) and are not directly settable here.
export const JOB_STATUS_TARGETS = ["in_progress", "completed", "cancelled"] as const;
export type JobStatusTarget = (typeof JOB_STATUS_TARGETS)[number];

const cityField = z.enum(CITIES, { message: "Choose a supported city" });
const areasField = z.array(z.string().trim().min(1)).optional().default([]);
const carTypeField = z.enum(CAR_TYPES, { message: "Choose a car type" });
const transmissionField = z.enum(TRANSMISSION_TYPES, {
  message: "Choose a transmission type",
});
const moneyField = (label: string) =>
  z
    .number({ message: `${label} is required` })
    .positive(`${label} must be greater than 0`)
    .finite();
const positiveIntField = (label: string) =>
  z
    .number({ message: `${label} is required` })
    .int(`${label} must be a whole number`)
    .positive(`${label} must be greater than 0`);

const baseJobShape = {
  city: cityField,
  areas: areasField,
  startLocation: z
    .string({ message: "Start location is required" })
    .trim()
    .min(1, "Start location is required"),
  carType: carTypeField,
  transmissionType: transmissionField,
};

const hourlyJobSchema = z.object({
  ...baseJobShape,
  jobType: z.literal("hourly"),
  endLocation: z
    .string({ message: "End location is required" })
    .trim()
    .min(1, "End location is required"),
  estimatedDuration: moneyField("Estimated duration"),
  expectedPayout: moneyField("Expected payout"),
});

const temporaryJobSchema = z.object({
  ...baseJobShape,
  jobType: z.literal("temporary"),
  endLocation: z
    .string({ message: "End location is required" })
    .trim()
    .min(1, "End location is required"),
  durationDays: positiveIntField("Duration (days)"),
  dailyPayment: moneyField("Daily payment"),
});

const permanentJobSchema = z.object({
  ...baseJobShape,
  jobType: z.literal("permanent"),
  workingHours: z.enum(WORKING_HOURS, { message: "Choose working hours" }),
  monthlySalary: moneyField("Monthly salary"),
});

export const jobCreateSchema = z
  .discriminatedUnion("jobType", [
    hourlyJobSchema,
    temporaryJobSchema,
    permanentJobSchema,
  ])
  .superRefine((data, ctx) => {
    if (!data.areas || data.areas.length === 0) return;
    const validAreas = new Set(CITY_AREAS[data.city as City] ?? []);
    const invalid = data.areas.filter((area) => !validAreas.has(area));
    if (invalid.length > 0) {
      ctx.addIssue({
        code: "custom",
        path: ["areas"],
        message: `Areas not in ${data.city}: ${invalid.join(", ")}`,
      });
    }
  });

export type JobCreateInput = z.infer<typeof jobCreateSchema>;

export const jobStatusUpdateSchema = z.object({
  status: z.enum(JOB_STATUS_TARGETS, {
    message: "Invalid status transition",
  }),
  cancellationReason: z
    .string()
    .trim()
    .max(500, "Reason must be 500 characters or fewer")
    .optional(),
});

export type JobStatusUpdateInput = z.infer<typeof jobStatusUpdateSchema>;
