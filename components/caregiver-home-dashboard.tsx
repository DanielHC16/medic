"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  CalendarDays,
  ChevronRight,
  MapPin,
  Pill,
  Stethoscope,
  Sun,
  UserRound,
  X,
} from "lucide-react";

import { AppointmentViewModal } from "@/components/appointment-view-modal";
import { CareMemberBottomNav } from "@/components/care-member-bottom-nav";
import { MedicationViewModal } from "@/components/medication-view-modal";
import { formatClockTime, formatStatusLabel } from "@/lib/display";
import {
  getMedicationIntervalHours,
  getNextReminderSlot,
} from "@/lib/medication-reminders";
import type {
  ActivitySummary,
  AppointmentRecord,
  CareMemberDashboardData,
  MedicationLogRecord,
  MedicationRecord,
  RoleSlug,
} from "@/lib/medic-types";

type SupportedCareRole = Extract<RoleSlug, "caregiver" | "family_member">;

const MANILA_TIMEZONE = "Asia/Manila";

type NextMedicationEntry = {
  medication: MedicationRecord;
  minutesUntil: number;
  timeLabel: string;
};

function getManilaNow() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: MANILA_TIMEZONE }));
}

function getManilaDateKey(date: Date) {
  return date.toLocaleDateString("en-CA", { timeZone: MANILA_TIMEZONE });
}

function getPatientName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

function getMedicationCountsForToday(
  medicationId: string,
  logs: MedicationLogRecord[],
  todayKey: string,
) {
  const relevantLogs = logs.filter(
    (log) => log.medicationId === medicationId && (log.loggedForDate || "") === todayKey,
  );

  return {
    missed: relevantLogs.filter((log) => log.status === "missed").length,
    taken: relevantLogs.filter((log) => log.status === "taken").length,
  };
}

function getNextMedicationEntry(
  medications: MedicationRecord[],
  logs: MedicationLogRecord[],
  now: Date,
): NextMedicationEntry | null {
  const activeMedications = medications.filter((medication) => medication.isActive);
  let nextEntry: NextMedicationEntry | null = null;

  for (const medication of activeMedications) {
    const nextSlot = getNextReminderSlot(medication, logs, now);

    if (!nextSlot) {
      continue;
    }

    const minutesUntil = Math.round((nextSlot.getTime() - now.getTime()) / 60000);

    if (!nextEntry || minutesUntil < nextEntry.minutesUntil) {
      nextEntry = {
        medication,
        minutesUntil,
        timeLabel: nextSlot.toLocaleTimeString("en-US", {
          hour: "numeric",
          hour12: true,
          minute: "2-digit",
          timeZone: MANILA_TIMEZONE,
        }),
      };
    }
  }

  return nextEntry;
}

function getUpcomingAppointment(appointments: AppointmentRecord[], now: Date) {
  return (
    appointments
      .filter((appointment) => {
        if (appointment.status === "cancelled") {
          return false;
        }

        const appointmentDate = new Date(appointment.appointmentAt);
        return !Number.isNaN(appointmentDate.getTime()) && appointmentDate >= now;
      })
      .sort(
        (left, right) =>
          new Date(left.appointmentAt).getTime() - new Date(right.appointmentAt).getTime(),
      )[0] ?? null
  );
}

function getAppointmentDayLabel(appointmentAt: string, now: Date) {
  const appointmentDate = new Date(appointmentAt);
  const todayLabel = now.toLocaleDateString("en-US", { timeZone: MANILA_TIMEZONE });
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const appointmentLabel = appointmentDate.toLocaleDateString("en-US", {
    timeZone: MANILA_TIMEZONE,
  });

  if (appointmentLabel === todayLabel) {
    return "Today";
  }

  if (
    appointmentLabel ===
    tomorrow.toLocaleDateString("en-US", { timeZone: MANILA_TIMEZONE })
  ) {
    return "Tomorrow";
  }

  return appointmentDate.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    timeZone: MANILA_TIMEZONE,
  });
}

