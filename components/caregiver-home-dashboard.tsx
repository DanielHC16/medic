"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  MapPin,
  Pill,
  QrCode,
  Stethoscope,
  Sun,
  UserRound,
} from "lucide-react";

import { AppointmentViewModal } from "@/components/appointment-view-modal";
import { CareMemberBottomNav } from "@/components/care-member-bottom-nav";
import { MedicationViewModal } from "@/components/medication-view-modal";
import { formatClockTime, formatStatusLabel } from "@/lib/display";
import type {
  ActivitySummary,
  AppointmentRecord,
  CareMemberDashboardData,
  MedicationLogRecord,
  MedicationRecord,
} from "@/lib/medic-types";

const MANILA_TIMEZONE = "Asia/Manila";
const WEEKDAY_OPTIONS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

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
  now: Date,
): NextMedicationEntry | null {
  const weekday = WEEKDAY_OPTIONS[now.getDay()];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const activeMedications = medications.filter((medication) => medication.isActive);
  let nextEntry: NextMedicationEntry | null = null;

  for (const medication of activeMedications) {
    if (
      medication.scheduleDays.length > 0 &&
      !medication.scheduleDays.includes(weekday)
    ) {
      continue;
    }

    for (const time of medication.scheduleTimes) {
      const [hourString, minuteString] = time.split(":");
      const hours = Number(hourString);
      const minutes = Number(minuteString);

      if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
        continue;
      }

      const scheduleMinutes = hours * 60 + minutes;
      const minutesUntil =
        scheduleMinutes >= currentMinutes
          ? scheduleMinutes - currentMinutes
          : 24 * 60 - currentMinutes + scheduleMinutes;

      if (!nextEntry || minutesUntil < nextEntry.minutesUntil) {
        nextEntry = {
          medication,
          minutesUntil,
          timeLabel: formatClockTime(time),
        };
      }
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
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"alert" | "appointment" | null>(null);
  const [selectedMedication, setSelectedMedication] = useState<MedicationRecord | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentRecord | null>(null);

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
    ? getNextMedicationEntry(selectedPatient.medications, nowManila)
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
          medicationId: latestAlert.medicationId,
          notes: latestAlert.notes ?? "Follow-up from caregiver alert.",
          patientUserId: selectedPatientId,
          status: "taken",
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
                  ? Math.round(24 / selectedMedication.scheduleTimes.length)
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
            href="/caregiver/join"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-md"
            style={{ background: "#2F3E34" }}
            aria-label="Open patient join page"
          >
            <QrCode className="h-5 w-5" />
          </Link>
          <Link href="/caregiver/profile" aria-label="Open caregiver profile">
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
                  href={`/caregiver/dashboard?patientId=${patient.patientUserId}`}
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
          <Link href="/caregiver/join" className="medic-button medic-button-primary mt-4">
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
        role="caregiver"
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
            selectedAppointment?.status === "completed" ? undefined : handleMarkAppointmentDone
          }
        />
      ) : null}
    </main>
  );
}
