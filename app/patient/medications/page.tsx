import { AppShell } from "@/components/app-shell";
import { MedicationManager } from "@/components/medication-manager";
import { OfflineSyncPanel } from "@/components/offline-sync-panel";
import { listMedicationsForPatient } from "@/lib/db/medic-data";
import { requireRole } from "@/lib/auth/dal";

export default async function PatientMedicationsPage() {
  const user = await requireRole("patient");
  const medications = await listMedicationsForPatient(user.userId);

  return (
    <AppShell
      user={user}
      title="Medication Reminder"
      description="Create medications, review schedules, mark doses as taken, and test the first offline sync layer."
      links={[
        { href: "/patient/dashboard", label: "Home" },
        { href: "/patient/schedule", label: "Schedule" },
        { href: "/patient/care-circle", label: "Care Circle" },
      ]}
    >
      <MedicationManager
        canManage
        items={medications}
        patientUserId={user.userId}
      />
      <OfflineSyncPanel medications={medications} patientUserId={user.userId} />
    </AppShell>
  );
}
