import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyAccess } from "@/utils/jwt.utils";
import { ACCESS_TOKEN_COOKIE } from "@/utils/cookies.utils";
import { me } from "@/services/auth.service";
import { getProfile } from "@/services/driver.service";
import {
  DriverProfileDashboard,
  type DriverProfileData,
  type ProfileUser,
} from "@/components/shared/profile-dashboard";
import { DOCUMENT_TYPES, type DocumentType } from "@/lib/constants/enums";

export default async function DriverProfilePage() {
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

  const profileData: DriverProfileData | null = profile
    ? {
        age: profile.age,
        city: profile.city,
        address: profile.address,
        areas: profile.areas,
        transmissionTypes: profile.transmissionTypes,
        vehicleCategories: profile.vehicleCategories,
        languages: profile.languages,
        documents: DOCUMENT_TYPES.reduce(
          (acc, t) => {
            const asset = profile.documents?.[t];
            acc[t] = asset?.cloudinaryId
              ? { uploadedAt: new Date(asset.uploadedAt).toISOString() }
              : null;
            return acc;
          },
          {} as Record<DocumentType, { uploadedAt: string } | null>,
        ),
        isVerified: profile.isVerified,
        averageRating: profile.averageRating,
        totalJobsCompleted: profile.totalJobsCompleted,
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

  return <DriverProfileDashboard user={userData} profile={profileData} />;
}
