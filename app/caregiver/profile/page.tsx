import { AppShell } from "@/components/app-shell";
import { ProfilePageContent } from "@/components/profile-page-content";
import { requireRole } from "@/lib/auth/dal";
import { listLinkedPatientsForMember } from "@/lib/db/medic-data";

export default async function CaregiverProfilePage() {
  const user = await requireRole("caregiver");
  const records = await listLinkedPatientsForMember(user.userId);

  return (
    <AppShell
      user={user}
      title="Caregiver Profile"
      description="Update your caregiver account details and review which patient records are currently linked."
      links={[
        { href: "/caregiver/dashboard", label: "Dashboard" },
        { href: "/caregiver/monitoring", label: "Monitoring" },
        { href: "/join", label: "Join a patient" },
      ]}
    >
      <ProfilePageContent
        heading="Caregiver account"
        records={records}
        roleNotes={[
          "Caregivers can manage medications, routines, and appointments for linked patients.",
          "Use the Monitoring page for the detailed patient-by-patient work area.",
        ]}
        shortcuts={[
          { href: "/caregiver/monitoring", label: "Open Monitoring" },
          { href: "/join", label: "Join another patient" },
        ]}
        user={user}
      />
    </AppShell>
  );
}
