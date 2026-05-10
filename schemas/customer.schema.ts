import { z } from "zod";
import { CITIES } from "@/lib/constants/cities";
import {
  CAR_TYPES,
  LANGUAGES,
  TRANSMISSION_TYPES,
} from "@/lib/constants/enums";

const carDetailsSchema = z.object({
  make: z.string().trim().min(1, "Make is required"),
  model: z.string().trim().min(1, "Model is required"),
});

const preferencesSchema = z.object({
  transmissionType: z.enum(TRANSMISSION_TYPES).nullable().optional(),
  vehicleCategory: z.enum(CAR_TYPES).nullable().optional(),
});

export const customerProfileSchema = z.object({
  city: z.enum(CITIES, { message: "Choose a supported city" }),
  languages: z.array(z.enum(LANGUAGES)).optional().default([]),
  carDetails: carDetailsSchema.nullable().optional(),
  preferences: preferencesSchema.nullable().optional(),
});

export type CustomerProfileInput = z.infer<typeof customerProfileSchema>;
