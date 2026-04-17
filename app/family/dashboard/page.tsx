"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Sun, QrCode, UserRound, Bell, Pill, House, Clock, Heart,
  User, CalendarDays, Stethoscope, MapPin, AlertTriangle, Check,
  X, AlarmClock,
} from "lucide-react";
import { MedicationViewModal } from "@/components/medication-view-modal";
import { AppointmentViewModal } from "@/components/appointment-view-modal";

// ─── Hardcoded sample data ────────────────────────────────────────────────────

const PATIENTS = [
  { id: "1", name: "Elderly 1" },
  { id: "2", name: "Elderly 2" },
];

const MED_DETAIL = {
  name: "Acetaminophen",
  type: "Maintenance",
  dosage: "20 mg",
  prescriber: "Dr. Who",
  form: "Pill",
  intervalHours: 6,
  scheduleTimes: ["8:00 AM", "2:00 PM", "8:00 PM"],
  takenIndex: 0,
  taken: 1,
  total: 3,
  missed: 0,
  notes: "Take after breakfast and before the evening meal.",
};

const APPT_DETAIL = {
  status: "Scheduled",
  date: "April 23, 2026",
  time: "10:00 AM",
  title: "Check Up",
  provider: "Dr. Who",
  location: "Manila Doctors Hospital",
  notes: "Bring medication list.",
};

const DATA: Record<string, {
  taken: number; total: number;
  hasMissed: boolean; missedTime: string; missedMed: string;
  nextMedTime: string; nextMedName: string; nextMedDose: string; nextMedInterval: string;
  apptDay: string; apptTime: string; apptTitle: string; apptProvider: string; apptLocation: string;
  actDone: number; actTotal: number;
}> = {
  "1": {
    taken: 2, total: 5,
    hasMissed: false, missedTime: "", missedMed: "",
    nextMedTime: "8:00 AM", nextMedName: "Acetaminophen", nextMedDose: "1 Pill", nextMedInterval: "Every 6 Hours",
    apptDay: "Today", apptTime: "10:00 AM", apptTitle: "Check Up", apptProvider: "Dr. Who", apptLocation: "Manila Doctors Hospital",
    actDone: 1, actTotal: 2,
  },
  "2": {
    taken: 3, total: 5,
    hasMissed: true, missedTime: "8:00AM", missedMed: "Acetaminophen",
    nextMedTime: "8:00 AM", nextMedName: "Acetaminophen", nextMedDose: "1 Pill", nextMedInterval: "Every 6 Hours",
    apptDay: "Today", apptTime: "10:00 AM", apptTitle: "Check Up", apptProvider: "Dr. Who", apptLocation: "Manila Doctors Hospital",
    actDone: 0, actTotal: 3,
  },
};

// ─── Modals ───────────────────────────────────────────────────────────────────

function MedicationModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="pd-modal-sheet">
      <div className="flex justify-end mb-2">
        <button onClick={onClose} className="w-8 h-8 rounded-full border border-[#2F3E34] flex items-center justify-center hover:bg-[#E5E7EB] transition" aria-label="Close">
          <X className="w-4 h-4" />
        </button>
      </div>
      <h2 className="pd-modal-title">{MED_DETAIL.name}</h2>
      <p className="text-[13px] opacity-70 mb-1">{MED_DETAIL.type} | {MED_DETAIL.dosage}</p>
      <p className="text-[13px] opacity-60 mb-5">Prescribed by: {MED_DETAIL.prescriber}</p>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="pd-modal-info-tile">
          <Pill className="w-7 h-7 flex-shrink-0" />
          <div>
            <p className="text-[17px] font-bold leading-tight">1 {MED_DETAIL.form}</p>
            <p className="text-[13px] opacity-60">Daily</p>
          </div>
        </div>
        <div className="pd-modal-info-tile">
          <AlarmClock className="w-7 h-7 flex-shrink-0" />
          <div>
            <p className="text-[13px] opacity-60">Every</p>
            <p className="text-[17px] font-bold leading-tight">{MED_DETAIL.intervalHours} Hours</p>
          </div>
        </div>
      </div>
      <p className="text-[13px] font-bold mb-2">Schedule:</p>
      <div className="flex flex-col gap-2 mb-6">
        {MED_DETAIL.scheduleTimes.map((t, i) => (
          <div key={t} className="pd-schedule-row">
            <span className="text-[15px] font-semibold">{t}</span>
            {i === MED_DETAIL.takenIndex && (
              <span className="flex items-center gap-1 bg-[#4A7C59] text-white text-[13px] font-bold px-3 py-1 rounded-full">
                <Check className="w-3 h-3" /> TAKEN
              </span>
            )}
          </div>
        ))}
      </div>
      <p className="text-[13px] font-bold mb-2">Tracker:</p>
      <div className="flex gap-3 mb-6">
        <div className="pd-tracker-tile">
          <Pill className="w-5 h-5" />
          <p className="text-[18px] font-bold">{MED_DETAIL.taken} / {MED_DETAIL.total}</p>
          <p className="text-[13px] opacity-60">Taken</p>
        </div>
        <div className="pd-tracker-tile opacity-60">
          <Pill className="w-5 h-5 opacity-40" />
          <p className="text-[18px] font-bold">{MED_DETAIL.missed}</p>
          <p className="text-[13px]">Missed</p>
        </div>
      </div>
      <p className="text-[13px] font-bold mb-2">Notes:</p>
      <div className="pd-notes-box">{MED_DETAIL.notes}</div>
    </div>
  );
}

function AppointmentModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="pd-modal-sheet">
      <div className="flex justify-between items-center mb-4">
        <span className="text-[13px] font-bold px-3 py-1 rounded-full pd-status-scheduled">
          {APPT_DETAIL.status}
        </span>
        <button onClick={onClose} className="w-8 h-8 rounded-full border border-[#2F3E34] flex items-center justify-center hover:bg-[#E5E7EB] transition" aria-label="Close">
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-[13px] font-semibold opacity-70 mb-1">{APPT_DETAIL.date} {APPT_DETAIL.time}</p>
      <h2 className="pd-modal-title-lg">{APPT_DETAIL.title}</h2>
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center gap-2 text-[13px]">
          <Stethoscope className="w-4 h-4 opacity-60" /><span className="opacity-70">|</span><span>{APPT_DETAIL.provider}</span>
        </div>
        <div className="flex items-center gap-2 text-[13px]">
          <MapPin className="w-4 h-4 opacity-60" /><span className="opacity-70">|</span><span>{APPT_DETAIL.location}</span>
        </div>
      </div>
      <p className="text-[13px] font-bold mb-2">Notes:</p>
      <div className="pd-notes-box">{APPT_DETAIL.notes}</div>
    </div>
  );
}

// Charts

function MedicationDonutChart({ taken, total }: { taken: number; total: number }) {
  const r = 36; const C = 2 * Math.PI * r; const safe = total || 1;
  const tLen = (taken / safe) * C;
  const pLen = C - tLen;
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
  const missed = total - done;
  const bars = [
    { label: "Done", value: done, color: "#4A7C59" },
    { label: "Missed", value: missed, color: "#D97B7B" },
  ];
  const maxVal = Math.max(done, missed, 1);
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

// Page

export default function FamilyDashboardPage() {
  const [activePatient, setActivePatient] = useState("1");
  const [medModalOpen, setMedModalOpen] = useState(false);
  const [apptModalOpen, setApptModalOpen] = useState(false);
  const today = new Date();
  const dateString = today.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "long", timeZone: "Asia/Manila" }).toUpperCase();
  const d = DATA[activePatient];

  return (
    <main className="pd-page">

      {/* Header */}
      <header className="flex justify-between items-start mb-5">
        <div>
          <h1 className="pd-heading">Welcome, User!</h1>
          <div className="pd-date"><Sun className="w-3.5 h-3.5" /><span>{dateString}</span></div>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md" style={{ background: "#2F3E34" }} aria-label="QR Code">
            <QrCode className="w-5 h-5" />
          </button>
          <Link href="/family/profile">
            <div className="w-10 h-10 rounded-full border-2 border-[#2F3E34] flex items-center justify-center bg-[#E5E7EB]">
              <UserRound className="w-6 h-6 text-[#2F3E34]" />
            </div>
          </Link>
        </div>
      </header>

      {/* Patient Profiles */}
      <section className="mb-4">
        <h3 className="pd-section-heading mb-3">Patient Profiles</h3>
        <div className="flex gap-2">
          {PATIENTS.map((p) => {
            const isActive = p.id === activePatient;
            return (
              <button key={p.id} type="button" onClick={() => setActivePatient(p.id)}
                className={`cg-patient-pill ${isActive ? "cg-patient-pill-active" : "cg-patient-pill-inactive"}`}>
                <div className="cg-patient-icon"><UserRound className="w-4 h-4" /></div>
                <span className="truncate">{p.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="flex flex-col gap-3">
        <h3 className="pd-section-heading">Today&apos;s Care Timeline</h3>

        {/* Medicine Taken */}
        <div className="pd-card-green p-5">
          <Pill className="absolute top-4 right-4 w-5 h-5 text-white/70" />
          <p className="text-[13px] font-semibold text-white/90 mb-1">Medicine Taken today</p>
          <p className="text-[42px] font-bold text-white leading-none" style={{ fontFamily: "var(--font-heading)" }}>
            {d.taken}<span className="text-[22px] font-semibold opacity-80"> / {d.total}</span>
          </p>
        </div>

        {/* Alert */}
        {d.hasMissed && (
          <div className="rounded-[20px] p-4" style={{ background: "#C0392B", border: "1px solid #922B21" }}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-white flex-shrink-0" />
              <p className="text-[15px] font-bold text-white">Recent Alerts!</p>
            </div>
            <p className="text-[13px] text-white/90 mb-3">
              {PATIENTS.find((p) => p.id === activePatient)?.name} : <span className="font-bold">Missed</span> a dose at {d.missedTime} ({d.missedMed})
            </p>
            <div className="flex justify-end">
              <button className="text-[13px] font-bold px-4 py-2 rounded-full bg-[#4A7C59] text-white uppercase tracking-wide">
                Mark as Taken
              </button>
            </div>
          </div>
        )}

        {/* Next Medication */}
        <div className="pd-card p-4 cursor-pointer hover:opacity-90 transition" onClick={() => setMedModalOpen(true)}>
          <div className="flex justify-between items-center mb-1">
            <p className="text-[15px] font-bold">Next Medication:</p>
            <Bell className="w-4 h-4 opacity-70" />
          </div>
          <p className="text-[15px] font-semibold opacity-70 mb-2">{d.nextMedTime}</p>
          <div className="flex items-center gap-3">
            <Pill className="w-6 h-6 text-[#2F3E34] flex-shrink-0" />
            <div>
              <p className="text-[24px] font-extrabold leading-tight" style={{ fontFamily: "var(--font-heading)" }}>{d.nextMedName}</p>
              <p className="text-[13px] font-semibold opacity-60">{d.nextMedDose} | {d.nextMedInterval}</p>
            </div>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <h3 className="pd-section-heading mt-2">Upcoming Appointments</h3>
        <div className="pd-card p-5 cursor-pointer hover:opacity-90 transition" onClick={() => setApptModalOpen(true)}>
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-400 flex-shrink-0" />
              <span className="text-[15px] font-bold">{d.apptDay}</span>
            </div>
            <span className="text-[15px] font-bold">at {d.apptTime}</span>
          </div>
          <div className="flex items-start gap-3">
            <CalendarDays className="w-8 h-8 flex-shrink-0 mt-1" />
            <div className="flex flex-col gap-1">
              <h4 className="text-[22px] font-bold leading-tight" style={{ fontFamily: "var(--font-heading)" }}>{d.apptTitle}</h4>
              <div className="flex items-center gap-2 text-[13px] opacity-70">
                <Stethoscope className="w-4 h-4 flex-shrink-0" /><span>|</span><span>{d.apptProvider}</span>
              </div>
              <div className="flex items-center gap-2 text-[13px] opacity-70">
                <MapPin className="w-4 h-4 flex-shrink-0" /><span>|</span><span>{d.apptLocation}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Summary */}
        <h3 className="pd-section-heading">Progress Summary</h3>
          <div className="pd-progress-grid">
            <div className="pd-card p-4 flex flex-col gap-2 h-full">
              <div className="w-full text-center">
                <p className="text-[13px] font-bold">Medications</p>
                <p className="text-[22px] font-bold leading-tight" style={{ fontFamily: "var(--font-heading)" }}>
                  {d.taken}<span className="text-[15px] font-semibold opacity-60"> / {d.total}</span>
                </p>
                <p className="text-[13px] opacity-50">taken today</p>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <MedicationDonutChart taken={d.taken} total={d.total} />
              </div>
              <div className="flex w-full justify-between px-1">
                {[{ color: "#4A7C59", label: "Taken" }, { color: "#E9C46A", label: "Pending" }].map((l) => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: l.color }} />
                    <span className="text-[13px] font-semibold opacity-70">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="pd-card p-4 flex flex-col gap-2 h-full">
              <div className="w-full text-center">
                <p className="text-[13px] font-bold">Activities</p>
                <p className="text-[22px] font-bold leading-tight" style={{ fontFamily: "var(--font-heading)" }}>
                  {d.actDone}<span className="text-[15px] font-semibold opacity-60"> / {d.actTotal}</span>
                </p>
                <p className="text-[13px] opacity-50">completed today</p>
              </div>
              <div className="flex-1 flex flex-col" style={{ minHeight: 0 }}>
                <ActivityBarChart done={d.actDone} total={d.actTotal} />
              </div>
            </div>
          </div>
        </div>

      {/* Bottom Nav */}
      <nav className="pd-nav">
        <div className="pd-nav-active">
          <Link href="/family/dashboard" className="flex items-center justify-center w-full h-full"><House className="w-8 h-8" /></Link>
        </div>
        <Link href="/family/updates" className="pd-nav-link"><Clock className="w-7 h-7" /></Link>
        <Link href="/family/wellness" className="pd-nav-link"><Heart className="w-7 h-7" /></Link>
        <Link href="/family/profile" className="pd-nav-link"><User className="w-7 h-7" /></Link>
      </nav>
      {medModalOpen && <MedicationModal onClose={() => setMedModalOpen(false)} />}
      {apptModalOpen && <AppointmentModal onClose={() => setApptModalOpen(false)} />}
    </main>
  );
}
