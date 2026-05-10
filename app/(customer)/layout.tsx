import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyAccess } from "@/utils/jwt.utils";
import { ACCESS_TOKEN_COOKIE } from "@/utils/cookies.utils";
import { me } from "@/services/auth.service";
import { Navbar } from "@/components/shared/navbar";

export default async function CustomerGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const store = await cookies();
  const token = store.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) redirect("/login");

  let userId: string;
  let role: string;
  try {
    const payload = verifyAccess(token);
    userId = payload.id;
    role = payload.role;
  } catch {
    redirect("/login");
  }

  if (role !== "customer") {
    redirect(role === "driver" ? "/driver" : "/login");
  }

  const user = await me(userId);

  return (
    <>
      <Navbar
        initialUser={{
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          isProfileComplete: user.isProfileComplete,
        }}
      />
      <div className="min-h-screen pt-16">{children}</div>
    </>
  );
}
