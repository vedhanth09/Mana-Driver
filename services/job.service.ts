import { Types } from "mongoose";
import { dbConnect } from "@/lib/db";
import { JobModel, type Job } from "@/models/Job";
import { ApplicationModel } from "@/models/Application";
import { CustomerProfileModel } from "@/models/CustomerProfile";
import { DriverProfileModel } from "@/models/DriverProfile";
import { UserModel } from "@/models/User";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/utils/errors";
import {
  type CarType,
  type JobStatus,
  type JobType,
  type TransmissionType,
  type WorkingHours,
} from "@/lib/constants/enums";
import { NOTIFICATION_MESSAGES } from "@/lib/constants/notifications";
import {
  type JobCreateInput,
  type JobStatusTarget,
} from "@/schemas/job.schema";
import * as notificationService from "./notification.service";

type Id = string | Types.ObjectId;

function toObjectId(id: Id): Types.ObjectId {
  return typeof id === "string" ? new Types.ObjectId(id) : id;
}

function arraysOverlap<T>(a: T[], b: T[]): boolean {
  const set = new Set(a);
  return b.some((v) => set.has(v));
}

const ALLOWED_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  posted: ["cancelled", "applied"],
  applied: ["accepted", "cancelled"],
  accepted: ["in_progress", "cancelled", "applied"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function isAllowedTransition(from: JobStatus, to: JobStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export async function createJob(
  customerId: string,
  input: JobCreateInput
): Promise<Job> {
  await dbConnect();

  const customerOid = toObjectId(customerId);

  const profile = await CustomerProfileModel.findOne({ userId: customerOid })
    .lean<{ languages: Job["requiredLanguages"] }>()
    .exec();
  if (!profile) {
    throw new NotFoundError("Complete your customer profile before posting a job");
  }

  const requiredLanguages = profile.languages ?? [];

  const base = {
    customerId: customerOid,
    jobType: input.jobType,
    city: input.city,
    areas: input.areas ?? [],
    startLocation: input.startLocation,
    carType: input.carType,
    transmissionType: input.transmissionType,
    requiredLanguages,
    status: "posted" as JobStatus,
    acceptedDriverId: null,
    cancellationReason: null,
    paymentId: null,
    location: null,
  };

  let payload: Record<string, unknown>;
  if (input.jobType === "hourly") {
    payload = {
      ...base,
      endLocation: input.endLocation,
      estimatedDuration: input.estimatedDuration,
      expectedPayout: input.expectedPayout,
    };
  } else if (input.jobType === "temporary") {
    payload = {
      ...base,
      endLocation: input.endLocation,
      durationDays: input.durationDays,
      dailyPayment: input.dailyPayment,
    };
  } else {
    payload = {
      ...base,
      workingHours: input.workingHours,
      monthlySalary: input.monthlySalary,
    };
  }

  const created = await JobModel.create(payload);
  const job = created.toObject() as unknown as Job;

  // Fan out new_job notifications to matching drivers (city + optional area overlap).
  const driverFilter: Record<string, unknown> = { city: job.city };
  const driverProfiles = await DriverProfileModel.find(driverFilter)
    .select({ userId: 1, areas: 1 })
    .lean<{ userId: Types.ObjectId; areas: string[] }[]>()
    .exec();

  const targetUserIds = driverProfiles
    .filter((dp) => {
      if (!job.areas || job.areas.length === 0) return true;
      if (!dp.areas || dp.areas.length === 0) return true;
      return arraysOverlap(dp.areas, job.areas);
    })
    .map((dp) => dp.userId);

  if (targetUserIds.length > 0) {
    const message = NOTIFICATION_MESSAGES.new_job({
      city: job.city,
      jobType: job.jobType,
    });
    await notificationService.notifyMany({
      userIds: targetUserIds,
      type: "new_job",
      message,
      relatedJobId: job._id,
    });
  }

  return job;
}

export interface DriverJobFilters {
  city?: string;
  areas?: string[];
  jobType?: JobType;
  carType?: CarType;
  transmissionType?: TransmissionType;
  workingHours?: WorkingHours;
  minPay?: number;
  maxPay?: number;
}

export interface DriverBrowseResult {
  jobs: Job[];
  appliedJobIds: string[];
}

export async function listForDriver(
  driverId: string,
  filters: DriverJobFilters = {}
): Promise<DriverBrowseResult> {
  await dbConnect();

  const query: Record<string, unknown> = {
    status: { $in: ["posted", "applied"] satisfies JobStatus[] },
  };
  if (filters.city) query.city = filters.city;
  if (filters.areas && filters.areas.length > 0) {
    query.areas = { $in: filters.areas };
  }
  if (filters.jobType) query.jobType = filters.jobType;
  if (filters.carType) query.carType = filters.carType;
  if (filters.transmissionType) query.transmissionType = filters.transmissionType;
  if (filters.workingHours) query.workingHours = filters.workingHours;

  if (filters.minPay !== undefined || filters.maxPay !== undefined) {
    const min = filters.minPay ?? 0;
    const max = filters.maxPay ?? Number.MAX_SAFE_INTEGER;
    const range = { $gte: min, $lte: max };
    query.$or = [
      { expectedPayout: range },
      { dailyPayment: range },
      { monthlySalary: range },
    ];
  }

  const driverOid = toObjectId(driverId);

  const [jobs, applications] = await Promise.all([
    JobModel.find(query).sort({ createdAt: -1 }).lean<Job[]>().exec(),
    ApplicationModel.find({
      driverId: driverOid,
      status: { $in: ["pending", "approved"] },
    })
      .select({ jobId: 1 })
      .lean<{ jobId: Types.ObjectId }[]>()
      .exec(),
  ]);

  const appliedJobIds = applications.map((a) => a.jobId.toString());
  return { jobs, appliedJobIds };
}

export async function listForCustomer(customerId: string): Promise<Job[]> {
  await dbConnect();
  return JobModel.find({ customerId: toObjectId(customerId) })
    .sort({ createdAt: -1 })
    .lean<Job[]>()
    .exec();
}

export async function getById(jobId: string): Promise<unknown> {
  await dbConnect();
  const job = await JobModel.findById(jobId)
    .populate({ path: "customerId", model: UserModel, select: "fullName email phone" })
    .populate({
      path: "acceptedDriverId",
      model: UserModel,
      select: "fullName email phone",
    })
    .lean()
    .exec();
  if (!job) throw new NotFoundError("Job not found");
  return job;
}

export interface TransitionInput {
  jobId: string;
  target: JobStatusTarget;
  actor: { id: string; role: "driver" | "customer" | "admin" };
  reason?: string;
}

export async function transitionStatus(input: TransitionInput): Promise<Job> {
  await dbConnect();

  const job = await JobModel.findById(input.jobId).exec();
  if (!job) throw new NotFoundError("Job not found");

  const actorOid = toObjectId(input.actor.id);
  const isOwner = job.customerId.equals(actorOid);
  const isHiredDriver =
    job.acceptedDriverId != null && job.acceptedDriverId.equals(actorOid);

  if (!isOwner && !isHiredDriver) {
    throw new ForbiddenError("Only the job owner or the hired driver can change status");
  }

  if (!isAllowedTransition(job.status, input.target)) {
    throw new ValidationError(
      `Cannot transition job from ${job.status} to ${input.target}`
    );
  }

  // Role-specific guardrails for in_progress / completed / cancelled.
  if (input.target === "in_progress") {
    if (job.status !== "accepted") {
      throw new ValidationError("Job must be accepted before starting");
    }
    job.status = "in_progress";
    await job.save();
    return job.toObject() as unknown as Job;
  }

  if (input.target === "completed") {
    if (job.status !== "in_progress") {
      throw new ValidationError("Job must be in progress before completion");
    }
    job.status = "completed";
    await job.save();

    if (job.acceptedDriverId) {
      await DriverProfileModel.updateOne(
        { userId: job.acceptedDriverId },
        { $inc: { totalJobsCompleted: 1 } }
      ).exec();

      const message = NOTIFICATION_MESSAGES.job_completed({
        city: job.city,
        jobType: job.jobType,
      });
      await notificationService.notifyMany({
        userIds: [job.customerId, job.acceptedDriverId],
        type: "job_completed",
        message,
        relatedJobId: job._id,
      });
    }

    return job.toObject() as unknown as Job;
  }

  if (input.target === "cancelled") {
    job.status = "cancelled";
    job.cancellationReason = input.reason?.trim() || null;
    await job.save();

    // Bulk-reject pending + approved applications for this job.
    const affected = await ApplicationModel.find({
      jobId: job._id,
      status: { $in: ["pending", "approved"] },
    })
      .select({ driverId: 1 })
      .lean<{ driverId: Types.ObjectId }[]>()
      .exec();

    if (affected.length > 0) {
      await ApplicationModel.updateMany(
        { jobId: job._id, status: { $in: ["pending", "approved"] } },
        { $set: { status: "rejected" } }
      ).exec();

      const cancelMessage = NOTIFICATION_MESSAGES.job_cancelled({
        city: job.city,
        jobType: job.jobType,
      });
      await notificationService.notifyMany({
        userIds: affected.map((a) => a.driverId),
        type: "job_cancelled",
        message: cancelMessage,
        relatedJobId: job._id,
      });
    }

    // Notify the other party (whoever didn't trigger the cancel).
    const otherParty = isOwner ? job.acceptedDriverId : job.customerId;
    if (otherParty) {
      const message = NOTIFICATION_MESSAGES.job_cancelled({
        city: job.city,
        jobType: job.jobType,
      });
      await notificationService.notify({
        userId: otherParty,
        type: "job_cancelled",
        message,
        relatedJobId: job._id,
      });
    }

    return job.toObject() as unknown as Job;
  }

  throw new ValidationError("Unsupported status target");
}
