"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock3,
  Pill,
  UserRound,
  X,
  MapPin,
} from "lucide-react";

import { PatientBottomNav } from "@/components/patient-bottom-nav";
import {
  formatClockTime,
  formatDate,
  formatDateTime,
  formatFrequencyLabel,
  formatStatusLabel,
  formatTimeList,
} from "@/lib/display";
import {
  getMedicationDoseLimitForDate,
  getMedicationLogsForDate,
  getNextReminderSlot,
  getTakenCountForDate,
} from "@/lib/medication-reminders";
import type {
  AppointmentRecord,
  MedicationLogRecord,
  MedicationRecord,
  TimeFormatPreference,
} from "@/lib/medic-types";

type ScheduleView = "appointments" | "medications";

type PatientScheduleManagerProps = {
  appointments: AppointmentRecord[];
  initialAppointmentId?: string | null;
  initialMedicationId?: string | null;
  initialView: ScheduleView;
  medicationLogs: MedicationLogRecord[];
  medications: MedicationRecord[];
  patientName: string;
  profileImageDataUrl: string | null;
  timeFormat: TimeFormatPreference;
};

function formatTimeForPreference(date: Date, timeFormat: TimeFormatPreference) {
  return new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    hour12: timeFormat !== "24h",
    minute: "2-digit",
  }).format(date);
}

function getAppointmentTimeLabel(
  appointmentAt: string,
  timeFormat: TimeFormatPreference,
) {
  const date = new Date(appointmentAt);

  if (Number.isNaN(date.getTime())) {
    return appointmentAt;
  }

  return formatTimeForPreference(date, timeFormat);
}

function getAppointmentDayLabel(appointmentAt: string) {
  const date = new Date(appointmentAt);

  if (Number.isNaN(date.getTime())) {
    return "Scheduled";
  }

  return new Intl.DateTimeFormat("en-PH", {
    day: "numeric",
    month: "short",
    weekday: "short",
  }).format(date);
}

function getMedicationStatusTone(status: "attention" | "pending" | "taken") {
  switch (status) {
    case "taken":
      return "bg-[#4D6A56] text-white";
    case "attention":
      return "bg-[rgba(214,128,96,0.15)] text-[rgb(130,70,43)]";
    default:
      return "bg-[#E7ECE9] text-[#56625A]";
  }
}

function getAppointmentStatusTone(status: string) {
  switch (status) {
    case "completed":
      return "bg-[rgba(92,139,107,0.12)] text-[rgb(57,96,72)]";
    case "cancelled":
      return "bg-[rgba(214,128,96,0.12)] text-[rgb(130,70,43)]";
    default:
      return "bg-[rgba(91,132,170,0.12)] text-[rgb(57,83,107)]";
  }
}

