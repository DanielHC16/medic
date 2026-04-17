"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Sun, QrCode, UserRound, Bell, Pill, House, Clock, Heart,
  User, CalendarDays, Stethoscope, MapPin, AlertTriangle,
  Activity, UserPlus,
} from "lucide-react";
import { MedicationViewModal } from "@/components/medication-view-modal";
import { AppointmentViewModal } from "@/components/appointment-view-modal";
import type { CareMemberDashboardData, MedicationAdherenceSummary, MedicationLogRecord, MedicationRecord, AppointmentRecord, ActivitySummary } from "@/lib/medic-types";

function statusPillClass(status: string) {
  switch (status.toLowerCase()) {
    case "scheduled": return "pd-status-scheduled";
    case "completed":  return "pd-status-completed";
    case "cancelled":  return "pd-status-cancelled";
    default:           return "pd-status-default";
  }
}

function MedicationDonutChart({ taken, total }: { taken: number; total: number }) {
  const r = 36; const C = 2 * Math.PI * r; const safe = total || 1;
  const tLen = (taken / safe) * C; const pLen = C - tLen;
  return (
    <div className="relative w-[110px] h-[110px] flex-shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <g transform="rotate(-90 50 50)">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#E5E7EB" strokeWidth="16" />
          {tLen > 0 && <circle cx="50" cy="50" r={r} fill="none" stroke="#4A7C59" strokeWidth="16" strokeDasharray={`${tLen} ${C}`} strokeDashoffset={0} />}
          {pLen > 0 && <circle cx="50" cy="50" r={r} fill="none" stroke="#E9C46A" strokeWidth="16" strokeDasharray={`${pLen} ${C}`} strokeDashoffset={-tLen} />}
        </g>
      </svg>
    </div>
  );
}

function ActivityBarChart({ done, total }: { done: number; total: number }) {
  const pending = total - done;
  const bars = [{ label: "Done", value: done, color: "#4A7C59" }, { label: "Pending", value: pending, color: "#E9C46A" }];
  const maxVal = Math.max(done, pending, 1);
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
      <p className="text-[13px] text-center opacity-50 mt-2">{done} of {total} done</p>
    </div>
  );
}

