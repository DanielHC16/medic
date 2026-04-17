import { redirect } from "next/navigation";
import Link from "next/link";
import { type LucideIcon, Home, Activity, UserPlus, Heart, User } from "lucide-react";

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
      <nav className="fixed bottom-0 left-0 right-0 z-[100] flex items-center justify-around rounded-t-[2.5rem] bg-white px-4 py-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-gray-100">
        {/* Dashboard */}
        <NavIcon 
          href={user.role === "caregiver" ? "/caregiver/dashboard" : "/family/dashboard"} 
          icon={Home} 
          isActive={false} 
        />
        
        {/* Monitoring */}
        <NavIcon 
          href={activityHref}
          icon={Activity} 
          isActive={false} 
        />

        {/* Join a Patient - ACTIVE */}
        <NavIcon 
          href="/join" 
          icon={UserPlus} 
          isActive={true} 
        />

        {/* Wellness */}
        <NavIcon 
          href="/wellness" 
          icon={Heart} 
          isActive={false} 
        />

        {/* Profile */}
        <NavIcon 
          href={getProfileRouteForRole(user.role)}
          icon={User} 
          isActive={false} 
        />
      </nav>
    </div>
  );
}

/**
 * Shared NavIcon Component
 */
function NavIcon({
  href,
  icon: Icon,
  isActive,
}: {
  href: string;
  icon: LucideIcon;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={`relative flex h-14 w-14 items-center justify-center transition-all duration-300 ${
        isActive 
          ? "rounded-full bg-[#5C8B6B] shadow-lg scale-110" 
          : "rounded-full bg-transparent hover:bg-gray-50"
      }`}
    >
      <Icon 
        size={24}
        color={isActive ? "#FFFFFF" : "#5C8B6B"} 
        strokeWidth={isActive ? 2.5 : 2}
        className="block"
      />
    </Link>
  );
}
