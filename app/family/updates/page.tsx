"use client";

import Link from "next/link";
import { useState } from "react";
// Added House, Clock, Heart, and User for the bottom nav
import { UserRound, Pill, Activity, Calendar, ChevronLeft, House, Clock, Heart, User } from "lucide-react";

type Tab = "medication" | "schedule" | "activities";

// Static sample data
const SAMPLE_PATIENTS = [
  { id: "1", name: "Elderly 1" },
  { id: "2", name: "Elderly 2" },
];

const SAMPLE_MED_LOGS = [
  { id: "m1", time: "10:05 AM", isToday: true, actor: "Caregiver", name: "Acetaminophen" },
  { id: "m2", time: "8:01 PM", isToday: false, actor: "Caregiver", name: "Acetaminophen" },
  { id: "m3", time: "2:12 PM", isToday: false, actor: "Caregiver", name: "Acetaminophen" },
  { id: "m4", time: "8:09 AM", isToday: false, actor: "Caregiver", name: "Acetaminophen" },
];

const SAMPLE_SCHEDULE_LOGS = [
  { id: "s1", time: "10:00 AM", isToday: true, title: "Check Up", provider: "Dr. Who" },
  { id: "s2", time: "3:00 PM", isToday: false, title: "Follow-up Visit", provider: "Dr. Who" },
];

const SAMPLE_ACTIVITY_LOGS = [
  { id: "a1", time: "9:00 AM", isToday: true, title: "Morning Walk", status: "done" },
  { id: "a2", time: "7:30 AM", isToday: false, title: "Breathing Exercise", status: "done" },
  { id: "a3", time: "4:00 PM", isToday: false, title: "Light Stretching", status: "missed" },
];