export function PatientScheduleManager({
  appointments,
  initialAppointmentId = null,
  initialMedicationId = null,
  initialView,
  medicationLogs,
  medications,
  patientName,
  profileImageDataUrl,
  timeFormat,
}: PatientScheduleManagerProps) {
  const router = useRouter();
  const today = new Date();
  const activeMedications = medications.filter((item) => item.isActive);
  const validInitialMedicationId =
    initialMedicationId && activeMedications.some((item) => item.id === initialMedicationId)
      ? initialMedicationId
      : null;
  const validInitialAppointmentId =
    initialAppointmentId && appointments.some((item) => item.id === initialAppointmentId)
      ? initialAppointmentId
      : null;
  const [activeView, setActiveView] = useState<ScheduleView>(initialView);
  const [selectedMedicationId, setSelectedMedicationId] = useState<string | null>(
    validInitialMedicationId ?? activeMedications[0]?.id ?? null,
  );
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(
    validInitialAppointmentId ?? appointments[0]?.id ?? null,
  );
  const [detailType, setDetailType] = useState<"appointment" | "medication" | null>(
    validInitialAppointmentId
      ? "appointment"
      : validInitialMedicationId
        ? "medication"
        : null,
  );

  const selectedMedication =
    activeMedications.find((item) => item.id === selectedMedicationId) ?? null;
  const selectedAppointment =
    appointments.find((item) => item.id === selectedAppointmentId) ?? null;

  const sortedMedicationEntries = activeMedications
    .map((item) => ({
      item,
      nextSlot: getNextReminderSlot(item, medicationLogs, today),
    }))
    .sort((left, right) => {
      if (left.nextSlot && right.nextSlot) {
        return left.nextSlot.getTime() - right.nextSlot.getTime();
      }

      if (left.nextSlot) {
        return -1;
      }

      if (right.nextSlot) {
        return 1;
      }

      return left.item.name.localeCompare(right.item.name);
    });

  function updateRoute(next: {
    appointmentId?: string | null;
    detailType?: "appointment" | "medication" | null;
    medicationId?: string | null;
    view: ScheduleView;
  }) {
    const params = new URLSearchParams();
    params.set("view", next.view);

    if (next.detailType === "appointment" && next.appointmentId) {
      params.set("appointmentId", next.appointmentId);
    }

    if (next.detailType === "medication" && next.medicationId) {
      params.set("medicationId", next.medicationId);
    }

    router.replace(`/patient/schedule?${params.toString()}`, { scroll: false });
  }

  function showMedication(medicationId: string) {
    setActiveView("medications");
    setSelectedMedicationId(medicationId);
    setDetailType("medication");
    updateRoute({
      detailType: "medication",
      medicationId,
      view: "medications",
    });
  }

  function showAppointment(appointmentId: string) {
    setActiveView("appointments");
    setSelectedAppointmentId(appointmentId);
    setDetailType("appointment");
    updateRoute({
      appointmentId,
      detailType: "appointment",
      view: "appointments",
    });
  }

  function switchView(view: ScheduleView) {
    setActiveView(view);
    setDetailType(null);
    updateRoute({
      detailType: null,
      view,
    });
  }

  function closeDetail() {
    setDetailType(null);
    updateRoute({
      detailType: null,
      view: activeView,
    });
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#EFF3F1] px-5 pb-32 pt-12 font-sans text-[#1A231D]">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#73847B]">
            Patient schedule
          </p>
          <h1 className="mt-2 text-[28px] font-extrabold tracking-tight">
            {patientName || "Patient"}
          </h1>
        </div>

        <Link
          href="/profile"
          className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-black/5 bg-[#DCE4DE] shadow-sm"
        >
          {profileImageDataUrl ? (
            <Image
              src={profileImageDataUrl}
              alt={`${patientName} avatar`}
              width={44}
              height={44}
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            <UserRound className="h-5 w-5 text-[#4D6A56]" />
          )}
        </Link>
      </header>

      <div className="mb-8 flex gap-3">
        <button
          type="button"
          onClick={() => switchView("medications")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-[12px] py-4 text-[11px] font-bold uppercase tracking-widest transition-all ${
            activeView === "medications"
              ? "bg-[#4D6A56] text-white shadow-lg"
              : "border border-[#D9E0DC] bg-[#F1F3F2] text-[#1A231D]"
          }`}
        >
          <Pill className="h-4 w-4 -rotate-45" />
          View Medication
        </button>
        <button
          type="button"
          onClick={() => switchView("appointments")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-[12px] py-4 text-[11px] font-bold uppercase tracking-widest transition-all ${
            activeView === "appointments"
              ? "bg-[#4D6A56] text-white shadow-lg"
              : "border border-[#D9E0DC] bg-[#F1F3F2] text-[#1A231D]"
          }`}
        >
          <Calendar className="h-4 w-4" />
          View Schedule
        </button>
      </div>

      {detailType === "medication" && selectedMedication ? (
        <MedicationDetailView
          item={selectedMedication}
          logs={medicationLogs}
          onClose={closeDetail}
        />
      ) : null}

      {detailType === "appointment" && selectedAppointment ? (
        <AppointmentDetailView
          appointment={selectedAppointment}
          onClose={closeDetail}
          timeFormat={timeFormat}
        />
      ) : null}

      {detailType ? null : activeView === "medications" ? (
        <section className="grid gap-4">
          {sortedMedicationEntries.length === 0 ? (
            <EmptyCard
              description="No active medications are scheduled right now."
              title="Medication schedule is empty"
            />
          ) : (
            sortedMedicationEntries.map(({ item, nextSlot }) => {
              const takenCountToday = getTakenCountForDate(item, medicationLogs, today);
              const doseLimitToday = getMedicationDoseLimitForDate(item, today);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => showMedication(item.id)}
                  className="w-full rounded-[20px] bg-[#F1F3F2] p-6 text-left shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all hover:bg-[#E8EBE9] active:scale-[0.98]"
                >
                  <div className="mb-2 text-[14px] font-bold tracking-tight text-[#1A231D]">
                    {nextSlot
                      ? formatTimeForPreference(nextSlot, timeFormat)
                      : formatTimeList(item.scheduleTimes)}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#384D4D]/10">
                      <Pill className="h-5 w-5 -rotate-45 text-[#384D4D]" />
                    </div>
                    <div>
                      <h2 className="mb-1 text-[24px] font-extrabold leading-none tracking-tight text-[#1A231D]">
                        {item.name}
                      </h2>
                      <p className="text-[13px] font-semibold text-[#5C665F]">
                        {item.dosageValue}
                        {item.dosageUnit ? ` ${item.dosageUnit}` : ""} {item.form} |{" "}
                        {formatFrequencyLabel(item.scheduleFrequencyType)}
                      </p>
                      <p className="mt-1 text-[12px] font-medium text-[#73847B]">
                        {takenCountToday}/{doseLimitToday} doses logged today
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </section>
      ) : (
        <section className="grid gap-4">
          {appointments.length === 0 ? (
            <EmptyCard
              description="No appointments have been scheduled yet."
              title="Appointment schedule is empty"
            />
          ) : (
            appointments.map((appointment) => (
              <button
                key={appointment.id}
                type="button"
                onClick={() => showAppointment(appointment.id)}
                className="relative w-full rounded-[20px] border-l-[6px] border-l-[#4D6A56] bg-white p-5 text-left shadow-[0_4px_12px_rgba(0,0,0,0.03)] transition-all hover:bg-[#FBFCFB] active:scale-[0.98]"
              >
                <div className="mb-1 flex items-start justify-between">
                  <div className="flex items-center gap-2 text-[#4D6A56]">
                    <Calendar className="h-4 w-4" />
                    <span className="text-[12px] font-bold">
                      {getAppointmentDayLabel(appointment.appointmentAt)} /{" "}
                      {getAppointmentTimeLabel(appointment.appointmentAt, timeFormat)}
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${getAppointmentStatusTone(appointment.status)}`}
                  >
                    {formatStatusLabel(appointment.status)}
                  </span>
                </div>
                <h2 className="mb-1 text-[18px] font-bold text-[#1A231D]">
                  {appointment.title || "Appointment"}
                </h2>
                <p className="mb-3 text-[13px] leading-snug text-[#73847B]">
                  {appointment.notes || "Appointment details will appear here."}
                </p>
                <div className="flex items-center gap-1.5 text-[#73847B]">
                  <MapPin className="h-4 w-4" />
                  <span className="text-[12px] font-medium">
                    {appointment.location || "Location pending"}
                  </span>
                </div>
              </button>
            ))
          )}
        </section>
      )}

      <PatientBottomNav activeItem="schedule" />
    </main>
  );
}

function MedicationDetailView(props: {
  item: MedicationRecord;
  logs: MedicationLogRecord[];
  onClose: () => void;
}) {
  const today = new Date();
  const todayLogs = getMedicationLogsForDate(props.logs, props.item.id, today);
  const takenCountToday = getTakenCountForDate(props.item, props.logs, today);
  const doseLimitToday = getMedicationDoseLimitForDate(props.item, today);
  const attentionCountToday = todayLogs.filter((log) => log.status !== "taken").length;
  const totalLoggedCount = props.logs.filter((log) => log.medicationId === props.item.id).length;

  return (
    <section className="absolute inset-0 z-40 overflow-y-auto bg-[#EFF3F1] px-5 pb-32 pt-12">
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={props.onClose}
          className="rounded-full border-[1.5px] border-[#1A231D] p-1 text-[#1A231D] hover:bg-black/5"
        >
          <X className="h-6 w-6" strokeWidth={2} />
        </button>
      </div>

      <div className="mb-6">
        <h2 className="mb-1 text-[36px] font-extrabold tracking-tight text-[#384D4D]">
          {props.item.name}
        </h2>
        <p className="text-[14px] font-bold text-[#1A231D]">
          {props.item.form} | {props.item.dosageValue}
          {props.item.dosageUnit ? ` ${props.item.dosageUnit}` : ""}
        </p>
        <p className="text-[13px] font-medium text-[#73847B]">
          Added by: {props.item.createdByDisplayName}
        </p>
      </div>

      <div className="mb-8 flex gap-3">
        <div className="flex flex-1 items-center gap-3 rounded-[16px] border border-[#D9E0DC] bg-[#F1F3F2] p-4">
          <Pill className="h-6 w-6 -rotate-45 text-[#1A231D]" strokeWidth={2.5} />
          <div>
            <div className="text-[18px] font-bold text-[#1A231D]">
              {doseLimitToday}
            </div>
            <div className="text-[11px] font-bold text-[#73847B]">Doses today</div>
          </div>
        </div>

        <div className="flex flex-1 items-center gap-3 rounded-[16px] border border-[#D9E0DC] bg-[#F1F3F2] p-4">
          <Clock3 className="h-6 w-6 text-[#1A231D]" />
          <div>
            <div className="text-[11px] font-bold uppercase leading-none text-[#73847B]">
              Frequency
            </div>
            <div className="text-[18px] font-bold text-[#1A231D]">
              {formatFrequencyLabel(props.item.scheduleFrequencyType)}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="mb-4 text-[16px] font-bold tracking-tight text-[#1A231D]">
          Schedule
        </h3>
        <div className="flex flex-col gap-3">
          {props.item.scheduleTimes.map((time, index) => {
            const status =
              index < takenCountToday
                ? "taken"
                : index < takenCountToday + attentionCountToday
                  ? "attention"
                  : "pending";

            return (
              <div
                key={`${props.item.id}-${time}-${index}`}
                className="flex h-[56px] items-center justify-between rounded-[16px] border border-[#D9E0DC] bg-[#F1F3F2] p-5"
              >
                <span className="text-[16px] font-bold text-[#1A231D]">
                  {formatClockTime(time)}
                </span>
                <div
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-black uppercase tracking-widest ${getMedicationStatusTone(status)}`}
                >
                  {status === "taken" ? <CheckCircle2 className="h-4 w-4" strokeWidth={3} /> : null}
                  <span>
                    {status === "taken"
                      ? "Taken"
                      : status === "attention"
                        ? "Attention"
                        : "Pending"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-8 rounded-[20px] border border-[#D9E0DC] bg-[#F1F3F2] p-5">
        <h3 className="text-[16px] font-bold tracking-tight text-[#1A231D]">
          Details
        </h3>
        <div className="mt-4 grid gap-3 text-[13px] text-[#5C665F]">
          <p>Days: {props.item.scheduleDays.length > 0 ? props.item.scheduleDays.join(", ") : "Every day"}</p>
          <p>Times: {formatTimeList(props.item.scheduleTimes)}</p>
          <p>Instructions: {props.item.instructions || "No extra instructions."}</p>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-[16px] font-bold tracking-tight text-[#1A231D]">
          Tracker
        </h3>
        <div className="flex gap-4">
          <div className="flex-1 rounded-[20px] border border-[#D9E0DC] bg-[#F1F3F2] p-5">
            <Pill className="mb-3 h-5 w-5 -rotate-45 text-[#1A231D]" />
            <div className="mb-1 text-[28px] font-bold leading-none text-[#1A231D]">
              {takenCountToday} / {doseLimitToday}
            </div>
            <div className="text-[12px] font-bold text-[#73847B]">Taken today</div>
          </div>
          <div className="flex-1 rounded-[20px] border border-[#D9E0DC] bg-[#F1F3F2] p-5">
            <Calendar className="mb-3 h-5 w-5 text-[#1A231D]" />
            <div className="mb-1 text-[28px] font-bold leading-none text-[#1A231D]">
              {totalLoggedCount}
            </div>
            <div className="text-[12px] font-bold text-[#73847B]">Total logs</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AppointmentDetailView(props: {
  appointment: AppointmentRecord;
  onClose: () => void;
  timeFormat: TimeFormatPreference;
}) {
  return (
    <section className="absolute inset-0 z-40 overflow-y-auto bg-[#EFF3F1] px-5 pb-32 pt-12">
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={props.onClose}
          className="rounded-full border-[1.5px] border-[#1A231D] p-1 text-[#1A231D] hover:bg-black/5"
        >
          <X className="h-6 w-6" strokeWidth={2} />
        </button>
      </div>

      <div className="mb-6">
        <h2 className="mb-1 text-[36px] font-extrabold tracking-tight text-[#384D4D]">
          {props.appointment.title}
        </h2>
        <p className="text-[14px] font-bold text-[#1A231D]">
          {formatDate(props.appointment.appointmentAt)} |{" "}
          {getAppointmentTimeLabel(props.appointment.appointmentAt, props.timeFormat)}
        </p>
        <p className="text-[13px] font-medium text-[#73847B]">
          {props.appointment.providerName || "Provider pending"}
        </p>
      </div>

      <div className="mb-8 flex gap-3">
        <div className="flex flex-1 items-center gap-3 rounded-[16px] border border-[#D9E0DC] bg-[#F1F3F2] p-4">
          <Calendar className="h-6 w-6 text-[#1A231D]" />
          <div>
            <div className="text-[11px] font-bold uppercase leading-none text-[#73847B]">
              Date
            </div>
            <div className="text-[18px] font-bold text-[#1A231D]">
              {formatDate(props.appointment.appointmentAt)}
            </div>
          </div>
        </div>

        <div className="flex flex-1 items-center gap-3 rounded-[16px] border border-[#D9E0DC] bg-[#F1F3F2] p-4">
          <Clock3 className="h-6 w-6 text-[#1A231D]" />
          <div>
            <div className="text-[11px] font-bold uppercase leading-none text-[#73847B]">
              Time
            </div>
            <div className="text-[18px] font-bold text-[#1A231D]">
              {getAppointmentTimeLabel(props.appointment.appointmentAt, props.timeFormat)}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 rounded-[20px] border border-[#D9E0DC] bg-[#F1F3F2] p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-[16px] font-bold tracking-tight text-[#1A231D]">
            Appointment summary
          </h3>
          <span
            className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${getAppointmentStatusTone(props.appointment.status)}`}
          >
            {formatStatusLabel(props.appointment.status)}
          </span>
        </div>

        <div className="mt-4 grid gap-3 text-[13px] text-[#5C665F]">
          <p>Provider: {props.appointment.providerName || "Provider pending"}</p>
          <p>Location: {props.appointment.location || "Location pending"}</p>
          <p>Notes: {props.appointment.notes || "No additional notes yet."}</p>
          <p>Scheduled: {formatDateTime(props.appointment.appointmentAt)}</p>
        </div>
      </div>

      <div className="rounded-[20px] border border-[#D9E0DC] bg-[#F1F3F2] p-5">
        <h3 className="text-[16px] font-bold tracking-tight text-[#1A231D]">
          What to remember
        </h3>
        <div className="mt-4 grid gap-3 text-[13px] leading-6 text-[#5C665F]">
          <p>Bring your medication list and updated health information if asked.</p>
          <p>Check the appointment status before leaving so cancellations are visible.</p>
          <p>Confirm the time, location, and transport plan before you head out.</p>
        </div>
      </div>
    </section>
  );
}

function EmptyCard(props: { description: string; title: string }) {
  return (
    <article className="rounded-[20px] border border-[#D9E0DC] bg-[#F1F3F2] p-6 shadow-sm">
      <h2 className="text-[18px] font-bold text-[#1A231D]">{props.title}</h2>
      <p className="mt-2 text-[13px] leading-6 text-[#73847B]">{props.description}</p>
    </article>
  );
}
