import { z } from "zod";
import { RATING_MAX, RATING_MIN } from "@/lib/constants/enums";

const scoreField = (label: string) =>
  z
    .number({ message: `${label} is required` })
    .int(`${label} must be a whole number`)
    .min(RATING_MIN, `${label} must be at least ${RATING_MIN}`)
    .max(RATING_MAX, `${label} must be at most ${RATING_MAX}`);

export const ratingSchema = z.object({
  jobId: z
    .string({ message: "jobId is required" })
    .trim()
    .min(1, "jobId is required"),
  drivingSkill: scoreField("Driving skill"),
  professionalBehavior: scoreField("Professional behavior"),
  punctuality: scoreField("Punctuality"),
  review: z
    .string()
    .trim()
    .max(1000, "Review must be 1000 characters or fewer")
    .optional(),
});

export type RatingInput = z.infer<typeof ratingSchema>;
