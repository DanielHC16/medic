"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  Bot,
  CalendarDays,
  Check,
  Clock,
  Heart,
  House,
  MapPin,
  Pill,
  QrCode,
  Stethoscope,
  Sun,
  User,
  UserRound,
  WandSparkles,
  X,
} from "lucide-react";

import { MedicationReminderPanel } from "@/components/medication-reminder-panel";
import {
  formatClockTime,
  formatDate,
  formatDateTime,
  formatStatusLabel,
  formatTimeList,
} from "@/lib/display";
import {
  getLocalDateKey,
  getMedicationLogsForDate,
  getNextReminderSlot,
} from "@/lib/medication-reminders";
import type {
  ActivityPlanRecord,
  ActivitySummary,
  AppointmentRecord,
  MedicationAdherenceSummary,
  MedicationLogRecord,
  MedicationRecord,
  PatientDashboardData,
  TimeFormatPreference,
} from "@/lib/medic-types";

type PatientDashboardClientProps = {
  activitySummary: ActivitySummary;
  dashboard: PatientDashboardData;
  medicationLogs: MedicationLogRecord[];
  medicationSummary: MedicationAdherenceSummary;
};

export default function PatientDashboardClient(props: PatientDashboardClientProps) {
  const { activitySummary, dashboard, medicationLogs, medicationSummary } = props;
  const user = dashboard.user;
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  const todayKey = getLocalDateKey(now);
  const [selectedMedication, setSelectedMedication] = useState<MedicationRecord | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentRecord | null>(null);
  const [showMissedDetails, setShowMissedDetails] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState(() =>
    buildLocalRecommendation({
      activitySummary,
      appointments: dashboard.appointments,
      medicationSummary,
      medications: dashboard.medications,
      now,
    }),
  );

  useEffect(() => {
    let cancelled = false;

    fetch("/api/wellness/recommendations")
      .then((response) => response.json())
      .then((payload) => {
        const recommendation = getApiRecommendation(payload);

        if (!cancelled && recommendation) {
          setAiRecommendation(recommendation);
        }
      })
      .catch(() => {
        // Keep the local recommendation fallback when the scaffolded endpoint is unavailable.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const dateString = now
    .toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      timeZone: "Asia/Manila",
      weekday: "short",
    })
    .toUpperCase();

  const activeMedications = dashboard.medications.filter((item) => item.isActive);
  const nextMedicationEntry =
    activeMedications
      .map((item) => ({
        item,
        nextSlot: getNextReminderSlot(item, medicationLogs, now),
      }))
      .filter(
        (
          entry,
        ): entry is {
          item: MedicationRecord;
          nextSlot: Date;
        } => entry.nextSlot instanceof Date,
      )
      .sort((left, right) => left.nextSlot.getTime() - right.nextSlot.getTime())[0] ?? null;
  const nextMedication =
    nextMedicationEntry?.item ?? activeMedications[0] ?? dashboard.medications[0] ?? null;
  const nextMedicationTimeLabel = nextMedicationEntry
    ? formatTimeFromDate(nextMedicationEntry.nextSlot, user.preferences.timeFormat)
    : nextMedication
      ? formatTimeList(nextMedication.scheduleTimes)
      : "Not scheduled";
  const nextAppointment = selectNextAppointment(dashboard.appointments, now);
  const appointmentScheduleHref = nextAppointment
    ? `/patient/schedule?view=appointments&appointmentId=${nextAppointment.id}`
    : "/patient/schedule?view=appointments";
  const takenMedicationCount = Math.min(
    medicationSummary.takenToday,
    medicationSummary.dueToday,
  );
  const medicationAttentionCount = Math.min(
    medicationSummary.missedToday + medicationSummary.skippedToday,
    Math.max(medicationSummary.dueToday - takenMedicationCount, 0),
  );
  const medicationPendingCount = Math.max(
    medicationSummary.dueToday - takenMedicationCount - medicationAttentionCount,
    0,
  );
  const medicationProgressStyle = getMedicationProgressStyle({
    dueToday: medicationSummary.dueToday,
    pendingCount: medicationPendingCount,
    takenCount: takenMedicationCount,
  });
  const workoutProgressLabel =
    activitySummary.activePlans > 0
      ? `${activitySummary.completedToday}/${activitySummary.activePlans}`
      : "0/0";
  const missedLogsForToday = medicationLogs.filter((log) => {
    const reference = log.loggedForDate
      ? new Date(`${log.loggedForDate}T00:00:00`)
      : new Date(log.scheduledFor || log.createdAt);

    return (
      getLocalDateKey(reference) === todayKey &&
      (log.status === "missed" || log.status === "queued_offline" || log.status === "skipped")
    );
  });

  return (
    <main className="pd-page">
      <header className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="pd-heading">Welcome, {user.firstName || "User"}!</h1>
          <div className="pd-date">
            <Sun className="h-3.5 w-3.5" />
            <span>{dateString}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/patient/care-circle"
            aria-label="Open care circle"
            className="pd-icon-btn"
          >
            <QrCode className="h-5 w-5" />
          </Link>

          <Link href="/profile" className="pd-avatar">
            {user.profileImageDataUrl ? (
              <Image
                src={user.profileImageDataUrl}
                alt={`${user.firstName} ${user.lastName} profile photo`}
                width={40}
                height={40}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              <UserRound className="h-5 w-5" />
            )}
          </Link>
        </div>
      </header>

      <div className="flex flex-col gap-4">
        <section className="pd-card-green p-5">
          <Pill className="absolute right-4 top-4 h-5 w-5 text-white/70" />
          <p className="mb-1 text-[13px] font-semibold text-white/90">Medicine Taken today</p>
          <p
            className="text-[42px] font-bold leading-none text-white"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {medicationSummary.takenToday}
            <span className="text-[22px] font-semibold opacity-80">
              {" "}
              / {medicationSummary.dueToday}
            </span>
          </p>
        </section>

        <button
          type="button"
          className="pd-card flex items-center justify-between p-4 text-left transition hover:opacity-90"
          onClick={() => {
            if (nextMedication) {
              setSelectedMedication(nextMedication);
            }
          }}
        >
          <div>
            <p className="text-[14px] font-bold">Next Medication</p>
            <p className="mt-0.5 text-[13px] opacity-60">
              {nextMedication
                ? `${nextMedication.name} is the next scheduled dose`
                : "No medications scheduled today"}
            </p>
          </div>

          {nextMedication ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-bold">{nextMedicationTimeLabel}</span>
              <Bell className="h-4 w-4" />
            </div>
          ) : null}
        </button>

        <MedicationReminderPanel
          contactMethod={user.preferences.preferredContactMethod}
          logs={medicationLogs}
          medications={dashboard.medications}
          patientDisplayName={`${user.firstName} ${user.lastName}`}
          patientUserId={user.userId}
          role={user.role}
          timeFormat={user.preferences.timeFormat}
          viewerDisplayName={`${user.firstName} ${user.lastName}`}
        />

        <section className="pd-card-dark p-5">
          <div className="pd-ai-glow" />
          <div className="flex items-start gap-4">
            <div className="pd-ai-icon-box">
              <Bot className="h-7 w-7 text-white" />
            </div>

            <div className="flex flex-1 flex-col gap-1">
              <span className="pd-ai-badge self-start">Medic AI</span>
              <p
                className="text-[18px] font-bold leading-snug text-white"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Today&apos;s Recommendation
              </p>
              <p className="pd-ai-rec-text">{aiRecommendation}</p>
            </div>

            <WandSparkles className="mt-0.5 h-6 w-6 flex-shrink-0 text-white" />
          </div>

          <div className="mt-4 rounded-[1.5rem] bg-white/12 p-4 backdrop-blur-sm">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 text-left text-white"
              onClick={() => setShowMissedDetails((current) => !current)}
            >
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-white/75">
                  Missed or skipped today
                </p>
                <p className="mt-1 text-2xl font-bold">{missedLogsForToday.length}</p>
              </div>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                {showMissedDetails ? "Hide" : "Review"}
              </span>
            </button>

            {showMissedDetails ? (
              <div className="mt-3 grid gap-2">
                {missedLogsForToday.length === 0 ? (
                  <p className="rounded-2xl bg-white/10 px-3 py-3 text-sm text-white/80">
                    No missed or skipped medication logs were recorded today.
                  </p>
                ) : (
                  missedLogsForToday.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-2xl bg-white/10 px-3 py-3 text-sm text-white/90"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold">{log.medicationName}</span>
                        <span className="text-xs uppercase tracking-[0.14em] text-white/70">
                          {formatStatusLabel(log.status)}
                        </span>
                      </div>
                      <p className="mt-1 text-white/75">
                        {formatDateTime(log.scheduledFor || log.createdAt)}
                      </p>
                      {log.notes ? <p className="mt-1 text-white/75">{log.notes}</p> : null}
                    </div>
                  ))
                )}
              </div>
            ) : null}
          </div>
        </section>

        <div className="mt-2 flex items-center justify-between px-1">
          <h2 className="pd-section-heading !mt-0">Upcoming Appointments</h2>
          <Link
            href={appointmentScheduleHref}
            className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#568164]"
          >
            View schedule
          </Link>
        </div>

        {!nextAppointment ? (
          <div className="pd-card p-4 text-center text-[13px] opacity-60">
            No upcoming appointments.
          </div>
        ) : (
          <button
            type="button"
            className="pd-card p-5 text-left transition hover:opacity-90"
            onClick={() => setSelectedAppointment(nextAppointment)}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="pd-appt-day-dot" />
                <span className="text-[15px] font-bold">
                  {getAppointmentDayLabel(nextAppointment, now)}
                </span>
              </div>
              <span className="text-[15px] font-bold">
                at {getAppointmentTimeLabel(nextAppointment.appointmentAt, user.preferences.timeFormat)}
              </span>
            </div>

            <div className="flex items-start gap-3">
              <CalendarDays className="mt-1 h-8 w-8 flex-shrink-0" />
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3
                    className="text-[22px] font-bold leading-tight"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {nextAppointment.title}
                  </h3>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[13px] font-bold ${statusPillClass(nextAppointment.status)}`}
                  >
                    {formatStatusLabel(nextAppointment.status)}
                  </span>
                </div>

                {nextAppointment.providerName ? (
                  <div className="flex items-center gap-2 text-[13px] opacity-70">
                    <Stethoscope className="h-4 w-4 flex-shrink-0" />
                    <span>{nextAppointment.providerName}</span>
                  </div>
                ) : null}

                {nextAppointment.location ? (
                  <div className="flex items-center gap-2 text-[13px] opacity-70">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span>{nextAppointment.location}</span>
                  </div>
                ) : null}
              </div>
            </div>
          </button>
        )}

        <h2 className="pd-section-heading">Progress Summary</h2>

        <div className="pd-progress-grid !h-auto">
          <section className="pd-card flex h-full flex-col gap-2 p-4">
            <div className="w-full text-center">
              <p className="text-[14px] font-bold">Medications</p>
              <p
                className="text-[22px] font-bold leading-tight"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {medicationSummary.takenToday}
                <span className="text-[15px] font-semibold opacity-60">
                  {" "}
                  / {medicationSummary.dueToday}
                </span>
              </p>
              <p className="text-[13px] opacity-50">taken today</p>
            </div>

            <div className="flex flex-1 items-center justify-center">
              <div
                className="relative flex h-[130px] w-[130px] items-center justify-center rounded-full"
                style={medicationProgressStyle}
              >
                <div className="flex h-[94px] w-[94px] flex-col items-center justify-center rounded-full bg-[#FAFBF9]">
                  <span className="mb-0.5 text-[26px] font-bold leading-none text-[#1A231D]">
                    {medicationSummary.takenToday}/{medicationSummary.dueToday}
                  </span>
                  <span className="text-center text-[10px] font-medium leading-[1.2] text-[#73847B]">
                    Medications
                    <br />
                    Taken
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-auto flex flex-wrap items-center justify-center gap-3 pb-1">
              <LegendDot color="#8BA488" label="Taken" />
              <LegendDot color="#F1D262" label="Pending" />
              <LegendDot color="#D49191" label="Attention" />
            </div>
          </section>

          <section className="pd-card flex h-full flex-col gap-2 p-4">
            <div className="w-full text-center">
              <p className="text-[14px] font-bold">Activities</p>
              <p
                className="text-[22px] font-bold leading-tight"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {activitySummary.completedToday}
                <span className="text-[15px] font-semibold opacity-60">
                  {" "}
                  / {activitySummary.activePlans}
                </span>
              </p>
              <p className="text-[13px] opacity-50">completed today</p>
            </div>

            <div className="flex flex-1 flex-col" style={{ minHeight: 0 }}>
              <ActivityBarChart plans={dashboard.activityPlans} />
            </div>

            <p className="mt-2 text-center text-[11px] font-medium uppercase tracking-[0.16em] text-[#73847B]">
              {workoutProgressLabel} routines complete / {activitySummary.missedToday} missed today
            </p>
          </section>
        </div>
      </div>

      <nav className="pd-nav">
        <div className="pd-nav-active">
          <Link href="/patient/dashboard" className="flex h-full w-full items-center justify-center">
            <House className="h-8 w-8" />
          </Link>
        </div>
        <Link href="/patient/schedule" className="pd-nav-link">
          <Clock className="h-7 w-7" />
        </Link>
        <Link href="/wellness" className="pd-nav-link">
          <Heart className="h-7 w-7" />
        </Link>
        <Link href="/profile" className="pd-nav-link">
          <User className="h-7 w-7" />
        </Link>
      </nav>

      {selectedMedication ? (
        <MedicationModal
          logs={medicationLogs}
          medication={selectedMedication}
          onClose={() => setSelectedMedication(null)}
          timeFormat={user.preferences.timeFormat}
        />
      ) : null}

      {selectedAppointment ? (
        <AppointmentModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          timeFormat={user.preferences.timeFormat}
        />
      ) : null}
    </main>
  );
}

function MedicationModal(props: {
  logs: MedicationLogRecord[];
  medication: MedicationRecord;
  onClose: () => void;
  timeFormat: TimeFormatPreference;
}) {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  const todayLogs = getMedicationLogsForDate(props.logs, props.medication.id, now).sort(
    (left, right) =>
      getLogReferenceDate(right).getTime() - getLogReferenceDate(left).getTime(),
  );
  const nextSlot = getNextReminderSlot(props.medication, props.logs, now);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
      onClick={props.onClose}
    >
      <div className="pd-modal-sheet" onClick={(event) => event.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.16em] opacity-60">
              {props.medication.form}
              {props.medication.dosageValue
                ? ` / ${props.medication.dosageValue}${
                    props.medication.dosageUnit ? ` ${props.medication.dosageUnit}` : ""
                  }`
                : ""}
            </p>
            <h2 className="pd-modal-title-lg">{props.medication.name}</h2>
          </div>

          <button
            type="button"
            onClick={props.onClose}
            aria-label="Close medication details"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#2F3E34] transition hover:bg-[#E5E7EB]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-6 grid gap-3">
          <div className="pd-modal-info-tile">
            <Bell className="h-5 w-5" />
            <div>
              <p className="text-xs uppercase tracking-[0.16em] opacity-60">Next dose</p>
              <p className="text-sm font-semibold">
                {nextSlot
                  ? formatTimeFromDate(nextSlot, props.timeFormat)
                  : "All scheduled doses logged for today"}
              </p>
            </div>
          </div>

          <div className="pd-modal-info-tile">
            <CalendarDays className="h-5 w-5" />
            <div>
              <p className="text-xs uppercase tracking-[0.16em] opacity-60">Schedule pattern</p>
              <p className="text-sm font-semibold">
                {props.medication.scheduleDays.length > 0
                  ? props.medication.scheduleDays.join(", ")
                  : "Every day"}
              </p>
            </div>
          </div>
        </div>

        <p className="mb-2 text-[13px] font-bold">Scheduled times</p>
        <div className="mb-6 flex flex-col gap-2">
          {props.medication.scheduleTimes.length > 0 ? (
            props.medication.scheduleTimes.map((time) => {
              const isNextDose =
                nextSlot !== null && getSlotKey(nextSlot) === normalizeTimeSlot(time);

              return (
                <div key={time} className="pd-schedule-row">
                  <span className="text-[15px] font-semibold">{formatClockTime(time)}</span>
                  {isNextDose ? (
                    <span className="rounded-full bg-[#E9C46A] px-3 py-1 text-[12px] font-bold text-[#6B4D00]">
                      NEXT
                    </span>
                  ) : null}
                </div>
              );
            })
          ) : (
            <div className="pd-schedule-row text-[13px] opacity-60">No schedule set</div>
          )}
        </div>

        <p className="mb-2 text-[13px] font-bold">Today&apos;s activity</p>
        <div className="mb-6 grid gap-2">
          {todayLogs.length === 0 ? (
            <div className="pd-notes-box">No medication logs have been recorded for this medication yet.</div>
          ) : (
            todayLogs.map((log) => (
              <div key={log.id} className="pd-schedule-row items-start gap-3">
                <div>
                  <p className="text-[14px] font-semibold">{formatStatusLabel(log.status)}</p>
                  <p className="text-[12px] opacity-60">
                    {formatDateTime(log.takenAt || log.scheduledFor || log.createdAt)}
                  </p>
                  {log.notes ? <p className="mt-1 text-[12px] opacity-70">{log.notes}</p> : null}
                </div>
                {log.status === "taken" ? (
                  <span className="flex items-center gap-1 rounded-full bg-[#4A7C59] px-3 py-1 text-[12px] font-bold text-white">
                    <Check className="h-3 w-3" />
                    TAKEN
                  </span>
                ) : (
                  <span className="rounded-full bg-[#FEE2E2] px-3 py-1 text-[12px] font-bold text-[#A94444]">
                    {formatStatusLabel(log.status)}
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        <p className="mb-2 text-[13px] font-bold">Instructions</p>
        <div className="pd-notes-box">
          {props.medication.instructions || "No special instructions were added for this medication."}
        </div>
      </div>
    </div>
  );
}

function AppointmentModal(props: {
  appointment: AppointmentRecord;
  onClose: () => void;
  timeFormat: TimeFormatPreference;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
      onClick={props.onClose}
    >
      <div className="pd-modal-sheet" onClick={(event) => event.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <span
            className={`rounded-full px-3 py-1 text-[13px] font-bold ${statusPillClass(props.appointment.status)}`}
          >
            {formatStatusLabel(props.appointment.status)}
          </span>
          <button
            type="button"
            onClick={props.onClose}
            aria-label="Close appointment details"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#2F3E34] transition hover:bg-[#E5E7EB]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-1 text-[13px] font-semibold opacity-70">
          {formatDate(props.appointment.appointmentAt)} /{" "}
          {getAppointmentTimeLabel(props.appointment.appointmentAt, props.timeFormat)}
        </p>
        <h2 className="pd-modal-title-lg">{props.appointment.title}</h2>

        <div className="mb-6 flex flex-col gap-2">
          {props.appointment.providerName ? (
            <div className="flex items-center gap-2 text-[13px]">
              <Stethoscope className="h-4 w-4 opacity-60" />
              <span>{props.appointment.providerName}</span>
            </div>
          ) : null}

          {props.appointment.location ? (
            <div className="flex items-center gap-2 text-[13px]">
              <MapPin className="h-4 w-4 opacity-60" />
              <span>{props.appointment.location}</span>
            </div>
          ) : null}
        </div>

        <p className="mb-2 text-[13px] font-bold">Notes</p>
        <div className="pd-notes-box">
          {props.appointment.notes || "No notes were added for this appointment."}
        </div>
      </div>
    </div>
  );
}

function ActivityBarChart(props: { plans: ActivityPlanRecord[] }) {
  const total = props.plans.length || 1;
  const completed = props.plans.filter((plan) => plan.latestCompletionStatus === "done").length;
  const missed = props.plans.filter((plan) => plan.latestCompletionStatus === "missed").length;
  const planned = props.plans.filter(
    (plan) => plan.latestCompletionStatus === "planned" || !plan.latestCompletionStatus,
  ).length;
  const bars = [
    { color: "#4A7C59", label: "Done", value: completed },
    { color: "#E9C46A", label: "Planned", value: planned },
    { color: "#D97B7B", label: "Missed", value: missed },
  ];
  const maxValue = Math.max(...bars.map((item) => item.value), 1);

  return (
    <div className="flex h-full w-full flex-1 flex-col">
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
            <span className="text-[12px] font-semibold opacity-60">{bar.label}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-center text-[13px] opacity-50">
        {completed} of {total} done
      </p>
    </div>
  );
}

function LegendDot(props: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: props.color }} />
      <span className="text-[10px] font-medium text-[#73847B]">{props.label}</span>
    </div>
  );
}

function selectNextAppointment(appointments: AppointmentRecord[], now: Date) {
  const upcoming = appointments
    .filter((appointment) => {
      if (appointment.status === "cancelled") {
        return false;
      }

      const date = new Date(appointment.appointmentAt);
      return !Number.isNaN(date.getTime()) && date.getTime() >= now.getTime();
    })
    .sort(
      (left, right) =>
        new Date(left.appointmentAt).getTime() - new Date(right.appointmentAt).getTime(),
    )[0];

  if (upcoming) {
    return upcoming;
  }

  return appointments.find((appointment) => appointment.status !== "cancelled") ?? appointments[0] ?? null;
}

function getAppointmentDayLabel(appointment: AppointmentRecord, now: Date) {
  const appointmentDate = new Date(appointment.appointmentAt);

  if (Number.isNaN(appointmentDate.getTime())) {
    return "Upcoming";
  }

  const today = now.toLocaleDateString("en-US", { timeZone: "Asia/Manila" });
  const appointmentDay = appointmentDate.toLocaleDateString("en-US", { timeZone: "Asia/Manila" });

  if (appointmentDay === today) {
    return "Today";
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (
    appointmentDay ===
    tomorrow.toLocaleDateString("en-US", { timeZone: "Asia/Manila" })
  ) {
    return "Tomorrow";
  }

  return appointmentDate.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Manila",
  });
}

function getAppointmentTimeLabel(value: string, timeFormat: TimeFormatPreference) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    hour12: timeFormat !== "24h",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  }).format(date);
}

function formatTimeFromDate(value: Date, timeFormat: TimeFormatPreference) {
  return new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    hour12: timeFormat !== "24h",
    minute: "2-digit",
  }).format(value);
}

function getMedicationProgressStyle(props: {
  dueToday: number;
  pendingCount: number;
  takenCount: number;
}): CSSProperties {
  if (props.dueToday <= 0) {
    return {
      background: "conic-gradient(#DCE4DE 0deg 360deg)",
    };
  }

  const takenDegrees = (props.takenCount / props.dueToday) * 360;
  const pendingDegrees = (props.pendingCount / props.dueToday) * 360;
  const attentionStart = takenDegrees + pendingDegrees;

  return {
    background: `conic-gradient(
      #8BA488 0deg ${takenDegrees}deg,
      #F1D262 ${takenDegrees}deg ${attentionStart}deg,
      #D49191 ${attentionStart}deg 360deg
    )`,
  };
}

function statusPillClass(status: string) {
  switch (status) {
    case "scheduled":
      return "pd-status-scheduled";
    case "completed":
      return "pd-status-completed";
    case "cancelled":
      return "pd-status-cancelled";
    case "pending":
      return "pd-status-pending";
    default:
      return "pd-status-default";
  }
}

function getApiRecommendation(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const response = payload as {
    message?: unknown;
    recommendation?: unknown;
    summary?: unknown;
  };

  const candidates = [response.recommendation, response.summary, response.message];

  for (const candidate of candidates) {
    if (typeof candidate !== "string" || candidate.trim().length === 0) {
      continue;
    }

    const normalized = candidate.toLowerCase();

    if (
      normalized.includes("intentionally deferred") ||
      normalized.includes("phase-one database foundation") ||
      normalized.includes("route scaffold")
    ) {
      continue;
    }

    return candidate;
  }

  return null;
}

function buildLocalRecommendation(input: {
  activitySummary: ActivitySummary;
  appointments: AppointmentRecord[];
  medicationSummary: MedicationAdherenceSummary;
  medications: MedicationRecord[];
  now: Date;
}) {
  const nextAppointment = selectNextAppointment(input.appointments, input.now);
  const pendingRoutines = Math.max(
    input.activitySummary.activePlans - input.activitySummary.completedToday,
    0,
  );

  if (input.medicationSummary.missedToday + input.medicationSummary.skippedToday > 0) {
    const attentionCount = input.medicationSummary.missedToday + input.medicationSummary.skippedToday;
    return `You have ${attentionCount} medication log${
      attentionCount === 1 ? "" : "s"
    } that need attention today. Review the reminder panel and confirm whether each dose was missed or skipped.`;
  }

  if (nextAppointment) {
    return `Your next appointment is ${formatDate(nextAppointment.appointmentAt)} at ${getAppointmentTimeLabel(
      nextAppointment.appointmentAt,
      "12h",
    )}. Review the location and any notes before you head out.`;
  }

  if (pendingRoutines > 0) {
    return `You still have ${pendingRoutines} wellness routine${
      pendingRoutines === 1 ? "" : "s"
    } left today. A short, steady session can help keep your progress on track.`;
  }

  const nextMedication = input.medications.find((item) => item.isActive) ?? input.medications[0];

  if (nextMedication) {
    return `${nextMedication.name} is still on today's plan. Keep water nearby and review the next reminder time so the dose is easier to complete on schedule.`;
  }

  return "You're on track today. Review your schedule once more this evening so tomorrow starts smoothly.";
}

function getLogReferenceDate(log: MedicationLogRecord) {
  return new Date(log.takenAt || log.scheduledFor || log.createdAt);
}

function getSlotKey(value: Date) {
  return `${`${value.getHours()}`.padStart(2, "0")}:${`${value.getMinutes()}`.padStart(2, "0")}`;
}

function normalizeTimeSlot(value: string) {
  const [hours, minutes] = value.split(":");
  return `${`${Number(hours)}`.padStart(2, "0")}:${`${Number(minutes)}`.padStart(2, "0")}`;
}
