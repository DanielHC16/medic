import Link from "next/link";

import { CareAccessStatusPanel } from "@/components/care-access-status-panel";
import { CareMemberBottomNav } from "@/components/care-member-bottom-nav";
import { MedicationManager } from "@/components/medication-manager";
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

  if (!dashboard) return null;

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
        
        {/* --- PATIENT SWITCHER --- */}
        {dashboard.activeLinkedPatients.length > 1 && (
          <section className="mb-6 rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
            <h2 className="text-xl font-semibold tracking-tight text-gray-900">Patient switcher</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {dashboard.activeLinkedPatients.map((patient) => (
                <Link
                  key={patient.relationshipId}
                  href={`/caregiver/monitoring?patientId=${patient.patientUserId}`}
                  className="rounded-full bg-[#Eef1f4] px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                >
                  {patient.patientDisplayName} / {patient.relationshipStatus}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* --- MONITORING CONTENT --- */}
        {!selectedPatient || !selectedPatientId || !medicationSummary || !activitySummary ? (
          <CareAccessStatusPanel linkedPatients={dashboard.linkedPatients} role="caregiver" />
        ) : (
          <div className="grid gap-6">
            <section className="grid gap-4 md:grid-cols-4">
              <MetricCard label="Patient" value={`${selectedPatient.user.firstName}`} />
              <MetricCard label="Taken" value={`${medicationSummary.takenToday}/${medicationSummary.dueToday}`} />
              <MetricCard label="Missed" value={String(medicationSummary.missedToday)} />
              <MetricCard label="Routines" value={String(activitySummary.completedToday)} />
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <article className="rounded-[2rem] bg-white p-6 shadow-sm border border-black/5">
                <h2 className="text-xl font-bold tracking-tight text-gray-900">Attention items</h2>
                <div className="mt-4 grid gap-3">
                  <AlertCard title="Care-circle" detail={`${selectedPatient.careCircle.pendingRequests} pending`} />
                  <AlertCard 
                    title="Next appointment" 
                    detail={selectedPatient.appointments[0] ? selectedPatient.appointments[0].title : "None"} 
                  />
                </div>
              </article>

              <article className="rounded-[2rem] bg-white p-6 shadow-sm border border-black/5">
                <h2 className="text-xl font-bold tracking-tight text-gray-900">Recent routine</h2>
                <div className="mt-4 grid gap-3">
                  {activityLogs.slice(0, 2).map((item) => (
                    <AlertCard key={item.id} title={item.activityTitle} detail={formatDateTime(item.completedAt || item.createdAt)} />
                  ))}
                </div>
              </article>
            </section>

            <div className="space-y-6 rounded-[2.5rem] bg-white/40 p-2">
              <MedicationManager
                canManage
                contactMethod={user.preferences.preferredContactMethod}
                items={selectedPatient.medications}
                logs={medicationLogs}
                patientDisplayName={`${selectedPatient.user.firstName} ${selectedPatient.user.lastName}`}
                patientUserId={selectedPatientId}
                role={user.role}
                summary={medicationSummary}
                timeFormat={user.preferences.timeFormat}
                viewerDisplayName={`${user.firstName} ${user.lastName}`}
              />
            </div>
          </div>
        )}
      </main>

      <CareMemberBottomNav
        activeItem="activity"
        patientUserId={selectedPatientId}
        role="caregiver"
      />
    </div>
  );
}

function MetricCard(props: { label: string; value: string }) {
  return (
    <article className="rounded-[2rem] border border-black/5 bg-white p-5 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5C8B6B]">{props.label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">{props.value}</p>
    </article>
  );
}

function AlertCard(props: { detail: string; title: string }) {
  return (
    <article className="rounded-2xl bg-[#Eef1f4]/50 p-4 border border-black/5">
      <p className="text-sm font-bold text-gray-800">{props.title}</p>
      <p className="mt-1 text-xs text-gray-500">{props.detail}</p>
    </article>
  );
}
