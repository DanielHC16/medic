"use client";

import { useState } from "react";
import { Pill, ChevronUp, ChevronDown } from "lucide-react";

interface Props {
  medicationName: string;
  initialTime?: string; // "HH:MM" 24h
  onCancel: () => void;
  onSave: (time: string) => void;
}

export function MedicationTimeEditModal({ medicationName, initialTime = "12:00", onCancel, onSave }: Props) {
  const [time, setTime] = useState(initialTime); // always "HH:MM" 24h

  const [hh, mm] = time.split(":").map(Number);
  const isPM = hh >= 12;
  const hour12 = hh % 12 || 12;

  function fmt(h: number, m: number) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  function stepHour(delta: number) {
    const next = ((hh + delta + 24) % 24);
    setTime(fmt(next, mm));
  }

  function stepMin(delta: number) {
    const next = ((mm + delta + 60) % 60);
    setTime(fmt(hh, next));
  }

  function toggleAMPM() {
    setTime(fmt(isPM ? hh - 12 : hh + 12, mm));
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-6">
      <div className="w-full max-w-sm rounded-[28px] p-8 flex flex-col items-center gap-5"
        style={{ background: "#2F3E34" }}>

        <Pill className="w-10 h-10 text-white/80" />
        <h2 className="text-[28px] font-bold text-white text-center" style={{ fontFamily: "var(--font-heading)" }}>
          {medicationName}
        </h2>
        <p className="text-[15px] text-white/70">Time Taken:</p>

        {/* Time picker */}
        <div className="flex items-center gap-3">

          {/* Hours */}
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1} max={12}
              value={hour12}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (isNaN(v)) return;
                const clamped = Math.min(Math.max(v, 1), 12);
                const h24 = isPM ? (clamped === 12 ? 12 : clamped + 12) : (clamped === 12 ? 0 : clamped);
                setTime(fmt(h24, mm));
              }}
              className="w-[60px] text-[40px] font-bold text-white text-center bg-transparent outline-none border-b-2 border-white/50 leading-none pb-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              style={{ fontFamily: "Inter, sans-serif", color: "#ffffff" }}
            />
            <div className="flex flex-col gap-0.5">
              <button type="button" onClick={() => stepHour(1)} className="text-white/60 hover:text-white transition">
                <ChevronUp className="w-4 h-4" strokeWidth={2.5} />
              </button>
              <button type="button" onClick={() => stepHour(-1)} className="text-white/60 hover:text-white transition">
                <ChevronDown className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <span className="text-[40px] font-bold text-white/60 leading-none">:</span>

          {/* Minutes */}
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={0} max={59}
              value={String(mm).padStart(2, "0")}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (isNaN(v)) return;
                setTime(fmt(hh, Math.min(Math.max(v, 0), 59)));
              }}
              className="w-[60px] text-[40px] font-bold text-white text-center bg-transparent outline-none border-b-2 border-white/50 leading-none pb-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              style={{ fontFamily: "Inter, sans-serif", color: "#ffffff" }}
            />
            <div className="flex flex-col gap-0.5">
              <button type="button" onClick={() => stepMin(1)} className="text-white/60 hover:text-white transition">
                <ChevronUp className="w-4 h-4" strokeWidth={2.5} />
              </button>
              <button type="button" onClick={() => stepMin(-1)} className="text-white/60 hover:text-white transition">
                <ChevronDown className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* AM/PM */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleAMPM}
              className="text-[32px] font-bold text-white border-b-2 border-white/50 leading-none pb-0.5 w-[56px] text-center"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {isPM ? "PM" : "AM"}
            </button>
            <div className="flex flex-col gap-0.5">
              <button type="button" onClick={() => { if (!isPM) toggleAMPM(); }} className="text-white/60 hover:text-white transition">
                <ChevronUp className="w-4 h-4" strokeWidth={2.5} />
              </button>
              <button type="button" onClick={() => { if (isPM) toggleAMPM(); }} className="text-white/60 hover:text-white transition">
                <ChevronDown className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 w-full mt-1">
          <button onClick={onCancel}
            className="flex-1 py-3.5 rounded-[14px] text-[13px] font-bold uppercase tracking-widest text-white"
            style={{ background: "#D97B7B" }}>
            CANCEL
          </button>
          <button onClick={() => onSave(time)}
            className="flex-1 py-3.5 rounded-[14px] text-[13px] font-bold uppercase tracking-widest text-white"
            style={{ background: "#4A7C59" }}>
            SAVE
          </button>
        </div>
      </div>
    </div>
  );
}
