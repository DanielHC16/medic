import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { CareAccessStatusPanel } from "@/components/care-access-status-panel";
import { formatDateTime } from "@/lib/display";
import { getCareMemberDashboardData } from "@/lib/db/medic-data";
import { requireRole } from "@/lib/auth/dal";

type FamilyDashboardPageProps = {
  searchParams: Promise<{
    patientId?: string;
  }>;
};

export default async function FamilyDashboardPage({
  searchParams,
}: FamilyDashboardPageProps) {
  const user = await requireRole("family_member");
  const resolvedSearchParams = await searchParams;
  const dashboard = await getCareMemberDashboardData({
    patientUserId: resolvedSearchParams.patientId ?? null,
    userId: user.userId,
  });

  if (!dashboard) {
    return null;
  }

  return (
    <AppShell
      user={user}
      title="Family Dashboard"
      description="Stay informed with patient updates, appointment visibility, and a lighter monitoring view."
      links={[
        { href: "/family/updates", label: "Updates" },
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
                href={`/family/dashboard?patientId=${patient.patientUserId}`}
                className="medic-button medic-button-soft text-sm"
              >
                {patient.patientDisplayName} / {patient.relationshipStatus}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {!dashboard.selectedPatient ? (
        <CareAccessStatusPanel
          linkedPatients={dashboard.linkedPatients}
          role="family_member"
        />
      ) : (
        <div className="grid gap-6">
          <section className="grid gap-6 md:grid-cols-3">
            <MetricCard
              title="Taken today"
              value={`${dashboard.selectedPatient.medicationSummary.takenToday}/${dashboard.selectedPatient.medicationSummary.dueToday}`}
            />
            <MetricCard
              title="Active caregivers"
              value={String(dashboard.selectedPatient.careCircle.activeCaregivers)}
            />
            <MetricCard
              title="Upcoming appointments"
              value={String(dashboard.selectedPatient.appointments.length)}
            />
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
              <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                Patient updates
              </h2>
              <div className="mt-4 grid gap-4">
                {dashboard.selectedPatient.medications.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
                  >
                    <p className="text-lg font-semibold text-[var(--foreground)]">
                      {item.name}
                    </p>
                    <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                      Latest log: {item.latestLogStatus || "none"}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
              <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                Appointments
              </h2>
              <div className="mt-4 grid gap-4">
                {dashboard.selectedPatient.appointments.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
                  >
                    <p className="text-lg font-semibold text-[var(--foreground)]">
                      {item.title}
                    </p>
                    <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                      {formatDateTime(item.appointmentAt)}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}

function MetricCard(props: { title: string; value: string }) {
  return (
    <article className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--color-primary)]">
        {props.title}
      </p>
      <p className="mt-4 text-4xl font-semibold tracking-tight text-[var(--foreground)]">
        {props.value}
      </p>
    </article>
  );
}
