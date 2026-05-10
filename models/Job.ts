import { Schema, model, models, type Model, type Types, type HydratedDocument } from "mongoose";
import {
  CAR_TYPES,
  JOB_STATUSES,
  JOB_TYPES,
  LANGUAGES,
  TRANSMISSION_TYPES,
  WORKING_HOURS,
  type CarType,
  type JobStatus,
  type JobType,
  type Language,
  type TransmissionType,
  type WorkingHours,
} from "@/lib/constants/enums";

export interface JobLocation {
  type: "Point";
  coordinates: [number, number];
}

export interface Job {
  _id: Types.ObjectId;
  customerId: Types.ObjectId;
  jobType: JobType;
  city: string;
  areas: string[];
  startLocation: string;
  endLocation: string | null;
  carType: CarType;
  transmissionType: TransmissionType;

  estimatedDuration: number | null;
  expectedPayout: number | null;

  durationDays: number | null;
  dailyPayment: number | null;

  workingHours: WorkingHours | null;
  monthlySalary: number | null;

  requiredLanguages: Language[];
  status: JobStatus;
  acceptedDriverId: Types.ObjectId | null;
  cancellationReason: string | null;

  // Phase 2 placeholders — always null in Phase 1.
  paymentId: string | null;
  location: JobLocation | null;

  createdAt: Date;
  updatedAt: Date;
}

export type JobDocument = HydratedDocument<Job>;

const locationSchema = new Schema<JobLocation>(
  {
    type: { type: String, enum: ["Point"], required: true },
    coordinates: { type: [Number], required: true },
  },
  { _id: false }
);

const jobSchema = new Schema<Job>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    jobType: { type: String, enum: JOB_TYPES, required: true },
    city: { type: String, required: true, index: true },
    areas: { type: [String], default: [] },
    startLocation: { type: String, required: true, trim: true },
    endLocation: { type: String, default: null, trim: true },
    carType: { type: String, enum: CAR_TYPES, required: true },
    transmissionType: { type: String, enum: TRANSMISSION_TYPES, required: true },

    estimatedDuration: { type: Number, default: null, min: 0 },
    expectedPayout: { type: Number, default: null, min: 0 },

    durationDays: { type: Number, default: null, min: 0 },
    dailyPayment: { type: Number, default: null, min: 0 },

    workingHours: { type: String, enum: WORKING_HOURS, default: null },
    monthlySalary: { type: Number, default: null, min: 0 },

    requiredLanguages: { type: [String], enum: LANGUAGES, default: [] },
    status: {
      type: String,
      enum: JOB_STATUSES,
      required: true,
      default: "posted",
      index: true,
    },
    acceptedDriverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    cancellationReason: { type: String, default: null },

    paymentId: { type: String, default: null },
    location: { type: locationSchema, default: null },
  },
  { timestamps: true }
);

export const JobModel: Model<Job> =
  (models.Job as Model<Job>) ?? model<Job>("Job", jobSchema);
