import { Types } from "mongoose";
import { dbConnect } from "@/lib/db";
import { RatingModel, type Rating } from "@/models/Rating";
import { JobModel } from "@/models/Job";
import { DriverProfileModel } from "@/models/DriverProfile";
import { CustomerProfileModel } from "@/models/CustomerProfile";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/utils/errors";
import type { RatingInput } from "@/schemas/rating.schema";
import type { RateeRole } from "@/lib/constants/enums";

type Id = string | Types.ObjectId;

function toObjectId(id: Id): Types.ObjectId {
  return typeof id === "string" ? new Types.ObjectId(id) : id;
}

function roundTenth(n: number): number {
  return Math.round(n * 10) / 10;
}

async function recomputeAverageRating(
  rateeId: Types.ObjectId,
  rateeRole: RateeRole
): Promise<void> {
  const result = await RatingModel.aggregate<{ avg: number }>([
    { $match: { rateeId } },
    { $group: { _id: null, avg: { $avg: "$overallRating" } } },
  ]);

  const avg = roundTenth(result[0]?.avg ?? 0);

  if (rateeRole === "driver") {
    await DriverProfileModel.updateOne(
      { userId: rateeId },
      { $set: { averageRating: avg } }
    ).exec();
  } else {
    await CustomerProfileModel.updateOne(
      { userId: rateeId },
      { $set: { averageRating: avg } }
    ).exec();
  }
}

export async function submit(
  raterId: string,
  input: RatingInput
): Promise<Rating> {
  await dbConnect();

  const raterOid = toObjectId(raterId);
  const jobOid = toObjectId(input.jobId);

  const job = await JobModel.findById(jobOid)
    .select({ customerId: 1, acceptedDriverId: 1, status: 1 })
    .lean<{
      customerId: Types.ObjectId;
      acceptedDriverId: Types.ObjectId | null;
      status: string;
    }>()
    .exec();
  if (!job) throw new NotFoundError("Job not found");

  if (job.status !== "completed") {
    throw new ValidationError("You can only rate completed jobs");
  }

  const isCustomer = job.customerId.equals(raterOid);
  const isDriver =
    job.acceptedDriverId != null && job.acceptedDriverId.equals(raterOid);

  if (!isCustomer && !isDriver) {
    throw new ForbiddenError("Only the customer or the hired driver can rate this job");
  }

  let rateeId: Types.ObjectId;
  let rateeRole: RateeRole;
  if (isCustomer) {
    if (!job.acceptedDriverId) {
      throw new ValidationError("This job has no driver to rate");
    }
    rateeId = job.acceptedDriverId;
    rateeRole = "driver";
  } else {
    rateeId = job.customerId;
    rateeRole = "customer";
  }

  const overallRating = roundTenth(
    (input.drivingSkill + input.professionalBehavior + input.punctuality) / 3
  );

  let created;
  try {
    created = await RatingModel.create({
      jobId: jobOid,
      raterId: raterOid,
      rateeId,
      rateeRole,
      drivingSkill: input.drivingSkill,
      professionalBehavior: input.professionalBehavior,
      punctuality: input.punctuality,
      overallRating,
      review: input.review?.trim() ? input.review.trim() : null,
    });
  } catch (err) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: number }).code === 11000
    ) {
      throw new ConflictError("You have already rated this job");
    }
    throw err;
  }

  await recomputeAverageRating(rateeId, rateeRole);

  return created.toObject() as unknown as Rating;
}

export async function mineForUser(userId: string): Promise<string[]> {
  await dbConnect();
  const ratings = await RatingModel.find({ raterId: toObjectId(userId) })
    .select({ jobId: 1 })
    .lean<{ jobId: Types.ObjectId }[]>()
    .exec();
  return ratings.map((r) => r.jobId.toString());
}

export async function forDriver(driverId: string): Promise<Rating[]> {
  await dbConnect();
  return RatingModel.find({
    rateeId: toObjectId(driverId),
    rateeRole: "driver",
  })
    .sort({ createdAt: -1 })
    .lean<Rating[]>()
    .exec();
}
