import { Schema, model, models, type Model, type Types, type HydratedDocument } from "mongoose";
import {
  APPLICATION_STATUSES,
  DRIVER_RESPONSES,
  type ApplicationStatus,
  type DriverResponse,
} from "@/lib/constants/enums";

export interface Application {
  _id: Types.ObjectId;
  jobId: Types.ObjectId;
  driverId: Types.ObjectId;
  appliedAt: Date;
  status: ApplicationStatus;
  driverResponse: DriverResponse | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ApplicationDocument = HydratedDocument<Application>;

const applicationSchema = new Schema<Application>(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    appliedAt: { type: Date, required: true, default: Date.now },
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      required: true,
      default: "pending",
    },
    driverResponse: {
      type: String,
      enum: DRIVER_RESPONSES,
      default: null,
    },
  },
  { timestamps: true }
);

applicationSchema.index({ jobId: 1, driverId: 1 }, { unique: true });

export const ApplicationModel: Model<Application> =
  (models.Application as Model<Application>) ??
  model<Application>("Application", applicationSchema);
