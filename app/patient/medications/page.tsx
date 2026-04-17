import { MedicationManager } from "@/components/medication-manager";
import { OfflineSyncPanel } from "@/components/offline-sync-panel";
import { PatientBottomNav } from "@/components/patient-bottom-nav";
import { requireRole } from "@/lib/auth/dal";
import {
  getMedicationAdherenceSummary,
  listMedicationLogsForPatient,
  listMedicationsForPatient,
} from "@/lib/db/medic-data";

export default async function PatientMedicationsPage() {
  const user = await requireRole("patient");
  const [medications, summary, logs] = await Promise.all([
    listMedicationsForPatient(user.userId, { includeInactive: true }),
    getMedicationAdherenceSummary(user.userId),
    listMedicationLogsForPatient(user.userId, 10),
  ]);

  return (
    <main className="pd-page pb-24">
      {/* Header matching the dashboard aesthetic */}
      <header className="mb-6">
        <h1 className="pd-heading">Medication Reminder</h1>
        <p className="text-[13px] opacity-70 mt-1">
          Create medications, manage schedules, record taken or missed doses, and test the first offline sync layer.
        </p>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-col gap-4">
        <MedicationManager
          canManage
          contactMethod={user.preferences.preferredContactMethod}
          items={medications}
          logs={logs}
          patientDisplayName={`${user.firstName} ${user.lastName}`}
          patientUserId={user.userId}
          role={user.role}
          summary={summary}
          timeFormat={user.preferences.timeFormat}
          viewerDisplayName={`${user.firstName} ${user.lastName}`}
        />
        <OfflineSyncPanel 
          medications={medications.filter((item) => item.isActive)} 
          patientUserId={user.userId} 
        />
      </div>

      {/* Bottom Navigation with Medications set to active */}
      <PatientBottomNav activeItem="medications" />
    </main>
  );
}