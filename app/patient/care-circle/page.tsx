import { CareCircleManager } from "@/components/care-circle-manager";
import { PatientBottomNav } from "@/components/patient-bottom-nav";
import { requireRole } from "@/lib/auth/dal";
import {
  listInvitationsForPatient,
  listPatientConnections,
} from "@/lib/db/medic-data";

export default async function PatientCareCirclePage() {
  const user = await requireRole("patient");
  const [connections, invitations] = await Promise.all([
    listPatientConnections(user.userId),
    listInvitationsForPatient(user.userId),
  ]);

  return (
    <main className="pd-page pb-24">
      {/* Header matching the dashboard aesthetic */}
      <header className="mb-6">
        <h1 className="pd-heading">Care Circle</h1>
        <p className="text-[13px] opacity-70 mt-1">
          Generate invite codes, deep links, and QR shares, approve pending requests, and review who can access the patient profile.
        </p>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-col gap-4">
        <CareCircleManager
          connections={connections}
          invitations={invitations}
          patientUserId={user.userId}
        />
      </div>

      {/* Bottom Navigation with Care Circle set to active */}
      <PatientBottomNav activeItem="care-circle" />
    </main>
  );
}