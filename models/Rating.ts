import { Schema, model, models, type Model, type Types, type HydratedDocument } from "mongoose";
import { RATEE_ROLES, RATING_MAX, RATING_MIN, type RateeRole } from "@/lib/constants/enums";

export interface Rating {
  _id: Types.ObjectId;
  jobId: Types.ObjectId;
  raterId: Types.ObjectId;
  rateeId: Types.ObjectId;
  rateeRole: RateeRole;
  drivingSkill: number;
  professionalBehavior: number;
  punctuality: number;
  overallRating: number;
  review: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type RatingDocument = HydratedDocument<Rating>;

const dimension = {
  type: Number,
  required: true,
  min: RATING_MIN,
  max: RATING_MAX,
  validate: {
    validator: Number.isInteger,
    message: "Rating must be an integer between {MIN} and {MAX}",
  },
};

const ratingSchema = new Schema<Rating>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: "Job", required: true, index: true },
    raterId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rateeId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rateeRole: { type: String, enum: RATEE_ROLES, required: true },
    drivingSkill: dimension,
    professionalBehavior: dimension,
    punctuality: dimension,
    overallRating: { type: Number, required: true, min: RATING_MIN, max: RATING_MAX },
    review: { type: String, default: null, maxlength: 1000 },
  },
  { timestamps: true }
);

ratingSchema.index({ jobId: 1, raterId: 1 }, { unique: true });

export const RatingModel: Model<Rating> =
  (models.Rating as Model<Rating>) ?? model<Rating>("Rating", ratingSchema);
