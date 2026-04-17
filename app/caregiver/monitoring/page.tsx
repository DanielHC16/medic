import Link from "next/link";
import { type LucideIcon, Home, Activity, UserPlus, Heart, User } from "lucide-react";

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
              <WellnessManager
                activityLogs={activityLogs}
                activityPlans={selectedPatient.activityPlans}
                activitySummary={activitySummary}
                appointments={selectedPatient.appointments}
                canManage
                patientUserId={selectedPatientId}
              />
            </div>
          </div>
        )}
      </main>

      {/* --- BOTTOM NAVIGATION BAR --- */}
      <nav className="fixed bottom-0 left-0 right-0 z-[100] flex items-center justify-around rounded-t-[2.5rem] bg-white px-4 py-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-gray-100">
        <NavIcon href="/caregiver/dashboard" icon={Home} isActive={false} />
        <NavIcon href="/caregiver/monitoring" icon={Activity} isActive={true} />
        <NavIcon href="/join" icon={UserPlus} isActive={false} />
        <NavIcon href="/wellness" icon={Heart} isActive={false} />
        <NavIcon href="/caregiver/profile" icon={User} isActive={false} />
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
        isActive ? "rounded-full bg-[#5C8B6B] shadow-lg scale-110" : "rounded-full bg-transparent hover:bg-gray-50"
      }`}
    >
      <Icon size={24} color={isActive ? "#FFFFFF" : "#5C8B6B"} strokeWidth={isActive ? 2.5 : 2} />
    </Link>
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
