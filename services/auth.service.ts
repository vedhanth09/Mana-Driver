import { Types, isValidObjectId } from "mongoose";
import { dbConnect } from "@/lib/db";
import { UserModel, type User } from "@/models/User";
import { PasswordResetOtpModel } from "@/models/PasswordResetOtp";
import { DriverProfileModel } from "@/models/DriverProfile";
import { CustomerProfileModel } from "@/models/CustomerProfile";
import { JobModel } from "@/models/Job";
import { ApplicationModel } from "@/models/Application";
import { RatingModel } from "@/models/Rating";
import { NotificationModel } from "@/models/Notification";
import { destroyAsset } from "@/services/cloudinary.service";
import { DOCUMENT_TYPES, type JobStatus } from "@/lib/constants/enums";
import { hashPassword, comparePassword } from "@/utils/bcrypt.utils";
import {
  signAccess,
  signRefresh,
  signPasswordResetToken,
  verifyPasswordResetToken,
} from "@/utils/jwt.utils";
import { verifyGoogleIdToken, type GoogleProfile } from "@/utils/google.utils";
import { sendPasswordResetOtpEmail } from "@/utils/email.utils";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/utils/errors";
import type {
  ForgotPasswordInput,
  LoginInput,
  ResetPasswordInput,
  SignupInput,
  VerifyOtpInput,
} from "@/schemas/auth.schema";
import type { UserRole } from "@/lib/constants/enums";

const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const OTP_MAX_ATTEMPTS = 5;

export interface PublicUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: User["role"];
  isProfileComplete: boolean;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

export interface GoogleAuthResult extends AuthResult {
  isNewUser: boolean;
}

