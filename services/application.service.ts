import { Types } from "mongoose";
import { dbConnect } from "@/lib/db";
import { ApplicationModel, type Application } from "@/models/Application";
import { JobModel, type Job } from "@/models/Job";
import { DriverProfileModel, type DriverProfile } from "@/models/DriverProfile";
import { UserModel, type User } from "@/models/User";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/utils/errors";
import {
  EXPERIENCE_THRESHOLDS,
  type ExperienceLevel,
  type JobStatus,
} from "@/lib/constants/enums";
import { NOTIFICATION_MESSAGES } from "@/lib/constants/notifications";
import * as notificationService from "./notification.service";

type Id = string | Types.ObjectId;

function toObjectId(id: Id): Types.ObjectId {
  return typeof id === "string" ? new Types.ObjectId(id) : id;
}

export async function apply(
  driverId: string,
  jobId: string
): Promise<Application> {
  await dbConnect();

  const driverOid = toObjectId(driverId);
  const jobOid = toObjectId(jobId);

  const job = await JobModel.findById(jobOid).exec();
  if (!job) throw new NotFoundError("Job not found");
  if (!["posted", "applied"].includes(job.status)) {
    throw new ValidationError("This job is no longer accepting applications");
  }

  let created;
  try {
    created = await ApplicationModel.create({
      jobId: jobOid,
      driverId: driverOid,
      appliedAt: new Date(),
      status: "pending",
      driverResponse: null,
    });
  } catch (err) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: number }).code === 11000
    ) {
      throw new ConflictError("You have already applied to this job");
    }
    throw err;
  }

  if (job.status === "posted") {
    job.status = "applied";
    await job.save();
  }

  const driver = await UserModel.findById(driverOid)
    .select({ fullName: 1 })
    .lean<{ fullName: string }>()
    .exec();

  const message = NOTIFICATION_MESSAGES.driver_applied({
    driverName: driver?.fullName ?? "A driver",
    city: job.city,
    jobType: job.jobType,
  });

  await notificationService.notify({
    userId: job.customerId,
    type: "driver_applied",
    message,
    relatedJobId: job._id,
  });

  return created.toObject() as unknown as Application;
}

export async function hire(
  applicationId: string,
  customerId: string
): Promise<Application> {
  await dbConnect();

  const application = await ApplicationModel.findById(applicationId).exec();
  if (!application) throw new NotFoundError("Application not found");

  const job = await JobModel.findById(application.jobId).exec();
  if (!job) throw new NotFoundError("Job not found");

  if (!job.customerId.equals(toObjectId(customerId))) {
    throw new ForbiddenError("Only the job owner can hire applicants");
  }

  if (!["posted", "applied"].includes(job.status)) {
    throw new ValidationError("This job is no longer open for hiring");
  }

  if (application.status !== "pending") {
    throw new ValidationError("Only pending applications can be hired");
  }

  // Step 1: approve the chosen application.
  application.status = "approved";
  application.driverResponse = "pending";
  await application.save();

  // Step 2: reject every other pending application for this job.
  const otherForJob = await ApplicationModel.find({
    jobId: job._id,
    _id: { $ne: application._id },
    status: "pending",
  })
    .select({ driverId: 1 })
    .lean<{ driverId: Types.ObjectId }[]>()
    .exec();

  if (otherForJob.length > 0) {
    await ApplicationModel.updateMany(
      {
        jobId: job._id,
        _id: { $ne: application._id },
        status: "pending",
      },
      { $set: { status: "rejected" } }
    ).exec();
  }

  // Step 3: withdraw the hired driver's other pending applications across other jobs.
  await ApplicationModel.updateMany(
    {
      driverId: application.driverId,
      jobId: { $ne: job._id },
      status: "pending",
    },
    { $set: { status: "withdrawn" } }
  ).exec();

  // Step 4: move the job to accepted with the driver attached.
  job.status = "accepted";
  job.acceptedDriverId = application.driverId;
  await job.save();

  // Step 5: notifications.
  const approvedMessage = NOTIFICATION_MESSAGES.application_approved({
    city: job.city,
    jobType: job.jobType,
  });
  await notificationService.notify({
    userId: application.driverId,
    type: "application_approved",
    message: approvedMessage,
    relatedJobId: job._id,
  });

  if (otherForJob.length > 0) {
    const rejectedMessage = NOTIFICATION_MESSAGES.application_rejected({
      city: job.city,
      jobType: job.jobType,
    });
    await notificationService.notifyMany({
      userIds: otherForJob.map((a) => a.driverId),
      type: "application_rejected",
      message: rejectedMessage,
      relatedJobId: job._id,
    });
  }

  return application.toObject() as unknown as Application;
}

