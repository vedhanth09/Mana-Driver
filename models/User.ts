import { Schema, model, models, type Model, type Types, type HydratedDocument } from "mongoose";
import { USER_ROLES, type UserRole } from "@/lib/constants/enums";

export interface UserAttrs {
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  isProfileComplete: boolean;
}

export interface User extends UserAttrs {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<User>;

const userSchema = new Schema<User>(
  {
    fullName: { type: String, required: true, trim: true, minlength: 2 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: USER_ROLES },
    isProfileComplete: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

export const UserModel: Model<User> =
  (models.User as Model<User>) ?? model<User>("User", userSchema);
