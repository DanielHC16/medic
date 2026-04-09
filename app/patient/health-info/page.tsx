import { AppShell } from "@/components/app-shell";
import { PatientHealthManager } from "@/components/patient-health-manager";
import { getPatientProfile } from "@/lib/db/medic-data";
import { requireRole } from "@/lib/auth/dal";

export default async function PatientHealthInfoPage() {
  const user = await requireRole("patient");
  const profile = await getPatientProfile(user.userId);

  return (
    <AppShell
      user={user}
      title="Health Info"
      description="Review and update the patient's core health information, assistance level, and emergency notes."
      links={[
        { href: "/patient/dashboard", label: "Home" },
        { href: "/patient/alerts", label: "Alerts" },
        { href: "/patient/settings", label: "Settings" },
      ]}
    >
      <PatientHealthManager profile={profile} />
    </AppShell>
  );
}
