"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MedicationReminderPanel } from "@/components/medication-reminder-panel";
import {
  getActivitySummary,
  getMedicationAdherenceSummary,
  getPatientDashboardData,
  listMedicationLogsForPatient,
} from "@/lib/db/medic-data";
import { formatDate, formatTimeList } from "@/lib/display";
import { getNextReminderSlot } from "@/lib/medication-reminders";
import { requireRole } from "@/lib/auth/dal";

export default async function PatientDashboardPage() {
  const user = await requireRole("patient");
  const [dashboard, medicationLogs, activitySummary, medicationSummary] = await Promise.all([
    getPatientDashboardData(user.userId),
    listMedicationLogsForPatient(user.userId, 12),
    getActivitySummary(user.userId),
    getMedicationAdherenceSummary(user.userId),
  ]);

  if (!dashboard) {
    return null;
  }
}

// Medication Modal 
function MedicationModal({
  med, summary, onClose,
}: {
  med: PatientDashboardData["medications"][0];
  summary: PatientDashboardData["medicationSummary"];
  onClose: () => void;
}) {
  const [showMissed, setShowMissed] = useState(false);
  const [missedLogs, setMissedLogs] = useState<Array<{
    id: string; medicationName: string; scheduledFor: string | null;
    takenAt: string | null; status: string; notes: string | null; createdAt: string;
  }> | null>(null);
  const [loadingMissed, setLoadingMissed] = useState(false);

  const taken = summary.takenToday;
  const missed = Math.max(0, summary.activeMedications - summary.takenToday);

  // Get next medication and appointment for the display cards
  const nextMedicationEntry =
    dashboard.medications
      .filter((item) => item.isActive)
      .map((item) => ({
        item,
        nextSlot: getNextReminderSlot(item, medicationLogs, today),
      }))
      .filter(
        (
          entry,
        ): entry is {
          item: (typeof dashboard.medications)[number];
          nextSlot: Date;
        } => entry.nextSlot instanceof Date,
      )
      .sort((left, right) => left.nextSlot.getTime() - right.nextSlot.getTime())[0] ?? null;
  const nextMedication = nextMedicationEntry?.item ?? dashboard.medications[0] ?? null;
  const nextMedicationTimeLabel = nextMedicationEntry
    ? new Intl.DateTimeFormat("en-PH", {
        hour: "numeric",
        hour12: user.preferences.timeFormat !== "24h",
        minute: "2-digit",
      }).format(nextMedicationEntry.nextSlot)
    : nextMedication
      ? formatTimeList(nextMedication.scheduleTimes)
      : "Not scheduled";
  const nextAppointment = dashboard.appointments[0];
  const takenMedicationCount = Math.min(
    medicationSummary.takenToday,
    medicationSummary.dueToday,
  );
  const medicationAttentionCount = Math.min(
    medicationSummary.missedToday + medicationSummary.skippedToday,
    Math.max(medicationSummary.dueToday - takenMedicationCount, 0),
  );
  const medicationPendingCount = Math.max(
    medicationSummary.dueToday -
      takenMedicationCount -
      medicationAttentionCount,
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
  const appointmentScheduleHref = nextAppointment
    ? `/patient/schedule?view=appointments&appointmentId=${nextAppointment.id}`
    : "/patient/schedule?view=appointments";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="pd-modal-sheet" onClick={(e) => e.stopPropagation()}>

        <div className="flex justify-end mb-2">
          <button onClick={onClose} className="w-8 h-8 rounded-full border border-[#2F3E34] flex items-center justify-center hover:bg-[#E5E7EB] transition" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
          <Link
            href="/profile"
            className="w-[42px] h-[42px] bg-black rounded-full flex items-center justify-center shadow-md overflow-hidden border-2 border-transparent"
          >
            {user.profileImageDataUrl ? (
              <Image
                src={user.profileImageDataUrl}
                alt={`${user.firstName} ${user.lastName} profile photo`}
                width={42}
                height={42}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              <UserSolidIcon className="w-6 h-6 text-white" />
            )}
          </Link>
        </div>

      <div className="flex flex-col gap-4">
        
        {/* Medicine Taken Today Card */}
        <div className="bg-[#568164] text-white rounded-[24px] p-5 shadow-[0_4px_12px_rgba(86,129,100,0.2)] relative overflow-hidden">
          <PillIcon className="absolute top-4 right-4 w-6 h-6 opacity-80" />
          <h2 className="text-[15px] font-medium mb-1">Medicine Taken today</h2>
          <p className="text-[40px] font-light tracking-wide flex items-baseline gap-2">
            {medicationSummary.takenToday}
            <span className="text-[22px] font-normal opacity-90">/ {medicationSummary.dueToday}</span>
          </p>
        </div>

        {/* Next Medication Card */}
        <div className="bg-[#FAFBF9] rounded-[24px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex justify-between items-start">
          <div>
            <h2 className="text-[16px] font-bold text-[#1A231D] mb-1">Next Medication:</h2>
            <p className="text-sm text-[#73847B]">
              {nextMedication
                ? `${nextMedication.name} is the next scheduled dose`
                : "No medications scheduled today"}
            </p>
          </div>
          {nextMedication && (
            <div className="flex items-center gap-2 text-[#1A231D]">
              <span className="text-[15px] font-semibold">
                {nextMedicationTimeLabel}
              </span>
              <BellIcon className="w-5 h-5" />
            </div>
          </div>
        </div>

        <p className="text-[13px] font-bold mb-2">Schedule:</p>
        <div className="flex flex-col gap-2 mb-6">
          {med.scheduleTimes.length > 0 ? med.scheduleTimes.map((t, i) => {
            const [h, m] = t.split(":").map(Number);
            const label = `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
            const isTaken = i === 0 && med.latestLogStatus === "taken";
            return (
              <div key={t} className="pd-schedule-row">
                <span className="text-[15px] font-semibold">{label}</span>
                {isTaken && (
                  <span className="flex items-center gap-1 bg-[#4A7C59] text-white text-[13px] font-bold px-3 py-1 rounded-full">
                    <Check className="w-3 h-3" /> TAKEN
                  </span>
                )}
              </div>
            );
          }) : (
            <div className="pd-schedule-row opacity-60 text-[13px]">No schedule set</div>
          )}
        </div>

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

        {/* AI Recommendation Card */}
        <div className="bg-[#FAFBF9] rounded-[24px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-2.5 mb-2">
            <RobotIcon className="w-[22px] h-[22px] text-[#1A231D]" />
            <h2 className="text-[16px] font-bold text-[#1A231D]">AI Recommendation</h2>
          </div>
          {missed > 0 ? (
            <button className="pd-tracker-tile text-left hover:bg-[#FEE2E2] transition" onClick={handleMissedClick}>
              <Pill className="w-5 h-5 text-[#D97B7B]" />
              <p className="text-[18px] font-bold text-[#D97B7B]">{missed}</p>
              <p className="text-[13px] text-[#D97B7B]/70 flex items-center gap-1">
                Missed <span>{showMissed ? "▲" : "▼"}</span>
              </p>
            </button>
          ) : (
            <div className="pd-tracker-tile opacity-40">
              <Pill className="w-5 h-5" />
              <p className="text-[18px] font-bold">0</p>
              <p className="text-[13px]">Missed</p>
            </div>
          )}
        </div>

        {/* Upcoming Appointments Section */}
        <div className="mt-3 flex items-center justify-between px-1">
          <h3 className="text-[18px] font-bold text-[#1A231D]">
          Upcoming Appointments:
          </h3>
          <Link
            href={appointmentScheduleHref}
            className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#568164]"
          >
            View schedule
          </Link>
        </div>

        {dashboard.appointments.length === 0 ? (
           <div className="bg-[#FAFBF9] rounded-[24px] p-5 shadow-sm text-sm text-[#73847B] text-center">
             No upcoming appointments.
           </div>
        ) : (
          <Link
            href={appointmentScheduleHref}
            className="block bg-[#FAFBF9] rounded-[24px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)]"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[15px] font-bold text-[#1A231D] block mb-0.5">
                  {formatDate(nextAppointment.appointmentAt)}
                </span>
                <h4 className="text-[16px] font-bold text-[#425F4C]">{nextAppointment.title}</h4>
              </div>
              <div className="flex items-center gap-2 text-[#1A231D]">
                <span className="text-[15px] font-semibold">
                   {getAppointmentTimeLabel(nextAppointment.appointmentAt, user.preferences.timeFormat)}
                </span>
                <BellIcon className="w-5 h-5" />
              </div>
            </div>
            <div className="text-[14px] text-[#4A5D52] space-y-1.5">
              <p><span className="text-[#73847B]">Doctor:</span> {nextAppointment.providerName || "Pending"}</p>
              <p><span className="text-[#73847B]">Location:</span> {nextAppointment.location || "Pending"}</p>
              <p className="pt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#568164]">
                Open appointment details
              </p>
            </div>
          </Link>
        )}

        {/* Progress Summary Section */}
        <h3 className="text-[18px] font-bold text-[#1A231D] mt-3 mb-1 px-1">
          Progress Summary
        </h3>

        <div className="grid grid-cols-2 gap-4">
          
          {/* Donut Chart Card */}
          <div className="bg-[#FAFBF9] rounded-[24px] p-4 flex flex-col items-center shadow-[0_2px_10px_rgba(0,0,0,0.03)] aspect-[4/5] relative">
            <div
              className="relative mb-4 flex h-[130px] w-[130px] items-center justify-center rounded-full"
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

            {/* Legend */}
            <div className="flex w-full justify-between items-center px-1 mt-auto pb-1">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#8BA488]" />
                <span className="text-[9px] font-medium text-[#73847B]">Taken</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#F1D262]" />
                <span className="text-[9px] font-medium text-[#73847B]">Pending</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#D49191]" />
                <span className="text-[9px] font-medium text-[#73847B]">Attention</span>
              </div>
            </div>
          </div>

          {/* Workouts Completed Card */}
          <div className="bg-[#FAFBF9] rounded-[24px] shadow-[0_2px_10px_rgba(0,0,0,0.03)] p-5 flex flex-col items-center justify-between text-center min-h-[200px]">
            <div className="relative w-full h-[100px] mb-3 flex-shrink-0">
              {/* Ensure you have this illustration in your public folder */}
              <Image 
                src="/Blue-Simple-Elderly-Care-Logo.png" 
                alt="Stretching Progress" 
                fill
                className="object-contain"
              />
            </div>
            <div className="mt-auto flex flex-col items-center pb-1">
              <span className="text-[22px] font-bold text-[#1A231D] leading-none mb-1">
                {workoutProgressLabel}
              </span>
              <span className="text-[11px] text-[#73847B] font-medium leading-snug">
                Routines
                <br />
                Completed
              </span>
              <span className="mt-2 text-[10px] font-medium uppercase tracking-[0.16em] text-[#73847B]">
                {activitySummary.missedToday} missed today
              </span>
            </div>
          </div>

        <div className="flex justify-between items-center mb-4">
          <span className={`text-[13px] font-bold px-3 py-1 rounded-full ${statusPillClass(appt.status)}`}>
            {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
          </span>
          <button onClick={onClose} className="w-8 h-8 rounded-full border border-[#2F3E34] flex items-center justify-center hover:bg-[#E5E7EB] transition" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[13px] font-semibold opacity-70 mb-1">{dateLabel} {timeLabel}</p>
        <h2 className="pd-modal-title-lg">{appt.title}</h2>

        <div className="flex flex-col gap-2 mb-6">
          {appt.providerName && (
            <div className="flex items-center gap-2 text-[13px]">
              <Stethoscope className="w-4 h-4 opacity-60" />
              <span className="opacity-70">|</span>
              <span>{appt.providerName}</span>
            </div>
          )}
          {appt.location && (
            <div className="flex items-center gap-2 text-[13px]">
              <MapPin className="w-4 h-4 opacity-60" />
              <span className="opacity-70">|</span>
              <span>{appt.location}</span>
            </div>
          )}
        </div>

        <p className="text-[13px] font-bold mb-2">Notes:</p>
        <div className="pd-notes-box">{appt.notes || "No notes available"}</div>
      </div>
    </div>
  );
}

// Charts
function MedicationDonutChart({ taken, missed, pending, total }: {
  taken: number; missed: number; pending: number; total: number;
}) {
  const r = 36;
  const C = 2 * Math.PI * r;
  const safe = total || 1;
  const tLen = (taken   / safe) * C;
  const mLen = (missed  / safe) * C;
  const pLen = (pending / safe) * C;
  return (
    <div className="relative w-[110px] h-[110px] flex-shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <g transform="rotate(-90 50 50)">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#E5E7EB" strokeWidth="16" />
          {tLen > 0 && <circle cx="50" cy="50" r={r} fill="none" stroke="#4A7C59" strokeWidth="16" strokeDasharray={`${tLen} ${C}`} strokeDashoffset={0} />}
          {mLen > 0 && <circle cx="50" cy="50" r={r} fill="none" stroke="#D97B7B" strokeWidth="16" strokeDasharray={`${mLen} ${C}`} strokeDashoffset={-tLen} />}
          {pLen > 0 && <circle cx="50" cy="50" r={r} fill="none" stroke="#E9C46A" strokeWidth="16" strokeDasharray={`${pLen} ${C}`} strokeDashoffset={-(tLen + mLen)} />}
        </g>
      </svg>
    </div>
  );
}

function ActivityBarChart({ plans }: { plans: ActivityPlanRecord[] }) {
  const total     = plans.length || 1;
  const completed = plans.filter((p) => p.latestCompletionStatus === "done").length;
  const missed    = plans.filter((p) => p.latestCompletionStatus === "missed").length;
  const planned   = plans.filter((p) => p.latestCompletionStatus === "planned" || !p.latestCompletionStatus).length;
  const bars = [
    { label: "Done",    value: completed, color: "#4A7C59" },
    { label: "Planned", value: planned,   color: "#E9C46A" },
    { label: "Missed",  value: missed,    color: "#D97B7B" },
  ];
  const maxVal = Math.max(...bars.map((b) => b.value), 1);
  return (
    <div className="w-full flex-1 flex flex-col">
      <div className="flex items-end gap-3 flex-1">
        {bars.map((b) => (
          <div key={b.label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
            <span className="text-[13px] font-bold">{b.value}</span>
            <div className="w-full rounded-t-lg" style={{ background: b.color, height: `${Math.max(6, (b.value / maxVal) * 100)}%` }} />
            <span className="text-[13px] font-semibold opacity-60">{b.label}</span>
          </div>
        ))}
      </div>
      <p className="text-[13px] text-center opacity-50 mt-2">{completed} of {total} done</p>
    </div>
  );
}

// Main Page
export default function PatientDashboardPage() {
  const [data, setData] = useState<PatientDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);
  const [selectedMed, setSelectedMed] = useState<PatientDashboardData["medications"][0] | null>(null);
  const [selectedAppt, setSelectedAppt] = useState<PatientDashboardData["appointments"][0] | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard/patient").then((r) => r.json()),
      fetch("/api/wellness/recommendations").then((r) => r.json()),
    ]).then(([dashJson, recJson]) => {
      setData(dashJson?.data ?? dashJson);
      const rec = recJson?.recommendation ?? recJson?.summary ?? recJson?.message ?? null;
      setAiRecommendation(typeof rec === "string" ? rec : null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const today = new Date();
  const dateString = today.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "long", timeZone: "Asia/Manila" }).toUpperCase();

  const firstName = data?.user?.firstName || "User";
  const summary   = data?.medicationSummary ?? { activeMedications: 0, dueToday: 0, takenToday: 0 };

  const nowManila = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  const nextAppt  = (data?.appointments ?? []).filter((a) => a.status !== "cancelled" && new Date(a.appointmentAt) > nowManila)[0] ?? null;
  const nextMed   = data?.medications?.[0] ?? null;
  const actPlans  = data?.activityPlans ?? [];

  const taken   = summary.takenToday;
  const total   = summary.dueToday || summary.activeMedications;
  const missed  = Math.max(0, summary.activeMedications - taken);
  const pending = Math.max(0, total - taken);

  const nextMedTime = (() => {
    if (!nextMed?.scheduleTimes?.length) return null;
    const nowH = nowManila.getHours();
    const nowM = nowManila.getMinutes();
    const upcoming = nextMed.scheduleTimes.find((t) => {
      const [h, m] = t.split(":").map(Number);
      return h > nowH || (h === nowH && m > nowM);
    });
    const t = upcoming ?? nextMed.scheduleTimes[0];
    const [h, m] = t.split(":").map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
  })();

  const apptTime = nextAppt
    ? new Date(nextAppt.appointmentAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Manila" })
    : null;

  const apptIsToday = nextAppt
    ? new Date(nextAppt.appointmentAt).toLocaleDateString("en-US", { timeZone: "Asia/Manila" }) === today.toLocaleDateString("en-US", { timeZone: "Asia/Manila" })
    : false;

  const apptIsTomorrow = nextAppt && !apptIsToday ? (() => {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return new Date(nextAppt.appointmentAt).toLocaleDateString("en-US", { timeZone: "Asia/Manila" }) === tomorrow.toLocaleDateString("en-US", { timeZone: "Asia/Manila" });
  })() : false;

  const apptDayLabel = !nextAppt ? null
    : apptIsToday ? "Today"
    : apptIsTomorrow ? "Tomorrow"
    : new Date(nextAppt.appointmentAt).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "Asia/Manila" });

  return (
    <main className="pd-page">
      {/* Header */}
      <header className="flex justify-between items-start mb-5">
        <div>
          <h1 className="pd-heading">Welcome, {firstName}!</h1>
          <div className="pd-date">
            <Sun className="w-3.5 h-3.5" />
            <span>{dateString}</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="pd-icon-btn" aria-label="QR Code">
            <QrCode className="w-5 h-5" />
          </button>
          <Link href="/profile">
            <div className="pd-avatar">
              <UserRound className="w-5 h-5" />
            </div>
          </Link>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-[13px] opacity-50">Loading…</div>
      ) : (
        <div className="flex flex-col gap-3">

          {/* Medicine Taken Today */}
          <div className="pd-card-green p-5">
            <Pill className="absolute top-4 right-4 w-5 h-5 text-white/70" />
            <p className="text-[13px] font-semibold text-white/90 mb-1">Medicine Taken today</p>
            <p className="text-[42px] font-bold text-white leading-none" style={{ fontFamily: "var(--font-heading)" }}>
              {taken}<span className="text-[22px] font-semibold opacity-80"> / {total}</span>
            </p>
          </div>

          {/* Next Medication */}
          <div className="pd-card p-4 flex justify-between items-center cursor-pointer hover:opacity-90 transition"
            onClick={() => nextMed && setSelectedMed(nextMed)}>
            <div>
              <p className="text-[14px] font-bold">Next Medication:</p>
              <p className="text-[13px] mt-0.5 opacity-60">{nextMed ? nextMed.name : "No medications today"}</p>
            </div>
            {nextMedTime && (
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-bold">{nextMedTime}</span>
                <Bell className="w-4 h-4" />
              </div>
            )}
          </div>

          {/* AI Recommendation */}
          <div className="pd-card-dark p-5">
            <div className="pd-ai-glow" />
            <div className="flex items-start gap-4">
              <div className="pd-ai-icon-box">
                <Bot className="w-7 h-7 text-white" />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <span className="pd-ai-badge self-start">Medic AI</span>
                <p className="text-[18px] font-bold text-white leading-snug" style={{ fontFamily: "var(--font-heading)" }}>
                  Today&apos;s Recommendation
                </p>
                <p className="pd-ai-rec-text">
                  {aiRecommendation ?? "No recommendation available right now."}
                </p>
              </div>
              <WandSparkles className="w-6 h-6 flex-shrink-0 mt-0.5 text-white" />
            </div>
          </div>

          {/* Upcoming Appointments */}
          <h3 className="pd-section-heading">Upcoming Appointments</h3>

          {!nextAppt ? (
            <div className="pd-card p-4 text-[13px] text-center opacity-60">No upcoming appointments.</div>
          ) : (
            <div className="pd-card p-5 cursor-pointer hover:opacity-90 transition" onClick={() => setSelectedAppt(nextAppt)}>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div className="pd-appt-day-dot" />
                  <span className="text-[15px] font-bold">{apptDayLabel}</span>
                </div>
                <span className="text-[15px] font-bold">at {apptTime}</span>
              </div>
              <div className="flex items-start gap-3">
                <CalendarDays className="w-8 h-8 flex-shrink-0 mt-1" />
                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-[22px] font-bold leading-tight" style={{ fontFamily: "var(--font-heading)" }}>
                      {nextAppt.title}
                    </h4>
                    <span className={`text-[13px] font-bold px-2.5 py-0.5 rounded-full ${statusPillClass(nextAppt.status)}`}>
                      {nextAppt.status.charAt(0).toUpperCase() + nextAppt.status.slice(1)}
                    </span>
                  </div>
                  {nextAppt.providerName && (
                    <div className="flex items-center gap-2 text-[13px] opacity-70">
                      <Stethoscope className="w-4 h-4 flex-shrink-0" />
                      <span>|</span><span>{nextAppt.providerName}</span>
                    </div>
                  )}
                  {nextAppt.location && (
                    <div className="flex items-center gap-2 text-[13px] opacity-70">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span>|</span><span>{nextAppt.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Progress Summary */}
          <h3 className="pd-section-heading">Progress Summary</h3>

          <div className="pd-progress-grid">
            {/* Medication Donut */}
            <div className="pd-card p-4 flex flex-col gap-2 h-full">
              <div className="w-full text-center">
                <p className="text-[14px] font-bold">Medications</p>
                <p className="text-[22px] font-bold leading-tight" style={{ fontFamily: "var(--font-heading)" }}>
                  {taken}<span className="text-[15px] font-semibold opacity-60"> / {total}</span>
                </p>
                <p className="text-[13px] opacity-50">taken today</p>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <MedicationDonutChart taken={taken} missed={missed} pending={pending} total={total || 1} />
              </div>
              <div className="flex w-full justify-between px-40">
                {[{ color: "#4A7C59", label: "Taken" }, { color: "#E9C46A", label: "Pending" }, { color: "#D97B7B", label: "Missed" }].map((l) => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: l.color }} />
                    <span className="text-[13px] font-semibold opacity-70">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Bar Chart */}
            <div className="pd-card p-4 flex flex-col gap-2 h-full">
              <div className="w-full text-center">
                <p className="text-[14px] font-bold">Activities</p>
                <p className="text-[22px] font-bold leading-tight" style={{ fontFamily: "var(--font-heading)" }}>
                  {actPlans.filter((p) => p.latestCompletionStatus === "done").length}
                  <span className="text-[15px] font-semibold opacity-60"> / {actPlans.length}</span>
                </p>
                <p className="text-[13px] opacity-50">completed today</p>
              </div>
              <div className="flex-1 flex flex-col" style={{ minHeight: 0 }}>
                <ActivityBarChart plans={actPlans} />
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Bottom Nav */}
      <nav className="pd-nav">
        <div className="pd-nav-active">
          <Link href="/patient/dashboard" className="flex items-center justify-center w-full h-full">
            <House className="w-8 h-8" />
          </Link>
        </div>
        <Link href="/patient/schedule" className="pd-nav-link"><Clock className="w-7 h-7" /></Link>
        <Link href="/wellness" className="pd-nav-link"><Heart className="w-7 h-7" /></Link>
        <Link href="/profile" className="pd-nav-link"><User className="w-7 h-7" /></Link>
      </nav>

      {selectedMed && <MedicationModal med={selectedMed} summary={summary} onClose={() => setSelectedMed(null)} />}
      {selectedAppt && <AppointmentModal appt={selectedAppt} onClose={() => setSelectedAppt(null)} />}
    </main>
  );
}

function getAppointmentTimeLabel(value: string, timeFormat: "12h" | "24h") {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    hour12: timeFormat !== "24h",
    minute: "2-digit",
  }).format(date);
}

function getMedicationProgressStyle(props: {
  dueToday: number;
  pendingCount: number;
  takenCount: number;
}) {
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
