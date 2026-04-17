import Link from "next/link";
import { type LucideIcon, Home, Activity, UserPlus, Heart, User } from "lucide-react";

import { CareAccessStatusPanel } from "@/components/care-access-status-panel";
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
    <div className="min-h-screen bg-[#Eef1f4] pb-32 font-sans">
      <main className="px-6 pt-10">
        {/* --- PATIENT SWITCHER --- */}
        {dashboard.activeLinkedPatients.length > 1 ? (
          <section className="mb-6 rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
            <h2 className="text-xl font-semibold tracking-tight text-gray-900">
              Patient switcher
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {dashboard.activeLinkedPatients.map((patient) => (
                <Link
                  key={patient.relationshipId}
                  href={`/caregiver/dashboard?patientId=${patient.patientUserId}`}
                  className="rounded-full bg-[#Eef1f4] px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                >
                  {patient.patientDisplayName} / {patient.relationshipStatus}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* --- DASHBOARD METRICS & MEDICATION --- */}
        {!dashboard.selectedPatient ? (
          <CareAccessStatusPanel
            linkedPatients={dashboard.linkedPatients}
            role="caregiver"
          />
        ) : (
          <div className="grid gap-6">
            <section className="grid gap-4 md:grid-cols-3">
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
      </main>

      {/* --- BOTTOM NAVIGATION BAR --- */}
      <nav className="fixed bottom-0 left-0 right-0 z-[100] flex items-center justify-around rounded-t-[2.5rem] bg-white px-4 py-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-gray-100">
        
        <NavIcon 
          href="/caregiver/dashboard" 
          icon={Home} 
          isActive 
        />
        
        <NavIcon 
          href="/caregiver/monitoring" 
          icon={Activity} 
          isActive={false} 
        />

        <NavIcon 
          href="/join" 
          icon={UserPlus} 
          isActive={false} 
        />

        <NavIcon 
          href="/wellness" 
          icon={Heart} 
          isActive={false} 
        />

        <NavIcon 
          href="/caregiver/profile" 
          icon={User} 
          isActive={false} 
        />
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

function MetricCard(props: { title: string; value: string }) {
  return (
    <article className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5C8B6B]">
        {props.title}
      </p>
      <p className="mt-3 text-4xl font-bold tracking-tight text-gray-900">
        {props.value}
      </p>
    </article>
  );
}
