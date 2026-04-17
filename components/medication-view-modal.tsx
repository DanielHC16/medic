"use client";

import { useState } from "react";
import { Pill, AlarmClock, Check, X } from "lucide-react";
import { MedicationTimeEditModal } from "@/components/medication-time-edit-modal";

export interface MedicationModalData {
  name: string;
  type?: string;
  dosage: string;
  unit?: string;
  form: string;
  prescriber?: string;
  frequencyType?: string;
  intervalHours?: number;
  scheduleTimes: string[];
  takenIndex?: number;
  taken: number;
  total: number;
  missed: number;
  notes?: string;
}

interface Props {
  data: MedicationModalData;
  canEdit?: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

export function MedicationViewModal({ data, canEdit = false, onClose }: Props) {
  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const freq = data.frequencyType
    ? data.frequencyType.charAt(0).toUpperCase() + data.frequencyType.slice(1)
    : data.type ?? "Maintenance";

  const interval = data.intervalHours
    ? `${data.intervalHours} Hours`
    : data.scheduleTimes.length > 1
    ? `${Math.round(24 / data.scheduleTimes.length)} Hours`
    : "24 Hours";

  return (
    <div className="pd-modal-sheet">
      <div className="flex justify-end mb-4">
        <button onClick={onClose}
          className="w-9 h-9 rounded-full border-2 border-[#2F3E34] flex items-center justify-center hover:bg-[#E5E7EB] transition"
          aria-label="Close">
          <X className="w-5 h-5" />
        </button>
      </div>

      <h2 className="pd-modal-title">{data.name}</h2>
      <p className="text-[13px] font-semibold opacity-70 mb-1">{freq} | {data.dosage} {data.unit ?? ""}</p>
      {data.prescriber && <p className="text-[13px] opacity-60 mb-5">Prescribed by: {data.prescriber}</p>}

      {/* Info tiles */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="pd-modal-info-tile">
          <Pill className="w-7 h-7 flex-shrink-0" />
          <div>
            <p className="text-[17px] font-bold leading-tight">{data.total} {data.form}</p>
            <p className="text-[13px] opacity-60">{freq}</p>
          </div>
        </div>
        <div className="pd-modal-info-tile">
          <AlarmClock className="w-7 h-7 flex-shrink-0" />
          <div>
            <p className="text-[13px] opacity-60">Every</p>
            <p className="text-[17px] font-bold leading-tight">{interval}</p>
          </div>
        </div>
      </div>

      {/* Schedule */}
      <p className="text-[13px] font-bold mb-2">Schedule:</p>
      <div className="flex flex-col gap-2 mb-6">
        {data.scheduleTimes.length > 0 ? data.scheduleTimes.map((t, i) => {
          const isTaken = i === (data.takenIndex ?? -1);
          return (
            <div key={`${t}-${i}`} className="pd-schedule-row">
              <span className="text-[15px] font-semibold">{t}</span>
              {isTaken ? (
                <span className="flex items-center gap-1 bg-[#4A7C59] text-white text-[13px] font-bold px-3 py-1 rounded-full">
                  <Check className="w-3 h-3" /> TAKEN
                </span>
              ) : canEdit ? (
                <button
                  onClick={() => setEditingSlot(i)}
                  className="text-[13px] font-bold px-4 py-1 rounded-full"
                  style={{ background: "#E9C46A", color: "#2F3E34" }}>
                  EDIT
                </button>
              ) : null}
            </div>
          );
        }) : (
          <div className="pd-schedule-row opacity-60 text-[13px]">No schedule set</div>
        )}
      </div>

      {/* Tracker */}
      <p className="text-[13px] font-bold mb-2">Tracker:</p>
      <div className="flex gap-3">
        <div className="pd-tracker-tile">
          <Pill className="w-5 h-5" />
          <p className="text-[18px] font-bold">{data.taken} / {data.total}</p>
          <p className="text-[13px] opacity-60">Taken</p>
        </div>
        <div className={`pd-tracker-tile ${data.missed === 0 ? "opacity-40" : ""}`}>
          <Pill className="w-5 h-5 opacity-40" />
          <p className={`text-[18px] font-bold ${data.missed > 0 ? "text-[#D97B7B]" : ""}`}>{data.missed}</p>
          <p className="text-[13px]">Missed</p>
        </div>
      </div>

      {/* Time edit popup */}
      {editingSlot !== null && (
        <MedicationTimeEditModal
          medicationName={data.name}
          initialTime={(() => {
            const t = data.scheduleTimes[editingSlot];
            if (t.includes(":") && !t.includes(" ")) return t;
            const [time, ampm] = t.split(" ");
            const [hh, mm] = time.split(":").map(Number);
            const h24 = ampm === "PM" && hh !== 12 ? hh + 12 : ampm === "AM" && hh === 12 ? 0 : hh;
            return `${String(h24).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
          })()}
          onCancel={() => setEditingSlot(null)}
          onSave={() => {
            setEditingSlot(null);
          }}
        />
      )}
    </div>
  );
}
