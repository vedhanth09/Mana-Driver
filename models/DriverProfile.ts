import { Schema, model, models, type Model, type Types, type HydratedDocument } from "mongoose";
import {
  DRIVER_AGE_MAX,
  DRIVER_AGE_MIN,
  DOCUMENT_TYPES,
  LANGUAGES,
  TRANSMISSION_TYPES,
  CAR_TYPES,
  type DocumentType,
  type Language,
  type TransmissionType,
  type CarType,
} from "@/lib/constants/enums";

export interface DocumentAsset {
  url: string;
  cloudinaryId: string;
  uploadedAt: Date;
}

export type DriverDocuments = Record<DocumentType, DocumentAsset | null>;

export interface DriverProfile {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  age: number;
  address: string;
  city: string;
  areas: string[];
  transmissionTypes: TransmissionType[];
  vehicleCategories: CarType[];
  languages: Language[];
  documents: DriverDocuments;
  isVerified: boolean;
  averageRating: number;
  totalJobsCompleted: number;
  createdAt: Date;
  updatedAt: Date;
}

export type DriverProfileDocument = HydratedDocument<DriverProfile>;

const documentAssetSchema = new Schema<DocumentAsset>(
  {
    url: { type: String, required: true },
    cloudinaryId: { type: String, required: true },
    uploadedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false }
);

const documentsSchema = new Schema<DriverDocuments>(
  {
    aadhaar: { type: documentAssetSchema, default: null },
    pan: { type: documentAssetSchema, default: null },
    license: { type: documentAssetSchema, default: null },
  },
  { _id: false }
);

const driverProfileSchema = new Schema<DriverProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    age: { type: Number, required: true, min: DRIVER_AGE_MIN, max: DRIVER_AGE_MAX },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, index: true },
    areas: { type: [String], default: [] },
    transmissionTypes: { type: [String], enum: TRANSMISSION_TYPES, default: [] },
    vehicleCategories: { type: [String], enum: CAR_TYPES, default: [] },
    languages: { type: [String], enum: LANGUAGES, default: [] },
    documents: {
      type: documentsSchema,
      default: () => ({ aadhaar: null, pan: null, license: null }),
    },
    isVerified: { type: Boolean, required: true, default: false },
    averageRating: { type: Number, required: true, default: 0, min: 0, max: 5 },
    totalJobsCompleted: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true }
);

// Sanity guard so the union of declared document keys stays in sync with DOCUMENT_TYPES
void DOCUMENT_TYPES;

export const DriverProfileModel: Model<DriverProfile> =
  (models.DriverProfile as Model<DriverProfile>) ??
  model<DriverProfile>("DriverProfile", driverProfileSchema);
