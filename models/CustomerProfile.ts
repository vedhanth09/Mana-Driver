import { Schema, model, models, type Model, type Types, type HydratedDocument } from "mongoose";
import {
  CAR_TYPES,
  LANGUAGES,
  TRANSMISSION_TYPES,
  type CarType,
  type Language,
  type TransmissionType,
} from "@/lib/constants/enums";

export interface CarDetails {
  make: string;
  model: string;
}

export interface CustomerPreferences {
  transmissionType: TransmissionType | null;
  vehicleCategory: CarType | null;
}

export interface CustomerProfile {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  city: string;
  carDetails: CarDetails | null;
  preferences: CustomerPreferences | null;
  languages: Language[];
  averageRating: number;
  createdAt: Date;
  updatedAt: Date;
}

export type CustomerProfileDocument = HydratedDocument<CustomerProfile>;

const carDetailsSchema = new Schema<CarDetails>(
  {
    make: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const preferencesSchema = new Schema<CustomerPreferences>(
  {
    transmissionType: { type: String, enum: TRANSMISSION_TYPES, default: null },
    vehicleCategory: { type: String, enum: CAR_TYPES, default: null },
  },
  { _id: false }
);

const customerProfileSchema = new Schema<CustomerProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    city: { type: String, required: true },
    carDetails: { type: carDetailsSchema, default: null },
    preferences: { type: preferencesSchema, default: null },
    languages: { type: [String], enum: LANGUAGES, default: [] },
    averageRating: { type: Number, required: true, default: 0, min: 0, max: 5 },
  },
  { timestamps: true }
);

export const CustomerProfileModel: Model<CustomerProfile> =
  (models.CustomerProfile as Model<CustomerProfile>) ??
  model<CustomerProfile>("CustomerProfile", customerProfileSchema);
