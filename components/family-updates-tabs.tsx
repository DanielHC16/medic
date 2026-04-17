"use client";

import { useState } from "react";
import { Activity, Calendar, Pill } from "lucide-react";

type Tab = "medication" | "schedule" | "activities";

type MedicationItem = {
  id: string;
  dateKey: string;
  isToday: boolean;
  time: string;
  actor: string;
  name: string;
  status: string;
};

type ScheduleItem = {
  id: string;
  dateKey: string;
  isToday: boolean;
  time: string;
  title: string;
  provider: string;
  status: string;
};

type ActivityItem = {
  id: string;
  dateKey: string;
  isToday: boolean;
  time: string;
  title: string;
  status: string;
};

function LogCard({
  time,
  isToday,
  children,
}: {
  time: string;
  isToday: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="pd-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`w-3 h-3 rounded-full flex-shrink-0 ${
            isToday ? "bg-blue-400" : "bg-[#4A7C59]"
          }`}
        />
        <span className="text-[15px] font-bold">{time}</span>
      </div>
      <div className="ml-5">{children}</div>
    </div>
  );
}

export function FamilyUpdatesTabs(props: {
  medicationItems: MedicationItem[];
  scheduleItems: ScheduleItem[];
  activityItems: ActivityItem[];
}) {
  const [tab, setTab] = useState<Tab>("medication");

  const todayMedLogs = props.medicationItems.filter((item) => item.isToday);
  const earlierMedLogs = props.medicationItems.filter((item) => !item.isToday);
  const todaySchedule = props.scheduleItems.filter((item) => item.isToday);
  const earlierSchedule = props.scheduleItems.filter((item) => !item.isToday);
  const todayActivity = props.activityItems.filter((item) => item.isToday);
  const earlierActivity = props.activityItems.filter((item) => !item.isToday);

  return (
    <>
      <div className="flex gap-1 mb-5 bg-[#F6F7F2] rounded-[14px] p-1 border border-[#2F3E34]/10">
        {(["medication", "schedule", "activities"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-[10px] text-[13px] font-bold capitalize transition ${
              tab === t ? "bg-[#4A7C59] text-white shadow" : "text-[#2F3E34]/60"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "medication" && (
        <>
          <h3 className="pd-section-heading mb-3">Today</h3>
          <div className="flex flex-col gap-3 mb-5">
            {todayMedLogs.length === 0 ? (
              <p className="text-[13px] opacity-60">No medication logs today.</p>
            ) : (
              todayMedLogs.map((log) => (
                <LogCard key={log.id} time={log.time} isToday>
                  <div className="flex items-center gap-3">
                    <Pill className="w-5 h-5 text-[#2F3E34] flex-shrink-0" />
                    <div>
                      <p className="text-[14px] font-bold">
                        {log.actor} logged {log.status}
                      </p>
                      <p className="text-[13px] opacity-60">| {log.name}</p>
                    </div>
                  </div>
                </LogCard>
              ))
            )}
          </div>

          <h3 className="pd-section-heading mb-3">Earlier</h3>
          <div className="flex flex-col gap-3">
            {earlierMedLogs.length === 0 ? (
              <p className="text-[13px] opacity-60">No earlier medication logs.</p>
            ) : (
              earlierMedLogs.map((log) => (
                <LogCard key={log.id} time={log.time} isToday={false}>
                  <div className="flex items-center gap-3">
                    <Pill className="w-5 h-5 text-[#2F3E34] flex-shrink-0" />
                    <div>
                      <p className="text-[14px] font-bold">
                        {log.actor} logged {log.status}
                      </p>
                      <p className="text-[13px] opacity-60">| {log.name}</p>
                    </div>
                  </div>
                </LogCard>
              ))
            )}
          </div>
        </>
      )}

      {tab === "schedule" && (
        <>
          <h3 className="pd-section-heading mb-3">Today</h3>
          <div className="flex flex-col gap-3 mb-5">
            {todaySchedule.length === 0 ? (
              <p className="text-[13px] opacity-60">No appointments today.</p>
            ) : (
              todaySchedule.map((item) => (
                <LogCard key={item.id} time={item.time} isToday>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-[#2F3E34] flex-shrink-0" />
                    <div>
                      <p className="text-[14px] font-bold">{item.title}</p>
                      <p className="text-[13px] opacity-60">
                        | {item.provider || item.status}
                      </p>
                    </div>
                  </div>
                </LogCard>
              ))
            )}
          </div>

          <h3 className="pd-section-heading mb-3">Other</h3>
          <div className="flex flex-col gap-3">
            {earlierSchedule.length === 0 ? (
              <p className="text-[13px] opacity-60">No other appointments.</p>
            ) : (
              earlierSchedule.map((item) => (
                <LogCard key={item.id} time={item.time} isToday={false}>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-[#2F3E34] flex-shrink-0" />
                    <div>
                      <p className="text-[14px] font-bold">{item.title}</p>
                      <p className="text-[13px] opacity-60">
                        | {item.provider || item.status}
                      </p>
                    </div>
                  </div>
                </LogCard>
              ))
            )}
          </div>
        </>
      )}

      {tab === "activities" && (
        <>
          <h3 className="pd-section-heading mb-3">Today</h3>
          <div className="flex flex-col gap-3 mb-5">
            {todayActivity.length === 0 ? (
              <p className="text-[13px] opacity-60">No routines logged today.</p>
            ) : (
              todayActivity.map((item) => (
                <LogCard key={item.id} time={item.time} isToday>
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-[#2F3E34] flex-shrink-0" />
                    <div>
                      <p className="text-[14px] font-bold">{item.title}</p>
                      <p className="text-[13px] opacity-60">| {item.status}</p>
                    </div>
                  </div>
                </LogCard>
              ))
            )}
          </div>

          <h3 className="pd-section-heading mb-3">Earlier</h3>
          <div className="flex flex-col gap-3">
            {earlierActivity.length === 0 ? (
              <p className="text-[13px] opacity-60">No earlier activity logs.</p>
            ) : (
              earlierActivity.map((item) => (
                <LogCard key={item.id} time={item.time} isToday={false}>
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-[#2F3E34] flex-shrink-0" />
                    <div>
                      <p className="text-[14px] font-bold">{item.title}</p>
                      <p className="text-[13px] opacity-60">| {item.status}</p>
                    </div>
                  </div>
                </LogCard>
              ))
            )}
          </div>
        </>
      )}
    </>
  );
}
