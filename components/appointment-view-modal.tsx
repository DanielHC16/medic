"use client";

import Image from "next/image";
import { useState } from "react";
import { Stethoscope, MapPin, X } from "lucide-react";
import { AppointmentEditModal } from "@/components/appointment-edit-modal";

function statusPillClass(status: string) {
  switch (status.toLowerCase()) {
    case "scheduled": return "pd-status-scheduled";
    case "completed":  return "pd-status-completed";
    case "cancelled":  return "pd-status-cancelled";
    case "pending":    return "pd-status-pending";
    default:           return "pd-status-default";
  }
}

export interface AppointmentModalData {
  status: string;
  date: string;
  time: string;
  title: string;
  imageDataUrl?: string | null;
  provider?: string;
  location?: string;
  notes?: string;
}

interface Props {
  data: AppointmentModalData;
  canEdit?: boolean;
  onClose: () => void;
  onMarkDone?: () => void;
}

export function AppointmentViewModal({ data, canEdit = false, onClose, onMarkDone }: Props) {
  const [editOpen, setEditOpen] = useState(false);

  if (editOpen) {
    return (
      <AppointmentEditModal
        initialTitle={data.title}
        initialProvider={data.provider}
        initialNotes={data.notes}
        onBack={() => setEditOpen(false)}
        onSave={() => setEditOpen(false)}
      />
    );
  }

  return (
    <div className="pd-modal-sheet">
      {/* Close top-right */}
      <div className="flex justify-end mb-4">
        <button onClick={onClose}
          className="w-9 h-9 rounded-full border-2 border-[#2F3E34] flex items-center justify-center hover:bg-[#E5E7EB] transition"
          aria-label="Close">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Status pill */}
      <span className={`text-[13px] font-bold px-3 py-1 rounded-full mb-3 inline-block ${statusPillClass(data.status)}`}>
        {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
      </span>

      <p className="text-[15px] font-semibold opacity-70 mb-1">{data.date} {data.time}</p>
      <h2 className="pd-modal-title-lg mb-3">{data.title}</h2>

      <div className="flex flex-col gap-2 mb-6">
        {data.provider && (
          <div className="flex items-center gap-2 text-[13px]">
            <Stethoscope className="w-4 h-4 opacity-60" />
            <span className="opacity-70">|</span>
            <span>{data.provider}</span>
          </div>
        )}
        {data.location && (
          <div className="flex items-center gap-2 text-[13px]">
            <MapPin className="w-4 h-4 opacity-60" />
            <span className="opacity-70">|</span>
            <span>{data.location}</span>
          </div>
        )}
      </div>

      {data.imageDataUrl ? (
        <div className="mb-6 overflow-hidden rounded-2xl border border-[#2F3E34]/10 bg-white">
          <Image
            src={data.imageDataUrl}
            alt={`${data.title} attachment`}
            width={720}
            height={400}
            className="h-full w-full object-cover"
            unoptimized
          />
        </div>
      ) : null}

      <div className="flex justify-between items-center mb-2">
        <p className="text-[13px] font-bold">Notes:</p>
      </div>
      <div className="pd-notes-box mb-6">{data.notes || "Notes noted here"}</div>

      {/* Bottom buttons */}
      {(canEdit || onMarkDone) && (
        <div className="flex gap-3">
          {canEdit ? (
            <button
              onClick={() => setEditOpen(true)}
              className="flex-1 py-3.5 rounded-full text-[13px] font-bold uppercase tracking-widest"
              style={{ background: "#E9C46A", color: "#2F3E34" }}>
              EDIT
            </button>
          ) : null}
          {onMarkDone ? (
            <button
              onClick={onMarkDone}
              className="flex-1 py-3.5 rounded-full text-[13px] font-bold uppercase tracking-widest text-white"
              style={{ background: "#2F3E34" }}>
              MARK AS DONE
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
