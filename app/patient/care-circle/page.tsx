import { AppShell } from "@/components/app-shell";
import { CareCircleManager } from "@/components/care-circle-manager";
import {
  listInvitationsForPatient,
  listPatientConnections,
} from "@/lib/db/medic-data";
import { requireRole } from "@/lib/auth/dal";

export default async function PatientCareCirclePage() {
  const user = await requireRole("patient");
  const [connections, invitations] = await Promise.all([
    listPatientConnections(user.userId),
    listInvitationsForPatient(user.userId),
  ]);

  return (
    <AppShell
      user={user}
      title="Care Circle"
      description="Generate invite codes, deep links, and QR shares, approve pending requests, and review who can access the patient profile."
      links={[
        { href: "/patient/dashboard", label: "Home" },
        { href: "/patient/medications", label: "Medications" },
        { href: "/profile", label: "Profile" },
      ]}
    >
      <CareCircleManager
        connections={connections}
        invitations={invitations}
        patientUserId={user.userId}
      />
    </AppShell>
  );
}
