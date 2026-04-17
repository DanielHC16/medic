import Link from "next/link";
import { PatientBottomNav } from "@/components/patient-bottom-nav";

import { WellnessManager } from "@/components/wellness-manager";
import {
  canManagePatientData,
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

      <PatientBottomNav activeItem="wellness" />
    </div>
  );
}
