"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { PatientDashboardData, ActivityPlanRecord } from "@/lib/medic-types";
import {
  Sun, QrCode, UserRound, Bell, Bot,
  House, Clock, Heart, User, X, Check,
  CalendarDays, Stethoscope, MapPin, AlarmClock, Pill, WandSparkles,
} from "lucide-react";

// Helpers 
function statusPillClass(status: string): string {
  switch (status.toLowerCase()) {
    case "scheduled": return "pd-status-scheduled";
    case "completed":  return "pd-status-completed";
    case "cancelled":  return "pd-status-cancelled";
    case "pending":    return "pd-status-pending";
    default:           return "pd-status-default";
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

  const handleMissedClick = async () => {
    if (!showMissed && !missedLogs) {
      setLoadingMissed(true);
      try {
        const res = await fetch("/api/medication-logs");
        const json = await res.json();
        setMissedLogs((json?.logs ?? []).filter((l: any) => l.status === "missed"));
      } catch { setMissedLogs([]); }
      finally { setLoadingMissed(false); }
    }
    setShowMissed(!showMissed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="pd-modal-sheet" onClick={(e) => e.stopPropagation()}>

        <div className="flex justify-end mb-2">
          <button onClick={onClose} className="w-8 h-8 rounded-full border border-[#2F3E34] flex items-center justify-center hover:bg-[#E5E7EB] transition" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <h2 className="pd-modal-title">{med.name}</h2>
        <p className="text-[13px] opacity-70 mb-1">
          {med.scheduleFrequencyType
            ? med.scheduleFrequencyType.charAt(0).toUpperCase() + med.scheduleFrequencyType.slice(1)
            : "—"} | {med.dosageValue} {med.dosageUnit ?? ""}
        </p>
        {med.createdByDisplayName && (
          <p className="text-[13px] opacity-60 mb-5">Prescribed by: {med.createdByDisplayName}</p>
        )}

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="pd-modal-info-tile">
            <Pill className="w-7 h-7 flex-shrink-0" />
            <div>
              <p className="text-[17px] font-bold leading-tight">{med.dosageValue} {med.form}</p>
              <p className="text-[13px] opacity-60">
                {med.scheduleFrequencyType
                  ? med.scheduleFrequencyType.charAt(0).toUpperCase() + med.scheduleFrequencyType.slice(1)
                  : "—"}
              </p>
            </div>
          </div>
          <div className="pd-modal-info-tile">
            <AlarmClock className="w-7 h-7 flex-shrink-0" />
            <div>
              <p className="text-[13px] opacity-60">Every</p>
              <p className="text-[17px] font-bold leading-tight">
                {med.scheduleTimes.length > 1 ? `${Math.round(24 / med.scheduleTimes.length)} Hours` : "24 Hours"}
              </p>
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

        <p className="text-[13px] font-bold mb-2">Tracker:</p>
        <div className="flex gap-3 mb-2">
          <div className="pd-tracker-tile">
            <Pill className="w-5 h-5" />
            <p className="text-[18px] font-bold">{taken} / {summary.activeMedications}</p>
            <p className="text-[13px] opacity-60">Taken</p>
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

        {showMissed && (
          <div className="pd-missed-panel">
            <div className="px-4 py-2 border-b border-[#D97B7B]/20">
              <p className="text-[13px] font-bold text-[#D97B7B]">Missed Doses</p>
            </div>
            {loadingMissed ? (
              <p className="text-[13px] opacity-50 px-4 py-3">Loading…</p>
            ) : !missedLogs || missedLogs.length === 0 ? (
              <p className="text-[13px] opacity-50 px-4 py-3">No missed doses recorded.</p>
            ) : (
              <div className="flex flex-col divide-y divide-[#D97B7B]/10">
                {missedLogs.map((log) => {
                  const dt = new Date(log.scheduledFor ?? log.createdAt);
                  const dateStr = dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Manila" });
                  const timeStr = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Manila" });
                  return (
                    <div key={log.id} className="px-4 py-3 flex justify-between items-start">
                      <div>
                        <p className="text-[13px] font-semibold">{log.medicationName}</p>
                        {log.notes && <p className="text-[13px] opacity-60 mt-0.5">{log.notes}</p>}
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="text-[13px] font-semibold opacity-70">{dateStr}</p>
                        <p className="text-[13px] opacity-50">{timeStr}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {!showMissed && <div className="mb-6" />}
        <p className="text-[13px] font-bold mb-2">Notes:</p>
        <div className="pd-notes-box">{med.instructions || "No notes available"}</div>
      </div>
    </div>
  );
}

// Appointment Modal 
function AppointmentModal({
  appt, onClose,
}: {
  appt: PatientDashboardData["appointments"][0];
  onClose: () => void;
}) {
  const dt = new Date(appt.appointmentAt);
  const dateLabel = dt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "Asia/Manila" });
  const timeLabel = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Manila" });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="pd-modal-sheet" onClick={(e) => e.stopPropagation()}>

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
