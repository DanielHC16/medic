import { AppShell } from "@/components/app-shell";
import { WellnessManager } from "@/components/wellness-manager";
import { canManagePatientData, requirePatientScope } from "@/lib/auth/dal";
import {
  getActivitySummary,
  listActivityLogsForPatient,
  listActivityPlansForPatient,
  listAppointmentsForPatient,
} from "@/lib/db/medic-data";

type WellnessPageProps = {
  searchParams: Promise<{
    patientId?: string;
  }>;
};

export default async function WellnessPage({ searchParams }: WellnessPageProps) {
  const resolvedSearchParams = await searchParams;
  const scope = await requirePatientScope(resolvedSearchParams.patientId ?? null);
  const dashboardHref =
    scope.user.role === "patient"
      ? "/patient/dashboard"
      : `/${scope.user.role === "caregiver" ? "caregiver" : "family"}/dashboard${
          scope.patientUserId ? `?patientId=${scope.patientUserId}` : ""
        }`;

  if (!scope.patientUserId) {
    return (
      <AppShell
        user={scope.user}
        title="Wellness"
        description="Connect to a patient first to manage or review routines and appointments."
        links={[
          {
            href: scope.user.role === "caregiver" ? "/caregiver/dashboard" : "/family/dashboard",
            label: "Back to dashboard",
          },
        ]}
      >
        <section className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
          <p className="text-base text-[var(--color-muted-foreground)]">
            No linked patient is available yet.
          </p>
        </section>
      </AppShell>
    );
  }

  const [activityPlans, appointments, activityLogs, activitySummary] = await Promise.all([
    listActivityPlansForPatient(scope.patientUserId, { includeInactive: true }),
    listAppointmentsForPatient(scope.patientUserId, { includeCancelled: true }),
    listActivityLogsForPatient(scope.patientUserId, 10),
    getActivitySummary(scope.patientUserId),
  ]);

  return (
    <AppShell
      user={scope.user}
      title="Wellness and Routines"
      description="Create or review activity routines and appointments linked to the current patient."
      links={[
        {
          href: dashboardHref,
          label: "Dashboard",
        },
        {
          href: scope.user.role === "patient" ? "/patient/schedule" : "/join",
          label: scope.user.role === "patient" ? "Schedule" : "Join another patient",
        },
      ]}
    >
      <WellnessManager
        activityLogs={activityLogs}
        activityPlans={activityPlans}
        activitySummary={activitySummary}
        appointments={appointments}
        canManage={canManagePatientData(scope.user.role)}
        patientUserId={scope.patientUserId}
      />
    </AppShell>
  );
}
