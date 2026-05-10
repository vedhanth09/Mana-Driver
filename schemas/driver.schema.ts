import { z } from "zod";
import { CITIES, CITY_AREAS, type City } from "@/lib/constants/cities";
import {
  CAR_TYPES,
  DRIVER_AGE_MAX,
  DRIVER_AGE_MIN,
  LANGUAGES,
  TRANSMISSION_TYPES,
} from "@/lib/constants/enums";

export const driverProfileSchema = z
  .object({
    age: z
      .number({ message: "Age is required" })
      .int("Age must be a whole number")
      .min(DRIVER_AGE_MIN, `Age must be at least ${DRIVER_AGE_MIN}`)
      .max(DRIVER_AGE_MAX, `Age must be at most ${DRIVER_AGE_MAX}`),
    address: z
      .string({ message: "Address is required" })
      .trim()
      .min(1, "Address is required"),
    city: z.enum(CITIES, { message: "Choose a supported city" }),
    areas: z
      .array(z.string().trim().min(1))
      .min(1, "Select at least one area")
      .max(20, "Too many areas selected"),
    transmissionTypes: z
      .array(z.enum(TRANSMISSION_TYPES))
      .min(1, "Select at least one transmission type"),
    vehicleCategories: z
      .array(z.enum(CAR_TYPES))
      .min(1, "Select at least one vehicle category"),
    languages: z
      .array(z.enum(LANGUAGES))
      .min(1, "Select at least one language"),
  })
  .superRefine((data, ctx) => {
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

export type DriverProfileInput = z.infer<typeof driverProfileSchema>;
