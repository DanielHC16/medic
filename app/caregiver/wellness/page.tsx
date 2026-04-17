import Link from "next/link";

import { CareMemberBottomNav } from "@/components/care-member-bottom-nav";
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

      <CareMemberBottomNav
        activeItem="wellness"
        patientUserId={scope.patientUserId}
        role="caregiver"
      />
    </div>
  );
}
