import Link from "next/link";
import { type LucideIcon, Home, Activity, UserPlus, Heart, User } from "lucide-react";

import { WellnessManager } from "@/components/wellness-manager";
import {
  canManagePatientData,
  getDefaultRouteForRole,
  getProfileRouteForRole,
  requirePatientScope,
} from "@/lib/auth/dal";
import {
  getActivitySummary,
  listActivityLogsForPatient,
  listActivityPlansForPatient,
  listAppointmentsForPatient,
} from "@/lib/db/medic-data";

type WellnessPageProps = {
  searchParams: Promise<{
    patientId?: string;
  }>;
};

export default async function WellnessPage({ searchParams }: WellnessPageProps) {
  const resolvedSearchParams = await searchParams;
  const scope = await requirePatientScope(resolvedSearchParams.patientId ?? null);
  
  const userRole = scope.user.role;
  const dashboardHref =
    userRole === "patient"
      ? getDefaultRouteForRole(userRole)
      : `${getDefaultRouteForRole(userRole)}${
          scope.patientUserId ? `?patientId=${scope.patientUserId}` : ""
        }`;
  const secondaryHref =
    userRole === "patient"
      ? "/patient/schedule"
      : userRole === "caregiver"
        ? `/caregiver/monitoring${scope.patientUserId ? `?patientId=${scope.patientUserId}` : ""}`
        : `/family/updates${scope.patientUserId ? `?patientId=${scope.patientUserId}` : ""}`;
  const tertiaryHref =
    userRole === "patient" ? "/patient/care-circle" : "/join";
  const profileHref = getProfileRouteForRole(userRole);

  const [activityPlans, appointments, activityLogs, activitySummary] = scope.patientUserId 
    ? await Promise.all([
        listActivityPlansForPatient(scope.patientUserId, { includeInactive: true }),
        listAppointmentsForPatient(scope.patientUserId, { includeCancelled: true }),
        listActivityLogsForPatient(scope.patientUserId, 10),
        getActivitySummary(scope.patientUserId),
      ])
    : [null, null, [], null];

  return (
    <div className="min-h-screen bg-[#Eef1f4] pb-32 font-sans">
      <main className="px-6 pt-10">
        {/* --- WELLNESS HEADER --- */}
        <section className="mb-6 rounded-[2.5rem] bg-white p-8 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5C8B6B]">
            Medic
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            Wellness
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-500">
            Create or review activity routines and appointments linked to the current patient.
          </p>
        </section>

        {/* --- WELLNESS CONTENT --- */}
        {!scope.patientUserId ? (
          <section className="rounded-[2rem] border border-black/5 bg-white/90 p-8 shadow-sm text-center">
            <p className="text-gray-500">No linked patient is available yet.</p>
            <Link 
              href="/join" 
              className="mt-4 inline-block text-sm font-bold text-[#5C8B6B] underline"
            >
              Connect to a patient
            </Link>
          </section>
        ) : (
          <div className="rounded-[2.5rem] bg-white/40 p-2">
            <WellnessManager
              activityLogs={activityLogs}
              activityPlans={activityPlans || []}
              activitySummary={activitySummary!}
              appointments={appointments || []}
              canManage={canManagePatientData(userRole)}
              patientUserId={scope.patientUserId}
            />
          </div>
        )}
      </main>

      {/* --- BOTTOM NAVIGATION BAR --- */}
      <nav className="fixed bottom-0 left-0 right-0 z-[100] flex items-center justify-around rounded-t-[2.5rem] bg-white px-4 py-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-gray-100">
        {/* Home */}
        <NavIcon 
          href={dashboardHref}
          icon={Home} 
          isActive={false} 
        />
        
        {/* Role workspace */}
        <NavIcon 
          href={secondaryHref}
          icon={Activity} 
          isActive={false} 
        />

        {/* Join / Care circle */}
        <NavIcon 
          href={tertiaryHref}
          icon={UserPlus} 
          isActive={false} 
        />

        {/* Wellness - ACTIVE */}
        <NavIcon 
          href="/wellness" 
          icon={Heart} 
          isActive={true} 
        />

        {/* Profile */}
        <NavIcon 
          href={profileHref}
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