function toPublicUser(user: User): PublicUser {
  return {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    phone: user.phone ?? "",
    role: user.role,
    isProfileComplete: user.isProfileComplete,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function issueTokens(user: User): { accessToken: string; refreshToken: string } {
  const accessToken = signAccess({
    id: user._id.toString(),
    role: user.role,
    email: user.email,
  });
  const refreshToken = signRefresh({ id: user._id.toString() });
  return { accessToken, refreshToken };
}

export async function signup(input: SignupInput): Promise<AuthResult> {
  await dbConnect();

  const email = input.email.toLowerCase().trim();
  const phone = input.phone.trim();

  const existing = await UserModel.findOne({
    $or: [{ email }, { phone }],
  })
    .lean<{ email: string; phone: string }>()
    .exec();

  if (existing) {
    if (existing.email === email) {
      throw new ConflictError("An account with this email already exists");
    }
    throw new ConflictError("An account with this phone number already exists");
  }

  const passwordHash = await hashPassword(input.password);

  const created = await UserModel.create({
    fullName: input.fullName.trim(),
    email,
    phone,
    passwordHash,
    role: input.role,
    isProfileComplete: false,
    authProvider: "local",
  });

  const user = created.toObject() as unknown as User;
  const tokens = issueTokens(user);
  return { user: toPublicUser(user), ...tokens };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  await dbConnect();

  const email = input.email.toLowerCase().trim();
  const user = await UserModel.findOne({ email }).lean<User>().exec();
  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  if (!user.passwordHash) {
    throw new UnauthorizedError(
      "This account uses Google sign-in. Continue with Google instead.",
    );
  }

  const valid = await comparePassword(input.password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const tokens = issueTokens(user);
  return { user: toPublicUser(user), ...tokens };
}

export async function googleAuth(
  credential: string,
  fallbackRole: UserRole,
): Promise<GoogleAuthResult> {
  await dbConnect();

  let profile: GoogleProfile;
  try {
    profile = await verifyGoogleIdToken(credential);
  } catch (e) {
    if (e instanceof Error) {
      throw new UnauthorizedError(e.message);
    }
    throw new UnauthorizedError("Google sign-in failed");
  }

  if (!profile.email) {
    throw new ValidationError("Google account did not return an email address");
  }

  const email = profile.email.toLowerCase().trim();

  const existing = await UserModel.findOne({
    $or: [{ googleId: profile.sub }, { email }],
  }).exec();

  if (existing) {
    let mutated = false;
    if (!existing.googleId) {
      existing.googleId = profile.sub;
      mutated = true;
    }
    if (!existing.avatarUrl && profile.picture) {
      existing.avatarUrl = profile.picture;
      mutated = true;
    }
    if (mutated) {
      await existing.save();
    }
    const user = existing.toObject() as unknown as User;
    const tokens = issueTokens(user);
    return { user: toPublicUser(user), ...tokens, isNewUser: false };
  }

  const fullName =
    profile.name?.trim() ||
    [profile.given_name, profile.family_name].filter(Boolean).join(" ").trim() ||
    email.split("@")[0];

  const created = await UserModel.create({
    fullName,
    email,
    role: fallbackRole,
    isProfileComplete: false,
    authProvider: "google",
    googleId: profile.sub,
    avatarUrl: profile.picture,
  });

  const user = created.toObject() as unknown as User;
  const tokens = issueTokens(user);
  return { user: toPublicUser(user), ...tokens, isNewUser: true };
}

export async function me(userId: string): Promise<PublicUser> {
  await dbConnect();
  const user = await UserModel.findById(userId).lean<User>().exec();
  if (!user) throw new NotFoundError("User no longer exists");
  return toPublicUser(user);
}

export function logout(): void {
  // Phase 1: stateless JWT — no server-side blacklist. Cookies are cleared by the route handler.
}

function generateOtpCode(): string {
  // 6-digit code, zero-padded. Math.random is fine for OTPs because the secret
  // never leaves the server; the hash + 10-min expiry + attempt cap are the
  // primary defenses against guessing.
  return Math.floor(Math.random() * 1_000_000).toString().padStart(6, "0");
}

export async function requestPasswordReset(
  input: ForgotPasswordInput,
): Promise<void> {
  await dbConnect();
  const email = input.email.toLowerCase().trim();

  const user = await UserModel.findOne({ email }).lean<User>().exec();

  // Always behave the same to the caller to avoid leaking which emails are
  // registered. Skip Google-only accounts (no password to reset).
  if (!user || !user.passwordHash) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[requestPasswordReset] silent no-op for "${email}": ` +
          (!user
            ? "no user found"
            : `user ${user._id.toString()} has no passwordHash (authProvider=${user.authProvider})`),
      );
    }
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    console.info(
      `[requestPasswordReset] sending OTP to "${email}" (user ${user._id.toString()})`,
    );
  }

  const code = generateOtpCode();
  const codeHash = await hashPassword(code);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

  await PasswordResetOtpModel.create({
    email,
    codeHash,
    expiresAt,
    attempts: 0,
    consumedAt: null,
    resetUsedAt: null,
  });

  await sendPasswordResetOtpEmail(email, code);
}

export async function verifyPasswordResetOtp(
  input: VerifyOtpInput,
): Promise<{ resetToken: string }> {
  await dbConnect();
  const email = input.email.toLowerCase().trim();

  const otp = await PasswordResetOtpModel.findOne({
    email,
    consumedAt: null,
  })
    .sort({ createdAt: -1 })
    .exec();

  if (!otp) {
    throw new UnauthorizedError("Invalid or expired code");
  }

  if (otp.expiresAt.getTime() < Date.now()) {
    throw new UnauthorizedError("Invalid or expired code");
  }

  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    throw new UnauthorizedError("Too many attempts. Request a new code.");
  }

  const valid = await comparePassword(input.code, otp.codeHash);
  if (!valid) {
    otp.attempts += 1;
    await otp.save();
    throw new UnauthorizedError("Invalid or expired code");
  }

  otp.consumedAt = new Date();
  await otp.save();

  const resetToken = signPasswordResetToken({
    otpId: otp._id.toString(),
    email,
  });
  return { resetToken };
}

export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  await dbConnect();

  const payload = verifyPasswordResetToken(input.resetToken);

  if (!isValidObjectId(payload.otpId)) {
    throw new UnauthorizedError("Invalid reset token");
  }

  const otp = await PasswordResetOtpModel.findById(payload.otpId).exec();
  if (!otp || otp.email !== payload.email) {
    throw new UnauthorizedError("Invalid reset token");
  }
  if (!otp.consumedAt) {
    // Token was signed without the OTP being verified — shouldn't happen.
    throw new UnauthorizedError("Invalid reset token");
  }
  if (otp.resetUsedAt) {
    throw new UnauthorizedError("This reset link has already been used");
  }

  const user = await UserModel.findOne({ email: payload.email }).exec();
  if (!user) {
    throw new NotFoundError("Account not found");
  }

  user.passwordHash = await hashPassword(input.password);
  await user.save();

  otp.resetUsedAt = new Date();
  await otp.save();
}

function roundTenth(n: number): number {
  return Math.round(n * 10) / 10;
}

async function recomputeAverageForUsers(
  userIds: Types.ObjectId[],
): Promise<void> {
  if (userIds.length === 0) return;

  const aggregates = await RatingModel.aggregate<{
    _id: Types.ObjectId;
    avg: number;
    rateeRole: "driver" | "customer";
  }>([
    { $match: { rateeId: { $in: userIds } } },
    {
      $group: {
        _id: "$rateeId",
        avg: { $avg: "$overallRating" },
        rateeRole: { $first: "$rateeRole" },
      },
    },
  ]);

  const updatedIds = new Set<string>();
  for (const row of aggregates) {
    updatedIds.add(row._id.toString());
    const avg = roundTenth(row.avg);
    if (row.rateeRole === "driver") {
      await DriverProfileModel.updateOne(
        { userId: row._id },
        { $set: { averageRating: avg } },
      ).exec();
    } else {
      await CustomerProfileModel.updateOne(
        { userId: row._id },
        { $set: { averageRating: avg } },
      ).exec();
    }
  }

  // Users who lost their only rating(s) need their average reset to 0.
  const orphans = userIds.filter((id) => !updatedIds.has(id.toString()));
  if (orphans.length > 0) {
    await Promise.all([
      DriverProfileModel.updateMany(
        { userId: { $in: orphans } },
        { $set: { averageRating: 0 } },
      ).exec(),
      CustomerProfileModel.updateMany(
        { userId: { $in: orphans } },
        { $set: { averageRating: 0 } },
      ).exec(),
    ]);
  }
}

export interface DeleteAccountResult {
  deletedJobs: number;
  deletedApplications: number;
  deletedRatings: number;
  deletedNotifications: number;
  revertedAcceptedJobs: number;
  destroyedDocuments: number;
}

/**
 * Hard-delete the user and every record that references them. Used by the
 * "Delete account" button on the profile page.
 *
 * Customer path: cascade-delete their jobs (which transitively kills the
 * applications, ratings, and notifications attached to those jobs).
 *
 * Driver path: leave the jobs in place but unhook this driver — accepted /
 * in-progress jobs revert to "applied" so customers can re-hire.
 */
export async function deleteAccount(
  userId: string,
): Promise<DeleteAccountResult> {
  await dbConnect();

  if (!isValidObjectId(userId)) {
    throw new NotFoundError("User no longer exists");
  }

  const uid = new Types.ObjectId(userId);
  const user = await UserModel.findById(uid).exec();
  if (!user) throw new NotFoundError("User no longer exists");

  const result: DeleteAccountResult = {
    deletedJobs: 0,
    deletedApplications: 0,
    deletedRatings: 0,
    deletedNotifications: 0,
    revertedAcceptedJobs: 0,
    destroyedDocuments: 0,
  };

  // Collect IDs of users whose averageRating may need recomputation after we
  // delete every rating tied to this account.
  const affectedRatees = await RatingModel.find({ raterId: uid })
    .select({ rateeId: 1 })
    .lean<{ rateeId: Types.ObjectId }[]>()
    .exec();
  const affectedRateeIds = Array.from(
    new Map(
      affectedRatees
        .map((r) => r.rateeId)
        .filter((id) => !id.equals(uid))
        .map((id) => [id.toString(), id]),
    ).values(),
  );

  if (user.role === "customer") {
    const ownedJobs = await JobModel.find({ customerId: uid })
      .select({ _id: 1 })
      .lean<{ _id: Types.ObjectId }[]>()
      .exec();
    const ownedJobIds = ownedJobs.map((j) => j._id);

    if (ownedJobIds.length > 0) {
      const [apps, ratings, notes] = await Promise.all([
        ApplicationModel.deleteMany({ jobId: { $in: ownedJobIds } }).exec(),
        RatingModel.deleteMany({ jobId: { $in: ownedJobIds } }).exec(),
        NotificationModel.deleteMany({
          relatedJobId: { $in: ownedJobIds },
        }).exec(),
      ]);
      result.deletedApplications += apps.deletedCount ?? 0;
      result.deletedRatings += ratings.deletedCount ?? 0;
      result.deletedNotifications += notes.deletedCount ?? 0;

      const deletedJobs = await JobModel.deleteMany({
        _id: { $in: ownedJobIds },
      }).exec();
      result.deletedJobs = deletedJobs.deletedCount ?? 0;
    }

    const profileDel = await CustomerProfileModel.deleteOne({
      userId: uid,
    }).exec();
    void profileDel;
  } else if (user.role === "driver") {
    // Revert jobs where this driver was hired so the customer can re-hire.
    const liveStatuses: JobStatus[] = ["accepted", "in_progress"];
    const reverted = await JobModel.updateMany(
      { acceptedDriverId: uid, status: { $in: liveStatuses } },
      { $set: { acceptedDriverId: null, status: "applied" } },
    ).exec();
    result.revertedAcceptedJobs = reverted.modifiedCount ?? 0;

    // For completed/cancelled jobs, just detach the driver reference.
    await JobModel.updateMany(
      { acceptedDriverId: uid, status: { $in: ["completed", "cancelled"] } },
      { $set: { acceptedDriverId: null } },
    ).exec();

    // Delete this driver's applications across the system.
    const apps = await ApplicationModel.deleteMany({ driverId: uid }).exec();
    result.deletedApplications += apps.deletedCount ?? 0;

    // Wipe Cloudinary documents tied to this driver.
    const driverProfile = await DriverProfileModel.findOne({
      userId: uid,
    }).exec();
    if (driverProfile) {
      for (const docType of DOCUMENT_TYPES) {
        const asset = driverProfile.documents?.[docType];
        const publicId = asset?.cloudinaryId;
        if (publicId) {
          try {
            await destroyAsset(publicId);
            result.destroyedDocuments += 1;
          } catch (err) {
            if (process.env.NODE_ENV !== "production") {
              console.error(
                "[auth.service] destroyAsset failed during account deletion",
                publicId,
                err,
              );
            }
          }
        }
      }
      await driverProfile.deleteOne();
    }
  }

  // Ratings authored by OR received by this user — across both roles.
  const ratingsDel = await RatingModel.deleteMany({
    $or: [{ raterId: uid }, { rateeId: uid }],
  }).exec();
  result.deletedRatings += ratingsDel.deletedCount ?? 0;

  // Re-compute averages for users who had ratings authored by the deleted
  // account that survive on the counterparty's profile.
  await recomputeAverageForUsers(affectedRateeIds);

  // Notifications addressed to this user.
  const notesDel = await NotificationModel.deleteMany({ userId: uid }).exec();
  result.deletedNotifications += notesDel.deletedCount ?? 0;

  // Password reset OTPs tied to this email.
  await PasswordResetOtpModel.deleteMany({ email: user.email }).exec();

  // Finally the user record itself.
  await UserModel.deleteOne({ _id: uid }).exec();

  return result;
}
