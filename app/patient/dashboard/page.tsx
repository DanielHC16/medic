import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { getPatientDashboardData, listPatientConnections } from "@/lib/db/medic-data";
import { requireRole } from "@/lib/auth/dal";

export default async function PatientDashboardPage() {
  const user = await requireRole("patient");
  const [dashboard, connections] = await Promise.all([
    getPatientDashboardData(user.userId),
    listPatientConnections(user.userId),
  ]);

  if (!dashboard) {
    return null;
  }

  return (
    <AppShell
      user={user}
      title="Patient Home"
      description="Your main overview for medications, routines, appointments, and care-circle access."
      links={[
        { href: "/patient/medications", label: "Medications" },
        { href: "/patient/schedule", label: "Schedule" },
        { href: "/patient/care-circle", label: "Care Circle" },
        { href: "/wellness", label: "Wellness" },
        { href: "/profile", label: "Profile" },
      ]}
    >
      <section className="grid gap-6 md:grid-cols-3">
        <SummaryCard
          title="Taken today"
          value={`${dashboard.medicationSummary.takenToday}/${dashboard.medicationSummary.dueToday}`}
          detail="Medication adherence today"
        />
        <SummaryCard
          title="Connected caregivers"
          value={String(dashboard.careCircle.activeCaregivers)}
          detail="People managing reminders"
        />
        <SummaryCard
          title="Pending requests"
          value={String(dashboard.careCircle.pendingRequests)}
          detail="Care-circle approvals waiting"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Active Medications
          </h2>
          <div className="mt-4 grid gap-4">
            {dashboard.medications.map((item) => (
              <article
                key={item.id}
                className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
              >
                <p className="text-lg font-semibold text-[var(--foreground)]">
                  {item.name}
                </p>
                <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                  {item.dosageValue}
                  {item.dosageUnit ? ` ${item.dosageUnit}` : ""} · {item.form}
                </p>
                <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                  {item.scheduleTimes.join(", ") || "No times yet"}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="grid gap-6">
          <div className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
              Upcoming Appointments
            </h2>
            <div className="mt-4 grid gap-4">
              {dashboard.appointments.length === 0 ? (
                <p className="rounded-2xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
                  No upcoming appointments.
                </p>
              ) : (
                dashboard.appointments.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
                  >
                    <p className="text-lg font-semibold text-[var(--foreground)]">
                      {item.title}
                    </p>
                    <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                      {item.appointmentAt}
                    </p>
                    <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                      {item.providerName || "Provider pending"} ·{" "}
                      {item.location || "Location pending"}
                    </p>
                  </article>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                Care Circle Snapshot
              </h2>
              <Link
                href="/patient/care-circle"
                className="text-sm font-medium text-[var(--color-primary)]"
              >
                Manage
              </Link>
            </div>
            <div className="mt-4 grid gap-4">
              {connections.length === 0 ? (
                <p className="rounded-2xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
                  No one is linked yet.
                </p>
              ) : (
                connections.map((connection) => (
                  <article
                    key={connection.id}
                    className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
                  >
                    <p className="text-lg font-semibold text-[var(--foreground)]">
                      {connection.relatedDisplayName}
                    </p>
                    <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                      {connection.memberRole} · {connection.relationshipStatus}
                    </p>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function SummaryCard(props: { detail: string; title: string; value: string }) {
  return (
    <article className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--color-primary)]">
        {props.title}
      </p>
      <p className="mt-4 text-4xl font-semibold tracking-tight text-[var(--foreground)]">
        {props.value}
      </p>
      <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">{props.detail}</p>
    </article>
  );
}
