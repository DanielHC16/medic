import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { CareAccessStatusPanel } from "@/components/care-access-status-panel";
import { MedicationManager } from "@/components/medication-manager";
import { WellnessManager } from "@/components/wellness-manager";
import { formatDateTime } from "@/lib/display";
import { requireRole } from "@/lib/auth/dal";
import {
  getActivitySummary,
  getCareMemberDashboardData,
  getMedicationAdherenceSummary,
  listActivityLogsForPatient,
  listMedicationLogsForPatient,
} from "@/lib/db/medic-data";

type CaregiverMonitoringPageProps = {
  searchParams: Promise<{
    patientId?: string;
  }>;
};

export default async function CaregiverMonitoringPage({
  searchParams,
}: CaregiverMonitoringPageProps) {
  const user = await requireRole("caregiver");
  const resolvedSearchParams = await searchParams;
  const dashboard = await getCareMemberDashboardData({
    patientUserId: resolvedSearchParams.patientId ?? null,
    userId: user.userId,
  });

  if (!dashboard) {
    return null;
  }

  const selectedPatient = dashboard.selectedPatient;
  const selectedPatientId = selectedPatient?.user.userId ?? null;
  const [medicationSummary, activitySummary, medicationLogs, activityLogs] =
    selectedPatientId
      ? await Promise.all([
          getMedicationAdherenceSummary(selectedPatientId),
          getActivitySummary(selectedPatientId),
          listMedicationLogsForPatient(selectedPatientId, 8),
          listActivityLogsForPatient(selectedPatientId, 8),
        ])
      : [null, null, [], []];

  return (
    <AppShell
      user={user}
      title="Monitoring"
      description="Review one linked patient at a time, follow medication adherence, and manage routines or appointments from the caregiver side."
      links={[
        { href: "/caregiver/dashboard", label: "Dashboard" },
        { href: "/caregiver/profile", label: "Profile" },
        { href: "/join", label: "Join a patient" },
      ]}
    >
      {dashboard.linkedPatients.length > 1 ? (
        <section className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Patient switcher
          </h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {dashboard.linkedPatients.map((patient) => (
              <Link
                key={patient.relationshipId}
                href={`/caregiver/monitoring?patientId=${patient.patientUserId}`}
                className="medic-button medic-button-soft text-sm"
              >
                {patient.patientDisplayName} / {patient.relationshipStatus}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {!selectedPatient || !selectedPatientId || !medicationSummary || !activitySummary ? (
        <CareAccessStatusPanel
          linkedPatients={dashboard.linkedPatients}
          role="caregiver"
        />
      ) : (
        <div className="grid gap-6">
          <section className="grid gap-4 md:grid-cols-4">
            <MetricCard
              label="Patient"
              value={`${selectedPatient.user.firstName} ${selectedPatient.user.lastName}`}
            />
            <MetricCard
              label="Taken today"
              value={`${medicationSummary.takenToday}/${medicationSummary.dueToday}`}
            />
            <MetricCard
              label="Missed today"
              value={String(medicationSummary.missedToday)}
            />
            <MetricCard
              label="Completed routines"
              value={String(activitySummary.completedToday)}
            />
          </section>

          <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <article className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
              <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                Attention items
              </h2>
              <div className="mt-4 grid gap-4">
                <AlertCard
                  title="Pending care-circle approvals"
                  detail={`${selectedPatient.careCircle.pendingRequests} requests waiting`}
                />
                <AlertCard
                  title="Next appointment"
                  detail={
                    selectedPatient.appointments[0]
                      ? `${selectedPatient.appointments[0].title} / ${formatDateTime(
                          selectedPatient.appointments[0].appointmentAt,
                        )}`
                      : "No upcoming appointments"
                  }
                />
                <AlertCard
                  title="Latest medication event"
                  detail={
                    medicationLogs[0]
                      ? `${medicationLogs[0].medicationName} / ${medicationLogs[0].status.replace(
                          /_/g,
                          " ",
                        )}`
                      : "No medication logs yet"
                  }
                />
              </div>
            </article>

            <article className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
              <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                Recent routine activity
              </h2>
              <div className="mt-4 grid gap-4">
                {activityLogs.length === 0 ? (
                  <p className="rounded-2xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
                    No routine activity has been logged yet.
                  </p>
                ) : (
                  activityLogs.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
                    >
                      <p className="text-base font-semibold text-[var(--foreground)]">
                        {item.activityTitle}
                      </p>
                      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                        {item.completionStatus.replace(/_/g, " ")} /{" "}
                        {formatDateTime(item.completedAt || item.createdAt)}
                      </p>
                    </article>
                  ))
                )}
              </div>
            </article>
          </section>

          <MedicationManager
            canManage
            items={selectedPatient.medications}
            logs={medicationLogs}
            patientUserId={selectedPatientId}
            summary={medicationSummary}
          />

          <WellnessManager
            activityLogs={activityLogs}
            activityPlans={selectedPatient.activityPlans}
            activitySummary={activitySummary}
            appointments={selectedPatient.appointments}
            canManage
            patientUserId={selectedPatientId}
          />
        </div>
      )}
    </AppShell>
  );
}

function MetricCard(props: { label: string; value: string }) {
  return (
    <article className="rounded-[1.75rem] border border-black/5 bg-white/90 p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-primary)]">
        {props.label}
      </p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        {props.value}
      </p>
    </article>
  );
}

function AlertCard(props: { detail: string; title: string }) {
  return (
    <article className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
      <p className="text-base font-semibold text-[var(--foreground)]">{props.title}</p>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{props.detail}</p>
    </article>
  );
}
