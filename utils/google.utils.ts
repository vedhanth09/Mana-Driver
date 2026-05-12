export interface GoogleProfile {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

interface GoogleTokenInfo {
  iss?: string;
  azp?: string;
  aud?: string;
  sub?: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  exp?: string | number;
  error?: string;
  error_description?: string;
}

const TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo";
const ALLOWED_ISSUERS = new Set([
  "https://accounts.google.com",
  "accounts.google.com",
]);

function getClientId(): string {
  const id =
    process.env.GOOGLE_CLIENT_ID ?? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!id) {
    throw new Error(
      "Google OAuth is not configured. Set GOOGLE_CLIENT_ID (and NEXT_PUBLIC_GOOGLE_CLIENT_ID) in your environment.",
    );
  }
  return id;
}

export async function verifyGoogleIdToken(
  idToken: string,
): Promise<GoogleProfile> {
  if (!idToken || typeof idToken !== "string") {
    throw new Error("Missing Google credential");
  }

  const clientId = getClientId();

  const url = `${TOKENINFO_URL}?id_token=${encodeURIComponent(idToken)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Could not verify Google credential");
  }

  const info = (await res.json()) as GoogleTokenInfo;
  if (info.error) {
    throw new Error("Invalid Google credential");
  }

  if (!info.iss || !ALLOWED_ISSUERS.has(info.iss)) {
    throw new Error("Invalid Google credential issuer");
  }
  if (info.aud !== clientId) {
    throw new Error("Google credential audience mismatch");
  }
  const expSeconds =
    typeof info.exp === "string" ? Number.parseInt(info.exp, 10) : info.exp;
  if (!expSeconds || expSeconds * 1000 < Date.now()) {
    throw new Error("Google credential has expired");
  }
  if (!info.sub || !info.email) {
    throw new Error("Google credential missing required fields");
  }

  const emailVerified =
    info.email_verified === true || info.email_verified === "true";
  if (!emailVerified) {
    throw new Error("Google email is not verified");
  }

  return {
    sub: info.sub,
    email: info.email,
    email_verified: emailVerified,
    name: info.name,
    given_name: info.given_name,
    family_name: info.family_name,
    picture: info.picture,
  };
}
