import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { JoinPatientPanel } from "@/components/care-circle-manager";
import { MedicationManager } from "@/components/medication-manager";
import { getCareMemberDashboardData } from "@/lib/db/medic-data";
import { requireRole } from "@/lib/auth/dal";

type CaregiverDashboardPageProps = {
  searchParams: Promise<{
    patientId?: string;
  }>;
};

export default async function CaregiverDashboardPage({
  searchParams,
}: CaregiverDashboardPageProps) {
  const user = await requireRole("caregiver");
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
      title="Caregiver Dashboard"
      description="Monitor linked patients, view medication status, and manage routines or appointments."
      links={[
        { href: "/join", label: "Join a patient" },
        { href: "/profile", label: "Profile" },
        { href: "/wellness", label: "Wellness" },
      ]}
    >
      {dashboard.linkedPatients.length > 1 ? (
        <section className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
            Patient Switcher
          </h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {dashboard.linkedPatients.map((patient) => (
              <Link
                key={patient.relationshipId}
                href={`/caregiver/dashboard?patientId=${patient.patientUserId}`}
                className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--foreground)]"
              >
                {patient.patientDisplayName} · {patient.relationshipStatus}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {!dashboard.selectedPatient ? (
        <JoinPatientPanel role="caregiver" />
      ) : (
        <div className="grid gap-6">
          <section className="grid gap-6 md:grid-cols-3">
            <MetricCard
              title="Taken today"
              value={`${dashboard.selectedPatient.medicationSummary.takenToday}/${dashboard.selectedPatient.medicationSummary.dueToday}`}
            />
            <MetricCard
              title="Active medications"
              value={String(dashboard.selectedPatient.medicationSummary.activeMedications)}
            />
            <MetricCard
              title="Pending approvals"
              value={String(dashboard.selectedPatient.careCircle.pendingRequests)}
            />
          </section>

          <MedicationManager
            canManage
            items={dashboard.selectedPatient.medications}
            patientUserId={dashboard.selectedPatient.user.userId}
          />
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
