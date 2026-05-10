import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import {
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_MAX_AGE,
  type UserRole,
} from "@/lib/constants/enums";

export interface AccessTokenPayload {
  id: string;
  role: UserRole;
  email: string;
}

export interface RefreshTokenPayload {
  id: string;
}

function getSecret(name: "JWT_SECRET" | "JWT_REFRESH_SECRET"): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

export function signAccess(payload: AccessTokenPayload): string {
  const opts: SignOptions = { expiresIn: ACCESS_TOKEN_MAX_AGE };
  return jwt.sign(payload, getSecret("JWT_SECRET"), opts);
}

export function signRefresh(payload: RefreshTokenPayload): string {
  const opts: SignOptions = { expiresIn: REFRESH_TOKEN_MAX_AGE };
  return jwt.sign(payload, getSecret("JWT_REFRESH_SECRET"), opts);
}

export function verifyAccess(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, getSecret("JWT_SECRET")) as JwtPayload &
    Partial<AccessTokenPayload>;
  if (
    typeof decoded !== "object" ||
    typeof decoded.id !== "string" ||
    typeof decoded.role !== "string" ||
    typeof decoded.email !== "string"
  ) {
    throw new jwt.JsonWebTokenError("Malformed access token payload");
  }
  return { id: decoded.id, role: decoded.role as UserRole, email: decoded.email };
}

export function verifyRefresh(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, getSecret("JWT_REFRESH_SECRET")) as JwtPayload &
    Partial<RefreshTokenPayload>;
  if (typeof decoded !== "object" || typeof decoded.id !== "string") {
    throw new jwt.JsonWebTokenError("Malformed refresh token payload");
  }
  return { id: decoded.id };
}
