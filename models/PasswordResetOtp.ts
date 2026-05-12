import { Schema, model, models, type Model, type Types, type HydratedDocument } from "mongoose";

export interface PasswordResetOtp {
  _id: Types.ObjectId;
  email: string;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  consumedAt: Date | null;
  resetUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type PasswordResetOtpDocument = HydratedDocument<PasswordResetOtp>;

const passwordResetOtpSchema = new Schema<PasswordResetOtp>(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, required: true, default: 0 },
    consumedAt: { type: Date, default: null },
    resetUsedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// TTL: Mongo auto-removes docs after expiresAt + 10 minutes (grace window for reset flow).
passwordResetOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 600 });
passwordResetOtpSchema.index({ email: 1, createdAt: -1 });

export const PasswordResetOtpModel: Model<PasswordResetOtp> =
  (models.PasswordResetOtp as Model<PasswordResetOtp>) ??
  model<PasswordResetOtp>("PasswordResetOtp", passwordResetOtpSchema);
