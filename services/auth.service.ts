import { dbConnect } from "@/lib/db";
import { UserModel, type User } from "@/models/User";
import { hashPassword, comparePassword } from "@/utils/bcrypt.utils";
import { signAccess, signRefresh } from "@/utils/jwt.utils";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "@/utils/errors";
import type { LoginInput, SignupInput } from "@/schemas/auth.schema";

export interface PublicUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: User["role"];
  isProfileComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

function toPublicUser(user: User): PublicUser {
  return {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isProfileComplete: user.isProfileComplete,
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

  const valid = await comparePassword(input.password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const tokens = issueTokens(user);
  return { user: toPublicUser(user), ...tokens };
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
