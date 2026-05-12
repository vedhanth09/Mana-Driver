import { Schema, model, models, type Model, type Types, type HydratedDocument } from "mongoose";
import { USER_ROLES, type UserRole } from "@/lib/constants/enums";

export const AUTH_PROVIDERS = ["local", "google"] as const;
export type AuthProvider = (typeof AUTH_PROVIDERS)[number];

export interface UserAttrs {
  fullName: string;
  email: string;
  phone?: string;
  passwordHash?: string;
  role: UserRole;
  isProfileComplete: boolean;
  authProvider: AuthProvider;
  googleId?: string;
  avatarUrl?: string;
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
    phone: { type: String, required: false, unique: true, sparse: true, trim: true },
    passwordHash: { type: String, required: false },
    role: { type: String, required: true, enum: USER_ROLES },
    isProfileComplete: { type: Boolean, required: true, default: false },
    authProvider: {
      type: String,
      required: true,
      enum: AUTH_PROVIDERS,
      default: "local",
    },
    googleId: { type: String, required: false, unique: true, sparse: true, index: true },
    avatarUrl: { type: String, required: false, trim: true },
  },
  { timestamps: true }
);

export const UserModel: Model<User> =
  (models.User as Model<User>) ?? model<User>("User", userSchema);
