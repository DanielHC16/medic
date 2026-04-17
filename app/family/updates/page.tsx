import Link from "next/link";
import { ChevronLeft, UserRound } from "lucide-react";

import { CareMemberBottomNav } from "@/components/care-member-bottom-nav";
import { FamilyUpdatesTabs } from "@/components/family-updates-tabs";
import { requireRole } from "@/lib/auth/dal";
import {
  getCareMemberDashboardData,
  listActivityLogsForPatient,
  listAppointmentsForPatient,
  listMedicationLogsForPatient,
} from "@/lib/db/medic-data";

type FamilyUpdatesPageProps = {
  searchParams: Promise<{
    patientId?: string;
  }>;
};

function getManilaDateKey(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
}

function toManilaTimeLabel(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    hour12: true,
    minute: "2-digit",
    timeZone: "Asia/Manila",
  });
}

export default async function FamilyUpdatesPage({ searchParams }: FamilyUpdatesPageProps) {
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

  const [medicationLogs, activityLogs, appointments] = selectedPatientId
    ? await Promise.all([
        listMedicationLogsForPatient(selectedPatientId, 30),
        listActivityLogsForPatient(selectedPatientId, 30),
        listAppointmentsForPatient(selectedPatientId, { includeCancelled: true }),
      ])
    : [[], [], []];

  const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });

  const medicationItems = medicationLogs.map((log) => {
    const dateKey =
      getManilaDateKey(log.takenAt) ??
      log.loggedForDate ??
      getManilaDateKey(log.scheduledFor) ??
      getManilaDateKey(log.createdAt);

    return {
      id: log.id,
      dateKey: dateKey ?? "",
      isToday: dateKey === todayKey,
      time: toManilaTimeLabel(log.takenAt ?? log.scheduledFor ?? log.createdAt),
      actor: log.recordedByDisplayName ?? "Someone",
      name: log.medicationName,
      status: log.status,
    };
  });

  const scheduleItems = appointments.map((appointment) => {
    const dateKey = getManilaDateKey(appointment.appointmentAt);

    return {
      id: appointment.id,
      dateKey: dateKey ?? "",
      isToday: dateKey === todayKey,
      time: toManilaTimeLabel(appointment.appointmentAt),
      title: appointment.title,
      provider: appointment.providerName ?? "",
      status: appointment.status,
    };
  });

  const activityItems = activityLogs.map((log) => {
    const dateKey =
      getManilaDateKey(log.completedAt) ??
      getManilaDateKey(log.scheduledFor) ??
      getManilaDateKey(log.createdAt);

    return {
      id: log.id,
      dateKey: dateKey ?? "",
      isToday: dateKey === todayKey,
      time: toManilaTimeLabel(log.completedAt ?? log.scheduledFor ?? log.createdAt),
      title: log.activityTitle,
      status: log.completionStatus,
    };
  });

  return (
    <main className="pd-page pb-24">
      <div className="mb-4">
        <Link
          href="/family/dashboard"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold !text-white"
          style={{ background: "#4A7C59" }}
        >
          <ChevronLeft className="w-4 h-4" /> BACK
        </Link>
      </div>

      <h1 className="pd-heading mb-4">Activity Log</h1>

      {dashboard.activeLinkedPatients.length > 0 ? (
        <div className="flex flex-wrap gap-2 mb-4">
          {dashboard.activeLinkedPatients.map((patient) => {
            const isActive = patient.patientUserId === selectedPatientId;

            return (
              <Link
                key={patient.relationshipId}
                href={`/family/updates?patientId=${patient.patientUserId}`}
                className={`cg-patient-pill ${
                  isActive ? "cg-patient-pill-active" : "cg-patient-pill-inactive"
                }`}
              >
                <div className="cg-patient-icon">
                  <UserRound className="w-4 h-4" />
                </div>
                <span className="truncate">{patient.patientDisplayName}</span>
              </Link>
            );
          })}
        </div>
      ) : null}

      {!selectedPatient ? (
        <div className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
          <p className="text-sm leading-6 text-gray-500">
            No active linked patient. Join a patient first to view updates.
          </p>
          <Link href="/family/join" className="medic-button medic-button-primary mt-4">
            Connect to a patient
          </Link>
        </div>
      ) : (
        <FamilyUpdatesTabs
          medicationItems={medicationItems}
          scheduleItems={scheduleItems}
          activityItems={activityItems}
        />
      )}

      <CareMemberBottomNav
        activeItem="activity"
        patientUserId={selectedPatientId}
        role="family_member"
      />
    </main>
  );
}
