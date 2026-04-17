import { PatientScheduleManager } from "@/components/patient-schedule-manager";
import { requireRole } from "@/lib/auth/dal";
import {
  listAppointmentsForPatient,
  listMedicationLogsForPatient,
  listMedicationsForPatient,
} from "@/lib/db/medic-data";

type PatientSchedulePageProps = {
  searchParams: Promise<{
    appointmentId?: string;
    medicationId?: string;
    view?: string;
  }>;
};

export default async function PatientSchedulePage({
  searchParams,
}: PatientSchedulePageProps) {
  const user = await requireRole("patient");
  const resolvedSearchParams = await searchParams;
  const [medications, medicationLogs, appointments] = await Promise.all([
    listMedicationsForPatient(user.userId),
    listMedicationLogsForPatient(user.userId, 40),
    listAppointmentsForPatient(user.userId, { includeCancelled: true }),
  ]);

  const initialView =
    resolvedSearchParams.view === "appointments" ? "appointments" : "medications";

  return (
    <PatientScheduleManager
      appointments={appointments}
      initialAppointmentId={resolvedSearchParams.appointmentId ?? null}
      initialMedicationId={resolvedSearchParams.medicationId ?? null}
      initialView={initialView}
      medicationLogs={medicationLogs}
      medications={medications}
      patientName={`${user.firstName} ${user.lastName}`.trim()}
      profileImageDataUrl={user.profileImageDataUrl}
      timeFormat={user.preferences.timeFormat}
    />
  );
}
