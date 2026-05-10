import { Types } from "mongoose";
import { dbConnect } from "@/lib/db";
import {
  CustomerProfileModel,
  type CustomerProfile,
} from "@/models/CustomerProfile";
import { UserModel } from "@/models/User";
import { ConflictError, NotFoundError } from "@/utils/errors";
import type { CustomerProfileInput } from "@/schemas/customer.schema";

function toObjectId(id: string | Types.ObjectId): Types.ObjectId {
  return typeof id === "string" ? new Types.ObjectId(id) : id;
}

export async function getProfile(userId: string): Promise<CustomerProfile | null> {
  await dbConnect();
  return CustomerProfileModel.findOne({ userId: toObjectId(userId) })
    .lean<CustomerProfile>()
    .exec();
}

export async function createProfile(
  userId: string,
  input: CustomerProfileInput
): Promise<CustomerProfile> {
  await dbConnect();

  const uid = toObjectId(userId);
  const existing = await CustomerProfileModel.findOne({ userId: uid }).exec();
  if (existing) {
    throw new ConflictError("Customer profile already exists");
  }

  const created = await CustomerProfileModel.create({
    userId: uid,
    city: input.city,
    languages: input.languages ?? [],
    carDetails: input.carDetails ?? null,
    preferences: input.preferences ?? null,
  });

  await UserModel.updateOne(
    { _id: uid },
    { $set: { isProfileComplete: true } }
  ).exec();

  return created.toObject() as unknown as CustomerProfile;
}

export async function updateProfile(
  userId: string,
  input: Partial<CustomerProfileInput>
): Promise<CustomerProfile> {
  await dbConnect();

  const uid = toObjectId(userId);
  const update: Record<string, unknown> = {};
  if (input.city !== undefined) update.city = input.city;
  if (input.languages !== undefined) update.languages = input.languages;
  if (input.carDetails !== undefined) update.carDetails = input.carDetails;
  if (input.preferences !== undefined) update.preferences = input.preferences;

  const profile = await CustomerProfileModel.findOneAndUpdate(
    { userId: uid },
    { $set: update },
    { new: true }
  )
    .lean<CustomerProfile>()
    .exec();

  if (!profile) throw new NotFoundError("Customer profile not found");

  // Defensive: ensure isProfileComplete is true once a profile row exists.
  await UserModel.updateOne(
    { _id: uid, isProfileComplete: false },
    { $set: { isProfileComplete: true } }
  ).exec();

  return profile;
}
