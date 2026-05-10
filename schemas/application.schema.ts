import { z } from "zod";

export const APPLICATION_ACTIONS = ["hire", "accept", "decline"] as const;
export type ApplicationAction = (typeof APPLICATION_ACTIONS)[number];

export const applicationActionSchema = z.object({
  action: z.enum(APPLICATION_ACTIONS, {
    message: "Action must be hire, accept, or decline",
  }),
});

export type ApplicationActionInput = z.infer<typeof applicationActionSchema>;

export const applicationCreateSchema = z.object({
  jobId: z
    .string({ message: "jobId is required" })
    .trim()
    .min(1, "jobId is required"),
});

export type ApplicationCreateInput = z.infer<typeof applicationCreateSchema>;
