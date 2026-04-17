import Link from "next/link";

import { CareAccessStatusPanel } from "@/components/care-access-status-panel";
import { CareMemberBottomNav } from "@/components/care-member-bottom-nav";
import { MedicationManager } from "@/components/medication-manager";
import { requireRole } from "@/lib/auth/dal";
import {
  getCareMemberDashboardData,
  getMedicationAdherenceSummary,
  listMedicationLogsForPatient,
} from "@/lib/db/medic-data";

type FamilyMedicationsPageProps = {
  searchParams: Promise<{
    patientId?: string;
  }>;
};

export default async function FamilyMedicationsPage({
  searchParams,
}: FamilyMedicationsPageProps) {
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
  const [summary, logs] = selectedPatientId
    ? await Promise.all([
        getMedicationAdherenceSummary(selectedPatientId),
        listMedicationLogsForPatient(selectedPatientId, 12),
      ])
    : [null, []];

  return (
    <div className="min-h-screen bg-[#Eef1f4] pb-32 font-sans">
      <main className="px-6 pt-10">
        <section className="mb-6 rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Medication overview
          </h1>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Review the linked patient&apos;s active medications and recent logs.
          </p>
          {dashboard.activeLinkedPatients.length > 1 ? (
            <div className="mt-4 flex flex-wrap gap-3">
              {dashboard.activeLinkedPatients.map((patient) => (
                <Link
                  key={patient.relationshipId}
                  href={`/family/medications?patientId=${patient.patientUserId}`}
                  className={`cg-patient-pill ${
                    patient.patientUserId === selectedPatientId
                      ? "cg-patient-pill-active"
                      : "cg-patient-pill-inactive"
                  }`}
                >
                  <span className="truncate">{patient.patientDisplayName}</span>
                </Link>
              ))}
            </div>
          ) : null}
        </section>

        {!selectedPatient || !selectedPatientId || !summary ? (
          <CareAccessStatusPanel linkedPatients={dashboard.linkedPatients} role="family_member" />
        ) : (
          <div className="space-y-6 rounded-[2.5rem] bg-white/40 p-2">
            <MedicationManager
              canManage={false}
              contactMethod={user.preferences.preferredContactMethod}
              items={selectedPatient.medications}
              logs={logs}
              patientDisplayName={`${selectedPatient.user.firstName} ${selectedPatient.user.lastName}`}
              patientUserId={selectedPatientId}
              role={user.role}
              summary={summary}
              timeFormat={user.preferences.timeFormat}
              viewerDisplayName={`${user.firstName} ${user.lastName}`}
            />
          </div>
        )}
      </main>

      <CareMemberBottomNav
        activeItem="medications"
        patientUserId={selectedPatientId}
        role="family_member"
      />
    </div>
  );
}
