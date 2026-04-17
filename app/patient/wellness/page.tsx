import Link from "next/link";
import { House, Clock, Heart, User } from "lucide-react"; // Match dashboard icons

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
  
  const scheduleHref = "/patient/schedule";
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
              className="mt-4 inline-block text-sm font-bold text-[#4D6A56] underline"
            >
              Connect to a patient
            </Link>
          </section>
        ) : (
          /* --- WELLNESS CONTENT --- */
            <div className="rounded-[2.5rem] bg-white/40 p-2 [&_.medic-button-primary]:!bg-[#4D6A56] [&_.medic-button-primary]:!border-[#4D6A56]">
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

      {/* --- BOTTOM NAVIGATION BAR (Dashboard Style) --- */}
      <nav className="pd-nav">
        {/* Home */}
        <Link href="/patient/dashboard" className="pd-nav-link">
          <House className="w-7 h-7" />
        </Link>

        {/* Schedule */}
        <Link href="/patient/schedule" className="pd-nav-link">
          <Clock className="w-7 h-7" />
        </Link>

        {/* Wellness - ACTIVE */}
        <div className="pd-nav-active">
          <Link href="/patient/wellness" className="flex items-center justify-center w-full h-full">
            <Heart className="w-8 h-8" />
          </Link>
        </div>

        {/* Profile */}
        <Link href="/patient/profile" className="pd-nav-link">
          <User className="w-7 h-7" />
        </Link>
      </nav>
    </div>
  );
}