import { Schema, model, models, type Model, type Types, type HydratedDocument } from "mongoose";
import { NOTIFICATION_TYPES, type NotificationType } from "@/lib/constants/enums";

export interface Notification {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: NotificationType;
  message: string;
  relatedJobId: Types.ObjectId | null;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type NotificationDocument = HydratedDocument<Notification>;

const notificationSchema = new Schema<Notification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    message: { type: String, required: true },
    relatedJobId: { type: Schema.Types.ObjectId, ref: "Job", default: null },
    isRead: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

export const NotificationModel: Model<Notification> =
  (models.Notification as Model<Notification>) ??
  model<Notification>("Notification", notificationSchema);
