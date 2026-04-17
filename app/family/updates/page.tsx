"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { House, Clock, Heart, User, UserRound, Pill, Activity, Calendar, ChevronLeft } from "lucide-react";
import type { CareMemberDashboardData, MedicationLogRecord, ActivityLogRecord } from "@/lib/medic-types";

type Tab = "medication" | "schedule" | "activities";

function groupByDay(items: { date: Date; key: string; node: React.ReactNode }[]) {
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const todayStr = today.toLocaleDateString("en-US", { timeZone: "Asia/Manila" });
  const yestStr = yesterday.toLocaleDateString("en-US", { timeZone: "Asia/Manila" });
  const groups: Record<string, typeof items> = {};
  for (const item of items) {
    const ds = item.date.toLocaleDateString("en-US", { timeZone: "Asia/Manila" });
    const label = ds === todayStr ? "Today" : ds === yestStr ? "Yesterday"
      : item.date.toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "Asia/Manila" });
    if (!groups[label]) groups[label] = [];
    groups[label].push(item);
  }
  return groups;
}

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

export default function FamilyUpdatesPage() {
  const [dashboard, setDashboard] = useState<CareMemberDashboardData | null>(null);
  const [medLogs, setMedLogs] = useState<MedicationLogRecord[]>([]);
  const [actLogs, setActLogs] = useState<ActivityLogRecord[]>([]);
  const [tab, setTab] = useState<Tab>("medication");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const patientId = params.get("patientId") ?? "";
    const qs = patientId ? `?patientId=${patientId}` : "";
    Promise.all([
      fetch(`/api/dashboard/family${qs}`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/medication-logs${qs}`).then((r) => r.ok ? r.json() : null),
      fetch(`/api/activity-logs${qs}`).then((r) => r.ok ? r.json() : null),
    ]).then(([dashJson, medJson, actJson]) => {
      setDashboard(dashJson?.data ?? dashJson);
      setMedLogs(medJson?.logs ?? []);
      setActLogs(actJson?.logs ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const patient = dashboard?.selectedPatient ?? null;
  const todayStr = new Date().toLocaleDateString("en-US", { timeZone: "Asia/Manila" });

  const medItems = medLogs.map((l) => {
    const dt = new Date(l.takenAt ?? l.scheduledFor ?? l.createdAt);
    const timeStr = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Manila" });
    const isToday = dt.toLocaleDateString("en-US", { timeZone: "Asia/Manila" }) === todayStr;
    return {
      date: dt, key: l.id,
      node: (
        <div className="flex items-center gap-3">
          <Pill className="w-5 h-5 text-[#2F3E34] flex-shrink-0" />
          <div>
            <p className="text-[14px] font-bold">{l.recordedByDisplayName ?? "Caregiver"} logged Medication</p>
            <p className="text-[13px] opacity-60">| {l.medicationName}</p>
          </div>
        </div>
      ),
      isToday,
    };
  });

  const apptItems = (patient?.appointments ?? []).map((a) => {
    const dt = new Date(a.appointmentAt);
    const timeStr = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Manila" });
    const isToday = dt.toLocaleDateString("en-US", { timeZone: "Asia/Manila" }) === todayStr;
    return {
      date: dt, key: a.id,
      node: (
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-[#2F3E34] flex-shrink-0" />
          <div>
            <p className="text-[14px] font-bold">{a.title}</p>
            {a.providerName && <p className="text-[13px] opacity-60">| {a.providerName}</p>}
          </div>
        </div>
      ),
      isToday,
    };
  });

  const actItems = actLogs.map((l) => {
    const dt = new Date(l.completedAt ?? l.createdAt);
    const timeStr = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Manila" });
    const isToday = dt.toLocaleDateString("en-US", { timeZone: "Asia/Manila" }) === todayStr;
    return {
      date: dt, key: l.id,
      node: (
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-[#2F3E34] flex-shrink-0" />
          <div>
            <p className="text-[14px] font-bold">{l.activityTitle}</p>
            <p className="text-[13px] opacity-60">| {l.completionStatus}</p>
          </div>
        </div>
      ),
      isToday,
    };
  });

  const activeItems = tab === "medication" ? medItems : tab === "schedule" ? apptItems : actItems;
  const sorted = [...activeItems].sort((a, b) => b.date.getTime() - a.date.getTime());
  const grouped = groupByDay(sorted.map(({ date, key, node }) => ({ date, key, node })));

  return (
    <main className="pd-page">
      <div className="mb-4">
        <Link href="/family/dashboard"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold !text-white"
          style={{ background: "#4A7C59" }}>
          <ChevronLeft className="w-4 h-4" /> BACK
        </Link>
      </div>

      <h1 className="pd-heading mb-4">Activity Log</h1>

      {/* Patient profile pills from DB */}
      {(dashboard?.activeLinkedPatients?.length ?? 0) > 0 && (
        <div className="flex gap-2 mb-4">
          {dashboard!.activeLinkedPatients.slice(0, 2).map((p) => {
            const isActive = p.patientUserId === patient?.user.userId;
            return (
              <Link key={p.relationshipId}
                href={`/family/updates?patientId=${p.patientUserId}`}
                className={`cg-patient-pill ${isActive ? "cg-patient-pill-active" : "cg-patient-pill-inactive"}`}>
                <div className="cg-patient-icon"><UserRound className="w-4 h-4" /></div>
                <span className="truncate">{p.patientDisplayName}</span>
              </Link>
            );
          })}
        </div>
      )}

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

      {loading ? (
        <div className="flex items-center justify-center h-32 text-[13px] opacity-50">Loading…</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="pd-card p-4 text-[13px] opacity-60 text-center">No activity recorded yet.</div>
      ) : (
        Object.entries(grouped).map(([label, items]) => (
          <div key={label} className="mb-5">
            <h3 className="pd-section-heading mb-3">{label}</h3>
            <div className="flex flex-col gap-3">
              {items.map((item) => {
                const dt = item.date;
                const timeStr = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Manila" });
                const isToday = dt.toLocaleDateString("en-US", { timeZone: "Asia/Manila" }) === todayStr;
                return (
                  <LogCard key={item.key} time={timeStr} isToday={isToday}>
                    {item.node}
                  </LogCard>
                );
              })}
            </div>
          </div>
        ))
      )}

      <nav className="pd-nav">
        <div className="pd-nav-active">
          <Link href="/family/dashboard" className="flex items-center justify-center w-full h-full"><House className="w-8 h-8" /></Link>
        </div>
        <Link href="/family/updates" className="pd-nav-link"><Clock className="w-7 h-7" /></Link>
        <Link href="/wellness" className="pd-nav-link"><Heart className="w-7 h-7" /></Link>
        <Link href="/family/profile" className="pd-nav-link"><User className="w-7 h-7" /></Link>
      </nav>
    </main>
  );
}
