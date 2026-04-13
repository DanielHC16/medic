import { canManagePatientData, requirePatientScope } from "@/lib/auth/dal";
import {
  getActivitySummary,
  listActivityLogsForPatient,
  listActivityPlansForPatient,
  listAppointmentsForPatient,
} from "@/lib/db/medic-data";
import WellnessUI from "./WellnessUI";
import Link from "next/link";

type WellnessPageProps = {
  searchParams: Promise<{
    patientId?: string;
  }>;
};

export default async function WellnessPage({ searchParams }: WellnessPageProps) {
  const resolvedSearchParams = await searchParams;
  const scope = await requirePatientScope(resolvedSearchParams.patientId ?? null);

  // If no patient is linked, show a simple fallback screen
  if (!scope.patientUserId) {
    return (
      <main className="min-h-screen bg-[#EFF3F1] p-5 pt-12 flex flex-col items-center justify-center font-sans">
        <div className="rounded-[24px] bg-[#F1F3F2] p-8 shadow-md text-center border border-[#D9E0DC]">
          <h2 className="text-[20px] font-bold text-[#1A231D] mb-2">No Patient Linked</h2>
          <p className="text-[14px] text-[#73847B] mb-6">Connect to a patient first to manage wellness routines.</p>
          <Link 
            href={scope.user.role === "caregiver" ? "/caregiver/dashboard" : "/family/dashboard"}
            className="rounded-[12px] bg-[#4D6A56] px-6 py-3 text-[12px] font-bold tracking-widest text-white shadow-lg uppercase"
          >
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  // Fetch all existing data
  const [activityPlans, appointments, activityLogs, activitySummary] = await Promise.all([
    listActivityPlansForPatient(scope.patientUserId, { includeInactive: true }),
    listAppointmentsForPatient(scope.patientUserId, { includeCancelled: true }),
    listActivityLogsForPatient(scope.patientUserId, 10),
    getActivitySummary(scope.patientUserId),
  ]);

  return (
    <WellnessUI 
      activityPlans={activityPlans}
      appointments={appointments}
      activityLogs={activityLogs}
      activitySummary={activitySummary}
      canManage={canManagePatientData(scope.user.role)}
    />
  );
}