function MedicationDonutChart(props: {
  missed: number;
  pending: number;
  taken: number;
  total: number;
}) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const safeTotal = Math.max(props.total, 1);
  const takenLength = (props.taken / safeTotal) * circumference;
  const missedLength = (props.missed / safeTotal) * circumference;
  const pendingLength = (props.pending / safeTotal) * circumference;

  return (
    <div className="relative h-[110px] w-[110px] flex-shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full">
        <g transform="rotate(-90 50 50)">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="16" />
          {takenLength > 0 ? (
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#4A7C59"
              strokeWidth="16"
              strokeDasharray={`${takenLength} ${circumference}`}
              strokeDashoffset={0}
            />
          ) : null}
          {missedLength > 0 ? (
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#D97B7B"
              strokeWidth="16"
              strokeDasharray={`${missedLength} ${circumference}`}
              strokeDashoffset={-takenLength}
            />
          ) : null}
          {pendingLength > 0 ? (
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#E9C46A"
              strokeWidth="16"
              strokeDasharray={`${pendingLength} ${circumference}`}
              strokeDashoffset={-(takenLength + missedLength)}
            />
          ) : null}
        </g>
      </svg>
    </div>
  );
}

function ActivityBarChart(props: {
  summary: ActivitySummary;
}) {
  const total = Math.max(props.summary.activePlans, 1);
  const done = Math.min(props.summary.completedToday, total);
  const missed = Math.min(props.summary.missedToday, Math.max(total - done, 0));
  const planned = Math.max(total - done - missed, 0);
  const bars = [
    { color: "#4A7C59", label: "Done", value: done },
    { color: "#E9C46A", label: "Planned", value: planned },
    { color: "#D97B7B", label: "Missed", value: missed },
  ];
  const maxValue = Math.max(...bars.map((bar) => bar.value), 1);

  return (
    <div className="flex w-full flex-1 flex-col">
      <div className="flex flex-1 items-end gap-3">
        {bars.map((bar) => (
          <div
            key={bar.label}
            className="flex h-full flex-1 flex-col items-center justify-end gap-1"
          >
            <span className="text-[13px] font-bold">{bar.value}</span>
            <div
              className="w-full rounded-t-lg"
              style={{
                background: bar.color,
                height: `${Math.max(6, (bar.value / maxValue) * 100)}%`,
              }}
            />
            <span className="text-[13px] font-semibold opacity-60">{bar.label}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-center text-[13px] opacity-50">
        {done} of {props.summary.activePlans} done
      </p>
    </div>
  );
}

export function CaregiverHomeDashboard(props: {
  dashboard: CareMemberDashboardData;
  role?: SupportedCareRole;
}) {
  const router = useRouter();
  const role: SupportedCareRole = props.role ?? "caregiver";
  const canManage = role === "caregiver";
  const dashboardBasePath =
    role === "caregiver" ? "/caregiver/dashboard" : "/family/dashboard";
  const profilePath = role === "caregiver" ? "/caregiver/profile" : "/family/profile";
  const joinPath = role === "caregiver" ? "/caregiver/join" : "/family/join";
  const medicationsBasePath =
    role === "caregiver" ? "/caregiver/medications" : "/family/medications";
  const activitiesBasePath =
    role === "caregiver" ? "/caregiver/wellness" : "/family/updates";
  const [message, setMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"alert" | "appointment" | null>(null);
  const [selectedMedication, setSelectedMedication] = useState<MedicationRecord | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentRecord | null>(null);
  const [progressDetail, setProgressDetail] = useState<
    "medications" | "activities" | null
  >(null);

  const nowManila = useMemo(() => getManilaNow(), []);
  const dateString = nowManila
    .toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      timeZone: MANILA_TIMEZONE,
      weekday: "short",
    })
    .toUpperCase();
  const selectedPatient = props.dashboard.selectedPatient;
  const selectedPatientId = selectedPatient?.user.userId ?? null;
  const todayKey = getManilaDateKey(nowManila);
  const nextMedicationEntry = selectedPatient
    ? getNextMedicationEntry(
        selectedPatient.medications,
        selectedPatient.recentMedicationLogs,
        nowManila,
      )
    : null;
  const upcomingAppointment = selectedPatient
    ? getUpcomingAppointment(selectedPatient.appointments, nowManila)
    : null;
  const medicationTotal =
    selectedPatient?.medicationSummary.dueToday ||
    selectedPatient?.medicationSummary.activeMedications ||
    0;
  const medicationTaken = selectedPatient?.medicationSummary.takenToday ?? 0;
  const medicationMissed = selectedPatient?.recentMedicationLogs.filter(
    (log) => (log.loggedForDate || "") === todayKey && log.status === "missed",
  ).length ?? 0;
  const medicationPending = Math.max(
    medicationTotal - medicationTaken - medicationMissed,
    0,
  );

  const medicationDetailRows = useMemo(() => {
    if (!selectedPatient) return [];
    const logs = selectedPatient.recentMedicationLogs.filter(
      (log) => (log.loggedForDate || "") === todayKey,
    );
    return selectedPatient.medications
      .filter((medication) => medication.isActive)
      .map((medication) => {
        const medLogs = logs.filter((log) => log.medicationId === medication.id);
        const taken = medLogs.filter((log) => log.status === "taken").length;
        const missed = medLogs.filter((log) => log.status === "missed").length;
        const slots = Math.max(medication.scheduleTimes.length, 1);
        const pending = Math.max(slots - taken - missed, 0);
        const status: "taken" | "missed" | "pending" =
          pending === 0 && missed === 0 && taken > 0
            ? "taken"
            : missed > 0
              ? "missed"
              : "pending";
        return {
          id: medication.id,
          name: medication.name,
          dosage: `${medication.dosageValue}${
            medication.dosageUnit ? ` ${medication.dosageUnit}` : ""
          } · ${medication.form}`,
          times: medication.scheduleTimes.map(formatClockTime).join(", "),
          taken,
          missed,
          pending,
          slots,
          status,
        };
      });
  }, [selectedPatient, todayKey]);

  const activityDetailRows = useMemo(() => {
    if (!selectedPatient) return [];
    return selectedPatient.activityPlans
      .filter((plan) => plan.isActive)
      .map((plan) => {
        const completedKey = plan.latestCompletedAt
          ? getManilaDateKey(new Date(plan.latestCompletedAt))
          : null;
        const isToday = completedKey === todayKey;
        const status: "done" | "missed" | "planned" =
          isToday && plan.latestCompletionStatus === "done"
            ? "done"
            : isToday && plan.latestCompletionStatus === "missed"
              ? "missed"
              : "planned";
        return {
          id: plan.id,
          title: plan.title,
          category: plan.category,
          frequency: plan.frequencyType,
          targetMinutes: plan.targetMinutes,
          status,
          latestCompletedAt: plan.latestCompletedAt,
        };
      });
  }, [selectedPatient, todayKey]);

  const latestAlert =
    selectedPatient?.recentMedicationLogs.find((log) => log.status === "missed") ?? null;
  const patientDisplayName = selectedPatient
    ? getPatientName(selectedPatient.user.firstName, selectedPatient.user.lastName)
    : "No linked patient";
  const caregiverDisplayName = getPatientName(
    props.dashboard.user.firstName,
    props.dashboard.user.lastName,
  );

  async function handleMarkAlertTaken() {
    if (!selectedPatientId || !latestAlert) {
      return;
    }

    setPendingAction("alert");
    setMessage(null);

    try {
      const response = await fetch("/api/medication-logs", {
        body: JSON.stringify({
          localDate: latestAlert.loggedForDate,
          logId: latestAlert.id,
          medicationId: latestAlert.medicationId,
          notes: latestAlert.notes ?? "Follow-up from caregiver alert.",
          patientUserId: selectedPatientId,
          scheduledFor: latestAlert.scheduledFor,
          status: "taken",
          takenAt: new Date().toISOString(),
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const payload = (await response.json()) as { message?: string; ok: boolean };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "Unable to update the alert.");
      }

      setMessage("Alert updated and medication logged as taken.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update the alert.");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleMarkAppointmentDone() {
    if (!selectedPatientId || !selectedAppointment) {
      return;
    }

    setPendingAction("appointment");
    setMessage(null);

    try {
      const response = await fetch(`/api/appointments/${selectedAppointment.id}`, {
        body: JSON.stringify({
          appointmentAt: selectedAppointment.appointmentAt,
          imageDataUrl: selectedAppointment.imageDataUrl,
          location: selectedAppointment.location,
          notes: selectedAppointment.notes,
          patientUserId: selectedPatientId,
          providerName: selectedAppointment.providerName,
          status: "completed",
          title: selectedAppointment.title,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "PATCH",
      });
      const payload = (await response.json()) as { message?: string; ok: boolean };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "Unable to update the appointment.");
      }

      setMessage("Appointment marked as done.");
      setSelectedAppointment(null);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to update the appointment.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  const medicationModalData =
    selectedMedication && selectedPatient
      ? (() => {
          const counts = getMedicationCountsForToday(
            selectedMedication.id,
            selectedPatient.recentMedicationLogs,
            todayKey,
          );

          return {
            data: {
              dosage: selectedMedication.dosageValue,
              form: selectedMedication.form,
              frequencyType: selectedMedication.scheduleFrequencyType ?? undefined,
              intervalHours:
                selectedMedication.scheduleTimes.length > 1
                  ? getMedicationIntervalHours(selectedMedication)
                  : undefined,
              missed: counts.missed,
              name: selectedMedication.name,
              notes: selectedMedication.instructions ?? undefined,
              prescriber: selectedMedication.createdByDisplayName || undefined,
              scheduleTimes:
                selectedMedication.scheduleTimes.length > 0
                  ? selectedMedication.scheduleTimes.map((time) => formatClockTime(time))
                  : ["No schedule set"],
              taken: counts.taken,
              takenIndex: counts.taken > 0 ? 0 : undefined,
              total: Math.max(selectedMedication.scheduleTimes.length, 1),
              type: selectedMedication.scheduleFrequencyType ?? undefined,
              unit: selectedMedication.dosageUnit ?? undefined,
            },
          };
        })()
      : null;

  const appointmentModalData = selectedAppointment
    ? {
        data: {
          date: new Date(selectedAppointment.appointmentAt).toLocaleDateString("en-US", {
            day: "numeric",
            month: "long",
            timeZone: MANILA_TIMEZONE,
            year: "numeric",
          }),
          imageDataUrl: selectedAppointment.imageDataUrl,
          location: selectedAppointment.location ?? undefined,
          notes: selectedAppointment.notes ?? undefined,
          provider: selectedAppointment.providerName ?? undefined,
          status: selectedAppointment.status,
          time: new Date(selectedAppointment.appointmentAt).toLocaleTimeString("en-US", {
            hour: "numeric",
            hour12: true,
            minute: "2-digit",
            timeZone: MANILA_TIMEZONE,
          }),
          title: selectedAppointment.title,
        },
      }
    : null;

  return (
    <main className="pd-page">
      <header className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="pd-heading">Welcome, {props.dashboard.user.firstName}!</h1>
          <div className="pd-date">
            <Sun className="h-3.5 w-3.5" />
            <span>{dateString}</span>
          </div>
          <p className="mt-2 text-[13px] font-medium opacity-60">
            Monitoring: {patientDisplayName}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href={joinPath}
            className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#2F3E34] bg-white shadow-md"
            aria-label="Open patient join page"
          >
            <Image
              src="/medic-logo.png"
              alt="MEDIC logo"
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
              priority
            />
          </Link>
          <Link href={profilePath} aria-label="Open profile">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-[#2F3E34] bg-[#E5E7EB]">
              {props.dashboard.user.profileImageDataUrl ? (
                <Image
                  src={props.dashboard.user.profileImageDataUrl}
                  alt={`${caregiverDisplayName} profile photo`}
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                <UserRound className="h-6 w-6 text-[#2F3E34]" />
              )}
            </div>
          </Link>
        </div>
      </header>

      {props.dashboard.activeLinkedPatients.length > 0 ? (
        <section className="mb-4">
          <h3 className="pd-section-heading mb-3">Patient Profiles</h3>
          <div className="flex flex-wrap gap-2">
            {props.dashboard.activeLinkedPatients.map((patient) => {
              const isActive = patient.patientUserId === selectedPatientId;

              return (
                <Link
                  key={patient.relationshipId}
                  href={`${dashboardBasePath}?patientId=${patient.patientUserId}`}
                  className={`cg-patient-pill ${
                    isActive ? "cg-patient-pill-active" : "cg-patient-pill-inactive"
                  }`}
                >
                  <div className="cg-patient-icon">
                    <UserRound className="h-4 w-4" />
                  </div>
                  <span className="truncate">{patient.patientDisplayName}</span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {!selectedPatient ? (
        <div className="rounded-[2rem] border border-black/5 bg-white/90 p-6 shadow-sm">
          <h2 className="text-xl font-semibold tracking-tight text-gray-900">
            No active patient linked yet
          </h2>
          <p className="mt-3 text-sm leading-6 text-gray-500">
            Join a patient first so the dashboard can show real medication, routine, and
            appointment data here.
          </p>
          <Link href={joinPath} className="medic-button medic-button-primary mt-4">
            Connect to a patient
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <h3 className="pd-section-heading">Today&apos;s Care Timeline</h3>

          <div className="pd-card-green p-5">
            <Pill className="absolute right-4 top-4 h-5 w-5 text-white/70" />
            <p className="mb-1 text-[13px] font-semibold text-white/90">
              Medicine Taken today
            </p>
            <p
              className="text-[42px] font-bold leading-none text-white"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {medicationTaken}
              <span className="text-[22px] font-semibold opacity-80"> / {medicationTotal}</span>
            </p>
          </div>

          {latestAlert ? (
            <div
              className="rounded-[20px] p-4"
              style={{ background: "#C0392B", border: "1px solid #922B21" }}
            >
              <div className="mb-2 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 text-white" />
                <p className="text-[15px] font-bold text-white">Recent Alerts</p>
              </div>
              <p className="mb-3 text-[13px] text-white/90">
                {patientDisplayName}:{" "}
                <span className="font-bold">{formatStatusLabel(latestAlert.status)}</span> a dose
                for {latestAlert.medicationName}
                {latestAlert.loggedForDate ? ` on ${latestAlert.loggedForDate}` : ""}.
              </p>
              {canManage ? (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleMarkAlertTaken}
                    disabled={pendingAction === "alert"}
                    className="rounded-full bg-[#4A7C59] px-4 py-2 text-[13px] font-bold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {pendingAction === "alert" ? "Updating..." : "Mark as Taken"}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() =>
              nextMedicationEntry ? setSelectedMedication(nextMedicationEntry.medication) : null
            }
            className="pd-card cursor-pointer p-4 text-left transition hover:opacity-90"
            disabled={!nextMedicationEntry}
          >
            <div className="mb-1 flex items-center justify-between">
              <p className="text-[15px] font-bold">Next Medication:</p>
              <Bell className="h-4 w-4 opacity-70" />
            </div>
            <p className="mb-2 text-[15px] font-semibold opacity-70">
              {nextMedicationEntry?.timeLabel ?? "No medication due soon"}
            </p>
            <div className="flex items-center gap-3">
              <Pill className="h-6 w-6 flex-shrink-0 text-[#2F3E34]" />
              <div>
                <p
                  className="text-[24px] font-extrabold leading-tight"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {nextMedicationEntry?.medication.name ?? "Nothing scheduled"}
                </p>
                <p className="text-[13px] font-semibold opacity-60">
                  {nextMedicationEntry
                    ? `${nextMedicationEntry.medication.dosageValue}${
                        nextMedicationEntry.medication.dosageUnit
                          ? ` ${nextMedicationEntry.medication.dosageUnit}`
                          : ""
                      } ${nextMedicationEntry.medication.form}`
                    : "Check the medication list for schedule details."}
                </p>
              </div>
            </div>
          </button>

          <h3 className="pd-section-heading mt-2">Upcoming Appointments</h3>
          {!upcomingAppointment ? (
            <div className="pd-card p-5 text-center text-[13px] opacity-60">
              No upcoming appointments.
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setSelectedAppointment(upcomingAppointment)}
              className="pd-card cursor-pointer p-5 text-left transition hover:opacity-90"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 flex-shrink-0 rounded-full bg-blue-400" />
                  <span className="text-[15px] font-bold">
                    {getAppointmentDayLabel(upcomingAppointment.appointmentAt, nowManila)}
                  </span>
                </div>
                <span className="text-[15px] font-bold">
                  {new Date(upcomingAppointment.appointmentAt).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    hour12: true,
                    minute: "2-digit",
                    timeZone: MANILA_TIMEZONE,
                  })}
                </span>
              </div>
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-1 h-8 w-8 flex-shrink-0" />
                <div className="flex flex-1 flex-col gap-1">
                  <h4
                    className="text-[22px] font-bold leading-tight"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {upcomingAppointment.title}
                  </h4>
                  {upcomingAppointment.providerName ? (
                    <div className="flex items-center gap-2 text-[13px] opacity-70">
                      <Stethoscope className="h-4 w-4 flex-shrink-0" />
                      <span>|</span>
                      <span>{upcomingAppointment.providerName}</span>
                    </div>
                  ) : null}
                  {upcomingAppointment.location ? (
                    <div className="flex items-center gap-2 text-[13px] opacity-70">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span>|</span>
                      <span>{upcomingAppointment.location}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </button>
          )}

          <h3 className="pd-section-heading mt-2">Progress Summary</h3>
          <div className="pd-progress-grid">
            <div className="pd-card flex h-full flex-col gap-2 p-4">
              <div className="w-full text-center">
                <p className="text-[13px] font-bold">Medications</p>
                <p
                  className="text-[22px] font-bold leading-tight"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {medicationTaken}
                  <span className="text-[15px] font-semibold opacity-60">
                    {" "}
                    / {medicationTotal}
                  </span>
                </p>
                <p className="text-[13px] opacity-50">taken today</p>
              </div>
              <div className="flex flex-1 items-center justify-center">
                <MedicationDonutChart
                  missed={medicationMissed}
                  pending={medicationPending}
                  taken={medicationTaken}
                  total={Math.max(medicationTotal, 1)}
                />
              </div>
              <div className="flex w-full justify-between px-1">
                {[
                  { color: "#4A7C59", label: "Taken" },
                  { color: "#E9C46A", label: "Pending" },
                  { color: "#D97B7B", label: "Missed" },
                ].map((legend) => (
                  <div key={legend.label} className="flex items-center gap-1.5">
                    <div
                      className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                      style={{ background: legend.color }}
                    />
                    <span className="text-[13px] font-semibold opacity-70">
                      {legend.label}
                    </span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setProgressDetail("medications")}
                className="mt-1 inline-flex items-center justify-center gap-1 rounded-full border border-[#2F3E34]/20 bg-white px-3 py-1.5 text-[12px] font-semibold text-[#2F3E34] transition-colors hover:border-[#2F3E34]/60 hover:bg-[#F6F7F2]"
                aria-label="View today's medication details"
              >
                View details
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="pd-card flex h-full flex-col gap-2 p-4">
              <div className="w-full text-center">
                <p className="text-[13px] font-bold">Activities</p>
                <p
                  className="text-[22px] font-bold leading-tight"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {selectedPatient.activitySummary.completedToday}
                  <span className="text-[15px] font-semibold opacity-60">
                    {" "}
                    / {selectedPatient.activitySummary.activePlans}
                  </span>
                </p>
                <p className="text-[13px] opacity-50">completed today</p>
              </div>
              <div className="flex flex-1 flex-col" style={{ minHeight: 0 }}>
                <ActivityBarChart summary={selectedPatient.activitySummary} />
              </div>
              <button
                type="button"
                onClick={() => setProgressDetail("activities")}
                className="mt-1 inline-flex items-center justify-center gap-1 rounded-full border border-[#2F3E34]/20 bg-white px-3 py-1.5 text-[12px] font-semibold text-[#2F3E34] transition-colors hover:border-[#2F3E34]/60 hover:bg-[#F6F7F2]"
                aria-label="View today's activity details"
              >
                View details
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {message ? (
        <p className="mt-4 rounded-2xl bg-[var(--color-surface-muted)] px-4 py-3 text-sm text-[var(--foreground)]">
          {message}
        </p>
      ) : null}

      <CareMemberBottomNav
        activeItem="home"
        patientUserId={selectedPatientId}
        role={role}
      />

      {medicationModalData ? (
        <MedicationViewModal
          data={medicationModalData.data}
          onClose={() => setSelectedMedication(null)}
        />
      ) : null}

      {appointmentModalData ? (
        <AppointmentViewModal
          canEdit={false}
          data={appointmentModalData.data}
          onClose={() => setSelectedAppointment(null)}
          onMarkDone={
            canManage && selectedAppointment?.status !== "completed"
              ? handleMarkAppointmentDone
              : undefined
          }
        />
      ) : null}

      {progressDetail === "medications" && selectedPatient ? (
        <ProgressDetailModal
          title="Today's Medications"
          subtitle={`${patientDisplayName} · ${dateString}`}
          onClose={() => setProgressDetail(null)}
          manageHref={
            selectedPatientId
              ? `${medicationsBasePath}?patientId=${selectedPatientId}`
              : medicationsBasePath
          }
          manageLabel="Open medications manager"
          summary={[
            { color: "#4A7C59", label: "Taken", value: medicationTaken },
            { color: "#E9C46A", label: "Pending", value: medicationPending },
            { color: "#D97B7B", label: "Missed", value: medicationMissed },
          ]}
          emptyText="No medications are active for this patient."
        >
          {medicationDetailRows.length === 0 ? null : (
            <ul className="flex flex-col gap-2.5">
              {medicationDetailRows.map((row) => (
                <li
                  key={row.id}
                  className="flex items-start gap-3 rounded-2xl border border-[#2F3E34]/10 bg-white p-3"
                >
                  <div
                    className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#2F3E34]/10 text-[#2F3E34]"
                    aria-hidden="true"
                  >
                    <Pill className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold text-[#2F3E34]">
                      {row.name}
                    </p>
                    <p className="text-[12px] opacity-70">{row.dosage}</p>
                    {row.times ? (
                      <p className="text-[12px] opacity-60">Scheduled: {row.times}</p>
                    ) : null}
                    <p className="mt-1 text-[12px] text-[#2F3E34]">
                      Today: {row.taken} taken · {row.pending} pending · {row.missed} missed
                    </p>
                  </div>
                  <StatusChip status={row.status} />
                </li>
              ))}
            </ul>
          )}
        </ProgressDetailModal>
      ) : null}

      {progressDetail === "activities" && selectedPatient ? (
        <ProgressDetailModal
          title="Today's Activities"
          subtitle={`${patientDisplayName} · ${dateString}`}
          onClose={() => setProgressDetail(null)}
          manageHref={
            selectedPatientId
              ? `${activitiesBasePath}?patientId=${selectedPatientId}`
              : activitiesBasePath
          }
          manageLabel="Open activities manager"
          summary={[
            {
              color: "#4A7C59",
              label: "Done",
              value: selectedPatient.activitySummary.completedToday,
            },
            {
              color: "#E9C46A",
              label: "Planned",
              value: Math.max(
                selectedPatient.activitySummary.activePlans -
                  selectedPatient.activitySummary.completedToday -
                  selectedPatient.activitySummary.missedToday,
                0,
              ),
            },
            {
              color: "#D97B7B",
              label: "Missed",
              value: selectedPatient.activitySummary.missedToday,
            },
          ]}
          emptyText="No routines or activities are active for this patient."
        >
          {activityDetailRows.length === 0 ? null : (
            <ul className="flex flex-col gap-2.5">
              {activityDetailRows.map((row) => (
                <li
                  key={row.id}
                  className="flex items-start gap-3 rounded-2xl border border-[#2F3E34]/10 bg-white p-3"
                >
                  <div
                    className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#2F3E34]/10 text-[#2F3E34]"
                    aria-hidden="true"
                  >
                    <Activity className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold text-[#2F3E34]">
                      {row.title}
                    </p>
                    <p className="text-[12px] opacity-70">
                      {row.category} · {row.frequency}
                      {row.targetMinutes ? ` · ${row.targetMinutes} min target` : ""}
                    </p>
                    {row.latestCompletedAt ? (
                      <p className="text-[12px] opacity-60">
                        Last activity: {formatDateTimeShort(row.latestCompletedAt)}
                      </p>
                    ) : null}
                  </div>
                  <StatusChip status={row.status} />
                </li>
              ))}
            </ul>
          )}
        </ProgressDetailModal>
      ) : null}
    </main>
  );
}

function formatDateTimeShort(value: string) {
  try {
    return new Date(value).toLocaleString("en-US", {
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      month: "short",
      timeZone: MANILA_TIMEZONE,
    });
  } catch {
    return value;
  }
}

function StatusChip(props: {
  status: "taken" | "missed" | "pending" | "done" | "planned";
}) {
  const map = {
    taken: { bg: "#DCEBE0", fg: "#2F5D3A", label: "Taken" },
    done: { bg: "#DCEBE0", fg: "#2F5D3A", label: "Done" },
    pending: { bg: "#FBEFC8", fg: "#7A5B1F", label: "Pending" },
    planned: { bg: "#FBEFC8", fg: "#7A5B1F", label: "Planned" },
    missed: { bg: "#F7D6D6", fg: "#8B2F2F", label: "Missed" },
  } as const;
  const { bg, fg, label } = map[props.status];
  return (
    <span
      className="flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ background: bg, color: fg }}
    >
      {label}
    </span>
  );
}

function ProgressDetailModal(props: {
  title: string;
  subtitle: string;
  onClose: () => void;
  manageHref: string;
  manageLabel: string;
  summary: Array<{ color: string; label: string; value: number }>;
  emptyText: string;
  children: React.ReactNode;
}) {
  const total = props.summary.reduce((sum, item) => sum + item.value, 0);
  return (
    <div className="pd-modal-sheet">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="pd-modal-title">{props.title}</h2>
          <p className="text-[12px] uppercase tracking-wide opacity-60">
            {props.subtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={props.onClose}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 border-[#2F3E34] transition hover:bg-[#E5E7EB]"
          aria-label="Close details"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-2">
        {props.summary.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-[#2F3E34]/10 bg-white p-3 text-center"
          >
            <div className="mx-auto mb-1.5 h-2 w-8 rounded-full" style={{ background: item.color }} />
            <p className="text-[20px] font-bold text-[#2F3E34]" style={{ fontFamily: "var(--font-heading)" }}>
              {item.value}
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-wide opacity-60">
              {item.label}
            </p>
          </div>
        ))}
      </div>

      {total === 0 && !props.children ? (
        <p className="rounded-2xl border border-[#2F3E34]/10 bg-white p-4 text-[13px] opacity-70">
          {props.emptyText}
        </p>
      ) : (
        props.children ?? (
          <p className="rounded-2xl border border-[#2F3E34]/10 bg-white p-4 text-[13px] opacity-70">
            {props.emptyText}
          </p>
        )
      )}

      <Link
        href={props.manageHref}
        className="mt-5 inline-flex items-center justify-center gap-1 rounded-full border-2 px-5 py-2 text-[13px] font-semibold shadow-sm transition hover:opacity-90"
        style={{
          backgroundColor: "#2F3E34",
          borderColor: "#2F3E34",
          color: "#FFFFFF",
        }}
        onClick={props.onClose}
      >
        <span style={{ color: "#FFFFFF" }}>{props.manageLabel}</span>
        <ChevronRight className="h-4 w-4" style={{ color: "#FFFFFF" }} />
      </Link>
    </div>
  );
}
