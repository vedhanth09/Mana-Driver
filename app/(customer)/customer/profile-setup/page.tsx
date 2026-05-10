import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyAccess } from "@/utils/jwt.utils";
import { ACCESS_TOKEN_COOKIE } from "@/utils/cookies.utils";
import { me } from "@/services/auth.service";
import { ProfileSetupForm } from "./profile-setup-form";

export default async function CustomerProfileSetupPage() {
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
  if (user.isProfileComplete) {
    redirect("/customer");
  }

  return <ProfileSetupForm fullName={user.fullName} />;
}
