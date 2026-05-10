import { Types } from "mongoose";
import { dbConnect } from "@/lib/db";
import {
  DriverProfileModel,
  type DriverProfile,
  type DocumentAsset,
} from "@/models/DriverProfile";
import { UserModel } from "@/models/User";
import { ConflictError, NotFoundError } from "@/utils/errors";
import { assertValidDocumentFile } from "@/utils/document.utils";
import { uploadStream, destroyAsset } from "@/services/cloudinary.service";
import { DOCUMENT_TYPES, type DocumentType } from "@/lib/constants/enums";
import type { DriverProfileInput } from "@/schemas/driver.schema";

function toObjectId(id: string | Types.ObjectId): Types.ObjectId {
  return typeof id === "string" ? new Types.ObjectId(id) : id;
}

export async function getProfile(userId: string): Promise<DriverProfile | null> {
  await dbConnect();
  return DriverProfileModel.findOne({ userId: toObjectId(userId) })
    .lean<DriverProfile>()
    .exec();
}

export async function createProfile(
  userId: string,
  input: DriverProfileInput
): Promise<DriverProfile> {
  await dbConnect();

  const uid = toObjectId(userId);
  const existing = await DriverProfileModel.findOne({ userId: uid }).exec();
  if (existing) {
    throw new ConflictError("Driver profile already exists");
  }

  const created = await DriverProfileModel.create({
    userId: uid,
    age: input.age,
    address: input.address,
    city: input.city,
    areas: input.areas,
    transmissionTypes: input.transmissionTypes,
    vehicleCategories: input.vehicleCategories,
    languages: input.languages,
  });

  return created.toObject() as unknown as DriverProfile;
}

export async function updateProfile(
  userId: string,
  input: Partial<DriverProfileInput>
): Promise<DriverProfile> {
  await dbConnect();

  const uid = toObjectId(userId);
  const update: Record<string, unknown> = {};
  for (const key of [
    "age",
    "address",
    "city",
    "areas",
    "transmissionTypes",
    "vehicleCategories",
    "languages",
  ] as const) {
    if (input[key] !== undefined) update[key] = input[key];
  }

  const profile = await DriverProfileModel.findOneAndUpdate(
    { userId: uid },
    { $set: update },
    { new: true }
  )
    .lean<DriverProfile>()
    .exec();

  if (!profile) throw new NotFoundError("Driver profile not found");
  return profile;
}

export type DocumentUploadInput = Partial<Record<DocumentType, File>>;

export interface DocumentUploadResult {
  profile: DriverProfile;
  uploaded: DocumentType[];
}

/**
 * Order: validate → upload new → save profile → destroy old.
 * Avoids data loss if the new upload fails (PDR §10).
 */
export async function uploadDocuments(
  userId: string,
  files: DocumentUploadInput
): Promise<DocumentUploadResult> {
  await dbConnect();

  const uid = toObjectId(userId);
  const profile = await DriverProfileModel.findOne({ userId: uid }).exec();
  if (!profile) throw new NotFoundError("Driver profile not found");

  const presentTypes = DOCUMENT_TYPES.filter((t) => files[t] instanceof File);

  for (const docType of presentTypes) {
    const file = files[docType]!;
    assertValidDocumentFile(file, docType);
  }

  const newAssets: Partial<Record<DocumentType, DocumentAsset>> = {};
  const oldIdsToDestroy: string[] = [];

  for (const docType of presentTypes) {
    const file = files[docType]!;
    const folder = `driver-documents/${userId}/${docType}`;
    const uploaded = await uploadStream(file, folder);

    newAssets[docType] = {
      url: uploaded.url,
      cloudinaryId: uploaded.publicId,
      uploadedAt: new Date(),
    };

    const prior = profile.documents?.[docType];
    if (prior?.cloudinaryId) {
      oldIdsToDestroy.push(prior.cloudinaryId);
    }
  }

  for (const docType of presentTypes) {
    const asset = newAssets[docType];
    if (asset) {
      profile.documents[docType] = asset;
    }
  }

  const allPresent = DOCUMENT_TYPES.every(
    (t) => profile.documents?.[t]?.cloudinaryId
  );
  if (allPresent) {
    profile.isVerified = true;
  }

  await profile.save();

  if (allPresent) {
    await UserModel.updateOne(
      { _id: uid, isProfileComplete: false },
      { $set: { isProfileComplete: true } }
    ).exec();
  }

  for (const oldId of oldIdsToDestroy) {
    try {
      await destroyAsset(oldId);
    } catch (err) {
      // Log and continue: an orphaned asset is preferable to surfacing a
      // partial-success error after the new upload already succeeded.
      if (process.env.NODE_ENV !== "production") {
        console.error("[driver.service] destroyAsset failed", oldId, err);
      }
    }
  }

  return {
    profile: profile.toObject() as unknown as DriverProfile,
    uploaded: presentTypes,
  };
}
