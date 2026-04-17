import Link from "next/link";
import {
  type LucideIcon,
  Home,
  BellRing,
  UserPlus,
  Heart,
  UserCircle,
} from "lucide-react";

import { CareAccessStatusPanel } from "@/components/care-access-status-panel";
import { MedicationReminderPanel } from "@/components/medication-reminder-panel";
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
    <div className="min-h-screen bg-[#Eef1f4] pb-32 font-sans">
      <main className="px-6 pt-10">
        {dashboard.activeLinkedPatients.length > 1 ? (
          <section className="mb-6 rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold tracking-tight text-gray-900">
              Patient switcher
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {dashboard.activeLinkedPatients.map((patient) => (
                <Link
                  key={patient.relationshipId}
                  href={`/family/updates?patientId=${patient.patientUserId}`}
                  className="rounded-full bg-[#Eef1f4] px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
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

            <MedicationReminderPanel
              contactMethod={user.preferences.preferredContactMethod}
              logs={medicationLogs}
              medications={selectedPatient.medications}
              patientDisplayName={`${selectedPatient.user.firstName} ${selectedPatient.user.lastName}`}
              patientUserId={selectedPatientId}
              role={user.role}
              timeFormat={user.preferences.timeFormat}
              viewerDisplayName={`${user.firstName} ${user.lastName}`}
            />

            <section className="grid gap-6 lg:grid-cols-2">
              <article className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold tracking-tight text-gray-900">
                  Medication updates
                </h2>
                <div className="mt-4 grid gap-4">
                  {medicationLogs.length === 0 ? (
                    <p className="rounded-2xl bg-[#Eef1f4] px-4 py-3 text-sm text-gray-600">
                      No medication activity recorded yet.
                    </p>
                  ) : (
                    medicationLogs.map((item) => (
                      <article
                        key={item.id}
                        className="rounded-3xl border border-black/5 bg-[#Eef1f4] p-4"
                      >
                        <p className="text-base font-semibold text-gray-900">
                          {item.medicationName}
                        </p>
                        <p className="mt-2 text-sm text-gray-600 capitalize">
                          {item.status.replace(/_/g, " ")} /{" "}
                          {formatDateTime(item.takenAt || item.createdAt)}
                        </p>
                      </article>
                    ))
                  )}
                </div>
              </article>

              <article className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold tracking-tight text-gray-900">
                  Routine updates
                </h2>
                <div className="mt-4 grid gap-4">
                  {activityLogs.length === 0 ? (
                    <p className="rounded-2xl bg-[#Eef1f4] px-4 py-3 text-sm text-gray-600">
                      No routine activity logged yet.
                    </p>
                  ) : (
                    activityLogs.map((item) => (
                      <article
                        key={item.id}
                        className="rounded-3xl border border-black/5 bg-[#Eef1f4] p-4"
                      >
                        <p className="text-base font-semibold text-gray-900">
                          {item.activityTitle}
                        </p>
                        <p className="mt-2 text-sm text-gray-600 capitalize">
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
              <article className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold tracking-tight text-gray-900">
                  Upcoming appointments
                </h2>
                <div className="mt-4 grid gap-4">
                  {selectedPatient.appointments.length === 0 ? (
                    <p className="rounded-2xl bg-[#Eef1f4] px-4 py-3 text-sm text-gray-600">
                      No appointments scheduled.
                    </p>
                  ) : (
                    selectedPatient.appointments.map((item) => (
                      <article
                        key={item.id}
                        className="rounded-3xl border border-black/5 bg-[#Eef1f4] p-4"
                      >
                        <p className="text-base font-semibold text-gray-900">
                          {item.title}
                        </p>
                        <p className="mt-2 text-sm text-gray-600">
                          {formatDateTime(item.appointmentAt)}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {item.providerName || "Provider pending"} /{" "}
                          {item.location || "Location pending"}
                        </p>
                      </article>
                    ))
                  )}
                </div>
              </article>

              <article className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold tracking-tight text-gray-900">
                  Care-circle snapshot
                </h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <InnerMetricCard
                    label="Active caregivers"
                    value={String(selectedPatient.careCircle.activeCaregivers)}
                  />
                  <InnerMetricCard
                    label="Active family"
                    value={String(selectedPatient.careCircle.activeFamilyMembers)}
                  />
                  <InnerMetricCard
                    label="Pending requests"
                    value={String(selectedPatient.careCircle.pendingRequests)}
                  />
                  <InnerMetricCard
                    label="Missed meds today"
                    value={String(medicationSummary.missedToday)}
                  />
                </div>
              </article>
            </section>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-[100] flex items-center justify-around rounded-t-[2.5rem] bg-white px-6 py-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-gray-100">
        <NavIcon href="/family/dashboard" icon={Home} isActive={false} />
        <NavIcon href="/family/updates" icon={BellRing} isActive />
        <NavIcon href="/join" icon={UserPlus} isActive={false} />
        <NavIcon href="/wellness" icon={Heart} isActive={false} />
        <NavIcon href="/family/profile" icon={UserCircle} isActive={false} />
      </nav>
    </div>
  );
}

function NavIcon({
  href,
  icon: Icon,
  isActive,
}: {
  href: string;
  icon: LucideIcon;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={`relative flex h-14 w-14 items-center justify-center transition-all duration-300 ${
        isActive
          ? "rounded-full bg-[#5C8B6B] shadow-lg scale-110"
          : "rounded-full bg-transparent hover:bg-gray-50"
      }`}
    >
      <Icon
        size={24}
        color={isActive ? "#FFFFFF" : "#5C8B6B"}
        strokeWidth={isActive ? 2.5 : 2}
        className="block"
      />
    </Link>
  );
}

function MetricCard(props: { label: string; value: string }) {
  return (
    <article className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5C8B6B]">
        {props.label}
      </p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
        {props.value}
      </p>
    </article>
  );
}

function InnerMetricCard(props: { label: string; value: string }) {
  return (
    <article className="rounded-3xl border border-black/5 bg-[#Eef1f4] p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#5C8B6B]">
        {props.label}
      </p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
        {props.value}
      </p>
    </article>
  );
}
