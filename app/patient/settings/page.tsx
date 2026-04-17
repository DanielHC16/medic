import { AppShell } from "@/components/app-shell";
import { SettingsManager } from "@/components/settings-manager";
import { requireRole } from "@/lib/auth/dal";

export default async function PatientSettingsPage() {
  const user = await requireRole("patient");

  return (
    <AppShell
      user={user}
      title="Settings"
      description="Adjust patient-facing display and reminder preferences for the current MEDIC account."
      patientBottomNavActive="profile"
      links={[
        { href: "/patient/dashboard", label: "Home" },
        { href: "/patient/health-info", label: "Health Info" },
        { href: "/patient/alerts", label: "Alerts" },
      ]}
    >
      <SettingsManager preferences={user.preferences} />
    </AppShell>
  );
}