export default function CaregiverDashboardPage() {
  const [dashboard, setDashboard] = useState<CareMemberDashboardData | null>(null);
  const [medicationSummary, setMedicationSummary] = useState<MedicationAdherenceSummary | null>(null);
  const [medicationLogs, setMedicationLogs] = useState<MedicationLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMed, setSelectedMed] = useState<MedicationRecord | null>(null);
  const [selectedAppt, setSelectedAppt] = useState<AppointmentRecord | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const patientId = params.get("patientId") ?? "";
    const qs = patientId ? `?patientId=${patientId}` : "";
    Promise.all([
      fetch(`/api/dashboard/caregiver${qs}`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/medication-logs${qs}`).then((r) => r.ok ? r.json() : null),
    ]).then(([dashJson, logsJson]) => {
      const data: CareMemberDashboardData = dashJson?.data ?? dashJson;
      setDashboard(data);
      setMedicationLogs(logsJson?.logs ?? []);
      if (data?.selectedPatient) {
        const s = data.selectedPatient.medicationSummary;
        setMedicationSummary({ activeMedications: s.activeMedications, dueToday: s.dueToday, takenToday: s.takenToday, loggedToday: 0, missedToday: 0, skippedToday: 0 });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const today = new Date();
  const dateString = today.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "long", timeZone: "Asia/Manila" }).toUpperCase();
  const nowManila = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  const nowH = nowManila.getHours(); const nowM = nowManila.getMinutes();

  const patient = dashboard?.selectedPatient ?? null;
  const summary = medicationSummary ?? { activeMedications: 0, dueToday: 0, takenToday: 0, loggedToday: 0, missedToday: 0, skippedToday: 0 };
  const medications = patient?.medications?.filter((m) => m.isActive) ?? [];
  const nextAppt = (patient?.appointments ?? []).filter((a) => a.status !== "cancelled" && new Date(a.appointmentAt) > nowManila)[0] ?? null;
  const actPlans = patient?.activityPlans ?? [];

  const taken = summary.takenToday;
  const total = summary.dueToday || summary.activeMedications;
  const actDone = actPlans.filter((p) => p.latestCompletionStatus === "done").length;

  const todayStr = today.toLocaleDateString("en-US", { timeZone: "Asia/Manila" });
  const missedLogs = medicationLogs.filter((l) => {
    if (l.status !== "missed") return false;
    return new Date(l.scheduledFor ?? l.createdAt).toLocaleDateString("en-US", { timeZone: "Asia/Manila" }) === todayStr;
  });

  const allSlots = medications.flatMap((med) => med.scheduleTimes.map((t) => ({ med, time: t }))).sort((a, b) => a.time.localeCompare(b.time));
  const nextSlot = allSlots.find(({ time }) => { const [h, m] = time.split(":").map(Number); return h > nowH || (h === nowH && m > nowM); }) ?? allSlots[0] ?? null;
  const nextMedTime = nextSlot ? (() => { const [h, m] = nextSlot.time.split(":").map(Number); return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`; })() : null;

  const apptTime = nextAppt ? new Date(nextAppt.appointmentAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Manila" }) : null;
  const apptIsToday = nextAppt ? new Date(nextAppt.appointmentAt).toLocaleDateString("en-US", { timeZone: "Asia/Manila" }) === todayStr : false;
  const apptIsTomorrow = nextAppt && !apptIsToday ? (() => { const t = new Date(today); t.setDate(t.getDate() + 1); return new Date(nextAppt.appointmentAt).toLocaleDateString("en-US", { timeZone: "Asia/Manila" }) === t.toLocaleDateString("en-US", { timeZone: "Asia/Manila" }); })() : false;
  const apptDayLabel = !nextAppt ? null : apptIsToday ? "Today" : apptIsTomorrow ? "Tomorrow" : new Date(nextAppt.appointmentAt).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "Asia/Manila" });

  const medModalData = nextSlot ? {
    name: nextSlot.med.name, type: nextSlot.med.scheduleFrequencyType ?? "Maintenance",
    dosage: nextSlot.med.dosageValue, unit: nextSlot.med.dosageUnit ?? "", form: nextSlot.med.form,
    prescriber: nextSlot.med.createdByDisplayName,
    intervalHours: nextSlot.med.scheduleTimes.length > 1 ? Math.round(24 / nextSlot.med.scheduleTimes.length) : 24,
    scheduleTimes: nextSlot.med.scheduleTimes.map((t) => { const [h, m] = t.split(":").map(Number); return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`; }),
    takenIndex: nextSlot.med.latestLogStatus === "taken" ? 0 : -1,
    taken: summary.takenToday, total: summary.activeMedications,
    missed: Math.max(0, summary.activeMedications - summary.takenToday),
    notes: nextSlot.med.instructions ?? "",
  } : null;

  const apptModalData = nextAppt ? {
    status: nextAppt.status,
    date: new Date(nextAppt.appointmentAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "Asia/Manila" }),
    time: apptTime ?? "",
    title: nextAppt.title,
    provider: nextAppt.providerName ?? undefined,
    location: nextAppt.location ?? undefined,
    notes: nextAppt.notes ?? undefined,
  } : null;

  return (
    <main className="pd-page">
      <header className="flex justify-between items-start mb-5">
        <div>
          <h1 className="pd-heading">Welcome, {dashboard?.user?.firstName ?? "Caregiver"}!</h1>
          <div className="pd-date"><Sun className="w-3.5 h-3.5" /><span>{dateString}</span></div>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md" style={{ background: "#2F3E34" }} aria-label="QR Code"><QrCode className="w-5 h-5" /></button>
          <Link href="/caregiver/profile"><div className="w-10 h-10 rounded-full border-2 border-[#2F3E34] flex items-center justify-center bg-[#E5E7EB]"><UserRound className="w-6 h-6 text-[#2F3E34]" /></div></Link>
        </div>
      </header>

      {/* Patient Profiles */}
      {(dashboard?.activeLinkedPatients?.length ?? 0) > 0 && (
        <section className="mb-4">
          <h3 className="pd-section-heading mb-3">Patient Profiles</h3>
          <div className="flex gap-2">
            {dashboard!.activeLinkedPatients.slice(0, 2).map((p) => (
              <Link key={p.relationshipId} href={`/caregiver/dashboard?patientId=${p.patientUserId}`}
                className={`cg-patient-pill ${p.patientUserId === patient?.user.userId ? "cg-patient-pill-active" : "cg-patient-pill-inactive"}`}>
                <div className="cg-patient-icon"><UserRound className="w-4 h-4" /></div>
                <span className="truncate">{p.patientDisplayName}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40 text-[13px] opacity-50">Loading…</div>
      ) : !patient ? (
        <div className="pd-card p-5 text-[13px] opacity-60 text-center">No linked patient. <Link href="/join" className="underline font-bold">Connect a patient</Link></div>
      ) : (
        <div className="flex flex-col gap-3">
          <h3 className="pd-section-heading">Today&apos;s Care Timeline</h3>

          {missedLogs.length > 0 && (
            <div className="rounded-[20px] p-4" style={{ background: "#C0392B", border: "1px solid #922B21" }}>
              <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-5 h-5 text-white flex-shrink-0" /><p className="text-[15px] font-bold text-white">Recent Alerts!</p></div>
              {missedLogs.slice(0, 2).map((log) => {
                const dt = new Date(log.scheduledFor ?? log.createdAt);
                const timeStr = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Manila" });
                return <p key={log.id} className="text-[13px] text-white/90 mb-1">{patient.user.firstName} : <span className="font-bold">Missed</span> a dose at {timeStr} ({log.medicationName})</p>;
              })}
              <div className="flex justify-end mt-3"><button className="text-[13px] font-bold px-4 py-2 rounded-full bg-[#4A7C59] text-white uppercase tracking-wide">Mark as Taken</button></div>
            </div>
          )}

          <div className="pd-card-green p-5">
            <Pill className="absolute top-4 right-4 w-5 h-5 text-white/70" />
            <p className="text-[13px] font-semibold text-white/90 mb-1">Medicine Taken today</p>
            <p className="text-[42px] font-bold text-white leading-none" style={{ fontFamily: "var(--font-heading)" }}>{taken}<span className="text-[22px] font-semibold opacity-80"> / {total}</span></p>
          </div>

          {nextSlot && (
            <div className="pd-card p-4 cursor-pointer hover:opacity-90 transition" onClick={() => medModalData && setSelectedMed(nextSlot.med)}>
              <div className="flex justify-between items-center mb-1"><p className="text-[15px] font-bold">Next Medication:</p><Bell className="w-4 h-4 opacity-70" /></div>
              <p className="text-[15px] font-semibold opacity-70 mb-2">{nextMedTime}</p>
              <div className="flex items-center gap-3">
                <Pill className="w-6 h-6 text-[#2F3E34] flex-shrink-0" />
                <div>
                  <p className="text-[24px] font-extrabold leading-tight" style={{ fontFamily: "var(--font-heading)" }}>{nextSlot.med.name}</p>
                  <p className="text-[13px] font-semibold opacity-60">{nextSlot.med.dosageValue}{nextSlot.med.dosageUnit ? ` ${nextSlot.med.dosageUnit}` : ""} {nextSlot.med.form} | Every {nextSlot.med.scheduleTimes.length > 1 ? Math.round(24 / nextSlot.med.scheduleTimes.length) : 24} Hours</p>
                </div>
              </div>
            </div>
          )}

          <h3 className="pd-section-heading mt-2">Upcoming Appointments</h3>
          {!nextAppt ? (
            <div className="pd-card p-4 text-[13px] text-center opacity-60">No upcoming appointments.</div>
          ) : (
            <div className="pd-card p-5 cursor-pointer hover:opacity-90 transition" onClick={() => apptModalData && setSelectedAppt(nextAppt)}>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-400 flex-shrink-0" /><span className="text-[15px] font-bold">{apptDayLabel}</span></div>
                <span className="text-[15px] font-bold">at {apptTime}</span>
              </div>
              <div className="flex items-start gap-3">
                <CalendarDays className="w-8 h-8 flex-shrink-0 mt-1" />
                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-[22px] font-bold leading-tight" style={{ fontFamily: "var(--font-heading)" }}>{nextAppt.title}</h4>
                    <span className={`text-[13px] font-bold px-2.5 py-0.5 rounded-full ${statusPillClass(nextAppt.status)}`}>{nextAppt.status.charAt(0).toUpperCase() + nextAppt.status.slice(1)}</span>
                  </div>
                  {nextAppt.providerName && <div className="flex items-center gap-2 text-[13px] opacity-70"><Stethoscope className="w-4 h-4 flex-shrink-0" /><span>|</span><span>{nextAppt.providerName}</span></div>}
                  {nextAppt.location && <div className="flex items-center gap-2 text-[13px] opacity-70"><MapPin className="w-4 h-4 flex-shrink-0" /><span>|</span><span>{nextAppt.location}</span></div>}
                </div>
              </div>
            </div>
          )}

          <h3 className="pd-section-heading mt-2">Progress Summary</h3>
          <div className="pd-progress-grid">
            <div className="pd-card p-4 flex flex-col gap-2 h-full">
              <div className="w-full text-center">
                <p className="text-[13px] font-bold">Medications</p>
                <p className="text-[22px] font-bold leading-tight" style={{ fontFamily: "var(--font-heading)" }}>{taken}<span className="text-[15px] font-semibold opacity-60"> / {total}</span></p>
                <p className="text-[13px] opacity-50">taken today</p>
              </div>
              <div className="flex-1 flex items-center justify-center"><MedicationDonutChart taken={taken} total={total || 1} /></div>
              <div className="flex w-full justify-between px-1">
                {[{ color: "#4A7C59", label: "Taken" }, { color: "#E9C46A", label: "Pending" }].map((l) => (
                  <div key={l.label} className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: l.color }} /><span className="text-[13px] font-semibold opacity-70">{l.label}</span></div>
                ))}
              </div>
            </div>
            <div className="pd-card p-4 flex flex-col gap-2 h-full">
              <div className="w-full text-center">
                <p className="text-[13px] font-bold">Activities</p>
                <p className="text-[22px] font-bold leading-tight" style={{ fontFamily: "var(--font-heading)" }}>{actDone}<span className="text-[15px] font-semibold opacity-60"> / {actPlans.length}</span></p>
                <p className="text-[13px] opacity-50">completed today</p>
              </div>
              <div className="flex-1 flex flex-col" style={{ minHeight: 0 }}><ActivityBarChart done={actDone} total={actPlans.length || 1} /></div>
            </div>
          </div>
        </div>
      )}

      <nav className="pd-nav">
        <div className="pd-nav-active"><Link href="/caregiver/dashboard" className="flex items-center justify-center w-full h-full"><House className="w-8 h-8" /></Link></div>
        <Link href="/caregiver/monitoring" className="pd-nav-link"><Activity className="w-7 h-7" /></Link>
        <Link href="/join" className="pd-nav-link"><UserPlus className="w-7 h-7" /></Link>
        <Link href="/wellness" className="pd-nav-link"><Heart className="w-7 h-7" /></Link>
        <Link href="/caregiver/profile" className="pd-nav-link"><User className="w-7 h-7" /></Link>
      </nav>

      {selectedMed && medModalData && medicationSummary && (
        <MedicationViewModal data={medModalData} canEdit onClose={() => setSelectedMed(null)} />
      )}
      {selectedAppt && apptModalData && (
        <AppointmentViewModal data={apptModalData} canEdit onClose={() => setSelectedAppt(null)} />
      )}
    </main>
  );
}
