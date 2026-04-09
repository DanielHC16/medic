import { AppShell } from "@/components/app-shell";
import { ProfilePageContent } from "@/components/profile-page-content";
import { requireCurrentUser } from "@/lib/auth/dal";
import {
  listLinkedPatientsForMember,
  listPatientConnections,
} from "@/lib/db/medic-data";

export default async function ProfilePage() {
  const user = await requireCurrentUser();
  const records =
    user.role === "patient"
      ? await listPatientConnections(user.userId)
      : await listLinkedPatientsForMember(user.userId);

  const shortcuts =
    user.role === "patient"
      ? [
          { href: "/patient/health-info", label: "Health Info" },
          { href: "/patient/settings", label: "Settings" },
          { href: "/patient/alerts", label: "Alerts" },
        ]
      : user.role === "caregiver"
        ? [
            { href: "/caregiver/monitoring", label: "Monitoring" },
            { href: "/join", label: "Join a patient" },
          ]
        : [
            { href: "/family/updates", label: "Updates" },
            { href: "/join", label: "Join a patient" },
          ];

  return (
    <AppShell
      user={user}
      title="Profile"
      description="Review and update your account details, then jump into the right role-specific sections."
      links={[
        {
          href:
            user.role === "patient"
              ? "/patient/dashboard"
              : `/${user.role === "caregiver" ? "caregiver" : "family"}/dashboard`,
          label: "Dashboard",
        },
      ]}
    >
      <ProfilePageContent
        heading="Account profile"
        records={records}
        shortcuts={shortcuts}
        user={user}
      />
    </AppShell>
  );
}
