import type { NotificationType } from "./enums";

export type NotificationMeta = {
  icon: string;
  color: string;
  label: string;
};

export const NOTIFICATION_META: Record<NotificationType, NotificationMeta> = {
  new_job: {
    icon: "Briefcase",
    color: "text-blue-500",
    label: "New Job Available",
  },
  application_approved: {
    icon: "CheckCircle",
    color: "text-green-500",
    label: "Application Approved",
  },
  application_rejected: {
    icon: "XCircle",
    color: "text-red-500",
    label: "Application Rejected",
  },
  driver_applied: {
    icon: "UserPlus",
    color: "text-indigo-500",
    label: "Driver Applied",
  },
  driver_accepted: {
    icon: "ThumbsUp",
    color: "text-green-600",
    label: "Driver Accepted",
  },
  driver_declined: {
    icon: "ThumbsDown",
    color: "text-orange-500",
    label: "Driver Declined",
  },
  job_completed: {
    icon: "CheckCircle2",
    color: "text-emerald-500",
    label: "Job Completed",
  },
  job_cancelled: {
    icon: "AlertCircle",
    color: "text-red-600",
    label: "Job Cancelled",
  },
};

export const NOTIFICATION_MESSAGES: Record<
  NotificationType,
  (params: Record<string, string>) => string
> = {
  new_job: ({ city, jobType }) => `A new ${jobType} job is available in ${city}`,
  application_approved: ({ jobType, city }) =>
    `Your application for the ${jobType} job in ${city} has been approved`,
  application_rejected: ({ jobType, city }) =>
    `Your application for the ${jobType} job in ${city} was not selected`,
  driver_applied: ({ driverName, jobType, city }) =>
    `${driverName} has applied for your ${jobType} job in ${city}`,
  driver_accepted: ({ driverName, jobType, city }) =>
    `${driverName} accepted the ${jobType} job in ${city}`,
  driver_declined: ({ driverName, jobType, city }) =>
    `${driverName} declined the ${jobType} job in ${city}`,
  job_completed: ({ jobType, city }) => `Your ${jobType} job in ${city} has been completed`,
  job_cancelled: ({ jobType, city }) => `The ${jobType} job in ${city} has been cancelled`,
};
