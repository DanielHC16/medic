"use client";

import { useState } from "react";
import { Pill, Clock, Check } from "lucide-react";

interface Props {
  medicationName: string;
  initialTime?: string; // "HH:MM" 24h
  onCancel: () => void;
  onSave: (time: string) => void;
}

export function MedicationTimeEditModal({ medicationName, initialTime = "12:00", onCancel, onSave }: Props) {
  const [time, setTime] = useState(initialTime);
  const [saved, setSaved] = useState(false);

  if (saved) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-6">
        <div className="w-full max-w-sm rounded-[24px] p-8 flex flex-col items-center gap-5"
          style={{ background: "#2F3E34" }}>
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
            <Check className="w-8 h-8 text-white" strokeWidth={3} />
          </div>
          <h2 className="text-[24px] font-bold text-white text-center" style={{ fontFamily: "var(--font-heading)" }}>
            Successfully Edited!
          </h2>
          <button onClick={() => onSave(time)}
            className="px-10 py-3 rounded-[14px] text-[13px] font-bold uppercase tracking-widest text-white"
            style={{ background: "#4A7C59" }}>
            CLOSE
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-6">
      <div className="w-full max-w-sm rounded-[28px] p-8 flex flex-col items-center gap-5"
        style={{ background: "#2F3E34" }}>

        <Pill className="w-10 h-10 text-white/80" />
        <h2 className="text-[28px] font-bold text-white text-center" style={{ fontFamily: "var(--font-heading)" }}>
          {medicationName}
        </h2>
        <p className="text-[15px] text-white/70" style={{ fontFamily: "Inter, sans-serif" }}>Time Taken:</p>

        {/* Time input — same pattern as appointment edit modal */}
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-[14px] border border-white/20 bg-white/10 w-full">
          <input
            className="flex-1 bg-transparent text-[20px] font-bold text-white outline-none text-center"
            style={{ fontFamily: "Inter, sans-serif", colorScheme: "dark" }}
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
          <Clock className="w-5 h-5 text-white/50 flex-shrink-0" />
        </div>

        <div className="flex gap-3 w-full mt-1">
          <button onClick={onCancel}
            className="flex-1 py-3.5 rounded-[14px] text-[13px] font-bold uppercase tracking-widest text-white"
            style={{ background: "#D97B7B" }}>
            CANCEL
          </button>
          <button onClick={() => setSaved(true)}
            className="flex-1 py-3.5 rounded-[14px] text-[13px] font-bold uppercase tracking-widest text-white"
            style={{ background: "#4A7C59" }}>
            SAVE
          </button>
        </div>
      </div>
    </div>
  );
}
