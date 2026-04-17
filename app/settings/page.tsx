import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { SettingsManager } from "@/components/settings-manager";
import {
  getDefaultRouteForRole,
  getProfileRouteForRole,
  requireCurrentUser,
} from "@/lib/auth/dal";

export default async function SettingsPage() {
  const user = await requireCurrentUser();

  if (user.role === "patient") {
    redirect("/patient/settings");
  }

  const links =
    user.role === "caregiver"
      ? [
          { href: getDefaultRouteForRole(user), label: "Dashboard" },
          { href: "/caregiver/monitoring", label: "Monitoring" },
          { href: getProfileRouteForRole(user.role), label: "Profile" },
        ]
      : [
          { href: getDefaultRouteForRole(user), label: "Dashboard" },
          { href: "/family/updates", label: "Updates" },
          { href: getProfileRouteForRole(user.role), label: "Profile" },
        ];

  return (
    <AppShell
      user={user}
      title="Settings"
      description="Adjust account preferences so updates, reminders, and accessibility choices stay consistent across MEDIC."
      links={links}
    >
      <SettingsManager preferences={user.preferences} />
    </AppShell>
  );
}
