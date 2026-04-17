import { redirect } from "next/navigation";
import Link from "next/link";
import { House, Activity, UserPlus, Heart, User } from "lucide-react";

import { JoinPatientPanel } from "@/components/care-circle-manager";
import { getCurrentUser, getProfileRouteForRole } from "@/lib/auth/dal";

type JoinPageProps = {
  searchParams: Promise<{
    code?: string;
  }>;
};

export default async function JoinPage({ searchParams }: JoinPageProps) {
  const user = await getCurrentUser();
  const resolvedSearchParams = await searchParams;

  if (!user) {
    const codeSuffix = resolvedSearchParams.code ? `?code=${resolvedSearchParams.code}` : "";
    redirect(`/sign-in${codeSuffix}`);
  }

  // If a patient accidentally lands here, send them to their own care circle management
  if (user.role === "patient") {
    redirect("/patient/care-circle");
  }

  const activityHref =
    user.role === "caregiver" ? "/caregiver/monitoring" : "/family/updates";

  return (
    <div className="min-h-screen bg-[#Eef1f4] pb-32 font-sans">
      <main className="px-6 pt-10">
        
        {/* --- JOIN PANEL CONTENT --- */}
        <div className="rounded-[2.5rem] bg-white p-6 shadow-sm border border-black/5">
          <JoinPatientPanel
            defaultCode={resolvedSearchParams.code ?? null}
            role={user.role}
          />
        </div>
      </main>

      {/* --- BOTTOM NAVIGATION BAR --- */}
      <nav className="pd-nav">
        {/* Dashboard */}
        <Link href={user.role === "caregiver" ? "/caregiver/dashboard" : "/family/dashboard"} className="pd-nav-link">
          <House className="w-7 h-7" />
        </Link>
        
        {/* Monitoring / Updates */}
        <Link href={activityHref} className="pd-nav-link">
          <Activity className="w-7 h-7" />
        </Link>

        {/* Join a Patient - ACTIVE */}
        <div className="pd-nav-active">
          <Link href="/caregiver/join" className="flex items-center justify-center w-full h-full">
            <UserPlus className="w-8 h-8" />
          </Link>
        </div>

        {/* Wellness */}
        <Link href="/caregiver/wellness" className="pd-nav-link">
          <Heart className="w-7 h-7" />
        </Link>

        {/* Profile */}
        <Link href={getProfileRouteForRole(user.role)} className="pd-nav-link">
          <User className="w-7 h-7" />
        </Link>
      </nav>
    </div>
  );
}