// Log card 
function LogCard({ time, isToday, children }: { time: string; isToday: boolean; children: React.ReactNode }) {
  return (
    <div className="pd-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${isToday ? "bg-blue-400" : "bg-[#4A7C59]"}`} />
        <span className="text-[15px] font-bold">{time}</span>
      </div>
      <div className="ml-5">{children}</div>
    </div>
  );
}

// Page
export default function FamilyUpdatesPage() {
  const [tab, setTab] = useState<Tab>("medication");
  const [activePatient, setActivePatient] = useState("1");

  return (
    <main className="pd-page pb-24"> {/* Increased padding bottom to clear the nav */}

      {/* Back */}
      <div className="mb-4">
        <Link href="/family/profile"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold !text-white"
          style={{ background: "#4A7C59" }}>
          <ChevronLeft className="w-4 h-4" /> BACK
        </Link>
      </div>

      {/* Title */}
      <h1 className="pd-heading mb-4">Activity Log</h1>

      {/* Patient pills */}
      <div className="flex gap-2 mb-4">
        {SAMPLE_PATIENTS.map((p) => {
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

      {/* Tab filter */}
      <div className="flex gap-1 mb-5 bg-[#F6F7F2] rounded-[14px] p-1 border border-[#2F3E34]/10">
        {(["medication", "schedule", "activities"] as Tab[]).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-[10px] text-[13px] font-bold capitalize transition ${
              tab === t ? "bg-[#4A7C59] text-white shadow" : "text-[#2F3E34]/60"
            }`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Medication tab */}
      {tab === "medication" && (
        <>
          <h3 className="pd-section-heading mb-3">Today</h3>
          <div className="flex flex-col gap-3 mb-5">
            {SAMPLE_MED_LOGS.filter((l) => l.isToday).map((l) => (
              <LogCard key={l.id} time={l.time} isToday>
                <div className="flex items-center gap-3">
                  <Pill className="w-5 h-5 text-[#2F3E34] flex-shrink-0" />
                  <div>
                    <p className="text-[14px] font-bold">{l.actor} logged Medication</p>
                    <p className="text-[13px] opacity-60">| {l.name}</p>
                  </div>
                </div>
              </LogCard>
            ))}
          </div>

          <h3 className="pd-section-heading mb-3">Yesterday</h3>
          <div className="flex flex-col gap-3">
            {SAMPLE_MED_LOGS.filter((l) => !l.isToday).map((l) => (
              <LogCard key={l.id} time={l.time} isToday={false}>
                <div className="flex items-center gap-3">
                  <Pill className="w-5 h-5 text-[#2F3E34] flex-shrink-0" />
                  <div>
                    <p className="text-[14px] font-bold">{l.actor} logged Medication</p>
                    <p className="text-[13px] opacity-60">| {l.name}</p>
                  </div>
                </div>
              </LogCard>
            ))}
          </div>
        </>
      )}

      {/* Schedule tab */}
      {tab === "schedule" && (
        <>
          <h3 className="pd-section-heading mb-3">Today</h3>
          <div className="flex flex-col gap-3 mb-5">
            {SAMPLE_SCHEDULE_LOGS.filter((l) => l.isToday).map((l) => (
              <LogCard key={l.id} time={l.time} isToday>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-[#2F3E34] flex-shrink-0" />
                  <div>
                    <p className="text-[14px] font-bold">{l.title}</p>
                    <p className="text-[13px] opacity-60">| {l.provider}</p>
                  </div>
                </div>
              </LogCard>
            ))}
          </div>
          <h3 className="pd-section-heading mb-3">Yesterday</h3>
          <div className="flex flex-col gap-3">
            {SAMPLE_SCHEDULE_LOGS.filter((l) => !l.isToday).map((l) => (
              <LogCard key={l.id} time={l.time} isToday={false}>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-[#2F3E34] flex-shrink-0" />
                  <div>
                    <p className="text-[14px] font-bold">{l.title}</p>
                    <p className="text-[13px] opacity-60">| {l.provider}</p>
                  </div>
                </div>
              </LogCard>
            ))}
          </div>
        </>
      )}

      {/* Activities tab */}
      {tab === "activities" && (
        <>
          <h3 className="pd-section-heading mb-3">Today</h3>
          <div className="flex flex-col gap-3 mb-5">
            {SAMPLE_ACTIVITY_LOGS.filter((l) => l.isToday).map((l) => (
              <LogCard key={l.id} time={l.time} isToday>
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-[#2F3E34] flex-shrink-0" />
                  <div>
                    <p className="text-[14px] font-bold">{l.title}</p>
                    <p className="text-[13px] opacity-60">| {l.status}</p>
                  </div>
                </div>
              </LogCard>
            ))}
          </div>
          <h3 className="pd-section-heading mb-3">Yesterday</h3>
          <div className="flex flex-col gap-3">
            {SAMPLE_ACTIVITY_LOGS.filter((l) => !l.isToday).map((l) => (
              <LogCard key={l.id} time={l.time} isToday={false}>
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-[#2F3E34] flex-shrink-0" />
                  <div>
                    <p className="text-[14px] font-bold">{l.title}</p>
                    <p className="text-[13px] opacity-60">| {l.status}</p>
                  </div>
                </div>
              </LogCard>
            ))}
          </div>
        </>
      )}

      {/* --- BOTTOM NAVIGATION BAR --- */}
      <nav className="pd-nav">
        {/* Home */}
        <Link href="/family/dashboard" className="pd-nav-link">
          <House className="w-7 h-7" />
        </Link>

        {/* Updates - ACTIVE */}
        <div className="pd-nav-active">
          <Link href="/family/updates" className="flex items-center justify-center w-full h-full">
            <Clock className="w-8 h-8" />
          </Link>
        </div>

        {/* Wellness */}
        <Link href="/family/wellness" className="pd-nav-link">
          <Heart className="w-7 h-7" />
        </Link>

        {/* Profile */}
        <Link href="/family/profile" className="pd-nav-link">
          <User className="w-7 h-7" />
        </Link>
      </nav>

    </main>
  );
}