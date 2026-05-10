import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { verifyAccess, type AccessTokenPayload } from "@/utils/jwt.utils";
import { ACCESS_TOKEN_COOKIE } from "@/utils/cookies.utils";
import { ForbiddenError, UnauthorizedError } from "@/utils/errors";
import type { UserRole } from "@/lib/constants/enums";

export type AuthUser = AccessTokenPayload;

async function readAccessToken(req?: NextRequest): Promise<string | undefined> {
  if (req) return req.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const store = await cookies();
  return store.get(ACCESS_TOKEN_COOKIE)?.value;
}

export async function requireAuth(req?: NextRequest): Promise<AuthUser> {
  const token = await readAccessToken(req);
  if (!token) throw new UnauthorizedError("Missing authentication cookie");
  try {
    return verifyAccess(token);
  } catch {
    throw new UnauthorizedError("Invalid or expired session");
  }
}

export async function requireRole(
  req: NextRequest | undefined,
  role: UserRole
): Promise<AuthUser> {
  const user = await requireAuth(req);
  if (user.role !== role) {
    throw new ForbiddenError(`This action requires ${role} role`);
  }
  return user;
}

export async function getOptionalAuth(
  req?: NextRequest
): Promise<AuthUser | null> {
  const token = await readAccessToken(req);
  if (!token) return null;
  try {
    return verifyAccess(token);
  } catch {
    return null;
  }
}
