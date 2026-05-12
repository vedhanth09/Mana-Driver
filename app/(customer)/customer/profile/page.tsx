import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyAccess } from "@/utils/jwt.utils";
import { ACCESS_TOKEN_COOKIE } from "@/utils/cookies.utils";
import { me } from "@/services/auth.service";
import { getProfile } from "@/services/customer.service";
import {
  CustomerProfileDashboard,
  type CustomerProfileData,
  type ProfileUser,
} from "@/components/shared/profile-dashboard";

export default async function CustomerProfilePage() {
  const store = await cookies();
  const token = store.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) redirect("/login");

  let userId: string;
  try {
    userId = verifyAccess(token).id;
  } catch {
    redirect("/login");
  }

  const [user, profile] = await Promise.all([me(userId), getProfile(userId)]);

  const profileData: CustomerProfileData | null = profile
    ? {
        city: profile.city,
        carDetails: profile.carDetails
          ? { make: profile.carDetails.make, model: profile.carDetails.model }
          : null,
        preferences: profile.preferences
          ? {
              transmissionType: profile.preferences.transmissionType,
              vehicleCategory: profile.preferences.vehicleCategory,
            }
          : null,
        languages: profile.languages,
        averageRating: profile.averageRating,
      }
    : null;

  const userData: ProfileUser = {
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatarUrl: user.avatarUrl,
    isProfileComplete: user.isProfileComplete,
    createdAt: new Date(user.createdAt).toISOString(),
  };

  return <CustomerProfileDashboard user={userData} profile={profileData} />;
}
