import { AppShell } from "@/components/app-shell";
import { formatDateTime } from "@/lib/display";
import { requireRole } from "@/lib/auth/dal";
import {
  getActivitySummary,
  getMedicationAdherenceSummary,
  listAppointmentsForPatient,
  listMedicationLogsForPatient,
  listPatientConnections,
} from "@/lib/db/medic-data";

type AlertItem = {
  detail: string;
  title: string;
  tone: "info" | "warning" | "urgent";
};

function getToneClasses(tone: AlertItem["tone"]) {
  switch (tone) {
    case "urgent":
      return "border-[rgba(217,123,123,0.4)] bg-[rgba(217,123,123,0.12)]";
    case "warning":
      return "border-[rgba(233,196,106,0.45)] bg-[rgba(233,196,106,0.14)]";
    default:
      return "border-[rgba(93,173,226,0.28)] bg-[rgba(93,173,226,0.1)]";
  }
}

export default async function PatientAlertsPage() {
  const user = await requireRole("patient");
  const [medicationSummary, activitySummary, appointments, medicationLogs, connections] =
    await Promise.all([
      getMedicationAdherenceSummary(user.userId),
      getActivitySummary(user.userId),
      listAppointmentsForPatient(user.userId),
      listMedicationLogsForPatient(user.userId, 8),
      listPatientConnections(user.userId),
    ]);

  const alerts: AlertItem[] = [];
  const nextAppointment = appointments[0] ?? null;

  if (medicationSummary.missedToday > 0) {
    alerts.push({
      detail: `${medicationSummary.missedToday} medication entries were marked missed today.`,
      title: "Medication attention needed",
      tone: "urgent",
    });
  }

  if (medicationSummary.skippedToday > 0) {
    alerts.push({
      detail: `${medicationSummary.skippedToday} medication entries were skipped today.`,
      title: "Skipped medication recorded",
      tone: "warning",
    });
  }

  const pendingConnections = connections.filter(
    (item) => item.relationshipStatus === "pending",
  ).length;

  if (pendingConnections > 0) {
    alerts.push({
      detail: `${pendingConnections} care-circle requests are waiting for your approval.`,
      title: "Pending care-circle requests",
      tone: "warning",
    });
  }

  const activeCaregivers = connections.filter(
    (item) => item.relationshipStatus === "active" && item.memberRole === "caregiver",
  ).length;

  if (activeCaregivers === 0) {
    alerts.push({
      detail: "No active caregiver is linked to this patient yet.",
      title: "Caregiver connection recommended",
      tone: "warning",
    });
  }

  if (activitySummary.missedToday > 0) {
    alerts.push({
      detail: `${activitySummary.missedToday} wellness routines were marked missed today.`,
      title: "Routine follow-up needed",
      tone: "warning",
    });
  }

  if (nextAppointment) {
    alerts.push({
      detail: `${nextAppointment.title} is scheduled for ${formatDateTime(
        nextAppointment.appointmentAt,
      )}.`,
      title: "Upcoming appointment",
      tone: "info",
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      detail: "No urgent issues are currently derived from medication, routine, or care-circle activity.",
      title: "No active alerts",
      tone: "info",
    });
  }

  return (
    <AppShell
      user={user}
      title="Alerts"
      description="A patient-facing alert summary generated from medication logs, routines, care-circle status, and appointments."
      links={[
        { href: "/patient/dashboard", label: "Home" },
        { href: "/patient/health-info", label: "Health Info" },
        { href: "/patient/settings", label: "Settings" },
      ]}
    >
      <section className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
        <article className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Alert feed
          </h2>
          <div className="mt-4 grid gap-4">
            {alerts.map((alert) => (
              <article
                key={`${alert.title}-${alert.detail}`}
                className={`rounded-3xl border p-4 ${getToneClasses(alert.tone)}`}
              >
                <p className="text-lg font-semibold text-[var(--foreground)]">
                  {alert.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted-foreground)]">
                  {alert.detail}
                </p>
              </article>
            ))}
          </div>
        </article>

        <div className="grid gap-6">
          <article className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              Today at a glance
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <SummaryCard
                label="Taken today"
                value={`${medicationSummary.takenToday}/${medicationSummary.dueToday}`}
              />
              <SummaryCard
                label="Missed today"
                value={String(medicationSummary.missedToday)}
              />
              <SummaryCard
                label="Skipped today"
                value={String(medicationSummary.skippedToday)}
              />
              <SummaryCard
                label="Routines missed"
                value={String(activitySummary.missedToday)}
              />
            </div>
          </article>

          <article className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              Latest medication activity
            </h2>
            <div className="mt-4 grid gap-4">
              {medicationLogs.length === 0 ? (
                <p className="rounded-2xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
                  No medication logs have been recorded yet.
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
        </div>
      </section>
    </AppShell>
  );
}

function SummaryCard(props: { label: string; value: string }) {
  return (
    <article className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">
        {props.label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
        {props.value}
      </p>
    </article>
  );
}
