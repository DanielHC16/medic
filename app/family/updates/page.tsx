import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { CareAccessStatusPanel } from "@/components/care-access-status-panel";
import { formatDateTime } from "@/lib/display";
import { requireRole } from "@/lib/auth/dal";
import {
  getActivitySummary,
  getCareMemberDashboardData,
  getMedicationAdherenceSummary,
  listActivityLogsForPatient,
  listMedicationLogsForPatient,
} from "@/lib/db/medic-data";

type FamilyUpdatesPageProps = {
  searchParams: Promise<{
    patientId?: string;
  }>;
};

export default async function FamilyUpdatesPage({
  searchParams,
}: FamilyUpdatesPageProps) {
  const user = await requireRole("family_member");
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
      title="Updates"
      description="A lighter family view with the patient's latest medication, routine, and appointment activity."
      links={[
        { href: "/family/dashboard", label: "Dashboard" },
        { href: "/family/profile", label: "Profile" },
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
                href={`/family/updates?patientId=${patient.patientUserId}`}
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
          role="family_member"
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
              label="Upcoming appointments"
              value={String(selectedPatient.appointments.length)}
            />
            <MetricCard
              label="Completed routines"
              value={String(activitySummary.completedToday)}
            />
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <article className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
              <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                Medication updates
              </h2>
              <div className="mt-4 grid gap-4">
                {medicationLogs.length === 0 ? (
                  <p className="rounded-2xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
                    No medication activity has been recorded yet.
                  </p>
                ) : (
                  medicationLogs.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
                    >
                      <p className="text-base font-semibold text-[var(--foreground)]">
                        {item.medicationName}
                      </p>
                      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                        {item.status.replace(/_/g, " ")} / {formatDateTime(item.takenAt || item.createdAt)}
                      </p>
                    </article>
                  ))
                )}
              </div>
            </article>

            <article className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
              <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                Routine updates
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

          <section className="grid gap-6 lg:grid-cols-2">
            <article className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
              <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                Upcoming appointments
              </h2>
              <div className="mt-4 grid gap-4">
                {selectedPatient.appointments.length === 0 ? (
                  <p className="rounded-2xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
                    No appointments scheduled yet.
                  </p>
                ) : (
                  selectedPatient.appointments.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
                    >
                      <p className="text-base font-semibold text-[var(--foreground)]">
                        {item.title}
                      </p>
                      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                        {formatDateTime(item.appointmentAt)}
                      </p>
                      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                        {item.providerName || "Provider pending"} /{" "}
                        {item.location || "Location pending"}
                      </p>
                    </article>
                  ))
                )}
              </div>
            </article>

            <article className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
              <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                Care-circle snapshot
              </h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <MetricCard
                  label="Active caregivers"
                  value={String(selectedPatient.careCircle.activeCaregivers)}
                />
                <MetricCard
                  label="Active family"
                  value={String(selectedPatient.careCircle.activeFamilyMembers)}
                />
                <MetricCard
                  label="Pending requests"
                  value={String(selectedPatient.careCircle.pendingRequests)}
                />
                <MetricCard
                  label="Missed meds today"
                  value={String(medicationSummary.missedToday)}
                />
              </div>
            </article>
          </section>
        </div>
      )}
    </AppShell>
  );
}

function MetricCard(props: { label: string; value: string }) {
  return (
    <article className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">
        {props.label}
      </p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        {props.value}
      </p>
    </article>
  );
}
