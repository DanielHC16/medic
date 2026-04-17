import { requireRole } from "@/lib/auth/dal";
import {
  getActivitySummary,
  getMedicationAdherenceSummary,
  getPatientDashboardData,
  listMedicationLogsForPatient,
} from "@/lib/db/medic-data";

import PatientDashboardClient from "./PatientDashboardClient";

export default async function PatientDashboardPage() {
  const user = await requireRole("patient");
  const [dashboard, medicationLogs, activitySummary, medicationSummary] = await Promise.all([
    getPatientDashboardData(user.userId),
    listMedicationLogsForPatient(user.userId, 20),
    getActivitySummary(user.userId),
    getMedicationAdherenceSummary(user.userId),
  ]);

  if (!dashboard) {
    return null;
  }

  return (
    <PatientDashboardClient
      activitySummary={activitySummary}
      dashboard={dashboard}
      medicationLogs={medicationLogs}
      medicationSummary={medicationSummary}
    />
  );
}
