import { Types } from "mongoose";
import { dbConnect } from "@/lib/db";
import { NotificationModel, type Notification } from "@/models/Notification";
import { NOTIFICATION_LIMIT, type NotificationType } from "@/lib/constants/enums";

type Id = string | Types.ObjectId;

function toObjectId(id: Id): Types.ObjectId {
  return typeof id === "string" ? new Types.ObjectId(id) : id;
}

export interface NotifyInput {
  userId: Id;
  type: NotificationType;
  message: string;
  relatedJobId?: Id | null;
}

export async function notify(input: NotifyInput): Promise<Notification> {
  await dbConnect();
  const doc = await NotificationModel.create({
    userId: toObjectId(input.userId),
    type: input.type,
    message: input.message,
    relatedJobId: input.relatedJobId ? toObjectId(input.relatedJobId) : null,
  });
  return doc.toObject({ getters: false }) as unknown as Notification;
}

export interface NotifyManyInput {
  userIds: Id[];
  type: NotificationType;
  message: string;
  relatedJobId?: Id | null;
}

export async function notifyMany(input: NotifyManyInput): Promise<number> {
  if (input.userIds.length === 0) return 0;
  await dbConnect();
  const relatedJobId = input.relatedJobId ? toObjectId(input.relatedJobId) : null;
  const docs = input.userIds.map((userId) => ({
    userId: toObjectId(userId),
    type: input.type,
    message: input.message,
    relatedJobId,
  }));
  const result = await NotificationModel.insertMany(docs, { ordered: false });
  return result.length;
}

export async function markAllRead(userId: Id): Promise<number> {
  await dbConnect();
  const res = await NotificationModel.updateMany(
    { userId: toObjectId(userId), isRead: false },
    { $set: { isRead: true } }
  );
  return res.modifiedCount ?? 0;
}

export interface NotificationListResult {
  notifications: Notification[];
  unreadCount: number;
}

export async function listForUser(
  userId: Id,
  options: { limit?: number } = {}
): Promise<NotificationListResult> {
  await dbConnect();
  const limit = options.limit ?? NOTIFICATION_LIMIT;
  const uid = toObjectId(userId);
  const [notifications, unreadCount] = await Promise.all([
    NotificationModel.find({ userId: uid })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean<Notification[]>()
      .exec(),
    NotificationModel.countDocuments({ userId: uid, isRead: false }).exec(),
  ]);
  return { notifications, unreadCount };
}