export async function respond(
  applicationId: string,
  driverId: string,
  action: "accept" | "decline"
): Promise<Application> {
  await dbConnect();

  const application = await ApplicationModel.findById(applicationId).exec();
  if (!application) throw new NotFoundError("Application not found");

  if (!application.driverId.equals(toObjectId(driverId))) {
    throw new ForbiddenError("You can only respond to your own applications");
  }

  if (application.status !== "approved" || application.driverResponse !== "pending") {
    throw new ValidationError(
      "You can only accept or decline an approved application awaiting your response"
    );
  }

  const job = await JobModel.findById(application.jobId).exec();
  if (!job) throw new NotFoundError("Job not found");

  const driver = await UserModel.findById(application.driverId)
    .select({ fullName: 1 })
    .lean<{ fullName: string }>()
    .exec();
  const driverName = driver?.fullName ?? "The driver";

  if (action === "accept") {
    application.driverResponse = "accepted";
    await application.save();

    const message = NOTIFICATION_MESSAGES.driver_accepted({
      driverName,
      city: job.city,
      jobType: job.jobType,
    });
    await notificationService.notify({
      userId: job.customerId,
      type: "driver_accepted",
      message,
      relatedJobId: job._id,
    });

    return application.toObject() as unknown as Application;
  }

  // decline
  application.status = "rejected";
  application.driverResponse = "declined";
  await application.save();

  // Revert the job: clear accepted driver, drop back to applied.
  job.acceptedDriverId = null;
  job.status = "applied" as JobStatus;
  await job.save();

  const message = NOTIFICATION_MESSAGES.driver_declined({
    driverName,
    city: job.city,
    jobType: job.jobType,
  });
  await notificationService.notify({
    userId: job.customerId,
    type: "driver_declined",
    message,
    relatedJobId: job._id,
  });

  return application.toObject() as unknown as Application;
}

export interface DriverApplicationView {
  application: Application;
  job: Job;
  customer: Pick<User, "fullName" | "email" | "phone"> | null;
}

export async function listForDriver(
  driverId: string
): Promise<DriverApplicationView[]> {
  await dbConnect();

  const driverOid = toObjectId(driverId);
  const applications = await ApplicationModel.find({ driverId: driverOid })
    .sort({ appliedAt: -1 })
    .lean<Application[]>()
    .exec();

  if (applications.length === 0) return [];

  const jobIds = applications.map((a) => a.jobId);
  const jobs = await JobModel.find({ _id: { $in: jobIds } })
    .lean<Job[]>()
    .exec();
  const jobsById = new Map(jobs.map((j) => [j._id.toString(), j]));

  const customerIds = Array.from(
    new Set(jobs.map((j) => j.customerId.toString()))
  );
  const customers = await UserModel.find({
    _id: { $in: customerIds.map((id) => new Types.ObjectId(id)) },
  })
    .select({ fullName: 1, email: 1, phone: 1 })
    .lean<(Pick<User, "fullName" | "email" | "phone"> & { _id: Types.ObjectId })[]>()
    .exec();
  const customersById = new Map(customers.map((c) => [c._id.toString(), c]));

  return applications.flatMap((app) => {
    const job = jobsById.get(app.jobId.toString());
    if (!job) return [];
    const isVisibleCustomer =
      app.status === "approved" && app.driverResponse === "pending";
    const customer = isVisibleCustomer
      ? customersById.get(job.customerId.toString()) ?? null
      : null;
    return [{ application: app, job, customer }];
  });
}

export interface ApplicantFilters {
  minRating?: number;
  experienceLevel?: ExperienceLevel;
}

export interface ApplicantView {
  application: Application;
  driver: Pick<User, "fullName" | "email" | "phone"> & { _id: Types.ObjectId };
  driverProfile: DriverProfile | null;
}

export async function listForJob(
  jobId: string,
  customerId: string,
  filters: ApplicantFilters = {}
): Promise<ApplicantView[]> {
  await dbConnect();

  const jobOid = toObjectId(jobId);
  const job = await JobModel.findById(jobOid)
    .select({ customerId: 1 })
    .lean<{ customerId: Types.ObjectId }>()
    .exec();
  if (!job) throw new NotFoundError("Job not found");
  if (!job.customerId.equals(toObjectId(customerId))) {
    throw new ForbiddenError("You can only view applicants for your own jobs");
  }

  const applications = await ApplicationModel.find({ jobId: jobOid })
    .sort({ appliedAt: 1 })
    .lean<Application[]>()
    .exec();

  if (applications.length === 0) return [];

  const driverIds = applications.map((a) => a.driverId);

  const [drivers, profiles] = await Promise.all([
    UserModel.find({ _id: { $in: driverIds } })
      .select({ fullName: 1, email: 1, phone: 1 })
      .lean<(Pick<User, "fullName" | "email" | "phone"> & { _id: Types.ObjectId })[]>()
      .exec(),
    DriverProfileModel.find({ userId: { $in: driverIds } })
      .lean<DriverProfile[]>()
      .exec(),
  ]);

  const driversById = new Map(drivers.map((d) => [d._id.toString(), d]));
  const profilesByUserId = new Map(
    profiles.map((p) => [p.userId.toString(), p])
  );

  let views: ApplicantView[] = applications.flatMap((app) => {
    const driver = driversById.get(app.driverId.toString());
    if (!driver) return [];
    const profile = profilesByUserId.get(app.driverId.toString()) ?? null;
    return [{ application: app, driver, driverProfile: profile }];
  });

  if (filters.minRating !== undefined) {
    const min = filters.minRating;
    views = views.filter(
      (v) => (v.driverProfile?.averageRating ?? 0) >= min
    );
  }

  if (filters.experienceLevel) {
    const [low, high] = EXPERIENCE_THRESHOLDS[filters.experienceLevel];
    views = views.filter((v) => {
      const total = v.driverProfile?.totalJobsCompleted ?? 0;
      return total >= low && total <= high;
    });
  }

  // Tie-break by averageRating DESC after the existing appliedAt ASC sort.
  views.sort((a, b) => {
    const ta = a.application.appliedAt.getTime();
    const tb = b.application.appliedAt.getTime();
    if (ta !== tb) return ta - tb;
    const ra = a.driverProfile?.averageRating ?? 0;
    const rb = b.driverProfile?.averageRating ?? 0;
    return rb - ra;
  });

  return views;
}
