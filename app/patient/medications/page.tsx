import { AppShell } from "@/components/app-shell";
import { MedicationManager } from "@/components/medication-manager";
import { OfflineSyncPanel } from "@/components/offline-sync-panel";
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
    <AppShell
      user={user}
      title="Medication Reminder"
      description="Create medications, manage schedules, record taken or missed doses, and test the first offline sync layer."
      links={[
        { href: "/patient/dashboard", label: "Home" },
        { href: "/patient/schedule", label: "Schedule" },
        { href: "/patient/alerts", label: "Alerts" },
        { href: "/patient/care-circle", label: "Care Circle" },
      ]}
    >
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
      <OfflineSyncPanel medications={medications.filter((item) => item.isActive)} patientUserId={user.userId} />
    </AppShell>
  );
}
