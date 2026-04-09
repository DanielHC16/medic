import { AppShell } from "@/components/app-shell";
import { ProfilePageContent } from "@/components/profile-page-content";
import { requireRole } from "@/lib/auth/dal";
import { listLinkedPatientsForMember } from "@/lib/db/medic-data";

export default async function FamilyProfilePage() {
  const user = await requireRole("family_member");
  const records = await listLinkedPatientsForMember(user.userId);

  return (
    <AppShell
      user={user}
      title="Family Profile"
      description="Update your family-member account details and review which patient records you can currently view."
      links={[
        { href: "/family/dashboard", label: "Dashboard" },
        { href: "/family/updates", label: "Updates" },
        { href: "/join", label: "Join a patient" },
      ]}
    >
      <ProfilePageContent
        heading="Family account"
        records={records}
        roleNotes={[
          "Family access is designed to stay lighter and more update-focused than caregiver access.",
          "Use the Updates page to review recent medication, routine, and appointment activity.",
        ]}
        shortcuts={[
          { href: "/family/updates", label: "Open Updates" },
          { href: "/join", label: "Join another patient" },
        ]}
        user={user}
      />
    </AppShell>
  );
}
