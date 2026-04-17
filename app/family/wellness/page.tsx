import Link from "next/link";
// Update imports to include icons used in the dashboard nav
import { House, Clock, Heart, User } from "lucide-react";

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
  
  const updatesHref = 
    userRole === "caregiver"
        ? `/caregiver/monitoring${scope.patientUserId ? `?patientId=${scope.patientUserId}` : ""}`
        : `/family/updates${scope.patientUserId ? `?patientId=${scope.patientUserId}` : ""}`;
  
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

      {/* --- UPDATED BOTTOM NAVIGATION BAR (Dashboard UI Style) --- */}
      <nav className="pd-nav">
        {/* Dashboard Link - Inactive */}
        <Link href={dashboardHref} className="pd-nav-link">
          <House className="w-7 h-7" />
        </Link>

        {/* Updates Link - Inactive */}
        <Link href={updatesHref} className="pd-nav-link">
          <Clock className="w-7 h-7" />
        </Link>

        {/* Wellness Link - ACTIVE (Using pd-nav-active wrapper) */}
        <div className="pd-nav-active">
          <Link href="/family/wellness" className="flex items-center justify-center w-full h-full">
            <Heart className="w-8 h-8" />
          </Link>
        </div>

        {/* Profile Link - Inactive */}
        <Link href={profileHref} className="pd-nav-link">
          <User className="w-7 h-7" />
        </Link>
      </nav>
    </div>
  );
}