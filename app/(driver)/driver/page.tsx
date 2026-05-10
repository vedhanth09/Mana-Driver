import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyAccess } from "@/utils/jwt.utils";
import { ACCESS_TOKEN_COOKIE } from "@/utils/cookies.utils";
import { me } from "@/services/auth.service";
import { getProfile } from "@/services/driver.service";
import { DriverDashboard } from "./dashboard";
import type { Language } from "@/lib/constants/enums";

export default async function DriverHomePage() {
  const store = await cookies();
  const token = store.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) redirect("/login");

  let userId: string;
  try {
    userId = verifyAccess(token).id;
  } catch {
    redirect("/login");
  }

  const user = await me(userId);
  if (!user.isProfileComplete) {
    redirect("/driver/onboarding");
  }

  const profile = await getProfile(userId);
  const driverLanguages: Language[] = profile?.languages ?? [];

  return (
    <DriverDashboard
      driverName={user.fullName}
      driverLanguages={driverLanguages}
    />
  );
}
