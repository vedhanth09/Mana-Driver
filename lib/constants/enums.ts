export const JOB_TYPES = ["hourly", "temporary", "permanent"] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const CAR_TYPES = ["hatchback", "sedan", "suv", "luxury"] as const;
export type CarType = (typeof CAR_TYPES)[number];

export const TRANSMISSION_TYPES = ["manual", "automatic", "semi-automatic"] as const;
export type TransmissionType = (typeof TRANSMISSION_TYPES)[number];

export const LANGUAGES = ["english", "telugu", "hindi"] as const;
export type Language = (typeof LANGUAGES)[number];

export const WORKING_HOURS = ["12hr", "24x7"] as const;
export type WorkingHours = (typeof WORKING_HOURS)[number];

export const JOB_STATUSES = [
  "posted",
  "applied",
  "accepted",
  "in_progress",
  "completed",
  "cancelled",
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const APPLICATION_STATUSES = ["pending", "approved", "rejected", "withdrawn"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const DRIVER_RESPONSES = ["pending", "accepted", "declined"] as const;
export type DriverResponse = (typeof DRIVER_RESPONSES)[number];

export const RATING_DIMENSIONS = ["drivingSkill", "professionalBehavior", "punctuality"] as const;
export type RatingDimension = (typeof RATING_DIMENSIONS)[number];

export const NOTIFICATION_TYPES = [
  "new_job",
  "application_approved",
  "application_rejected",
  "driver_applied",
  "driver_accepted",
  "driver_declined",
  "job_completed",
  "job_cancelled",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const USER_ROLES = ["driver", "customer", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const DOCUMENT_TYPES = ["aadhaar", "pan", "license"] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const RATEE_ROLES = ["driver", "customer"] as const;
export type RateeRole = (typeof RATEE_ROLES)[number];

export const EXPERIENCE_LEVELS = ["beginner", "intermediate", "experienced"] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const EXPERIENCE_THRESHOLDS: Record<ExperienceLevel, [number, number]> = {
  beginner: [0, 9],
  intermediate: [10, 49],
  experienced: [50, Infinity],
};

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export const MAX_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const DRIVER_AGE_MIN = 18;
export const DRIVER_AGE_MAX = 70;

export const RATING_MIN = 1;
export const RATING_MAX = 5;

export const NOTIFICATION_LIMIT = 50;
export const NOTIFICATION_POLL_INTERVAL_MS = 30_000;

export const ACCESS_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds
export const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds
